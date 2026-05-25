FROM apify/actor-node:22

WORKDIR /usr/src/app

COPY actor/package*.json ./
RUN npm install --omit=dev

COPY actor ./

CMD npm start
