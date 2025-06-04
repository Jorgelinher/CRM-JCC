from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Importa las vistas de tu aplicación 'leads'
from leads.views import LeadViewSet, UserViewSet, AppointmentViewSet

# Importa las vistas de autenticación JWT de djangorestframework-simplejwt
from rest_framework_simplejwt.views import (
    TokenObtainPairView,  # Para obtener el token de acceso inicial (login)
    TokenRefreshView,     # Para refrescar el token de acceso cuando expire
)

# Crea una instancia del router para generar URLs automáticamente para tus ViewSets
router = DefaultRouter()
router.register(r'leads', LeadViewSet)         # Genera URLs para /api/leads/
router.register(r'users', UserViewSet)         # Genera URLs para /api/users/ (asesores)
router.register(r'appointments', AppointmentViewSet) # Genera URLs para /api/appointments/

# Define las rutas principales de tu proyecto
urlpatterns = [
    path('admin/', admin.site.urls), # Ruta al panel de administración de Django
    path('api/', include(router.urls)), # Incluye todas las URLs generadas por el router bajo el prefijo /api/
    # Rutas para la autenticación JWT
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # Las rutas de carga CSV han sido eliminadas por petición.
]