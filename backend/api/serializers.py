from rest_framework import serializers
from .models import *
from django.contrib.auth import get_user_model
User = get_user_model()
from django.contrib.auth import authenticate


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'usernameIFC', 'country', 'password', 'confirm_password']

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("As senhas não coincidem.")
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')  # Remove o campo confirm_password
        # Define o username como o email
        validated_data['username'] = validated_data['email']
        user = User.objects.create_user(**validated_data)
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        if email and password:
            user = authenticate(email=email, password=password)
            if user:
                data['user'] = user
            else:
                raise serializers.ValidationError("Invalid credentials")
        else:
            raise serializers.ValidationError("Email and password are required")

        # Retorne os dados validados
        return data
    
class LandingReportBriefSerializer(serializers.ModelSerializer):
    """Resumo do relatório de pouso — incluído no PIREP."""
    class Meta:
        model = LandingReport
        fields = ['score', 'vs_touchdown', 'g_force', 'bounce_count', 'status',
                  'fuel_weight_kg', 'landing_lat', 'landing_lon',
                  'ias_violations', 'unstable_approaches', 'deductions', 'flight_path']

class PirepsFlightSerializer(serializers.ModelSerializer):
    pilot_name    = serializers.ReadOnlyField(source='pilot.get_full_name')
    pilot_country = serializers.ReadOnlyField(source='pilot.country')
    landing_report = LandingReportBriefSerializer(read_only=True)

    class Meta:
        model = PirepsFlight
        fields = ('id', 'flight_icao', 'flight_number', 'departure_airport', 'arrival_airport',
                  'aircraft', 'flight_duration', 'network', 'registration_date', 'status',
                  'submission_type', 'observation', 'pilot_name', 'pilot_country', 'livery_id',
                  'landing_report')
        read_only_fields = ('pilot',)

class AwardsSerializer(serializers.ModelSerializer):
    total_legs = serializers.SerializerMethodField()  # Campo calculado para o total de pernas
    allowed_aircrafts = serializers.SerializerMethodField()
    allowed_categories = serializers.SerializerMethodField()

    class Meta:
        model = Award
        fields = '__all__'

    def get_allowed_aircrafts(self, obj):
        # Local nested serialization to avoid circular dependencies if any
        direct_aircrafts = [{"id": a.id, "aircraft_id": str(a.aircraft.if_id), "aircraft_name": a.aircraft.name} for a in obj.allowed_aircrafts.all()]
        
        # Include aircrafts from allowed categories
        allowed_cats = [c.category for c in obj.allowed_categories.all()]
        if allowed_cats:
            from .models import Aircraft
            cat_aircrafts = Aircraft.objects.filter(category__in=allowed_cats)
            for ac in cat_aircrafts:
                if not any(d['aircraft_id'] == str(ac.if_id) for d in direct_aircrafts):
                    direct_aircrafts.append({
                        "id": f"cat-{ac.if_id}",
                        "aircraft_id": str(ac.if_id),
                        "aircraft_name": ac.name
                    })
        return direct_aircrafts

    def get_allowed_categories(self, obj):
        return [{"id": c.id, "category": c.category} for c in obj.allowed_categories.all()]


    def get_total_legs(self, obj):
        # Retorna o número total de pernas associadas ao prêmio
        return obj.flight_legs.count()

class FlightLegSerializer(serializers.ModelSerializer):
    class Meta:
        model = FlightLeg
        fields = '__all__'

class AllowedAircraftSerializer(serializers.ModelSerializer):
    aircraft_name = serializers.CharField(source='aircraft.name', read_only=True)
    aircraft_id = serializers.UUIDField(source='aircraft.if_id', read_only=True)

    class Meta:
        model = AllowedAircraft
        fields = ['id', 'aircraft', 'aircraft_name', 'aircraft_id']

class AllowedCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AllowedCategory
        fields = '__all__'

class AircraftSerializer(serializers.ModelSerializer):
    class Meta:
        model = Aircraft
        fields = '__all__'

class AllowedIcaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = AllowedIcao
        fields = '__all__'

class UserAwardSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAward
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    last_landing_score = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'country', 'usernameIFC', 'last_landing_score']

    def get_last_landing_score(self, obj):
        report = LandingReport.objects.filter(pilot=obj).order_by('-created_at').first()
        return report.score if report else None

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['email', 'usernameIFC', 'country', 'first_name', 'last_name']
        extra_kwargs = {
            'email': {'required': False},
            'usernameIFC': {'required': False},
            'country': {'required': False},
            'first_name': {'required': False},  # Add first_name
            'last_name': {'required': False},   # Add last_name
        }

    def update(self, instance, validated_data):
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.email = validated_data.get('email', instance.email)
        instance.usernameIFC = validated_data.get('usernameIFC', instance.usernameIFC)
        instance.country = validated_data.get('country', instance.country)
        instance.save()
        return instance


class LandingReportSerializer(serializers.ModelSerializer):
    pilot_name = serializers.ReadOnlyField(source='pilot.usernameIFC')

    class Meta:
        model = LandingReport
        fields = [
            'id', 'pilot', 'pilot_name', 'aircraft',
            'vs_touchdown', 'g_force', 'centerline',
            'bounce_count', 'light_infrac', 'status',
            'score', 'created_at', 'pirep'
        ]
        read_only_fields = ['id', 'pilot', 'created_at']
