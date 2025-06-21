#!/usr/bin/env python
"""
Script para mapear leads OPC existentes basándose en el medio de captación
"""

import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')
django.setup()

from leads.models import Lead
from django.db.models import Count, Q

def map_existing_opc_leads():
    """Identifica y marca leads OPC existentes basándose en el medio de captación"""
    
    # Medios de captación que indican que es un lead OPC
    opc_media = [
        'Campo (Centros Comerciales)',
        'Campo',
        'Centros Comerciales',
        'Centro Comercial',
        'CC',
        'OPC',
        'Personal OPC',
    ]
    
    # Buscar leads que tienen estos medios pero no están marcados como OPC
    leads_to_update = Lead.objects.filter(
        medio__in=opc_media,
        es_lead_opc=False
    )
    
    print(f"Encontrados {leads_to_update.count()} leads OPC que necesitan ser marcados")
    
    count = 0
    for lead in leads_to_update:
        lead.es_lead_opc = True
        lead.save(update_fields=['es_lead_opc'])
        count += 1
        print(f"Marcado como OPC: {lead.nombre} - {lead.celular} - Medio: {lead.medio}")
    
    print(f"\nTotal de leads marcados como OPC: {count}")
    
    # Mostrar estadísticas finales
    total_opc_leads = Lead.objects.filter(es_lead_opc=True).count()
    total_leads = Lead.objects.count()
    
    print(f"\nEstadísticas finales:")
    print(f"Total de leads OPC: {total_opc_leads}")
    print(f"Total de leads: {total_leads}")
    print(f"Porcentaje de leads OPC: {(total_opc_leads/total_leads)*100:.2f}%")
    
    # Mostrar distribución por medios
    print(f"\nDistribución por medios de captación:")
    media_distribution = Lead.objects.values('medio').annotate(
        total=Count('id'),
        opc_count=Count('id', filter=Q(es_lead_opc=True))
    ).order_by('-total')
    
    for item in media_distribution:
        print(f"  {item['medio']}: {item['total']} total, {item['opc_count']} OPC")

if __name__ == '__main__':
    map_existing_opc_leads() 