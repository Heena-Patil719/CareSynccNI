import mongoose from "mongoose";
import type { Model } from "mongoose";

export const alertTypes = ["BLOOD_PRESSURE", "HEART_RATE", "TEMPERATURE"] as const;
export const alertSeverities = ["CRITICAL", "HIGH", "LOW", "NORMAL"] as const;

export type AlertType = (typeof alertTypes)[number];
export type AlertSeverity = (typeof alertSeverities)[number];

export interface Alert {
  patientId: string;
  patientName: string;
  type: AlertType;
  severity: AlertSeverity;
  value: number;
  unit: string;
  message: string;
  acknowledged: boolean;
  triggeredAt: Date;
}

type AlertModel = Model<Alert>;

const { Schema, model, models } = mongoose;

const alertSchema = new Schema<Alert, AlertModel>(
  {
    patientId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    patientName: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: alertTypes,
      required: true,
    },
    severity: {
      type: String,
      enum: alertSeverities,
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    acknowledged: {
      type: Boolean,
      default: false,
      required: true,
    },
    triggeredAt: {
      type: Date,
      required: true,
      default: () => new Date(),
      index: true,
    },
  },
  {
    versionKey: false,
  },
);

alertSchema.index({ patientId: 1, triggeredAt: -1 });

const AlertModel =
  (models.Alert as AlertModel | undefined) ?? model<Alert, AlertModel>("Alert", alertSchema, "alerts");

export default AlertModel;
