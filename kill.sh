#!/bin/bash

# Stop all running Docker containers
echo "Stopping all running Docker containers..."
docker stop $(docker ps -q)

# Remove all stopped Docker containers
echo "Removing all stopped Docker containers..."
docker rm $(docker ps -a -q)

echo "All Docker services have been stopped and removed."
