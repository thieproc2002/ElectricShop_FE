# Dockerfile
# Stage 1: Build the Angular application
FROM node:14 AS build

WORKDIR /app

# Copy package.json and package-lock.json to work directory
COPY package*.json ./

# Install dependencies
RUN npm install 

# Copy the rest of the application code
COPY . .

# Build the Angular app in production mode
RUN npm run build -- --prod

# Stage 2: Serve the Angular application using Nginx
FROM nginx:alpine

# Copy the built app from the build stage to the nginx public directory
COPY --from=build /app/dist/* /usr/share/nginx/html/

# Copy custom nginx configuration if needed
# COPY nginx-custom.conf /etc/nginx/conf.d/default.conf

# Expose port 80 to allow outside access to the application
EXPOSE 80

# Command to run nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
