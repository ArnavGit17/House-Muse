import base64
from django.core.files.base import ContentFile
from django.utils.timezone import now
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Project, ProjectRefinement
from .serializers import AnalyseRequestSerializer, ProjectSerializer, RefineImageRequestSerializer
from .services import MLServiceError, analyse_room, generate_room_image, refine_room_image


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
            if image_file and hasattr(image_file, "seek"):
                image_file.seek(0)
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
    """POST → forwards to ml/'s image-to-image generation pipeline."""

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

        if not result.get("success"):
            detail = result.get("error")
            variants = result.get("variants")
            if not detail and isinstance(variants, list):
                detail = next(
                    (
                        variant.get("error")
                        for variant in variants
                        if isinstance(variant, dict) and variant.get("error")
                    ),
                    None,
                )
            return Response(
                {"detail": detail or "Image generation did not return an image."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if project and result.get("success"):
            variants = result.get("variants", [])
            first_variant = variants[0] if variants else {}
            image_url = result.get("image_url") or first_variant.get("image_url")
            image_b64 = result.get("image_b64") or first_variant.get("image_b64")
            image_mime_type = (
                result.get("image_mime_type")
                or first_variant.get("image_mime_type")
                or "image/jpeg"
            )
            if image_url:
                project.generated_image_url = image_url
            elif image_b64:
                project.generated_image_url = f"data:{image_mime_type};base64,{image_b64}"
            if project.generated_image_url:
                project.save(update_fields=["generated_image_url"])

        return Response(result)


class RefineImageView(APIView):
    """
    POST → /api/studio/refine-image/
    Accepts:
        project_id: int
        instruction: str (e.g. "make the bed smaller, add a reading chair")

    Uses the project's stored original room photo + most recent generated image.
    Calls ml/ HF Space generation using the most recent generated image as img2img
    init image with lower strength (~0.3-0.4) and base style + instruction prompt.
    Saves refinement history per project and returns the new image + updated history.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = RefineImageRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        project_id = serializer.validated_data["project_id"]
        instruction = serializer.validated_data["instruction"].strip()

        try:
            project = Project.objects.get(id=project_id, owner=request.user)
        except Project.DoesNotExist:
            return Response({"detail": "Project not found."}, status=status.HTTP_404_NOT_FOUND)

        # 1. Locate the most recent generated image
        latest_refinement = project.refinements.order_by("-created_at").first()
        init_image = None
        if latest_refinement:
            init_image = latest_refinement.resulting_image or latest_refinement.resulting_image_url
        if not init_image and project.generated_image_url:
            init_image = project.generated_image_url

        if not init_image:
            return Response(
                {"detail": "No previous generated image found for this project. Please generate an image first."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 2. Retrieve original room photo (if any)
        original_image = project.source_image if project.source_image else None

        # 3. Build payload for ml/ service
        styles = project.styles if isinstance(project.styles, list) else [project.styles or "contemporary_indian"]
        primary_style = styles[0] if styles else "contemporary_indian"
        payload = {
            "project_id": project.id,
            "instruction": instruction,
            "style": primary_style,
            "styles": styles,
            "room_type": project.room_type,
            "strength": 0.35,
        }

        # 4. Call ml/ service to refine
        try:
            result = refine_room_image(payload, init_image=init_image, original_image=original_image)
        except MLServiceError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        if not result.get("success"):
            error_msg = result.get("error") or "Refinement failed to produce an image."
            return Response({"detail": error_msg, "success": False}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        variants = result.get("variants", [])
        image_b64 = result.get("image_b64") or (variants[0].get("image_b64") if variants else None)
        image_url = result.get("image_url") or (variants[0].get("image_url") if variants else None)

        # 5. Store refinement in history
        refinement = ProjectRefinement(project=project, instruction=instruction)
        if image_b64:
            try:
                img_bytes = base64.b64decode(image_b64)
                file_name = f"refine_{project.id}_{int(now().timestamp())}.jpg"
                refinement.resulting_image.save(file_name, ContentFile(img_bytes), save=False)
                refinement.resulting_image_url = request.build_absolute_uri(refinement.resulting_image.url)
            except Exception:
                refinement.resulting_image_url = f"data:image/jpeg;base64,{image_b64}"
        elif image_url:
            refinement.resulting_image_url = image_url

        refinement.save()

        # Update project's latest generated image pointer
        resulting_display = refinement.get_resulting_image(request)
        project.generated_image_url = resulting_display
        project.save(update_fields=["generated_image_url"])

        # 6. Retrieve full ordered history
        history = [
            {
                "id": r.id,
                "instruction": r.instruction,
                "resulting_image": r.get_resulting_image(request),
                "created_at": r.created_at.isoformat(),
            }
            for r in project.refinements.all().order_by("created_at")
        ]

        return Response({
            "success": True,
            "image_url": resulting_display,
            "image_b64": image_b64,
            "resulting_image": resulting_display,
            "instruction": instruction,
            "history": history,
            "project_id": project.id,
        })

