export async function onRequest(context) {
  const fallback = context.env.API_FALLBACK;

  try {
    if (!fallback) throw new Error("API_FALLBACK missing");

    const response = await fetch(fallback);

    if (!response.ok) {
      throw new Error("Fallback API failed");
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "s-maxage=10, stale-while-revalidate=30"
      }
    });

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Fallback API error",
        message: error.message
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
}
