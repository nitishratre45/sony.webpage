function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "s-maxage=10, stale-while-revalidate=30"
    }
  });
}

export async function onRequest(context) {
  const primary = context.env.API_PRIMARY || context.env.UPSTREAM_API;
  const fallback = context.env.API_FALLBACK || context.env.UPSTREAM_API;

  if (!primary && !fallback) return json({ error: "API_SOURCE_MISSING" }, 500);

  try {
    const response = await fetch(primary, {
      headers: { Accept: "application/json" },
      redirect: "follow"
    });
    if (!response.ok) throw new Error("Primary API failed");
    return json(await response.json());
  } catch {
    try {
      const response = await fetch(fallback, {
        headers: { Accept: "application/json" },
        redirect: "follow"
      });
      if (!response.ok) throw new Error("Fallback API failed");
      return json(await response.json());
    } catch {
      return json({ error: "Both API sources failed" }, 502);
    }
  }
}
