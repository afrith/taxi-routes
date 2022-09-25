FROM node:10
ENV NODE_ENV production
WORKDIR /home/node
COPY package.json package-lock.json /home/node/
RUN npm ci
COPY server.js static /home/node/
EXPOSE 3000
USER node
CMD [ "npm", "start" ]