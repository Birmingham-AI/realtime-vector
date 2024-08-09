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

# Build and start our Hasura engine and connectors
(
  cd hasura && HASURA_DDN_PAT=$(ddn auth print-pat) docker compose --env-file .env up --build -d
) &

# Navigate to the Ollama connector and start it
(
  cd hasura/app/connector/ollama && ddn connector setenv --connector connector.yaml -- npm run start
)
