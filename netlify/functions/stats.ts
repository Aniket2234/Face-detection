import type { Handler } from "@netlify/functions"
import { MongoClient } from "mongodb"

let client: MongoClient | null = null

async function getMongoClient() {
  if (!client) {
    const uri = process.env.MONGODB_URI
    if (!uri) {
      throw new Error("MONGODB_URI environment variable is not set")
    }
    client = new MongoClient(uri)
    await client.connect()
  }
  return client
}

export const handler: Handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json"
  }

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" }
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: "Method not allowed" })
    }
  }

  try {
    const client = await getMongoClient()
    const db = client.db("facedetection")
    const logsCollection = db.collection("recognition_logs")
    const usersCollection = db.collection("users")

    // Get total scans
    const totalScans = await logsCollection.countDocuments()
    
    // Get successful scans
    const successfulScans = await logsCollection.countDocuments({ success: true })
    
    // Calculate success rate
    const successRate = totalScans > 0 ? (successfulScans / totalScans) * 100 : 0
    
    // Get scans today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const activeToday = await logsCollection.countDocuments({
      timestamp: { $gte: today }
    })
    
    // Get total registered users
    const totalUsers = await usersCollection.countDocuments()
    
    // Get recent activity (last 7 days)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const dailyStats = await logsCollection.aggregate([
      {
        $match: {
          timestamp: { $gte: weekAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$timestamp"
            }
          },
          scans: { $sum: 1 },
          successful: {
            $sum: { $cond: ["$success", 1, 0] }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]).toArray()

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        totalScans,
        successRate: Number(successRate.toFixed(1)),
        activeToday,
        totalUsers,
        dailyStats
      })
    }
  } catch (error: any) {
    console.error("Error in stats function:", error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Failed to fetch statistics" })
    }
  }
}