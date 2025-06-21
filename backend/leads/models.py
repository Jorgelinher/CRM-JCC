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

class OPCPersonnel(models.Model):
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='opc_profile')

    nombre = models.CharField(max_length=255)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)

    ROLES_OPC_CHOICES = [
        ('OPC', 'Personal OPC'),
        ('SUPERVISOR', 'Supervisor OPC'),
    ]
    rol = models.CharField(max_length=10, choices=ROLES_OPC_CHOICES)

    supervisor = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='subordinados',
        limit_choices_to={'rol': 'SUPERVISOR'}
    )

    horario_semanal = models.JSONField(default=dict, blank=True, null=True)

    def __str__(self):
        return f"{self.nombre} ({self.rol})"

class Lead(models.Model):
    asesor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_leads')

    # CORRECCIÓN: Renombrar 'proyecto' a 'ubicacion'. Este campo se usa para la ubicación física de captación.
    ubicacion = models.CharField(max_length=255, blank=True, null=True) # Puede ser la ubicación OPC o el nombre de campaña para leads generales

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
    tipificacion = models.CharField(max_length=100, choices=TIPIFICACION_CHOICES, default='', blank=True, null=True)

    observacion = models.TextField(blank=True, null=True)
    # 'opc_original' ha sido eliminado en la fase anterior
    observacion_opc = models.TextField(blank=True, null=True)

    fecha_creacion = models.DateTimeField(auto_now_add=True)
    ultima_actualizacion = models.DateTimeField(auto_now=True)

    personal_opc_captador = models.ForeignKey(OPCPersonnel, on_delete=models.SET_NULL, null=True, blank=True, related_name='leads_captados')
    supervisor_opc_captador = models.ForeignKey(OPCPersonnel, on_delete=models.SET_NULL, null=True, blank=True, related_name='leads_supervisados', limit_choices_to={'rol': 'SUPERVISOR'})
    fecha_captacion = models.DateField(blank=True, null=True)

    # NUEVO CAMPO: Para rastrear mejor los leads OPC
    es_lead_opc = models.BooleanField(default=False, help_text='Indica si este lead fue captado por personal OPC')

    # CORRECCIÓN: 'calle_o_modulo' ahora es un campo de opciones
    CALLE_MODULO_CHOICES = [
        ('CALLE', 'Calle'),
        ('MODULO', 'Módulo'),
    ]
    calle_o_modulo = models.CharField(max_length=10, choices=CALLE_MODULO_CHOICES, blank=True, null=True)

    # NUEVO CAMPO: Proyecto de Interés (para leads OPC) / Nombre de Campaña (para leads generales)
    PROYECTO_INTERES_CHOICES = [
        ('OASIS 2 (AUCALLAMA)', 'OASIS 2 (AUCALLAMA)'),
        ('OASIS 3 (HUACHO 2)', 'OASIS 3 (HUACHO 2)'),
        ('OASIS 1 (HUACHO 1)', 'OASIS 1 (HUACHO 1)'),
        ('OASIS 1 y 2', 'OASIS 1 y 2'),
        ('OASIS 2 y 3', 'OASIS 2 y 3'),
        ('OASIS 1 y 3', 'OASIS 1 y 3'),
        ('OASIS 1,2 y 3', 'OASIS 1,2 y 3'),
    ]
    proyecto_interes = models.CharField(max_length=50, choices=PROYECTO_INTERES_CHOICES, blank=True, null=True)

    def save(self, *args, **kwargs):
        # Auto-marcar como lead OPC si tiene personal OPC asignado
        if self.personal_opc_captador and not self.es_lead_opc:
            self.es_lead_opc = True
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.nombre} - {self.celular}"

class Action(models.Model):
    lead = models.ForeignKey(Lead, on_delete=models.SET_NULL, null=True, blank=True, related_name='actions')
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

    has_ever_been_confirmed = models.BooleanField(default=False)

    opc_personal_atendio = models.ForeignKey(OPCPersonnel, on_delete=models.SET_NULL, null=True, blank=True, related_name='citas_atendidas_opc')

    def __str__(self):
        return f"Cita con {self.lead.nombre} el {self.fecha_hora.strftime('%d/%m/%Y %H:%M')}"

    class Meta:
        ordering = ['fecha_hora']

class LeadDuplicate(models.Model):
    original_lead = models.ForeignKey(Lead, on_delete=models.SET_NULL, null=True, blank=True, related_name='duplicates')
    nombre = models.CharField(max_length=255)
    celular = models.CharField(max_length=20)
    email = models.CharField(max_length=100, blank=True, null=True)
    asesor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    captador = models.ForeignKey(OPCPersonnel, on_delete=models.SET_NULL, null=True, blank=True)
    fecha_interaccion = models.DateField(null=True, blank=True)
    fecha_importacion = models.DateTimeField(auto_now_add=True)
    estado = models.CharField(max_length=20, default='pendiente')  # pendiente, fusionado, ignorado, etc.
    observacion = models.TextField(blank=True, null=True)
    observacion_opc = models.TextField(blank=True, null=True)
    proyecto_interes = models.CharField(max_length=50, blank=True, null=True)
    ubicacion = models.CharField(max_length=255, blank=True, null=True)
    medio = models.CharField(max_length=100, blank=True, null=True)
    distrito = models.CharField(max_length=100, blank=True, null=True)
    tipificacion = models.CharField(max_length=100, blank=True, null=True)
    calle_o_modulo = models.CharField(max_length=10, blank=True, null=True)

    def __str__(self):
        return f"Duplicado: {self.nombre} - {self.celular} (Estado: {self.estado})"