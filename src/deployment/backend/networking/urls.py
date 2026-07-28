from django.urls import path, include
from rest_framework.routers import DefaultRouter
from networking.views import NetworkViewSet

router = DefaultRouter()
router.register('', NetworkViewSet, basename='network')

urlpatterns = [
    path('', include(router.urls)),
]
