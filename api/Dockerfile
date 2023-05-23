FROM node:lts as build
WORKDIR /app

RUN apt-get update && apt-get install git gcc g++ make cmake -y
COPY . .
RUN yarn install
RUN git clone https://github.com/ggerganov/llama.cpp && \
    cd llama.cpp && \
    git checkout 2e6cd4b && \
    make -j
RUN yarn build

FROM node:lts
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/llama.cpp ./llama.cpp
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/yarn.lock ./yarn.lock
RUN yarn install --production
CMD ["yarn", "start"]
