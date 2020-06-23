FROM node:14.3.0-alpine as builder

WORKDIR /opt/auth-service

RUN apk add --no-cache -t build-dependencies git make gcc g++ python libtool autoconf automake \
    && cd $(npm root -g)/npm \
    && npm config set unsafe-perm true \
    && npm install -g node-gyp 

# Copy across package.json and package-lock.json
COPY package.json package-lock.json* ./
RUN npm ci
# check in .dockerignore what is skipped during copy
COPY . .

# Create empty log file & 
RUN mkdir ./logs && touch ./logs/combined.log

# link stdout to the application log file
RUN ln -sf /dev/stdout ./logs/combined.log

# USER node 
# copy bundle
# COPY --chown=node --from=builder /opt/auth-service/ .

# cleanup
RUN apk del build-dependencies
# RUN npm prune --production

RUN npm run test:unit
EXPOSE 4004
CMD ["npm", "run", "start"]
