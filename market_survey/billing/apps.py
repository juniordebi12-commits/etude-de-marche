from django.apps import AppConfig

class BillingConfig(AppConfig):
    name = "billing"

    def ready(self):
        # import signals so they are registered
        try:
            import billing.signals  # noqa: F401
        except Exception:
            pass
