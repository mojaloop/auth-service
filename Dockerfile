FROM node:12.16.1-alpine as builder
WORKDIR /opt/auth-service

RUN apk add --no-cache -t build-dependencies git make gcc g++ python libtool autoconf automake \
    && cd $(npm root -g)/npm \
    && npm config set unsafe-perm true \
    && npm install -g node-gyp

COPY package.json package-lock.json* /opt/auth-service/

RUN npm ci
COPY src /opt/auth-service/src
COPY test /opt/auth-service/


FROM node:12.16.1-alpine
WORKDIR /opt/central-ledger

# Create empty log file & 
RUN mkdir ./logs && touch ./logs/combined.log

# link stdout to the application log file
RUN ln -sf /dev/stdout ./logs/combined.log

# Create a non-root user: ml-user
RUN adduser -D ml-user 
USER ml-user


# copy bundle
COPY --chown=ml-user --from=builder /opt/auth-service/ .

# cleanup
RUN npm prune --production

EXPOSE 3000
CMD ["npm", "run", "start"]
