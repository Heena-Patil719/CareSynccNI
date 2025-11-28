import "dotenv/config";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import { handleDemo } from "./routes/demo.js";
import { handleSearchCodes, handleGetCodeByNameste } from "./routes/codes.js";
import {
  handleCreatePatient,
  handleGetPatient,
  handleListPatients,
  handleAddDiagnosis,
  handleExportPatientFHIR,
} from "./routes/patients.js";

import authRouter from "./routes/auth";
// or (if you want to rename it on import)
// import { default as authRouter } from "./routes/auth";

export function createServer() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "pong";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  app.get("/api/codes/search", handleSearchCodes);
  app.get("/api/codes/:code", handleGetCodeByNameste);

  // AUTH ROUTER
  app.use("/api/auth", authRouter);

  // PATIENT ROUTES
  app.post("/api/patients", handleCreatePatient);
  app.get("/api/patients", handleListPatients);
  app.get("/api/patients/:patientId", handleGetPatient);
  app.post("/api/patients/:patientId/diagnoses", handleAddDiagnosis);
  app.get("/api/patients/:patientId/fhir", handleExportPatientFHIR);

  return app;
}