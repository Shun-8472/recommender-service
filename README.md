# Movie Recommender API

## Run with uv

```bash
uv sync
uv run uvicorn main:app --reload
```

## App

- Frontend: `GET /`
- Health check: `GET /health`
- API: `GET /api/recommendations?title=Toy%20Story`

## Example

```bash
curl "http://127.0.0.1:8000/api/recommendations?title=Toy%20Story&top_k=5"
```
