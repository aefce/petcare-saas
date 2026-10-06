## Why

此次變更的目的是為 PetCare SaaS 平台建立基礎架構，以滿足高效率、可擴展的寵物美容預約系統需求。隨著業務成長，依賴手動預約流程變得難以管理，因此需要一個集中的數位解決方案來處理預約、服務選擇與金流通知。同時，系統需具備高度的安全性、防呆機制與營運監控能力，以應付實務上的複雜情境（例如資源鎖定、自動派房、退款機制與現場客處理）。

## What Changes

- 初始化專案結構並採用模組化單體 (Modular Monolith) 架構。
- 建立基於 React 的前端，並將飼主端與員工端介面分離。
- 建立 FastAPI 後端來處理業務邏輯與 API，並實作基於角色 (RBAC) 的權限控管。
- 設定 PostgreSQL 作為持久化資料儲存，並導入軟刪除 (Soft Delete) 與不可變稽核日誌 (Audit Trail)。
- 導入 Redis 作為 15 分鐘資源鎖定 (TTL)、快取與非同步任務 (DLQ 與背景對帳) 處理核心。
- 整合 Ngrok 用於本地內網穿透與具有冪等性 (Idempotency) 的 Webhook 測試。
- 實作進階業務邏輯：包含自動派房、違約金退款、寵物行為標籤與即時監控。

## Capabilities

### New Capabilities
- `appointment-management`: 處理寵物美容預約的端到端生命週期與狀態流轉。
- `service-catalog`: 管理預約時可選擇的服務項目與選項。
- `identity-access`: 處理入口分離、Guest 升級 Member、RBAC 權限校驗、密碼管理與 Session 自動登出。
- `core-ops`: 處理預約時的 15 分鐘資源鎖定、寵物檔案疫苗檢驗、自動派房、自動釋放違約資源與現場客報到。
- `security-infra`: 處理系統稽核 (Audit Trail)、Soft Delete、風險行為標籤、API Rate Limiting 與容錯降級機制 (Graceful Degradation)。

### Modified Capabilities
- `payment-notifications`: 除了金流接收外，新增金流冪等性保護 (Idempotency)、背景排程對帳校正機制與 15 分鐘價格快照功能。

## Impact

- 建立完整且具備企業級防呆機制的 PetCare SaaS 架構。
- 引入新的技術依賴項目與進階實作：React, FastAPI, PostgreSQL, Redis, Docker Compose, 冪等性金流防護, 稽核日誌與 Rate Limiting。
- 在單體架構中透過清晰的模組劃分，為未來的微服務拆分與擴充定下高標準的基石。
