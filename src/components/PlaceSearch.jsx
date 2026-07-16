"use client";

import { useState, useRef, useEffect } from "react";
import { searchPlaces } from "@/lib/geo";

// Thanh tìm kiếm địa điểm thật (mọi địa chỉ ở VN, không giới hạn 5 hub) —
// gõ vào tự gợi ý sau debounce ~400ms qua Nominatim (OpenStreetMap).
export default function PlaceSearch({ label, placeholder, value, onSelect, accentColor }) {
  const [query, setQuery] = useState(value?.name ?? "");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    setQuery(value?.name ?? "");
  }, [value]);

  useEffect(() => {
    function onClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleChange(e) {
    const q = e.target.value;
    setQuery(q);
    setOpen(true);
    clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const r = await searchPlaces(q);
      setResults(r);
      setLoading(false);
    }, 400);
  }

  function pick(place) {
    onSelect(place);
    setQuery(place.name);
    setResults([]);
    setOpen(false);
  }

  return (
    <div className="place-search" ref={boxRef}>
      <label className="place-search-label" style={accentColor ? { color: accentColor } : undefined}>
        {label}
      </label>
      <input
        type="text"
        value={query}
        placeholder={placeholder}
        onChange={handleChange}
        onFocus={() => results.length > 0 && setOpen(true)}
      />
      {open && (loading || results.length > 0) && (
        <div className="place-search-dropdown">
          {loading && <div className="place-search-loading">Đang tìm…</div>}
          {!loading &&
            results.map((r, i) => (
              <button
                key={i}
                type="button"
                className="place-search-item"
                onClick={() => pick(r)}
              >
                {r.name}
              </button>
            ))}
          {!loading && results.length === 0 && (
            <div className="place-search-loading">Không tìm thấy địa điểm</div>
          )}
        </div>
      )}
    </div>
  );
}
