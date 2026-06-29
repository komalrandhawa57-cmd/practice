export type IssueCategory = 'pothole' | 'sanitation' | 'streetlight' | 'water_leak' | 'traffic' | 'other';

export type IssueUrgency = 'low' | 'medium' | 'high' | 'critical';

export type IssueStatus = 'reported' | 'verified' | 'investigating' | 'scheduled' | 'resolving' | 'resolved';

export interface Comment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  createdAt: string;
  evidenceImage?: string | null;
  userLvl?: number;
}

export interface AgentState {
  status: 'idle' | 'processing' | 'completed' | 'failed';
  confidence: number;
  result: string;
  task: string;
  logs: string[];
}

export interface MultiAgentOutputs {
  visionAi: AgentState;
  geoAi: AgentState;
  duplicateAi: AgentState;
  priorityAi: AgentState;
  budgetAi: AgentState;
  routingAi: AgentState;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  urgency: IssueUrgency;
  status: IssueStatus;
  location: {
    lat: number;
    lng: number;
    address: string;
    zone: string;
  };
  reporter: {
    name: string;
    avatar: string;
    xp: number;
    level: number;
  };
  votes: number;
  votedUserIds: string[];
  verifiedUserIds: string[];
  comments: Comment[];
  evidenceCount: number;
  department: string;
  assignedOfficer: string | null;
  repairCost: number;
  repairDuration: string;
  aiConfidence: number;
  aiReasoning: string;
  createdAt: string;
  image: string; // url or base64
  isAnonymous: boolean;
  multiAgentOutputs?: MultiAgentOutputs;
}

export interface Prediction {
  id: string;
  title: string;
  category: IssueCategory;
  zone: string;
  riskScore: number; // 0-100
  predictedDate: string;
  reasoning: string;
  preventativeAction: string;
  status: 'mitigated' | 'pending' | 'monitoring';
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlockedAt?: string;
  color: string;
}

export interface UserProfile {
  name: string;
  avatar: string;
  xp: number;
  level: number;
  rank: number;
  weeklyContribution: number;
  badges: Badge[];
}

export interface CityHealthStats {
  score: number;
  change: number;
  activeIssues: number;
  resolvedThisMonth: number;
  avgResolutionDays: number;
  totalContributors: number;
  emergencyAlert: string | null;
}
