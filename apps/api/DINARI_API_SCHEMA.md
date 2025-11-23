# Dinari API Schema Documentation

本文档记录了 Dinari API 的实际响应结构，基于 API 文档和实际测试。

## 认证

所有 API 请求都需要以下 headers：

- `X-API-Key-Id`: API Key ID
- `X-API-Secret-Key`: API Secret Key
- `accept: application/json`
- `content-type: application/json` (POST/PUT 请求)

## API 端点

### 1. POST /entities/

创建实体（Entity）

**请求体：**

```json
{
  "name": "Mark",
  "reference_id": "019aad37-e3b8-71d0-8a23-b6bd6af07195"
}
```

**响应：**

```json
{
  "entity_type": "INDIVIDUAL",
  "id": "019aadf2-888f-72ef-8162-b002cc9ee048",
  "is_kyc_complete": false,
  "name": "Mark",
  "nationality": null,
  "reference_id": "019aad37-e3b8-71d0-8a23-b6bd6af07195"
}
```

**字段说明：**

- `entity_type`: 实体类型，如 "INDIVIDUAL"
- `id`: 实体 ID (UUID)
- `is_kyc_complete`: KYC 完成状态
- `name`: 实体名称
- `nationality`: 国籍（可为 null）
- `reference_id`: 参考 ID

---

### 2. GET /entities/

获取所有实体列表

**响应：**

```json
[
  {
    "entity_type": "INDIVIDUAL",
    "id": "019aadf2-888f-72ef-8162-b002cc9ee048",
    "is_kyc_complete": false,
    "name": "Mark",
    "nationality": null,
    "reference_id": "019aad37-e3b8-71d0-8a23-b6bd6af07195"
  }
]
```

---

### 3. POST /entities/{entity_id}/accounts

为实体创建账户

**路径参数：**

- `entity_id`: 实体 ID (UUID)

**响应：**

```json
{
  "id": "account-uuid",
  "entity_id": "entity-uuid",
  "status": "active",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z"
}
```

---

### 4. GET /entities/{entity_id}/accounts

获取实体的所有账户

**路径参数：**

- `entity_id`: 实体 ID (UUID)

**响应：**

```json
[
  {
    "id": "account-uuid",
    "entity_id": "entity-uuid",
    "status": "active",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
]
```

---

### 5. GET /accounts/{account_id}/wallet/external/nonce

获取钱包连接 nonce（用于签名验证）

**路径参数：**

- `account_id`: 账户 ID (UUID)

**查询参数：**

- `wallet_address`: 钱包地址 (string, required)
- `chain_id`: 链 ID (string enum, required)
  - 允许值：`eip155:1`, `eip155:42161`, `eip155:8453`, `eip155:81457`, `eip155:98866`, `eip155:0`

**响应：**

```json
{
  "nonce": "uuid",
  "message": "Sign this message to connect your wallet: ..."
}
```

**字段说明：**

- `nonce`: 用于签名的 nonce (UUID)
- `message`: 需要签名的消息

---

### 6. POST /accounts/{account_id}/wallet/external

连接外部钱包到账户

**路径参数：**

- `account_id`: 账户 ID (UUID)

**请求体：**

```json
{
  "signature": "0x...",
  "nonce": "uuid",
  "wallet_address": "0x...",
  "chain_id": "eip155:1"
}
```

**字段说明：**

- `signature`: 签名 payload（使用钱包签名连接消息）
- `nonce`: nonce（从 GET /wallet/external/nonce 获取）
- `wallet_address`: 钱包地址
- `chain_id`: CAIP-2 格式的链 ID

**响应：**

```json
{
  "address": "0x...",
  "chain_id": "eip155:1",
  "account_id": "account-uuid"
}
```

---

### 7. GET /accounts/{account_id}/wallet

获取账户的钱包信息

**路径参数：**

- `account_id`: 账户 ID (UUID)

**响应：**

```json
{
  "address": "0x...",
  "chain_id": "eip155:1",
  "account_id": "account-uuid"
}
```

---

### 8. GET /market_data/stocks/

获取所有可用股票

**响应：**

```json
[
  {
    "id": "stock-id",
    "symbol": "AAPL",
    "display_name": "Apple Inc.",
    "name": "Apple Inc.",
    "exchange": "NASDAQ",
    "currency": "USD",
    "current_price": 150.0,
    "price": 150.0,
    "day_change_pct": 1.5,
    "change_percent": 1.5
  }
]
```

**字段说明：**

