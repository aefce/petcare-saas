import requests

BASE_URL = "http://localhost:8000"

def test_flow():
    email = "ryan40103@gmail.com"
    password = "password123"

    print("Registering...")
    res = requests.post(f"{BASE_URL}/api/auth/register", json={"email": email, "password": password})
    print(res.status_code, res.text)

    print("Logging in...")
    res = requests.post(f"{BASE_URL}/api/auth/login", data={"username": email, "password": password})
    print(res.status_code, res.text)

if __name__ == "__main__":
    test_flow()
