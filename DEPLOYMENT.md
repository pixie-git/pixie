# Production Deployment Guide

This project is configured for a robust production deployment using Docker Compose. It includes the frontend (served via Nginx), backend (Node.js), database (MongoDB), and database management UI (Mongo Express).

## Quick Start

1.  **Start the stack**:
    ```bash
    docker-compose -f docker-compose.prod.yml up -d --build
    ```
2.  **Access the application**:
    - **Frontend (Application)**: `http://localhost:8080` (or your domain)
    - **API Endpoint**: `http://localhost:8080/api` (Proxied via Nginx)
    - **API Documentation (Swagger)**: `http://localhost:8080/api-docs`
    - **Real-time Socket**: `http://localhost:8080/socket.io/`
    - **Database UI (Mongo Express)**: `http://localhost:8081`

## Architecture & Configuration

### Services
- **pixie-client**: Serves the Vue.js frontend using Nginx. 
    - Internal Port: 80
    - Host Port: 8080
    - Nginx is configured to serve static files and reverse-proxy `/api` and `/socket.io` requests to the server container.
- **pixie-server**: Node.js backend.
    - Internal Port: 3000
    - Host Port: 3000 (Check logs or access direct if needed)
- **pixie-mongo**: MongoDB database.
    - Internal Port: 27017
    - Data Volume: `./mongo-data`
- **pixie-mongo-express**: Web-based MongoDB admin interface.
    - Host Port: 8081

### Environment Variables
Environment variables are set in `docker-compose.yml` for "out of the box" usage.

- **Frontend (`client`)**: 
    - `VITE_API_URL`: Not set by default in production. The application defaults to relative paths (e.g., `/api`), allowing it to work on any domain (e.g., `pixie.example.org`) without recompiling.
- **Backend (`server`)**:
    - `CLIENT_ORIGIN=*`: Configured to allow all origins by default to prevent CORS issues when deploying behind proxies or on different domains.
    - `MONGO_URI`: Points to the internal `mongo` service.
    - `JWT_SECRET`: Default set to a placeholder. **Change this for real production use.**

## Deployment Scenarios

### Using Portainer & Nginx Proxy Manager (NPM)
1.  **Deploy Stack**: Upload/Copy the `docker-compose.yml` content into a new Portainer Stack.
2.  **Nginx Proxy Manager**:
    - Create a Proxy Host (e.g., `pixie.example.org`).
    - **Scheme**: `http`
    - **Forward Hostname**: IP of the docker host (if NPM is external) or `pixie-client` (if NPM is on the same docker network as the stack).
    - **Forward Port**: `8080` (or the container port 80 if utilizing internal docker networks).
    - **Websockets Support**: Enable this checkbox in NPM for `socket.io` to work correctly.
    
    *Note: Since the client container's Nginx handles routing for `/api` and `/socket.io`, you only need to proxy the root domain to the client service.*

### Troubleshooting
- **CORS Errors**: Required headers are handled. `CLIENT_ORIGIN=*` on the server ensures strict CORS checks don't block requests.
- **Wrong URL**: The frontend uses relative URLs (`/api/...`), so it automatically adapts to whatever domain you host it on.
