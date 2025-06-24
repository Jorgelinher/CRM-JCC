# backend/leads/views.py

from rest_framework import viewsets, status, mixins
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

from .models import Lead, User, Action, Appointment, OPCPersonnel, LeadDuplicate
from . import serializers
from .serializers import LeadDuplicateSerializer
from leads.models import User
from .services import webhook_service


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class LeadFilter(FilterSet):
    fecha_creacion = DateFromToRangeFilter()
    ultima_actualizacion = DateFromToRangeFilter()
    fecha_captacion = DateFromToRangeFilter()

    is_opc_lead = django_filters.BooleanFilter(method='filter_is_opc_lead')
    asesor = django_filters.CharFilter(method='filter_asesor')

    class Meta:
        model = Lead
        fields = {
            'ubicacion': ['exact', 'icontains'],
            'proyecto_interes': ['exact'],
            'medio': ['exact'],
            'distrito': ['exact', 'icontains'],
            'tipificacion': ['exact'],
            'personal_opc_captador': ['exact'],
            'supervisor_opc_captador': ['exact'],
            'calle_o_modulo': ['exact'],
        }

    def filter_is_opc_lead(self, queryset, name, value):
        if value is True:
            # Usar el nuevo campo es_lead_opc para mayor precisión
            return queryset.filter(es_lead_opc=True)
        elif value is False:
            # Mostrar leads que NO son OPC
            return queryset.filter(es_lead_opc=False)
        return queryset

    def filter_asesor(self, queryset, name, value):
        if value == 'null':
            return queryset.filter(asesor__isnull=True)
        elif value:
            return queryset.filter(asesor=value)
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

    def get_queryset(self):
        qs = super().get_queryset()
        # Si la vista es para gestión de leads (operadores), excluir directeo
        if self.request.query_params.get('context') == 'gestion':
            qs = qs.filter(es_directeo=False)
        # Si la vista es para Leads OPC, solo mostrar directeo
        if self.request.query_params.get('context') == 'opc':
            qs = qs.filter(es_directeo=True)
        return qs

    def perform_create(self, serializer):
        data = self.request.data
        es_directeo = data.get('es_directeo', False)
        personal_opc_captador_id = data.get('personal_opc_captador') or data.get('personal_opc_captador_id')
        # Si es directeo, asignar el operador como el usuario del OPC captador
        if es_directeo and personal_opc_captador_id:
            from leads.models import OPCPersonnel
            try:
                opc = OPCPersonnel.objects.get(id=personal_opc_captador_id)
                if opc.user:
                    serializer.save(asesor=opc.user)
                    return
            except Exception:
                pass
        serializer.save()

    def perform_update(self, serializer):
        data = self.request.data
        es_directeo = data.get('es_directeo', False)
        personal_opc_captador_id = data.get('personal_opc_captador') or data.get('personal_opc_captador_id')
        # Si es directeo, asignar el operador como el usuario del OPC captador
        if es_directeo and personal_opc_captador_id:
            from leads.models import OPCPersonnel
            try:
                opc = OPCPersonnel.objects.get(id=personal_opc_captador_id)
                if opc.user:
                    serializer.save(asesor=opc.user)
                    return
            except Exception:
                pass
        serializer.save()

    @action(detail=True, methods=['get'])
    def actions(self, request, pk=None):
        lead = self.get_object()
        actions = lead.actions.all().order_by('-fecha_accion')
        serializer = serializers.ActionSerializer(actions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def upload_csv(self, request):
        import csv, io
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
        duplicados = 0
        errores = []
        duplicados_guardados = 0
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
                    email = clean_row.get('email')
                    ubicacion = clean_row.get('proyecto') or clean_row.get('ubicacion')
                    medio = clean_row.get('medio')
                    distrito = clean_row.get('distrito')
                    tipificacion = clean_row.get('tipificacion', '')
                    observacion = clean_row.get('observacion')
                    observacion_opc = clean_row.get('observacion_opc')
                    proyecto_interes = clean_row.get('proyecto_interes')
                    calle_o_modulo = clean_row.get('calle_o_modulo')
                    fecha_interaccion = clean_row.get('fecha_interaccion')

                    current_asesor = asesores_activos[asesor_index]
                    asesor_index = (asesor_index + 1) % len(asesores_activos)

                    if not celular or not nombre or not ubicacion:
                        errores.append(f"Fila {row_num}: Celular, Nombre o Ubicación faltantes.")
                        continue

                    # Detección de duplicados avanzada
                    lead_qs = Lead.objects.filter(celular=celular)
                    if not lead_qs.exists() and email:
                        lead_qs = Lead.objects.filter(email=email)
                    if not lead_qs.exists():
                        lead_qs = Lead.objects.filter(nombre__iexact=nombre, celular=celular)

                    if lead_qs.exists():
                        # Guardar como duplicado
                        LeadDuplicate.objects.create(
                            original_lead=lead_qs.first(),
                            nombre=nombre,
                            celular=celular,
                            email=email,
                            asesor=current_asesor,
                            captador=None,
                            fecha_interaccion=fecha_interaccion or None,
                            observacion=observacion,
                            observacion_opc=observacion_opc,
                            proyecto_interes=proyecto_interes,
                            ubicacion=ubicacion,
                            medio=medio,
                            distrito=distrito,
                            tipificacion=tipificacion,
                            calle_o_modulo=calle_o_modulo,
                        )
                        duplicados += 1
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

            duplicados_guardados = LeadDuplicate.objects.filter(estado='pendiente').count()
            return Response({
                'message': 'Proceso de carga de CSV completado.',
                'leads_creados': leads_creados,
                'leads_actualizados': leads_actualizados,
                'duplicados_detectados': duplicados,
                'duplicados_guardados': duplicados_guardados,
                'errores': errores,
                'total_filas_procesadas': total_filas_en_csv,
            }, status=status.HTTP_200_OK if not errores else status.HTTP_206_PARTIAL_CONTENT)

    @action(detail=False, methods=['post'], url_path='reasignar')
    def reasignar(self, request):
        ids = request.data.get('lead_ids', [])
        nuevo_asesor_id = request.data.get('nuevo_asesor_id')
        nuevo_captador_id = request.data.get('nuevo_captador_id')
        if not ids or (not nuevo_asesor_id and not nuevo_captador_id):
            return Response({'error': 'Debes proporcionar los IDs de los leads y el nuevo asesor o captador.'}, status=400)
        updated = 0
        from .models import Action, User, OPCPersonnel
        nuevo_asesor = User.objects.filter(id=nuevo_asesor_id).first() if nuevo_asesor_id else None
        nuevo_captador = OPCPersonnel.objects.filter(id=nuevo_captador_id).first() if nuevo_captador_id else None
        for lead in Lead.objects.filter(id__in=ids):
            cambios = []
            if nuevo_asesor and lead.asesor != nuevo_asesor:
                lead.asesor = nuevo_asesor
                cambios.append(f'asesor a {nuevo_asesor.username}')
            if nuevo_captador and lead.personal_opc_captador != nuevo_captador:
                lead.personal_opc_captador = nuevo_captador
                cambios.append(f'captador a {nuevo_captador.nombre}')
            if cambios:
                lead.save()
                Action.objects.create(
                    lead=lead,
                    user=request.user,
                    tipo_accion='Reasignación masiva',
                    detalle_accion=f'Lead reasignado: {", ".join(cambios)}.'
                )
                updated += 1
        return Response({'message': f'{updated} leads reasignados correctamente.'})

    def destroy(self, request, *args, **kwargs):
        lead = self.get_object()
        # Eliminar citas asociadas
        lead.appointments.all().delete()
        # Eliminar acciones asociadas
        lead.actions.all().delete()
        # Eliminar duplicados asociados
        lead.duplicates.all().delete()
        lead_id = lead.id
        super().destroy(request, *args, **kwargs)
        return Response({'detail': f'Lead {lead_id} y todas sus citas, acciones y duplicados asociados han sido eliminados en cascada.'}, status=status.HTTP_200_OK)


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all().order_by('username')
    serializer_class = serializers.UserSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['username', 'first_name', 'last_name', 'email']
    ordering_fields = ['username', 'first_name', 'last_name', 'email', 'rol']
    filterset_fields = ['rol']

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
        
        # --- INTEGRACIÓN CON APP COMERCIAL ---
        # Enviar webhook cuando la cita se marca como "Realizada"
        if old_estado != 'Realizada' and appointment.estado == 'Realizada':
            try:
                webhook_service.send_presence_notification(appointment)
            except Exception as e:
                # Log del error pero no fallar la operación principal
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error al enviar webhook para cita {appointment.id}: {str(e)}")

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
def opc_leads_metrics(request):
    """Obtiene métricas específicas para leads OPC"""
    from django.db.models import Count, Q
    from datetime import datetime, timedelta
    
    # Parámetros de filtro
    fecha_desde = request.GET.get('fecha_desde')
    fecha_hasta = request.GET.get('fecha_hasta')
    personal_opc_id = request.GET.get('personal_opc_id')
    supervisor_opc_id = request.GET.get('supervisor_opc_id')
    
    # Query base para leads OPC
    queryset = Lead.objects.filter(es_lead_opc=True)
    
    # Aplicar filtros de fecha
    if fecha_desde:
        queryset = queryset.filter(fecha_captacion__gte=fecha_desde)
    if fecha_hasta:
        queryset = queryset.filter(fecha_captacion__lte=fecha_hasta)
    
    # Aplicar filtros de personal OPC
    if personal_opc_id:
        queryset = queryset.filter(personal_opc_captador_id=personal_opc_id)
    if supervisor_opc_id:
        queryset = queryset.filter(supervisor_opc_captador_id=supervisor_opc_id)
    
    # Métricas básicas
    total_leads_opc = queryset.count()
    leads_asignados = queryset.filter(asesor__isnull=False).count()
    leads_sin_asignar = queryset.filter(asesor__isnull=True).count()
    
    # Tipificaciones por asesor
    tipificaciones_por_asesor = queryset.filter(
        asesor__isnull=False
    ).values(
        'asesor__username', 'asesor__first_name', 'asesor__last_name'
    ).annotate(
        total_leads=Count('id'),
        citas_confirmadas=Count('id', filter=Q(tipificacion__in=[
            'CITA - SALA', 'CITA - PROYECTO', 'CITA - HxH', 'CITA - ZOOM', 
            'CITA - POR CONFIRMAR', 'CITA - CONFIRMADA', 'YA ASISTIO'
        ])),
        seguimiento=Count('id', filter=Q(tipificacion='SEGUIMIENTO')),
        no_interesado=Count('id', filter=Q(tipificacion__icontains='NO INTERESADO')),
        no_contesta=Count('id', filter=Q(tipificacion='NO CONTESTA')),
    ).order_by('-total_leads')
    
    # Rendimiento por personal OPC
    rendimiento_personal_opc = queryset.values(
        'personal_opc_captador__nombre', 'personal_opc_captador__rol'
    ).annotate(
        total_captados=Count('id'),
        asignados=Count('id', filter=Q(asesor__isnull=False)),
        con_citas=Count('id', filter=Q(tipificacion__in=[
            'CITA - SALA', 'CITA - PROYECTO', 'CITA - HxH', 'CITA - ZOOM', 
            'CITA - POR CONFIRMAR', 'CITA - CONFIRMADA', 'YA ASISTIO'
        ])),
    ).order_by('-total_captados')
    
    # Distribución por proyecto de interés
    distribucion_proyectos = queryset.values('proyecto_interes').annotate(
        total=Count('id')
    ).order_by('-total')
    
    # Distribución por medio de captación
    distribucion_medios = queryset.values('medio').annotate(
        total=Count('id')
    ).order_by('-total')
    
    # Leads de los últimos 30 días
    fecha_30_dias_atras = datetime.now().date() - timedelta(days=30)
    leads_ultimos_30_dias = queryset.filter(
        fecha_captacion__gte=fecha_30_dias_atras
    ).count()
    
    return Response({
        'total_leads_opc': total_leads_opc,
        'leads_asignados': leads_asignados,
        'leads_sin_asignar': leads_sin_asignar,
        'porcentaje_asignacion': (leads_asignados / total_leads_opc * 100) if total_leads_opc > 0 else 0,
        'leads_ultimos_30_dias': leads_ultimos_30_dias,
        'tipificaciones_por_asesor': list(tipificaciones_por_asesor),
        'rendimiento_personal_opc': list(rendimiento_personal_opc),
        'distribucion_proyectos': list(distribucion_proyectos),
        'distribucion_medios': list(distribucion_medios),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_metrics(request):
    """
    Endpoint para obtener métricas y datos para el panel de control.
    Filtros:
    - asesor_id (opcional): ID del asesor para filtrar.
    - fecha_desde (opcional): Fecha de inicio para el filtro (YYYY-MM-DD).
    - fecha_hasta (opcional): Fecha de fin para el filtro (YYYY-MM-DD).
    - context (opcional): Si es 'gestion', excluir directeos.
    """
    asesor_id = request.query_params.get('asesor_id')
    fecha_desde_str = request.query_params.get('fecha_desde')
    fecha_hasta_str = request.query_params.get('fecha_hasta')
    context = request.query_params.get('context')

    leads_queryset = Lead.objects.all()
    appointments_queryset = Appointment.objects.all()

    if context == 'gestion':
        leads_queryset = leads_queryset.filter(es_directeo=False)

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
    leads_gestionados = leads_queryset.exclude(tipificacion__isnull=True).exclude(tipificacion__exact='').count()
    citas_confirmadas = appointments_queryset.filter(has_ever_been_confirmed=True).count()
    presencias = appointments_queryset.filter(estado='Realizada').count()

    # Tasa de conversión a citas: citas confirmadas / leads gestionados
    tasa_conversion_citas = (citas_confirmadas / leads_gestionados * 100) if leads_gestionados > 0 else 0
    # Tasa de conversión a presencias (como estaba antes)
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
            'leads_gestionados': leads_gestionados,
            'citas_confirmadas_global': citas_confirmadas,
            'presencias_global': presencias,
            'tasa_conversion_citas': round(tasa_conversion_citas, 2),
            'tasa_conversion_global': round(tasa_conversion_global, 2),
        },
        'rendimiento_asesores': asesores_data,
        'distribucion_distritos': distritos_data,
        'fuente_leads': fuente_leads_data,
        'embudo_ventas': embudo_data,
    }

    return Response(response_data)

class LeadDuplicateViewSet(viewsets.ModelViewSet):
    queryset = LeadDuplicate.objects.all().select_related('original_lead', 'asesor', 'captador')
    serializer_class = LeadDuplicateSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['nombre', 'celular', 'email', 'estado', 'asesor__username', 'captador__nombre']
    ordering_fields = ['fecha_importacion', 'nombre', 'celular', 'estado']
    pagination_class = StandardResultsSetPagination

    @action(detail=True, methods=['post'])
    def fusionar(self, request, pk=None):
        duplicado = self.get_object()
        lead = duplicado.original_lead
        if not lead:
            return Response({'error': 'No hay lead original para fusionar.'}, status=400)
        # Lógica de fusión: actualiza campos del lead original con los del duplicado si están vacíos
        campos = ['nombre', 'celular', 'email', 'asesor', 'captador', 'fecha_interaccion', 'observacion', 'observacion_opc', 'proyecto_interes', 'ubicacion', 'medio', 'distrito', 'tipificacion', 'calle_o_modulo']
        for campo in campos:
            valor_duplicado = getattr(duplicado, campo, None)
            if valor_duplicado and not getattr(lead, campo, None):
                setattr(lead, campo, valor_duplicado)
        lead.save()
        duplicado.estado = 'fusionado'
        duplicado.save()
        return Response({'message': 'Lead fusionado correctamente.'})

    @action(detail=True, methods=['post'])
    def ignorar(self, request, pk=None):
        duplicado = self.get_object()
        duplicado.estado = 'ignorado'
        duplicado.save()
        return Response({'message': 'Duplicado marcado como ignorado.'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_webhook_integration(request):
    """
    Endpoint para probar la integración con la app comercial.
    Permite enviar un webhook de prueba con datos de ejemplo.
    """
    try:
        # Buscar una cita reciente para usar como ejemplo
        appointment = Appointment.objects.filter(estado='Realizada').order_by('-fecha_hora').first()
        
        if not appointment:
            return Response({
                'error': 'No se encontró ninguna cita realizada para usar como ejemplo.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Enviar webhook de prueba
        success = webhook_service.send_presence_notification(appointment)
        
        if success:
            return Response({
                'message': 'Webhook enviado exitosamente',
                'appointment_id': appointment.id,
                'lead_name': appointment.lead.nombre
            })
        else:
            return Response({
                'error': 'Error al enviar webhook. Revisar logs para más detalles.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        return Response({
            'error': f'Error inesperado: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)