from unittest.mock import patch
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from .models import Project, ProjectRefinement


class RefineImageAPITestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="password123")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

        self.project = Project.objects.create(
            owner=self.user,
            name="My Scandinavian Living Room",
            room_type="living_room",
            length=14.0,
            width=12.0,
            height=9.0,
            styles=["scandinavian"],
            budget=75000.0,
            generated_image_url="https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
        )

    @patch("studio.views.analyse_room")
    def test_analysis_saves_the_full_photo_after_ml_forwarding(self, mock_analyse):
        image_bytes = b"uploaded room photo"

        def consume_upload(**kwargs):
            self.assertEqual(kwargs["image_file"].read(), image_bytes)
            return {"room_type": "living_room"}

        mock_analyse.side_effect = consume_upload
        response = self.client.post(
            "/api/studio/analyse/",
            {
                "room_type": "living_room",
                "length": "5.4",
                "width": "4.2",
                "height": "3.0",
                "styles": ["contemporary_indian"],
                "budget": "180000",
                "scope": "interior_design",
                "num_rooms": "1",
                "harmony": "analogous",
                "save": "true",
                "image": SimpleUploadedFile("room.jpg", image_bytes, content_type="image/jpeg"),
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(float(response["X-HouseMuse-Django-API-Seconds"]), 0)
        self.assertTrue(response["X-HouseMuse-Request-ID"])
        project = Project.objects.get(owner=self.user, styles=["contemporary_indian"])
        try:
            with project.source_image.open("rb") as saved_image:
                self.assertEqual(saved_image.read(), image_bytes)
        finally:
            project.source_image.delete(save=False)

    def test_unauthenticated_request_rejected(self):
        anonymous_client = APIClient()
        response = anonymous_client.post(
            "/api/studio/refine-image/",
            {"project_id": self.project.id, "instruction": "add a reading chair"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_project_not_found(self):
        response = self.client.post(
            "/api/studio/refine-image/",
            {"project_id": 99999, "instruction": "add a plant"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_refine_without_prior_image(self):
        project_without_image = Project.objects.create(
            owner=self.user,
            name="Empty Project",
            room_type="bedroom",
            length=10.0,
            width=10.0,
            height=8.0,
            styles=["coastal"],
            budget=30000.0,
            generated_image_url="",
        )
        response = self.client.post(
            "/api/studio/refine-image/",
            {"project_id": project_without_image.id, "instruction": "make bed smaller"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("studio.views.generate_room_image")
    def test_failed_image_generation_returns_bad_gateway(self, mock_generate):
        mock_generate.return_value = {
            "success": False,
            "variants": [{"success": False, "error": "Image provider unavailable."}],
        }

        response = self.client.post(
            "/api/studio/generate-image/",
            {"project_id": self.project.id, "room_type": "living_room"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertEqual(response.json()["detail"], "Image provider unavailable.")
        self.project.refresh_from_db()
        self.assertEqual(
            self.project.generated_image_url,
            "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
        )

    @patch("studio.views.generate_room_image")
    def test_long_generated_image_url_is_saved(self, mock_generate):
        image_url = "https://images.example.com/" + ("room-design-" * 30) + ".jpg"
        mock_generate.return_value = {
            "success": True,
            "variants": [{"success": True, "image_url": image_url}],
        }

        response = self.client.post(
            "/api/studio/generate-image/",
            {"project_id": self.project.id, "room_type": "living_room"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.project.refresh_from_db()
        self.assertEqual(self.project.generated_image_url, image_url)

    @patch("studio.views.generate_room_image")
    def test_base64_generated_image_is_saved_for_project_retrieval(self, mock_generate):
        mock_generate.return_value = {
            "success": True,
            "variants": [{
                "success": True,
                "image_b64": "generated-image-data",
                "image_mime_type": "image/png",
            }],
        }

        response = self.client.post(
            "/api/studio/generate-image/",
            {"project_id": self.project.id, "style": "coastal", "room_type": "living_room"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.project.refresh_from_db()
        self.assertEqual(
            self.project.generated_image_url,
            "data:image/png;base64,generated-image-data",
        )

    @patch("studio.views.refine_room_image")
    def test_successful_refinement_and_history(self, mock_refine):
        mock_refine.return_value = {
            "success": True,
            "image_url": "https://example.com/refined_v1.jpg",
            "image_b64": None,
            "prompt": "scandinavian room, add a reading chair",
        }

        # First refinement
        response1 = self.client.post(
            "/api/studio/refine-image/",
            {"project_id": self.project.id, "instruction": "add a cosy reading chair"},
            format="json",
        )
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        data1 = response1.json()
        self.assertTrue(data1["success"])
        self.assertEqual(data1["instruction"], "add a cosy reading chair")
        self.assertEqual(len(data1["history"]), 1)
        self.assertEqual(data1["history"][0]["instruction"], "add a cosy reading chair")
        self.assertEqual(data1["history"][0]["resulting_image"], "https://example.com/refined_v1.jpg")

        # Verify project state updated
        self.project.refresh_from_db()
        self.assertEqual(self.project.generated_image_url, "https://example.com/refined_v1.jpg")
        self.assertEqual(self.project.refinements.count(), 1)

        # Second refinement - builds on first refinement
        mock_refine.return_value = {
            "success": True,
            "image_url": "https://example.com/refined_v2.jpg",
            "image_b64": None,
            "prompt": "scandinavian room, add a reading chair, make coffee table oak wood",
        }

        response2 = self.client.post(
            "/api/studio/refine-image/",
            {"project_id": self.project.id, "instruction": "make coffee table oak wood"},
            format="json",
        )
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        data2 = response2.json()
        self.assertTrue(data2["success"])
        self.assertEqual(len(data2["history"]), 2)
        self.assertEqual(data2["history"][0]["instruction"], "add a cosy reading chair")
        self.assertEqual(data2["history"][1]["instruction"], "make coffee table oak wood")
        self.assertEqual(data2["history"][1]["resulting_image"], "https://example.com/refined_v2.jpg")

        self.project.refresh_from_db()
        self.assertEqual(self.project.generated_image_url, "https://example.com/refined_v2.jpg")
        self.assertEqual(self.project.refinements.count(), 2)

    @patch("studio.views.refine_room_image")
    def test_refinement_with_base64_result(self, mock_refine):
        # 1x1 transparent png in b64
        sample_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        mock_refine.return_value = {
            "success": True,
            "image_url": None,
            "image_b64": sample_b64,
            "prompt": "refined prompt",
        }

        response = self.client.post(
            "/api/studio/refine-image/",
            {"project_id": self.project.id, "instruction": "add hanging brass pendant lights"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(len(data["history"]), 1)
        refinement = ProjectRefinement.objects.filter(project=self.project).first()
        self.assertIsNotNone(refinement)
        self.assertTrue(bool(refinement.resulting_image))
