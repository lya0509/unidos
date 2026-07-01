import urllib.request
import json

url = 'http://localhost:8000/api/v1/auth/register'
data = {
    "nombre": "ciudadano",
    "email": "juanluislaya@gmail.com",
    "password": "123456789012345",
    "rol": "ciudadano",
    "zona_operacion": "Ciudad Casarapa"
}
req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})

try:
    response = urllib.request.urlopen(req)
    print("STATUS:", response.status)
    print("BODY:", response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("STATUS:", e.code)
    print("BODY:", e.read().decode('utf-8'))
except Exception as e:
    print("ERROR:", str(e))
