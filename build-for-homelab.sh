#!/bin/bash
# Usage: ./build-for-homelab.sh
# Then on home-network run deployment with docker compose

# Build locally
docker build -t registry.lintula.xyz/receipt-raven:latest -f ./backend/Dockerfile .
docker build -t registry.lintula.xyz/receipt-raven-beancount-service:latest -f ./beancount-service/Dockerfile .

# Push to homelab registry
docker push registry.lintula.xyz/receipt-raven:latest
docker push registry.lintula.xyz/receipt-raven-beancount-service:latest

