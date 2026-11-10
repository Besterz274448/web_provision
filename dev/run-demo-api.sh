#!/bin/sh
# Runs the real provisioning API on sample data, for working on this UI without a real database.
# It uses only the local test MySQL from docker-compose.test.yml, and recreates demo_provisioning.
# flow-api and flow-auth are replaced by dev/fake-flow.ts, so nothing reaches a real service.
# The sweep is off, so the sample rows stay as they are. Requests sent from the UI still run.
set -eu

web=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
api=$(CDPATH= cd -- "$web/../tenant-provisioning" && pwd)
container=tenant-provisioning-test-mysql
password=test-only
port=${DEMO_API_PORT:-18080}
flow_port=${FAKE_FLOW_PORT:-18081}

docker compose -f "$api/docker-compose.test.yml" up -d --wait

sql() {
  docker exec -i "$container" mysql --default-character-set=utf8mb4 -uroot "-p$password" "$@" 2>/dev/null
}

echo "DROP DATABASE IF EXISTS demo_provisioning; CREATE DATABASE demo_provisioning CHARACTER SET utf8mb4;" | sql
for file in "$api"/migrations/*.sql "$api/seeds/module_catalog.sql" "$api/seeds/console_users.sql" "$api/seeds/addresses.sql" "$web/dev/demo-seed.sql"; do
  sql --init-command="SET time_zone='+00:00'" demo_provisioning < "$file"
done

# Explicit values win over tenant-provisioning/.env, which the service also reads.
export GOWORK=off
export ADDR=":$port"
export SERVICE_TOKEN=demo-token
export FLOW_API_TOKEN=demo-flow-api
export FLOW_AUTH_TOKEN=demo-flow-auth
export FLOW_API_URL="http://localhost:$flow_port/flow-api"
export FLOW_AUTH_URL="http://localhost:$flow_port/flow-auth"
export PASSWORD_ENC_KEY=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=
export SWEEP_ENABLED=false
# The demo key of POST /shop-registrations, for sending CCPlus registrations by hand.
export SHOP_REGISTRATION_ACCESS_KEY=demo-shop-key
export DB_PROVISIONING="root:$password@tcp(127.0.0.1:33067)/demo_provisioning?charset=utf8mb4"
export FAKE_FLOW_PORT="$flow_port"
export PROVISION_URL="http://localhost:$port"

bun "$web/dev/fake-flow.ts" &
flow_pid=$!
trap 'kill "$flow_pid" 2>/dev/null' EXIT INT TERM

cd "$api"
go run ./cmd/server
