from rest_framework import generics, permissions, status, exceptions
from django.db.models import Q
from django.db.models import Count
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from accounts.models import User
from marketplace.models import Category, Product, Order, OrderItem
from marketplace.serializers import CategorySerializer, ProductDetailSerializer, ProductSerializer, SellerSerializer, OrderSerializer, OrderItemSerializer


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

        days_ago = self.request.query_params.get('days_ago')
        if days_ago:
            from django.utils import timezone
            from datetime import timedelta
            try:
                days = int(days_ago)
                since = timezone.now() - timedelta(days=days)
                qs = qs.filter(created_at__gte=since)
            except (ValueError, TypeError):
                pass

        return qs

    def perform_create(self, serializer):
        category_name = self.request.data.get('category')
        categories_ids = self.request.data.get('categories')
        image_url = self.request.data.get('image_url') or self.request.data.get('image')

        # Categories are admin-defined. Users can only select existing ones.
        category = None
        if category_name:
            category = Category.objects.filter(name__iexact=category_name).first()
            if not category and str(category_name).strip():
                raise exceptions.ValidationError({'category': 'Invalid category'})

        product = serializer.save(
            user=self.request.user, 
            category=category,
            is_approved=True,
            featured=self.request.data.get('isBoosted', False)
        )

        if categories_ids is not None:
            if not isinstance(categories_ids, list):
                raise exceptions.ValidationError({'categories': 'categories must be a list of category ids'})
            categories = list(Category.objects.filter(id__in=categories_ids))
            if len(categories) != len(set(map(int, categories_ids))):
                raise exceptions.ValidationError({'categories': 'Invalid categories'})
            product.categories.set(categories)

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
        categories_ids = self.request.data.get('categories')
        image_url = self.request.data.get('image_url') or self.request.data.get('image')
        photos = self.request.data.get('photos')

        offer_price_raw = self.request.data.get('offer_price')
        offer_action = self.request.data.get('offer_action')  # 'start' | 'cancel' | None

        category = None
        if category_name:
            category = Category.objects.filter(name__iexact=category_name).first()
            if not category and str(category_name).strip():
                raise exceptions.ValidationError({'category': 'Invalid category'})

        product = serializer.save(category=category)

        if categories_ids is not None:
            if not isinstance(categories_ids, list):
                raise exceptions.ValidationError({'categories': 'categories must be a list of category ids'})
            categories = list(Category.objects.filter(id__in=categories_ids))
            if len(categories) != len(set(map(int, categories_ids))):
                raise exceptions.ValidationError({'categories': 'Invalid categories'})
            product.categories.set(categories)

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
                raise exceptions.ValidationError({'offer_price': 'offer_price is required'})
            offer_price = Decimal(str(offer_price_raw))
            if offer_price <= 0:
                raise exceptions.ValidationError({'offer_price': 'offer_price must be greater than 0'})
            if offer_price >= product.price:
                raise exceptions.ValidationError({'offer_price': 'offer_price must be less than normal price'})

            if not (8 <= now.hour < 24):
                raise exceptions.ValidationError({'detail': 'Offers can only start between 8:00am and midnight'})

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


