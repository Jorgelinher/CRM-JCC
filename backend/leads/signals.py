# backend/leads/signals.py

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Lead, Action, User, Appointment

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
    Action.objects.create(
        lead=instance,
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
    
    # Capturar los detalles del lead y la cita ANTES de que puedan volverse inaccesibles
    # Si instance.lead es None (lo cual es raro en post_delete para un FK no null, pero posible con SET_NULL en cadena)
    lead_obj = instance.lead if hasattr(instance, 'lead') else None
    lead_name = lead_obj.nombre if lead_obj else 'Lead desconocido'
    lead_id_val = lead_obj.id if lead_obj else None

    # Capturar detalles de la cita que está siendo eliminada
    appointment_id = instance.id
    appointment_fecha_hora = instance.fecha_hora.strftime("%d/%m/%Y %H:%M")
    
    Action.objects.create(
        lead=lead_obj, # Pasa el objeto Lead si está disponible, o None
        appointment=None, # La cita se está eliminando, así que el FK en Action será NULL
        user=user,
        tipo_accion='Cita Eliminada',
        detalle_accion=f'Cita (ID: {appointment_id}) con {lead_name} para el {appointment_fecha_hora} eliminada.'
    )