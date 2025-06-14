# backend/leads/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination

from django_filters.rest_framework import DjangoFilterBackend
from django_filters import FilterSet, DateFromToRangeFilter
import django_filters
from rest_framework.filters import SearchFilter, OrderingFilter

from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone
import datetime

from .models import Lead, User, Action, Appointment, OPCPersonnel
from . import serializers


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class LeadFilter(FilterSet):
    fecha_creacion = DateFromToRangeFilter()
    ultima_actualizacion = DateFromToRangeFilter()
    fecha_captacion = DateFromToRangeFilter()

    is_opc_lead = django_filters.BooleanFilter(method='filter_is_opc_lead')

    class Meta:
        model = Lead
        fields = {
            'asesor': ['exact'],
            'ubicacion': ['exact', 'icontains'],
            'proyecto_interes': ['exact'],
            'medio': ['exact'],
            'distrito': ['exact', 'icontains'],
            'tipificacion': ['exact'],
            # Estos están definidos directamente en la clase, no deben estar aquí
            # 'fecha_creacion': ['gte', 'lte'],
            # 'ultima_actualizacion': ['gte', 'lte'],
            'personal_opc_captador': ['exact'],
            'supervisor_opc_captador': ['exact'],
            # Este también, no debe estar aquí
            # 'fecha_captacion': ['gte', 'lte'],
            'calle_o_modulo': ['exact'],
        }

    def filter_is_opc_lead(self, queryset, name, value):
        if value is True:
            return queryset.filter(personal_opc_captador__isnull=False)
        elif value is False:
            return queryset.filter(personal_opc_captador__isnull=True)
        return queryset


