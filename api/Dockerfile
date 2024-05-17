FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

FROM base AS prod-deps
RUN apt-get update && apt-get install -y python3 python3-pip
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build
RUN apt-get update && apt-get install git gcc g++ make cmake python3 python3-pip -y
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN git clone https://github.com/ggerganov/llama.cpp && \
    cd llama.cpp && \
    git checkout b2731 && \
    make -j
RUN pnpm run build

FROM base
RUN mkdir -p /app/llama.cpp
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist
COPY --from=build /app/llama.cpp/main ./llama.cpp/main
COPY --from=build /app/llama.cpp/embedding ./llama.cpp/embedding
EXPOSE 3000
CMD [ "node", "dist/index.js" ]
