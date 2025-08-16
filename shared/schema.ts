import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  role: text("role").notNull().default("Employee"),
  faceDescriptor: jsonb("face_descriptor").notNull(), // 128D face embedding array
  profileImage: text("profile_image"), // base64 image data
  isActive: boolean("is_active").notNull().default(true),
  lastSeen: timestamp("last_seen").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const recognitionLogs = pgTable("recognition_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  confidence: real("confidence").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  success: boolean("success").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastSeen: true,
});

export const insertRecognitionLogSchema = createInsertSchema(recognitionLogs).omit({
  id: true,
  timestamp: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertRecognitionLog = z.infer<typeof insertRecognitionLogSchema>;
export type RecognitionLog = typeof recognitionLogs.$inferSelect;