class OrderListView(generics.ListCreateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Customers see their own orders, sellers see orders placed to them
        return Order.objects.filter(Q(user=self.request.user) | Q(seller=self.request.user)).distinct().order_by('-created_at')

    def perform_create(self, serializer):
        # This is handled manually in post() below to support multi-order creation
        pass

    def post(self, request, *args, **kwargs):
        from decimal import Decimal
        from django.db import transaction
        from django.utils.dateparse import parse_datetime
        from notifications.models import Notification
        from django.db.models import F
        
        items_data = request.data.get('items', [])
        delivery_address = request.data.get('delivery_address', '')
        expected_delivery_at_raw = request.data.get('expected_delivery_at')
        expected_delivery_at = None
        if expected_delivery_at_raw:
            expected_delivery_at = parse_datetime(str(expected_delivery_at_raw))
        
        if not items_data:
            return Response({'detail': 'No items in order'}, status=status.HTTP_400_BAD_REQUEST)

        # Group items by seller
        seller_groups = {}
        for item in items_data:
            try:
                product_id = item['id']
            except KeyError:
                return Response({'detail': 'Invalid item payload'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                product = Product.objects.get(id=product_id)
            except Product.DoesNotExist:
                return Response({'detail': f"Product {product_id} not found"}, status=status.HTTP_400_BAD_REQUEST)

            qty = int(item.get('quantity', 1))
            if qty <= 0:
                return Response({'detail': 'Quantity must be at least 1'}, status=status.HTTP_400_BAD_REQUEST)

            seller_id = product.user_id
            if seller_id not in seller_groups:
                seller_groups[seller_id] = []

            # Use Decimal for price to avoid float issues
            price = Decimal(str(item.get('price', product.price)))
            if item.get('offer_active') and product.offer_price:
                price = Decimal(str(product.offer_price))

            seller_groups[seller_id].append({
                'product_id': product.id,
                'quantity': qty,
                'price': price
            })

        orders = []
        try:
            with transaction.atomic():
                for seller_id, items in seller_groups.items():
                    # Lock products for this seller and validate stock
                    product_ids = [i['product_id'] for i in items]
                    locked = {p.id: p for p in Product.objects.select_for_update().filter(id__in=product_ids)}
                    for i in items:
                        p = locked.get(i['product_id'])
                        if not p:
                            raise Exception('Product missing during checkout')
                        if p.stock < i['quantity']:
                            return Response({'detail': f"{p.title} is out of stock or insufficient quantity."}, status=status.HTTP_400_BAD_REQUEST)

                    # Decrement stock (atomic)
                    for i in items:
                        Product.objects.filter(id=i['product_id']).update(stock=F('stock') - i['quantity'])

                    total_price = sum(item['price'] * item['quantity'] for item in items)
                    order = Order.objects.create(
                        user=request.user,
                        seller_id=seller_id,
                        total_price=total_price,
                        delivery_address=delivery_address,
                        expected_delivery_at=expected_delivery_at,
                        status='pending'
                    )
                    for item in items:
                        p = locked.get(item['product_id'])
                        OrderItem.objects.create(
                            order=order,
                            product=p,
                            quantity=item['quantity'],
                            price=item['price']
                        )

                        remaining = Product.objects.filter(id=p.id).values_list('stock', flat=True).first() if p else None
                        if remaining == 0:
                            Notification.objects.create(
                                user_id=seller_id,
                                type='out_of_stock',
                                title='Product out of stock',
                                message=f"{p.title} is out of stock",
                                actor=None,
                                product=p,
                                image_url=str(getattr(p, 'image', '') or ''),
                                data={
                                    'product_title': getattr(p, 'title', ''),
                                    'product_price': str(getattr(p, 'price', '') or ''),
                                    'product_image': str(getattr(p, 'image', '') or ''),
                                }
                            )

                    # Create a seller notification (use first product for preview)
                    first_product = locked.get(items[0]['product_id']) if items else None
                    Notification.objects.create(
                        user_id=seller_id,
                        type='order_placed',
                        title='New order received',
                        message=f"{request.user.name} ordered {first_product.title if first_product else 'an item'}",
                        actor=request.user,
                        order=order,
                        product=first_product,
                        image_url=str(getattr(first_product, 'image', '') or ''),
                        data={
                            'buyer_name': getattr(request.user, 'name', ''),
                            'buyer_phone': getattr(request.user, 'phone', ''),
                            'delivery_address': delivery_address,
                            'expected_delivery_at': str(expected_delivery_at_raw or ''),
                            'product_title': getattr(first_product, 'title', ''),
                            'product_price': str(getattr(first_product, 'price', '') or ''),
                            'product_image': str(getattr(first_product, 'image', '') or ''),
                        }
                    )
                    orders.append(order)
            
            serializer = OrderSerializer(orders, many=True)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class OrderDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(Q(user=self.request.user) | Q(seller=self.request.user)).distinct()

    def patch(self, request, *args, **kwargs):
        order = self.get_object()
        # Only seller can update status/tracking
        if order.seller != request.user:
            return Response({'detail': 'Only the seller can update this order.'}, status=status.HTTP_403_FORBIDDEN)
        
        from django.db.models import F
        prev_status = order.status
        status_val = request.data.get('status')
        tracking = request.data.get('tracking_number')
        
        if status_val:
            order.status = status_val
        if tracking:
            order.tracking_number = tracking
            
        order.save()

        # Credit earnings once when transitioning to delivered
        if prev_status != 'delivered' and order.status == 'delivered':
            from decimal import Decimal
            from accounts.models import Profile
            Profile.objects.get_or_create(user=order.seller)
            Profile.objects.filter(user=order.seller).update(earnings=F('earnings') + Decimal(str(order.total_price)))

        return Response(OrderSerializer(order).data)
