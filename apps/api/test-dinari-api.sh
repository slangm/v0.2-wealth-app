#!/bin/bash

# Dinari API Schema Testing Script
# This script tests all Dinari API endpoints to determine the actual response schemas
# 
# Usage: 
#   Set environment variables before running:
#   export DINARI_API_KEY_ID="your-key-id"
#   export DINARI_SECRET_KEY="your-secret-key"
#   export DINARI_API_ENTITY_ID="your-entity-id" (optional)
#   bash test-dinari-api.sh

# API Configuration
DINARI_API_BASE="${DINARI_API_BASE:-https://api-enterprise.sandbox.dinari.com/api/v2}"
DINARI_API_KEY_ID="${DINARI_API_KEY_ID:-}"
DINARI_API_SECRET_KEY="${DINARI_SECRET_KEY:-}"
DINARI_API_ENTITY_ID="${DINARI_API_ENTITY_ID:-}"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Dinari API Schema Testing ===${NC}\n"

# Check if required variables are set
if [ -z "$DINARI_API_KEY_ID" ] || [ -z "$DINARI_API_SECRET_KEY" ]; then
  echo -e "${RED}Error: DINARI_API_KEY_ID and DINARI_SECRET_KEY must be set${NC}"
  echo "Please set them as environment variables:"
  echo "  export DINARI_API_KEY_ID='your-key-id'"
  echo "  export DINARI_SECRET_KEY='your-secret-key'"
  echo "  export DINARI_API_ENTITY_ID='your-entity-id' (optional)"
  exit 1
fi

# Test 1: Get Entities
echo -e "${GREEN}1. Testing GET /entities/${NC}"
echo "curl --request GET \\"
echo "  --url ${DINARI_API_BASE}/entities/ \\"
echo "  --header 'X-API-Key-Id: ${DINARI_API_KEY_ID}' \\"
echo "  --header 'X-API-Secret-Key: ${DINARI_API_SECRET_KEY}' \\"
echo "  --header 'accept: application/json'"
echo ""
RESPONSE=$(curl -s --request GET \
  --url "${DINARI_API_BASE}/entities/" \
  --header "X-API-Key-Id: ${DINARI_API_KEY_ID}" \
  --header "X-API-Secret-Key: ${DINARI_API_SECRET_KEY}" \
  --header "accept: application/json")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo -e "\n${YELLOW}--- Schema: entities response ---${NC}\n"

# Extract entity ID if not set
if [ -z "$DINARI_API_ENTITY_ID" ] && [ ! -z "$RESPONSE" ]; then
  ENTITY_ID=$(echo "$RESPONSE" | jq -r '.[0].id // .[0].entity_id // empty' 2>/dev/null)
  if [ ! -z "$ENTITY_ID" ] && [ "$ENTITY_ID" != "null" ]; then
    DINARI_API_ENTITY_ID="$ENTITY_ID"
    echo -e "${GREEN}Found Entity ID: ${ENTITY_ID}${NC}\n"
  fi
fi

if [ -z "$DINARI_API_ENTITY_ID" ]; then
  echo -e "${YELLOW}Warning: No entity ID found. Skipping entity-dependent tests.${NC}\n"
  exit 0
fi

# Test 2: Get Accounts for Entity
echo -e "${GREEN}2. Testing GET /entities/{entityId}/accounts${NC}"
echo "curl --request GET \\"
echo "  --url ${DINARI_API_BASE}/entities/${DINARI_API_ENTITY_ID}/accounts \\"
echo "  --header 'X-API-Key-Id: ${DINARI_API_KEY_ID}' \\"
echo "  --header 'X-API-Secret-Key: ${DINARI_API_SECRET_KEY}' \\"
echo "  --header 'accept: application/json'"
echo ""
RESPONSE=$(curl -s --request GET \
  --url "${DINARI_API_BASE}/entities/${DINARI_API_ENTITY_ID}/accounts" \
  --header "X-API-Key-Id: ${DINARI_API_KEY_ID}" \
  --header "X-API-Secret-Key: ${DINARI_API_SECRET_KEY}" \
  --header "accept: application/json")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo -e "\n${YELLOW}--- Schema: accounts response ---${NC}\n"

# Extract account ID if available
ACCOUNT_ID=$(echo "$RESPONSE" | jq -r '.[0].id // .results[0].id // empty' 2>/dev/null)
if [ -z "$ACCOUNT_ID" ] || [ "$ACCOUNT_ID" == "null" ]; then
  echo -e "${YELLOW}No account found. Creating one...${NC}\n"
  
  # Test 3: Create Account for Entity
  echo -e "${GREEN}3. Testing POST /entities/{entityId}/accounts${NC}"
  echo "curl --request POST \\"
  echo "  --url ${DINARI_API_BASE}/entities/${DINARI_API_ENTITY_ID}/accounts \\"
  echo "  --header 'X-API-Key-Id: ${DINARI_API_KEY_ID}' \\"
  echo "  --header 'X-API-Secret-Key: ${DINARI_API_SECRET_KEY}' \\"
  echo "  --header 'accept: application/json' \\"
  echo "  --header 'content-type: application/json'"
  echo ""
  RESPONSE=$(curl -s --request POST \
    --url "${DINARI_API_BASE}/entities/${DINARI_API_ENTITY_ID}/accounts" \
    --header "X-API-Key-Id: ${DINARI_API_KEY_ID}" \
    --header "X-API-Secret-Key: ${DINARI_API_SECRET_KEY}" \
    --header "accept: application/json" \
    --header "content-type: application/json")
  echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
  echo -e "\n${YELLOW}--- Schema: create account response ---${NC}\n"
  
  ACCOUNT_ID=$(echo "$RESPONSE" | jq -r '.id // .account_id // empty' 2>/dev/null)
