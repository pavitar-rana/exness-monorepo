import { Worker } from "bullmq";
import IORedis from "ioredis";
import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

await client.connect();

const connection = new IORedis.Redis({ maxRetriesPerRequest: null });

const worker = new Worker(
  "pricePooler",
  async (job) => {
    try {
      await client.query(
        `INSERT INTO metrics.assetPrice ("time", symbol, price)
         VALUES (NOW(), $1, $2)`,
        [job.data.symbol, parseFloat(job.data.price.bid)],
      );
    } catch (e) {
      console.error("error", e);
    }
  },
  { connection },
);

console.log("Price to db worker started");
