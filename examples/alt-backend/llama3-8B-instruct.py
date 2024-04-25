# Example taken from https://modal.com/docs/examples/vllm_mixtral
# API Endpoint changed for llama-web compatibility

import os
import time

from modal import Image, Stub, gpu, method, Secret, enter

MODEL_DIR = "/model"
BASE_MODEL = "meta-llama/Meta-Llama-3-8B-Instruct"
GPU_CONFIG = gpu.A10G(count=1)

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
    Image.from_registry(
        "nvidia/cuda:12.1.0-base-ubuntu22.04", add_python="3.10"
    )
    .pip_install("vllm==0.2.5", "huggingface_hub==0.19.4", "hf-transfer==0.1.4", "jinja2")
    .env({"HF_HUB_ENABLE_HF_TRANSFER": "1"})
    .run_function(download_model_to_folder, timeout=60 * 20, secrets=[Secret.from_name("huggingface-secret")],)
)

stub = Stub("llama-web-llama3-8b-instruct")

@stub.cls(
    gpu=GPU_CONFIG,
    timeout=60 * 3,
    container_idle_timeout=60 * 3,
    allow_concurrent_inputs=10,
    image=vllm_image,
)
class Model:
    @enter()
    def __init__(self):
        from vllm.engine.arg_utils import AsyncEngineArgs
        from vllm.engine.async_llm_engine import AsyncLLMEngine

        if GPU_CONFIG.count > 1:
            # Patch issue from https://github.com/vllm-project/vllm/issues/1116
            import ray

            ray.shutdown()
            ray.init(num_gpus=GPU_CONFIG.count)

        engine_args = AsyncEngineArgs(
            model=MODEL_DIR,
            tensor_parallel_size=GPU_CONFIG.count,
            gpu_memory_utilization=0.90,
            disable_log_requests=True,
            disable_log_stats=True,
        )

        self.engine = AsyncLLMEngine.from_engine_args(engine_args)

        # Performance improvement from https://github.com/vllm-project/vllm/issues/2073#issuecomment-1853422529
        if GPU_CONFIG.count > 1:
            import subprocess

            RAY_CORE_PIN_OVERRIDE = "cpuid=0 ; for pid in $(ps xo '%p %c' | grep ray:: | awk '{print $1;}') ; do taskset -cp $cpuid $pid ; cpuid=$(($cpuid + 1)) ; done"
            subprocess.call(RAY_CORE_PIN_OVERRIDE, shell=True)

    @method()
    async def completion_stream(self, messages: list):
        from vllm import SamplingParams
        from vllm.utils import random_uuid
        from jinja2 import Template

        tokenizer = self.engine.tokenizer()
        sampling_params = SamplingParams(
            temperature=0.75,
            max_tokens=1024,
            repetition_penalty=1.1,
            stop_token_ids=[tokenizer.eos_token_id, tokenizer.convert_tokens_to_ids("<|eot_id|>")],
        )

        t0 = time.time()
        request_id = random_uuid()
        result_generator = self.engine.generate(
            messages,
            sampling_params,
            request_id,
        )
        index, num_tokens = 0, 0
        async for output in result_generator:
            if (
                output.outputs[0].text
                and "\ufffd" == output.outputs[0].text[-1]
            ):
                continue
            text_delta = output.outputs[0].text[index:]
            index = len(output.outputs[0].text)
            num_tokens = len(output.outputs[0].token_ids)

            yield text_delta

        print(f"Generated {num_tokens} tokens in {time.time() - t0:.2f}s")


from modal import asgi_app

@stub.function(
    allow_concurrent_inputs=20,
    timeout=60 * 10,
    secrets=[Secret.from_name("web-token")]
)
@asgi_app(label="llama-web-llama3-8b-instruct")
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
