from rest_framework import serializers
# Asegúrate de importar TODOS los modelos que vas a serializar aquí
from .models import Lead, User, Action, Appointment

# Serializador para el modelo User (asesores)
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']
        read_only_fields = ['username', 'first_name', 'last_name', 'email'] # Estos campos no se deben modificar desde la API

# Serializador para el modelo Lead
class LeadSerializer(serializers.ModelSerializer):
    # 'asesor' es un campo de lectura que usa UserSerializer para mostrar los detalles del asesor
    asesor = UserSerializer(read_only=True)

    class Meta:
        model = Lead
        fields = '__all__' # Incluye todos los campos del modelo Lead

    # Método sobrescrito para la creación de Leads si se necesita lógica adicional
    def create(self, validated_data):
        return Lead.objects.create(**validated_data)

    # Método sobrescrito para la actualización de Leads
    def update(self, instance, validated_data):
        return super().update(instance, validated_data)

# Serializador para el modelo Action (historial de interacciones)
class ActionSerializer(serializers.ModelSerializer):
    # 'user' es un campo de lectura que usa UserSerializer para mostrar detalles de quien hizo la acción
    user = UserSerializer(read_only=True)

    class Meta:
        model = Action
        fields = '__all__' # Incluye todos los campos del modelo Action

# Serializador para el modelo Appointment (Citas)
class AppointmentSerializer(serializers.ModelSerializer):
    # Campos de lectura para mostrar detalles de los objetos relacionados
    lead = LeadSerializer(read_only=True)
    asesor_comercial = UserSerializer(read_only=True)
    asesor_presencial = UserSerializer(read_only=True)

    # Campos write-only para recibir los IDs de los objetos relacionados al crear/actualizar
    # 'source' mapea el campo del serializador al campo del modelo.
    # 'write_only=True' significa que este campo solo se usa para la entrada de datos, no para la salida.
    lead_id = serializers.PrimaryKeyRelatedField(
        queryset=Lead.objects.all(), source='lead', write_only=True
    )
    asesor_comercial_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='asesor_comercial', write_only=True, required=False, allow_null=True
    )
    asesor_presencial_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='asesor_presencial', write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = Appointment
        # Se listan todos los campos que se van a usar, incluyendo los write-only para los IDs
        fields = [
            'id', 'lead', 'lead_id', 'asesor_comercial', 'asesor_comercial_id',
            'asesor_presencial', 'asesor_presencial_id', 'fecha_hora',
            'lugar', 'estado', 'observaciones', 'fecha_creacion', 'ultima_actualizacion'
        ]

    # Sobrescribe el método create para manejar la asignación del asesor comercial si no se envía explícitamente
    def create(self, validated_data):
        # Asigna el usuario actual de la petición como 'asesor_comercial' si no se especificó uno.
        # self.context['request'] es una forma de acceder al objeto request en el serializador.
        if 'asesor_comercial' not in validated_data and 'request' in self.context and self.context['request'].user.is_authenticated:
            validated_data['asesor_comercial'] = self.context['request'].user
        return super().create(validated_data)

    # Sobrescribe el método update para la actualización si se necesita lógica adicional
    def update(self, instance, validated_data):
        return super().update(instance, validated_data)