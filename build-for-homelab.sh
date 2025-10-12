#!/bin/bash
# Usage: ./build-for-homelab.sh
# Then on home-network run deployment with docker compose

# Detect OS and set appropriate default context
if [[ "$OSTYPE" == "darwin"* ]]; then
    DEFAULT_CONTEXT="colima"
else
    DEFAULT_CONTEXT="default"
fi

docker context use services-vm
docker build -t receipt-raven -f ./backend/Dockerfile .
docker build -t receipt-raven-beancount-service -f ./beancount-service/Dockerfile .
docker context use $DEFAULT_CONTEXT
