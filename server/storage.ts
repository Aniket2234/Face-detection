import { type User, type InsertUser, type RecognitionLog, type InsertRecognitionLog } from "@shared/schema";
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

export const storage = new MemStorage();
