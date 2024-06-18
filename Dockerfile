FROM node:20
#ENV NODE_ENV=production
#ENV NODE_ENV=development
COPY . . 
RUN npm install
CMD ["npm", "start"]