FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN npm install -g corepack@latest && corepack enable
WORKDIR /app

FROM base AS prod-deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile
RUN apt update && apt install curl -y && \
  curl -L https://unpkg.com/@antonz/lua-wasi/dist/lua.wasm -o lua.wasm && \
  curl -L https://github.com/vmware-labs/webassembly-language-runtimes/releases/download/ruby%2F3.2.2%2B20230714-11be424/ruby-3.2.2.wasm -o ruby.wasm && \
  curl -L https://github.com/vmware-labs/webassembly-language-runtimes/releases/download/php%2F8.2.6%2B20230714-11be424/php-cgi-8.2.6.wasm -o php.wasm

FROM base
COPY build /app
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY package.json /app
COPY --from=prod-deps /app/*.wasm /app/client/public/code/
EXPOSE 3000
CMD [ "node", "." ]