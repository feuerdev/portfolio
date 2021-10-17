ARG PORT
FROM node:16-alpine3.11

ENV NODE_ENV=production
EXPOSE $PORT

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install --production

COPY . .

RUN npm run build

CMD [ "npx", "serve", ".", "-l", $PORT]