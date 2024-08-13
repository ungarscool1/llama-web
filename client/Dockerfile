FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

FROM base AS prod-deps
ENV NODE_OPTIONS=--max-old-space-size=8192
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN curl -L https://unpkg.com/@antonz/python-wasi/dist/python.wasm -o static/public/code/python.wasm && \
curl -L https://unpkg.com/@antonz/lua-wasi/dist/lua.wasm -o static/public/code/lua.wasm && \
curl -L https://unpkg.com/@antonz/ruby-wasi/dist/ruby.wasm -o static/public/code/ruby.wasm
RUN pnpm run build

FROM base
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/build /app/build
EXPOSE 3000
CMD [ "node", "build" ]