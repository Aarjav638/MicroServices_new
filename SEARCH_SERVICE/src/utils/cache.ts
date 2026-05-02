import { redisClient } from "../middlewares/rate-limiter";


export const getCache = async (key: string) => {
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
};

export const setCache = async (key: string, value: any, ttl = 180) => {
  await redisClient.setex(key, ttl, JSON.stringify(value));
};

export const deleteCachePattern = async (pattern: string) => {
  const keys = await redisClient.keys(pattern);
  if (keys.length) await redisClient.del(keys);
};
