import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const result = await client.query(
    `
    SELECT bucket AS time, open, high, low, close
    FROM assetPrice_1m
    WHERE symbol = $1
    ORDER BY bucket ASC
  `,
    [symbol],
  );

  await client.end();
  return NextResponse.json({ message: "Data Fetched", data: result.rows });
}
