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

function calculateCosineSimilarity(desc1: number[], desc2: number[]): number {
  if (desc1.length !== desc2.length) return 0
  
  let dotProduct = 0
  let magnitude1 = 0
  let magnitude2 = 0
  
  for (let i = 0; i < desc1.length; i++) {
    dotProduct += desc1[i] * desc2[i]
    magnitude1 += desc1[i] * desc1[i]
    magnitude2 += desc2[i] * desc2[i]
  }
  
  const magnitude = Math.sqrt(magnitude1) * Math.sqrt(magnitude2)
  return magnitude === 0 ? 0 : dotProduct / magnitude
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

    // Add request ID for better tracking
    const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2)
    
    const users = await usersCollection.find({}).toArray()
    let bestMatch: WithId<Document> | null = null
    let bestDistance = Infinity
    let bestSimilarity = -1
    
    // VERY strict thresholds to prevent false positives
    const euclideanThreshold = 0.35  // Much stricter threshold
    const cosineSimilarityThreshold = 0.92  // Very high similarity requirement
    const minimumConfidenceThreshold = 85  // Minimum confidence to accept match

    // Find best matching face using both distance and similarity
    for (const user of users) {
      if (!user.faceDescriptor || !Array.isArray(user.faceDescriptor)) continue
      
      const distance = calculateEuclideanDistance(faceDescriptor, user.faceDescriptor)
      const similarity = calculateCosineSimilarity(faceDescriptor, user.faceDescriptor)
      
      // BOTH metrics must pass strict thresholds
      if (distance < euclideanThreshold && similarity > cosineSimilarityThreshold) {
        if (distance < bestDistance) {
          bestDistance = distance
          bestSimilarity = similarity
          bestMatch = user
        }
      }
    }

    // Calculate confidence with stricter requirements
    let confidence = 0
    if (bestMatch && bestSimilarity > 0) {
      // Weighted confidence calculation
      const distanceScore = Math.max(0, (1 - (bestDistance / euclideanThreshold)) * 100)
      const similarityScore = (bestSimilarity * 100)
      confidence = (distanceScore * 0.3 + similarityScore * 0.7)
      
      // Apply minimum confidence threshold
      if (confidence < minimumConfidenceThreshold) {
        bestMatch = null
        confidence = 0
      }
    }
    // Final validation - only succeed if we have a very confident match
    const success = bestMatch !== null && confidence >= minimumConfidenceThreshold && bestSimilarity > cosineSimilarityThreshold

    // Log recognition attempt with request tracking
    const logEntry = {
      userId: bestMatch ? bestMatch._id.toString() : null,
      confidence,
      success,
      timestamp: new Date(),
      requestId,
      euclideanDistance: bestMatch ? bestDistance : null,
      cosineSimilarity: bestMatch ? bestSimilarity : null,
      userAgent: event.headers['user-agent'] || 'unknown'
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
        user: bestMatch ? { 
          ...bestMatch, 
          id: bestMatch._id.toString(),
          // Remove sensitive face descriptor from response
          faceDescriptor: undefined 
        } : null,
        confidence: Number(confidence.toFixed(1)),
        requestId,
        timestamp: new Date().toISOString()
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