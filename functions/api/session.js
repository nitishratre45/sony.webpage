export async function onRequest(context) {
  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    });

  try {
    const cookieApi = context.env.COOKIE_API;

    // Check environment variable
    if (!cookieApi) {
      return json(
        {
          error: "COOKIE_API_MISSING",
          message: "COOKIE_API environment variable is not configured."
        },
        500
      );
    }

    // Validate URL
    let url;

    try {
      url = new URL(cookieApi);
    } catch {
      return json(
        {
          error: "INVALID_COOKIE_API_URL",
          message: "COOKIE_API is not a valid URL."
        },
        500
      );
    }

    // Fetch cookie API
    let response;

    try {
      response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "User-Agent": "CricZone-Session-API/1.0"
        },
        redirect: "follow",
        cf: {
          cacheTtl: 0,
          cacheEverything: false
        }
      });
    } catch (error) {
      console.error("COOKIE API FETCH ERROR:", error);

      return json(
        {
          error: "COOKIE_API_FETCH_FAILED",
          message:
            error instanceof Error
              ? error.message
              : String(error),
          upstream: url.hostname
        },
        502
      );
    }

    // Upstream HTTP error
    if (!response.ok) {
      const body = await response.text();

      console.error(
        "COOKIE API HTTP ERROR:",
        response.status,
        body.slice(0, 500)
      );

      return json(
        {
          error: "COOKIE_API_HTTP_ERROR",
          upstreamStatus: response.status,
          upstreamStatusText: response.statusText,
          upstream: url.hostname,
          responsePreview: body.slice(0, 500)
        },
        502
      );
    }

    // Read response
    const body = await response.text();

    if (!body || !body.trim()) {
      return json(
        {
          error: "EMPTY_COOKIE_API_RESPONSE"
        },
        502
      );
    }

    // Make sure response is valid JSON
    try {
      JSON.parse(body);
    } catch {
      return json(
        {
          error: "INVALID_JSON_FROM_COOKIE_API",
          responsePreview: body.slice(0, 500)
        },
        502
      );
    }

    // Return cookie data
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type":
          response.headers.get("content-type") ||
          "application/json",
        "Cache-Control": "no-store"
      }
    });

  } catch (error) {
    console.error("SESSION API ERROR:", error);

    return json(
      {
        error: "SESSION_API_ERROR",
        message:
          error instanceof Error
            ? error.message
            : String(error)
      },
      500
    );
  }
}
