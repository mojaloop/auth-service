FROM node:16.15.0-alpine as builder
USER root
WORKDIR /opt/auth-service

RUN apk add --no-cache -t build-dependencies git make gcc g++ python3 libtool autoconf automake \
    && cd $(npm root -g)/npm \
    && npm config set unsafe-perm true \
    && npm install -g node-gyp

COPY package.json package-lock.json* ./
RUN npm ci

COPY ./ ./
RUN npm run build
RUN rm -rf src secrets test docs
RUN npm prune --production

FROM node:16.15.0-alpine

WORKDIR /opt/auth-service

# Create empty log file & link stdout to the application log file
RUN mkdir ./logs && touch ./logs/combined.log
RUN ln -sf /dev/stdout ./logs/combined.log

# Create a non-root user: ml-user
RUN adduser -D ml-user
USER ml-user
COPY --chown=ml-user --from=builder /opt/auth-service .

EXPOSE 4004
CMD ["npm", "run", "start"]
