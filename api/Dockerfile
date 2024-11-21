FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_OPTIONS="--max-old-space-size=8192"
RUN corepack enable
COPY . /app
WORKDIR /app

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build
RUN apt-get update && \
    apt-get install git gcc g++ make cmake -y
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN ARCH=$(uname -m) && \
    if [ "$ARCH" = "aarch64" ]; then \
        export UNAME_M=arm64 UNAME_p=arm LLAMA_NO_METAL=1; \
    fi && \
    git clone https://github.com/ggerganov/llama.cpp && \
    cd llama.cpp && \
    git checkout b3505 && \
    make -j
RUN pnpm run build

FROM base
RUN mkdir -p /app/llama.cpp
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist
COPY --from=build /app/llama.cpp/llama-cli ./llama.cpp/main
COPY --from=build /app/llama.cpp/llama-embedding ./llama.cpp/embedding
EXPOSE 3000
CMD [ "node", "dist/index.js" ]
