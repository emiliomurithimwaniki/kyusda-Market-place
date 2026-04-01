from rest_framework import generics, permissions, status
from django.db.models import Q
from django.db.models import Count
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from accounts.models import User
from marketplace.models import Category, Product
from marketplace.serializers import CategorySerializer, ProductDetailSerializer, ProductSerializer, SellerSerializer


class ProductPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class CategoryListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = CategorySerializer
    queryset = Category.objects.all().order_by('name')


class ProductListView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    serializer_class = ProductSerializer
    pagination_class = ProductPagination

    def get_queryset(self):
        qs = Product.objects.select_related('user', 'category').filter(is_approved=True).order_by('-created_at', '-id')
        
        # If user is authenticated, they can see their own unapproved products in some contexts
        # But for the general list, we stick to approved ones unless specified.
        # For now, let's allow users to see their own products even if not approved yet
        if self.request.user.is_authenticated:
            user_qs = Product.objects.select_related('user', 'category').filter(user=self.request.user)
            qs = (qs | user_qs).distinct().order_by('-created_at', '-id')

        featured = self.request.query_params.get('featured')
        if featured is not None:
            if str(featured).lower() in ['1', 'true', 'yes']:
                qs = qs.filter(featured=True)
            elif str(featured).lower() in ['0', 'false', 'no']:
                qs = qs.filter(featured=False)

        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category__name__iexact=category)

        seller_id = self.request.query_params.get('sellerId')
        if seller_id:
            qs = qs.filter(user_id=seller_id)

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search))

        flash_sale = self.request.query_params.get('flash_sale')
        if flash_sale is not None and str(flash_sale).lower() in ['1', 'true', 'yes']:
            from django.utils import timezone

            now = timezone.now()
            qs = qs.filter(offer_price__isnull=False, offer_start__lte=now, offer_end__gte=now)

        return qs

    def perform_create(self, serializer):
        category_name = self.request.data.get('category')
        image_url = self.request.data.get('image_url') or self.request.data.get('image')
        category = None
        if category_name:
            # Look for existing category by name, case-insensitive
            category = Category.objects.filter(name__iexact=category_name).first()
            if not category and category_name.strip():
                # Only create if it's not empty
                category = Category.objects.create(name=category_name)
        
        product = serializer.save(
            user=self.request.user, 
            category=category,
            is_approved=True,
            featured=self.request.data.get('isBoosted', False)
        )

        # If an image URL was provided (e.g. from Cloudinary), save it directly to the field
        # and bypass the file validation since it's already hosted.
        if image_url and (image_url.startswith('http://') or image_url.startswith('https://')):
            product.image = image_url
            product.save()


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and obj.user_id == request.user.id


class ProductDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    serializer_class = ProductDetailSerializer
    queryset = Product.objects.select_related('user', 'category').all()


class ProductDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    serializer_class = ProductDetailSerializer

    def get_queryset(self):
        qs = Product.objects.select_related('user', 'category').all()
        # Public can only see approved products. Owners can see their own.
        if self.request.user.is_authenticated:
            return qs.filter(Q(is_approved=True) | Q(user=self.request.user)).distinct()
        return qs.filter(is_approved=True)


class ProductUpdateView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    serializer_class = ProductDetailSerializer
    queryset = Product.objects.select_related('user', 'category').all()

    def perform_update(self, serializer):
        from datetime import timedelta
        from decimal import Decimal
        from django.utils import timezone

        category_name = self.request.data.get('category')
        image_url = self.request.data.get('image_url') or self.request.data.get('image')
        photos = self.request.data.get('photos')

        offer_price_raw = self.request.data.get('offer_price')
        offer_action = self.request.data.get('offer_action')  # 'start' | 'cancel' | None

        category = None
        if category_name:
            category = Category.objects.filter(name__iexact=category_name).first()
            if not category and str(category_name).strip():
                category = Category.objects.create(name=category_name)

        product = serializer.save(category=category)

        # Offer rules:
        # - Can start offers between 8:00 and 24:00 (local time)
        # - Each offer session is 2 hours
        now = timezone.localtime(timezone.now())

        if offer_action == 'cancel':
            product.offer_price = None
            product.offer_start = None
            product.offer_end = None
        elif offer_action == 'start':
            if offer_price_raw is None or str(offer_price_raw).strip() == '':
                raise ValueError('offer_price is required')
            offer_price = Decimal(str(offer_price_raw))
            if offer_price <= 0:
                raise ValueError('offer_price must be greater than 0')
            if offer_price >= product.price:
                raise ValueError('offer_price must be less than normal price')

            if not (8 <= now.hour < 24):
                raise ValueError('Offers can only start between 8:00am and midnight')

            session_start_hour = (now.hour // 2) * 2
            if session_start_hour < 8:
                session_start_hour = 8

            start = now.replace(hour=session_start_hour, minute=0, second=0, microsecond=0)
            end = start + timedelta(hours=2)

            # Midnight cutoff
            midnight = now.replace(hour=23, minute=59, second=59, microsecond=0)
            if end > midnight:
                end = midnight

            product.offer_price = offer_price
            product.offer_start = timezone.make_aware(start.replace(tzinfo=None), timezone.get_current_timezone()) if timezone.is_naive(start) else start
            product.offer_end = timezone.make_aware(end.replace(tzinfo=None), timezone.get_current_timezone()) if timezone.is_naive(end) else end

        if image_url and (str(image_url).startswith('http://') or str(image_url).startswith('https://')):
            product.image = image_url

        if isinstance(photos, list):
            product.photos = photos

        product.save()

class SellerDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = SellerSerializer
    queryset = User.objects.annotate(follower_count=Count('followers')).all()


class FollowSellerView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        from accounts.models import Follow

        if int(pk) == int(request.user.id):
            return Response({'detail': 'You cannot follow yourself.'}, status=status.HTTP_400_BAD_REQUEST)

        Follow.objects.get_or_create(follower=request.user, seller_id=pk)
        return Response({'detail': 'Followed'}, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        from accounts.models import Follow

        Follow.objects.filter(follower=request.user, seller_id=pk).delete()
        return Response({'detail': 'Unfollowed'}, status=status.HTTP_200_OK)