- `id`: 股票 ID
- `symbol`: 股票代码
- `display_name`: 显示名称
- `name`: 股票名称
- `exchange`: 交易所
- `currency`: 货币（通常为 "USD"）
- `current_price` / `price`: 当前价格
- `day_change_pct` / `change_percent`: 日涨跌幅百分比

---

### 9. POST /orders

创建订单

**请求体：**

```json
{
  "account_id": "account-uuid",
  "stock_symbol": "AAPL",
  "order_type": "market",
  "side": "buy",
  "amount": 100
}
```

**字段说明：**

- `account_id`: 账户 ID (UUID)
- `stock_symbol`: 股票代码
- `order_type`: 订单类型（"market" 或 "limit"）
- `side`: 方向（"buy" 或 "sell"）
- `amount`: 金额（USD）

**响应：**

```json
{
  "id": "order-uuid",
  "account_id": "account-uuid",
  "stock_symbol": "AAPL",
  "order_type": "market",
  "side": "buy",
  "amount": 100,
  "status": "pending",
  "created_at": "2025-01-01T00:00:00Z"
}
```

---

### 10. POST /accounts/{account_id}/order_requests/stocks/eip155/prepare

准备代理订单（Proxied Order）

**路径参数：**

- `account_id`: 账户 ID (UUID)

**请求体：**

```json
{
  "chain_id": "eip155:1",
  "order_tif": "DAY",
  "order_side": "BUY",
  "order_type": "MARKET",
  "stock_id": "stock-uuid",
  "payment_token": "0x...",
  "payment_token_quantity": 100
}
```

**字段说明：**

- `chain_id`: CAIP-2 格式的链 ID（允许值：`eip155:1`, `eip155:42161`, `eip155:8453`, `eip155:81457`, `eip155:98866`）
- `order_tif`: 订单有效期（"DAY", "GTC", "IOC", "FOK"）
- `order_side`: 订单方向（"BUY" 或 "SELL"）
- `order_type`: 订单类型（"MARKET" 或 "LIMIT"）
- `stock_id`: 股票 ID (UUID)
- `payment_token`: 支付代币地址
- `payment_token_quantity`: 支付代币数量（market buy 订单必需）
- `asset_token_quantity`: 资产代币数量（limit 订单和 market sell 订单必需）
- `limit_price`: 限价（limit 订单必需）

**响应：**

```json
{
  "id": "prepared-order-uuid",
  "deadline": "2025-01-01T00:00:00Z",
  "permit_typed_data": {
    "domain": {...},
    "types": {...},
    "message": {...},
    "primaryType": "Permit"
  },
  "order_typed_data": {
    "domain": {...},
    "types": {...},
    "message": {...},
    "primaryType": "Order"
  },
  "fees": [
    {
      "type": "NETWORK",
      "fee_in_wei": "1000000000000000",
      "fee_in_eth": 0.001
    }
  ]
}
```

---

### 11. POST /accounts/{account_id}/order_requests/stocks/eip155

创建代理订单（从准备好的订单）

**路径参数：**

- `account_id`: 账户 ID (UUID)

**请求体：**

```json
{
  "prepared_proxied_order_id": "prepared-order-uuid",
  "permit_signature": "0x...",
  "order_signature": "0x..."
}
```

**字段说明：**

- `prepared_proxied_order_id`: 准备好的订单 ID (UUID)
- `permit_signature`: permit typed data 的签名（允许 Dinari 花费代币）
- `order_signature`: order typed data 的签名（订单数据）

**响应：**

```json
{
  "id": "order-request-uuid",
  "account_id": "account-uuid",
  "recipient_account_id": null,
  "status": "PENDING",
  "created_dt": "2025-01-01T00:00:00Z",
  "order_side": "BUY",
  "order_type": "MARKET",
  "order_tif": "DAY",
  "order_id": "order-uuid"
}
```

**字段说明：**

- `id`: OrderRequest ID (UUID)
- `account_id`: 账户 ID
- `status`: 订单状态（"QUOTED", "PENDING", "PENDING_BRIDGE", "SUBMITTED", "ERROR", "CANCELLED"）
- `order_id`: 订单 ID（如果订单已创建）

---

## 用户流程

### 完整设置流程

1. **创建实体** (可选，如果已有实体可跳过)

   ```
   POST /entities/
   Body: { "name": "User Name", "reference_id": "..." }
   ```

2. **创建账户**

   ```
   POST /entities/{entity_id}/accounts
   ```

3. **获取钱包连接 nonce**

   ```
   GET /accounts/{account_id}/wallet/external/nonce?wallet_address=0x...&chain_id=eip155:1
   ```

