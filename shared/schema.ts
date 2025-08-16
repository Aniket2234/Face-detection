import { z } from "zod";
import { ObjectId } from "mongodb";

// MongoDB User document schema
export const userSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  name: z.string().min(1),
  role: z.string().default("Employee"),
  faceDescriptor: z.array(z.number()).length(128), // 128D face embedding array
  profileImage: z.string().nullable().optional(), // base64 image data
  isActive: z.boolean().default(true),
  lastSeen: z.date().default(() => new Date()),
  createdAt: z.date().default(() => new Date()),
});

// MongoDB Recognition Log document schema
export const recognitionLogSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  userId: z.string().nullable().optional(),
  confidence: z.number(),
  timestamp: z.date().default(() => new Date()),
  success: z.boolean(),
});

export const insertUserSchema = userSchema.omit({
  _id: true,
  createdAt: true,
  lastSeen: true,
});

export const insertRecognitionLogSchema = recognitionLogSchema.omit({
  _id: true,
  timestamp: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof userSchema> & { id: string };
export type InsertRecognitionLog = z.infer<typeof insertRecognitionLogSchema>;
export type RecognitionLog = z.infer<typeof recognitionLogSchema> & { id: string };
