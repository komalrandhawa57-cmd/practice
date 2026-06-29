import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { initializeFirestore, collection, doc, getDocs, setDoc, setLogLevel } from "firebase/firestore";

setLogLevel("error");

dotenv.config();

// Shared types imported or declared
import { Issue, IssueCategory, IssueUrgency, IssueStatus, Comment, Prediction, CityHealthStats, MultiAgentOutputs } from "./src/types";

// MongoDB Backend Configuration
import { connectDB } from "./backend/config/db";
import { setIssueControllerSync } from "./backend/controllers/issueController";
import { setPredictionControllerSync, saveMultiplePredictions } from "./backend/controllers/predictionController";
import issueRoutes from "./backend/routes/issueRoutes";
import predictionRoutes from "./backend/routes/predictionRoutes";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// In-Memory Database
const initialIssues: Issue[] = [
  {
    id: "iss-001",
    title: "Large Crater-Sized Pothole on Sector 17 Main Road",
    description: "A huge pothole has formed in the middle of the busy transit lane, causing vehicles to swerve erratically into the adjacent lane. Several two-wheeler near-misses have been observed, and it has already caused tire and alloy damage to multiple commuter cars and auto-rickshaws.",
    category: "pothole",
    urgency: "critical",
    status: "scheduled",
    location: {
      lat: 28.6304,
      lng: 77.2177,
      address: "Sector 17 Main Road, Near Metro Station Gate 2",
      zone: "West Ward"
    },
    reporter: {
      name: "Amit Sharma",
      avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Amit",
      xp: 450,
      level: 4
    },
    votes: 38,
    votedUserIds: ["usr-99", "usr-100"],
    verifiedUserIds: ["usr-auth-1", "usr-auth-2", "usr-auth-3"],
    comments: [
      {
        id: "com-101",
        author: "Chief Eng. Rajesh Yadav",
        avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Rajesh",
        text: "PWD maintenance crew has been dispatched to survey the subsurface layer. Structural reinforcement scheduled for Monday night.",
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        userLvl: 8
      },
      {
        id: "com-102",
        author: "Rohan Das",
        avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Rohan",
        text: "My scooter front tyre slipped here yesterday! Extremely dangerous during waterlogging. Glad this is scheduled.",
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
        userLvl: 2
      }
    ],
    evidenceCount: 3,
    department: "Public Works Department (PWD)",
    assignedOfficer: "Officer Vivek Sharma",
    repairCost: 12500,
    repairDuration: "12 hours",
    aiConfidence: 0.96,
    aiReasoning: "High-resolution image confirms deep structural breakdown of surface asphalt with exposed aggregate base. Urgency set to CRITICAL due to bus lane obstruction and extreme danger to non-motorized traffic and two-wheelers.",
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    image: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800",
    isAnonymous: false,
    multiAgentOutputs: {
      visionAi: {
        status: "completed",
        confidence: 0.98,
        task: "Image analysis and item labeling",
        result: "Detected category: Pothole / Road damage. Segmented hazard area of 1.4m diameter. Depth estimated at 12cm. Safety risks: two-wheelers, auto-rickshaws, vehicular structural damage.",
        logs: ["[VisionAI] Initialized image segmentation", "[VisionAI] Detected severe edge cracking", "[VisionAI] Identified exposed subgrade aggregate"]
      },
      geoAi: {
        status: "completed",
        confidence: 0.95,
        task: "Geospatial mapping and zone calculation",
        result: "Geocoded to (28.6304, 77.2177). Match verified against GIS database. Located in 'West Ward' utility district. Overlaps with bus transit lane #2.",
        logs: ["[GeoAI] Parsed EXIF coordinates", "[GeoAI] Snapped to municipal road grid", "[GeoAI] Verified overlap with bus lanes"]
      },
      duplicateAi: {
        status: "completed",
        confidence: 0.99,
        task: "Checking for active duplicate filings",
        result: "No identical reports within a 15-meter radius found in active database. Verified as an isolated core structural failure.",
        logs: ["[DuplicateAI] Scanned active database (r=50m)", "[DuplicateAI] Checked recent archived filings", "[DuplicateAI] Clean report confirmed"]
      },
      priorityAi: {
        status: "completed",
        confidence: 0.94,
        task: "Socio-economic impact and priority modeling",
        result: "Priority Factor: 9.6/10. Accelerated from HIGH to CRITICAL due to heavy traffic throughput on Sector 17 main artery, presence of active public transport lanes, and adjacent hazard to micro-mobility lanes.",
        logs: ["[PriorityAI] Pulled daily traffic indices", "[PriorityAI] Calculated municipal impact ratio", "[PriorityAI] Elevated severity due to public hazard"]
      },
      budgetAi: {
        status: "completed",
        confidence: 0.92,
        task: "Asset management & cost estimation",
        result: "Projected Repair Cost: ₹12,500. Includes emergency asphalt cold mix, 3-person repair crew for 4 hours, and traffic routing safety barricades.",
        logs: ["[BudgetAI] Fetched standard material index", "[BudgetAI] Appended labor cost estimates", "[BudgetAI] Generated structural proposal"]
      },
      routingAi: {
        status: "completed",
        confidence: 0.97,
        task: "Department routing & crew dispatching",
        result: "Routed to: Public Works Department (PWD Road Division). Dispatch ticket #PWD-9281. Proposed response timeline: < 24 Hours.",
        logs: ["[RoutingAI] Queried active dept workloads", "[RoutingAI] Checked officer availability matrix", "[RoutingAI] Dispatched automated PWD ticket"]
      }
    }
  },
  {
    id: "iss-002",
    title: "Illegal Toxic Waste & Garbage Dumping near Riverfront Reserve",
    description: "Multiple rusty industrial drums containing unknown chemical sludge and a massive pile of commercial refuse have been abandoned along the riverfront bank. A strong chemical odor is present, polluting the surrounding ecosystem.",
    category: "sanitation",
    urgency: "critical",
    status: "investigating",
    location: {
      lat: 28.5355,
      lng: 77.1994,
      address: "Yamuna Riverfront Reserve, Near Nizamuddin",
      zone: "East Riverfront Ward"
    },
    reporter: {
      name: "Priya Patel",
      avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Priya",
      xp: 820,
      level: 6
    },
    votes: 54,
    votedUserIds: [],
    verifiedUserIds: ["usr-auth-1", "usr-auth-5"],
    comments: [],
    evidenceCount: 5,
    department: "State Pollution Control Board",
    assignedOfficer: "Inspector Sunita Devi",
    repairCost: 85000,
    repairDuration: "2 days",
    aiConfidence: 0.94,
    aiReasoning: "Visual analysis identifies potential biohazard containers adjacent to designated environmental conservation zones. Urgency upgraded to CRITICAL due to imminent danger of toxic runoff polluting local floodplain water supply.",
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    image: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=800",
    isAnonymous: false,
    multiAgentOutputs: {
      visionAi: {
        status: "completed",
        confidence: 0.95,
        task: "Dumping classification & object count",
        result: "Identified 4 chemical drums and approx. 120sq ft of industrial refuse. Observed liquid overflow with high soil discoloration. Soil pH disruption predicted.",
        logs: ["[VisionAI] Scanned drum logos", "[VisionAI] Calculated hazard volume", "[VisionAI] Labeled spill boundary"]
      },
      geoAi: {
        status: "completed",
        confidence: 0.98,
        task: "Ecological overlay mapping",
        result: "Located 12 meters from 'Yamuna Riverfront Reserve' boundary. High risk zone for tidal estuary contamination. Flow vector points directly into water body.",
        logs: ["[GeoAI] Cross-referenced GIS preserve layers", "[GeoAI] Calculated gradient flow directions", "[GeoAI] Mapped nearby drainage channels"]
      },
      duplicateAi: {
        status: "completed",
        confidence: 0.97,
        task: "Cross-report search",
        result: "No existing reports. Registered as a new illegal discharge event.",
        logs: ["[DuplicateAI] Verified file fingerprints"]
      },
      priorityAi: {
        status: "completed",
        confidence: 0.96,
        task: "Hazard scoring engine",
        result: "Urgency: CRITICAL. Environmental threat multiplier: 1.8x. Immediate toxicity containment recommended.",
        logs: ["[PriorityAI] Applied biohazard threat metrics", "[PriorityAI] Analyzed nearby residential proximity"]
      },
      budgetAi: {
        status: "completed",
        confidence: 0.91,
        task: "Hazmat cleanup estimate",
        result: "Estimated cleanup cost: ₹85,000. Includes Hazmat Class-B crew dispatch, soil chemical analysis, toxic drum extraction, and biohazard transport fee.",
        logs: ["[BudgetAI] Pulled standard toxic disposal tariffs"]
      },
      routingAi: {
        status: "completed",
        confidence: 0.99,
        task: "Agency alert system",
        result: "Routed to: State Pollution Control Board & Municipal Sanitation Division. Dispatched ticket #SPCB-2310.",
        logs: ["[RoutingAI] Notified SPCB and local environmental services"]
      }
    }
  },
  {
    id: "iss-003",
    title: "Water Main Fracture with Severe Sidewalk Soil Erosion",
    description: "High-pressure water is bubbling aggressively through cracks in the sidewalk, eroding the structural soil foundation underneath. Water is streaming down the street, flooding residential basements and creating a deep sinkhole near residential blocks.",
    category: "water_leak",
    urgency: "high",
    status: "resolving",
    location: {
      lat: 28.5244,
      lng: 77.2066,
      address: "182, Saket Residential Complex Road, Ward 4",
      zone: "South Heights Ward"
    },
    reporter: {
      name: "Anonymous Citizen",
      avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Anon",
      xp: 0,
      level: 1
    },
    votes: 21,
    votedUserIds: [],
    verifiedUserIds: ["usr-auth-4"],
    comments: [
      {
        id: "com-103",
        author: "Delhi Jal Board Dispatch",
        avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Water",
        text: "Main shut-off valve team has arrived. Local sector water line isolated. Excavation underway.",
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        userLvl: 10
      }
    ],
    evidenceCount: 2,
    department: "Municipal Water Supply Board (DJB)",
    assignedOfficer: "Crew Leader Rajesh Yadav",
    repairCost: 185000,
    repairDuration: "18 hours",
    aiConfidence: 0.92,
    aiReasoning: "Acoustic and visual patterns indicate high-pressure water pipe rupture. Urgent containment required to prevent under-sidewalk structural collapse (sinkhole) and major residential foundation damage.",
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    image: "https://images.unsplash.com/photo-1542044896530-05d85be9b11a?auto=format&fit=crop&q=80&w=800",
    isAnonymous: true,
    multiAgentOutputs: {
      visionAi: {
        status: "completed",
        confidence: 0.91,
        task: "Flow rate and fracture detection",
        result: "High-volume water flow. Severe subsurface soil washing detected. Sidewalk concrete showing subsidence cracks.",
        logs: ["[VisionAI] Evaluated water turbulence", "[VisionAI] Labeled void formations"]
      },
      geoAi: {
        status: "completed",
        confidence: 0.93,
        task: "Line depth lookup",
        result: "Aligned with 12-inch cast iron trunk water line. Supply zone: South Heights Grid 4B.",
        logs: ["[GeoAI] Cross-referenced municipal infrastructure utility layout"]
      },
      duplicateAi: {
        status: "completed",
        confidence: 0.98,
        task: "Check ongoing emergency reports",
        result: "Linked with two automated digital flow pressure alarms in Water Grid 4B. Grouped as a single incident.",
        logs: ["[DuplicateAI] Connected smart-grid pressure sensor telemetry"]
      },
      priorityAi: {
        status: "completed",
        confidence: 0.92,
        task: "Utility disruption assessment",
        result: "Urgency: HIGH. Affecting potable water pressure to 140 residential housing units.",
        logs: ["[PriorityAI] Pulled localized utility routing graphs"]
      },
      budgetAi: {
        status: "completed",
        confidence: 0.89,
        task: "Material and excavation costing",
        result: "Estimated repair budget: ₹1,85,000. Includes heavy excavation equipment, pipeline bypass sleeve, sidewalk reconstruction, and structural backfill.",
        logs: ["[BudgetAI] Calculated standard digging and paving schedule costs"]
      },
      routingAi: {
        status: "completed",
        confidence: 0.96,
        task: "Emergency dispatching",
        result: "Routed to: Delhi Jal Board Emergency Mainline Repairs Unit.",
        logs: ["[RoutingAI] Triggered pager network alert to Sector 4 emergency lead"]
      }
    }
  },
  {
    id: "iss-004",
    title: "Complete Highway Streetlight Blackout Grid",
    description: "An entire stretch of Highway (about 12 heavy LED streetlight poles) is completely dark. High density truck and car traffic commuters all night, and the severe lack of visibility on this high-speed merge curve is highly dangerous.",
    category: "streetlight",
    urgency: "medium",
    status: "verified",
    location: {
      lat: 28.6439,
      lng: 77.1232,
      address: "NH-48 Corridor, Near Mahipalpur",
      zone: "South West Expressway"
    },
    reporter: {
      name: "Tariq Mahmood",
      avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Tariq",
      xp: 220,
      level: 2
    },
    votes: 18,
    votedUserIds: [],
    verifiedUserIds: ["usr-auth-2"],
    comments: [],
    evidenceCount: 1,
    department: "Municipal Electricity & Lighting Board",
    assignedOfficer: null,
    repairCost: 15000,
    repairDuration: "4 hours",
    aiConfidence: 0.89,
    aiReasoning: "Grid blackouts are frequently linked to local step-down transformer breaker trips or wiring wear. Urgency ranked as MEDIUM but requiring rapid dispatch due to highway merge speed and crash statistics on this curve.",
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    image: "https://images.unsplash.com/photo-1509023464722-18d996393ca8?auto=format&fit=crop&q=80&w=800",
    isAnonymous: false,
    multiAgentOutputs: {
      visionAi: {
        status: "completed",
        confidence: 0.88,
        task: "Ambient light assessment",
        result: "Ambient illumination drops below 0.5 lux on highway. Luminaire housings intact, indicating power supply failure rather than individual bulb damage.",
        logs: ["[VisionAI] Scanned nighttime highway feeds"]
      },
      geoAi: {
        status: "completed",
        confidence: 0.96,
        task: "Grid sector correlation",
        result: "Lights are on Substation Circuit HWY-48. Adjacent warehouse sector is drawing normal loads, isolating fault to circuit breaker HWY-48-ST.",
        logs: ["[GeoAI] Traced local electric feeder lines"]
      },
      duplicateAi: {
        status: "completed",
        confidence: 0.99,
        task: "Duplicate checking",
        result: "Identified as standalone power outage ticket.",
        logs: []
      },
      priorityAi: {
        status: "completed",
        confidence: 0.90,
        task: "Road accident statistics weight",
        result: "Rating: Medium. Accident risk multiplier 1.4x due to nighttime highway merging. Commuter volume index pulled.",
        logs: []
      },
      budgetAi: {
        status: "completed",
        confidence: 0.95,
        task: "Repair cost prediction",
        result: "Standard breaker replacement and line testing: ₹15,000. 1-person bucket truck technician for 4 hours.",
        logs: []
      },
      routingAi: {
        status: "completed",
        confidence: 0.98,
        task: "Technician assignment",
        result: "Ticket routed to Municipal Electricity Board, Grid Maintenance Team.",
        logs: []
      }
    }
  }
];

