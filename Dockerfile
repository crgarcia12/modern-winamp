FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application with the correct base path
RUN npm run build

# Reorganize the build output to match the URL prefix structure
RUN mkdir -p dist/dev/crgarcia12/modern-winamp/liliput-task-920ccf05 && \
    mv dist/assets dist/dev/crgarcia12/modern-winamp/liliput-task-920ccf05/

# Install serve to serve the built files
RUN npm install -g serve

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 3000

# Start the application, binding to all interfaces on the port
CMD ["sh", "-c", "serve -s dist --listen tcp://0.0.0.0:${PORT:-3000} --no-port-switching"]