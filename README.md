# AI Work Report Generator

An AI-powered operations reporting tool with a high-reliability fallback system.

## 🚀 Key Features

- **Primary:** OpenAI GPT-4o-mini / OpenRouter support for high-quality professional reporting.
- **Secondary (Python Fallback):** If API is unavailable, uses a local Python Flask server with `TextBlob` for correction.
- **Tertiary (Offline JS):** Works even without an internet connection using basic JavaScript rule-based processing.
- **API Usage Tracker:** Monitor how many generations you've performed.
- **Design:** Modern glassmorphism UI with bolded task highlights.

---

## 🛠️ Setup & Running

### 1. Prerequisites
- [Node.js](https://nodejs.org/)
- [Python 3](https://python.org/) (with `flask`, `flask-cors`, `textblob`)

### 2. Configure Environment
1.  Open [**.env**](file:///d:/ALLproducts/tools/work_report/.env)
2.  Add your OpenAI or OpenRouter Key:
    ```
    VITE_OPENAI_API_KEY=sk-or-v1-your-key-here
    ```

### 3. Start the Services

**Terminal 1: Frontend (Vite)**
```powershell
npm run dev
```

**Terminal 2: NLP Fallback (Python)**
```powershell
py nlp_service.py
```

---

## 📂 Project Structure
- `index.html`: UI / Dashboard
- `src/main.js`: Main logic (Bridge between AI, Python, & Offline JS)
- `nlp_service.py`: Local Python NLP processor (Flask)
- `src/style.css`: Design system
- `.env`: Secret API Key storage

---
Built with ❤️ by Leela Prasad