// Seeded Predictions
const initialPredictions: Prediction[] = [
  {
    id: "pred-001",
    title: "Pothole Risk Elevation - West Ward Sector 17 Corridor",
    category: "pothole",
    zone: "West Ward",
    riskScore: 89,
    predictedDate: "July 5, 2026",
    reasoning: "Subsurface water pipeline leak has saturated the soil bed. Heavy traffic from public transit and private vehicles on top of the compromised subgrade will trigger surface fracturing within 7-10 days under monsoon moisture.",
    preventativeAction: "Implement early subgrade asphalt sealing and complete structural soil compaction prior to next heavy rain cycle.",
    status: "monitoring"
  },
  {
    id: "pred-002",
    title: "Trash Accumulation Surge - Yamuna Riverfront",
    category: "sanitation",
    zone: "East Riverfront Ward",
    riskScore: 78,
    predictedDate: "July 2, 2026",
    reasoning: "Upcoming festive long weekend combined with local riverside community gathering will increase foot traffic by 340%. Current trash bin capacity in the riverfront park is insufficient to handle the load.",
    preventativeAction: "Pre-deploy 15 temporary solar-powered smart waste compactors and schedule extra sanitation cycles for the festival days.",
    status: "pending"
  },
  {
    id: "pred-003",
    title: "Streetlight Circuit Vulnerability - NH-48 Corridor",
    category: "streetlight",
    zone: "South West Expressway",
    riskScore: 65,
    predictedDate: "July 12, 2026",
    reasoning: "Projected peak summer heatwave will trigger extremely high power draw. The shared sub-station transformer is highly likely to experience thermal stress, leading to safety trips on secondary circuits.",
    preventativeAction: "Upgrade physical ventilation inside the local transformer enclosure and recalibrate relay tolerances to avoid cascading blackout events.",
    status: "pending"
  }
];

