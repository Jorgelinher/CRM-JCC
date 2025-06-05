# backend/crm_backend/urls.py

from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Importa las vistas de tu aplicación 'leads' y la nueva vista de métricas
from leads.views import LeadViewSet, UserViewSet, AppointmentViewSet, ActionViewSet, dashboard_metrics # NUEVO: Importar dashboard_metrics

# Importa las vistas de autenticación JWT de djangorestframework-simplejwt
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

# Crea una instancia del router para generar URLs automáticamente para tus ViewSets
router = DefaultRouter()
router.register(r'leads', LeadViewSet)
router.register(r'users', UserViewSet)
router.register(r'appointments', AppointmentViewSet)
router.register(r'actions', ActionViewSet)

# Define las rutas principales de tu proyecto
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)), # Incluye todas las URLs generadas por el router bajo el prefijo /api/
    # Rutas para la autenticación JWT
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # NUEVO: Ruta para el endpoint de métricas
    path('api/dashboard-metrics/', dashboard_metrics, name='dashboard_metrics'),
]