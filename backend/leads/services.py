import requests
import json
import logging
from django.conf import settings
from django.utils import timezone
from datetime import datetime

logger = logging.getLogger(__name__)

class ComercialAppWebhookService:
    """
    Servicio para enviar notificaciones de presencias realizadas a la app comercial.
    """
    
    def __init__(self):
        self.webhook_url = getattr(settings, 'COMERCIAL_WEBHOOK_URL', None)
        self.webhook_token = getattr(settings, 'COMERCIAL_WEBHOOK_TOKEN', None)
        
        if not self.webhook_url or not self.webhook_token:
            logger.warning("Webhook URL o Token no configurados. La integración con la app comercial está deshabilitada.")
    
    def send_presence_notification(self, appointment):
        """
        Envía notificación de presencia realizada a la app comercial.
        """
        if not self.webhook_url or not self.webhook_token:
            logger.warning("Webhook URL o Token no configurados. No se enviará notificación.")
            return False
        
        try:
            lead = appointment.lead
            
            # CAMBIO 1: DNI temporal (requerido por la app comercial)
            # CAMBIO 2: Teléfono principal del CRM
            # CAMBIO 3: Dirección con distrito del CRM
            cliente_data = {
                'nombres_completos_razon_social': lead.nombre,
                'tipo_documento': 'DNI',  # Por defecto
                'numero_documento': f"TEMP-{lead.celular[-4:]}",  # CAMBIO: DNI temporal para edición manual
                'telefono_principal': lead.celular,  # CAMBIO: Teléfono del CRM
                'email_principal': getattr(lead, 'email', None),
                'direccion': lead.distrito or '',  # CAMBIO: Usar distrito como dirección
                'distrito': lead.distrito or '',  # CAMBIO: Distrito vinculado
            }
            
            # CAMBIO 4: Asesor captador OPC automático
            asesor_captador_opc = ''
            if lead.personal_opc_captador:
                asesor_captador_opc = lead.personal_opc_captador.nombre
            
            # Mapeo de medio de captación mejorado
            medio_captacion_map = {
                'OPC': 'campo_opc',
                'Campo (Centros Comerciales)': 'campo_opc',
                'Redes Sociales (Facebook)': 'redes_facebook',
                'Redes Sociales (Instagram)': 'redes_instagram',
                'Redes Sociales (WhatsApp)': 'redes_facebook',  # Mapear a Facebook por similitud
                'Referidos': 'referido',
                'Web': 'web',
            }
            medio_captacion = medio_captacion_map.get(lead.medio, 'otro')
            
            # Determinar modalidad basada en el lugar de la cita
            modalidad = 'presencial'
            if appointment.lugar and ('ZOOM' in appointment.lugar.upper() or 'virtual' in appointment.lugar.lower()):
                modalidad = 'virtual'
            
            # Datos de la presencia
            presencia_data = {
                'id_presencia_crm': f"CRM-{appointment.id}",
                'cliente': cliente_data,
                'fecha_hora_presencia': appointment.fecha_hora.isoformat() if appointment.fecha_hora else timezone.now().isoformat(),
                'proyecto_interes': getattr(lead, 'proyecto_interes', 'OASIS 2 (AUCALLAMA)'),
                'lote_interes_inicial': getattr(lead, 'calle_o_modulo', ''),
                'asesor_captacion_opc': asesor_captador_opc,  # CAMBIO: Asesor captador OPC
                'medio_captacion': medio_captacion,  # CAMBIO: Mapeo mejorado
                'modalidad': modalidad,  # CAMBIO: Determinación automática
                'status_presencia': 'realizada',
                'resultado_interaccion': 'interesado_seguimiento',  # Por defecto
                'observaciones': f"Lead del CRM: {lead.nombre} - {getattr(lead, 'observacion', '')} - {getattr(lead, 'observacion_opc', '')} - Tipificación: {lead.tipificacion} - Proyecto: {getattr(lead, 'proyecto_interes', '')} - Es Lead OPC: {getattr(lead, 'es_lead_opc', False)} - Es Directeo: {getattr(lead, 'es_directeo', False)} - Fecha Captación: {getattr(lead, 'fecha_captacion', '')} - Supervisor OPC: {getattr(lead, 'supervisor_opc_captador', '')} - NOTA: DNI temporal, editar manualmente",
            }
            
            headers = {
                'Content-Type': 'application/json',
                'X-CRM-Webhook-Token': self.webhook_token
            }
            
            logger.info(f"Enviando webhook a {self.webhook_url} con datos: {presencia_data}")
            
            response = requests.post(
                self.webhook_url,
                json=presencia_data,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                logger.info(f"Webhook enviado exitosamente. Respuesta: {response.json()}")
                return True
            else:
                logger.error(f"Error en webhook. Status: {response.status_code}, Respuesta: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Error de conexión al enviar webhook: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Error inesperado al enviar webhook: {str(e)}")
            return False
    
    def send_venta_notification(self, appointment, venta_data):
        """
        Envía una notificación de venta realizada a la app comercial.
        
        Args:
            appointment: Instancia del modelo Appointment
            venta_data: Diccionario con datos de la venta
        """
        if not self.webhook_url or not self.webhook_token:
            logger.warning("No se puede enviar webhook: URL o Token no configurados")
            return False
            
        try:
            # Obtener datos base de la presencia
            presence_payload = self._prepare_presence_payload(appointment)
            
            # Agregar datos de venta
            presence_payload['venta'] = venta_data
            
            # Enviar webhook
            headers = {
                'Content-Type': 'application/json',
                'X-CRM-Webhook-Token': self.webhook_token,
            }
            
            response = requests.post(
                self.webhook_url,
                json=presence_payload,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                logger.info(f"Webhook de venta enviado exitosamente para cita {appointment.id}")
                return True
            else:
                logger.error(f"Error al enviar webhook de venta. Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Error inesperado al enviar webhook de venta: {str(e)}")
            return False
    
    def _prepare_presence_payload(self, appointment):
        """
        Prepara el payload base para una notificación de presencia.
        """
        lead = appointment.lead
        
        # CAMBIO: Aplicar la misma lógica de mapeo que en send_presence_notification
        cliente_data = {
            'nombres_completos_razon_social': lead.nombre,
            'tipo_documento': 'DNI',
            'numero_documento': f"TEMP-{lead.celular[-4:]}",  # CAMBIO: DNI temporal
            'telefono_principal': lead.celular,  # CAMBIO: Teléfono del CRM
            'email_principal': getattr(lead, 'email', None),
            'direccion': lead.distrito or '',  # CAMBIO: Usar distrito
            'distrito': lead.distrito or '',  # CAMBIO: Distrito vinculado
            'ubicacion': lead.ubicacion or '',
            'observacion': lead.observacion or '',
            'observacion_opc': lead.observacion_opc or '',
            'tipificacion': lead.tipificacion or '',
            'proyecto_interes': lead.proyecto_interes or '',
            'calle_o_modulo': lead.calle_o_modulo or '',
            'personal_opc_captador': lead.personal_opc_captador.nombre if lead.personal_opc_captador else '',
            'supervisor_opc_captador': lead.supervisor_opc_captador.nombre if lead.supervisor_opc_captador else '',
            'fecha_captacion': str(lead.fecha_captacion) if lead.fecha_captacion else '',
            'es_lead_opc': lead.es_lead_opc,
            'es_directeo': lead.es_directeo,
        }
        
        # CAMBIO: Mapeo mejorado de medio de captación
        medio_captacion_map = {
            'OPC': 'campo_opc',
            'Campo (Centros Comerciales)': 'campo_opc',
            'Redes Sociales (Facebook)': 'redes_facebook',
            'Redes Sociales (Instagram)': 'redes_instagram',
            'Redes Sociales (WhatsApp)': 'redes_facebook',
            'Referidos': 'referido',
            'Web': 'web',
        }
        medio_captacion = medio_captacion_map.get(lead.medio, 'otro')
        
        # CAMBIO: Determinación automática de modalidad
        modalidad = 'presencial'
        if appointment.lugar and ('ZOOM' in appointment.lugar.upper() or 'virtual' in appointment.lugar.lower()):
            modalidad = 'virtual'
        
        return {
            'id_presencia_crm': f"CRM-{appointment.id}",
            'cliente': cliente_data,
            'fecha_hora_presencia': appointment.fecha_hora.isoformat(),
            'proyecto_interes': lead.proyecto_interes or 'OASIS 2 (AUCALLAMA)',
            'medio_captacion': medio_captacion,
            'modalidad': modalidad,
            'status_presencia': 'realizada',
            'observaciones': f"Presencia desde CRM. Lugar: {appointment.lugar}. Observaciones: {appointment.observaciones or ''} - NOTA: DNI temporal, editar manualmente",
        }

# Instancia global del servicio
webhook_service = ComercialAppWebhookService() 