// Active databases in-memory (with fallbacks)
let issues: Issue[] = [...initialIssues];
let predictions: Prediction[] = [...initialPredictions];

// -----------------------------------------------------------------------------
// FIRESTORE DATABASE INITIALIZATION
// -----------------------------------------------------------------------------
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
let firebaseConfig: any = {};
if (fs.existsSync(configPath)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    console.log("Firebase Applet configuration loaded:", firebaseConfig.projectId);
  } catch (err) {
    console.error("Error reading firebase-applet-config.json:", err);
  }
}

const hasFirebase = !!firebaseConfig.projectId;
let db: any = null;

if (hasFirebase) {
  try {
    const firebaseApp = initializeApp(firebaseConfig);
    db = initializeFirestore(firebaseApp, {
      experimentalForceLongPolling: true,
    }, firebaseConfig.firestoreDatabaseId || "(default)");
    console.log("Firestore successfully initialized with DB ID:", firebaseConfig.firestoreDatabaseId || "(default)");
  } catch (err) {
    console.error("Failed to initialize Firestore:", err);
  }
}

// Helper functions for Database CRUD Operations
async function getIssuesFromDB(): Promise<Issue[]> {
  if (db) {
    try {
      const colRef = collection(db, "issues");
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        const list: Issue[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as Issue);
        });
        // Sort descending by createdAt
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return list;
      } else {
        console.log("Firestore 'issues' collection is empty. Seeding defaults...");
        for (const issue of initialIssues) {
          await setDoc(doc(db, "issues", issue.id), issue);
        }
        return [...initialIssues];
      }
    } catch (err) {
      console.error("Failed to fetch issues from Firestore, falling back to local memory:", err);
    }
  }
  return issues;
}

