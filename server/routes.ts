import type { Express } from "express";
import { createServer, type Server } from "http";
import { getStorage } from "./storage";
import { insertUserSchema, insertRecognitionLogSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Debug endpoint to check MongoDB connection and collections
  app.get("/api/debug/mongodb", async (req, res) => {
    try {
      const storage = getStorage();
      const client = (storage as any).client;
      const db = (storage as any).db;
      
      // Get list of all databases
      const adminDb = client.db().admin();
      const databasesList = await adminDb.listDatabases();
      
      // Check current database
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map((c: any) => c.name);
      
      // Count documents in each collection
      const collectionCounts: Record<string, number> = {};
      for (const name of collectionNames) {
        collectionCounts[name] = await db.collection(name).countDocuments();
      }
      
      // Sample some documents from non-empty collections
      const samples: Record<string, any[]> = {};
      for (const name of collectionNames) {
        if (collectionCounts[name] > 0) {
          samples[name] = await db.collection(name).find({}).limit(2).toArray();
        }
      }

      // Check the facedetection database specifically
      const alternativeChecks: Record<string, any> = {};
      try {
        const faceDetectionDb = client.db('facedetection');
        const faceDetectionCollections = await faceDetectionDb.listCollections().toArray();
        if (faceDetectionCollections.length > 0) {
          alternativeChecks['facedetection'] = {
            collections: faceDetectionCollections.map((c: any) => c.name),
            counts: {},
            samples: {}
          };
          
          for (const collection of faceDetectionCollections) {
            const count = await faceDetectionDb.collection(collection.name).countDocuments();
            alternativeChecks['facedetection'].counts[collection.name] = count;
            
            if (count > 0) {
              // Sample documents to see structure
              alternativeChecks['facedetection'].samples[collection.name] = await faceDetectionDb.collection(collection.name).find({}).limit(2).toArray();
            }
          }
        }
      } catch (e: any) {
        alternativeChecks['facedetection_error'] = e.message;
      }
      
      res.json({
        currentDatabase: "facedetection",
        allDatabases: databasesList.databases,
        collections: collectionNames,
        counts: collectionCounts,
        samples,
        alternativeChecks
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get all users
  app.get("/api/users", async (req, res) => {
    try {
      const users = await getStorage().getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get user by ID
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await getStorage().getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Create new user
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user with same name already exists
      const existingUser = await getStorage().getUserByName(userData.name);
      if (existingUser) {
        return res.status(400).json({ message: "User with this name already exists" });
      }

      // Check for duplicate face (same face with different name)
      if (userData.faceDescriptor && Array.isArray(userData.faceDescriptor)) {
        const allUsers = await getStorage().getAllUsers();
        const threshold = 0.6; // Face similarity threshold
        
        for (const user of allUsers) {
          if (!user.faceDescriptor || !Array.isArray(user.faceDescriptor)) continue;
          
          const distance = calculateEuclideanDistance(userData.faceDescriptor, user.faceDescriptor);
          if (distance < threshold) {
            return res.status(400).json({ 
              message: "This face is already registered in the system",
              existingUser: user.name 
            });
          }
        }
      }

      const user = await getStorage().createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Update user
  app.patch("/api/users/:id", async (req, res) => {
    try {
      const updates = req.body;
      const user = await getStorage().updateUser(req.params.id, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Delete user
  app.delete("/api/users/:id", async (req, res) => {
    try {
      const success = await getStorage().deleteUser(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Face recognition endpoint
  app.post("/api/recognize", async (req, res) => {
    try {
      const { faceDescriptor } = req.body;
      if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
        return res.status(400).json({ message: "Valid face descriptor required" });
      }

      const users = await getStorage().getAllUsers();
      let bestMatch = null;
      let bestDistance = Infinity;
      const threshold = 0.6; // Face recognition threshold

      // Simple Euclidean distance calculation for face matching
      for (const user of users) {
        if (!user.faceDescriptor || !Array.isArray(user.faceDescriptor)) continue;
        
        const distance = calculateEuclideanDistance(faceDescriptor, user.faceDescriptor);
        if (distance < bestDistance && distance < threshold) {
          bestDistance = distance;
          bestMatch = user;
        }
      }

      const confidence = bestMatch ? Math.max(0, (1 - bestDistance) * 100) : 0;
      const success = bestMatch !== null;

      // Log recognition attempt
      if (bestMatch) {
        await getStorage().addRecognitionLog({
          userId: bestMatch.id,
          confidence,
          success,
        });

        // Update last seen
        await getStorage().updateUser(bestMatch.id, { lastSeen: new Date() });
      } else {
        await getStorage().addRecognitionLog({
          userId: null,
          confidence,
          success,
        });
      }

      res.json({
        success,
        user: bestMatch,
        confidence: Number(confidence.toFixed(1)),
      });
    } catch (error) {
      res.status(500).json({ message: "Face recognition failed" });
    }
  });

  // Get recognition statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await getStorage().getRecognitionStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function calculateEuclideanDistance(desc1: number[], desc2: number[]): number {
  if (desc1.length !== desc2.length) return Infinity;
  
  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    sum += Math.pow(desc1[i] - desc2[i], 2);
  }
  return Math.sqrt(sum);
}
