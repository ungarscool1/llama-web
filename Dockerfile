FROM node:lts as build
WORKDIR /app

RUN apt-get update && apt-get install git gcc g++ make cmake -y
COPY . .
RUN yarn install
RUN git clone https://github.com/ggerganov/llama.cpp && \
    cd llama.cpp && \
    make -j && \
    mkdir -p /app/llama.cpp/models/7B
RUN wget https://cloud.legodard.fr/s/TAfTAG3NmAS6Cjt/download -O /app/llama.cpp/models/7B/ggml-model-q4_0.bin
RUN yarn build

FROM node:lts
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/llama.cpp ./llama.cpp
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/yarn.lock ./yarn.lock
RUN yarn install --production
CMD ["yarn", "start"]