async function saveIssueToDB(issue: Issue): Promise<void> {
  const idx = issues.findIndex(i => i.id === issue.id);
  if (idx !== -1) {
    issues[idx] = issue;
  } else {
    issues.unshift(issue);
  }
  
  if (db) {
    try {
      await setDoc(doc(db, "issues", issue.id), issue);
      console.log(`Successfully saved issue ${issue.id} to Firestore.`);
    } catch (err) {
      console.error(`Failed to save issue ${issue.id} to Firestore:`, err);
    }
  }
}

async function getPredictionsFromDB(): Promise<Prediction[]> {
  if (db) {
    try {
      const colRef = collection(db, "predictions");
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        const list: Prediction[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as Prediction);
        });
        return list;
      } else {
        console.log("Firestore 'predictions' collection is empty. Seeding defaults...");
        for (const pred of initialPredictions) {
          await setDoc(doc(db, "predictions", pred.id), pred);
        }
        return [...initialPredictions];
      }
    } catch (err) {
      console.error("Failed to fetch predictions from Firestore, falling back to local memory:", err);
    }
  }
  return predictions;
}

async function savePredictionsToDB(predList: Prediction[]): Promise<void> {
  predictions = predList;
  if (db) {
    try {
      for (const pred of predList) {
        await setDoc(doc(db, "predictions", pred.id), pred);
      }
      console.log("Successfully saved all predictions to Firestore.");
    } catch (err) {
      console.error("Failed to save predictions to Firestore:", err);
    }
  }
}

