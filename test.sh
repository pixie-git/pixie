#!/bin/bash

# Exit on any error
set -e

CONTAINER_NAME="pixie-test-redis-temp"
IMAGE="redis:alpine"

# Cleanup function to ensure we don't leave containers running
cleanup() {
  echo "Cleaning up Redis container..."
  docker stop "$CONTAINER_NAME" > /dev/null 2>&1 || true
  docker rm "$CONTAINER_NAME" > /dev/null 2>&1 || true
}

# Trap EXIT, SIGINT, SIGTERM to run cleanup
trap cleanup EXIT SIGINT SIGTERM

echo "Starting temporary Redis container from $IMAGE..."
docker run --name "$CONTAINER_NAME" -p 6379:6379 -d "$IMAGE"

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

echo "Redis is online!"

echo "Running Server Tests..."
pushd server > /dev/null
npm test
popd > /dev/null

echo "Running Client Tests..."
pushd client > /dev/null
npm test
popd > /dev/null

echo "All tests passed successfully!"
