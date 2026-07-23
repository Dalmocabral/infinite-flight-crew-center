from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import *  # Importe todas as views, incluindo CurrentUserView

router = DefaultRouter()
router.register('register', RegisterViewSet, basename='register')
router.register('login', LoginViewset, basename='login')
router.register('users', UserViewset, basename='users')
router.register('pirepsflight', PirepsFlightViewset)
router.register('myflights', MyFlightsViewSet, basename='myflights')
router.register('dashboard', DashboardViewSet, basename='dashboard')
router.register(r'awards', AwardViewSet)
router.register(r'flight-legs', FlightLegViewSet)
router.register(r'aircrafts', AircraftViewSet, basename='aircrafts')
router.register(r'allowed-aircrafts', AllowedAircraftViewSet)
router.register(r'allowed-icaos', AllowedIcaoViewSet)
router.register(r'user-awards', UserAwardViewSet)
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'users', UserDetailViewSet, basename='user-detail')  # Registra a ViewSet
router.register(r'user-metrics', UserMetricsViewSet, basename='user-metrics')
router.register(r'user-approved-flights', UserApprovedFlightsViewSet, basename='user-approved-flights')
router.register(r'charts', ChartViewSet, basename='charts')


# Adicione a rota manualmente para o endpoint users/me/
urlpatterns = [
    path('users/me/', CurrentUserView.as_view(), name='current-user'),
    path('profile/update/', ProfileUpdateView.as_view(), name='profile-update'),
    path("flight-stats/", FlightStatsView.as_view(), name="flight-stats"),
    path('api/validate-token/', ValidateTokenView.as_view(), name='validate-token'),
    path('landing-report/', LandingReportView.as_view(), name='landing-report'),
    path('reactivate-account/', ReactivateAccountView.as_view(), name='reactivate-account'),
    path('request-reactivation-email/', RequestReactivationEmailView.as_view(), name='request-reactivation-email'),
    path('announcements/', AnnouncementListView.as_view(), name='announcements'),
    path('delete-account/', DeleteAccountView.as_view(), name='delete-account'),
]

# Inclua as rotas do router
urlpatterns += router.urls