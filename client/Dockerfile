FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS prod-deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN curl -L https://github.com/vmware-labs/webassembly-language-runtimes/releases/download/python%2F3.12.0%2B20231211-040d5a6/python-3.12.0.wasm -o static/public/code/python.wasm && \
curl -L https://unpkg.com/@antonz/lua-wasi/dist/lua.wasm -o static/public/code/lua.wasm && \
curl -L https://github.com/vmware-labs/webassembly-language-runtimes/releases/download/ruby%2F3.2.2%2B20230714-11be424/ruby-3.2.2.wasm -o static/public/code/ruby.wasm && \
curl -L https://github.com/vmware-labs/webassembly-language-runtimes/releases/download/php%2F8.2.6%2B20230714-11be424/php-cgi-8.2.6.wasm -o static/public/code/php.wasm
RUN pnpm run build

FROM base
COPY build /app
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY package.json /app
EXPOSE 3000
CMD [ "node", "." ]