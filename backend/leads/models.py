# backend/leads/models.py

from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to. A user will get all permissions '
                  'granted to each of their groups.',
        related_name="leads_user_set",
        related_query_name="leads_user",
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name="leads_user_permissions_set",
        related_query_name="leads_user_permission",
    )

    def __str__(self):
        return self.username

class Lead(models.Model):
    asesor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_leads')

    proyecto = models.CharField(max_length=255)
    nombre = models.CharField(max_length=255)
    celular = models.CharField(max_length=20, unique=True)
    medio = models.CharField(max_length=100, blank=True, null=True)
    distrito = models.CharField(max_length=100, blank=True, null=True)

    TIPIFICACION_CHOICES = [
        ('NO CONTESTA', 'NO CONTESTA'),
        ('DATO FALSO', 'DATO FALSO'),
        ('NO INTERESADO - POR PROYECTO', 'NO INTERESADO - POR PROYECTO'),
        ('FUERA DE SERVICIO', 'FUERA DE SERVICIO'),
        ('NO REGISTRADO', 'NO REGISTRADO'),
        ('VOLVER A LLAMAR', 'VOLVER A LLAMAR'),
        ('APAGADO', 'APAGADO'),
        ('SEGUIMIENTO', 'SEGUIMIENTO'),
        ('NO INTERESADO - MEDIOS ECONOMICOS', 'NO INTERESADO - MEDIOS ECONOMICOS'),
        ('CITA - ZOOM', 'CITA - ZOOM'),
        ('NO INTERESADO - UBICACION', 'NO INTERESADO - UBICACION'),
        ('NO INTERESADO - YA COMPRO EN OTRO LUGAR', 'NO INTERESADO - YA COMPRO EN OTRO LUGAR'),
        ('INFORMACION WSP/CORREO', 'INFORMACION WSP/CORREO'),
        ('TERCERO', 'TERCERO'),
        ('NO INTERESADO - LEGALES', 'NO INTERESADO - LEGALES'),
        ('CITA - SALA', 'CITA - SALA'),
        ('CITA - PROYECTO', 'CITA - PROYECTO'),
        ('CITA - POR CONFIRMAR', 'CITA - POR CONFIRMAR'),
        ('CITA - HxH', 'CITA - HxH'),
        ('YA ASISTIO', 'YA ASISTIO'),
        ('DUPLICADO', 'DUPLICADO'),
        ('YA ES PROPIETARIO', 'YA ES PROPIETARIO'),
        ('AGENTE INMOBILIARIO', 'AGENTE INMOBILIARIO'),
        ('GESTON WSP', 'GESTON WSP'),
        ('NO CALIFICA', 'NO CALIFICA'),
    ]
    tipificacion = models.CharField(max_length=100, choices=TIPIFICACION_CHOICES, default='NO CONTESTA')

    observacion = models.TextField(blank=True, null=True)
    opc = models.CharField(max_length=100, blank=True, null=True)
    observacion_opc = models.TextField(blank=True, null=True)

    fecha_creacion = models.DateTimeField(auto_now_add=True)
    ultima_actualizacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nombre} - {self.celular}"

class Action(models.Model):
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='actions')
    appointment = models.ForeignKey('Appointment', on_delete=models.SET_NULL, null=True, blank=True, related_name='actions')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    tipo_accion = models.CharField(max_length=100)
    detalle_accion = models.TextField()
    fecha_accion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.fecha_accion.strftime('%d/%m/%Y %H:%M')}] {self.tipo_accion} por {self.user.username if self.user else 'Sistema'}"

    class Meta:
        ordering = ['-fecha_accion']

class Appointment(models.Model):
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='appointments')
    asesor_comercial = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='scheduled_appointments')
    asesor_presencial = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='attended_appointments')

    fecha_hora = models.DateTimeField()
    lugar = models.CharField(max_length=255, blank=True, null=True)

    ESTADO_CITA_CHOICES = [
        ('Pendiente', 'Pendiente'),
        ('Confirmada', 'Confirmada'),
        ('Realizada', 'Realizada'),
        ('Cancelada', 'Cancelada'),
        ('Reprogramada', 'Reprogramada'),
    ]
    estado = models.CharField(max_length=50, choices=ESTADO_CITA_CHOICES, default='Pendiente')
    observaciones = models.TextField(blank=True, null=True)

    fecha_creacion = models.DateTimeField(auto_now_add=True)
    ultima_actualizacion = models.DateTimeField(auto_now=True)

    # NUEVO CAMPO: Para rastrear si la cita alguna vez fue confirmada
    has_ever_been_confirmed = models.BooleanField(default=False)

    def __str__(self):
        return f"Cita con {self.lead.nombre} el {self.fecha_hora.strftime('%d/%m/%Y %H:%M')}"

    class Meta:
        ordering = ['fecha_hora']