FROM node:lts-slim

WORKDIR /app

# Install packages before adding source.
# This avoids reinstalling packages when only source files changed.
COPY ./package*.json /app/
RUN yarn
RUN yarn global add typescript

# Copy source and build.
COPY ./tsconfig.json /app/
COPY ./src /app/src/
RUN yarn run build-ts

CMD yarn run botdb
