export async function onRequest(context) {
  const primary = context.env.API_PRIMARY;

  try {
    if (!primary) throw new Error("API_PRIMARY missing");

    const response = await fetch(primary);

    if (!response.ok) {
      throw new Error("Primary API failed");
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
        error: "Primary API error",
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
