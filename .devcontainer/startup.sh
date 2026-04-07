#!/bin/bash
# .devcontainer/startup.sh
# Auto-starts MongoDB (if not running) then both dev servers.

# Start MongoDB in the background if not already running
if ! pgrep mongod > /dev/null 2>&1; then
  sudo mkdir -p /data/db
  sudo chown -R $(whoami) /data/db
  mongod --fork --logpath /tmp/mongod.log --dbpath /data/db
fi

# Developed and Designed by Trophy Developers
npm run dev