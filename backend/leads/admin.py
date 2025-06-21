from django.contrib import admin
from .models import Lead, User, Appointment, Action, LeadDuplicate # Importa todos los modelos y LeadDuplicate

# Registra tus modelos aquí para que sean visibles y gestionables en el panel de administración de Django
admin.site.register(Lead)
admin.site.register(User)
admin.site.register(Appointment)
admin.site.register(Action) # Útil para ver el historial de acciones directamente
admin.site.register(LeadDuplicate)