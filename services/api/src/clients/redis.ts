import Redis, { RedisOptions } from "ioredis";
import { isProd } from "../constants";

const redisURL = isProd ? process.env.REDIS_TLS_URL : process.env.REDIS_URL;
const params = {} as RedisOptions;

if (isProd) {
  params.tls = { rejectUnauthorized: false };
}

export const redis = new Redis(redisURL as string, params);
