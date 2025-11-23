# Dinari 集成流程文档

## 完整用户流程

### 阶段 1: 用户注册/登录（完全自动）

**触发时机**: 用户通过 Google OAuth 登录

**流程**:

1. 用户调用 `POST /auth/google` 登录
2. 系统验证 Google ID Token
3. 创建或更新用户记录
4. **自动触发**（异步，不阻塞登录）:
   - 调用 `DinariUserService.setupUserAccount(userId)`
   - 使用环境变量中的 `DINARI_API_ENTITY_ID`
   - 为每个用户创建独立的 Dinari Account
   - **自动创建并连接钱包**（使用用户的 growth wallet，chain_id: `eip155:0`）
   - **自动调用 Sandbox Faucet**（充值 1,000 mockUSD 测试资金）
   - 保存所有信息到 Supabase (`dinari_users` 表)

**结果**:

- ✅ 用户有 Dinari Account ID
- ✅ 用户已自动连接钱包（walletAddress 和 chainId 已保存）
- ✅ 用户钱包已自动充值 1,000 mockUSD（sandbox 测试资金）

**API 端点**:

- `POST /auth/google` - 登录时自动完成所有设置（账户创建、钱包连接、充值）

**注意**:

- 所有操作都在后端自动完成，无需前端额外调用
- 如果用户已存在账户，会跳过创建步骤（idempotent）
- 钱包地址 fallback: `0xb2a3D4CC1E147f8726B1BCf9944ACe13e811C120`
- Chain ID fallback: `eip155:0`

---

### 阶段 3: 购买股票（简化流程 - 一键确认）

**触发时机**: AI 推荐购买股票，用户点击确认按钮

**流程**（完全自动化）:

1. AI 推荐购买股票（例如："我建议购买 $100 的 AAPL"）
2. 前端显示 `buy_stock` action，包含股票代码和金额
3. 用户点击"确认购买"按钮
4. 前端调用 `POST /dinari/orders/confirm`
5. 后端自动完成所有步骤：
   - 获取股票信息（通过 symbol）
   - 准备代理订单（prepare proxied order）
   - 使用 CDP 钱包自动签名 permit 和 order typed data
   - 创建代理订单（create proxied order）
   - 保存交易记录到 Supabase
   - 返回订单结果

**API**: `POST /dinari/orders/confirm`

**请求体**:

```json
{
  "stockSymbol": "AAPL",
  "amount": 100
}
```

**响应示例**:

```json
{
  "success": true,
  "orderRequestId": "order-request-uuid",
  "orderId": "order-uuid",
  "stockSymbol": "AAPL",
  "amount": 100,
  "status": "PENDING",
  "message": "Successfully placed order for 100 USD worth of AAPL"
}
```

**注意**:

- 所有内部步骤（prepare、签名、create）都已封装，用户无需关心
- 使用 CDP 钱包自动签名，无需用户手动签名
- 订单会自动挂单，使用 free quote（市场价）

---

### 内部接口（已封装，不推荐直接使用）

以下接口已封装在 `POST /dinari/orders/confirm` 中，保留用于向后兼容：

- `POST /dinari/orders/prepare` - 准备订单（内部使用）
- `POST /dinari/orders/create` - 创建订单（内部使用）

---

## 关键配置

## API 端点参考

### 查询用户信息

**API**: `GET /dinari/account`

**功能**: 获取当前用户的完整 Dinari 账户信息

**响应示例**:

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

### 获取钱包连接 Nonce（内部使用）

**API**: `GET /dinari/wallet/nonce`

**功能**: 获取钱包连接 nonce（无需参数，自动从用户数据获取）

**注意**: 此接口主要用于内部流程，用户登录时已自动完成钱包连接

---

## 关键配置

### 环境变量

```env
# Dinari API 配置（统一使用 sandbox）
DINARI_API_BASE=https://api-enterprise.sbt.dinari.com/api/v2
DINARI_API_KEY_ID=019aad37-e3b8-71d0-8a23-b6bd6af07195
DINARI_SECRET_KEY=EFQBbWa_h-4G9WBzpM5_VJXVs089pYJ7YYu6uuhyu7Y
DINARI_API_ENTITY_ID=019aad35-96f3-7200-8f02-9b5092473462

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://zfudecvmkbbtcftbasfk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
DB_PASSWORD=Hackathon520!
```

### 默认 Chain ID

- **钱包连接**: `eip155:0`（用于 EOA wallets）
- **订单创建**: `eip155:1`（以太坊主网，可通过参数覆盖）

### 地址格式要求

**所有传递给 Dinari API 的地址必须是 checksum 格式**:

- ✅ `0xb2a3D4CC1E147f8726B1BCf9944ACe13e811C120` (checksum)
- ❌ `0xb2a3d4cc1e147f8726b1bcf9944ace13e811c120` (小写)
- ❌ `0xB2A3D4CC1E147F8726B1BCF9944ACE13E811C120` (全大写)

**自动转换**:

- 所有地址在传递给 Dinari API 前会自动转换为 checksum 格式
- 使用 `viem` 的 `getAddress()` 函数

---

## 数据存储（Supabase）

### `dinari_users` 表

存储每个用户的 Dinari 账户信息：

```sql
- user_id: TEXT (用户 ID，唯一)
- entity_id: TEXT (Dinari Entity ID)
- account_id: TEXT (Dinari Account ID)
- wallet_address: TEXT (钱包地址，checksum 格式)
- chain_id: TEXT (链 ID，默认 'eip155:0')
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### `dinari_transactions` 表

存储所有交易记录（订单、买卖等）

### `dinari_stocks_cache` 表

缓存股票数据，减少 API 调用

---

## API 端点总结

### 账户管理

- `GET /dinari/account` - 获取用户账户信息
- `POST /dinari/setup` - 手动创建账户（幂等）
- `GET /dinari/entities` - 获取实体列表

### 钱包连接

- `GET /dinari/wallet/nonce` - 获取连接 nonce
- `POST /dinari/wallet/connect` - 连接钱包

### 股票交易

- `GET /dinari/stocks` - 获取可用股票列表
- `POST /dinari/orders/prepare` - 准备代理订单
- `POST /dinari/orders/create` - 创建代理订单

---

## 错误处理

- 所有地址格式错误会自动转换为 checksum
- 如果用户没有 Dinari Account，相关 API 会返回错误提示
- 钱包连接失败不会影响账户创建
- 所有 Dinari API 错误会记录日志并返回给客户端
