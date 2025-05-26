#!/bin/bash

# Load environment variables from .env.local
export $(cat .env.local | grep -v '^#' | xargs)

# Run the Prisma migration
npx prisma migrate dev --name "$1"