fi

if [ -z "$ACCOUNT_ID" ] || [ "$ACCOUNT_ID" == "null" ]; then
  echo -e "${YELLOW}Warning: No account ID available. Skipping account-dependent tests.${NC}\n"
  exit 0
fi

echo -e "${GREEN}Using Account ID: ${ACCOUNT_ID}${NC}\n"

# Test 4: Get Wallet for Account
echo -e "${GREEN}4. Testing GET /accounts/{accountId}/wallet${NC}"
echo "curl --request GET \\"
echo "  --url ${DINARI_API_BASE}/accounts/${ACCOUNT_ID}/wallet \\"
echo "  --header 'X-API-Key-Id: ${DINARI_API_KEY_ID}' \\"
echo "  --header 'X-API-Secret-Key: ${DINARI_API_SECRET_KEY}' \\"
echo "  --header 'accept: application/json'"
echo ""
RESPONSE=$(curl -s --request GET \
  --url "${DINARI_API_BASE}/accounts/${ACCOUNT_ID}/wallet" \
  --header "X-API-Key-Id: ${DINARI_API_KEY_ID}" \
  --header "X-API-Secret-Key: ${DINARI_API_SECRET_KEY}" \
  --header "accept: application/json")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo -e "\n${YELLOW}--- Schema: get wallet response ---${NC}\n"

# Test 5: Create External Wallet for Account
echo -e "${GREEN}5. Testing POST /accounts/{accountId}/wallet/external${NC}"
echo "curl --request POST \\"
echo "  --url ${DINARI_API_BASE}/accounts/${ACCOUNT_ID}/wallet/external \\"
echo "  --header 'X-API-Key-Id: ${DINARI_API_KEY_ID}' \\"
echo "  --header 'X-API-Secret-Key: ${DINARI_API_SECRET_KEY}' \\"
echo "  --header 'accept: application/json' \\"
echo "  --header 'content-type: application/json' \\"
echo "  --data '{\"chain_id\": \"eip155:1\"}'"
echo ""
RESPONSE=$(curl -s --request POST \
  --url "${DINARI_API_BASE}/accounts/${ACCOUNT_ID}/wallet/external" \
  --header "X-API-Key-Id: ${DINARI_API_KEY_ID}" \
  --header "X-API-Secret-Key: ${DINARI_API_SECRET_KEY}" \
  --header "accept: application/json" \
  --header "content-type: application/json" \
  --data '{"chain_id": "eip155:1"}')
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo -e "\n${YELLOW}--- Schema: create external wallet response ---${NC}\n"

# Test 6: Get Stocks
echo -e "${GREEN}6. Testing GET /market_data/stocks/${NC}"
echo "curl --request GET \\"
echo "  --url ${DINARI_API_BASE}/market_data/stocks/ \\"
echo "  --header 'X-API-Key-Id: ${DINARI_API_KEY_ID}' \\"
echo "  --header 'X-API-Secret-Key: ${DINARI_API_SECRET_KEY}' \\"
echo "  --header 'accept: application/json'"
echo ""
RESPONSE=$(curl -s --request GET \
  --url "${DINARI_API_BASE}/market_data/stocks/" \
  --header "X-API-Key-Id: ${DINARI_API_KEY_ID}" \
  --header "X-API-Secret-Key: ${DINARI_API_SECRET_KEY}" \
  --header "accept: application/json")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo -e "\n${YELLOW}--- Schema: stocks response ---${NC}\n"

# Extract first stock symbol for order test
STOCK_SYMBOL=$(echo "$RESPONSE" | jq -r '.[0].symbol // .results[0].symbol // empty' 2>/dev/null)
if [ ! -z "$STOCK_SYMBOL" ] && [ "$STOCK_SYMBOL" != "null" ]; then
  echo -e "${GREEN}Found Stock Symbol: ${STOCK_SYMBOL}${NC}\n"
  
  # Test 7: Create Market Buy Order (if account and stock are available)
  echo -e "${GREEN}7. Testing POST /orders (Market Buy)${NC}"
  echo "curl --request POST \\"
  echo "  --url ${DINARI_API_BASE}/orders \\"
  echo "  --header 'X-API-Key-Id: ${DINARI_API_KEY_ID}' \\"
  echo "  --header 'X-API-Secret-Key: ${DINARI_API_SECRET_KEY}' \\"
  echo "  --header 'accept: application/json' \\"
  echo "  --header 'content-type: application/json' \\"
  echo "  --data '{\"account_id\": \"${ACCOUNT_ID}\", \"stock_symbol\": \"${STOCK_SYMBOL}\", \"order_type\": \"market\", \"side\": \"buy\", \"amount\": 100}'"
  echo ""
  RESPONSE=$(curl -s --request POST \
    --url "${DINARI_API_BASE}/orders" \
    --header "X-API-Key-Id: ${DINARI_API_KEY_ID}" \
    --header "X-API-Secret-Key: ${DINARI_API_SECRET_KEY}" \
    --header "accept: application/json" \
    --header "content-type: application/json" \
    --data "{\"account_id\": \"${ACCOUNT_ID}\", \"stock_symbol\": \"${STOCK_SYMBOL}\", \"order_type\": \"market\", \"side\": \"buy\", \"amount\": 100}")
  echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
  echo -e "\n${YELLOW}--- Schema: create order response ---${NC}\n"
fi

echo -e "${BLUE}=== Testing Complete ===${NC}"
