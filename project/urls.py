"""
URL configuration for the Demon Attack + Django Highscores project.
"""
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),

    # API REST de recordes: /api/scores/  e  /api/scores/check/
    path('api/scores/', include('highscores.urls')),

    # O jogo em si (template + assets estáticos do app "game").
    path('', include('game.urls')),
]

# NOTA: em desenvolvimento (DEBUG=True), o django.contrib.staticfiles já
# serve automaticamente os arquivos de game/static/game/ sob /static/game/
# — não é preciso adicionar nenhuma rota manual para isso. Em produção,
# sirva os estáticos via "collectstatic" + Nginx/WhiteNoise/CDN.
