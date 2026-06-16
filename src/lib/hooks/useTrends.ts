import { useState } from "react";
import { Trend, TrendSearchParams } from "../types/trend.types";

export function useTrends() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchTrends = async (params: TrendSearchParams) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/trends", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch trends. Please try again.");
      }

      const data = await response.json();
      setTrends(data);
    } catch (err: any) {
      console.error("useTrends error:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return { trends, loading, error, searchTrends };
}
