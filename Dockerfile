# Creates the Chemical Hazard Tool server and GUI
#
# You can access the container using:
#   docker run -it safr sh
# To start it stand-alone:
#   docker run -it -p 8080:8080 safr

# Build the app separately
FROM node:18-alpine as builder

# ARG SERVER_URL
# ARG SERVER_PATH

# ENV SERVER_URL=${SERVER_URL}
# ENV SERVER_PATH=${SERVER_PATH}

RUN apk add --no-cache --virtual .gyp python3 make g++ git vips-dev && \
  npm i -g yalc
RUN mkdir /packages && \
  mkdir /packages/shared && \
  mkdir /packages/gui && \
  mkdir /packages/server
COPY ./packages/shared /packages/shared
WORKDIR /packages/shared
RUN npm install && \
  npm run build:domain && \
  yalc publish --private
COPY ./packages/server /packages/server
WORKDIR /packages/server
RUN yalc add c2app-models-utils && \
  npm install && \
  npm run build:domain
COPY ./packages/gui /packages/gui
WORKDIR /packages/gui
RUN rm -fr node_modules && \
  yalc add c2app-models-utils && \
  npm install && \
  npm run build:domain

# Serve the built app
FROM node:18-alpine as app

# ARG SERVER_URL
# ARG SERVER_PATH
ARG GIT_COMMIT=latest

# ENV SERVER_URL=${SERVER_URL}
# ENV SERVER_PATH=${SERVER_PATH}

LABEL git_commit=$GIT_COMMIT

RUN mkdir -p /app
COPY --from=builder /packages/shared/node_modules /shared/node_modules
COPY --from=builder /packages/shared/dist /shared
COPY --from=builder /packages/server/node_modules /app/node_modules
COPY --from=builder /packages/server/package.json /app/package.json
COPY --from=builder /packages/server/dist /app/dist
COPY --from=builder /packages/server/public /app/public
COPY --from=builder /packages/server/.yalc /app/.yalc
COPY --from=builder /packages/server/layer_styles /app/layer_styles
WORKDIR /app
EXPOSE 8080
CMD ["node", "./dist/index.js"]
