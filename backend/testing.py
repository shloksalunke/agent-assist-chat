import requests

url = "http://localhost:11434/api/generate"

payload = {
    "model": "mistral4bit",
    "prompt": "Write a Python function to check prime number",
    "stream": False
}

response = requests.post(url, json=payload)
print(response.json()["response"])
