import { NextResponse } from "next/server";
import { Client } from "pg";

export async function POST(req: Request) {
  const body = await req.json();
  const { symbol } = body;
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  await client.connect();

  const result = await client.query(
    `
    SELECT bucket AS time, open, high, low, close
    FROM assetPrice_1m
    WHERE symbol = $1
    ORDER BY bucket DESC
    LIMIT 50
  `,
    [symbol],
  );

  await client.end();
  return NextResponse.json({ message: "Data Fetched", data: result.rows });
}
