import React, { useState, useEffect, useRef } from "react";
import "./styles.css";

const API_BASE = "https://openlibrary.org/search.json";

function BookCard({ book }) {
  const cover = book.cover_i
    ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
    : null;

  return (
    <div className="book-card">
      <div className="cover">
        {cover ? (
          <img src={cover} alt={`Cover of ${book.title}`} />
        ) : (
          <div className="no-cover">No cover</div>
        )}
      </div>
      <div className="details">
        <h3>{book.title}</h3>
        <p>
          {book.author_name ? book.author_name.join(", ") : "Unknown author"}
        </p>
        <small>
          {book.first_publish_year
            ? `First published ${book.first_publish_year}`
            : ""}
        </small>
        <a
          href={`https://openlibrary.org${book.key}`}
          target="_blank"
          rel="noreferrer"
        >
          View on Open Library
        </a>
      </div>
    </div>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(null);
  const [numFound, setNumFound] = useState(0);
  const lastQueryRef = useRef("");

  async function fetchBooks(q, pageNum = 1, append = false) {
    if (!q) return;
    setIsLoading(true);
    setHasError(null);
    try {
      const url = `${API_BASE}?title=${encodeURIComponent(
        q
      )}&page=${pageNum}&limit=20`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setNumFound(data.numFound || 0);
      const docs = (data.docs || []).map((d) => ({
        key: d.key,
        title: d.title,
        author_name: d.author_name,
        first_publish_year: d.first_publish_year,
        cover_i: d.cover_i,
      }));
      setBooks((prev) => (append ? [...prev, ...docs] : docs));
    } catch (err) {
      setHasError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  // debounce search
  useEffect(() => {
    if (!query.trim()) {
      setBooks([]);
      setNumFound(0);
      return;
    }
    lastQueryRef.current = query.trim();
    setPage(1);
    const t = setTimeout(() => fetchBooks(query.trim(), 1, false), 400);
    return () => clearTimeout(t);
  }, [query]);

  function loadMore() {
    const next = page + 1;
    setPage(next);
    fetchBooks(lastQueryRef.current, next, true);
  }

  return (
    <div className="app">
      <h1>📚 Book Finder</h1>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by title (e.g., 'harry potter')"
      />

      {hasError && <div className="error">Error: {hasError}</div>}
      {isLoading && <div>Loading…</div>}

      {!isLoading && books.length === 0 && query && !hasError && (
        <div>No results found.</div>
      )}

      <div className="book-list">
        {books.map((b) => (
          <BookCard key={b.key} book={b} />
        ))}
      </div>

      {books.length < numFound && (
        <button onClick={loadMore} disabled={isLoading}>
          Load more
        </button>
      )}
    </div>
  );
}
