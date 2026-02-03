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
Environment variables are set in `docker-compose.prod.yml` for "out of the box" usage.

- **Frontend (`client`)**: 
    - `VITE_API_URL`: Not set by default in production. The application defaults to relative paths (e.g., `/api`), allowing it to work on any domain (e.g., `pixie.example.org`) without recompiling.
- **Backend (`server`)**:
    - `CLIENT_ORIGIN`: Defaults to `*` (allow all) for easy setup, but this is **insecure** for production contexts where the API port is exposed.
      - **Recommended**: Set this to your actual domain (e.g., `https://pixie.example.org`).
      - *Note*: If you only access the API via the Nginx proxy (which provides a Same-Origin setup), strict CORS is often unnecessary, but restricting this variable adds a layer of defense if the backend port (3000) is accessed directly.
    - `MONGO_URI`: Points to the internal `mongo` service.

### Security & Credentials
The default configuration uses placeholders. You should override these for production.

**Option A: Using a `.env` file (Recommended for CLI)**
1.  Copy the example file: `cp .env.example .env`
2.  Edit `.env` and set your own values:
    ```bash
    ME_USERNAME=your_admin_user
    ME_PASSWORD=your_secure_password
    JWT_SECRET=your_long_random_secret
    CLIENT_ORIGIN=https://pixie.example.org
    ```
3.  Docker Compose will automatically pick up these values.

**Option B: Using Portainer**
When deploying the stack in Portainer:
1.  Scroll down to the **Environment variables** section.
2.  Add the variables manually:
    - `ME_USERNAME`: (e.g. `admin`)
    - `ME_PASSWORD`: (e.g. `complex_password_123`)
    - `JWT_SECRET`: (e.g. `random_string`)
    - `CLIENT_ORIGIN`: (e.g. `https://pixie.yourdomain.org`)
3.  Deploy the stack. The compose file is configured to use these values or fall back to defaults if missing.

## Deployment Scenarios

### Using Portainer & Nginx Proxy Manager (NPM)
1.  **Deploy Stack**: Upload/Copy the `docker-compose.prod.yml` content into a new Portainer Stack.
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
