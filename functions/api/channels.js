export async function onRequest(context) {
  try {
    const upstreamUrl = context.env.UPSTREAM_API;

    if (!upstreamUrl) {
      return new Response(
        JSON.stringify({
          error: "UPSTREAM_API environment variable is missing"
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const response = await fetch(upstreamUrl);

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: "Failed to fetch channel data",
          upstreamStatus: response.status
        }),
        {
          status: response.status,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const data = await response.text();

    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    });

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Backend error",
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
