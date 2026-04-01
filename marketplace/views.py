from django.db.models import Q
from rest_framework import generics, permissions
from rest_framework.pagination import PageNumberPagination

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


class ProductListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ProductSerializer
    pagination_class = ProductPagination

    def get_queryset(self):
        qs = Product.objects.select_related('user', 'category').filter(is_approved=True).order_by('-created_at', '-id')

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

        return qs


class ProductDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ProductDetailSerializer
    queryset = Product.objects.select_related('user', 'category').all()


class SellerDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = SellerSerializer
    queryset = User.objects.all()
