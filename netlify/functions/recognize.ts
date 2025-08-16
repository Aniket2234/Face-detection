import type { Handler } from "@netlify/functions"
import { MongoClient, ObjectId, type WithId, type Document } from "mongodb"

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

function calculateEuclideanDistance(desc1: number[], desc2: number[]): number {
  if (desc1.length !== desc2.length) return Infinity
  
  let sum = 0
  for (let i = 0; i < desc1.length; i++) {
    sum += Math.pow(desc1[i] - desc2[i], 2)
  }
  return Math.sqrt(sum)
}

export const handler: Handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  }

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" }
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: "Method not allowed" })
    }
  }

  try {
    const client = await getMongoClient()
    const db = client.db("facedetection")
    const usersCollection = db.collection("users")
    const logsCollection = db.collection("recognition_logs")

    const { faceDescriptor } = JSON.parse(event.body || "{}")
    
    if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Valid face descriptor required" })
      }
    }

    const users = await usersCollection.find({}).toArray()
    let bestMatch: WithId<Document> | null = null
    let bestDistance = Infinity
    const threshold = 0.6

    // Find best matching face
    for (const user of users) {
      if (!user.faceDescriptor || !Array.isArray(user.faceDescriptor)) continue
      
      const distance = calculateEuclideanDistance(faceDescriptor, user.faceDescriptor)
      if (distance < bestDistance && distance < threshold) {
        bestDistance = distance
        bestMatch = user
      }
    }

    const confidence = bestMatch ? Math.max(0, (1 - bestDistance) * 100) : 0
    const success = bestMatch !== null

    // Log recognition attempt
    const logEntry = {
      userId: bestMatch ? bestMatch._id.toString() : null,
      confidence,
      success,
      timestamp: new Date()
    }
    await logsCollection.insertOne(logEntry)

    // Update last seen if match found
    if (bestMatch) {
      await usersCollection.updateOne(
        { _id: bestMatch._id },
        { $set: { lastSeen: new Date() } }
      )
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success,
        user: bestMatch ? { ...bestMatch, id: bestMatch._id.toString() } : null,
        confidence: Number(confidence.toFixed(1))
      })
    }
  } catch (error: any) {
    console.error("Error in recognize function:", error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Face recognition failed" })
    }
  }
}