4. **用户签名消息**（前端处理）
   - 使用钱包签名 `nonce` 返回的 `message`

5. **连接钱包**

   ```
   POST /accounts/{account_id}/wallet/external
   Body: {
     "signature": "0x...",
     "nonce": "uuid",
     "wallet_address": "0x...",
     "chain_id": "eip155:1"
   }
   ```

6. **购买股票（代理订单流程）**

   **步骤 1: 准备代理订单**

   ```
   POST /accounts/{account_id}/order_requests/stocks/eip155/prepare
   Body: {
     "chain_id": "eip155:1",
     "order_tif": "DAY",
     "order_side": "BUY",
     "order_type": "MARKET",
     "stock_id": "stock-uuid",
     "payment_token": "0x...",
     "payment_token_quantity": 100
   }
   ```

   **响应：**

   ```json
   {
     "id": "prepared-order-uuid",
     "deadline": "2025-01-01T00:00:00Z",
     "permit_typed_data": {
       "domain": {...},
       "types": {...},
       "message": {...},
       "primaryType": "Permit"
     },
     "order_typed_data": {
       "domain": {...},
       "types": {...},
       "message": {...},
       "primaryType": "Order"
     },
     "fees": [...]
   }
   ```

   **步骤 2: 用户签名**
   - 使用钱包签名 `permit_typed_data`（允许 Dinari 花费代币）
   - 使用钱包签名 `order_typed_data`（订单数据）

   **步骤 3: 创建代理订单**

   ```
   POST /accounts/{account_id}/order_requests/stocks/eip155
   Body: {
     "prepared_proxied_order_id": "prepared-order-uuid",
     "permit_signature": "0x...",
     "order_signature": "0x..."
   }
   ```

   **响应：**

   ```json
   {
     "id": "order-request-uuid",
     "account_id": "account-uuid",
     "status": "PENDING",
     "created_dt": "2025-01-01T00:00:00Z",
     "order_side": "BUY",
     "order_type": "MARKET",
     "order_tif": "DAY",
     "order_id": "order-uuid"
   }
   ```

---

### 11. GET /dinari/account

查询用户 Dinari 账户信息

**认证**: 需要 JWT Token

**响应**:

```json
{
  "accountId": "019aad37-b919-7996-91fe-107ef2d10d72",
  "walletAddress": "0xb2a3D4CC1E147f8726B1BCf9944ACe13e811C120",
  "chainId": "eip155:0",
  "entityId": "019aad35-96f3-7200-8f02-9b5092473462",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z"
}
```

**字段说明**:

- `accountId`: Dinari 账户 ID (UUID)
- `walletAddress`: 连接的钱包地址（checksum 格式，自动 fallback）
- `chainId`: 链 ID（默认 `eip155:0`，自动 fallback）
- `entityId`: 实体 ID
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

**注意**:

- 如果账户未设置，返回 `accountId: null` 和提示消息
- `walletAddress` fallback: `0xb2a3D4CC1E147f8726B1BCf9944ACe13e811C120`
- `chainId` fallback: `eip155:0`

---

### 12. GET /dinari/wallet/nonce

获取钱包连接 Nonce（内部使用）

**认证**: 需要 JWT Token

**功能**:

- 自动从用户存储的数据中获取 `walletAddress` 和 `chainId`
- 无需任何参数
- 主要用于内部流程

**响应**:

```json
{
  "nonce": "019aae45-6188-7ffc-b57b-0a61f4c43c29",
  "message": "By signing this message, I affirm that I am the rightful and exclusive owner of this wallet...",
  "accountId": "019aad37-b919-7996-91fe-107ef2d10d72"
}
```

**注意**:

- 用户登录时已自动完成钱包连接，此接口主要用于内部流程
- 所有参数自动从用户数据获取（带 fallback）

---

### 13. POST /dinari/faucet

请求 Sandbox Faucet（充值测试资金）

**认证**: 需要 JWT Token

**功能**:

- 自动使用用户的 `chainId`（无需参数）
- 为用户钱包充值 1,000 mockUSD（仅 sandbox 模式）

**响应**: Dinari API 响应

**注意**:

- 用户登录时已自动调用一次 faucet
- 可以手动调用此接口再次充值
- 统一使用 sandbox API: `https://api-enterprise.sbt.dinari.com/api/v2`

---

## 错误响应

所有错误响应格式：

```json
{
  "error": "Error message",
  "error_id": "uuid",
  "message": "Unauthorized",
  "status": 401
}
```

常见状态码：

- `200`: 成功
- `400`: 请求错误
- `401`: 未授权
- `404`: 未找到
- `500`: 服务器错误
