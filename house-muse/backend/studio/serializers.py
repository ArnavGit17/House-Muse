from rest_framework import serializers

from .models import Project


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            "id", "name", "room_type", "length", "width", "height",
            "styles", "budget", "scope", "num_rooms", "harmony",
            "source_image", "generated_image_url", "result",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "result", "generated_image_url", "created_at", "updated_at"]


class AnalyseRequestSerializer(serializers.Serializer):
    """Validates the inputs before we forward them to the ml/ service."""

    room_type = serializers.CharField(default="living_room")
    length = serializers.FloatField(default=12)
    width = serializers.FloatField(default=10)
    height = serializers.FloatField(default=9)
    styles = serializers.ListField(child=serializers.CharField(), default=["Japandi"])
    budget = serializers.FloatField(default=50000)
    scope = serializers.CharField(default="both")
    num_rooms = serializers.IntegerField(default=1)
    harmony = serializers.CharField(default="analogous")
    save = serializers.BooleanField(default=True)  # whether to persist as a Project
    name = serializers.CharField(required=False, allow_blank=True)
