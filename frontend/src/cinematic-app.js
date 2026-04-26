import React, { useEffect, useState, useRef } from "react";
import htm from "htm";
import {
  getHealth,
  getPersonalizedRecommendations,
  getRandomMovie,
  getSimilarMovies,
  getStreamingProviders,
  importLetterboxd,
  searchMovies,
} from "./api.js";

const html = htm.bind(React.createElement);

function formatGenres(genres = []) {
  return genres.join(" • ");
}

function parseFavorites(text) {
  return text.split(",").map((item) => item.trim()).filter(Boolean);
}

function parseRatedMovies(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, rating] = line.split("|").map((part) => part.trim());
      return { title, rating: Number.isFinite(Number(rating)) ? Number(rating) : 4 };
    })
    .filter((entry) => entry.title);
}

function toApiFilters(filters) {
  return {
    genre: filters.genre || undefined,
    decade: filters.decade ? Number(filters.decade) : undefined,
    min_rating: filters.minRating ? Number(filters.minRating) : undefined,
    runtime_max: filters.runtimeMax ? Number(filters.runtimeMax) : undefined,
    streaming_services: filters.streamingServices || undefined,
  };
}

// Custom cursor component
function CustomCursor() {
  const cursorRef = useRef(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    if (cursorRef.current) {
      cursorRef.current.style.transform = `translate(${cursorPos.x - 10}px, ${cursorPos.y - 10}px)`;
    }
  }, [cursorPos]);

  return html`
    <div
      ref=${cursorRef}
      className=${"cinema-cursor" + (isActive ? " active" : "")}
      style="position: fixed; pointer-events: none; z-index: 9999;"
    />
  `;
}

// Loading component
function LoadingBlock({ label = "Loading..." }) {
  return html`
    <div className="_loading-cinematic">
      <div className="_loading-spinner"></div>
      <p>${label}</p>
    </div>
  `;
}

