FROM node:18.16.0-alpine
WORKDIR /app
COPY . /app
RUN npm install
EXPOSE 8000
CMD ["npm", "start"]
