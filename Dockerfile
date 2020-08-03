FROM node:12.16.1-alpine as builder
USER root
WORKDIR /opt/auth-service
RUN apk add --no-cache -t build-dependencies git make gcc g++ python libtool autoconf automake \
    && cd $(npm root -g)/npm \
    && npm config set unsafe-perm true \
    && npm install -g node-gyp 
COPY package.json package-lock.json* /opt/auth-service/
RUN npm ci
COPY . /opt/auth-service
FROM node:12.16.1-alpine
WORKDIR /opt/auth-service
# Create empty log file & link stdout to the application log file
RUN mkdir ./logs && touch ./logs/combined.log
RUN ln -sf /dev/stdout ./logs/combined.log
# Create a non-root user: as-user
RUN adduser -D as-user 
USER as-user
COPY --chown=as-user --from=builder /opt/auth-service .
# cleanup
#RUN npm prune --production
EXPOSE 4004
CMD ["npm", "run", "start"]
