# backend/leads/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
# Asegúrate de importar TODOS los modelos necesarios
from .models import Lead, User, Action, Appointment
# Asegúrate de importar TODOS los serializadores necesarios
from .serializers import LeadSerializer, UserSerializer, ActionSerializer, AppointmentSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination

# Importaciones para el filtro y búsqueda
from django_filters.rest_framework import DjangoFilterBackend # Importa DjangoFilterBackend
from django_filters import FilterSet # Importa FilterSet (para LeadFilter)
from django_filters.rest_framework import DateFromToRangeFilter # Importa DateFromToRangeFilter (para LeadFilter)
from rest_framework.filters import SearchFilter, OrderingFilter # <--- ¡NUEVA LÍNEA! Importa SearchFilter y OrderingFilter

from django.db import transaction # Para manejar transacciones atómicas
import csv
import io


# Paginación personalizada para Leads
class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10 # Define el tamaño de página por defecto para este ViewSet
    page_size_query_param = 'page_size' # Permite al cliente especificar el tamaño de página (ej. /api/leads/?page_size=20)
    max_page_size = 100 # Límite máximo para page_size_query_param


# Define un FilterSet para el modelo Lead
class LeadFilter(FilterSet):
    fecha_creacion = DateFromToRangeFilter()
    ultima_actualizacion = DateFromToRangeFilter()

    class Meta:
        model = Lead
        fields = {
            'asesor': ['exact'],
            'proyecto': ['exact', 'icontains'],
            'medio': ['exact'],
            'distrito': ['exact', 'icontains'],
            'tipificacion': ['exact'],
            'fecha_creacion': ['gte', 'lte'],
            'ultima_actualizacion': ['gte', 'lte'],
        }


# ViewSet para los Leads (proporciona operaciones CRUD para los leads)
class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all().select_related('asesor').order_by('-fecha_creacion')
    serializer_class = LeadSerializer
    permission_classes = [IsAuthenticated]

    # Configuración de filtros, búsqueda y ordenamiento
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter] # <--- Ahora SearchFilter y OrderingFilter estarán definidos
    filterset_class = LeadFilter
    search_fields = ['nombre', 'celular', 'proyecto', 'distrito', 'observacion']
    ordering_fields = ['fecha_creacion', 'ultima_actualizacion', 'nombre', 'tipificacion', 'celular', 'proyecto']

    pagination_class = StandardResultsSetPagination


    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

    @action(detail=True, methods=['get'])
    def actions(self, request, pk=None):
        lead = self.get_object()
        actions = lead.actions.all().order_by('-fecha_accion')
        serializer = ActionSerializer(actions, many=True)
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
            # Contar total de filas en CSV antes de procesar
            io_string.seek(0)
            reader_for_total = csv.reader(io.StringIO(data_set))
            # Suma 1 para el encabezado si el CSV tiene al menos 1 fila
            total_filas_en_csv = sum(1 for row in reader_for_total) - 1 if sum(1 for row in csv.reader(io.StringIO(data_set))) > 0 else 0

            # Re-inicializar reader para el bucle de procesamiento
            io_string.seek(0)
            reader = csv.DictReader(io_string)


            for row_num, row in enumerate(reader, start=1):
                try:
                    clean_row = {k.strip().lower().replace(' ', '_'): v.strip() for k, v in row.items()}

                    nombre = clean_row.get('nombre')
                    celular = clean_row.get('celular')
                    proyecto = clean_row.get('proyecto')
                    medio = clean_row.get('medio')
                    distrito = clean_row.get('distrito')
                    tipificacion = clean_row.get('tipificacion', 'Nuevo')
                    observacion = clean_row.get('observacion')
                    opc = clean_row.get('opc')
                    observacion_opc = clean_row.get('observacion_opc')
                    
                    current_asesor = asesores_activos[asesor_index]
                    asesor_index = (asesor_index + 1) % len(asesores_activos)

                    if not celular or not nombre or not proyecto:
                        errores.append(f"Fila {row_num}: Celular, Nombre o Proyecto faltantes.")
                        continue

                    lead_obj, created = Lead.objects.update_or_create(
                        celular=celular,
                        defaults={
                            'nombre': nombre,
                            'proyecto': proyecto,
                            'medio': medio,
                            'distrito': distrito,
                            'tipificacion': tipificacion,
                            'observacion': observacion,
                            'opc': opc,
                            'observacion_opc': observacion_opc,
                            'asesor': current_asesor,
                        }
                    )
                    if created:
                        leads_creados += 1
                    else:
                        leads_actualizados += 1

                except Exception as e:
                    errores.append(f"Fila {row_num}: Error al procesar '{row.get('nombre', 'N/A')}' - {e}")
                    # transaction.set_rollback(True) # Opcional: Si un error en una fila debe abortar toda la carga

            return Response({
                'message': 'Proceso de carga de CSV completado.',
                'leads_creados': leads_creados,
                'leads_actualizados': leads_actualizados,
                'errores': errores,
                'total_filas_procesadas': total_filas_en_csv,
            }, status=status.HTTP_200_OK if not errores else status.HTTP_206_PARTIAL_CONTENT)


# ViewSet para los Usuarios (asesores) - solo lectura
class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all().order_by('username')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

# ViewSet para las Citas (proporciona operaciones CRUD para las citas)
class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all().select_related('lead', 'asesor_comercial', 'asesor_presencial').order_by('-fecha_hora')
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['lead', 'asesor_comercial', 'asesor_presencial', 'estado']
    ordering_fields = ['fecha_hora', 'estado']
    pagination_class = StandardResultsSetPagination # Las citas también pueden usar paginación

    def perform_create(self, serializer):
        if not serializer.validated_data.get('asesor_comercial'):
            serializer.validated_data['asesor_comercial'] = self.request.user
        
        appointment = serializer.save()

        if appointment.lead and appointment.lead.tipificacion not in ['Cita Confirmada', 'Cita Realizada', 'Descartado']:
            appointment.lead.tipificacion = 'Cita Agendada'
            appointment.lead.save()

    def perform_update(self, serializer):
        old_estado = serializer.instance.estado
        appointment = serializer.save()

        if old_estado != 'Confirmada' and appointment.estado == 'Confirmada':
            if appointment.lead and appointment.lead.tipificacion not in ['Cita Confirmada', 'Cita Realizada']:
                appointment.lead.tipificacion = 'Cita Confirmada'
                appointment.lead.save()
        elif old_estado != 'Realizada' and appointment.estado == 'Realizada':
            if appointment.lead and appointment.lead.tipificacion != 'Cita Realizada':
                appointment.lead.tipificacion = 'Cita Realizada'
                appointment.lead.save()
        elif appointment.estado in ['Cancelada', 'Reprogramada']:
            if appointment.lead and appointment.lead.tipificacion not in ['Descartado', 'Cita Realizada']:
                appointment.lead.tipificacion = 'Seguimiento'
                appointment.lead.save()

    def perform_destroy(self, instance):
        lead = instance.lead
        super().perform_destroy(instance)

        if lead and not lead.appointments.exists() and lead.tipificacion in ['Cita Agendada', 'Cita Confirmada', 'Cita Realizada', 'Seguimiento']:
            lead.tipificacion = 'Contactado'
            lead.save()