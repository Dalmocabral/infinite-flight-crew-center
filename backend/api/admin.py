from django.contrib import admin
from .models import *

class FlightLegInline(admin.TabularInline):
    model = FlightLeg
    extra = 1

@admin.register(Aircraft)
class AircraftAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'if_id')
    list_editable = ('category',)
    search_fields = ('name',)
    list_filter = ('category',)

class AllowedAircraftInline(admin.TabularInline):
    model = AllowedAircraft
    extra = 1
    autocomplete_fields = ['aircraft']

class AllowedCategoryInline(admin.TabularInline):
    model = AllowedCategory
    extra = 1

class AllowedIcaoInline(admin.TabularInline):
    model = AllowedIcao
    extra = 1

from django.utils.html import format_html
from django.db.models import Case, When, Value, IntegerField

@admin.register(PirepsFlight)
class PirepsFlightAdmin(admin.ModelAdmin):
    list_display = ('flight_icao', 'flight_number', 'pilot', 'departure_airport', 'arrival_airport', 'status')
    readonly_fields = ('if_live_flights',)
    
    def if_live_flights(self, obj):
        import json
        from django.utils.safestring import mark_safe
        
        if not obj or not obj.pilot or not obj.pilot.usernameIFC:
            return format_html("<span style='color:red;'>Nenhum usuário do Infinite Flight (usernameIFC) associado a este piloto.</span>")
            
        username = obj.pilot.usernameIFC
        api_key = '36d1c8xdt1zvxn9cqqs9pxr7dty8rhm4'
        origin = getattr(obj, 'departure_airport', '')
        destination = getattr(obj, 'arrival_airport', '')
        
        # Build mapping dictionary for Aircraft UUIDs to Names
        aircrafts = {str(a.if_id): a.name for a in Aircraft.objects.all()}
        aircrafts_json = mark_safe(json.dumps(aircrafts))
        
        # Build mapping for Livery UUIDs to Aircraft Names
        liveries = {str(l.livery_id): l.aircraft.name for l in Livery.objects.select_related('aircraft').all()}
        liveries_json = mark_safe(json.dumps(liveries))
        
        return format_html("""
        <div id="if-flights-loader" style="padding: 10px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
            <p style="margin: 0;"><strong>📡 Buscando voos reais na API do Infinite Flight...</strong></p>
            <p style="margin: 0; font-size: 12px; color: #92400e;">Procurando pelo histórico de: {username}</p>
        </div>
        <div id="if-flights-table-container" style="display:none; margin-top: 10px; width: 100%; overflow-x: auto; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-family: ui-sans-serif, system-ui, sans-serif;">
                <thead style="background-color: #f3f4f6; color: #374151; font-size: 13px; text-transform: uppercase;">
                    <tr>
                        <th style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">Data / Hora</th>
                        <th style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">Origem</th>
                        <th style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">Destino</th>
                        <th style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">Tempo de Voo</th>
                        <th style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">XP Obtido</th>
                        <th style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">Aeronave</th>
                    </tr>
                </thead>
                <tbody id="if-flights-tbody" style="background-color: #ffffff; color: #111827; font-size: 14px;">
                </tbody>
            </table>
        </div>
        <script>
            (function() {{
                const username = "{username}";
                const apiKey = "{api_key}";
                const targetOrigin = "{origin}";
                const targetDest = "{destination}";
                const aircraftMap = {aircrafts_json};
                const liveryMap = {liveries_json};
                
                async function fetchFlights() {{
                    try {{
                        // 1. Get UserId
                        const userRes = await fetch("https://api.infiniteflight.com/public/v2/users?apikey=" + apiKey, {{
                            method: "POST",
                            headers: {{ "Content-Type": "application/json" }},
                            body: JSON.stringify({{ discourseNames: [username] }})
                        }});
                        const userData = await userRes.json();
                        
                        if (!userData.result || userData.result.length === 0) {{
                            document.getElementById('if-flights-loader').innerHTML = "<p style='color:red; margin: 0;'>❌ Usuário IFC (" + username + ") não encontrado.</p>";
                            return;
                        }}
                        
                        const userId = userData.result[0].userId;
                        
                        // 2. Get Flights
                        const flightRes = await fetch("https://api.infiniteflight.com/public/v2/users/" + userId + "/flights?apikey=" + apiKey);
                        const flightData = await flightRes.json();
                        
                        if (!flightData.result || !flightData.result.data || flightData.result.data.length === 0) {{
                            document.getElementById('if-flights-loader').innerHTML = "<p style='color:orange; margin: 0;'>⚠️ Nenhum voo encontrado no logbook deste usuário.</p>";
                            return;
                        }}
                        
                        const flights = flightData.result.data.slice(0, 10);
                        const tbody = document.getElementById('if-flights-tbody');
                        
                        flights.forEach(f => {{
                            const tr = document.createElement('tr');
                            tr.style.borderBottom = "1px solid #e5e7eb";
                            
                            const dateObj = new Date(f.created);
                            const dateStr = dateObj.toLocaleDateString('pt-BR') + ' ' + dateObj.toLocaleTimeString('pt-BR');
                            
                            // Format Duration (f.totalTime is in minutes)
                            const totalMinutes = f.totalTime || 0;
                            const hours = Math.floor(totalMinutes / 60);
                            const mins = Math.floor(totalMinutes % 60);
                            const duration = hours > 0 ? `${{hours}}h ${{mins}}m` : `${{mins}}m`;
                            
                            // Highlight if it matches the current Pirep
                            const isMatch = (f.originAirport === targetOrigin && f.destinationAirport === targetDest);
                            if (isMatch) {{
                                tr.style.backgroundColor = "#dcfce7"; // light green for exact match
                            }} else {{
                                tr.style.backgroundColor = "#ffffff";
                            }}
                            
                            const matchBadge = isMatch ? '<br><span style="background-color: #22c55e; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">VOO REPORTADO</span>' : '';
                            
                            // Get Aircraft Name
                            let aircraftName = aircraftMap[f.aircraftId];
                            if (!aircraftName || f.aircraftId === '00000000-0000-0000-0000-000000000000') {{
                                aircraftName = liveryMap[f.liveryId] || f.aircraftId || '-';
                            }}
                            
                            tr.innerHTML = `
                                <td style="padding: 12px 16px;">${{dateStr}}${{matchBadge}}</td>
                                <td style="padding: 12px 16px; font-weight: bold;">${{f.originAirport || '-'}}</td>
                                <td style="padding: 12px 16px; font-weight: bold;">${{f.destinationAirport || '-'}}</td>
                                <td style="padding: 12px 16px;">${{duration}}</td>
                                <td style="padding: 12px 16px;">+${{f.xp || 0}} XP</td>
                                <td style="padding: 12px 16px; font-size: 12px; color: #4b5563; font-weight: 500;">${{aircraftName}}</td>
                            `;
                            tbody.appendChild(tr);
                        }});
                        
                        document.getElementById('if-flights-loader').style.display = 'none';
                        document.getElementById('if-flights-table-container').style.display = 'block';
                        
                    }} catch (err) {{
                        console.error(err);
                        document.getElementById('if-flights-loader').innerHTML = "<p style='color:red; margin: 0;'>❌ Erro de comunicação com a API do Infinite Flight: " + err.message + "</p>";
                    }}
                }}
                
                setTimeout(fetchFlights, 300);
            }})();
        </script>
        """, username=username, api_key=api_key, origin=origin, destination=destination, aircrafts_json=aircrafts_json, liveries_json=liveries_json)
    if_live_flights.short_description = 'Últimos 10 Voos no Infinite Flight (API Real)'
    
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
    inlines = [FlightLegInline, AllowedAircraftInline, AllowedCategoryInline, AllowedIcaoInline]

# Remove the old registration for Award and PirepsFlight if they exist (Award is handled by decorator, but we'll ensure clean file)

@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('email', 'first_name', 'last_name', 'usernameIFC', 'is_active_pilot', 'last_login')
    search_fields = ('email', 'first_name', 'last_name', 'usernameIFC')
    list_filter = ('is_active_pilot', 'is_staff', 'is_superuser')
    readonly_fields = ('last_login', 'date_joined')
    fieldsets = (
        ('Personal Info', {'fields': ('email', 'first_name', 'last_name', 'usernameIFC', 'country')}),
        ('Permissions', {'fields': ('is_active_pilot', 'is_active', 'is_staff', 'is_superuser')}),
        ('Important Dates', {'fields': ('last_login', 'date_joined')}),
    )

@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'date_posted')
    search_fields = ('title', 'content')
