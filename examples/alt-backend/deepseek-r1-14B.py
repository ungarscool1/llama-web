# Example taken from https://modal.com/docs/examples/vllm_mixtral
# API Endpoint changed for llama-web compatibility

import os
import time

from modal import Image, App, gpu, method, Secret, enter

MODEL_DIR = "/model"
BASE_MODEL = "deepseek-ai/DeepSeek-R1-Distill-Qwen-14B"
GPU_CONFIG = gpu.A100(count=1, size="80GB")

def download_model_to_folder():
    from huggingface_hub import snapshot_download
    from transformers.utils import move_cache

    os.makedirs(MODEL_DIR, exist_ok=True)

    snapshot_download(
        BASE_MODEL,
        local_dir=MODEL_DIR,
        token=os.environ["HF_TOKEN"],
        ignore_patterns="*.pth",  # Using safetensors
    )
    move_cache()

vllm_image = (
    Image.debian_slim()
    .pip_install(
        "vllm==0.7.0",
        "torch==2.5.1",
        "transformers==4.48.1",
        "ray==2.41.0",
        "hf-transfer==0.1.9",
        "huggingface_hub==0.28.0",
    )
    .env({"HF_HUB_ENABLE_HF_TRANSFER": "1"})
    .run_function(download_model_to_folder, timeout=60 * 20, secrets=[Secret.from_name("huggingface-secret")],)
)

app = App("llama-web-deepseek-r1-14b")

@app.cls(
    gpu=GPU_CONFIG,
    timeout=60 * 3,
    container_idle_timeout=60 * 3,
    allow_concurrent_inputs=10,
    image=vllm_image,
)
class Model:
    @enter()
    def start_engine(self):
        from vllm.engine.arg_utils import AsyncEngineArgs
        from vllm.engine.async_llm_engine import AsyncLLMEngine

        print("🥶 cold starting inference")
        start = time.monotonic_ns()

        engine_args = AsyncEngineArgs(
            model=MODEL_DIR,
            tensor_parallel_size=GPU_CONFIG.count,
            gpu_memory_utilization=0.90,
            max_model_len=4096,
            disable_log_requests=True,
            disable_log_stats=True,
        )

        self.engine = AsyncLLMEngine.from_engine_args(engine_args)
        duration_s = (time.monotonic_ns() - start) / 1e9
        print(f"🏎️ engine started in {duration_s:.0f}s")
    @method()
    async def completion_stream(self, messages: list):
        from vllm import SamplingParams
        from vllm.utils import random_uuid

        sampling_params = SamplingParams(
            temperature=0.75,
            max_tokens=1024,
            repetition_penalty=1.1,
        )
        tokenizer = await self.engine.get_tokenizer()
        request_id = random_uuid()
        conversation = tokenizer.apply_chat_template(messages, tokenize=False)
        result_generator = self.engine.generate(
            conversation,
            sampling_params,
            request_id,
        )
        index, num_tokens = 0, 0
        start = time.monotonic_ns()
        async for output in result_generator:
            text_delta = output.outputs[0].text[index:]
            index = len(output.outputs[0].text)
            num_tokens = len(output.outputs[0].token_ids)

            yield text_delta
        print(f"Generated {num_tokens} tokens in {time.time() - start:.2f}s ({num_tokens / (time.time() - start):.2f} tokens/s)")


from modal import asgi_app

@app.function(
    allow_concurrent_inputs=20,
    timeout=60 * 10,
    secrets=[Secret.from_name("web-token")]
)
@asgi_app(label="llama-web-deepseek-r1-14b")
def web():
    from fastapi import FastAPI, Request, Depends, HTTPException, status
    from fastapi.responses import StreamingResponse
    from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
    import os

    web_app = FastAPI()
    auth_scheme = HTTPBearer()

    @web_app.get("/stats")
    async def stats(request: Request, token: HTTPAuthorizationCredentials = Depends(auth_scheme)):
        if token.credentials != os.environ["AUTH_TOKEN"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect bearer token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        stats = await Model().completion_stream.get_current_stats.aio()
        return {
            "backlog": stats.backlog,
            "num_total_runners": stats.num_total_runners,
            "model": BASE_MODEL + " (vLLM)",
        }

    @web_app.post("/completion")
    async def completion(request: Request, token: HTTPAuthorizationCredentials = Depends(auth_scheme)):
        if token.credentials != os.environ["AUTH_TOKEN"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect bearer token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        body = await request.json()
        if "messages" not in body:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="`messages` field is required",
            )
        messages = body["messages"]
        if messages and messages[0]["role"] == "system":
            system = messages[0]["content"]
            messages = messages[1:]
        else:
            system = "Below is an instruction that describes a task. Write a response that appropriately completes the request. The response must be accurate, concise and evidence-based whenever possible."

        async def generate():
            async for text in Model().completion_stream.remote_gen.aio(
                messages=[{"role": "system", "content": system}] + messages
            ):
                yield f"{text}"

        return StreamingResponse(generate(), media_type="text/event-stream")
    return web_app