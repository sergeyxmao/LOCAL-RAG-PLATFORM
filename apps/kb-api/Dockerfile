FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache \
  poppler-utils \
  tesseract-ocr \
  tesseract-ocr-data-eng \
  tesseract-ocr-data-rus \
  postgresql16-client \
  gzip

COPY package*.json ./
RUN npm install

COPY src ./src

EXPOSE 8787

# node напрямую (а не npm start): npm не пробрасывает SIGTERM дочернему
# процессу, из-за чего docker stop ждал таймаут вместо graceful shutdown.
CMD ["node", "src/index.js"]
