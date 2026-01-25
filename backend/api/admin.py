from django.contrib import admin
from .models import *

class FlightLegInline(admin.TabularInline):
    model = FlightLeg
    extra = 1

class AllowedAircraftInline(admin.TabularInline):
    model = AllowedAircraft
    extra = 1

class AllowedIcaoInline(admin.TabularInline):
    model = AllowedIcao
    extra = 1

from django.db.models import Case, When, Value, IntegerField

@admin.register(PirepsFlight)
class PirepsFlightAdmin(admin.ModelAdmin):
    list_display = ('flight_icao', 'flight_number', 'pilot', 'departure_airport', 'arrival_airport', 'status')
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # Custom ordering: In Review (1), Approved (2), Rejected (3) or any other logic.
        # However, user asked "sendo que status em análise sempre vem aparecendo primeiro"
        # 'In Review' comes first.
        return qs.annotate(
            status_order=Case(
                When(status='In Review', then=Value(1)),
                When(status='Em análise', then=Value(1)), # In case of legacy data
                When(status='Approved', then=Value(2)),
                When(status='Rejected', then=Value(3)),
                default=Value(4),
                output_field=IntegerField(),
            )
        ).order_by('status_order', '-registration_date')

@admin.register(Award)
class AwardAdmin(admin.ModelAdmin):
    # Added description and name as requested
    list_display = ('name', 'description', 'type')
    inlines = [FlightLegInline, AllowedAircraftInline, AllowedIcaoInline]

# Remove the old registration for Award and PirepsFlight if they exist (Award is handled by decorator, but we'll ensure clean file)

