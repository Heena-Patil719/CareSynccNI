import "dotenv/config";
import express from "express";
import cors from "cors";
import grokRoute from "./routes/grok";
import { connectToMongo } from "./lib/mongo";

// ROUTES
import { handleDemo } from "./routes/demo.js";
import { handleSearchCodes, handleGetCodeByNameste } from "./routes/codes.js";
import {
  handleCreatePatient,
  handleDeletePatient,
  handleGetPatient,
  handleListPatients,
  handleUpdatePatient,
  handleGetHealthUpdates,
  handleAddHealthUpdate,
} from "./routes/patients.js";
import authRouter from "./routes/auth";
import chatRoute from "./routes/chat";
import codemapRouter from "./routes/codemap";
import mongoAuthRouter from "./routes/mongoAuth";
import agentRouter from "./routes/agent";
import alertsRouter from "./routes/alerts";

export function createServer() {
  const app = express();

  connectToMongo().catch((error) => {
    console.error("MongoDB connection error:", error);
  });

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API health check
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "pong";
    res.json({ message: ping });
  });

  // EXISTING ROUTES
  app.get("/api/demo", handleDemo);
  app.get("/api/codes/search", handleSearchCodes);
  app.get("/api/codes/:code", handleGetCodeByNameste);

  app.use("/api/auth", authRouter);
  app.use("/api/mongo-auth", mongoAuthRouter);
  app.use("/api/agent", agentRouter);
  app.use("/api/chat", chatRoute);
  app.use("/api/grok", grokRoute);
  app.use("/api/gemini", grokRoute);
  app.use("/api/codemap", codemapRouter);
  app.use("/api/alerts", alertsRouter);

  // PATIENT ROUTES
  app.post("/api/patients", handleCreatePatient);
  app.get("/api/patients", handleListPatients);
  app.get("/api/patients/:patientId", handleGetPatient);
  app.patch("/api/patients/:patientId", handleUpdatePatient);
  app.delete("/api/patients/:patientId", handleDeletePatient);
  app.get("/api/patients/:patientId/health-updates", handleGetHealthUpdates);
  app.post("/api/patients/:patientId/health-updates", handleAddHealthUpdate);
  

  // OPENAI CHATBOT ROUTE

  return app; // important to return without starting actual server
}
