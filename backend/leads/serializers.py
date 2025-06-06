# backend/leads/serializers.py

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Lead, User, Action, Appointment, OPCPersonnel

# CORRECCIÓN: Mover UserSerializer al principio del archivo
class UserSerializer(serializers.ModelSerializer):
    opc_profile_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'opc_profile_id']
        read_only_fields = ['username', 'first_name', 'last_name', 'email', 'opc_profile_id']

    def get_opc_profile_id(self, obj):
        try:
            return obj.opc_profile.id
        except OPCPersonnel.DoesNotExist:
            return None


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        try:
            if hasattr(user, 'opc_profile') and user.opc_profile:
                 token['opc_profile_id'] = user.opc_profile.id
            else:
                 token['opc_profile_id'] = None
        except OPCPersonnel.DoesNotExist:
             token['opc_profile_id'] = None
        except Exception as e:
             print(f"Error al obtener opc_profile_id en JWT: {e}")
             token['opc_profile_id'] = None
        return token


class OPCPersonnelSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    supervisor_name = serializers.CharField(source='supervisor.nombre', read_only=True)
    supervisor = serializers.PrimaryKeyRelatedField(
        queryset=OPCPersonnel.objects.filter(rol='SUPERVISOR'),
        required=False, allow_null=True
    )

    class Meta:
        model = OPCPersonnel
        fields = [
            'id', 'nombre', 'telefono', 'email', 'rol', 'supervisor',
            'user', 'user_username', 'horario_semanal',
            'supervisor_name'
        ]
        read_only_fields = ['user', 'user_username']

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.supervisor:
            representation['supervisor'] = {
                'id': instance.supervisor.id,
                'nombre': instance.supervisor.nombre,
                'rol': instance.supervisor.rol,
            }
        else:
            representation['supervisor'] = None
        return representation


class LeadSerializer(serializers.ModelSerializer):
    asesor = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        allow_null=True,
        required=False
    )
    asesor_details = UserSerializer(source='asesor', read_only=True)

    personal_opc_captador_id = serializers.PrimaryKeyRelatedField(
        queryset=OPCPersonnel.objects.all(), source='personal_opc_captador', write_only=True, required=False, allow_null=True
    )
    supervisor_opc_captador_id = serializers.PrimaryKeyRelatedField(
        queryset=OPCPersonnel.objects.filter(rol='SUPERVISOR'),
        source='supervisor_opc_captador', write_only=True, required=False, allow_null=True
    )

    personal_opc_captador_details = OPCPersonnelSerializer(source='personal_opc_captador', read_only=True)
    supervisor_opc_captador_details = OPCPersonnelSerializer(source='supervisor_opc_captador', read_only=True)

    class Meta:
        model = Lead
        fields = [
            'id',
            'ubicacion', # RENOMBRADO: antes 'proyecto'
            'proyecto_interes', # NUEVO CAMPO
            'nombre', 'celular', 'medio', 'distrito',
            'tipificacion', 'observacion',
            'observacion_opc',
            'fecha_creacion', 'ultima_actualizacion',
            'asesor', 'asesor_details',
            'personal_opc_captador', 'personal_opc_captador_id',
            'supervisor_opc_captador', 'supervisor_opc_captador_id',
            'personal_opc_captador_details', 'supervisor_opc_captador_details',
            'fecha_captacion',
            'calle_o_modulo' # Campo con choices
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.asesor:
            representation['asesor'] = UserSerializer(instance.asesor).data
        else:
            representation['asesor'] = None

        if instance.personal_opc_captador:
            representation['personal_opc_captador'] = OPCPersonnelSerializer(instance.personal_opc_captador).data
        else:
            representation['personal_opc_captador'] = None

        if instance.supervisor_opc_captador:
            representation['supervisor_opc_captador'] = OPCPersonnelSerializer(instance.supervisor_opc_captador).data
        else:
            representation['supervisor_opc_captador'] = None
        
        return representation


class ActionSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    appointment_details = serializers.SerializerMethodField()

    class Meta:
        model = Action
        fields = '__all__'

    def get_appointment_details(self, obj):
        if obj.appointment:
            return {
                'id': obj.appointment.id,
                'fecha_hora': obj.appointment.fecha_hora.isoformat(),
                'lugar': obj.appointment.lugar,
                'estado': obj.appointment.estado,
            }
        return None


class AppointmentSerializer(serializers.ModelSerializer):
    lead = LeadSerializer(read_only=True)
    asesor_comercial = UserSerializer(read_only=True)
    asesor_presencial = UserSerializer(read_only=True)
    opc_personal_atendio_details = OPCPersonnelSerializer(source='opc_personal_atendio', read_only=True)

    lead_id = serializers.PrimaryKeyRelatedField(
        queryset=Lead.objects.all(), source='lead', write_only=True
    )
    asesor_comercial_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='asesor_comercial', write_only=True, required=False, allow_null=True
    )
    asesor_presencial_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='asesor_presencial', write_only=True, required=False, allow_null=True
    )
    opc_personal_atendio_id = serializers.PrimaryKeyRelatedField(
        queryset=OPCPersonnel.objects.all(), source='opc_personal_atendio', write_only=True, required=False, allow_null=True
    )

    class Meta:
        fields = [
            'id', 'lead', 'lead_id', 'asesor_comercial', 'asesor_comercial_id',
            'asesor_presencial', 'asesor_presencial_id', 'fecha_hora',
            'lugar', 'estado', 'observaciones', 'fecha_creacion', 'ultima_actualizacion',
            'has_ever_been_confirmed',
            'opc_personal_atendio', 'opc_personal_atendio_id',
            'opc_personal_atendio_details'
        ]
        model = Appointment

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        if instance.lead:
            representation['lead'] = LeadSerializer(instance.lead).data
        else:
            representation['lead'] = None

        if instance.asesor_comercial:
            representation['asesor_comercial'] = UserSerializer(instance.asesor_comercial).data
        else:
            representation['asesor_comercial'] = None

        if instance.asesor_presencial:
            representation['asesor_presencial'] = UserSerializer(instance.asesor_presencial).data
        else:
            representation['asesor_presencial'] = None

        if instance.opc_personal_atendio:
            representation['opc_personal_atendio'] = OPCPersonnelSerializer(instance.opc_personal_atendio).data
        else:
            representation['opc_personal_atendio'] = None

        return representation

    def create(self, validated_data):
        if 'asesor_comercial' not in validated_data and 'request' in self.context and self.context['request'].user.is_authenticated:
            validated_data['asesor_comercial'] = self.context['request'].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        return super().update(instance, validated_data)