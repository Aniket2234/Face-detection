import { type User, type InsertUser, type RecognitionLog, type InsertRecognitionLog } from "@shared/schema";
import { MongoClient, Db, ObjectId } from "mongodb";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByName(name: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  addRecognitionLog(log: InsertRecognitionLog): Promise<RecognitionLog>;
  getRecognitionStats(): Promise<{
    totalScans: number;
    successRate: number;
    activeToday: number;
  }>;
}

export class MongoStorage implements IStorage {
  private client: MongoClient;
  private db: Db;
  private isConnected: boolean = false;

  constructor(connectionString: string) {
    this.client = new MongoClient(connectionString, {
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
      retryWrites: true,
      maxPoolSize: 5,
      minPoolSize: 0,
    });
    this.db = this.client.db("facedetection");
  }

  private async ensureConnection(): Promise<void> {
    if (!this.isConnected) {
      try {
        await this.client.connect();
        this.isConnected = true;
        console.log("Connected to MongoDB successfully");
        console.log("✅ Successfully connected to MongoDB with provided URI");
      } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
        throw error;
      }
    }
  }

  private transformUser(doc: any): User {
    return {
      id: doc._id.toString(),
      name: doc.name,
      role: doc.role,
      faceDescriptor: doc.faceDescriptor,
      profileImage: doc.profileImage,
      isActive: doc.isActive,
      lastSeen: doc.lastSeen,
      createdAt: doc.createdAt,
    };
  }

  private transformRecognitionLog(doc: any): RecognitionLog {
    return {
      id: doc._id.toString(),
      userId: doc.userId,
      confidence: doc.confidence,
      timestamp: doc.timestamp,
      success: doc.success,
    };
  }

  async getUser(id: string): Promise<User | undefined> {
    await this.ensureConnection();
    try {
      const objectId = new ObjectId(id);
      const doc = await this.db.collection("users").findOne({ _id: objectId });
      return doc ? this.transformUser(doc) : undefined;
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  }

  async getUserByName(name: string): Promise<User | undefined> {
    await this.ensureConnection();
    try {
      const doc = await this.db.collection("users").findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') } 
      });
      return doc ? this.transformUser(doc) : undefined;
    } catch (error) {
      console.error("Error getting user by name:", error);
      return undefined;
    }
  }

  async getAllUsers(): Promise<User[]> {
    await this.ensureConnection();
    try {
      const docs = await this.db.collection("users")
        .find({})
        .sort({ lastSeen: -1 })
        .toArray();
      return docs.map(doc => this.transformUser(doc));
    } catch (error) {
      console.error("Error getting all users:", error);
      return [];
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    await this.ensureConnection();
    try {
      const userDoc = {
        name: insertUser.name,
        role: insertUser.role || "Employee",
        faceDescriptor: insertUser.faceDescriptor,
        profileImage: insertUser.profileImage || null,
        isActive: insertUser.isActive ?? true,
        createdAt: new Date(),
        lastSeen: new Date(),
      };

      const result = await this.db.collection("users").insertOne(userDoc);
      return this.transformUser({ ...userDoc, _id: result.insertedId });
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    await this.ensureConnection();
    try {
      const objectId = new ObjectId(id);
      const { id: _, ...updateDoc } = updates;
      
      const result = await this.db.collection("users").findOneAndUpdate(
        { _id: objectId },
        { $set: updateDoc },
        { returnDocument: "after" }
      );

      return result ? this.transformUser(result) : undefined;
    } catch (error) {
      console.error("Error updating user:", error);
      return undefined;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    await this.ensureConnection();
    try {
      const objectId = new ObjectId(id);
      const result = await this.db.collection("users").deleteOne({ _id: objectId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }

  async addRecognitionLog(insertLog: InsertRecognitionLog): Promise<RecognitionLog> {
    await this.ensureConnection();
    try {
      const logDoc = {
        userId: insertLog.userId,
        confidence: insertLog.confidence,
        success: insertLog.success,
        timestamp: new Date(),
      };

      const result = await this.db.collection("recognition_logs").insertOne(logDoc);
      return this.transformRecognitionLog({ ...logDoc, _id: result.insertedId });
    } catch (error) {
      console.error("Error adding recognition log:", error);
      throw error;
    }
  }

  async getRecognitionStats(): Promise<{
    totalScans: number;
    successRate: number;
    activeToday: number;
  }> {
    await this.ensureConnection();
    try {
      const totalScans = await this.db.collection("recognition_logs").countDocuments();
      const successfulScans = await this.db.collection("recognition_logs").countDocuments({ success: true });
      const successRate = totalScans > 0 ? (successfulScans / totalScans) * 100 : 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const activeToday = await this.db.collection("users").countDocuments({
        lastSeen: { $gte: today }
      });

      return {
        totalScans,
        successRate: Number(successRate.toFixed(1)),
        activeToday,
      };
    } catch (error) {
      console.error("Error getting recognition stats:", error);
      return { totalScans: 0, successRate: 0, activeToday: 0 };
    }
  }
}

// In-memory fallback storage for when MongoDB is unavailable
export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private recognitionLogs: Map<string, RecognitionLog>;

  constructor() {
    this.users = new Map();
    this.recognitionLogs = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByName(name: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.name.toLowerCase() === name.toLowerCase(),
    );
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort((a, b) => 
      new Date(b.lastSeen || 0).getTime() - new Date(a.lastSeen || 0).getTime()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser,
      role: insertUser.role || "Employee",
      profileImage: insertUser.profileImage || null,
      isActive: insertUser.isActive ?? true,
      id,
      createdAt: new Date(),
      lastSeen: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async addRecognitionLog(insertLog: InsertRecognitionLog): Promise<RecognitionLog> {
    const id = randomUUID();
    const log: RecognitionLog = {
      ...insertLog,
      userId: insertLog.userId || null,
      id,
      timestamp: new Date(),
    };
    this.recognitionLogs.set(id, log);
    return log;
  }

  async getRecognitionStats(): Promise<{
    totalScans: number;
    successRate: number;
    activeToday: number;
  }> {
    const logs = Array.from(this.recognitionLogs.values());
    const totalScans = logs.length;
    const successfulScans = logs.filter(log => log.success).length;
    const successRate = totalScans > 0 ? (successfulScans / totalScans) * 100 : 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeToday = Array.from(this.users.values()).filter(user => 
      user.lastSeen && new Date(user.lastSeen) >= today
    ).length;

    return {
      totalScans,
      successRate: Number(successRate.toFixed(1)),
      activeToday,
    };
  }
}

// Smart storage factory that falls back to in-memory if MongoDB fails
async function createStorage(): Promise<IStorage> {
  const MONGODB_URI = "mongodb+srv://airavatatechnologiesprojects:1VIvCSHWhmSgzTNa@facedetection.rjmd0pp.mongodb.net/?retryWrites=true&w=majority&appName=FaceDetection";
  
  const mongoStorage = new MongoStorage(MONGODB_URI);
  
  try {
    // Test the MongoDB connection
    await mongoStorage.getAllUsers();
    console.log("✅ Successfully connected to MongoDB");
    return mongoStorage;
  } catch (error: any) {
    console.warn("⚠️ MongoDB connection failed, falling back to in-memory storage:", error?.message || "Unknown error");
    return new MemStorage();
  }
}

// Initialize storage with promise resolution
let storageInstance: IStorage;

const initStorage = async () => {
  storageInstance = await createStorage();
};

export const getStorage = (): IStorage => {
  if (!storageInstance) {
    // Fallback to in-memory if storage not initialized
    return new MemStorage();
  }
  return storageInstance;
};

// Initialize storage on module load
initStorage();
