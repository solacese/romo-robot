FROM node:12-alpine

LABEL maintainer="Andrew.Roberts@solace.com"

# create app directories
RUN mkdir -p /usr/app/env
RUN mkdir -p /usr/app/src
RUN mkdir -p /usr/app/dist

# copy source code
COPY package*.json /usr/app/
COPY src /usr/app/src/

# set container's base dir
WORKDIR /usr/app

# install dependencies, build app, and then remove dev packages
RUN npm install
RUN npm run build
RUN npm prune --production

# run the container as a non-root user for best security practices
RUN addgroup -S app
RUN adduser -S -D -h /usr/app/src appuser app
RUN chown -R appuser:app /usr/app
USER appuser

# start the app
EXPOSE 3000
CMD [ "npm", "run", "start"]