FROM node:lts as builder

WORKDIR /app
COPY . .

RUN yarn install --frozen-lockfile
RUN yarn build

FROM node:lts-alpine

WORKDIR /app
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json .
COPY --from=builder /app/yarn.lock .
RUN yarn install --frozen-lockfile --production && \
    yarn cache clean
EXPOSE 3000
CMD [ "node", "build" ]