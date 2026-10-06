## 1. 專案基礎與基礎設施 (Project Foundation & Infra)

- [ ] 1.1 建立 FastAPI 專案結構 (SQLAlchemy + Alembic + Celery) 與 Vite React 前端 (Tailwind + React Query)
- [ ] 1.2 設定 Docker Compose (PostgreSQL, Redis, FastAPI, Celery Worker, React)
- [ ] 1.3 實作 Redis 連線與基礎鎖定工具 (TTL Lock) (UR-01)
- [ ] 1.4 設定 API Rate Limiter 中介軟體防護惡意攻擊 (UR-18)
- [ ] 1.5 建立基礎稽核表 (Audit Trail) 與 Soft Delete 基礎模型機制 (UR-12, UR-19)

## 2. 身分與權限模組 (Identity & Access Module)

- [ ] 2.1 實作使用者模型與 Session/JWT 生成邏輯 (包含 Role 定義)
- [ ] 2.2 實作 Guest 到 Member 的單鍵升級與紀錄轉移機制 (UR-00.C)
- [ ] 2.3 實作 `/admin` Namespace 路由與 RBAC 權限校驗中介軟體 (UR-00.A/B, UR-11)
- [ ] 2.4 實作密碼複雜度校驗與 MFA/Email 驗證重置邏輯 (UR-15)
- [ ] 2.5 實作員工 30 分鐘閒置自動登出與 Token Revocation (UR-16)

## 3. 核心營運與預約模組 (Core Ops & Booking Module)

- [ ] 3.1 實作寵物檔案模型，包含體型與疫苗紀錄校驗 (UR-02)
- [ ] 3.2 實作預約流程的 15 分鐘 Redis 資源鎖定 (UR-01)
- [ ] 3.3 實作依據寵物體型自動派房與手動升級差價計算 (UR-06)
- [ ] 3.4 實作背景排程：超時未報到自動釋放資源與違約金扣款 (UR-10)
- [ ] 3.5 實作櫃台現場客建立訂單並即時扣留資源 (UR-14)

## 4. 服務執行與警示 (Service Execution & Alerts)

- [ ] 4.1 實作寵物風險與行為標籤模型 (管理員專屬權限) (UR-05)
- [ ] 4.2 前端實作掃描或查閱時的紅燈警告 Modal (UR-09)
- [ ] 4.3 實作日常照護與美容任務紀錄 API

## 5. 金流與通知模組 (Payment & Notifications Module)

- [ ] 5.1 實作具備冪等性 (Idempotency) 的結帳流程 (UR-04)
- [ ] 5.2 實作 15 分鐘價格快照 (Snapshot) 產生邏輯 (UR-07)
- [ ] 5.3 實作 Mock Payment 金流模組與背景對帳排程 (UR-04.1)
- [ ] 5.4 實作 Mock Notification 與 DLQ (Dead Letter Queue) 非同步重試機制 (UR-20, UR-21)
