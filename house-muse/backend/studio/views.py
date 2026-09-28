from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Project
from .serializers import AnalyseRequestSerializer, ProjectSerializer
from .services import MLServiceError, analyse_room, generate_room_image


class ProjectViewSet(viewsets.ModelViewSet):
    """Standard CRUD for a user's saved design projects."""

    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class AnalyseView(APIView):
    """
    POST room dimensions/budget/styles (+ optional image) →
    forwards to ml/'s /api/analyse, optionally saves the result as a
    Project, and returns it to the frontend.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = AnalyseRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        image_file = request.FILES.get("image")

        try:
            result = analyse_room(
                room_type=payload["room_type"],
                length=payload["length"],
                width=payload["width"],
                height=payload["height"],
                styles=payload["styles"],
                budget=payload["budget"],
                scope=payload["scope"],
                num_rooms=payload["num_rooms"],
                harmony=payload["harmony"],
                image_file=image_file,
            )
        except MLServiceError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        project = None
        if payload.get("save", True):
            project = Project.objects.create(
                owner=request.user,
                name=payload.get("name", ""),
                room_type=payload["room_type"],
                length=payload["length"],
                width=payload["width"],
                height=payload["height"],
                styles=payload["styles"],
                budget=payload["budget"],
                scope=payload["scope"],
                num_rooms=payload["num_rooms"],
                harmony=payload["harmony"],
                source_image=image_file,
                result=result,
            )

        return Response({
            "result": result,
            "project": ProjectSerializer(project).data if project else None,
        })


class GenerateImageView(APIView):
    """POST → forwards to ml/'s /api/generate-image (Pollinations.AI, Stability AI fallback)."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        project_id = request.data.get("project_id")
        project = None
        if project_id:
            try:
                project = Project.objects.get(id=project_id, owner=request.user)
            except Project.DoesNotExist:
                project = None

        source_image = project.source_image if (project and project.source_image) else None

        try:
            result = generate_room_image(request.data, image_file=source_image)
        except MLServiceError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        if project and result.get("success"):
            variants = result.get("variants", [])
            if variants:
                project.generated_image_url = variants[0].get("image_url")
                project.save(update_fields=["generated_image_url"])

        return Response(result)
