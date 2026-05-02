//user Registration

import { RequestHandler } from "express";
import Search from "../models/SearchSchema";
import { getCache, setCache } from "../utils/cache";

export const searchHandler: RequestHandler = async (req, res) => {

  const query = String(req.query.query || "").trim();

  if (!query) {
    return res.status(200).json({
      success: true,
      results: []
    });
  }
  const cacheKey = `search:query:${query}`

  const cachedData = await getCache(cacheKey)
  if (cachedData) {
    return res.status(200).json({
      success: true,
      results: cachedData
    })

  }

  const results = await Search.aggregate([
    {
      $match: {
        $text: { $search: query }
      }
    },
    {
      $addFields: {
        score: { $meta: "textScore" }
      }
    },
    {
      $sort: {
        score: -1
      }
    },
    {
      $project: {
        score: 0,
        userId: 0
      }
    },
    { $limit: 10 }
  ])


  setCache(cacheKey, results)
  return res.status(200).json({
    success: true,
    results: results
  })

}