// Cinematic App
export function App() {
  const [health, setHealth] = useState(null);
  const [streamingProviders, setStreamingProviders] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [similarResults, setSimilarResults] = useState([]);
  const [randomMovie, setRandomMovie] = useState(null);
  const [posterFallbacks, setPosterFallbacks] = useState({});

  useEffect(() => {
    async function initApp() {
      try {
        console.log("Fetching health data...");
        const [healthData, providers] = await Promise.all([getHealth(), getStreamingProviders()]);
        console.log("Health data received:", healthData);
        setHealth(healthData);
        setStreamingProviders(providers);
        setIsLoading(false);
      } catch (err) {
        console.error("Initialization failed:", err);
        setError("Failed to load movie data. Using fallback mode.");
        setIsLoading(false);
      }
    }
    initApp();
  }, []);

  async function handleSearch(e) {
    const value = e.target.value;
    setQuery(value);
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const results = await searchMovies({ q: value, limit: 8 });
      setSearchResults(results.results || []);
    } catch (error) {
      console.error("Search failed:", error);
    }
  }

  async function handleSelectMovie(movie) {
    setSelectedMovie(movie);
    try {
      const similar = await getSimilarMovies({
        movie_id: movie.movie_id,
        title: movie.title,
        method: "cosine",
        top_n: 6,
      });
      setSimilarResults(similar.recommendations || []);
    } catch (error) {
      console.error("Similar movies failed:", error);
    }
  }

  async function handleRandom() {
    try {
      const random = await getRandomMovie({});
      setRandomMovie(random.movie);
    } catch (error) {
      console.error("Random movie failed:", error);
    }
  }

  function handlePosterError(movieId) {
    setPosterFallbacks((prev) => ({ ...prev, [movieId]: true }));
  }

  // Hero Section
  const Hero = () => html`
    <section className="cinema-hero">
      <${CustomCursor} />
      <div className="cinema-hero-content">
        <h1 className="cinema-hero-title">Find your next obsession.</h1>
        <p className="cinema-subtitle">
          AI-powered movie recommendations using real datasets, similarity search,
          and intelligent streaming filters. Discover films through metadata embeddings
          and personalized taste profiling.
        </p>
        <div className="cinema-search-wrapper">
          <input
            type="text"
            className="cinema-search-input"
            value=${query}
            onInput=${handleSearch}
            placeholder="Search for Interstellar, Parasite, Greta Gerwig, cyberpunk..."
          />
        </div>
      </div>
      <div className="cinema-hero-posters">
        ${[1,2,3,4,5,6,7,8].map(i => html`
          <div key=${i} className="poster-item" style="background: linear-gradient(45deg, #1a1a1a, #2a2a2a);"></div>
        `)}
      </div>
    </section>
  `;

  // Recommendations Section
  const Recommendations = () => html`
    <section className="cinema-recommendations">
      <div className="cinema-section-header">
        <h2 className="cinema-section-title cinema-title-highlight">Discover Your Shelf</h2>
      </div>
      <div className="cinema-poster-rail">
        ${(similarResults.length > 0 ? similarResults : searchResults).map((movie) => html`
          <div key=${movie.movie_id} className="cinema-poster-card" onClick=${() => handleSelectMovie(movie)}>
            ${posterFallbacks[movie.movie_id]
              ? html`<div className="poster-fallback" style="background: linear-gradient(45deg, #1a1a1a, #2a2a2a);"></div>`
              : html`
                <img
                  src=${movie.poster_url || movie.backdrop_url}
                  alt=${movie.title}
                  className="cinema-poster-image"
                  onError=${() => handlePosterError(movie.movie_id)}
                />
              `}
            <div className="cinema-poster-overlay">
              <h3 className="cinema-poster-title">${movie.title}</h3>
              <p className="cinema-poster-year">${movie.year || "Unknown"}</p>
              <div className="cinema-poster-match">Match ${Math.round((movie.similarity || 0) * 100)}%</div>
            </div>
          </div>
        `)}
      </div>
      <div className="cinema-poster-rail">
        ${randomMovie ? html`
          <div className="cinema-poster-card" onClick=${() => handleSelectMovie(randomMovie)}>
            <img
              src=${randomMovie.poster_url || randomMovie.backdrop_url}
              alt=${randomMovie.title}
              className="cinema-poster-image"
              onError=${() => handlePosterError(randomMovie.movie_id)}
            />
            <div className="cinema-poster-overlay">
              <h3 className="cinema-poster-title">${randomMovie.title}</h3>
              <p className="cinema-poster-year">${randomMovie.year || "Unknown"}</p>
            </div>
          </div>
        ` : null}
      </div>
    </section>
  `;

  // Feature Strip
  const FeatureStrip = () => html`
    <section className="cinema-feature-strip">
      <div className="cinema-features">
        <div className="cinema-feature-item">
          <div className="cinema-feature-icon">🎬</div>
          <h3 className="cinema-feature-title">Real Movie Data</h3>
          <p className="cinema-feature-desc">TMDb and MovieLens datasets provide rich metadata for accurate recommendations</p>
        </div>
        <div className="cinema-feature-item">
          <div className="cinema-feature-icon">🔍</div>
          <h3 className="cinema-feature-title">Similarity-Based Recommendations</h3>
          <p className="cinema-feature-desc">Cosine similarity and k-nearest neighbors find truly related films</p>
        </div>
        <div className="cinema-feature-item">
          <div className="cinema-feature-icon">🎲</div>
          <h3 className="cinema-feature-title">Random Discovery</h3>
          <p className="cinema-feature-desc">Weighted random picks surface hidden gems you might otherwise miss</p>
        </div>
        <div className="cinema-feature-item">
          <div className="cinema-feature-icon">📺</div>
          <h3 className="cinema-feature-title">Streaming Filters</h3>
          <p className="cinema-feature-desc">See where to watch and filter by your available services</p>
        </div>
      </div>
    </section>
  `;

  // Letterboxd DNA Section
  const LetterboxdDNA = () => html`
    <section className="cinema-letterboxd">
      <div className="cinema-letterboxd-content">
        <div className="cinema-dna-icon">🧬</div>
        <h2 className="cinema-dna-title">Turn your favorites into a recommendation engine.</h2>
        <p className="cinema-dna-desc">
          Import your Letterboxd watch history and ratings. We'll analyze your taste DNA
          and build personalized recommendations that reflect your unique preferences.
        </p>
        <button className="primary-button" onClick=${() => console.log("Open import modal")}>
          Import Your Letterboxd
        </button>
      </div>
    </section>
  `;

  // Footer
  const Footer = () => html`
    <footer className="cinema-footer">
      <p className="cinema-footer-text">CineMatch ML • Powered by metadata embeddings and similarity search</p>
    </footer>
  `;

  return html`
    <div className="cinema-page">
      ${isLoading ? LoadingBlock({label: "Loading cinematic experience..."}) : Hero()}
      ${Recommendations()}
      ${FeatureStrip()}
      ${LetterboxdDNA()}
      ${Footer()}
    </div>
  `;
}

export default App;
