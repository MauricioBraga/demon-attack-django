from django.urls import path

from .views import CheckRankView, ScoreListCreateView

app_name = 'highscores'

urlpatterns = [
    path('', ScoreListCreateView.as_view(), name='score-list-create'),   # GET / POST
    path('check/', CheckRankView.as_view(), name='score-check'),          # POST
]
