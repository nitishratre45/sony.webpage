export default async function handler(req, res) {
  try {
    const response = await fetch(process.env.UPSTREAM_API);

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Failed to fetch channel data"
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
