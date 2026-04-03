# Generated manually to fix migration constraint issue

from django.db import migrations


def set_default_category(apps, schema_editor):
    """Set default category for products that don't have one."""
    Product = apps.get_model('marketplace', 'Product')
    Category = apps.get_model('marketplace', 'Category')
    
    # Get the first category as default
    default_category = Category.objects.first()
    if default_category:
        Product.objects.filter(category__isnull=True).update(category=default_category)


def reverse_set_default_category(apps, schema_editor):
    """Reverse migration - no action needed."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0006_category_image_product_categories'),
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(set_default_category, reverse_set_default_category),
    ]
