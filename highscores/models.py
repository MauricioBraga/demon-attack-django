from django.db import models


class Score(models.Model):
    """Um recorde enviado por um jogador ao final de uma partida."""

    name = models.CharField('nome do jogador', max_length=20)
    score = models.PositiveIntegerField('pontuação')
    level = models.PositiveIntegerField('nível alcançado', default=0)
    created_at = models.DateTimeField('registrado em', auto_now_add=True)

    class Meta:
        verbose_name = 'recorde'
        verbose_name_plural = 'recordes'
        # Empate em pontos: quem registrou primeiro fica melhor colocado.
        ordering = ['-score', 'created_at']

    def __str__(self):
        return f'{self.name} — {self.score} pts (nível {self.level})'
