# backend/crm_backend/urls.py

from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Importar el nuevo OPCPersonnelViewSet
from leads.views import LeadViewSet, UserViewSet, AppointmentViewSet, ActionViewSet, dashboard_metrics, opc_leads_metrics, OPCPersonnelViewSet, LeadDuplicateViewSet

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

router = DefaultRouter()
router.register(r'leads', LeadViewSet)
router.register(r'users', UserViewSet)
router.register(r'appointments', AppointmentViewSet)
router.register(r'actions', ActionViewSet)
# NUEVO: Registrar el ViewSet para personal OPC
router.register(r'opc-personnel', OPCPersonnelViewSet)
router.register(r'lead-duplicates', LeadDuplicateViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/dashboard-metrics/', dashboard_metrics, name='dashboard_metrics'),
    path('api/opc-leads-metrics/', opc_leads_metrics, name='opc_leads_metrics'),
]