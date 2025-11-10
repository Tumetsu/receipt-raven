#!/bin/bash
# Usage: ./build-for-gitea.sh
# Then on home-network run deployment with docker compose

set -e  # Exit on error

echo "Building frontend locally to avoid Docker memory issues..."
cd frontend
npm run build
cd ..

echo "Building Docker images..."
export DOCKER_DEFAULT_PLATFORM=linux/amd64
docker build -t gitea.lintula.xyz/tuomas/receipt-raven:latest -f ./backend/Dockerfile .
docker build -t gitea.lintula.xyz/tuomas/receipt-raven-beancount-service:latest -f ./beancount-service/Dockerfile .

echo "Pushing to homelab registry..."
docker push gitea.lintula.xyz/tuomas/receipt-raven:latest
docker push gitea.lintula.xyz/tuomas/receipt-raven-beancount-service:latest

echo "Done!"
