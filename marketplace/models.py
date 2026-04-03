from django.db import models

# Create your models here.

class Category(models.Model):
    name = models.CharField(max_length=120, unique=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)

    def __str__(self):
        return self.name


class Product(models.Model):
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='products')
    category = models.ForeignKey('marketplace.Category', on_delete=models.SET_NULL, related_name='products', null=True, blank=True)
    categories = models.ManyToManyField('marketplace.Category', related_name='products_multi', blank=True)
    title = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=12, decimal_places=2)
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    photos = models.JSONField(default=list, blank=True)
    location = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    stock = models.PositiveIntegerField(default=1)

    offer_price = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    offer_start = models.DateTimeField(blank=True, null=True)
    offer_end = models.DateTimeField(blank=True, null=True)

    is_approved = models.BooleanField(default=False)
    featured = models.BooleanField(default=False)

    def __str__(self):
        return self.title


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='marketplace_orders')
    seller = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='marketplace_seller_orders')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    delivery_address = models.TextField(blank=True)
    expected_delivery_at = models.DateTimeField(blank=True, null=True)
    tracking_number = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"Order #{self.id} - {self.user.username} to {self.seller.username}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, related_name='marketplace_order_items')
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=12, decimal_places=2)  # Price at time of purchase

    def __str__(self):
        return f"{self.quantity} x {self.product.title if self.product else 'Deleted Product'}"
