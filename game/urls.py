from django.urls import path

from . import views

app_name = 'game'

urlpatterns = [
    path('', views.index, name='index'),

    # Servido na raiz (não em /static/game/) para que o escopo padrão do
    # service worker cubra o site inteiro — ver o comentário em views.py.
    path('sw.bundle.js', views.service_worker, name='service-worker'),
]
