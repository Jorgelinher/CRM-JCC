# backend/leads/serializers.py

from rest_framework import serializers
from .models import Lead, User, Action, Appointment

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']
        read_only_fields = ['username', 'first_name', 'last_name', 'email']

class LeadSerializer(serializers.ModelSerializer):
    asesor = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        allow_null=True,
        required=False
    )

    class Meta:
        model = Lead
        fields = '__all__'

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.asesor:
            representation['asesor'] = UserSerializer(instance.asesor).data
        else:
            representation['asesor'] = None
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
        fields = [
            'id', 'lead', 'lead_id', 'asesor_comercial', 'asesor_comercial_id',
            'asesor_presencial', 'asesor_presencial_id', 'fecha_hora',
            'lugar', 'estado', 'observaciones', 'fecha_creacion', 'ultima_actualizacion'
        ]
        model = Appointment

    def create(self, validated_data):
        if 'asesor_comercial' not in validated_data and 'request' in self.context and self.context['request'].user.is_authenticated:
            validated_data['asesor_comercial'] = self.context['request'].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        return super().update(instance, validated_data)