from django.urls import path
from .views import register
from . import views

urlpatterns = [
    path("balance/", views.balance_view, name="billing_balance"),
    path("purchase/", views.purchase_view, name="billing_purchase"),
    path("webhook/", views.webhook_view, name="billing_webhook"),
    path("register/", register, name="register"),
]
