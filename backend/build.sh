#!/usr/bin/env bash
# Render Build Script — installs deps, seeds DB with XGBoost scoring
set -e

echo "=== Installing Python dependencies ==="
pip install --upgrade pip
pip install -r requirements.txt

echo "=== Seeding database (XGBoost scoring 120k defects) ==="
python seed.py

echo "=== Build complete ==="
