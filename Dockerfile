FROM node:16-alpine3.11
ARG PORT
RUN echo $PORT

ENV PORT_ENV $PORT
ENV NODE_ENV=production
EXPOSE $PORT

RUN echo $PORT_ENV
WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install --production

COPY . .

RUN npm run build

CMD npx serve . -l $PORT_ENV