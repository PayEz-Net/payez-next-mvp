# Use an official Node.js runtime as a parent image
FROM node:20-slim

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Creates a "dist" directory with the production build
RUN npm run build

# The build is done, this container's main purpose is to be an artifact source.
CMD [ "echo", "Build complete. Artifacts are in /usr/src/app/dist" ]
