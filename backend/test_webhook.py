#!/usr/bin/env python
"""
Script de prueba para verificar la integración webhook entre CRM y app comercial.
"""

import requests
import json
import os
import sys
import django

# Configurar Django para el CRM
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')
django.setup()

from leads.models import Appointment, Lead
from leads.services import webhook_service

def test_webhook_integration():
    """Prueba la integración webhook enviando datos de prueba."""
    
    print("=== PRUEBA DE INTEGRACIÓN WEBHOOK CRM -> APP COMERCIAL ===")
    
    # Verificar configuración
    print(f"URL del webhook: {webhook_service.webhook_url}")
    print(f"Token configurado: {'Sí' if webhook_service.webhook_token else 'No'}")
    
    if not webhook_service.webhook_url or not webhook_service.webhook_token:
        print("❌ ERROR: Webhook URL o Token no configurados")
        return False
    
    # Buscar una cita realizada para usar como ejemplo
    appointment = Appointment.objects.filter(estado='Realizada').first()
    
    if not appointment:
        print("❌ ERROR: No se encontró ninguna cita realizada para usar como ejemplo")
        print("Crea una cita y márcala como 'Realizada' primero")
        return False
    
    print(f"✅ Usando cita ID: {appointment.id}")
    print(f"   Lead: {appointment.lead.nombre}")
    print(f"   Estado: {appointment.estado}")
    print(f"   Fecha: {appointment.fecha_hora}")
    
    # Enviar webhook
    print("\n📤 Enviando webhook...")
    success = webhook_service.send_presence_notification(appointment)
    
    if success:
        print("✅ Webhook enviado exitosamente")
        print("\n📋 Verifica en la app comercial:")
        print("   1. Ve a la página de Presencias")
        print("   2. Abre el modal de 'Registrar Nueva Presencia'")
        print("   3. En el desplegable de clientes debería aparecer el cliente del CRM")
        print("   4. También debería aparecer en la lista de presencias")
        return True
    else:
        print("❌ Error al enviar webhook")
        return False

def test_direct_webhook():
    """Prueba directa del webhook con datos de ejemplo."""
    
    print("\n=== PRUEBA DIRECTA DEL WEBHOOK ===")
    
    webhook_url = "http://localhost:8000/api/gestion/webhook-presencia-crm/"
    webhook_token = "jcc-webhook-secret-token-2024"
    
    test_data = {
        "id_presencia_crm": "test-direct-001",
        "cliente": {
            "nombres_completos_razon_social": "María García Test",
            "numero_documento": "87654321",
            "telefono_principal": "987654321",
            "email_principal": "maria.test@email.com",
            "direccion": "Lima, Perú"
        },
        "fecha_hora_presencia": "2024-01-15T14:30:00Z",
        "proyecto_interes": "OASIS 2 (AUCALLAMA)",
        "modalidad": "presencial",
        "status_presencia": "realizada",
        "medio_captacion": "campo_opc",
        "resultado_interaccion": "interesado_seguimiento",
        "observaciones": "Cliente de prueba directa desde script"
    }
    
    headers = {
        'Content-Type': 'application/json',
        'X-CRM-Webhook-Token': webhook_token
    }
    
    try:
        print(f"📤 Enviando datos de prueba a: {webhook_url}")
        response = requests.post(webhook_url, json=test_data, headers=headers, timeout=30)
        
        print(f"📥 Respuesta - Status: {response.status_code}")
        print(f"📥 Respuesta - Body: {response.text}")
        
        if response.status_code == 200:
            print("✅ Webhook directo funcionó correctamente")
            return True
        else:
            print("❌ Error en webhook directo")
            return False
            
    except Exception as e:
        print(f"❌ Error de conexión: {str(e)}")
        return False

if __name__ == "__main__":
    print("Iniciando pruebas de integración webhook...")
    
    # Prueba 1: Webhook directo
    test1_success = test_direct_webhook()
    
    # Prueba 2: Webhook desde servicio del CRM
    test2_success = test_webhook_integration()
    
    print("\n=== RESUMEN DE PRUEBAS ===")
    print(f"Prueba directa: {'✅ PASÓ' if test1_success else '❌ FALLÓ'}")
    print(f"Prueba desde CRM: {'✅ PASÓ' if test2_success else '❌ FALLÓ'}")
    
    if test1_success and test2_success:
        print("\n🎉 ¡Todas las pruebas pasaron! La integración está funcionando.")
    else:
        print("\n⚠️  Algunas pruebas fallaron. Revisa la configuración.") 