# Use Node.js official image with Alpine Linux for smaller size
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install production dependencies first
COPY package*.json ./
RUN npm install --omit=dev

# Add user for security
USER node

# Copy application code
COPY --chown=node:node . .

# Set environment variables
ENV NODE_ENV=production

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
