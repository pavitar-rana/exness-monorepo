import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});
await client.connect();

await client.query(`
CREATE TABLE assetPrice (
  "time"      timestamptz not null,
  symbol  TEXT        NOT NULL,
  price   DOUBLE PRECISION
) WITH (
timescaledb.hypertable,
timescaledb.partition_column = 'time',
timescaledb.segmentby = symbol,
timescaledb.chunk_interval='1 day'

)
`);

const candleTabls: { name: string; chunkTime: string }[] = [
  { name: "assetPrice_1m", chunkTime: "1 minute" },
  { name: "assetPrice_5m", chunkTime: "5 minutes" },
  { name: "assetPrice_10m", chunkTime: "10 minutes" },
  { name: "assetPrice_30m", chunkTime: "30 minutes" },
];

for (const candle of candleTabls) {
  await client.query(`
    CREATE MATERIALIZED VIEW ${candle.name}
    WITH (timescaledb.continuous) AS
    SELECT
       time_bucket(INTERVAL '${candle.chunkTime}', time) AS bucket,
       symbol,
       first(price, time) AS open,
       MAX(price) AS high,
       MIN(price) AS low,
       last(price, time) as close
    FROM assetPrice
    GROUP BY bucket, symbol;
  `);
}

await client.end();
