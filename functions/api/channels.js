export async function onRequest(context) {
  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      }
    });

  const normalize = (ch) => {
    if (!ch || typeof ch !== "object") return null;

    const pick = (...keys) => {
      for (const key of keys) {
        const value = ch[key];
        if (value !== undefined && value !== null && String(value).trim()) return value;
      }
      return "";
    };

    return {
      id: String(pick("id", "channel_id", "channelId", "cid", "slug", "name")),
      name: String(pick("name", "title", "channel_name", "channelName") || "Unnamed"),
      stream_url: String(pick("streamUrl", "stream_url", "mpd_url", "mpdUrl", "url", "manifest", "manifest_url")),
      logo: String(pick("logo", "logo_url", "logoUrl", "image", "image_url", "thumbnail")),
      key_id: String(pick("keyId", "key_id", "kid", "drm_key_id")).toLowerCase(),
      key: String(pick("key", "drm_key", "clearKey")).toLowerCase(),
      cookie: String(pick("cookie", "cookies", "http_cookie")),
      cookie_url: String(pick("cookie_url", "cookies_url")),
      category: String(pick("group", "category", "genre", "type", "network") || "Sony")
    };
  };

  const collect = (value) => {
    if (Array.isArray(value)) return value;
    if (!value || typeof value !== "object") return [];
    for (const key of ["channels", "data", "results", "items", "list", "streams"]) {
      if (Array.isArray(value[key])) return value[key];
      if (value[key] && typeof value[key] === "object") {
        const nested = collect(value[key]);
        if (nested.length) return nested;
      }
    }
    return [];
  };

  try {
    // CricZoneTV combined channel API: primary -> fallback.
    const upstreamUrl = context.env.UPSTREAM_API || "https://criczonelive.vercel.app/api/jtv";

    let url;
    try {
      url = new URL(upstreamUrl);
    } catch {
      return json({ error: "INVALID_UPSTREAM_URL" }, 500);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "CricZone-Sony-Channel-API/2.0"
      },
      redirect: "follow",
      cf: { cacheTtl: 0, cacheEverything: false }
    });

    if (!response.ok) {
      const body = await response.text();
      return json({
        error: "UPSTREAM_HTTP_ERROR",
        upstreamStatus: response.status,
        upstream: url.hostname,
        responsePreview: body.slice(0, 300)
      }, 502);
    }

    const raw = await response.text();
    if (!raw.trim()) return json({ error: "EMPTY_UPSTREAM_RESPONSE" }, 502);

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return json({
        error: "INVALID_JSON_FROM_UPSTREAM",
        responsePreview: raw.slice(0, 500)
      }, 502);
    }

    const channels = collect(parsed)
      .map(normalize)
      .filter(Boolean)
      .filter(ch => ch.stream_url)
      .filter(ch => {
        const haystack = [
          ch.name,
          ch.category,
          ch.id
        ].join(" ").toLowerCase().replace(/[._-]+/g, " ");
        return /\bsony\b|sonysports|sony sports|sony ten|sony six|sony max|sony pix|sony sab|sony pal|sony yay|sony liv/.test(haystack);
      });

    const seen = new Set();
    const unique = channels.filter(ch => {
      const key = ch.id || ch.name;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return json({
      channels: unique,
      count: unique.length,
      source: "criczonetv-jtv-filtered",
      filter: "sony"
    });
  } catch (error) {
    return json({
      error: "CHANNEL_API_ERROR",
      message: error instanceof Error ? error.message : String(error)
    }, 500);
  }
}
