import { Request, Response } from "express";
import { IssueModel } from "../models/Issue";
import { getDBStatus } from "../config/db";
import { Issue, IssueCategory, IssueUrgency } from "../../src/types";

// This will reference the in-memory/Firestore sync arrays and helper functions
// so we can operate both systems concurrently with maximum reliability.
let memoryIssuesRef: Issue[] = [];
let saveToFirestoreRef: ((issue: Issue) => Promise<void>) | null = null;

export function setIssueControllerSync(issues: Issue[], saveToFirestore: (issue: Issue) => Promise<void>) {
  memoryIssuesRef = issues;
  saveToFirestoreRef = saveToFirestore;
}

export const getIssues = async (req: Request, res: Response) => {
  const { isConnected } = getDBStatus();
  
  if (isConnected) {
    try {
      const dbIssues = await IssueModel.find().sort({ createdAt: -1 });
      if (dbIssues.length > 0) {
        // Map to plain objects and sync back to local memory if needed
        const list = dbIssues.map(doc => doc.toJSON() as Issue);
        // Sync local in-memory list
        memoryIssuesRef.length = 0;
        memoryIssuesRef.push(...list);
        return res.json(list);
      } else {
        console.log("MongoDB is connected but empty. Seeding MongoDB with initial datasets...");
        // Seed MongoDB from local memory / Firestore
        for (const item of memoryIssuesRef) {
          const mDoc = new IssueModel(item);
          await mDoc.save();
        }
        return res.json(memoryIssuesRef);
      }
    } catch (err) {
      console.error("Error reading from MongoDB, falling back to cache/Firestore:", err);
    }
  }

  // Fallback to local memory / Firestore sync
  res.json(memoryIssuesRef);
};

export const createIssue = async (req: Request, res: Response) => {
  const { title, description, category, urgency, location, reporter, image, isAnonymous, aiAnalysis } = req.body;

  const newIssue: Issue = {
    id: `iss-${Date.now()}`,
    title: title || "New Civic Report",
    description: description || "No description provided.",
    category: (category || "other") as IssueCategory,
    urgency: (urgency || "medium") as IssueUrgency,
    status: "reported",
    location: {
      lat: location?.lat || 28.6139 + (Math.random() - 0.5) * 0.05,
      lng: location?.lng || 77.2090 + (Math.random() - 0.5) * 0.05,
      address: location?.address || "Custom Location pinned on map",
      zone: location?.zone || "West Ward"
    },
    reporter: {
      name: isAnonymous ? "Anonymous Hero" : (reporter?.name || "Citizen Reporter"),
      avatar: isAnonymous ? "https://api.dicebear.com/7.x/pixel-art/svg?seed=Anon" : (reporter?.avatar || "https://api.dicebear.com/7.x/pixel-art/svg?seed=Citizen"),
      xp: isAnonymous ? 0 : (reporter?.xp || 100),
      level: isAnonymous ? 1 : (reporter?.level || 1)
    },
    votes: 0,
    votedUserIds: [],
    verifiedUserIds: [],
    comments: [],
    evidenceCount: image ? 1 : 0,
    department: aiAnalysis?.department || "Public Works Department (PWD)",
    assignedOfficer: null,
    repairCost: aiAnalysis?.repairCost || 15000,
    repairDuration: aiAnalysis?.repairDuration || "24 hours",
    aiConfidence: aiAnalysis?.aiConfidence || 0.85,
    aiReasoning: aiAnalysis?.aiReasoning || "Automated initial routing based on text keywords and location intelligence.",
    createdAt: new Date().toISOString(),
    image: image || "https://images.unsplash.com/photo-1594818859664-ac7c53e585d8?auto=format&fit=crop&q=80&w=800",
    isAnonymous: !!isAnonymous,
    multiAgentOutputs: aiAnalysis?.multiAgentOutputs
  };

  // Sync with local memory
  const idx = memoryIssuesRef.findIndex(i => i.id === newIssue.id);
  if (idx !== -1) {
    memoryIssuesRef[idx] = newIssue;
  } else {
    memoryIssuesRef.unshift(newIssue);
  }

  // Save to MongoDB
  const { isConnected } = getDBStatus();
  if (isConnected) {
    try {
      const mDoc = new IssueModel(newIssue);
      await mDoc.save();
      console.log(`Successfully saved issue ${newIssue.id} to MongoDB.`);
    } catch (err) {
      console.error(`Failed to save issue ${newIssue.id} to MongoDB:`, err);
    }
  }

  // Save to Firestore (fallback sync)
  if (saveToFirestoreRef) {
    try {
      await saveToFirestoreRef(newIssue);
    } catch (err) {
      console.error("Firestore sync fail during create:", err);
    }
  }

  res.status(201).json(newIssue);
};

