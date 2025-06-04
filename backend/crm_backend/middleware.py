# backend/crm_backend/middleware.py

from leads.signals import set_current_user # Importa la función para establecer el usuario actual
from django.utils.deprecation import MiddlewareMixin # Clase base para middlewares

# Middleware para capturar el usuario autenticado y pasarlo a las señales
class CurrentUserMiddleware(MiddlewareMixin):
    def process_request(self, request):
        # Si la peticion tiene un usuario y está autenticado, lo establece como el usuario actual
        if hasattr(request, 'user') and request.user.is_authenticated:
            set_current_user(request.user)
        else:
            # Si no hay usuario o no está autenticado, el usuario actual es None
            set_current_user(None)

    def process_response(self, request, response):
        # Es importante limpiar el usuario actual después de procesar la peticion
        set_current_user(None)
        return response