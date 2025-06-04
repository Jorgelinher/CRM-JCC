# backend/leads/models.py

from django.db import models
from django.contrib.auth.models import AbstractUser # Para el modelo de usuario personalizado

# 1. Modelo User (Asesor)
# Extiende el modelo AbstractUser de Django para tener nuestro propio modelo de usuario.
class User(AbstractUser):
    # Estos campos son necesarios para resolver conflictos con el modelo User predeterminado de Django
    # cuando se extiende AbstractUser y se usa AUTH_USER_MODEL.
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to. A user will get all permissions '
                  'granted to each of their groups.',
        related_name="leads_user_set", # Nombre relacionado unico para evitar conflicto
        related_query_name="leads_user", # Nombre de consulta relacionado unico
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name="leads_user_permissions_set", # Nombre relacionado único para evitar conflicto
        related_query_name="leads_user_permission", # Nombre de consulta relacionado único
    )

    def __str__(self):
        return self.username

# 2. Modelo Lead
# Representa un lead potencial en el CRM.
class Lead(models.Model):
    # Foreign Key al modelo User para asignar un asesor al lead
    asesor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_leads')

    proyecto = models.CharField(max_length=255)
    nombre = models.CharField(max_length=255)
    celular = models.CharField(max_length=20, unique=True) # Número de teléfono único para evitar duplicados
    medio = models.CharField(max_length=100)
    distrito = models.CharField(max_length=100)

    TIPIFICACION_CHOICES = [
        ('Nuevo', 'Nuevo'),
        ('Contactado', 'Contactado'),
        ('Interesado', 'Interesado'),
        ('No Contesta', 'No Contesta'),
        ('Descartado', 'Descartado'),
        ('Cita Agendada', 'Cita Agendada'),
        ('Cita Confirmada', 'Cita Confirmada'),
        ('Cita Realizada', 'Cita Realizada'),
        ('Seguimiento', 'Seguimiento'),
    ]
    tipificacion = models.CharField(max_length=100, choices=TIPIFICACION_CHOICES, default='Nuevo')

    observacion = models.TextField(blank=True, null=True)
    opc = models.CharField(max_length=100, blank=True, null=True) # Método de captación original
    observacion_opc = models.TextField(blank=True, null=True)

    fecha_creacion = models.DateTimeField(auto_now_add=True) # Se establece automáticamente al crear
    ultima_actualizacion = models.DateTimeField(auto_now=True) # Se actualiza automáticamente al guardar

    def __str__(self):
        return f"{self.nombre} - {self.celular}"

# 3. Modelo Action (Historial de Interacciones)
# Registra cada acción o cambio realizado en un lead.
class Action(models.Model):
    # Foreign Key al Lead al que pertenece esta acción. CASCADE significa que si el lead se elimina, sus acciones también.
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='actions')
    # Foreign Key al User que realizó la acción. SET_NULL significa que si el usuario se elimina, este campo se pone a NULL.
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    tipo_accion = models.CharField(max_length=100) # Ej: 'Lead Creado', 'Tipificacion Actualizada', 'Observación Añadida'
    detalle_accion = models.TextField() # Descripción detallada de la acción
    fecha_accion = models.DateTimeField(auto_now_add=True) # Fecha y hora de la acción

    def __str__(self):
        return f"[{self.fecha_accion.strftime('%d/%m/%Y %H:%M')}] {self.tipo_accion} por {self.user.username if self.user else 'Sistema'}"

    class Meta:
        ordering = ['-fecha_accion'] # Ordena las acciones de la más reciente a la más antigua

# 4. Modelo Appointment (Citas)
# Gestiona las citas programadas con los leads.
class Appointment(models.Model):
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='appointments')
    # Asesor que agendó/gestionó la cita (puede ser el asesor comercial/teléfono)
    asesor_comercial = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='scheduled_appointments')
    # Asesor que atiende la cita presencialmente (especializado)
    asesor_presencial = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='attended_appointments')

    fecha_hora = models.DateTimeField() # Fecha y hora exacta de la cita
    lugar = models.CharField(max_length=255, blank=True, null=True) # Ubicación de la cita

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

    def __str__(self):
        return f"Cita con {self.lead.nombre} el {self.fecha_hora.strftime('%d/%m/%Y %H:%M')}"

    class Meta:
        ordering = ['fecha_hora'] # Ordenar citas por fecha y hora ascendente