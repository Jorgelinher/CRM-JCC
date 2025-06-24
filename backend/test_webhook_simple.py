#!/usr/bin/env python
"""
Script de prueba simple para verificar la integración webhook entre CRM y app comercial.
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
    print("=== CON CAMBIOS IMPLEMENTADOS ===")
    
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
    print(f"   Lugar: {appointment.lugar}")
    print(f"   Distrito del lead: {appointment.lead.distrito}")
    print(f"   Medio de captación: {appointment.lead.medio}")
    print(f"   Personal OPC captador: {appointment.lead.personal_opc_captador.nombre if appointment.lead.personal_opc_captador else 'N/A'}")
    
    # Enviar webhook
    print("\n📤 Enviando webhook con cambios implementados...")
    success = webhook_service.send_presence_notification(appointment)
    
    if success:
        print("✅ Webhook enviado exitosamente")
        print("\n📋 Resumen de cambios implementados:")
        print("   - DNI: Vacío (para edición manual en app comercial)")
        print("   - Teléfono principal: Del CRM")
        print("   - Dirección: Distrito del CRM")
        print("   - Asesor captador OPC: Automático")
        print("   - Medio de captación: Mapeo mejorado")
        print("   - Modalidad: Determinación automática")
        return True
    else:
        print("❌ Error al enviar webhook")
        return False

if __name__ == "__main__":
    test_webhook_integration() 