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
    console.log(job.data);
    try {
      await client.query(`
        INSERT INTO assetPrice ("time", symbol, price)
        VALUES (NOW(), 'btcusdt', ${(parseFloat(job.data) - 10).toString()})
        `);
    } catch (e) {
      console.error("error", e);
    }
  },
  { connection },
);
