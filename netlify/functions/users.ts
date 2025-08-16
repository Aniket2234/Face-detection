import type { Handler } from "@netlify/functions"
import { MongoClient, ObjectId, type WithId, type Document } from "mongodb"
import { insertUserSchema } from "../../shared/schema"
import { z } from "zod"

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
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Content-Type": "application/json"
  }

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" }
  }

  try {
    const client = await getMongoClient()
    const db = client.db("facedetection")
    const usersCollection = db.collection("users")

    const { httpMethod, path, body } = event
    const pathSegments = path.replace("/api/users", "").split("/").filter(Boolean)
    const userId = pathSegments[0]

    switch (httpMethod) {
      case "GET":
        if (userId) {
          // Get single user
          if (!ObjectId.isValid(userId)) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ message: "Invalid user ID" })
            }
          }
          const user = await usersCollection.findOne({ _id: new ObjectId(userId) })
          if (!user) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ message: "User not found" })
            }
          }
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ ...user, id: user._id.toString() })
          }
        } else {
          // Get all users
          const users = await usersCollection.find({}).toArray()
          const formattedUsers = users.map(user => ({ ...user, id: user._id.toString() }))
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(formattedUsers)
          }
        }

      case "POST":
        if (!body) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "Request body required" })
          }
        }
        const userData = insertUserSchema.parse(JSON.parse(body))
        
        // Check if user with same name already exists
        const existingUser = await usersCollection.findOne({ name: userData.name })
        if (existingUser) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "User with this name already exists" })
          }
        }

        // Check for duplicate face
        if (userData.faceDescriptor && Array.isArray(userData.faceDescriptor)) {
          const allUsers = await usersCollection.find({}).toArray()
          const threshold = 0.6
          
          for (const user of allUsers) {
            if (!user.faceDescriptor || !Array.isArray(user.faceDescriptor)) continue
            
            const distance = calculateEuclideanDistance(userData.faceDescriptor, user.faceDescriptor)
            if (distance < threshold) {
              return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                  message: "This face is already registered in the system",
                  existingUser: user.name
                })
              }
            }
          }
        }

        const result = await usersCollection.insertOne(userData)
        const newUser = await usersCollection.findOne({ _id: result.insertedId })
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({ ...newUser, id: newUser!._id.toString() })
        }

      case "PATCH":
        if (!userId || !ObjectId.isValid(userId)) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "Valid user ID required" })
          }
        }
        
        if (!body) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "Request body required" })
          }
        }
        const updates = JSON.parse(body)
        const updateResult = await usersCollection.findOneAndUpdate(
          { _id: new ObjectId(userId) },
          { $set: updates },
          { returnDocument: "after" }
        )
        
        if (!updateResult || !updateResult.value) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ message: "User not found" })
          }
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ ...updateResult.value, id: updateResult.value._id.toString() })
        }

      case "DELETE":
        if (!userId || !ObjectId.isValid(userId)) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ message: "Valid user ID required" })
          }
        }
        
        const deleteResult = await usersCollection.deleteOne({ _id: new ObjectId(userId) })
        if (deleteResult.deletedCount === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ message: "User not found" })
          }
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: "User deleted successfully" })
        }

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ message: "Method not allowed" })
        }
    }
  } catch (error: any) {
    console.error("Error in users function:", error)
    if (error instanceof z.ZodError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: "Invalid user data", errors: error.errors })
      }
    }
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Internal server error" })
    }
  }
}