from pathlib import Path

from rapidfuzz import process
import pandas as pd
import joblib
from sklearn.metrics.pairwise import linear_kernel

BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"

tfidf = joblib.load(MODELS_DIR / "tfidf.pkl")
tfidf_matrix = joblib.load(MODELS_DIR / "tfidf_matrix.pkl")
df = pd.read_pickle(MODELS_DIR / "movies_df.pkl")

indices = pd.Series(df.index, index=df["title"]).drop_duplicates()

def fuzzy_match_title(query, titles, threshold=60):
    result = process.extractOne(query, titles)
    if result is None:
        return None

    match, score, _ = result
    if score < threshold:
        return None
    return match

def movie_recommenders(title, top_k=10, candidate_k=50):
    matched_title = fuzzy_match_title(title, df["title"].tolist())

    if matched_title is None:
        return f"No close match found for '{title}'."

    idx = indices[matched_title]
    sim_scores = linear_kernel(tfidf_matrix[idx], tfidf_matrix)[0]
    sim_scores = list(enumerate(sim_scores))
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)

    sim_scores = sim_scores[1:candidate_k + 1]
    movie_indices = [i[0] for i in sim_scores]

    candidates = df.iloc[movie_indices].copy()
    candidates["similarity"] = [score for _, score in sim_scores]
    candidates["final_score"] = 0.7 * candidates["similarity"] + 0.3 * candidates["popularity_score"]

    candidates = candidates.sort_values(by=["final_score"], ascending=False)

    return candidates[["title", "genres", "rating_mean", "rating_count", "similarity", "popularity_score", "final_score"]].head(top_k)
