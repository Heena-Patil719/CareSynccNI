import { connectToMongo } from "../lib/mongo";
import AlertModel, { type Alert, type AlertSeverity } from "../models/Alert";

export type VitalsInput = {
  bloodPressure?: number;
  heartRate?: number;
  temperature?: number;
  patientName: string;
};

export function checkBloodPressure(value: number): AlertSeverity {
  if (value > 180) {
    return "CRITICAL";
  }

  if (value > 140) {
    return "HIGH";
  }

  if (value < 90) {
    return "LOW";
  }

  return "NORMAL";
}

export function checkHeartRate(value: number): AlertSeverity {
  if (value > 150 || value < 40) {
    return "CRITICAL";
  }

  if (value > 100) {
    return "HIGH";
  }

  if (value < 60) {
    return "LOW";
  }

  return "NORMAL";
}

export function checkTemperature(value: number): AlertSeverity {
  if (value > 40.5 || value < 35) {
    return "CRITICAL";
  }

  if (value > 38.5) {
    return "HIGH";
  }

  if (value < 36) {
    return "LOW";
  }

  return "NORMAL";
}

export async function runVitalsAlertAgent(
  patientId: string,
  vitals: VitalsInput,
): Promise<Alert[]> {
  await connectToMongo();

  const savedAlerts: Alert[] = [];

  if (typeof vitals.bloodPressure === "number") {
    const severity = checkBloodPressure(vitals.bloodPressure);

    if (severity !== "NORMAL") {
      const savedAlert = await AlertModel.create({
        patientId,
        patientName: vitals.patientName,
        type: "BLOOD_PRESSURE",
        severity,
        value: vitals.bloodPressure,
        unit: "mmHg",
        message: buildBloodPressureMessage(severity, vitals.bloodPressure),
        acknowledged: false,
        triggeredAt: new Date(),
      });

      savedAlerts.push(savedAlert.toObject());
    }
  }

  if (typeof vitals.heartRate === "number") {
    const severity = checkHeartRate(vitals.heartRate);

    if (severity !== "NORMAL") {
      const savedAlert = await AlertModel.create({
        patientId,
        patientName: vitals.patientName,
        type: "HEART_RATE",
        severity,
        value: vitals.heartRate,
        unit: "bpm",
        message: buildHeartRateMessage(severity, vitals.heartRate),
        acknowledged: false,
        triggeredAt: new Date(),
      });

      savedAlerts.push(savedAlert.toObject());
    }
  }

  if (typeof vitals.temperature === "number") {
    const severity = checkTemperature(vitals.temperature);

    if (severity !== "NORMAL") {
      const savedAlert = await AlertModel.create({
        patientId,
        patientName: vitals.patientName,
        type: "TEMPERATURE",
        severity,
        value: vitals.temperature,
        unit: "\u00B0C",
        message: buildTemperatureMessage(severity, vitals.temperature),
        acknowledged: false,
        triggeredAt: new Date(),
      });

      savedAlerts.push(savedAlert.toObject());
    }
  }

  return savedAlerts;
}

function buildBloodPressureMessage(severity: AlertSeverity, value: number) {
  if (severity === "CRITICAL") {
    return `Blood pressure critically high at ${value} mmHg`;
  }

  if (severity === "HIGH") {
    return `Blood pressure high at ${value} mmHg`;
  }

  return `Blood pressure low at ${value} mmHg`;
}

function buildHeartRateMessage(severity: AlertSeverity, value: number) {
  if (severity === "CRITICAL" && value > 150) {
    return `Heart rate critically high at ${value} bpm`;
  }

  if (severity === "CRITICAL") {
    return `Heart rate critically low at ${value} bpm`;
  }

  if (severity === "HIGH") {
    return `Heart rate high at ${value} bpm`;
  }

  return `Heart rate low at ${value} bpm`;
}

function buildTemperatureMessage(severity: AlertSeverity, value: number) {
  if (severity === "CRITICAL" && value > 40.5) {
    return `Temperature critically high at ${value} \u00B0C`;
  }

  if (severity === "CRITICAL") {
    return `Temperature critically low at ${value} \u00B0C`;
  }

  if (severity === "HIGH") {
    return `Temperature high at ${value} \u00B0C`;
  }

  return `Temperature low at ${value} \u00B0C`;
}
