FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache \
  poppler-utils \
  tesseract-ocr \
  tesseract-ocr-data-eng \
  tesseract-ocr-data-rus

COPY package*.json ./
RUN npm install

COPY src ./src

EXPOSE 8787

CMD ["npm", "start"]
