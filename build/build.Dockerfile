FROM node AS pnpm
RUN mkdir /app
WORKDIR /app
ENV CI=1
RUN npm install -g pnpm@7.5.0
COPY pnpm-lock.yaml /app
RUN pnpm fetch --prod

FROM pnpm AS builder
RUN pnpm fetch
COPY package.json /app
RUN pnpm install
COPY . /app
RUN pnpm build

FROM pnpm AS prod
COPY package.json /app
RUN pnpm install --prod
COPY --from=builder /app/dist ./dist
ENTRYPOINT ["pnpm", "start:prod"]