// Server-side proxy for Pexels image search.
// Keeps PEXELS_API_KEY out of the browser — never expose it client-side.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return Response.json({ error: "Query requerida" }, { status: 400 });
  }

  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    // Return empty gracefully — images are enhancement, not critical feature
    return Response.json({ photos: [] });
  }

  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=2&orientation=landscape`,
    { headers: { Authorization: apiKey } }
  );

  if (!res.ok) {
    return Response.json({ photos: [] });
  }

  const data = await res.json();

  // Return only what the client needs — don't expose full Pexels response
  const photos = (data.photos ?? []).map((p: {
    src: { large: string };
    alt: string;
    photographer: string;
    photographer_url: string;
  }) => ({
    url: p.src.large,
    alt: p.alt || query,
    photographer: p.photographer,
    photographerUrl: p.photographer_url,
  }));

  return Response.json({ photos });
}
