from django.db import models

# Create your models here.

class Category(models.Model):
    name = models.CharField(max_length=120, unique=True)

    def __str__(self):
        return self.name


class Product(models.Model):
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='products')
    category = models.ForeignKey('marketplace.Category', on_delete=models.SET_NULL, related_name='products', null=True, blank=True)
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
