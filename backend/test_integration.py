import io
import requests
import uuid
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"

def get_headers(token):
    return {"Authorization": f"Bearer {token}"}

def run_integration_test():
    print("=== 開始 PetCare SaaS 功能整合測試 ===")

    # 1. 登入飼主張飼主
    print("\n[步驟 1] 登入飼主...")
    login_res = requests.post(
        f"{BASE_URL}/api/auth/login",
        data={"username": "owner@petcare.com", "password": "owner1234"}
    )
    assert login_res.status_code == 200, "飼主登入失敗"
    owner_token = login_res.json()["access_token"]
    owner_headers = get_headers(owner_token)
    print("-> 飼主登入成功")

    # 2. 登入店長趙店長
    print("\n[步驟 2] 登入店長...")
    manager_res = requests.post(
        f"{BASE_URL}/api/auth/login",
        data={"username": "manager@petcare.com", "password": "manager123"}
    )
    assert manager_res.status_code == 200, "店長登入失敗"
    manager_token = manager_res.json()["access_token"]
    manager_headers = get_headers(manager_token)
    print("-> 店長登入成功")

    # 3. 新增一隻狗狗
    print("\n[步驟 3] 新增一隻寵物狗 (可樂)...")
    pet_res = requests.post(
        f"{BASE_URL}/api/booking/pets",
        json={
            "name": f"可樂_{str(uuid.uuid4())[:4]}",
            "species": "Dog",
            "breed": "黃金獵犬",
            "weight_kg": 25.5,
            "medical_notes": "無"
        },
        headers=owner_headers
    )
    assert pet_res.status_code == 200, "新增寵物失敗"
    pet = pet_res.json()
    pet_id = pet["id"]
    print(f"-> 寵物新增成功，ID: {pet_id}，疫苗合規狀態: {pet['is_vaccine_valid']}")
    assert pet["is_vaccine_valid"] is False, "新寵物疫苗不應該合規"

    # 4. 取得可用服務與時段
    print("\n[步驟 4] 取得可用服務與時段...")
    services_res = requests.get(f"{BASE_URL}/api/booking/services", headers=owner_headers)
    assert services_res.status_code == 200
    services = services_res.json()
    active_services = [s for s in services if s["is_active"]]
    if not active_services:
        print("沒有可用服務，自動建立一個服務項目...")
        create_svc = requests.post(
            f"{BASE_URL}/api/booking/services",
            json={"name": "寵物大美容", "description": "基礎大美容", "duration_minutes": 60, "price": 1200},
            headers=manager_headers
        )
        service_id = create_svc.json()["id"]
    else:
        service_id = active_services[0]["id"]

    # 建立一個測試時段
    start_time = (datetime.utcnow() + timedelta(days=2)).strftime("%Y-%m-%dT10:00:00")
    end_time = (datetime.utcnow() + timedelta(days=2)).strftime("%Y-%m-%dT11:00:00")
    slot_res = requests.post(
        f"{BASE_URL}/api/booking/timeslots",
        json={"start_time": start_time, "end_time": end_time, "max_capacity": 2, "service_item_id": service_id},
        headers=manager_headers
    )
    assert slot_res.status_code == 200
    slot_id = slot_res.json()["id"]
    print(f"-> 取得時段 ID: {slot_id}，服務 ID: {service_id}")

    # 5. 嘗試預約 (預期失敗，因為疫苗未合規)
    print("\n[步驟 5] 嘗試預約服務 (預期因疫苗未合規而失敗)...")
    reserve_res = requests.post(
        f"{BASE_URL}/api/booking/reserve",
        json={
            "pet_id": pet_id,
            "service_item_id": service_id,
            "time_slot_id": slot_id
        },
        headers=owner_headers
    )
    print(f"-> 預約請求狀態碼: {reserve_res.status_code}，回傳詳細資訊: {reserve_res.text}")
    assert reserve_res.status_code == 400, "疫苗不合規，預約不應該成功"
    assert "疫苗" in reserve_res.json()["detail"], "錯誤詳細應提及疫苗"

    # 6. 上傳疫苗證明 (狂犬病、犬五合一)
    print("\n[步驟 6] 上傳疫苗憑證 (狂犬病)...")
    file_data1 = io.BytesIO(b"fake rabies vaccine certificate image")
    upload_res1 = requests.post(
        f"{BASE_URL}/api/booking/pets/{pet_id}/vaccines",
        data={"vaccine_name": "狂犬病", "expiry_date": (datetime.utcnow() + timedelta(days=365)).strftime("%Y-%m-%d")},
        files={"file": ("rabies.png", file_data1, "image/png")},
        headers=owner_headers
    )
    assert upload_res1.status_code == 200, "上傳狂犬病疫苗失敗"
    record1_id = upload_res1.json()["id"]
    print(f"-> 狂犬病疫苗上傳成功，憑證記錄 ID: {record1_id}，狀態: {upload_res1.json()['status']}")

    print("上傳疫苗憑證 (犬五合一)...")
    file_data2 = io.BytesIO(b"fake canine 5-in-1 vaccine certificate image")
    upload_res2 = requests.post(
        f"{BASE_URL}/api/booking/pets/{pet_id}/vaccines",
        data={"vaccine_name": "犬五合一", "expiry_date": (datetime.utcnow() + timedelta(days=365)).strftime("%Y-%m-%d")},
        files={"file": ("canine5.png", file_data2, "image/png")},
        headers=owner_headers
    )
    assert upload_res2.status_code == 200, "上傳犬五合一疫苗失敗"
    record2_id = upload_res2.json()["id"]
    print(f"-> 犬五合一疫苗上傳成功，憑證記錄 ID: {record2_id}，狀態: {upload_res2.json()['status']}")

    # 7. 再次嘗試預約 (預期失敗，因為疫苗還在 PENDING 審核中)
    print("\n[步驟 7] 再次嘗試預約 (預期因疫苗仍在審核中而失敗)...")
    reserve_res2 = requests.post(
        f"{BASE_URL}/api/booking/reserve",
        json={
            "pet_id": pet_id,
            "service_item_id": service_id,
            "time_slot_id": slot_id
        },
        headers=owner_headers
    )
    assert reserve_res2.status_code == 400, "疫苗審核中，預約不應該成功"
    print("-> 確認疫苗審核中會被阻擋預約")

    # 8. 管理員審核通過
    print("\n[步驟 8] 店長審核通過疫苗...")
    verify_res1 = requests.post(
        f"{BASE_URL}/api/booking/vaccines/{record1_id}/verify",
        json={"status": "VALID"},
        headers=manager_headers
    )
    assert verify_res1.status_code == 200
    verify_res2 = requests.post(
        f"{BASE_URL}/api/booking/vaccines/{record2_id}/verify",
        json={"status": "VALID"},
        headers=manager_headers
    )
    assert verify_res2.status_code == 200
    print("-> 疫苗審核通過完成")

    # 9. 第三次嘗試預約 (預期成功，因為疫苗已合規)
    print("\n[步驟 9] 第三次嘗試預約 (預期成功)...")
    reserve_res3 = requests.post(
        f"{BASE_URL}/api/booking/reserve",
        json={
            "pet_id": pet_id,
            "service_item_id": service_id,
            "time_slot_id": slot_id
        },
        headers=owner_headers
    )
    assert reserve_res3.status_code == 200, "疫苗已合規，應該可以預約"
    booking = reserve_res3.json()
    booking_id = booking["id"]
    print(f"-> 預約成功！預約單 ID: {booking_id}，狀態: {booking['status']}")

    # 10. 測試結帳 (模擬付費 -> CONFIRMED)
    print("\n[步驟 10] 前往結帳...")
    checkout_res = requests.post(
        f"{BASE_URL}/api/payment/mock-callback",
        json={"booking_id": booking_id, "payment_status": "SUCCESS"},
        headers=owner_headers
    )
    assert checkout_res.status_code == 200, "結帳失敗"
    print(f"-> 結帳成功，預約單狀態變更為: CONFIRMED")

    # 11. 測試退費申請與重複申請阻擋
    print("\n[步驟 11] 測試退款申請功能...")
    refund_res = requests.post(
        f"{BASE_URL}/api/payment/refund/request",
        json={"booking_id": booking_id, "reason": "臨時有事無法前來"},
        headers=owner_headers
    )
    assert refund_res.status_code == 200, "申請退費失敗"
    print("-> 申請退款成功")

    refund_res_dup = requests.post(
        f"{BASE_URL}/api/payment/refund/request",
        json={"booking_id": booking_id, "reason": "重複申請"},
        headers=owner_headers
    )
    assert refund_res_dup.status_code == 400, "重複申請退費不應成功"
    print("-> 重複申請退款已成功被系統阻擋")

    # 為了後續的 check-in 與服務日誌測試，我們需要將該 booking 的退費狀態改為駁回或不影響流程，
    # 或者另外建立一個不申請退費的 booking。
    # 為簡單起見，我們另外預約並付費一個全新的 booking2。
    print("\n[步驟 11.5] 建立第二筆預約用以進行報到與服務日誌測試...")
    slot_res2 = requests.post(
        f"{BASE_URL}/api/booking/timeslots",
        json={
            "start_time": (datetime.utcnow() + timedelta(days=3)).strftime("%Y-%m-%dT10:00:00"),
            "end_time": (datetime.utcnow() + timedelta(days=3)).strftime("%Y-%m-%dT11:00:00"),
            "max_capacity": 2,
            "service_item_id": service_id
        },
        headers=manager_headers
    )
    slot2_id = slot_res2.json()["id"]
    
    reserve_res4 = requests.post(
        f"{BASE_URL}/api/booking/reserve",
        json={
            "pet_id": pet_id,
            "service_item_id": service_id,
            "time_slot_id": slot2_id
        },
        headers=owner_headers
    )
    booking2_id = reserve_res4.json()["id"]
    
    checkout_res2 = requests.post(
        f"{BASE_URL}/api/payment/mock-callback",
        json={"booking_id": booking2_id, "payment_status": "SUCCESS"},
        headers=owner_headers
    )
    assert checkout_res2.status_code == 200
    print(f"-> 第二筆預約成功完成結帳，預約單 ID: {booking2_id}")

    # 12. 櫃檯人員辦理實體報到 (CONFIRMED -> ACTIVE，這會先驗證疫苗)
    print("\n[步驟 12] 辦理實體報到...")
    checkin_res = requests.post(
        f"{BASE_URL}/api/execution/check-in?booking_id={booking2_id}",
        headers=manager_headers
    )
    print(f"-> 報到請求狀態碼: {checkin_res.status_code}，回傳詳細資訊: {checkin_res.text}")
    assert checkin_res.status_code == 200, "報到失敗"
    print(f"-> 報到成功，狀態: {checkin_res.json()['status']}")

    # 13. 美容師開始服務 (CONFIRMED -> ACTIVE)
    print("\n[步驟 13] 開始服務...")
    start_res = requests.post(
        f"{BASE_URL}/api/execution/start?booking_id={booking2_id}",
        headers=manager_headers
    )
    assert start_res.status_code == 200, "開始服務失敗"
    print(f"-> 開始服務成功，狀態: {start_res.json()['status']}")

    # 14. 照護員/美容師撰寫服務日誌
    print("\n[步驟 14] 撰寫服務日誌...")
    record_res = requests.post(
        f"{BASE_URL}/api/execution/bookings/{booking2_id}/records",
        json={
            "mood_score": 5,
            "appetite_score": 4,
            "notes": "可樂今天在美容室洗完澡後非常精神，食慾也很棒！",
            "image_url": None
        },
        headers=manager_headers
    )
    assert record_res.status_code == 200, "撰寫服務日誌失敗"
    record_id = record_res.json()["id"]
    print(f"-> 撰寫服務日誌成功，記錄 ID: {record_id}")

    # 15. 上傳照護日誌照片
    print("\n[步驟 15] 上傳服務日誌照片...")
    img_data = io.BytesIO(b"fake dog playing image data")
    img_upload_res = requests.post(
        f"{BASE_URL}/api/execution/records/{record_id}/image",
        files={"file": ("happy_dog.png", img_data, "image/png")},
        headers=manager_headers
    )
    assert img_upload_res.status_code == 200, "上傳服務日誌照片失敗"
    uploaded_image_url = img_upload_res.json()["image_url"]
    print(f"-> 服務日誌照片上傳成功，圖片網址: {uploaded_image_url}")

    # 16. 取得服務日誌，驗證是否有該照片 URL
    print("\n[步驟 16] 獲取並驗證服務日誌照片欄位...")
    get_records_res = requests.get(
        f"{BASE_URL}/api/execution/bookings/{booking2_id}/records",
        headers=owner_headers
    )
    assert get_records_res.status_code == 200
    records_list = get_records_res.json()
    assert len(records_list) > 0
    saved_record = records_list[0]
    print(f"-> 資料庫日誌照片網址: {saved_record['image_url']}")
    assert saved_record["image_url"] == uploaded_image_url, "服務日誌圖片網址不相符"

    # 17. 測試寵物旅館系統
    print("\n[步驟 17] 測試寵物旅館功能...")
    # 17.1 建立 total_rooms = 1 的測試用房型 (店長管理員權限)
    print("-> 建立 total_rooms = 1 的測試用房型...")
    room_type_res = requests.post(
        f"{BASE_URL}/api/hotel/rooms",
        json={
            "name": f"測試獨棟別墅_{str(uuid.uuid4())[:4]}",
            "description": "全店僅此一間的奢華獨棟別墅",
            "price_per_night": 2000,
            "total_rooms": 1,
            "is_active": True
        },
        headers=manager_headers
    )
    print(f"-> 房型建立請求狀態碼: {room_type_res.status_code}，回傳詳細資訊: {room_type_res.text}")
    assert room_type_res.status_code == 200, "建立房型失敗"
    test_room_type = room_type_res.json()
    test_room_type_id = test_room_type["id"]
    print(f"-> 房型建立成功，ID: {test_room_type_id}")

    # 17.2 預約旅館第一單 (今天到明天)
    print("-> 預約該房型 (今日到明日)...")
    from datetime import date
    check_in_date = date.today().strftime("%Y-%m-%d")
    check_out_date = (date.today() + timedelta(days=1)).strftime("%Y-%m-%d")
    
    hotel_res1 = requests.post(
        f"{BASE_URL}/api/hotel/reserve",
        json={
            "pet_id": pet_id,
            "room_type_id": test_room_type_id,
            "check_in_date": check_in_date,
            "check_out_date": check_out_date
        },
        headers=owner_headers
    )
    assert hotel_res1.status_code == 200, "預訂旅館失敗"
    hb1 = hotel_res1.json()
    hb1_id = hb1["id"]
    print(f"-> 預訂成功，旅館預約單 ID: {hb1_id}，狀態: {hb1['status']}")

    # 17.3 模擬付款
    print("-> 模擬旅館付款...")
    pay_res = requests.post(
        f"{BASE_URL}/api/payment/mock-callback",
        json={"booking_id": hb1_id, "payment_status": "SUCCESS"},
        headers=owner_headers
    )
    assert pay_res.status_code == 200, "旅館付款失敗"
    print("-> 旅館預訂付款成功，已變更為 CONFIRMED")

    # 17.4 嘗試在重疊日期預訂第二單 (預期因超賣被阻擋)
    print("-> 嘗試於重疊日期預訂第二單 (預計因客滿/超賣而被阻擋)...")
    hotel_res2 = requests.post(
        f"{BASE_URL}/api/hotel/reserve",
        json={
            "pet_id": pet_id,
            "room_type_id": test_room_type_id,
            "check_in_date": check_in_date,
            "check_out_date": check_out_date
        },
        headers=owner_headers
    )
    print(f"-> 第二單預訂回傳狀態碼: {hotel_res2.status_code}，詳細資訊: {hotel_res2.text}")
    assert hotel_res2.status_code == 400, "房型限量1間已賣完，第二單不應成功"
    assert "無空房" in hotel_res2.json()["detail"], "錯誤詳細應提及無空房"

    # 17.5 櫃檯為其辦理實體入住 (CONFIRMED -> ACTIVE)
    print("-> 辦理寵物旅館實體入住 (Check-In)...")
    check_in_res = requests.post(
        f"{BASE_URL}/api/hotel/bookings/{hb1_id}/check-in",
        headers=manager_headers
    )
    assert check_in_res.status_code == 200, "辦理入住失敗"
    print(f"-> 入住成功，狀態變更為: {check_in_res.json()['status']}")

    # 17.6 櫃檯為其辦理實體退房 (ACTIVE -> COMPLETED)
    print("-> 辦理寵物旅館實體退房 (Check-Out)...")
    check_out_res = requests.post(
        f"{BASE_URL}/api/hotel/bookings/{hb1_id}/check-out",
        headers=manager_headers
    )
    assert check_out_res.status_code == 200, "辦理退房失敗"
    print(f"-> 退房成功，狀態變更為: {check_out_res.json()['status']}")

    # 18. 測試寵物旅館 5 大高級功能
    print("\n[步驟 18] 測試寵物旅館 5 大高級功能 (實體房間、照護指派、每日日誌、結帳加購與超時費、Polymorphic退款)...")
    
    # 18.1 實體房間 CRUD 與狀態控制
    print("-> 18.1 測試建立實體房號與維護狀態控制...")
    # 建立實體房號 (隨機)
    physical_room_res = requests.post(
        f"{BASE_URL}/api/hotel/rooms/physical",
        json={
            "room_type_id": test_room_type_id,
            "room_number": f"R_{str(uuid.uuid4())[:4]}",
            "status": "AVAILABLE"
        },
        headers=manager_headers
    )
    assert physical_room_res.status_code == 200, "建立實體房間失敗"
    room_data = physical_room_res.json()
    room_id = room_data["id"]
    print(f"-> 實體房間 T01 建立成功，ID: {room_id}")

    # 取得實體房間列表
    rooms_list_res = requests.get(
        f"{BASE_URL}/api/hotel/rooms/{test_room_type_id}/physical",
        headers=manager_headers
    )
    assert rooms_list_res.status_code == 200
    assert len(rooms_list_res.json()) >= 1

    # 將實體房間改為 MAINTENANCE (維護中)
    maint_res = requests.put(
        f"{BASE_URL}/api/hotel/rooms/physical/{room_id}/status?status_str=MAINTENANCE",
        headers=manager_headers
    )
    assert maint_res.status_code == 200
    assert maint_res.json()["status"] == "MAINTENANCE"
    print("-> 房間已成功設為維護中。測試此時房型可用空房數...")

    # 測試預約可用性 (因為唯一的房間維修中，可用性應該為 False)
    avail_res = requests.get(
        f"{BASE_URL}/api/hotel/rooms/availability",
        params={
            "room_type_id": test_room_type_id,
            "check_in": check_in_date,
            "check_out": check_out_date
        },
        headers=owner_headers
    )
    assert avail_res.status_code == 200
    assert avail_res.json()["available"] is False, "房間維修中，不應有空房可用"
    print("-> 可用性驗證成功：維修中房間已自可用庫存中扣除")

    # 將房間恢復為 AVAILABLE
    avail_back_res = requests.put(
        f"{BASE_URL}/api/hotel/rooms/physical/{room_id}/status?status_str=AVAILABLE",
        headers=manager_headers
    )
    assert avail_back_res.status_code == 200
    assert avail_back_res.json()["status"] == "AVAILABLE"

    # 18.2 辦理入住並指派房間與照護員
    print("-> 18.2 建立新預訂並指派實體房號與負責照護員...")
    hotel_res3 = requests.post(
        f"{BASE_URL}/api/hotel/reserve",
        json={
            "pet_id": pet_id,
            "room_type_id": test_room_type_id,
            "check_in_date": check_in_date,
            "check_out_date": check_out_date
        },
        headers=owner_headers
    )
    hb3_id = hotel_res3.json()["id"]
    
    # 模擬付款
    requests.post(
        f"{BASE_URL}/api/payment/mock-callback",
        json={"booking_id": hb3_id, "payment_status": "SUCCESS"},
        headers=owner_headers
    )

    # 取得員工列表以供指派
    staff_res = requests.get(f"{BASE_URL}/api/auth/staff", headers=manager_headers)
    assert staff_res.status_code == 200
    staffs = staff_res.json()
    test_staff_id = staffs[0]["id"]
    print(f"-> 取得測試員工 ID: {test_staff_id}")

    # 辦理入住並指派房間與照護員
    checkin_adv_res = requests.post(
        f"{BASE_URL}/api/hotel/bookings/{hb3_id}/check-in",
        json={
            "room_id": room_id,
            "staff_id": test_staff_id
        },
        headers=manager_headers
    )
    assert checkin_adv_res.status_code == 200
    hb3_detail = checkin_adv_res.json()
    assert hb3_detail["assigned_room_id"] == room_id, "房間指派不正確"
    assert hb3_detail["assigned_staff_id"] == test_staff_id, "照護員指派不正確"
    
    # 驗證房間狀態已變為 OCCUPIED
    room_status_res = requests.get(
        f"{BASE_URL}/api/hotel/rooms/{test_room_type_id}/physical",
        headers=manager_headers
    )
    occupied_room = next(r for r in room_status_res.json() if r["id"] == room_id)
    assert occupied_room["status"] == "OCCUPIED", "實體房間狀態未變更為 OCCUPIED"
    print("-> 入住房號與照護員指派成功，實體房狀態已轉為 OCCUPIED")

    # 測試指派/變更負責照護員
    test_staff2_id = staffs[-1]["id"]
    assign_res = requests.put(
        f"{BASE_URL}/api/hotel/bookings/{hb3_id}/assign?staff_id={test_staff2_id}",
        headers=manager_headers
    )
    assert assign_res.status_code == 200
    assert assign_res.json()["assigned_staff_id"] == test_staff2_id
    print("-> 負責照護員變更指派成功")

    # 18.3 每日照護日誌與萌照上傳
    print("-> 18.3 測試撰寫每日照護日誌與萌照上傳...")
    log_res = requests.post(
        f"{BASE_URL}/api/hotel/bookings/{hb3_id}/logs",
        json={
            "mood_score": 5,
            "appetite_score": 4,
            "defecation_status": "正常",
            "notes": "毛孩今天玩得非常開心，食慾也很好。",
            "image_url": None
        },
        headers=manager_headers
    )
    assert log_res.status_code == 200
    log_data = log_res.json()
    log_id = log_data["id"]
    print(f"-> 每日照護日誌建立成功，ID: {log_id}")

    # 二階段上傳日誌照片
    log_img = io.BytesIO(b"fake cute pet hotel image data")
    log_img_res = requests.post(
        f"{BASE_URL}/api/hotel/logs/{log_id}/image",
        files={"file": ("cute_pet.png", log_img, "image/png")},
        headers=manager_headers
    )
    assert log_img_res.status_code == 200
    uploaded_log_img = log_img_res.json()["image_url"]
    print(f"-> 日誌萌照上傳成功，URL: {uploaded_log_img}")

    # 查詢該預訂的日誌列表
    get_logs_res = requests.get(
        f"{BASE_URL}/api/hotel/bookings/{hb3_id}/logs",
        headers=owner_headers
    )
    assert get_logs_res.status_code == 200
    logs_list = get_logs_res.json()
    assert len(logs_list) >= 1
    assert logs_list[0]["image_url"] == uploaded_log_img
    print("-> 每日日誌與照片關聯驗證成功")

    # 18.4 結帳加收加購費與超時費
    print("-> 18.4 測試退房結帳加收加購項目費用與超時費...")
    original_total = hb3_detail["total_fee"]
    checkout_adv_res = requests.post(
        f"{BASE_URL}/api/hotel/bookings/{hb3_id}/check-out",
        json={
            "add_on_fee": 500,
            "overtime_fee": 200
        },
        headers=manager_headers
    )
    assert checkout_adv_res.status_code == 200
    hb3_completed = checkout_adv_res.json()
    assert hb3_completed["status"] == "COMPLETED"
    assert hb3_completed["add_on_fee"] == 500
    assert hb3_completed["overtime_fee"] == 200
    assert hb3_completed["total_fee"] == original_total + 500 + 200, "總費用累加不正確"
    
    # 驗證實體房間狀態已釋放為 CLEANING
    room_status_res2 = requests.get(
        f"{BASE_URL}/api/hotel/rooms/{test_room_type_id}/physical",
        headers=manager_headers
    )
    freed_room = next(r for r in room_status_res2.json() if r["id"] == room_id)
    assert freed_room["status"] == "CLEANING", "實體房間退房後應變更為 CLEANING 狀態"
    print("-> 退房成功，加購與超時費正確累加，房號已變更為 CLEANING 釋放")

    # 18.5 Polymorphic 退款流程
    print("-> 18.5 測試旅館預訂 Polymorphic 退款流程...")
    # 建立全新預訂並付款
    hotel_res4 = requests.post(
        f"{BASE_URL}/api/hotel/reserve",
        json={
            "pet_id": pet_id,
            "room_type_id": test_room_type_id,
            "check_in_date": check_in_date,
            "check_out_date": check_out_date
        },
        headers=owner_headers
    )
    hb4_id = hotel_res4.json()["id"]
    requests.post(
        f"{BASE_URL}/api/payment/mock-callback",
        json={"booking_id": hb4_id, "payment_status": "SUCCESS"},
        headers=owner_headers
    )

    # 測試自動退款原因 (提前三天以上取消)
    refund_req1 = requests.post(
        f"{BASE_URL}/api/payment/refund/request",
        json={
            "booking_id": hb4_id,
            "reason": "提前三天以上取消",
            "details": "行程變更"
        },
        headers=owner_headers
    )
    assert refund_req1.status_code == 200
    assert refund_req1.json()["status"] == "AUTO_APPROVED", "符合自動退款條件，應直接 AUTO_APPROVED"
    
    # 驗證預約單狀態已被標記為 REFUNDED
    hb4_detail = requests.get(f"{BASE_URL}/api/hotel/my-bookings", headers=owner_headers)
    target_hb4 = next(hb for hb in hb4_detail.json() if hb["id"] == hb4_id)
    assert target_hb4["status"] == "REFUNDED", "自動退款後旅館預訂單狀態應為 REFUNDED"
    print("-> 旅館預訂自動退款 (AUTO_APPROVED) 與狀態同步成功")

    # 測試需要人工審核的退款原因 (其他原因)
    hotel_res5 = requests.post(
        f"{BASE_URL}/api/hotel/reserve",
        json={
            "pet_id": pet_id,
            "room_type_id": test_room_type_id,
            "check_in_date": check_in_date,
            "check_out_date": check_out_date
        },
        headers=owner_headers
    )
    hb5_id = hotel_res5.json()["id"]
    requests.post(
        f"{BASE_URL}/api/payment/mock-callback",
        json={"booking_id": hb5_id, "payment_status": "SUCCESS"},
        headers=owner_headers
    )

    # 入住指派實體房 (方便驗證退款後會釋放房間)
    requests.post(
        f"{BASE_URL}/api/hotel/bookings/{hb5_id}/check-in",
        json={"room_id": room_id},
        headers=manager_headers
    )

    # 申請人工退款
    refund_req2 = requests.post(
        f"{BASE_URL}/api/payment/refund/request",
        json={
            "booking_id": hb5_id,
            "reason": "其他原因",
            "details": "臨時有緊急事故"
        },
        headers=owner_headers
    )
    assert refund_req2.status_code == 200
    refund2_data = refund_req2.json()
    refund2_id = refund2_data["id"]
    assert refund2_data["status"] == "PENDING_APPROVAL", "不符合自動退款，應為 PENDING_APPROVAL"
    print("-> 旅館預訂人工退款申請 (PENDING_APPROVAL) 建立成功")

    # 店長批准退款
    approve_res = requests.post(
        f"{BASE_URL}/api/payment/refund/{refund2_id}/approve",
        headers=manager_headers
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "MANUAL_APPROVED"

    # 驗證預約單已改為 REFUNDED，且實體房已變回 AVAILABLE
    hb5_detail = requests.get(f"{BASE_URL}/api/hotel/my-bookings", headers=owner_headers)
    target_hb5 = next(hb for hb in hb5_detail.json() if hb["id"] == hb5_id)
    assert target_hb5["status"] == "REFUNDED"
    
    room_status_res3 = requests.get(
        f"{BASE_URL}/api/hotel/rooms/{test_room_type_id}/physical",
        headers=manager_headers
    )
    freed_room_after_refund = next(r for r in room_status_res3.json() if r["id"] == room_id)
    assert freed_room_after_refund["status"] == "AVAILABLE", "退房退款後實體房應回歸 AVAILABLE"
    print("-> 旅館預訂人工退款審核批准成功，預訂單已轉為 REFUNDED 且實體房狀態已釋放")

    print("\n=== 所有功能與高級功能整合測試順利通過，全部邏輯運作正常！ ===")

if __name__ == "__main__":
    run_integration_test()

