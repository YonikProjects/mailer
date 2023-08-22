# Use an official Node.js runtime as the base image
FROM node:latest

# Set the working directory in the container to /app
WORKDIR /app

# Copy package.json and package-lock.json to the container's working directory
COPY package*.json ./

# Install the application dependencies inside the container
RUN npm install

# Copy the entire project to the container's working directory
COPY . .

# Expose port 3000 for the app to listen on
EXPOSE 3000

# Define the command to run the app
CMD [ "node", "index.js" ]
