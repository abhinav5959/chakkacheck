import urllib.request
import json

boundary = "----WebKitFormBoundaryTest"
with open("src/assets/hero.png", "rb") as f:
    img = f.read()

body = (
    f"--{boundary}\r\n"
    'Content-Disposition: form-data; name="file"; filename="hero.png"\r\n'
    "Content-Type: image/png\r\n\r\n"
).encode() + img + f"\r\n--{boundary}--\r\n".encode()

req = urllib.request.Request(
    "http://127.0.0.1:8000/api/analyze",
    data=body,
    headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
)

res = urllib.request.urlopen(req)
data = json.loads(res.read().decode())
print("LIVE BACKEND RESPONSE:\n", json.dumps(data, indent=2))
