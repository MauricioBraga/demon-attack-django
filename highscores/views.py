from django.conf import settings
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Score
from .serializers import ScoreCheckSerializer, ScoreSerializer

TOP_N = getattr(settings, 'HIGHSCORE_TOP_N', 10)


class ScoreListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/scores/  -> lista pública com os TOP_N melhores recordes
                          (nome, pontuação e nível).
    POST /api/scores/  {"name": "ABC", "score": 1234, "level": 7}
                       -> grava um novo recorde e mantém apenas os
                          TOP_N melhores na tabela.
    """
    serializer_class = ScoreSerializer

    def get_queryset(self):
        return Score.objects.all()[:TOP_N]

    def perform_create(self, serializer):
        serializer.save()
        # Poda a tabela para manter apenas os TOP_N recordes.
        keep_ids = list(Score.objects.values_list('id', flat=True)[:TOP_N])
        Score.objects.exclude(id__in=keep_ids).delete()


class CheckRankView(APIView):
    """
    POST /api/scores/check/  {"score": 1234}

    Responde se essa pontuação entraria no Top 10 e qual seria a posição,
    SEM gravar nada. Usado pelo jogo assim que a partida termina, antes de
    pedir o nome do jogador.
    """

    def post(self, request, *args, **kwargs):
        serializer = ScoreCheckSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        score = serializer.validated_data['score']

        total = Score.objects.count()
        better_count = Score.objects.filter(score__gt=score).count()
        rank = better_count + 1
        qualifies = total < TOP_N or rank <= TOP_N

        return Response({
            'qualifies': qualifies,
            'rank': rank if qualifies else None,
        })
