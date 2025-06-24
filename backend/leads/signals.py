# backend/leads/signals.py

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Lead, Action, User, Appointment
from .services import webhook_service
import logging

logger = logging.getLogger(__name__)

_current_user = None

def get_current_user():
    return _current_user

def set_current_user(user):
    global _current_user
    _current_user = user

@receiver(post_save, sender=Lead)
def log_lead_changes(sender, instance, created, **kwargs):
    user = get_current_user()

    if created:
        Action.objects.create(
            lead=instance,
            user=user,
            tipo_accion='Lead Creado',
            detalle_accion=f'Lead "{instance.nombre}" (ID: {instance.id}) creado.'
        )
    else:
        Action.objects.create(
            lead=instance,
            user=user,
            tipo_accion='Lead Actualizado',
            detalle_accion=f'Lead "{instance.nombre}" (ID: {instance.id}) actualizado. Tipificación actual: {instance.tipificacion}.'
        )

@receiver(post_delete, sender=Lead)
def log_lead_deletion(sender, instance, **kwargs):
    user = get_current_user()
    # Capturar detalles del lead antes de que la instancia sea invalidada completamente.
    # El campo 'lead' de Action puede ser NULL ahora.
    Action.objects.create(
        lead=None, # Establecer a None porque el Lead ha sido eliminado
        user=user,
        tipo_accion='Lead Eliminado',
        detalle_accion=f'Lead "{instance.nombre}" (ID: {instance.id}) eliminado.'
    )

@receiver(post_save, sender=Appointment)
def log_appointment_changes(sender, instance, created, **kwargs):
    user = get_current_user()
    if created:
        Action.objects.create(
            lead=instance.lead,
            appointment=instance,
            user=user,
            tipo_accion='Cita Agendada',
            detalle_accion=f'Nueva cita agendada (ID: {instance.id}) con {instance.lead.nombre} para el {instance.fecha_hora.strftime("%d/%m/%Y %H:%M")} en {instance.lugar}. Estado: {instance.estado}.'
        )
    else:
        Action.objects.create(
            lead=instance.lead,
            appointment=instance,
            user=user,
            tipo_accion='Cita Actualizada',
            detalle_accion=f'Cita (ID: {instance.id}) con {instance.lead.nombre} actualizada. Nuevo estado: {instance.estado}.'
        )

@receiver(post_delete, sender=Appointment)
def log_appointment_deletion(sender, instance, **kwargs):
    user = get_current_user()
    
    lead_obj = instance.lead if hasattr(instance, 'lead') else None
    lead_name = lead_obj.nombre if lead_obj else 'Lead desconocido'
    
    appointment_id = instance.id
    appointment_fecha_hora = instance.fecha_hora.strftime("%d/%m/%Y %H:%M")
    
    Action.objects.create(
        lead=lead_obj,
        appointment=None, # La cita se está eliminando
        user=user,
        tipo_accion='Cita Eliminada',
        detalle_accion=f'Cita (ID: {appointment_id}) con {lead_name} para el {appointment_fecha_hora} eliminada.'
    )

@receiver(post_save, sender=Lead)
def handle_lead_tipification_change(sender, instance, created, **kwargs):
    """
    Maneja cambios en la tipificación del lead que puedan requerir notificación a la app comercial.
    """
    if not created:  # Solo para actualizaciones
        try:
            # Si el lead se marca como "YA ASISTIO", buscar citas relacionadas y enviar webhook
            if instance.tipificacion == 'YA ASISTIO':
                # Buscar la cita más reciente del lead
                latest_appointment = instance.appointments.order_by('-fecha_hora').first()
                if latest_appointment and latest_appointment.estado != 'Realizada':
                    # Marcar la cita como realizada
                    latest_appointment.estado = 'Realizada'
                    latest_appointment.save()
                    
                    # Enviar webhook
                    try:
                        webhook_service.send_presence_notification(latest_appointment)
                    except Exception as e:
                        logger.error(f"Error al enviar webhook para lead {instance.id}: {str(e)}")
        except Exception as e:
            logger.error(f"Error en signal de lead tipificación: {str(e)}")

@receiver(post_save, sender=Appointment)
def handle_appointment_status_change(sender, instance, created, **kwargs):
    """
    Maneja cambios en el estado de las citas para enviar webhooks.
    """
    if not created:  # Solo para actualizaciones
        try:
            # Si la cita se marca como "Realizada", enviar webhook
            if instance.estado == 'Realizada':
                # Verificar si ya se envió el webhook (evitar duplicados)
                # Por simplicidad, siempre se envía. En producción se podría agregar un campo de control
                try:
                    webhook_service.send_presence_notification(instance)
                except Exception as e:
                    logger.error(f"Error al enviar webhook para cita {instance.id}: {str(e)}")
        except Exception as e:
            logger.error(f"Error en signal de appointment: {str(e)}")