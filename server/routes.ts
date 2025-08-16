import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertRecognitionLogSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all users
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get user by ID
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
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
      const existingUser = await storage.getUserByName(userData.name);
      if (existingUser) {
        return res.status(400).json({ message: "User with this name already exists" });
      }

      const user = await storage.createUser(userData);
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
      const user = await storage.updateUser(req.params.id, updates);
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
      const success = await storage.deleteUser(req.params.id);
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

      const users = await storage.getAllUsers();
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
        await storage.addRecognitionLog({
          userId: bestMatch.id,
          confidence,
          success,
        });

        // Update last seen
        await storage.updateUser(bestMatch.id, { lastSeen: new Date() });
      } else {
        await storage.addRecognitionLog({
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
      const stats = await storage.getRecognitionStats();
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
