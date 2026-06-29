import { Request, Response } from "express";
import { PredictionModel } from "../models/Prediction";
import { getDBStatus } from "../config/db";
import { Prediction } from "../../src/types";

let memoryPredictionsRef: Prediction[] = [];
let saveToFirestoreRef: ((prediction: Prediction) => Promise<void>) | null = null;
let saveAllToFirestoreRef: ((predList: Prediction[]) => Promise<void>) | null = null;

export function setPredictionControllerSync(
  predictions: Prediction[], 
  saveToFirestore: (prediction: Prediction) => Promise<void>,
  saveAllToFirestore: (predList: Prediction[]) => Promise<void>
) {
  memoryPredictionsRef = predictions;
  saveToFirestoreRef = saveToFirestore;
  saveAllToFirestoreRef = saveAllToFirestore;
}

export const getPredictions = async (req: Request, res: Response) => {
  const { isConnected } = getDBStatus();

  if (isConnected) {
    try {
      const dbPreds = await PredictionModel.find();
      if (dbPreds.length > 0) {
        const list = dbPreds.map(doc => doc.toJSON() as Prediction);
        memoryPredictionsRef.length = 0;
        memoryPredictionsRef.push(...list);
        return res.json(list);
      } else {
        console.log("MongoDB connected, seeding predictions collection...");
        for (const item of memoryPredictionsRef) {
          const mDoc = new PredictionModel(item);
          await mDoc.save();
        }
        return res.json(memoryPredictionsRef);
      }
    } catch (err) {
      console.error("Error reading predictions from MongoDB, falling back to local memory:", err);
    }
  }

  res.json(memoryPredictionsRef);
};

export const mitigatePrediction = async (req: Request, res: Response) => {
  const { id } = req.body;
  let prediction = memoryPredictionsRef.find(p => p.id === id);

  const { isConnected } = getDBStatus();
  if (isConnected) {
    try {
      const dbDoc = await PredictionModel.findOne({ id });
      if (dbDoc) {
        prediction = dbDoc.toJSON() as Prediction;
      }
    } catch (err) {
      console.error("Error fetching prediction to mitigate from MongoDB:", err);
    }
  }

  if (!prediction) {
    return res.status(404).json({ error: "Prediction not found" });
  }

  prediction.status = "mitigated";

  // Save to MongoDB
  if (isConnected) {
    try {
      await PredictionModel.findOneAndUpdate({ id }, { status: "mitigated" });
    } catch (err) {
      console.error("Failed to update prediction status in MongoDB:", err);
    }
  }

  // Sync memory cache
  const idx = memoryPredictionsRef.findIndex(p => p.id === id);
  if (idx !== -1) {
    memoryPredictionsRef[idx] = prediction;
  }

  // Sync with Firestore
  if (saveToFirestoreRef) {
    await saveToFirestoreRef(prediction);
  }

  res.json(prediction);
};

export const saveMultiplePredictions = async (generatedPredictions: any[]) => {
  if (Array.isArray(generatedPredictions) && generatedPredictions.length > 0) {
    const updatedPredictions = generatedPredictions.map((p, idx) => ({
      ...p,
      id: p.id || `pred-gen-${Date.now()}-${idx}`,
      status: p.status || "pending"
    })) as Prediction[];

    // Sync memory cache
    memoryPredictionsRef.length = 0;
    memoryPredictionsRef.push(...updatedPredictions);

    // Save to MongoDB
    const { isConnected } = getDBStatus();
    if (isConnected) {
      try {
        // Clear old predictions and save new ones
        await PredictionModel.deleteMany({});
        for (const item of updatedPredictions) {
          const mDoc = new PredictionModel(item);
          await mDoc.save();
        }
        console.log("Successfully updated predictions in MongoDB.");
      } catch (err) {
        console.error("Failed to batch save predictions to MongoDB:", err);
      }
    }

    // Sync to Firestore
    if (saveAllToFirestoreRef) {
      try {
        await saveAllToFirestoreRef(updatedPredictions);
      } catch (err) {
        console.error("Failed to batch save predictions to Firestore:", err);
      }
    }
  }
};
