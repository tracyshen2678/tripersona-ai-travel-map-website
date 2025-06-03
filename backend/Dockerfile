# Step 1: Base image for building
FROM node:18-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --only=production
COPY . .
# No build step mentioned, assuming pure JS or build happens elsewhere

# Step 2: Production image
FROM node:18-alpine
WORKDIR /usr/src/app

# Copy dependencies and package files from builder
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./

# Copy application code from builder
COPY --from=builder /usr/src/app ./

# Cloud Run will set the PORT environment variable (usually to 8080).
# Your app (process.env.PORT || 5001) will listen on this PORT.
# EXPOSE should reflect the port your application *would* listen on if PORT env var wasn't set,
# OR the port Cloud Run expects. For clarity with Cloud Run, often 8080 is used here
# if the app is designed to listen to process.env.PORT.
# Let's stick with what your app defaults to without PORT env var for EXPOSE.
EXPOSE 5001

# Your app's entry point. Assumes server.js is your main file.
CMD [ "node", "server.js" ]