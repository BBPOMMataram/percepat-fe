"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function BudgetMappingTabPage() {
  const searchParams = useSearchParams();

  const year = searchParams.get("year") || "2026";
  const tabId = searchParams.get("tab");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function getData() {
      try {
        setLoading(true);
        setError("");

        if (!tabId) {
          throw new Error("Parameter tab tidak ditemukan di URL.");
        }

        const response = await fetch(
          `http://127.0.0.1:8000/api/budget-mapping/${year}/tab/${tabId}`,
        );

        if (!response.ok) {
          throw new Error(`Request gagal: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || "Data gagal diambil.");
        }

        setData(result.data);
      } catch {
        throw new Error("Data gagal diambil.");
      } finally {
        setLoading(false);
      }
    }

    getData();
  }, [year, tabId]);

  if (loading) {
    return <div>Memuat data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!data) {
    return <div>Data tidak ditemukan.</div>;
  }

  return (
    <main style={{ padding: "20px" }}>
      {" "}
      <h1>Budget Mapping {year}</h1>
      <h2>{data.sheetTab?.title || "Detail Tab"}</h2>
      <p>Range: {data.range}</p>
      <table border="1" cellPadding="8" style={{ borderCollapse: "collapse" }}>
        <thead>
          {data.headerRows?.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <th key={cellIndex}>{cell ?? ""}</th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody>
          {data.rows?.map((row, rowIndex) => (
            <tr key={row.row_number ?? rowIndex}>
              {row.values?.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell ?? ""}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
