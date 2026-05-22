# AI Prompt Generator

FastAPI backend with a static frontend served from the same app.

## Run Locally

```bash
cd ~/Desktop/ai_prompt_project
/usr/bin/python3 -m venv venv
source venv/bin/activate
python -m pip install --upgrade pip setuptools wheel
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

Open:

```text
http://127.0.0.1:8000
```

Swagger docs:

```text
http://127.0.0.1:8000/docs
```

## API

- `GET /api/v1/ui-schema/`
- `GET /api/v1/ui-schema/niches/{niche_id}`
- `POST /api/v1/ui-schema/niches/{niche_id}/add-option`
- `POST /api/v1/generate`
- `GET /api/v1/history/`
- `GET /api/v1/health`

## Notes

- Local runtime data uses SQLite through `backend/.env`.
- `USE_MOCK_LLM=true` avoids external LLM calls.
- Set `OPENROUTER_API_KEY` locally only when you want real provider calls.
- Do not commit `.env`, virtual environments, or SQLite files.
