# backend/leads/signals.py

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
# Asegúrate de importar TODOS los modelos necesarios para las señales
from .models import Lead, Action, User, Appointment

# Variable global para intentar capturar el usuario actual que realiza la acción.
# Este enfoque es útil para el desarrollo local. En producción, para robustez
# en entornos multi-hilo/multi-petición, se usaría un enfoque como Thread-Locals.
_current_user = None

def get_current_user():
    return _current_user

def set_current_user(user):
    global _current_user
    _current_user = user

# Señal que se activa DESPUÉS de guardar (crear o actualizar) un objeto Lead
@receiver(post_save, sender=Lead)
def log_lead_changes(sender, instance, created, **kwargs):
    user = get_current_user() # Obtiene el usuario que hizo la petición, si está disponible

    if created:
        # Si el lead es nuevo, registra una acción de creación
        Action.objects.create(
            lead=instance,
            user=user, # Será None si la acción la hizo el sistema o un usuario no logueado
            tipo_accion='Lead Creado',
            detalle_accion=f'Lead "{instance.nombre}" (ID: {instance.id}) creado.'
        )
    else:
        # Si el lead fue actualizado, registra una acción de actualización general.
        # Para una auditoría más granular (qué campos cambiaron), se necesitaría
        # obtener el estado previo del objeto (ej. usando un paquete como django-model-utils' FieldTracker).
        Action.objects.create(
            lead=instance,
            user=user,
            tipo_accion='Lead Actualizado',
            detalle_accion=f'Lead "{instance.nombre}" (ID: {instance.id}) actualizado. Tipificación actual: {instance.tipificacion}.'
        )

# Señal que se activa DESPUÉS de eliminar un objeto Lead
@receiver(post_delete, sender=Lead)
def log_lead_deletion(sender, instance, **kwargs):
    user = get_current_user()
    # Nota: Si la relación ForeignKey de Action a Lead usa models.CASCADE,
    # las acciones relacionadas se eliminarán automáticamente. Esta señal
    # intentará crear una acción de eliminación antes de que el Lead y sus
    # acciones relacionadas sean completamente borradas de la base de datos.
    # Para un registro permanente de eliminaciones, se podría considerar una
    # tabla de auditoría separada o un soft-delete en el modelo Lead.
    Action.objects.create(
        lead=instance,
        user=user,
        tipo_accion='Lead Eliminado',
        detalle_accion=f'Lead "{instance.nombre}" (ID: {instance.id}) eliminado.'
    )

# Señal que se activa DESPUÉS de guardar (crear o actualizar) un objeto Appointment
@receiver(post_save, sender=Appointment)
def log_appointment_changes(sender, instance, created, **kwargs):
    user = get_current_user()
    if created:
        Action.objects.create(
            lead=instance.lead,
            user=user,
            tipo_accion='Cita Agendada',
            detalle_accion=f'Nueva cita agendada (ID: {instance.id}) con {instance.lead.nombre} para el {instance.fecha_hora.strftime("%d/%m/%Y %H:%M")} en {instance.lugar}. Estado: {instance.estado}.'
        )
    else:
        # Aquí se podría añadir lógica para detectar cambios específicos en la cita
        # Por ejemplo, si el estado cambia de 'Pendiente' a 'Confirmada'
        Action.objects.create(
            lead=instance.lead,
            user=user,
            tipo_accion='Cita Actualizada',
            detalle_accion=f'Cita (ID: {instance.id}) con {instance.lead.nombre} actualizada. Nuevo estado: {instance.estado}.'
        )

# Señal que se activa DESPUÉS de eliminar un objeto Appointment
@receiver(post_delete, sender=Appointment)
def log_appointment_deletion(sender, instance, **kwargs):
    user = get_current_user()
    Action.objects.create(
        lead=instance.lead,
        user=user,
        tipo_accion='Cita Eliminada',
        detalle_accion=f'Cita (ID: {instance.id}) con {instance.lead.nombre} para el {instance.fecha_hora.strftime("%d/%m/%Y %H:%M")} eliminada.'
    )