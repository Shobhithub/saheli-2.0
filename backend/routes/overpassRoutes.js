import express from "express";

const router = express.Router();

router.post("/query", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        message: "Overpass query is required",
      });
    }

    const response = await fetch(
      "https://overpass-api.de/api/interpreter",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "SaheliSafetyApp/1.0",
        },
        body: new URLSearchParams({
          data: query,
        }),
      }
    );

    const responseText = await response.text();

    if (!response.ok) {
      console.error(
        "Overpass API error:",
        response.status,
        responseText
      );

      return res.status(response.status).json({
        message: "Overpass API request failed",
        status: response.status,
        error: responseText,
      });
    }

    const data = JSON.parse(responseText);

    return res.json(data);
  } catch (error) {
    console.error("Overpass proxy error:", error);

    return res.status(500).json({
      message: "Failed to fetch nearby places",
      error: error.message,
    });
  }
});

export default router;