import { Router } from "express";
import { getPredictions, mitigatePrediction } from "../controllers/predictionController";

const router = Router();

router.get("/", getPredictions);
router.post("/mitigate", mitigatePrediction);

export default router;
