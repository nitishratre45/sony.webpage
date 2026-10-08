export async function onRequest(context) {
  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      }
    });

  try {
    const upstreamUrl = context.env.COOKIE_API;
    if (!upstreamUrl) return json({ error: "COOKIE_API_MISSING" }, 500);

    let url;
    try {
      url = new URL(upstreamUrl);
    } catch {
      return json({ error: "INVALID_COOKIE_API_URL" }, 500);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "CricZone-Sony-Cookie-API/2.0"
      },
      redirect: "follow",
      cf: { cacheTtl: 0, cacheEverything: false }
    });

    if (!response.ok) {
      const body = await response.text();
      return json({
        error: "COOKIE_UPSTREAM_HTTP_ERROR",
        upstreamStatus: response.status,
        upstream: url.hostname,
        responsePreview: body.slice(0, 300)
      }, 502);
    }

    const raw = await response.text();
    if (!raw.trim()) return json({ error: "EMPTY_COOKIE_RESPONSE" }, 502);

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return json({
        error: "INVALID_COOKIE_JSON",
        responsePreview: raw.slice(0, 500)
      }, 502);
    }

    return json(parsed);
  } catch (error) {
    return json({
      error: "COOKIE_API_ERROR",
      message: error instanceof Error ? error.message : String(error)
    }, 500);
  }
}
