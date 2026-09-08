#!/bin/sh
set -eu

echo "Running database migrations..."
node initDB.js

echo "Starting Sponsorenlauf Tool on port ${PORT:-3000}..."
exec npm start