async function savePredictionToDB(pred: Prediction): Promise<void> {
  const idx = predictions.findIndex(p => p.id === pred.id);
  if (idx !== -1) {
    predictions[idx] = pred;
  } else {
    predictions.push(pred);
  }

  if (db) {
    try {
      await setDoc(doc(db, "predictions", pred.id), pred);
      console.log(`Successfully saved prediction ${pred.id} to Firestore.`);
    } catch (err) {
      console.error(`Failed to save prediction ${pred.id} to Firestore:`, err);
    }
  }
}

// Lazy Initialization of Gemini AI Client
let geminiClient: GoogleGenAI | null = null;

function getGeminiAI(): GoogleGenAI | null {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      console.warn("GEMINI_API_KEY is not set or has placeholder value. Using simulated high-fidelity AI fallback operations.");
      return null;
    }
    try {
      geminiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      console.log("Gemini client successfully initialized server-side.");
    } catch (err) {
      console.error("Failed to initialize GoogleGenAI client:", err);
      return null;
    }
  }
  return geminiClient;
}

// -----------------------------------------------------------------------------
// ENDPOINTS
// -----------------------------------------------------------------------------

// Real-Time City Health Statistics
app.get("/api/city-stats", (req: Request, res: Response) => {
  const activeCount = issues.filter(i => i.status !== "resolved").length;
  const resolvedThisMonth = issues.filter(i => i.status === "resolved").length + 24; // baseline + current
  
  // Calculate average rating
  const scoreBase = 100 - (activeCount * 4);
  const finalScore = Math.max(50, Math.min(98, scoreBase));

  const stats: CityHealthStats = {
    score: parseFloat(finalScore.toFixed(1)),
    change: +1.8,
    activeIssues: activeCount,
    resolvedThisMonth: resolvedThisMonth,
    avgResolutionDays: 2.3,
    totalContributors: 142,
    emergencyAlert: issues.some(i => i.urgency === "critical" && i.status !== "resolved") 
      ? "Environmental and critical structural hazards detected. Active response crews deployed."
      : null
  };
  res.json(stats);
});

// Mount Backend Routes
app.use("/api/issues", issueRoutes);
app.use("/api/predictions", predictionRoutes);
import { mitigatePrediction } from "./backend/controllers/predictionController";
app.post("/api/mitigate-prediction", mitigatePrediction);


