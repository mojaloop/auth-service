FROM node:12.16.1-alpine as builder
WORKDIR /opt/auth-service

RUN apk add --no-cache -t build-dependencies git make gcc g++ python libtool autoconf automake \
    && cd $(npm root -g)/npm \
    && npm config set unsafe-perm true \
    && npm install -g node-gyp



# Create a non-root user: ml-user
RUN adduser -D ml-user 
USER ml-user

# Create empty log file & 
RUN mkdir ./logs && touch ./logs/combined.log

# link stdout to the application log file
RUN ln -sf /dev/stdout ./logs/combined.log

# cleanup
RUN npm prune --production

# copy bundle
COPY --chown=ml-user . /opt/auth-service/

EXPOSE 3001
CMD ["npm", "run", "start"]
