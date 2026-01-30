FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm install --no-audit --no-fund

# Copy application
COPY frontend/ .

# Build-time env for Vite
ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_APP_NAME
ARG VITE_APP_VERSION
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}
ENV VITE_APP_NAME=${VITE_APP_NAME}
ENV VITE_APP_VERSION=${VITE_APP_VERSION}

# Build production assets
RUN npm run build

FROM nginx:1.25-alpine

COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
