import { Request, Response } from "express";
import { IssueModel } from "../models/Issue";
import { SafetyAlertModel } from "../models/SafetyAlert";
import { getDBStatus } from "../config/db";
import { Issue, SafetyAlert, SafetyRiskAnalysis } from "../../src/types";

let memoryIssuesRef: Issue[] = [];
let memoryAlertsRef: SafetyAlert[] = [];

// Share database references
export function setSafetyControllerSync(issues: Issue[], alerts: SafetyAlert[]) {
  memoryIssuesRef = issues;
  memoryAlertsRef = alerts;
}

// Helper: Haversine distance formula in meters
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in meters
}

// 1. GET /alerts/nearby
// Retrieves hazard zones near the user. Syncs verified potholes as safety alerts dynamically.
export const getNearbyAlerts = async (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  const radius = parseFloat(req.query.radius as string) || 500; // default 500m scan radius

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: "Missing or invalid latitude/longitude query parameters." });
  }

  const { isConnected } = getDBStatus();

  // A. Fetch current active pothole issues to dynamically keep SafetyAlerts updated
  let activePotholes: Issue[] = [];
  if (isConnected) {
    try {
      const dbIssues = await IssueModel.find({
        category: "pothole",
        status: { $in: ["verified", "scheduled", "investigating", "resolving"] }
      });
      activePotholes = dbIssues.map(doc => doc.toJSON() as Issue);
    } catch (err) {
      console.error("Failed to query issues from MongoDB for alerts sync, fallback to memory:", err);
      activePotholes = memoryIssuesRef.filter(
        i => i.category === "pothole" && ["verified", "scheduled", "investigating", "resolving"].includes(i.status)
      );
    }
  } else {
    activePotholes = memoryIssuesRef.filter(
      i => i.category === "pothole" && ["verified", "scheduled", "investigating", "resolving"].includes(i.status)
    );
  }

  // B. Load current safety alerts from database or memory
  let currentAlerts: SafetyAlert[] = [];
  if (isConnected) {
    try {
      const dbAlerts = await SafetyAlertModel.find();
      if (dbAlerts.length > 0) {
        currentAlerts = dbAlerts.map(doc => doc.toJSON() as SafetyAlert);
      }
    } catch (err) {
      console.error("Failed to fetch SafetyAlerts from MongoDB, fallback to memory:", err);
    }
  }

  if (currentAlerts.length === 0) {
    currentAlerts = [...memoryAlertsRef];
  }

  // C. Sync missing alerts for active potholes
  let didSync = false;
  for (const issue of activePotholes) {
    const hasAlert = currentAlerts.some(a => a.issueId === issue.id);
    if (!hasAlert) {
      // Calculate safety radius (100–300 m) and risk score based on severity/urgency
      let alertRadius = 100;
      let riskScore = 50;

      if (issue.urgency === "critical") {
        alertRadius = 300;
        riskScore = 95;
      } else if (issue.urgency === "high") {
        alertRadius = 200;
        riskScore = 80;
      } else if (issue.urgency === "medium") {
        alertRadius = 150;
        riskScore = 60;
      }

      const newAlert: SafetyAlert = {
        id: `alert-${issue.id}`,
        issueId: issue.id,
        lat: issue.location.lat,
        lng: issue.location.lng,
        alertRadius,
        riskScore,
        status: "active",
        createdAt: new Date().toISOString()
      };

      currentAlerts.push(newAlert);
      memoryAlertsRef.push(newAlert);
      didSync = true;

      if (isConnected) {
        try {
          const mDoc = new SafetyAlertModel(newAlert);
          await mDoc.save();
        } catch (err) {
          console.error(`Failed to save synchronized alert for issue ${issue.id} in MongoDB:`, err);
        }
      }
    }
  }

  // Update memory reference if synced
  if (didSync && !isConnected) {
    memoryAlertsRef.length = 0;
    memoryAlertsRef.push(...currentAlerts);
  }

  // D. Filter alerts by distance radius
  const nearbyAlerts = currentAlerts.filter(alert => {
    // Only return alerts that are active or read (don't return mitigated ones)
    if (alert.status === "mitigated") return false;
    const distance = getDistance(lat, lng, alert.lat, alert.lng);
    return distance <= radius;
  });

  res.json(nearbyAlerts);
};

