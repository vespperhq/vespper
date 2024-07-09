#!/bin/bash
# This script downloads the docker-compose.yml file and starts the Merlinn network using docker compose.

echo "Creating merlinn directory"
mkdir -p merlinn
test -e merlinn

# Change directory to merlinn
cd merlinn

which curl &> /dev/null || echo "curl not installed" 
curl https://raw.githubusercontent.com/merlinn-co/merlinn/main/docker-compose.yml --output docker-compose.yml

docker compose up -d