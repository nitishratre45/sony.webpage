export async function onRequest(context) {
  const json = (data, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "s-maxage=10, stale-while-revalidate=30"
    }
  });

  try {
    const upstream = context.env.API_FALLBACK || context.env.UPSTREAM_API;
    if (!upstream) return json({ error: "API_FALLBACK_MISSING" }, 500);

    const response = await fetch(upstream, {
      headers: { Accept: "application/json" },
      redirect: "follow"
    });

    if (!response.ok) return json({ error: "Fallback API failed", status: response.status }, response.status);

    return json(await response.json());
  } catch (error) {
    return json({ error: "Fallback API error", message: error instanceof Error ? error.message : String(error) }, 500);
  }
}
