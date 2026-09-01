from django.urls import path
from .views import register
from . import views
from .views import register, history_view, consume_credits_view


urlpatterns = [
    path("balance/", views.balance_view, name="billing_balance"),
    path("history/", history_view, name="billing_history"),
    path("consume/", consume_credits_view, name="billing_consume_credits"),
    path("purchase/", views.purchase_view, name="billing_purchase"),
    path("webhook/", views.webhook_view, name="billing_webhook"),
    path("register/", register, name="register"),
]
