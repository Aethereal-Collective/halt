#!/bin/bash
# Rebuild and restart the Halt landing container. Same flow as aethereal-website/deployer.sh.
# Serves on host port 4001 (aethereal.top uses 4000); point halt.aethereal.top at it in your reverse proxy.
set -e
cd "$(dirname "$0")/.."   # repo root: the image needs docs/ as well as site/

docker container stop halt-landing 2>/dev/null || true
docker container rm halt-landing 2>/dev/null || true
docker image rm halt-landing 2>/dev/null || true
docker build -f site/Dockerfile -t halt-landing .
docker run -d -p 4001:3000 --restart unless-stopped --name halt-landing halt-landing
