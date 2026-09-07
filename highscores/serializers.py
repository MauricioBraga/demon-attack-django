from rest_framework import serializers

from .models import Score


class ScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Score
        fields = ['id', 'name', 'score', 'level', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_name(self, value: str) -> str:
        value = value.strip()
        if not value:
            raise serializers.ValidationError('O nome não pode ficar em branco.')
        return value


class ScoreCheckSerializer(serializers.Serializer):
    """Payload usado apenas para consultar a posição no ranking, sem gravar nada."""
    score = serializers.IntegerField(min_value=0)
