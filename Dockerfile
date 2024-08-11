FROM node:20.12.2-alpine

WORKDIR /bot

COPY bot /bot

RUN yarn &&\
    yarn build

CMD ["yarn", "start"]