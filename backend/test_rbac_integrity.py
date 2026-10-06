import requests
import sys

BASE_URL = "http://localhost:8000"

def get_headers(token):
    return {"Authorization": f"Bearer {token}"}

def run_rbac_integrity_test():
    print("====================================================")
    print("=== Start PetCare SaaS RBAC Integrity Test ===")
    print("====================================================")

    # 1. 登入店長
    print("\n[Step 1] Login as Store Manager...")
    manager_login = requests.post(
        f"{BASE_URL}/api/auth/login",
        data={"username": "manager@petcare.com", "password": "manager123"}
    )
    if manager_login.status_code != 200:
        print("[FAIL] Store Manager login failed")
        sys.exit(1)
    
    manager_token = manager_login.json()["access_token"]
    manager_headers = get_headers(manager_token)
    print("[SUCCESS] Store Manager login success")

    # 2. 測試店長權限端點
    print("\n[Step 2] Testing Store Manager endpoints (refund pending & services)...")
    
    # 退款 pending
    refund_res = requests.get(f"{BASE_URL}/api/payment/refund/pending", headers=manager_headers)
    print(f"-> Store Manager reading pending refunds: status {refund_res.status_code}")
    assert refund_res.status_code == 200, "Manager should access refunds"
    
    # 服務項目建立 (POST)
    new_service_data = {
        "name": "Quick Nail Trim Test",
        "description": "Nail trim for test",
        "duration_minutes": 15,
        "price": 200
    }
    create_svc_res = requests.post(f"{BASE_URL}/api/booking/services", json=new_service_data, headers=manager_headers)
    print(f"-> Store Manager creating service item: status {create_svc_res.status_code}")
    assert create_svc_res.status_code == 200, "Manager should create services"
    test_service_id = create_svc_res.json()["id"]

    # 3. 登入系統管理員
    print("\n[Step 3] Login as System Admin...")
    admin_login = requests.post(
        f"{BASE_URL}/api/auth/login",
        data={"username": "admin@petcare.com", "password": "admin1234"}
    )
    assert admin_login.status_code == 200, "System Admin login failed"
    
    admin_token = admin_login.json()["access_token"]
    admin_headers = get_headers(admin_token)
    print("[SUCCESS] System Admin login success")

    # 4. 驗證系統管理員「不能」存取退款與服務項目設定 API
    print("\n[Step 4] Verification of System Admin access restriction (Expected: 403 Forbidden)...")
    
    # 嘗試退款審核 (GET)
    admin_refund_res = requests.get(f"{BASE_URL}/api/payment/refund/pending", headers=admin_headers)
    print(f"-> System Admin accessing pending refunds: status {admin_refund_res.status_code}")
    assert admin_refund_res.status_code == 403, "Admin should be forbidden from refunding"
    
    # 嘗試更動服務項目 (PUT)
    update_svc_res = requests.put(
        f"{BASE_URL}/api/booking/services/{test_service_id}",
        json={"name": "Malicious Price Edit", "description": "Admin bypass update", "duration_minutes": 15, "price": 9999},
        headers=admin_headers
    )
    print(f"-> System Admin editing service: status {update_svc_res.status_code}")
    assert update_svc_res.status_code == 403, "Admin should be forbidden from editing services"

    # 5. 測試「跟店長要求的人員身份更動」流程
    print("\n[Step 5] Testing staff department update workflow under manager instruction...")
    
    # 取得員工清單
    staff_list_res = requests.get(f"{BASE_URL}/api/auth/staff", headers=admin_headers)
    assert staff_list_res.status_code == 200
    staffs = staff_list_res.json()
    
    # 找到非系統管理員的測試員工帳號
    target_staff = None
    for s in staffs:
        if s["email"] != "admin@petcare.com":
            target_staff = s
            break
            
    assert target_staff is not None, "Testing staff not found"
    staff_id = target_staff["id"]
    original_dept = target_staff["department"]
    print(f"-> Target staff: {target_staff['full_name']}, Current Dept: {original_dept}, ID: {staff_id}")

    # A. 嘗試變更身分，但不提供店長指令備註
    print("-> A. Updating department without manager instruction...")
    bad_update = requests.put(
        f"{BASE_URL}/api/auth/staff/{staff_id}/department",
        json={"department": "Caretaker", "manager_instruction": ""},
        headers=admin_headers
    )
    print(f"   => status: {bad_update.status_code}, response: {bad_update.text}")
    assert bad_update.status_code == 400, "Update without instruction should fail"

    # B. 提供店長指令備註
    print("-> B. Updating department WITH manager instruction...")
    good_update = requests.put(
        f"{BASE_URL}/api/auth/staff/{staff_id}/department",
        json={"department": "Caretaker", "manager_instruction": "Manager requested groomer to support caretaker"},
        headers=admin_headers
    )
    print(f"   => status: {good_update.status_code}")
    assert good_update.status_code == 200, "Update with instruction should succeed"
    updated_staff = good_update.json()
    assert updated_staff["department"] == "Caretaker", "Department should be Caretaker"
    print("   => Updated Dept: " + updated_staff["department"])

    # C. 將職位還原
    requests.put(
        f"{BASE_URL}/api/auth/staff/{staff_id}/department",
        json={"department": original_dept, "manager_instruction": "Restore test"},
        headers=admin_headers
    )

    print("\n====================================================")
    print("All RBAC Isolation & Staff Update Tests Passed Successfully!")
    print("====================================================")

if __name__ == "__main__":
    run_rbac_integrity_test()
