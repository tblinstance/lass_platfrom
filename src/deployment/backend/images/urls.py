from django.urls import path, include
from rest_framework.routers import DefaultRouter
from images.views import ImageViewSet

router = DefaultRouter()
router.register('', ImageViewSet, basename='image')

urlpatterns = [
    path('', include(router.urls)),
]
