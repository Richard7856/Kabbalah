"use client";

import { useEffect, useState } from "react";

interface Photo {
  url: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
}

interface Props {
  query: string;
}

// Renders atmospheric images for a given search query.
// Fetches from /api/image (server-side Pexels proxy) so the API key stays hidden.
export default function InlineImage({ query }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/image?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data) => setPhotos(data.photos ?? []))
      .catch(() => setPhotos([]))
      .finally(() => setLoading(false));
  }, [query]);

  if (loading) {
    return (
      <div className="my-4 flex gap-3">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="h-40 flex-1 rounded-lg bg-navy-700/50 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (photos.length === 0) return null;

  return (
    <div className="my-4 grid grid-cols-2 gap-3">
      {photos.map((photo, i) => (
        <div key={i} className="relative group overflow-hidden rounded-lg">
          <img
            src={photo.url}
            alt={photo.alt}
            className="w-full h-40 object-cover opacity-80 group-hover:opacity-100
                       transition-opacity duration-300"
            loading="lazy"
          />
          {/* Gradient overlay so credit text is always readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 to-transparent" />
          {/* Pexels license requires photographer credit */}
          <a
            href={photo.photographerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-1.5 right-2 text-[10px] text-cream-400/60
                       hover:text-cream-300/90 transition-colors"
          >
            {photo.photographer} · Pexels
          </a>
        </div>
      ))}
    </div>
  );
}
