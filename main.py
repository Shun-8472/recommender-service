import json
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from recommender_models.recommender import movie_recommenders


BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"

app = FastAPI(
    title="Movie Recommender API",
    description="Recommend similar movies from a title query.",
    version="0.1.0",
)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/")
def read_root() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/health")
def read_health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/recommendations")
def get_recommendations(
    title: str = Query(..., min_length=1, description="Movie title to search for"),
    top_k: int = Query(10, ge=1, le=50, description="Number of recommendations to return"),
    candidate_k: int = Query(
        50,
        ge=1,
        le=200,
        description="Number of candidates to score before selecting the final top_k",
    ),
) -> dict[str, object]:
    recommendations = movie_recommenders(title=title, top_k=top_k, candidate_k=candidate_k)

    if isinstance(recommendations, str):
        raise HTTPException(status_code=404, detail=recommendations)

    records = json.loads(recommendations.to_json(orient="records"))
    return {
        "query": title,
        "count": len(records),
        "recommendations": records,
    }
