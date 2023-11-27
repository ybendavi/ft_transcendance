# Use an official Node.js runtime as the base image
FROM node:20-alpine3.17

# Set the working directory in the container
WORKDIR /back

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install project dependencies
RUN npm i

# Copy the rest of the application code
COPY . .

# Expose the port your NestJS server is listening on
EXPOSE 8080

# Start the NestJS server
CMD ["npm", "run", "start:dev"]
