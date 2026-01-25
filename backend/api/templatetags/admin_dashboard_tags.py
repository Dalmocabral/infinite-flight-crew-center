from django import template
from api.models import PirepsFlight
from django.db.models import Count
import json

register = template.Library()

@register.simple_tag
def get_pirep_stats():
    # Aggregate counts by status
    stats = PirepsFlight.objects.values('status').annotate(count=Count('id'))
    
    # Initialize counts
    in_review = 0
    approved = 0
    rejected = 0
    
    # Map results
    for item in stats:
        if item['status'] == 'In Review' or item['status'] == 'Em análise':
            in_review += item['count']
        elif item['status'] == 'Approved':
            approved += item['count']
        elif item['status'] == 'Rejected':
            rejected += item['count']
            
    return {
        'in_review': in_review,
        'approved': approved,
        'rejected': rejected,
        'total': in_review + approved + rejected
    }

@register.filter
def as_json(value):
    return json.dumps(value)
