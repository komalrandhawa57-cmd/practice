import { Router } from "express";
import { 
  getNearbyAlerts, 
  getHazardsRisk, 
  postAlertRead, 
  getRouteSafe 
} from "../controllers/safetyController";

const router = Router();

router.get("/alerts/nearby", getNearbyAlerts);
router.get("/hazards/risk", getHazardsRisk);
router.post("/alerts/read", postAlertRead);
router.get("/route/safe", getRouteSafe);

export default router;
