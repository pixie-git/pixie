#!/bin/bash

# Start a temporary Redis container
echo "Starting Redis for integration tests..."
docker run --name pixie-test-redis -p 6379:6379 -d redis:alpine

# Wait for Redis to be ready
echo "Waiting for Redis to be ready..."
until docker exec pixie-test-redis redis-cli ping | grep -q PONG; do
  sleep 1
done

# Run the tests
echo "Running tests..."
npm test test/integration/state-hydration.test.ts

# Cleanup
echo "Cleaning up Redis container..."
docker stop pixie-test-redis
docker rm pixie-test-redis
