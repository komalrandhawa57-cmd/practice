import mongoose, { Schema, Document } from "mongoose";
import { Issue, Comment, MultiAgentOutputs } from "../../src/types";

export interface IIssueDocument extends Omit<Issue, "id">, Document {
  id: string; // Keep custom string id
  severity?: string;
  location: {
    lat: number;
    lng: number;
    address: string;
    zone: string;
    geoJSON?: {
      type: string;
      coordinates: number[];
    };
  };
}

const CommentSchema = new Schema<Comment>({
  id: { type: String, required: true },
  author: { type: String, required: true, trim: true },
  avatar: { type: String, required: true },
  text: { type: String, required: true, trim: true },
  createdAt: { type: String, required: true },
  evidenceImage: { type: String, default: null },
  userLvl: { type: Number, default: 1, min: 1 }
}, { _id: false });

const IssueSchema = new Schema<IIssueDocument>({
  id: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true, trim: true, minlength: 3, maxlength: 100 },
  description: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
  category: { 
    type: String, 
    required: true,
    enum: ['pothole', 'sanitation', 'streetlight', 'water_leak', 'traffic', 'other'] 
  },
  urgency: { 
    type: String, 
    required: true,
    enum: ['low', 'medium', 'high', 'critical'] 
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical']
  },
  status: { 
    type: String, 
    required: true,
    enum: ['reported', 'verified', 'investigating', 'scheduled', 'resolving', 'resolved'] 
  },
  location: {
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 },
    address: { type: String, required: true, trim: true },
    zone: { type: String, required: true, trim: true },
    geoJSON: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number] } // [longitude, latitude]
    }
  },
  reporter: {
    name: { type: String, required: true, trim: true },
    avatar: { type: String, required: true },
    xp: { type: Number, default: 0, min: 0 },
    level: { type: Number, default: 1, min: 1 }
  },
  votes: { type: Number, default: 0, min: 0 },
  votedUserIds: [{ type: String }],
  verifiedUserIds: [{ type: String }],
  comments: [CommentSchema],
  evidenceCount: { type: Number, default: 0, min: 0 },
  department: { type: String, required: true, trim: true },
  assignedOfficer: { type: String, default: null, trim: true },
  repairCost: { type: Number, default: 0, min: 0 },
  repairDuration: { type: String, default: "24 hours", trim: true },
  aiConfidence: { type: Number, default: 0.85, min: 0, max: 1 },
  aiReasoning: { type: String, default: "", trim: true },
  createdAt: { type: String, required: true },
  image: { type: String, required: true },
  isAnonymous: { type: Boolean, default: false },
  multiAgentOutputs: { type: Schema.Types.Mixed, default: {} }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      // Return custom id instead of _id
      ret.id = ret.id || ret._id?.toString();
      if (ret.location && ret.location.geoJSON) {
        delete ret.location.geoJSON;
      }
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Configure Geospatial indexing on the geoJSON coordinates
IssueSchema.index({ "location.geoJSON": "2dsphere" });

// Pre-save hook to populate geoJSON coordinates and synchronize severity/urgency
IssueSchema.pre("save", function (this: IIssueDocument) {
  if (this.location && typeof this.location.lng === "number" && typeof this.location.lat === "number") {
    this.location.geoJSON = {
      type: "Point",
      coordinates: [this.location.lng, this.location.lat]
    };
  }
  if (!this.severity && this.urgency) {
    this.severity = this.urgency;
  }
});

// Create Mongoose Model or reuse if already compiled
export const IssueModel = (mongoose.models.Issue || mongoose.model<IIssueDocument>("Issue", IssueSchema)) as mongoose.Model<IIssueDocument>;
