#!/bin/bash

# Exit on any error
set -e

CONTAINER_NAME="pixie-test-redis"
IMAGE="redis:alpine"

# Cleanup function to ensure we don't leave containers running
cleanup() {
  echo "Cleaning up Redis container..."
  docker stop "$CONTAINER_NAME" > /dev/null 2>&1 || true
  docker rm "$CONTAINER_NAME" > /dev/null 2>&1 || true
}

# Trap EXIT, SIGINT, SIGTERM to run cleanup
trap cleanup EXIT SIGINT SIGTERM

# Start a temporary Redis container
echo "Starting Redis for integration tests..."
docker run --name "$CONTAINER_NAME" -p 6379:6379 -d "$IMAGE"

# Wait for Redis to be ready
echo "Waiting for Redis to be ready..."
RETRIES=10
until docker exec "$CONTAINER_NAME" redis-cli ping | grep -q PONG; do
  RETRIES=$((RETRIES - 1))
  if [ "$RETRIES" -le 0 ]; then
    echo "Redis failed to start."
    exit 1
  fi
  sleep 1
done

# Run the tests
echo "Running tests..."
npm test test/integration/state-hydration.test.ts
