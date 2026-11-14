import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from PIL import Image

from modules import image_generator
from modules.hf_space_client import call_hf_space_refine


class ImageGenerationFlowTests(unittest.TestCase):
    @patch("modules.image_generator._generate_via_pollinations")
    @patch("modules.image_generator.HF_SPACE_ID", "")
    def test_photo_generation_does_not_fall_back_to_text_to_image(self, pollinations):
        result = image_generator.generate_room_image(
            "coastal interior",
            image_input=b"room photo",
            style="coastal",
        )

        self.assertFalse(result["success"])
        self.assertIn("HF_SPACE_ID", result["error"])
        pollinations.assert_not_called()

    @patch("modules.hf_space_client.call_hf_space_refine")
    @patch("modules.image_generator.HF_SPACE_ID", "owner/space")
    def test_photo_and_selected_style_reach_img2img_provider(self, refine):
        refine.return_value = {
            "success": True,
            "image_b64": "generated",
            "image_mime_type": "image/png",
        }
        source_photo = b"uploaded room photo"

        for style in ("coastal", "mid_century_modern"):
            result = image_generator.generate_room_image(
                f"{style} interior",
                image_input=source_photo,
                style=style,
            )

            self.assertTrue(result["success"])
            self.assertEqual(result["image_mime_type"], "image/png")
            call = refine.call_args.kwargs
            self.assertEqual(call["image_input"], source_photo)
            self.assertEqual(call["original_image_input"], source_photo)
            self.assertEqual(call["style"], style)
            self.assertEqual(call["strength"], 0.55)
            self.assertEqual(call["controlnet_scale"], 1.0)
            self.assertIn("position, shape, and size", call["prompt"])

    @patch("modules.hf_space_client.Client")
    def test_refine_endpoint_failure_is_not_replaced_with_redesign(self, client_class):
        client_class.return_value.predict.side_effect = RuntimeError("ZeroGPU quota exhausted")
        with tempfile.TemporaryDirectory() as temp_dir:
            image_path = Path(temp_dir) / "room.png"
            Image.new("RGB", (8, 8), "white").save(image_path)

            result = call_hf_space_refine(
                space_id="owner/space",
                image_input=str(image_path),
                original_image_input=str(image_path),
                style="coastal",
                instruction="Preserve the room geometry.",
            )

        self.assertFalse(result["success"])
        self.assertIn("quota exhausted", result["error"])
        self.assertEqual(client_class.return_value.predict.call_count, 1)
        self.assertEqual(
            client_class.return_value.predict.call_args.kwargs["api_name"],
            "/refine",
        )


if __name__ == "__main__":
    unittest.main()
