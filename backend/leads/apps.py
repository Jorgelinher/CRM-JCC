from django.apps import AppConfig

class LeadsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'leads'

    def ready(self):
        # Importa tus señales aquí para que Django las descubra y las conecte
        # Esto asegura que las funciones de log_lead_changes y log_lead_deletion se activen.
        import leads.signals