export async function onRequest(context) {
  const json = (data, status = 200) => new Response(JSON.stringify(data), {
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
      id: String(pick("id","channel_id","channelId","cid","slug","name")),
      name: String(pick("name","title","channel_name","channelName") || "Unnamed"),
      stream_url: String(pick("streamUrl","stream_url","mpd_url","mpdUrl","url","manifest","manifest_url")),
      logo: String(pick("logo","logo_url","logoUrl","image","image_url","thumbnail")),
      key_id: String(pick("keyId","key_id","kid","drm_key_id")).toLowerCase(),
      key: String(pick("key","drm_key","clearKey")).toLowerCase(),
      cookie: String(pick("cookie","cookies","http_cookie")),
      cookie_url: String(pick("cookie_url","cookies_url")),
      category: String(pick("group","category","genre","type","network") || "Sony")
    };
  };

  const collect = (value) => {
    if (Array.isArray(value)) return value;
    if (!value || typeof value !== "object") return [];
    for (const key of ["channels","data","results","items","list","streams"]) {
      if (Array.isArray(value[key])) return value[key];
      if (value[key] && typeof value[key] === "object") {
        const nested = collect(value[key]);
        if (nested.length) return nested;
      }
    }
    return [];
  };

  const isSony = (ch) => {
    const haystack = [ch.name, ch.category, ch.id]
      .join(" ")
      .toLowerCase()
      .replace(/[._-]+/g, " ");
    return /\bsony\b|sonysports|sony sports|sony ten|sony six|sony max|sony pix|sony sab|sony pal|sony yay|sony liv/.test(haystack);
  };

  const fetchJson = async (url) => {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      redirect: "follow"
    });
    if (!response.ok) throw new Error("HTTP " + response.status);
    return response.json();
  };

  try {
    // Same source model as CricZoneTV:
    // primary API first, fallback API second.
    // UPSTREAM_API remains supported for the existing Cloudflare setup.
    const primary = context.env.API_PRIMARY || context.env.UPSTREAM_API;
    const fallback = context.env.API_FALLBACK || context.env.UPSTREAM_API;

    if (!primary && !fallback) return json({ error: "API_SOURCE_MISSING" }, 500);

    let parsed;
    try {
      parsed = await fetchJson(primary);
    } catch (primaryError) {
      if (!fallback || fallback === primary) throw primaryError;
      parsed = await fetchJson(fallback);
    }

    const unique = [];
    const seen = new Set();

    for (const raw of collect(parsed)) {
      const ch = normalize(raw);
      if (!ch || !ch.stream_url || !isSony(ch)) continue;
      const key = ch.id || ch.name;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(ch);
    }

    return json({
      channels: unique,
      count: unique.length,
      source: "criczonetv-compatible-filtered",
      filter: "sony"
    });
  } catch (error) {
    return json({
      error: "CHANNEL_API_ERROR",
      message: error instanceof Error ? error.message : String(error)
    }, 502);
  }
}
