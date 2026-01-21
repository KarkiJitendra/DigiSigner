#!/usr/bin/env bash
# exit on error
set -o errexit

echo "Starting Django project build..."

# Upgrade pip and install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --noinput

# Run migrations
python manage.py migrate

echo "Build completed successfully!"