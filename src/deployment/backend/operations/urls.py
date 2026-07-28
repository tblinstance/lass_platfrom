from django.urls import path, include
from rest_framework.routers import DefaultRouter
from operations.views import OperationViewSet

router = DefaultRouter()
router.register('', OperationViewSet, basename='operation')

urlpatterns = [
    path('', include(router.urls)),
]
