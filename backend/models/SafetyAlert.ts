import mongoose, { Schema, Document } from "mongoose";

export interface ISafetyAlert {
  id: string;
  issueId: string;
  lat: number;
  lng: number;
  alertRadius: number; // in meters (100-300m)
  riskScore: number; // 0-100
  status: "active" | "read" | "mitigated";
  createdAt: string;
}

export interface ISafetyAlertDocument extends Omit<ISafetyAlert, "id">, Document {
  id: string;
}

const SafetyAlertSchema = new Schema<ISafetyAlertDocument>({
  id: { type: String, required: true, unique: true, index: true },
  issueId: { type: String, required: true, index: true },
  lat: { type: Number, required: true, min: -90, max: 90 },
  lng: { type: Number, required: true, min: -180, max: 180 },
  alertRadius: { type: Number, required: true, min: 50, max: 500, default: 200 },
  riskScore: { type: Number, required: true, min: 0, max: 100, default: 50 },
  status: { 
    type: String, 
    required: true,
    enum: ["active", "read", "mitigated"],
    default: "active"
  },
  createdAt: { type: String, required: true }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret.id || ret._id?.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

export const SafetyAlertModel = (mongoose.models.SafetyAlert || mongoose.model<ISafetyAlertDocument>("SafetyAlert", SafetyAlertSchema)) as mongoose.Model<ISafetyAlertDocument>;
