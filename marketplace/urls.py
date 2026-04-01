from django.urls import path

from marketplace import views

urlpatterns = [
    path("categories/", views.CategoryListView.as_view(), name="category_list"),
    path("products/", views.ProductListView.as_view(), name="product_list"),
    path("products/<int:pk>/", views.ProductDetailView.as_view(), name="product_detail"),
    path("products/<int:pk>/edit/", views.ProductUpdateView.as_view(), name="product_edit"),
    path("products/<int:pk>/delete/", views.ProductDeleteView.as_view(), name="product_delete"),
    path("sellers/<int:pk>/", views.SellerDetailView.as_view(), name="seller_detail"),
    path("sellers/<int:pk>/follow/", views.FollowSellerView.as_view(), name="seller_follow"),
]
