#!/bin/bash

# Function to check if Ollama service is running
check_ollama() {
  if ! nc -z localhost 11434; then
    echo "Ollama service is not running. Please start the Ollama service on your desktop."
    exit 1
  fi

  if ! ollama list | grep -q "llama3.1"; then
    echo "Model llama3.1 is not available. Please ensure the model is available in Ollama."
    exit 1
  fi
}

# Run the check before anything starts
check_ollama

# Run our database services and Ollama
docker compose up -d &

# Wait for everything to be up...
wait

# Login to Hasura DDN
ddn auth login

# Wait for that to be resolved
wait

# Create a new build
cd hasura && ddn supergraph build local

# Build and start our Hasura engine and connectors
HASURA_DDN_PAT=$(ddn auth print-pat) docker compose --env-file .env up --build -d

# Navigate to the Ollama connector and install deps
cd app/connector/ollama && npm i

# Wait for everything to be installed
wait

# Then, start it
ddn connector setenv --connector connector.yaml -- npm run start