// Helper for high-fidelity mock fallback responses when Gemini key is missing
function generateSimulatedAIAnalysis(title: string, description: string, categoryInput?: string): any {
  const cat = categoryInput || (description.toLowerCase().includes("pothole") || title.toLowerCase().includes("pothole") ? "pothole" :
               description.toLowerCase().includes("garbage") || description.toLowerCase().includes("trash") ? "sanitation" :
               description.toLowerCase().includes("light") || description.toLowerCase().includes("dark") ? "streetlight" :
               description.toLowerCase().includes("water") || description.toLowerCase().includes("leak") ? "water_leak" :
               description.toLowerCase().includes("traffic") || description.toLowerCase().includes("accident") ? "traffic" : "other");

  let department = "Public Works Department (PWD)";
  let cost = 12000;
  let duration = "24 hours";
  let urgency = "medium";
  
  if (cat === "pothole") {
    department = "Public Works Department (PWD)";
    cost = 12500;
    duration = "8 hours";
    urgency = "medium";
  } else if (cat === "sanitation") {
    department = "Municipal Corporation Sanitation Dept";
    cost = 6500;
    duration = "12 hours";
    urgency = "low";
  } else if (cat === "streetlight") {
    department = "Municipal Electricity & Lighting Board";
    cost = 4500;
    duration = "4 hours";
    urgency = "medium";
  } else if (cat === "water_leak") {
    department = "Municipal Water Supply Board (DJB)";
    cost = 45000;
    duration = "16 hours";
    urgency = "high";
  } else if (cat === "traffic") {
    department = "Traffic Control Division";
    cost = 15000;
    duration = "6 hours";
    urgency = "high";
  }

  if (description.toLowerCase().includes("urgent") || description.toLowerCase().includes("danger") || description.toLowerCase().includes("severe")) {
    urgency = "critical";
    cost = Math.round(cost * 1.5);
  }

  const confidence = 0.85 + Math.random() * 0.12;

  return {
    category: cat,
    urgency: urgency,
    department: department,
    repairCost: cost,
    repairDuration: duration,
    aiConfidence: parseFloat(confidence.toFixed(2)),
    aiReasoning: `Simulated Multi-Agent consensus verifies that the reported hazard '${title}' requires attention by the ${department}. The estimated repair scope matches standard Indian Municipal Corporation standards. Safety risk was evaluated.`,
    multiAgentOutputs: {
      visionAi: {
        status: "completed",
        confidence: parseFloat((confidence + 0.02).toFixed(2)),
        task: "Image analysis & structural grading",
        result: `Successfully labeled '${cat}' pattern in reported materials. Surface erosion index matches standard grading scale. No immediate adjacent structural collapses found.`,
        logs: ["[VisionAI] Loaded report evidence structure", "[VisionAI] Detected semantic edges for category: " + cat, "[VisionAI] Labeled damage clusters"]
      },
      geoAi: {
        status: "completed",
        confidence: 0.95,
        task: "Municipality location cross-indexing",
        result: "Snapping coordinates to closest public infrastructure zone. Ward utility alignment confirmed.",
        logs: ["[GeoAI] Checked postal boundaries", "[GeoAI] Snapped to municipal utility map"]
      },
      duplicateAi: {
        status: "completed",
        confidence: 0.99,
        task: "Checking for similar active filings",
        result: "No near duplicates matched within 100 meters. Registered as a unique filing.",
        logs: ["[DuplicateAI] Scanned active incident registry in zone", "[DuplicateAI] Cleared unique validation threshold"]
      },
      priorityAi: {
        status: "completed",
        confidence: parseFloat((confidence - 0.01).toFixed(2)),
        task: "Socio-demographic priority weight evaluation",
        result: `Urgency confirmed as ${urgency.toUpperCase()}. Priority index evaluated based on public feedback speed and residential hazard level.`,
        logs: ["[PriorityAI] Evaluated public traffic factors", "[PriorityAI] Calculated urgency safety scale"]
      },
      budgetAi: {
        status: "completed",
        confidence: 0.90,
        task: "Municipal labor & cost estimation",
        result: `Projected repairs scheduled for ₹${cost.toLocaleString('en-IN')}. Standard resource bundle includes rapid dispatch kit.`,
        logs: ["[BudgetAI] Appended material tariffs", "[BudgetAI] Forecasted labor overhead"]
      },
      routingAi: {
        status: "completed",
        confidence: 0.97,
        task: "Public administration routing",
        result: `Assigned automatically to ${department}. Automated service request registered successfully.`,
        logs: ["[RoutingAI] Selected optimal department", "[RoutingAI] Outlined dispatch flow map"]
      }
    }
  };
}

