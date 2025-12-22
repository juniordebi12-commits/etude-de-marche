from django.urls import path
from . import views

urlpatterns = [
    path("balance/", views.balance_view, name="billing_balance"),
    path("purchase/", views.purchase_view, name="billing_purchase"),
    path("webhook/", views.webhook_view, name="billing_webhook"),  # utile quand tu branches un fournisseur
]
