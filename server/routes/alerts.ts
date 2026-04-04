import { Router } from "express";

import { connectToMongo } from "../lib/mongo";
import AlertModel from "../models/Alert";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    await connectToMongo();

    const alerts = await AlertModel.find({ acknowledged: false })
      .sort({ triggeredAt: -1 })
      .lean();

    res.json({ alerts });
  } catch (error) {
    console.error("LIST ALERTS ERROR:", error);
    res.status(500).json({ error: "Failed to load alerts" });
  }
});

router.get("/patient/:patientId", async (req, res) => {
  try {
    await connectToMongo();

    const alerts = await AlertModel.find({ patientId: req.params.patientId })
      .sort({ triggeredAt: -1 })
      .lean();

    res.json({ alerts });
  } catch (error) {
    console.error("PATIENT ALERTS ERROR:", error);
    res.status(500).json({ error: "Failed to load patient alerts" });
  }
});

router.patch("/:alertId/acknowledge", async (req, res) => {
  try {
    await connectToMongo();

    const alert = await AlertModel.findByIdAndUpdate(
      req.params.alertId,
      { acknowledged: true },
      { new: true },
    ).lean();

    if (!alert) {
      res.status(404).json({ error: "Alert not found" });
      return;
    }

    res.json({ alert });
  } catch (error) {
    console.error("ACKNOWLEDGE ALERT ERROR:", error);
    res.status(500).json({ error: "Failed to acknowledge alert" });
  }
});

export default router;