// -----------------------------------------------------------------------------
// GEMINI /api/gemini/analyze
// -----------------------------------------------------------------------------
app.post("/api/gemini/analyze", async (req: Request, res: Response) => {
  const { title, description, category, image } = req.body;
  const ai = getGeminiAI();

  if (!ai) {
    // Handle missing keys gracefully by returning high-fidelity simulation
    const simulated = generateSimulatedAIAnalysis(title, description, category);
    return res.json(simulated);
  }

  try {
    // We build a system prompt requesting Gemini to return a structured JSON
    const systemPrompt = `
      You are an expert Smart City Multi-Agent AI system routing civic reports for the 'CivicFix AI' municipal platform in India.
      Analyze the citizen's reported issue title: "${title}" and description: "${description}".
      
      You must perform the roles of 6 distinct AI Agents collaborating on this report:
      1. Vision AI: Analyze physical damage and classify issues.
      2. Geo AI: Cross-reference utility zoning and location hazards.
      3. Duplicate Detection AI: Check for duplicate filings (we will assume it is unique but write smart logs).
      4. Priority Prediction AI: Predict urgency (low, medium, high, critical) and impact.
      5. Budget Estimation AI: Calculate standard repair costs in Indian Rupees (INR) (between ₹3,000 and ₹5,00,000) and duration (e.g. "4 hours", "2 days").
      6. Government Routing AI: Assign to a real Indian department (e.g., "Public Works Department (PWD)", "Municipal Corporation Sanitation Dept", "Municipal Water Supply Board (DJB)", "Municipal Electricity & Lighting Board", "Traffic Control Division", "State Pollution Control Board").
 
      You MUST respond with a strictly structured JSON object matching the following TypeScript structure:
      {
        "category": "pothole" | "sanitation" | "streetlight" | "water_leak" | "traffic" | "other",
        "urgency": "low" | "medium" | "high" | "critical",
        "department": "Name of Department",
        "repairCost": number,
        "repairDuration": "string describing time",
        "aiConfidence": number (between 0.0 and 1.0),
        "aiReasoning": "Overall multi-agent consensus explanation in Indian context",
        "multiAgentOutputs": {
          "visionAi": { "status": "completed", "confidence": number, "task": "string", "result": "string", "logs": ["string", "string"] },
          "geoAi": { "status": "completed", "confidence": number, "task": "string", "result": "string", "logs": ["string", "string"] },
          "duplicateAi": { "status": "completed", "confidence": number, "task": "string", "result": "string", "logs": ["string", "string"] },
          "priorityAi": { "status": "completed", "confidence": number, "task": "string", "result": "string", "logs": ["string", "string"] },
          "budgetAi": { "status": "completed", "confidence": number, "task": "string", "result": "string", "logs": ["string", "string"] },
          "routingAi": { "status": "completed", "confidence": number, "task": "string", "result": "string", "logs": ["string", "string"] }
        }
      }
      Do NOT include any markdown block formatting (like \`\`\`json) or extra text. Return ONLY the raw JSON string.
    `;

    let contentParts: any[] = [{ text: "Analyze this civic issue report. Respond ONLY in valid JSON as requested." }];
    
    if (image && image.startsWith("data:")) {
      const commaIdx = image.indexOf(",");
      if (commaIdx !== -1) {
        const mimeType = image.substring(5, image.indexOf(";"));
        const base64Data = image.substring(commaIdx + 1);
        contentParts.push({
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        });
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contentParts,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0.3
      }
    });

    const text = response.text || "{}";
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const resultJson = JSON.parse(cleanedText);
    res.json(resultJson);
  } catch (error: any) {
    console.error("Gemini analysis call failed:", error);
    // Fall back gracefully to high fidelity simulated output so that user's flow never fails
    const simulated = generateSimulatedAIAnalysis(title, description, category);
    res.json(simulated);
  }
});

// -----------------------------------------------------------------------------
// GEMINI /api/gemini/chat
// -----------------------------------------------------------------------------
app.post("/api/gemini/chat", async (req: Request, res: Response) => {
  const { message, history } = req.body;
  const ai = getGeminiAI();

  const systemInstruction = `
    You are 'CivicFix AI Copilot', an advanced floating smart-city AI assistant designed for Indian Municipalities.
    You help citizens and local government teams collaboratively fix and manage their community issues.
    You speak clearly, helpfully, and with high professional poise. You are polite, knowledgeable, and civic-minded.
    
    Here is some context about our platform, CivicFix AI:
    - CivicFix AI uses a Multi-Agent system to automatically classify reported issues, calculate urgencies, estimate repair budgets in Indian Rupees (INR, ₹), and route them to city departments.
    - The departments involved are: Public Works Department (PWD), Municipal Corporation Sanitation Dept, Municipal Water Supply Board (DJB), Municipal Electricity & Lighting Board, Traffic Control Division, State Pollution Control Board.
    - The agents collaborating are: Vision AI (shapes/images), Geo AI (zoning/map overlay), Duplicate AI (prevents double work), Priority AI (safety risk scoring), Budget AI (costs in INR), and Government Routing AI.
    - We have a gamified Citizen Hero program where users earn XP (e.g. 50 XP per report, 20 XP for verifying, 30 XP for comments, 150 XP for volunteering) and unlock badges like 'Pothole Patrol', 'Sanitation Savior', or 'Elite Guardian'.
    - We track real-time City Health Stats, which sits currently around 88-90% with automated risk predictions.
    
    If the user asks for:
    - Status of issues, explain that they can see scheduled or active issues in the Mission Control center.
    - Government details, tell them departments (like PWD, DJB, Electricity Board) are responding within average 1.8 days.
    - How AI makes decisions, explain the agent collaboration workflow!
    
    Please keep answers structured, visual, and highly helpful.
  `;

  if (!ai) {
    // Generate a high quality mock chat reply when API key is missing
    const simulatedReplies = [
      "I'm here to help as your CivicFix AI Copilot! To get full real-time Gemini intelligence, ensure your API key is active. In the meantime, I can tell you that our active Multi-Agent system has calculated a City Health Score of 90.1% based on 4 reported issues, with our highest focus on the water leakage in West Heights. What can I clarify for you today?",
      "Excellent question. Our AI Multi-Agent system runs six distinct agents: Vision, Geo, Duplicate, Priority, Budget, and Routing. They perform consensus analysis to confirm damage level, budget estimates, and direct department tickets. Is there a specific reported issue you'd like me to explain?",
      "You earn Citizen XP by participating actively! Filing a valid issue awards 50 XP, upvoting or verifying other files awards 20 XP, and joining weekend community cleanups awards a massive 150 XP towards leveling up on our monthly Leaderboard! Would you like to review active volunteer challenges?"
    ];
    const responseText = simulatedReplies[Math.floor(Math.random() * simulatedReplies.length)];
    return res.json({ text: responseText });
  }

  try {
    // Format previous messages for chat
    const formattedHistory = (history || []).map((h: any) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }]
    }));

    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction,
        temperature: 0.7,
      },
      history: formattedHistory
    });

    const response = await chat.sendMessage({ message });
    res.json({ text: response.text });
  } catch (err: any) {
    console.error("Gemini chat failed:", err);
    res.status(500).json({ error: "Failed to communicate with AI Copilot" });
  }
});

