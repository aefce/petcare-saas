## Context

PetCare SaaS 平台需要一個能隨著時間擴展的穩固基礎。為避免在早期階段引入分散式系統的複雜性，我們採用模組化單體 (Modular Monolith) 架構。系統除了處理預約管理、服務目錄與金流整合外，還必須滿足嚴格的安全性要求（如入口分離、RBAC）、營運防呆機制（15 分鐘資源鎖定、冪等性金流操作、背景對帳）以及基礎設施監控（Audit Trail, Rate Limiting, DLQ）。
技術棧包含：
- **前端**: React (Vite) + TailwindCSS + React Query / Zustand
- **後端**: FastAPI + SQLAlchemy (ORM) + Alembic (Migrations) + Celery (Task Queue)
- **資料與快取**: PostgreSQL + Redis
- **外部服務 (MVP 階段)**: Mock Payment Gateway (模擬金流) + Mock Notification (模擬通知)

## Goals / Non-Goals

**Goals:**
- 建立單一的後端儲存庫 (FastAPI)，並結構化為不同的模組 (如：`appointments`, `services`, `payments`, `identity`, `core-ops`, `security`)。
- 為飼主與管理員提供完全分離的響應式 React 前端介面與 Namespace 路由。
- 透過 Redis 實作可靠的分散式鎖定機制 (資源保留 15 分鐘)。
- 確保所有金流與核心狀態變更具備冪等性 (Idempotency) 與不可變的稽核紀錄 (Audit Trail)。
- 建立具備容錯能力 (DLQ) 與自我修復 (對帳機制) 的非同步任務處理架構。

**Non-Goals:**
- 微服務部署：系統將作為單一程序執行，暫不拆分微服務。
- 複雜的雲端基礎設施設定 (Kubernetes, Terraform) 延後至後期階段再考慮。

## Decisions

- **架構 - 模組化單體 (Modular Monolith)**: 原因？在保證模組邊界的同時降低營運複雜度。
- **身分驗證 - 分離的入口與 JWT Role**: 原因？透過 `/admin` Namespace 與 JWT 夾帶 Role，在 API Controller 層級進行統一的權限校驗，越權操作即回傳 `403 Forbidden`。
- **資料庫 - PostgreSQL 與 Soft Delete**: 原因？ACID 合規性確保金融與預約交易的一致性。實作 Soft Delete 與不可變稽核日誌 (Append-only) 確保資料安全與可追溯性。
- **並行控制 - 15分鐘資源鎖定 (Redis TTL)**: 原因？進入付款前必須進行 Stale Lock Check，使用 Redis TTL 可以有效防止超賣與資源死鎖。
- **金流穩定性 - Idempotency Keys 與對帳排程**: 原因？網路不穩定可能導致重複發送請求。Idempotency (Request ID + Payload Hash) 確保交易不重複扣款；背景排程確保 Timeout 訂單狀態與外部 Gateway 保持同步。
- **基礎設施 - Rate Limiting 與 DLQ**: 原因？閘道層透過 Redis 實作基於 User/IP 的 Rate Limiter 防止惡意攻擊 (`429`)。第三方服務斷線時透過 DLQ 與 Graceful Degradation 保障核心業務不中斷。

## Risks / Trade-offs

- **風險: 單點故障與 Redis 依賴過重** -> *緩解方案*: 針對 Redis 斷線實作降級策略，並透過 DLQ 暫存非同步任務。
- **風險: 稽核日誌與快照資料量龐大** -> *緩解方案*: 稽核表設計為 Append-only，並考慮未來進行定期封存 (Archiving) 至冷儲存。
- **風險: 模組耦合 (Module Coupling)** -> *緩解方案*: 強制執行嚴格的依賴規則，跨領域必須透過介面或事件呼叫。
