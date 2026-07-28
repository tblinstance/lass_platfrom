"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from instances.views import InstanceViewSet
from images.views import ImageViewSet
from networking.views import NetworkViewSet, DnsRuleViewSet
from storage.views import StoragePoolViewSet
from operations.views import OperationViewSet
from profiles.views import ProfileViewSet
from projects.views import ProjectViewSet
from server.views import ServerViewSet
from configuration.views import ConfigurationViewSet
from settings.views import SettingsViewSet
from sys_os.views import SysOsViewSet
from sys_warnings.views import SysWarningsViewSet
from transactions.views import TransactionsViewSet, AdminBillingRequestsViewSet
from usage.views import UsageViewSet
from admin_dashboard.views import AdminDashboardViewSet
from member.views import MemberDashboardViewSet, MemberBillingViewSet
from users.views import UserManagementViewSet, UserAuthTokenView, SshKeyViewSet, WebauthnKeysViewSet
from users.google_auth import GoogleTokenLoginView


router = DefaultRouter()
router.register('instances', InstanceViewSet, basename='instance')
router.register('images', ImageViewSet, basename='image')
router.register('networks', NetworkViewSet, basename='network')
router.register('dns-rules', DnsRuleViewSet, basename='dns-rule')
router.register('storage-pools', StoragePoolViewSet, basename='storage-pool')
router.register('operations', OperationViewSet, basename='operation')
router.register('profiles', ProfileViewSet, basename='profile')
router.register('projects', ProjectViewSet, basename='project')
router.register('server', ServerViewSet, basename='server')
router.register('configuration', ConfigurationViewSet, basename='configuration')
router.register('settings', SettingsViewSet, basename='settings')
router.register('sys-os', SysOsViewSet, basename='sys-os')
router.register('sys-warnings', SysWarningsViewSet, basename='sys-warning')
router.register('transactions', TransactionsViewSet, basename='transaction')
router.register('usage', UsageViewSet, basename='usage')
router.register('admin-dashboard', AdminDashboardViewSet, basename='admin-dashboard')
router.register('admin-billing', AdminBillingRequestsViewSet, basename='admin-billing')
router.register('member-dashboard', MemberDashboardViewSet, basename='member-dashboard')
router.register('member-billing', MemberBillingViewSet, basename='member-billing')
router.register('members', UserManagementViewSet, basename='member')
router.register('auth/ssh-keys', SshKeyViewSet, basename='ssh-key')
router.register('auth/webauthn-keys', WebauthnKeysViewSet, basename='webauthn-key')

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth - Djoser (user registration, password management)
    path('api/auth/', include('djoser.urls')),
    path('api/auth/', include('djoser.social.urls')),
    path('api/auth/', include('djoser.webauthn.urls')),

    # Auth - API Key endpoint
    path('api/auth/token/', UserAuthTokenView.as_view(), name='auth-token'),

    # Auth - JWT token endpoints
    path('api/auth/jwt/create/', TokenObtainPairView.as_view(), name='jwt-create'),
    path('api/auth/jwt/refresh/', TokenRefreshView.as_view(), name='jwt-refresh'),
    path('api/auth/jwt/verify/', TokenVerifyView.as_view(), name='jwt-verify'),

    # Auth - Google OAuth (access_token exchange)
    path('api/auth/google/', GoogleTokenLoginView.as_view(), name='google-login'),

    # Incus API endpoints
    path('api/', include(router.urls)),
]

