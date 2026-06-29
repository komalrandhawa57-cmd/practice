import mongoose, { Schema, Document } from "mongoose";
import { Prediction } from "../../src/types";

export interface IPredictionDocument extends Omit<Prediction, "id">, Document {
  id: string; // Keep custom string id
}

const PredictionSchema = new Schema<IPredictionDocument>({
  id: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['pothole', 'sanitation', 'streetlight', 'water_leak', 'traffic', 'other']
  },
  zone: { type: String, required: true },
  riskScore: { type: Number, required: true, min: 0, max: 100 },
  predictedDate: { type: String, required: true },
  reasoning: { type: String, required: true },
  preventativeAction: { type: String, required: true },
  status: { 
    type: String, 
    required: true,
    enum: ['mitigated', 'pending', 'monitoring']
  }
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

export const PredictionModel = (mongoose.models.Prediction || mongoose.model<IPredictionDocument>("Prediction", PredictionSchema)) as mongoose.Model<IPredictionDocument>;
