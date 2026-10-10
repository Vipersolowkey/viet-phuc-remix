"""CatVTON model integration. No user image is written to disk.

Upstream model/code: Zheng-Chong/CatVTON, CC BY-NC-SA 4.0.
The model is loaded once, and inference is serialized by the service.
"""
import io
import os
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter, ImageOps

MAX_IMAGE_BYTES = 4 * 1024 * 1024
MAX_PIXELS = 12_000_000
Image.MAX_IMAGE_PIXELS = MAX_PIXELS


class OutputRejected(Exception):
    """The upstream safety checker rejected the generated image."""


def multipart_images(data, content_type):
    # Parse files directly into bounded byte arrays. Starlette UploadFile can
    # spool large uploads to disk, which this image workflow deliberately avoids.
    from python_multipart import MultipartParser
    from python_multipart.multipart import parse_options_header
    _, options = parse_options_header(content_type)
    boundary = options.get(b"boundary")
    if not boundary or len(boundary) > 200:
        raise ValueError("multipart_boundary")
    files = {}
    part = {}
    finished = False

    def begin():
        part.clear()
        part.update(name=None, data=bytearray(), header=bytearray(), value=bytearray())
    def header_field(data, start, end):
        part["header"].extend(data[start:end])
        if len(part["header"]) > 256:
            raise ValueError("multipart_header")
    def header_value(data, start, end):
        part["value"].extend(data[start:end])
        if len(part["value"]) > 1024:
            raise ValueError("multipart_header")
    def header_end():
        if bytes(part["header"]).lower() == b"content-disposition":
            _, params = parse_options_header(bytes(part["value"]))
            part["name"] = params.get(b"name", b"").decode("ascii")
        part["header"].clear(); part["value"].clear()
    def data_part(data, start, end):
        part["data"].extend(data[start:end])
        if len(part["data"]) > MAX_IMAGE_BYTES:
            raise ValueError("image_size")
    def end_part():
        name = part["name"]
        if name not in ("person", "garment", "mask") or name in files:
            raise ValueError("multipart_field")
        files[name] = bytes(part["data"])
    def end():
        nonlocal finished
        finished = True
    parser = MultipartParser(boundary, {"on_part_begin": begin, "on_header_field": header_field,
        "on_header_value": header_value, "on_header_end": header_end,
        "on_part_data": data_part, "on_part_end": end_part, "on_end": end})
    parser.write(data); parser.finalize()
    if not finished or set(files) != {"person", "garment", "mask"}:
        raise ValueError("multipart_missing")
    return files


def decode_image(data: bytes, mask=False):
    if not data or len(data) > MAX_IMAGE_BYTES:
        raise ValueError("image_size")
    with Image.open(io.BytesIO(data)) as source:
        if source.format not in ("PNG", "JPEG", "WEBP"):
            raise ValueError("image_format")
        if source.width * source.height > MAX_PIXELS or min(source.size) < 64:
            raise ValueError("image_dimensions")
        source.load()
        return ImageOps.exif_transpose(source).convert("L" if mask else "RGB")


def check_mask(person, mask):
    if person.size != mask.size:
        raise ValueError("mask_dimensions")
    histogram = mask.histogram()
    coverage = sum(histogram[128:]) / (mask.width * mask.height)
    if not .002 <= coverage <= .8:
        raise ValueError("mask_coverage")


def blend_result(result, person, mask, foreground):
    # The foreground matte restores the original background within broad masks;
    # multiplying by the selection also keeps all unselected pixels unchanged.
    blend = ImageChops.multiply(mask, foreground.convert("L"))
    return Image.composite(result, person, blend)


class CatVTONEngine:
    def __init__(self):
        self.pipeline = None
        self.foreground_session = None

    def load(self):
        import torch
        from huggingface_hub import snapshot_download
        upstream = Path(os.environ.get("CATVTON_SOURCE", ".sites-runtime/catvton-upstream")).resolve()
        if not (upstream / "model/pipeline.py").is_file():
            raise RuntimeError("CatVTON source is missing; run the setup instructions.")
        sys.path.insert(0, str(upstream))
        from model.pipeline import CatVTONPipeline
        if not torch.cuda.is_available():
            raise RuntimeError("A CUDA GPU is required.")
        weights = snapshot_download("zhengchong/CatVTON", allow_patterns=["mix-48k-1024/attention/*"])
        self.pipeline = CatVTONPipeline(
            base_ckpt="booksforcharlie/stable-diffusion-inpainting",
            attn_ckpt=weights, attn_ckpt_version="mix",
            weight_dtype=torch.float16, device="cuda", use_tf32=True,
        )
        self.pipeline.vae.enable_slicing()
        self.pipeline.vae.enable_tiling()
        checker = self.pipeline.run_safety_checker
        def checked_output(image):
            checked, flags = checker(image)
            if flags is not None and any(flags):
                # Stop before upstream replaces the output with its warning
                # poster. A blocked image must never become a successful try-on.
                raise OutputRejected()
            return checked, flags
        self.pipeline.run_safety_checker = checked_output
        from rembg import new_session
        os.environ.setdefault("U2NET_HOME", str(Path(os.environ.get("HF_HOME", ".sites-runtime/catvton-cache")) / "u2net"))
        self.foreground_session = new_session("u2net", providers=["CPUExecutionProvider"])

    def infer(self, person, garment, mask):
        import torch
        from utils import resize_and_padding
        from rembg import remove
        if self.pipeline is None:
            raise RuntimeError("Model is not ready.")
        width = int(os.environ.get("CATVTON_WIDTH", "384"))
        height = int(os.environ.get("CATVTON_HEIGHT", "512"))
        if (width, height) not in ((384, 512), (576, 768), (768, 1024)):
            raise ValueError("Unsupported resolution")
        person = ImageOps.pad(person, (width, height), color="white")
        mask = ImageOps.pad(mask, (width, height), method=Image.Resampling.NEAREST, color=0)
        garment = resize_and_padding(garment, (width, height))
        result = self.pipeline(
            image=person, condition_image=garment,
            mask=mask.filter(ImageFilter.GaussianBlur(4)),
            num_inference_steps=50, guidance_scale=2.5,
            width=width, height=height,
            generator=torch.Generator(device="cuda").manual_seed(42),
        )[0]
        # Preserve every pixel outside the selected region, including the face
        # when it is outside the mask. The model still determines the garment.
        foreground = remove(result, session=self.foreground_session, only_mask=True)
        result = blend_result(result, person, mask, foreground)
        output = io.BytesIO()
        result.save(output, format="PNG")
        torch.cuda.empty_cache()
        return output.getvalue()