// -----------------------------------------------------------------------------
// GEMINI /api/gemini/predictions
// -----------------------------------------------------------------------------
app.post("/api/gemini/predictions", async (req: Request, res: Response) => {
  const { currentIssues } = req.body;
  const ai = getGeminiAI();

  if (!ai) {
    // Return mock prediction data
    return res.json(predictions);
  }

  try {
    const prompt = `
      Based on the following active municipal issues in the city, generate 3 proactive hazard predictions for upcoming seasonal safety risks:
      ${JSON.stringify(currentIssues)}

      You MUST respond with a valid JSON array of predictions matching this type:
      Array<{
        "id": string (e.g. "pred-101"),
        "title": string,
        "category": "pothole" | "sanitation" | "streetlight" | "water_leak" | "traffic",
        "zone": "West Ward" | "East Riverfront Ward" | "South Heights Ward" | "South West Expressway",
        "riskScore": number (0-100),
        "predictedDate": string (e.g. "July 15, 2026"),
        "reasoning": string,
        "preventativeAction": string,
        "status": "pending"
      }>
      Do NOT write markdown formatting. Respond ONLY with the raw JSON array.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.5
      }
    });

    const text = response.text || "[]";
    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const generatedPredictions = JSON.parse(cleaned);
    
    // Update active predictions list with the fresh ones
    if (Array.isArray(generatedPredictions) && generatedPredictions.length > 0) {
      await saveMultiplePredictions(generatedPredictions);
    }

    res.json(predictions);
  } catch (error) {
    console.error("Failed to generate AI predictions:", error);
    res.json(predictions); // Fallback to current predictions list
  }
});

// -----------------------------------------------------------------------------
// VITE OR STATIC SERVING MIDDLEWARE
// -----------------------------------------------------------------------------
async function startServer() {
  // Try connecting to MongoDB first
  console.log("🔌 Initializing MongoDB connection via Mongoose...");
  const mongoConnected = await connectDB();

  // Load and initialize Firestore databases (as a baseline / fallback)
  try {
    console.log("Pre-fetching/Seeding Firestore datasets...");
    issues = await getIssuesFromDB();
    predictions = await getPredictionsFromDB();
    console.log(`Firestore database sync complete: ${issues.length} issues, ${predictions.length} predictions loaded.`);
  } catch (err) {
    console.error("Failed to initialize Firestore connection, falling back to local memory arrays:", err);
  }

  // Bind local memory caches and Firestore hooks to controllers for dual-database synchronization
  setIssueControllerSync(issues, saveIssueToDB);
  setPredictionControllerSync(predictions, savePredictionToDB, savePredictionsToDB);

  // If MongoDB is connected, load issues and predictions from MongoDB
  if (mongoConnected) {
    try {
      console.log("📥 Loading and synchronizing datasets from MongoDB...");
      // Importing issues through issues controller logic (which triggers database load/seeding)
      const mockReq = {} as any;
      const mockRes = {
        json: (data: any) => {
          console.log(`Successfully synced ${data.length || 0} records from MongoDB.`);
        }
      } as any;
      
      const { getIssues } = await import("./backend/controllers/issueController");
      const { getPredictions } = await import("./backend/controllers/predictionController");
      
      await getIssues(mockReq, mockRes);
      await getPredictions(mockReq, mockRes);
    } catch (err) {
      console.error("Failed to synchronize MongoDB with controllers on boot:", err);
    }
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CivicFix AI Full-Stack Server booted and running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
