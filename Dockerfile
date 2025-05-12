FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Create directories for uploads and results
RUN mkdir -p uploads results

EXPOSE 3000

CMD ["npm", "start"]