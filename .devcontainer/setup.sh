#!/bin/bash
# .devcontainer/setup.sh
# Runs once after container creation: installs MongoDB and all npm dependencies.

set -e

# Install MongoDB (Debian-based devcontainer image)
if ! command -v mongod &> /dev/null; then
  sudo apt-get update -qq
  sudo apt-get install -y --no-install-recommends gnupg curl
  curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
    sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
  echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] \
    https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
    sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
  sudo apt-get update -qq
  sudo apt-get install -y --no-install-recommends mongodb-org
  sudo mkdir -p /data/db && sudo chown -R $(whoami) /data/db
fi

# Install all npm dependencies
cd /workspaces/mukonoTalks
npm run install:all

echo "✅ Setup complete. Run 'npm run dev' to start the project."

# Developed and Designed by Trophy Developers
