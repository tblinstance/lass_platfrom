from django.urls import path, include
from rest_framework.routers import DefaultRouter
from storage.views import StoragePoolViewSet

router = DefaultRouter()
router.register('', StoragePoolViewSet, basename='storage-pool')

urlpatterns = [
    path('', include(router.urls)),
]
