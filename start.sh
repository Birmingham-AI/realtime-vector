#!/bin/bash

# Run our database services and Ollama
docker compose up -d &

# Wait for everything to be up...
wait

# Build and start our Hasura engine and connectors
(
  cd hasura && HASURA_DDN_PAT=$(ddn auth print-pat) docker compose --env-file .env up --build --watch
) &
