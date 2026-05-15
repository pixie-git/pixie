#!/bin/bash

# Infrastructure/Integration Test Script
# Verifies load balancing and dynamic scaling of servers

set -e

# Configuration
API_URL="http://localhost:3000/api/health"
REQUEST_COUNT=20

# Cleanup on exit or failure
cleanup() {
  echo "Cleaning up environment..."
  docker compose down > /dev/null 2>&1
}
trap cleanup EXIT SIGINT SIGTERM

wait_for_ready() {
  local expected=$1
  echo "Waiting for $expected server(s) to be registered in load balancer..."
  local retries=30
  while [ $retries -gt 0 ]; do
    local count=$(for i in $(seq 1 10); do curl -s "$API_URL" | grep -o '"serverId":"[^"]*"' | cut -d'"' -f4; done | sort | uniq | wc -l)
    if [ "$count" -eq "$expected" ]; then
      echo "Load balancer ready with $count servers"
      return 0
    fi
    sleep 1
    retries=$((retries - 1))
  done
  echo "Timeout waiting for $expected servers"
  exit 1
}

run_load_test() {
  local expected=$1
  echo "Testing distribution across $expected server(s) with $REQUEST_COUNT requests..."
  
  # Run requests
  local results=""
  for i in $(seq 1 "$REQUEST_COUNT"); do
    local res=$(curl -s "$API_URL" | grep -o '"serverId":"[^"]*"' | cut -d'"' -f4)
    results="${results}${res}\n"
  done
  
  local unique_count=$(printf "$results" | sed '/^$/d' | sort | uniq | wc -l)
  
  echo "Result: Traffic distributed to $unique_count unique server(s)"
  
  if [ "$unique_count" -ne "$expected" ]; then
    echo "Verification FAILED: Expected $expected unique servers, found $unique_count"
    # Show distribution for debugging
    echo "Distribution details:"
    printf "$results" | sed '/^$/d' | sort | uniq -c
    exit 1
  fi
  echo "Verification PASSED"
}

# --- TEST EXECUTION ---

echo "Scenario 1: Starting with 3 servers"
docker compose up -d --build --scale server=3 server mongo redis traefik
wait_for_ready 3
run_load_test 3

echo "Scenario 2: Scaling up to 5 servers"
docker compose up -d --scale server=5 server
wait_for_ready 5
run_load_test 5

echo "Scenario 3: Scaling down to 2 servers"
docker compose up -d --scale server=2 server
wait_for_ready 2
run_load_test 2

echo "All infrastructure tests completed successfully"
