# Integración CRM - App Comercial

## Descripción

Esta integración permite que el CRM envíe automáticamente notificaciones de presencias realizadas a la aplicación comercial, creando un flujo de trabajo unificado entre ambos sistemas.

## Configuración

### 1. Variables de Entorno

#### En el CRM (JCC-CRM-FULL-STACK/backend/):
```bash
# URL del endpoint webhook de la app comercial
COMERCIAL_WEBHOOK_URL=http://localhost:8001/api/webhook-presencia-crm/

# Token de autenticación (debe coincidir con CRM_WEBHOOK_TOKEN en la app comercial)
COMERCIAL_WEBHOOK_TOKEN=your-secret-webhook-token-here
```

#### En la App Comercial (jcc_inmobiliaria_backend/):
```bash
# Token de autenticación (debe coincidir con COMERCIAL_WEBHOOK_TOKEN en el CRM)
CRM_WEBHOOK_TOKEN=your-secret-webhook-token-here
```

### 2. Dependencias

#### CRM:
```bash
pip install requests>=2.31.0
```

#### App Comercial:
No requiere dependencias adicionales.

## Funcionamiento

### Flujo de Integración

1. **En el CRM**: Un operador marca una cita como "Realizada"
2. **Trigger automático**: El sistema detecta el cambio de estado
3. **Envío de webhook**: Se envía una notificación a la app comercial
4. **En la app comercial**: Se crea automáticamente una Presencia y opcionalmente una Venta

### Eventos que disparan webhooks

- **Cita marcada como "Realizada"** en el CRM
- **Lead tipificado como "YA ASISTIO"** en el CRM
- **Actualización manual** de estado de cita

### Mapeo de datos

| Campo CRM | Campo App Comercial | Notas |
|-----------|---------------------|-------|
| `lead.nombre` | `cliente.nombres_completos_razon_social` | Nombre completo del cliente |
| `lead.celular` | `cliente.numero_documento` | Usado como documento temporal |
| `lead.celular` | `cliente.telefono_principal` | Teléfono principal |
| `lead.distrito` | `cliente.direccion` | Dirección del cliente |
| `appointment.fecha_hora` | `fecha_hora_presencia` | Fecha y hora de la presencia |
| `lead.proyecto_interes` | `proyecto_interes` | Proyecto de interés |
| `lead.medio` | `medio_captacion` | Mapeado según tabla de conversión |
| `appointment.lugar` | `modalidad` | Presencial/Virtual según lugar |

### Mapeo de medios de captación

| Medio CRM | Medio App Comercial |
|-----------|---------------------|
| OPC | campo_opc |
| Facebook | redes_facebook |
| Instagram | redes_instagram |
| TikTok | redes_tiktok |
| Referido | referido |
| Web | web |
| Otros | otro |

## Endpoints

### CRM - Envío de webhooks

- **Automático**: Se envía cuando una cita se marca como "Realizada"
- **Manual**: `POST /api/test-webhook/` - Para probar la integración

### App Comercial - Recepción de webhooks

- **Endpoint**: `POST /api/webhook-presencia-crm/`
- **Autenticación**: Header `X-CRM-Webhook-Token`
- **Formato**: JSON con datos de presencia y cliente

## Formato del Payload

```json
{
  "id_presencia_crm": "CRM-123",
  "cliente": {
    "nombres_completos_razon_social": "Juan Pérez",
    "tipo_documento": "DNI",
    "numero_documento": "12345678",
    "telefono_principal": "999888777",
    "email_principal": "juan@email.com",
    "direccion": "Lima",
    "distrito": "Lima"
  },
  "fecha_hora_presencia": "2024-01-15T14:30:00",
  "proyecto_interes": "OASIS 2 (AUCALLAMA)",
  "medio_captacion": "campo_opc",
  "modalidad": "presencial",
  "status_presencia": "realizada",
  "resultado_interaccion": "interesado_seguimiento",
  "observaciones": "Presencia desde CRM. Lugar: Sala de ventas."
}
```

## Testing

### 1. Probar desde el CRM

```bash
# Hacer POST al endpoint de prueba
curl -X POST http://localhost:8000/api/test-webhook/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### 2. Probar desde la app comercial

```bash
# Simular webhook desde el CRM
curl -X POST http://localhost:8001/api/webhook-presencia-crm/ \
  -H "X-CRM-Webhook-Token: your-secret-webhook-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "id_presencia_crm": "TEST-001",
    "cliente": {
      "nombres_completos_razon_social": "Cliente Test",
      "tipo_documento": "DNI",
      "numero_documento": "12345678",
      "telefono_principal": "999888777"
    },
    "fecha_hora_presencia": "2024-01-15T14:30:00",
    "proyecto_interes": "OASIS 2 (AUCALLAMA)",
    "medio_captacion": "campo_opc",
    "modalidad": "presencial",
    "status_presencia": "realizada"
  }'
```

## Troubleshooting

### Problemas comunes

1. **Webhook no se envía**
   - Verificar que las variables de entorno estén configuradas
   - Revisar logs del CRM para errores de conexión
   - Confirmar que la URL del webhook sea accesible

2. **Error de autenticación**
   - Verificar que `COMERCIAL_WEBHOOK_TOKEN` y `CRM_WEBHOOK_TOKEN` coincidan
   - Confirmar que el header `X-CRM-Webhook-Token` se esté enviando

3. **Datos no se mapean correctamente**
   - Revisar el mapeo de campos en `services.py`
   - Verificar que los datos del CRM estén completos

4. **Duplicados en la app comercial**
   - El sistema busca presencias existentes por `id_presencia_crm`
   - Verificar que el ID sea único

### Logs

Los logs se guardan en:
- **CRM**: `backend/logs/` (configurar según Django)
- **App Comercial**: `backend/logs/` (configurar según Django)

### Monitoreo

Para monitorear la integración:
1. Revisar logs periódicamente
2. Usar el endpoint de prueba para verificar conectividad
3. Verificar que las presencias se creen en la app comercial

## Seguridad

- Los webhooks usan autenticación por token
- Las URLs deben ser HTTPS en producción
- Los tokens deben ser secretos y únicos
- Considerar rate limiting para prevenir abuso

## Escalabilidad

- Los webhooks se envían de forma asíncrona
- Los errores no bloquean las operaciones principales
- Se puede implementar reintentos automáticos
- Considerar usar colas de mensajes para alta concurrencia 