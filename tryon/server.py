"""Authenticated GPU component of the same product; run behind TLS in hosting."""
import asyncio
import hmac
import os
from contextlib import asynccontextmanager
from time import monotonic

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response

from engine import CatVTONEngine, OutputRejected, check_mask, decode_image, multipart_images

engine = CatVTONEngine()
ready = False
load_failed = False
inference_lock = asyncio.Lock()
attempts = {}


async def initialize():
    global ready, load_failed
    try:
        await asyncio.to_thread(engine.load)
        ready = True
    except Exception as error:
        load_failed = True
        # Initialization errors contain no user images or API keys.
        print(f"CatVTON load failed: {type(error).__name__}: {error}", flush=True)


@asynccontextmanager
async def lifespan(app):
    task = asyncio.create_task(initialize())
    yield
    if not task.done():
        task.cancel()


app = FastAPI(lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)


def authorized(request):
    token = os.environ.get("TRYON_API_KEY", "")
    return len(token) >= 32 and hmac.compare_digest(request.headers.get("authorization", ""), f"Bearer {token}")


def reply(error, status):
    return JSONResponse({"error": error}, status, headers={"Cache-Control": "no-store"})


@app.get("/health")
async def health(request: Request):
    if not authorized(request):
        return reply("unauthorized", 401)
    return JSONResponse({"ready": ready, "state": "ready" if ready else "failed" if load_failed else "loading", "model": "CatVTON"}, headers={"Cache-Control": "no-store"})


@app.post("/try-on")
async def try_on(request: Request):
    if not authorized(request):
        return reply("unauthorized", 401)
    if not ready:
        return reply("model_unavailable", 503)
    # Bound the request body before parsing multipart uploads.
    total = 0
    chunks = []
    async for chunk in request.stream():
        total += len(chunk)
        if total > 9 * 1024 * 1024:
            return reply("input_too_large", 413)
        chunks.append(chunk)
    body = b"".join(chunks)
    user = request.headers.get("x-tryon-user", "")
    if len(user) != 64 or any(c not in "0123456789abcdef" for c in user):
        return reply("unauthorized", 401)
    inputs = []
    try:
        files = multipart_images(body, request.headers.get("content-type", ""))
        for name in ("person", "garment", "mask"):
            inputs.append(decode_image(files[name], mask=name == "mask"))
        person, garment, mask = inputs
        check_mask(person, mask)
    except Exception:
        for image in inputs:
            image.close()
        return reply("invalid_image", 400)
    # One GPU request at a time. Reject extra requests instead of hidden queues.
    if inference_lock.locked():
        for image in inputs:
            image.close()
        return reply("busy", 429)
    now = monotonic()
    for identity in list(attempts):
        attempts[identity] = [t for t in attempts[identity] if now - t < 3600]
        if not attempts[identity]:
            del attempts[identity]
    bucket = attempts.setdefault(user, [])
    if len(bucket) >= 6:
        for image in inputs:
            image.close()
        return reply("rate_limited", 429)
    async with inference_lock:
        bucket.append(now)
        # Shield inference so a client disconnect cannot release the GPU lock
        # while its background thread is still using the model.
        task = asyncio.create_task(asyncio.to_thread(engine.infer, person, garment, mask))
        try:
            output = await asyncio.shield(task)
            return Response(output, media_type="image/png", headers={"Cache-Control": "no-store"})
        except asyncio.CancelledError:
            await task
            raise
        except OutputRejected:
            return reply("output_rejected", 422)
        except Exception:
            return reply("inference_failed", 502)
        finally:
            for image in inputs:
                image.close()
