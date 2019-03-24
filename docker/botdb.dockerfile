FROM node:lts-slim

WORKDIR /app

# Install packages before adding source.
# This avoids reinstalling packages when only source files changed.
COPY ./package*.json /app/
RUN npm ci
RUN npm install -g typescript

# Copy source and build.
COPY ./tsconfig.json /app/
COPY ./src /app/src/
RUN npm run build-ts

CMD npm run botdb