class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all().select_related(
        'asesor', 'personal_opc_captador', 'supervisor_opc_captador'
    ).order_by('-fecha_creacion')
    
    serializer_class = serializers.LeadSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = LeadFilter
    search_fields = ['nombre', 'celular', 'ubicacion', 'distrito', 'observacion', 'calle_o_modulo', 'proyecto_interes']
    ordering_fields = [
        'fecha_creacion', 'ultima_actualizacion', 'nombre', 'tipificacion', 'celular',
        'ubicacion', 'fecha_captacion', 'personal_opc_captador', 'supervisor_opc_captador', 'proyecto_interes'
    ]

    pagination_class = StandardResultsSetPagination

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

    @action(detail=True, methods=['get'])
    def actions(self, request, pk=None):
        lead = self.get_object()
        actions = lead.actions.all().order_by('-fecha_accion')
        serializer = serializers.ActionSerializer(actions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def upload_csv(self, request):
        if 'csv_file' not in request.FILES:
            return Response({'error': 'No se proporcionó ningún archivo CSV.'}, status=status.HTTP_400_BAD_REQUEST)

        csv_file = request.FILES['csv_file']
        if not csv_file.name.endswith('.csv'):
            return Response({'error': 'El archivo debe ser un archivo CSV.'}, status=status.HTTP_400_BAD_REQUEST)

        data_set = csv_file.read().decode('UTF-8')
        io_string = io.StringIO(data_set)
        reader = csv.DictReader(io_string)

        asesores_activos = list(User.objects.filter(is_active=True).order_by('id'))
        if not asesores_activos:
            return Response({'error': 'No hay asesores activos para asignar leads.'}, status=status.HTTP_400_BAD_REQUEST)

        leads_creados = 0
        leads_actualizados = 0
        errores = []

        asesor_index = 0

        with transaction.atomic():
            io_string.seek(0)
            reader_for_total = csv.reader(io.StringIO(data_set))
            total_filas_en_csv = sum(1 for row in reader_for_total) - 1 if sum(1 for row in csv.reader(io.StringIO(data_set))) > 0 else 0

            io_string.seek(0)
            reader = csv.DictReader(io_string)


            for row_num, row in enumerate(reader, start=1):
                try:
                    clean_row = {k.strip().lower().replace(' ', '_'): v.strip() for k, v in row.items()}

                    nombre = clean_row.get('nombre')
                    celular = clean_row.get('celular')
                    ubicacion = clean_row.get('proyecto')
                    medio = clean_row.get('medio')
                    distrito = clean_row.get('distrito')
                    tipificacion = clean_row.get('tipificacion', '')
                    observacion = clean_row.get('observacion')
                    observacion_opc = clean_row.get('observacion_opc')
                    proyecto_interes = clean_row.get('proyecto_interes')
                    calle_o_modulo = clean_row.get('calle_o_modulo')


                    current_asesor = asesores_activos[asesor_index]
                    asesor_index = (asesor_index + 1) % len(asesores_activos)

                    if not celular or not nombre or not ubicacion:
                        errores.append(f"Fila {row_num}: Celular, Nombre o Ubicación faltantes.")
                        continue

                    lead_obj, created = Lead.objects.update_or_create(
                        celular=celular,
                        defaults={
                            'nombre': nombre,
                            'ubicacion': ubicacion,
                            'medio': medio,
                            'distrito': distrito,
                            'tipificacion': tipificacion,
                            'observacion': observacion,
                            'observacion_opc': observacion_opc,
                            'asesor': current_asesor,
                            'proyecto_interes': proyecto_interes,
                            'calle_o_modulo': calle_o_modulo,
                        }
                    )
                    if created:
                        leads_creados += 1
                    else:
                        leads_actualizados += 1

                except Exception as e:
                    errores.append(f"Fila {row_num}: Error al procesar '{row.get('nombre', 'N/A')}' - {e}")

            return Response({
                'message': 'Proceso de carga de CSV completado.',
                'leads_creados': leads_creados,
                'leads_actualizados': leads_actualizados,
                'errores': errores,
                'total_filas_procesadas': total_filas_en_csv,
            }, status=status.HTTP_200_OK if not errores else status.HTTP_206_PARTIAL_CONTENT)


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all().order_by('username')
    serializer_class = serializers.UserSerializer
    permission_classes = [IsAuthenticated]

class AppointmentFilter(FilterSet):
    class Meta:
        model = Appointment
        fields = {
            'asesor_comercial': ['exact'],
            'asesor_presencial': ['exact'],
            'estado': ['exact'],
        }

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all().select_related(
        'lead', 'asesor_comercial', 'asesor_presencial', 'opc_personal_atendio'
    ).order_by('-fecha_hora')

    serializer_class = serializers.AppointmentSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = AppointmentFilter
    search_fields = ['lead__nombre', 'lead__celular', 'lugar', 'observaciones']
    ordering_fields = ['fecha_hora', 'estado', 'lead__nombre', 'lead__celular']
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = super().get_queryset()

        fecha_hora_gte_str = self.request.query_params.get('fecha_hora_gte')
        fecha_hora_lte_str = self.request.query_params.get('fecha_hora_lte')

        if fecha_hora_gte_str:
            try:
                start_date = datetime.datetime.strptime(fecha_hora_gte_str, '%Y-%m-%d').date()
                start_datetime = datetime.datetime.combine(start_date, datetime.time.min).replace(tzinfo=datetime.timezone.utc)
                queryset = queryset.filter(fecha_hora__gte=start_datetime)
            except ValueError:
                pass

        if fecha_hora_lte_str:
            try:
                end_date = datetime.datetime.strptime(fecha_hora_lte_str, '%Y-%m-%d').date()
                adjusted_end_datetime = datetime.datetime.combine(end_date + datetime.timedelta(days=1), datetime.time.min).replace(tzinfo=datetime.timezone.utc)
                queryset = queryset.filter(fecha_hora__lt=adjusted_end_datetime)
            except ValueError:
                pass

        return queryset

    def perform_create(self, serializer):
        if not serializer.validated_data.get('asesor_comercial'):
            serializer.validated_data['asesor_comercial'] = self.request.user

        appointment = serializer.save()

        if appointment.estado == 'Confirmada':
            appointment.has_ever_been_confirmed = True
            appointment.save(update_fields=['has_ever_been_confirmed'])

    def perform_update(self, serializer):
        old_estado = serializer.instance.estado
        old_tipificacion_lead = serializer.instance.lead.tipificacion if serializer.instance.lead else None

        old_has_ever_been_confirmed = serializer.instance.has_ever_been_confirmed

        appointment = serializer.save()

        if not old_has_ever_been_confirmed and appointment.estado == 'Confirmada':
            appointment.has_ever_been_confirmed = True
            appointment.save(update_fields=['has_ever_been_confirmed'])

    def perform_destroy(self, instance):
        lead_id = instance.lead_id
        super().perform_destroy(instance)

        if lead_id:
            try:
                lead = Lead.objects.get(id=lead_id)
                if not lead.appointments.exists() and lead.tipificacion in [
                    'CITA - SALA', 'CITA - PROYECTO', 'CITA - HxH', 'CITA - ZOOM', 'CITA - POR CONFIRMAR', 'CITA - CONFIRMADA', 'YA ASISTIO'
                ]:
                    lead.tipificacion = 'SEGUIMIENTO'
                    lead.save()
            except Lead.DoesNotExist:
                pass


    @action(detail=True, methods=['get'])
    def actions(self, request, pk=None):
        appointment = self.get_object()
        appointment_actions = appointment.actions.all()
        lead_actions = appointment.lead.actions.all()

        all_related_actions = sorted(
            list(appointment_actions) + list(lead_actions),
            key=lambda action: action.fecha_accion,
            reverse=True
        )

        serializer = serializers.ActionSerializer(all_related_actions, many=True)
        return Response(serializer.data)


class ActionFilter(FilterSet):
    class Meta:
        model = Action
        fields = {
            'lead': ['exact'],
            'appointment': ['exact'],
            'user': ['exact'],
            'tipo_accion': ['exact'],
            'fecha_accion': ['gte', 'lte'],
        }

class ActionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Action.objects.all().select_related('lead', 'appointment', 'user').order_by('-fecha_accion')
    serializer_class = serializers.ActionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = ActionFilter
    ordering_fields = ['fecha_accion', 'tipo_accion']
    pagination_class = StandardResultsSetPagination


# NUEVO: Filtro para el Personal OPC
class OPCPersonnelFilter(FilterSet):
    class Meta:
        model = OPCPersonnel
        fields = {
            'rol': ['exact'],
            'supervisor': ['exact'], # Filtrar por supervisor
            # No hay campos de fecha en el modelo OPCPersonnel para filtrar
        }

class OPCPersonnelViewSet(viewsets.ModelViewSet):
    queryset = OPCPersonnel.objects.all().select_related('user', 'supervisor').order_by('nombre')
    serializer_class = serializers.OPCPersonnelSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = OPCPersonnelFilter # ASIGNACIÓN DEL FILTRO
    search_fields = ['nombre', 'telefono', 'email', 'rol', 'supervisor__nombre', 'user__username']
    ordering_fields = ['nombre', 'rol', 'supervisor__nombre']
    pagination_class = StandardResultsSetPagination


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_metrics(request):
    """
    Endpoint para obtener métricas y datos para el panel de control.
    Filtros:
    - asesor_id (opcional): ID del asesor para filtrar.
    - fecha_desde (opcional): Fecha de inicio para el filtro (YYYY-MM-DD).
    - fecha_hasta (opcional): Fecha de fin para el filtro (YYYY-MM-DD).
    """
    asesor_id = request.query_params.get('asesor_id')
    fecha_desde_str = request.query_params.get('fecha_desde')
    fecha_hasta_str = request.query_params.get('fecha_hasta')

    leads_queryset = Lead.objects.all()
    appointments_queryset = Appointment.objects.all()

    if fecha_desde_str:
        try:
            fecha_desde = datetime.datetime.strptime(fecha_desde_str, '%Y-%m-%d').replace(tzinfo=datetime.timezone.utc)
            leads_queryset = leads_queryset.filter(fecha_creacion__gte=fecha_desde)
            appointments_queryset = appointments_queryset.filter(fecha_creacion__gte=fecha_desde)
        except ValueError:
            return Response({"error": "Formato de fecha_desde inválido. Use'%Y-%m-%d'."}, status=status.HTTP_400_BAD_REQUEST)

    if fecha_hasta_str:
        try:
            fecha_hasta = datetime.datetime.strptime(fecha_hasta_str, '%Y-%m-%d').replace(tzinfo=datetime.timezone.utc)
            fecha_hasta = fecha_hasta + datetime.timedelta(days=1) - datetime.timedelta(microseconds=1)
            leads_queryset = leads_queryset.filter(fecha_creacion__lte=fecha_hasta)
            appointments_queryset = appointments_queryset.filter(fecha_creacion__lte=fecha_hasta)
        except ValueError:
            return Response({"error": "Formato de fecha_hasta inválido. Use'%Y-%m-%d'."}, status=status.HTTP_400_BAD_REQUEST)

    if asesor_id:
        try:
            asesor = User.objects.get(id=asesor_id)
            leads_queryset = leads_queryset.filter(asesor=asesor)
            appointments_queryset = appointments_queryset.filter(
                Q(asesor_comercial=asesor) | Q(asesor_presencial=asesor) | Q(opc_personal_atendio=asesor.opc_profile)
            )
        except User.DoesNotExist:
            return Response({"error": "Asesor no encontrado."}, status=status.HTTP_404_NOT_FOUND)
        except ValueError:
            return Response({"error": "ID de asesor inválido."}, status=status.HTTP_400_BAD_REQUEST)
        except OPCPersonnel.DoesNotExist:
            pass


    # --- Métricas Clave ---
    total_leads_asignados = leads_queryset.count()
    citas_confirmadas = appointments_queryset.filter(has_ever_been_confirmed=True).count()
    presencias = appointments_queryset.filter(estado='Realizada').count()

    tasa_conversion_global = (presencias / citas_confirmadas * 100) if citas_confirmadas > 0 else 0

    # --- Rendimiento por Asesor (Tabla) ---
    asesores_data = []
    users_with_activity = User.objects.filter(
        Q(assigned_leads__in=leads_queryset) |
        Q(scheduled_appointments__in=appointments_queryset) |
        Q(attended_appointments__in=appointments_queryset) |
        Q(opc_profile__citas_atendidas_opc__in=appointments_queryset)
    ).distinct().order_by('username')

    for user_obj in users_with_activity:
        asesor_leads_count = leads_queryset.filter(asesor=user_obj).count()
        asesor_citas_confirmadas = appointments_queryset.filter(
            Q(asesor_comercial=user_obj) | Q(asesor_presencial=user_obj),
            has_ever_been_confirmed=True
        ).count()

        asesor_presencias = 0
        asesor_presencias += appointments_queryset.filter(
            Q(asesor_comercial=user_obj) | Q(asesor_presencial=user_obj),
            estado='Realizada'
        ).count()
        
        if hasattr(user_obj, 'opc_profile'):
            opc_attended_presences = appointments_queryset.filter(
                opc_personal_atendio=user_obj.opc_profile,
                estado='Realizada'
            ).count()
            asesor_presencias += opc_attended_presences

        asesor_tasa_conversion = (asesor_presencias / asesor_citas_confirmadas * 100) if asesor_citas_confirmadas > 0 else 0

        asesores_data.append({
            'id': user_obj.id,
            'nombre': user_obj.username,
            'leads_asignados': asesor_leads_count,
            'citas_confirmadas': asesor_citas_confirmadas,
            'presencias': asesor_presencias,
            'tasa_conversion': round(asesor_tasa_conversion, 2),
        })

    # --- Gráfico de Anillos: Top 10 Distritos ---
    top_distritos = leads_queryset.values('distrito').annotate(count=Count('distrito')).order_by('-count')[:10]
    distritos_data = [{'name': d['distrito'] if d['distrito'] else 'Sin Distrito', 'value': d['count']} for d in top_distritos]

    # --- Gráfico de Fuente de Leads (Medio de Captación) ---
    fuente_leads = leads_queryset.values('medio').annotate(count=Count('medio')).order_by('-count')
    fuente_leads_data = [{'name': m['medio'] if m['medio'] else 'Sin Medio', 'value': m['count']} for m in fuente_leads]

    # --- Gráfico de Embudo de Ventas ---
    embudo_data = [
        {'name': 'Leads Asignados', 'value': total_leads_asignados},
        {'name': 'Citas Confirmadas', 'value': citas_confirmadas},
        {'name': 'Presencias', 'value': presencias},
    ]

    response_data = {
        'metricas_generales': {
            'total_leads_asignados': total_leads_asignados,
            'citas_confirmadas_global': citas_confirmadas,
            'presencias_global': presencias,
            'tasa_conversion_global': round(tasa_conversion_global, 2),
        },
        'rendimiento_asesores': asesores_data,
        'distribucion_distritos': distritos_data,
        'fuente_leads': fuente_leads_data,
        'embudo_ventas': embudo_data,
    }

    return Response(response_data)