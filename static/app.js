const form = document.querySelector("#search-form");
const titleInput = document.querySelector("#title-input");
const topKInput = document.querySelector("#top-k-input");
const topKValue = document.querySelector("#top-k-value");
const submitButton = document.querySelector("#submit-button");
const queryLabel = document.querySelector("#query-label");
const resultCount = document.querySelector("#result-count");
const resultState = document.querySelector("#result-state");
const feedback = document.querySelector("#feedback");
const results = document.querySelector("#results");
const quickPicks = document.querySelectorAll(".pill");
const cardTemplate = document.querySelector("#movie-card-template");

const numberFormatter = new Intl.NumberFormat("en-US");

function formatDecimal(value, digits = 3) {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return "N/A";
  }

  return numericValue.toFixed(digits);
}

function formatVotes(value) {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return "N/A";
  }

  return numberFormatter.format(Math.round(numericValue));
}

function setFeedback(message, type = "info") {
  feedback.hidden = false;
  feedback.textContent = message;
  feedback.className = `feedback ${type === "error" ? "error" : ""}`.trim();
}

function clearFeedback() {
  feedback.hidden = true;
  feedback.textContent = "";
  feedback.className = "feedback";
}

function setLoadingState(isLoading) {
  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? "Scanning..." : "Launch Search";
  resultState.textContent = isLoading ? "Loading" : "Ready";
}

function updateTopKLabel() {
  topKValue.textContent = topKInput.value;
}

function createMovieCard(movie, index) {
  const fragment = cardTemplate.content.cloneNode(true);
  const genreList = fragment.querySelector(".genre-list");
  const rawGenres = typeof movie.genres === "string" ? movie.genres.split("|") : [];
  const genres = rawGenres.map((genre) => genre.trim()).filter(Boolean);

  fragment.querySelector(".rank-badge").textContent = `#${index + 1}`;
  fragment.querySelector(".score-chip").textContent = formatDecimal(movie.final_score);
  fragment.querySelector(".movie-title").textContent = movie.title;
  fragment.querySelector(".similarity-value").textContent = formatDecimal(movie.similarity);
  fragment.querySelector(".rating-value").textContent = formatDecimal(movie.rating_mean, 1);
  fragment.querySelector(".count-value").textContent = formatVotes(movie.rating_count);
  fragment.querySelector(".popularity-value").textContent = formatDecimal(movie.popularity_score);

  if (genres.length === 0) {
    const chip = document.createElement("span");
    chip.className = "genre-chip genre-chip-muted";
    chip.textContent = "Genre data unavailable";
    genreList.appendChild(chip);
  } else {
    genres.slice(0, 4).forEach((genre) => {
      const chip = document.createElement("span");
      chip.className = "genre-chip";
      chip.textContent = genre;
      genreList.appendChild(chip);
    });
  }

  return fragment;
}

function renderResults(payload) {
  results.replaceChildren();

  payload.recommendations.forEach((movie, index) => {
    results.appendChild(createMovieCard(movie, index));
  });
}

async function fetchRecommendations(title, topK) {
  const params = new URLSearchParams({
    title,
    top_k: topK,
  });

  const response = await fetch(`/api/recommendations?${params.toString()}`);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.detail || "Request failed.");
  }

  return payload;
}

async function handleSearch(rawTitle) {
  const title = rawTitle.trim();
  if (!title) {
    titleInput.focus();
    return;
  }

  setLoadingState(true);
  clearFeedback();
  queryLabel.textContent = title;
  resultCount.textContent = "0";
  results.replaceChildren();

  try {
    const payload = await fetchRecommendations(title, topKInput.value);
    renderResults(payload);

    resultCount.textContent = String(payload.count);
    resultState.textContent = payload.count > 0 ? "Live" : "Empty";
    queryLabel.textContent = payload.query;

    if (payload.count === 0) {
      setFeedback("The engine returned no candidates for this title.", "error");
      return;
    }

    setFeedback(`Loaded ${payload.count} recommendations for "${payload.query}".`);
  } catch (error) {
    resultState.textContent = "Error";
    resultCount.textContent = "0";
    results.replaceChildren();
    setFeedback(error.message, "error");
  } finally {
    setLoadingState(false);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  await handleSearch(titleInput.value);
});

topKInput.addEventListener("input", updateTopKLabel);

quickPicks.forEach((button) => {
  button.addEventListener("click", async () => {
    const title = button.dataset.title || "";
    titleInput.value = title;
    await handleSearch(title);
  });
});

updateTopKLabel();
