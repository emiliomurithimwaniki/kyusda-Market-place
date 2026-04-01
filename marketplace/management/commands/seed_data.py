from decimal import Decimal
import random
import string

from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import User
from marketplace.models import Category, Product


class Command(BaseCommand):
    help = "Seed database with users and products"

    def add_arguments(self, parser):
        parser.add_argument("--users", type=int, default=200)
        parser.add_argument("--seller-users", type=int, default=50)
        parser.add_argument("--min-products", type=int, default=5)
        parser.add_argument("--featured", type=int, default=30)
        parser.add_argument("--password", type=str, default="password123")
        parser.add_argument("--approved", action="store_true", default=False)
        parser.add_argument("--clear", action="store_true", default=False)

    def _rand_digits(self, n):
        return "".join(random.choice(string.digits) for _ in range(n))

    def _rand_price(self):
        return Decimal(str(random.randint(100, 250000) / 100))

    def _ensure_categories(self):
        defaults = [
            "Vegetables",
            "Fruits",
            "Dairy",
            "Grains",
            "Livestock",
            "Equipment",
            "Seeds",
            "Fertilizer",
        ]
        for name in defaults:
            Category.objects.get_or_create(name=name)

    @transaction.atomic
    def handle(self, *args, **options):
        users_total = options["users"]
        seller_users = options["seller_users"]
        min_products = options["min_products"]
        featured_count = options["featured"]
        password = options["password"]
        approved = options["approved"]
        clear = options["clear"]

        if seller_users > users_total:
            raise ValueError("--seller-users cannot be greater than --users")

        if clear:
            Product.objects.all().delete()
            Category.objects.all().delete()
            User.objects.all().delete()

        self._ensure_categories()
        categories = list(Category.objects.all())
        if not categories:
            raise RuntimeError("No categories available to assign products")

        created_users = []
        base_index = User.objects.count()

        for i in range(users_total):
            idx = base_index + i + 1
            email = f"seed{idx}@example.com"
            phone = f"+1{self._rand_digits(10)}"
            name = f"Seed User {idx}"

            role = User.Role.SELLER if i < seller_users else User.Role.BUYER
            user = User.objects.create_user(
                email=email,
                phone=phone,
                password=password,
                name=name,
                role=role,
                is_active=True,
            )
            created_users.append(user)

        products_created = []
        seller_list = created_users[:seller_users]

        for user in seller_list:
            for p in range(min_products):
                product = Product.objects.create(
                    user=user,
                    category=random.choice(categories),
                    title=f"{user.name} Product {p + 1}",
                    description="Seeded product",
                    price=self._rand_price(),
                    location="",
                    is_approved=approved,
                    featured=False,
                )
                products_created.append(product)

        if products_created:
            to_feature = min(featured_count, len(products_created))
            featured_products = random.sample(products_created, to_feature)
            Product.objects.filter(id__in=[p.id for p in featured_products]).update(featured=True)

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded {len(created_users)} users, {len(products_created)} products, {min(featured_count, len(products_created))} featured products."
            )
        )
