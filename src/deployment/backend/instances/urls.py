from django.urls import path, include
from rest_framework.routers import DefaultRouter
from instances.views import InstanceViewSet

router = DefaultRouter()
router.register('', InstanceViewSet, basename='instance')

urlpatterns = [
    path('', include(router.urls)),
]