export const voteIssue = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.body;

  let issue = memoryIssuesRef.find(i => i.id === id);

  const { isConnected } = getDBStatus();
  if (isConnected) {
    try {
      const dbDoc = await IssueModel.findOne({ id });
      if (dbDoc) {
        issue = dbDoc.toJSON() as Issue;
      }
    } catch (err) {
      console.error("Error fetching issue for vote from MongoDB:", err);
    }
  }

  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  // Perform vote toggling
  if (!issue.votedUserIds) issue.votedUserIds = [];
  
  if (issue.votedUserIds.includes(userId)) {
    issue.votedUserIds = issue.votedUserIds.filter(uid => uid !== userId);
    issue.votes = Math.max(0, issue.votes - 1);
  } else {
    issue.votedUserIds.push(userId);
    issue.votes += 1;
  }

  // Update in MongoDB
  if (isConnected) {
    try {
      await IssueModel.findOneAndUpdate({ id }, { 
        votedUserIds: issue.votedUserIds, 
        votes: issue.votes 
      }, { new: true });
    } catch (err) {
      console.error("Failed to update vote in MongoDB:", err);
    }
  }

  // Sync memory cache
  const idx = memoryIssuesRef.findIndex(i => i.id === id);
  if (idx !== -1) {
    memoryIssuesRef[idx] = issue;
  }

  // Sync to Firestore
  if (saveToFirestoreRef) {
    await saveToFirestoreRef(issue);
  }

  res.json(issue);
};

export const verifyIssue = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.body;

  let issue = memoryIssuesRef.find(i => i.id === id);

  const { isConnected } = getDBStatus();
  if (isConnected) {
    try {
      const dbDoc = await IssueModel.findOne({ id });
      if (dbDoc) {
        issue = dbDoc.toJSON() as Issue;
      }
    } catch (err) {
      console.error("Error fetching issue for verification from MongoDB:", err);
    }
  }

  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  if (!issue.verifiedUserIds) issue.verifiedUserIds = [];

  if (!issue.verifiedUserIds.includes(userId)) {
    issue.verifiedUserIds.push(userId);
    if (issue.verifiedUserIds.length >= 2) {
      issue.status = "verified";
    }
  }

  // Update in MongoDB
  if (isConnected) {
    try {
      await IssueModel.findOneAndUpdate({ id }, { 
        verifiedUserIds: issue.verifiedUserIds, 
        status: issue.status 
      }, { new: true });
    } catch (err) {
      console.error("Failed to update verification in MongoDB:", err);
    }
  }

  // Sync memory cache
  const idx = memoryIssuesRef.findIndex(i => i.id === id);
  if (idx !== -1) {
    memoryIssuesRef[idx] = issue;
  }

  // Sync to Firestore
  if (saveToFirestoreRef) {
    await saveToFirestoreRef(issue);
  }

  res.json(issue);
};

export const addComment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { author, avatar, text, userLvl, evidenceImage } = req.body;

  let issue = memoryIssuesRef.find(i => i.id === id);

  const { isConnected } = getDBStatus();
  if (isConnected) {
    try {
      const dbDoc = await IssueModel.findOne({ id });
      if (dbDoc) {
        issue = dbDoc.toJSON() as Issue;
      }
    } catch (err) {
      console.error("Error fetching issue for comment from MongoDB:", err);
    }
  }

  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  const newComment = {
    id: `c-${Date.now()}`,
    author: author || "Civic Champion",
    avatar: avatar || "https://api.dicebear.com/7.x/pixel-art/svg?seed=Champ",
    text: text || "",
    createdAt: new Date().toISOString(),
    userLvl: userLvl || 1,
    evidenceImage: evidenceImage || null
  };

  if (!issue.comments) issue.comments = [];
  issue.comments.push(newComment);
  
  if (evidenceImage) {
    issue.evidenceCount = (issue.evidenceCount || 0) + 1;
  }

  // Update in MongoDB
  if (isConnected) {
    try {
      await IssueModel.findOneAndUpdate({ id }, { 
        comments: issue.comments, 
        evidenceCount: issue.evidenceCount 
      });
    } catch (err) {
      console.error("Failed to update comment in MongoDB:", err);
    }
  }

  // Sync memory cache
  const idx = memoryIssuesRef.findIndex(i => i.id === id);
  if (idx !== -1) {
    memoryIssuesRef[idx] = issue;
  }

  // Sync to Firestore
  if (saveToFirestoreRef) {
    await saveToFirestoreRef(issue);
  }

  res.json(issue);
};

export const updateIssueStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, assignedOfficer, department, repairCost, repairDuration } = req.body;

  let issue = memoryIssuesRef.find(i => i.id === id);

  const { isConnected } = getDBStatus();
  if (isConnected) {
    try {
      const dbDoc = await IssueModel.findOne({ id });
      if (dbDoc) {
        issue = dbDoc.toJSON() as Issue;
      }
    } catch (err) {
      console.error("Error fetching issue for status update from MongoDB:", err);
    }
  }

  if (!issue) {
    return res.status(404).json({ error: "Issue not found" });
  }

  if (status !== undefined) issue.status = status;
  if (assignedOfficer !== undefined) issue.assignedOfficer = assignedOfficer;
  if (department !== undefined) issue.department = department;
  if (repairCost !== undefined) issue.repairCost = repairCost;
  if (repairDuration !== undefined) issue.repairDuration = repairDuration;

  // Update in MongoDB
  if (isConnected) {
    try {
      await IssueModel.findOneAndUpdate({ id }, { 
        status: issue.status,
        assignedOfficer: issue.assignedOfficer,
        department: issue.department,
        repairCost: issue.repairCost,
        repairDuration: issue.repairDuration
      });
    } catch (err) {
      console.error("Failed to update status in MongoDB:", err);
    }
  }

  // Sync memory cache
  const idx = memoryIssuesRef.findIndex(i => i.id === id);
  if (idx !== -1) {
    memoryIssuesRef[idx] = issue;
  }

  // Sync to Firestore
  if (saveToFirestoreRef) {
    await saveToFirestoreRef(issue);
  }

  res.json(issue);
};
