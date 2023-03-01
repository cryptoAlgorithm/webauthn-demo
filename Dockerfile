FROM node:19-alpine
RUN apk add --no-cache libc6-compat

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Bundle source code
COPY . .

ENV NODE_ENV production

#RUN addgroup --system --gid 1001 app-group
#RUN adduser --system --uid 1001 app-user

# Run app with app-user
#USER app-user

EXPOSE 3000

# next build
RUN npm run build

# next start
CMD ["npm", "start"]
