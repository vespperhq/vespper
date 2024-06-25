#!/bin/bash

set -e
set -u

function create_user_and_database() {
    local databases=($(echo $1 | tr ',' ' '))
    echo "Creating user and databases: ${databases[@]}"
    for database in "${databases[@]}"; do
        echo "  Creating database '$database'"
        psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
            CREATE DATABASE $database;
EOSQL
    done
}

if [ -n "$POSTGRES_MULTIPLE_DATABASES" ]; then
    echo "Multiple database creation requested: $POSTGRES_MULTIPLE_DATABASES"
    create_user_and_database "$POSTGRES_MULTIPLE_DATABASES"
    echo "Multiple databases created"
fi