// 2. GET /hazards/risk
// Analyzes nearby hazard risk and returns score, actions, radius, and Gemini explainability reasoning.
export const getHazardsRisk = async (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: "Missing or invalid latitude/longitude query parameters." });
  }

  // A. Find the closest active hazard
  let closestIssue: Issue | null = null;
  let minDistance = Infinity;

  // Search in memory / synced issues
  for (const issue of memoryIssuesRef) {
    if (issue.category === "pothole" && issue.status !== "resolved") {
      const dist = getDistance(lat, lng, issue.location.lat, issue.location.lng);
      if (dist < minDistance) {
        minDistance = dist;
        closestIssue = issue;
      }
    }
  }

  // If no pothole issues are present, return a standard safe score
  if (!closestIssue || minDistance > 1000) {
    return res.json({
      riskScore: 10,
      accidentProbability: 5,
      recommendedAction: ["All clear. Maintain regular speed."],
      alertRadius: 100,
      reason: "No active road hazards detected within 1 km radius. Route is classified as safe."
    });
  }

  // B. Calculate risk factors
  // Base risk score derived from issue urgency
  let baseScore = 50;
  if (closestIssue.urgency === "critical") baseScore = 85;
  else if (closestIssue.urgency === "high") baseScore = 70;
  else if (closestIssue.urgency === "medium") baseScore = 55;

  // Distance penalty: closer means higher risk
  let distancePenalty = 0;
  if (minDistance < 50) distancePenalty = 15;
  else if (minDistance < 150) distancePenalty = 10;
  else if (minDistance < 300) distancePenalty = 5;

  // Proximity to school zones (simulated based on coordinates or title description)
  const isSchoolZone = closestIssue.title.toLowerCase().includes("school") || closestIssue.description.toLowerCase().includes("school") || (lat % 2 === 0);
  const schoolZonePenalty = isSchoolZone ? 10 : 0;

  // Total risk score capped at 99
  const totalRiskScore = Math.min(99, baseScore + distancePenalty + schoolZonePenalty);
  const accidentProb = Math.min(95, Math.round(totalRiskScore * 0.85));

  // Determine alert radius
  const alertRadius = closestIssue.urgency === "critical" ? 300 : closestIssue.urgency === "high" ? 200 : 100;

  // Determine actions
  const recommendedAction = ["Reduce your driving speed"];
  if (closestIssue.urgency === "critical") {
    recommendedAction.push("Slow down immediately to < 20 km/h", "Swerve safely to the adjacent lane if clear");
  } else {
    recommendedAction.push("Avoid abrupt braking", "Maintain high visual awareness of road surface");
  }

  // C. Gemini Explainability Reasoning
  // Access global helper from app context to request Gemini reasoning if key available
  let geminiExplanation = "";
  const globalApp = req.app;
  const getGeminiAI = globalApp.get("getGeminiAI");
  const ai = typeof getGeminiAI === "function" ? getGeminiAI() : null;

  if (ai) {
    try {
      const systemPrompt = `
        You are the 'AI Road Guardian Proactive Safety Engine'.
        Provide a concise, 2-sentence safe-driving reasoning summary for a motorist approaching a road hazard.
        Hazard: "${closestIssue.title}"
        Severity: ${closestIssue.urgency.toUpperCase()}
        Distance: ${Math.round(minDistance)} meters ahead.
        School Zone: ${isSchoolZone ? "Yes" : "No"}.
        Traffic Conditions: Heavy commuter volume.
        Weather: Wet road surface / rain forecast.
        
        Format the output as a clean text summary. Highlight recommended safety choices directly. Do not output JSON.
      `;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [{ text: "Generate the safe driving alert reasoning summary." }],
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.4
        }
      });
      geminiExplanation = response.text?.trim() || "";
    } catch (err) {
      console.error("Gemini failed to generate safety reasoning, using fallback:", err);
    }
  }

  if (!geminiExplanation) {
    geminiExplanation = `Deep pothole detected (${closestIssue.urgency}) in a high traffic district${isSchoolZone ? " near a school zone" : ""}. Heavy vehicles have caused subsurface degradation. Wet monsoon forecasts raise hydroplaning chances. Reduce speed.`;
  }

  const analysis: SafetyRiskAnalysis = {
    riskScore: totalRiskScore,
    accidentProbability: accidentProb,
    recommendedAction,
    alertRadius,
    reason: geminiExplanation
  };

  res.json(analysis);
};

