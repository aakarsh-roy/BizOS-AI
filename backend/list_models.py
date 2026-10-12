import asyncio
import os
from dotenv import load_dotenv

load_dotenv(".env")

import google.generativeai as genai

def list_models():
    genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
    print("Available Gemini Models:")
    for m in genai.list_models():
        if "generateContent" in m.supported_generation_methods:
            print(f"- {m.name}")

if __name__ == "__main__":
    list_models()
