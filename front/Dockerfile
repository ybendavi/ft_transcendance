# Stage 1: Build React app
FROM node:20-alpine3.17
# Set the working directory in the container
WORKDIR /front

# Copy package.json and package-lock.json to the working directory
COPY package.json ./

# Install project dependencies
RUN npm i

# Copy the rest of the application code
COPY . .

# Build the React app

# Expose the default Nginx port
EXPOSE 3000

CMD ["npm", "run", "dev"]