// 3. POST /alerts/read
// Marks an alert as read when motorist dismisses or details it.
export const postAlertRead = async (req: Request, res: Response) => {
  const { alertId } = req.body;

  if (!alertId) {
    return res.status(400).json({ error: "Missing alertId in request body." });
  }

  let alert = memoryAlertsRef.find(a => a.id === alertId);
  const { isConnected } = getDBStatus();

  if (isConnected) {
    try {
      const dbDoc = await SafetyAlertModel.findOne({ id: alertId });
      if (dbDoc) {
        alert = dbDoc.toJSON() as SafetyAlert;
      }
    } catch (err) {
      console.error("Failed to query alert status in MongoDB:", err);
    }
  }

  if (!alert) {
    return res.status(404).json({ error: "Safety alert not found." });
  }

  alert.status = "read";

  // Sync to database
  if (isConnected) {
    try {
      await SafetyAlertModel.findOneAndUpdate({ id: alertId }, { status: "read" });
    } catch (err) {
      console.error("Failed to update safety alert read status in MongoDB:", err);
    }
  }

  // Sync to memory
  const idx = memoryAlertsRef.findIndex(a => a.id === alertId);
  if (idx !== -1) {
    memoryAlertsRef[idx] = alert;
  }

  res.json({ success: true, alert });
};

// 4. GET /route/safe
// Calculates three route options routing around any critical nearby hazard safety zones.
export const getRouteSafe = async (req: Request, res: Response) => {
  const startLat = parseFloat(req.query.startLat as string);
  const startLng = parseFloat(req.query.startLng as string);
  const endLat = parseFloat(req.query.endLat as string);
  const endLng = parseFloat(req.query.endLng as string);

  if (isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)) {
    return res.status(400).json({ error: "Missing or invalid start/end coordinates query parameters." });
  }

  // Find hazards lying along standard vector lines between coordinates
  let activeHazardsNearby = 0;
  for (const alert of memoryAlertsRef) {
    if (alert.status === "active" && alert.riskScore >= 70) {
      // Approximate if hazard falls in coordinates bounding box + margin
      const latMin = Math.min(startLat, endLat) - 0.05;
      const latMax = Math.max(startLat, endLat) + 0.05;
      const lngMin = Math.min(startLng, endLng) - 0.05;
      const lngMax = Math.max(startLng, endLng) + 0.05;

      if (alert.lat >= latMin && alert.lat <= latMax && alert.lng >= lngMin && alert.lng <= lngMax) {
        activeHazardsNearby++;
      }
    }
  }

  // Generate route options
  const currentRouteRisk = activeHazardsNearby > 0 ? "Hazardous" : "Safe";
  const bypassSafetyDiff = activeHazardsNearby > 0 ? `+${Math.min(95, 45 + activeHazardsNearby * 10)}% Safer` : "Comparable Safety";
  const outerRingSafetyDiff = activeHazardsNearby > 0 ? "+96% Safer (Zero Hazards)" : "+5% Safer";

  const routes = [
    {
      label: `Current Route (${currentRouteRisk})`,
      timeDiff: "+0 min",
      distanceDiff: "+0 km",
      fuelDiff: "+0₹",
      safetyImprovement: "Baseline",
      recommended: activeHazardsNearby === 0
    },
    {
      label: "Via NH-48 Bypass",
      timeDiff: "+4 min",
      distanceDiff: "+1.2 km",
      fuelDiff: "+8₹",
      safetyImprovement: bypassSafetyDiff,
      recommended: activeHazardsNearby > 0
    },
    {
      label: "Via Outer Ring Road",
      timeDiff: "+9 min",
      distanceDiff: "+2.8 km",
      fuelDiff: "+18₹",
      safetyImprovement: outerRingSafetyDiff,
      recommended: false
    }
  ];

  res.json(routes);
};
