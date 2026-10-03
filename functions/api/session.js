export default async function handler(req, res) {
  try {
    const response = await fetch(process.env.COOKIE_API, {
      cache: "no-store",
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Session API request failed"
      });
    }

    const data = await response.json();

    return res.status(200).json(data);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Backend error"
    });
  }
}
