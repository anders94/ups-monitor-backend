#!/bin/bash

# Database Setup Script
# Runs all migrations to initialize the UPS Monitor database

set -e

# Load environment variables
if [ -f .env ]; then
    # Load only the database-related variables we need
    DB_HOST=$(grep "^DB_HOST=" .env | cut -d '=' -f2)
    DB_PORT=$(grep "^DB_PORT=" .env | cut -d '=' -f2)
    DB_NAME=$(grep "^DB_NAME=" .env | cut -d '=' -f2)
    DB_USER=$(grep "^DB_USER=" .env | cut -d '=' -f2)
    DB_PASSWORD=$(grep "^DB_PASSWORD=" .env | cut -d '=' -f2)
else
    echo "Error: .env file not found"
    echo "Please copy .env.example to .env and configure your database settings"
    exit 1
fi

# Database connection parameters
PGHOST="${DB_HOST:-localhost}"
PGPORT="${DB_PORT:-5432}"
PGDATABASE="${DB_NAME:-ups_monitor}"
PGUSER="${DB_USER:-ups_admin}"
PGPASSWORD="${DB_PASSWORD}"

export PGPASSWORD

echo "======================================"
echo "UPS Monitor Database Setup"
echo "======================================"
echo "Host: $PGHOST"
echo "Port: $PGPORT"
echo "Database: $PGDATABASE"
echo "User: $PGUSER"
echo "======================================"
echo ""

# Check if database exists
echo "Checking database connectivity..."
if ! psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c '\q' 2>/dev/null; then
    echo ""
    echo "ERROR: Cannot connect to database '$PGDATABASE'"
    echo ""
    echo "Please ensure:"
    echo "  1. PostgreSQL is running"
    echo "  2. Database '$PGDATABASE' exists"
    echo "  3. User '$PGUSER' has access to the database"
    echo ""
    echo "To create the database and user, run as PostgreSQL superuser:"
    echo ""
    echo "  sudo -u postgres psql <<EOF"
    echo "  CREATE DATABASE $PGDATABASE;"
    echo "  CREATE USER $PGUSER WITH ENCRYPTED PASSWORD '$PGPASSWORD';"
    echo "  GRANT ALL PRIVILEGES ON DATABASE $PGDATABASE TO $PGUSER;"
    echo "  EOF"
    echo ""
    exit 1
fi

echo "✓ Database connection successful"
echo ""

# Run migrations
MIGRATION_DIR="database/migrations"

if [ ! -d "$MIGRATION_DIR" ]; then
    echo "Error: Migration directory not found at $MIGRATION_DIR"
    exit 1
fi

echo "Running migrations..."
echo ""

for migration in "$MIGRATION_DIR"/*.sql; do
    if [ -f "$migration" ]; then
        filename=$(basename "$migration")
        echo "  → Running $filename..."
        psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f "$migration" -v ON_ERROR_STOP=1 > /dev/null
        echo "    ✓ $filename completed"
    fi
done

echo ""
echo "======================================"
echo "✓ Database setup completed successfully!"
echo "======================================"
echo ""
echo "Next steps:"
echo "  1. Start the application: npm run dev"
echo "  2. Add your first UPS device: npm run seed"
echo ""
