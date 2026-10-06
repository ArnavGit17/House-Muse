import io
import unittest
from unittest.mock import patch
from app import app


class TestRefineImageEndpoint(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        self.client = app.test_client()

    def test_missing_image_returns_400(self):
        resp = self.client.post(
            "/api/refine-image",
            json={"instruction": "add a brass lamp"},
        )
        self.assertEqual(resp.status_code, 400)
        data = resp.get_json()
        self.assertFalse(data["success"])
        self.assertIn("No init image", data["error"])

    def test_missing_instruction_returns_400(self):
        resp = self.client.post(
            "/api/refine-image",
            json={"image": "data:image/jpeg;base64,1234"},
        )
        self.assertEqual(resp.status_code, 400)
        data = resp.get_json()
        self.assertFalse(data["success"])
        self.assertIn("No instruction", data["error"])

    @patch("app.refine_room_image")
    def test_refine_json_success(self, mock_refine):
        mock_refine.return_value = {
            "success": True,
            "image_url": "https://pollinations.ai/fake-url.jpg",
            "image_b64": None,
            "prompt": "contemporary Indian interior design, add a reading chair",
            "error": None,
        }

        resp = self.client.post(
            "/api/refine-image",
            json={
                "image": "https://example.com/initial.jpg",
                "instruction": "add a reading chair",
                "style": "contemporary_indian",
                "room_type": "living_room",
                "strength": 0.35,
            },
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["instruction"], "add a reading chair")
        self.assertEqual(data["image_url"], "https://pollinations.ai/fake-url.jpg")
        self.assertEqual(len(data["variants"]), 1)
        self.assertEqual(data["variants"][0]["variant_label"], "Refined View")

        # Verify mock called with lower strength
        mock_refine.assert_called_once()
        _, kwargs = mock_refine.call_args
        self.assertAlmostEqual(kwargs["strength"], 0.35)
        self.assertEqual(kwargs["instruction"], "add a reading chair")
        self.assertIn("add a reading chair", kwargs["positive_prompt"])

    @patch("app.refine_room_image")
    def test_refine_multipart_success(self, mock_refine):
        mock_refine.return_value = {
            "success": True,
            "image_url": "https://pollinations.ai/refined-multipart.jpg",
            "image_b64": None,
            "prompt": "scandinavian interior, make the bed smaller",
            "error": None,
        }

        image_data = io.BytesIO(b"fake-image-bytes")
        orig_data = io.BytesIO(b"fake-original-bytes")

        resp = self.client.post(
            "/api/refine-image",
            data={
                "image": (image_data, "init.jpg"),
                "original_image": (orig_data, "orig.jpg"),
                "instruction": "make the bed smaller",
                "styles": '["scandinavian"]',
                "room_type": "bedroom",
                "strength": "0.30",
            },
            content_type="multipart/form-data",
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(data["instruction"], "make the bed smaller")

        mock_refine.assert_called_once()
        _, kwargs = mock_refine.call_args
        self.assertAlmostEqual(kwargs["strength"], 0.30)
        self.assertEqual(kwargs["style"], "scandinavian")
        self.assertIn("make the bed smaller", kwargs["positive_prompt"])

    @patch("app.generate_room_image")
    def test_existing_generate_image_endpoint_unaffected(self, mock_generate):
        mock_generate.return_value = {
            "success": True,
            "image_url": "https://pollinations.ai/generated.jpg",
            "image_b64": None,
            "error": None,
        }

        resp = self.client.post(
            "/api/generate-image",
            json={
                "room_type": "living_room",
                "styles": ["scandinavian"],
                "n_variants": 1,
            },
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertTrue(data["success"])
        self.assertEqual(len(data["variants"]), 1)
        self.assertEqual(data["variants"][0]["image_url"], "https://pollinations.ai/generated.jpg")


if __name__ == "__main__":
    unittest.main()
