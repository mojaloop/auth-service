# Arguments
ARG NODE_VERSION="24.21.0-alpine3.24"
# NOTE: Ensure you set NODE_VERSION Build Argument as follows...
#
#  export NODE_VERSION="$(cat .nvmrc)-alpine" \
#  docker build \
#    --build-arg NODE_VERSION=$NODE_VERSION \
#    -t mojaloop/sdk-scheme-adapter:local \
#    . \
#

# Build Image
FROM node:${NODE_VERSION} AS builder
USER root

WORKDIR /opt/app

RUN apk add --no-cache --virtual .build-deps autoconf automake g++ gcc libtool make openssl-dev python3

COPY package.json package-lock.json* /opt/app/

# Lifecycle scripts are skipped for supply-chain safety (docker:S6505); cbor-extract is
# the only production dependency that needs its native build, so run it explicitly.
RUN npm ci --ignore-scripts
RUN npm rebuild cbor-extract

COPY ./ /opt/app
RUN npm run build
RUN rm -rf src secrets test docs
RUN npm prune --omit=dev --ignore-scripts

FROM node:${NODE_VERSION}

WORKDIR /opt/app

# Create empty log file & link stdout to the application log file
RUN mkdir ./logs && touch ./logs/combined.log
RUN ln -sf /dev/stdout ./logs/combined.log

# Create a non-root user: app-user
RUN adduser -D app-user
USER app-user
COPY --chown=app-user --from=builder /opt/app .

EXPOSE 4004
CMD ["npm", "run", "start"]
