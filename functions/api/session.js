export async function onRequest(context) {
  try {
    const cookieApi = context.env.COOKIE_API;

    if (!cookieApi) {
      return new Response(
        JSON.stringify({
          error: "COOKIE_API environment variable is missing"
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
          }
        }
      );
    }

    const response = await fetch(cookieApi, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: "Session API request failed",
          upstreamStatus: response.status
        }),
        {
          status: response.status,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
          }
        }
      );
    }

    const body = await response.text();

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type":
          response.headers.get("content-type") || "application/json",
        "Cache-Control": "no-store"
      }
    });

  } catch (error) {
    console.error("Session API error:", error);

    return new Response(
      JSON.stringify({
        error: "Backend error",
        message: error instanceof Error
          ? error.message
          : String(error)
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      }
    );
  }
}
