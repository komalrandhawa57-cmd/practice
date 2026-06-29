import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, AlertTriangle, ArrowRight, Award, BookOpen, Bot, Brain, Briefcase, 
  CheckCircle2, ChevronRight, Clock, Coins, Compass, Database, 
  DollarSign, Download, Eye, FileText, Filter, Flame, Globe, 
  Hammer, HardHat, Heart, HelpCircle, Image as ImageIcon, Info, 
  Layers, List, Loader2, Map, MapPin, MessageSquare, Navigation, 
  Plus, Search, Send, Shield, ShieldCheck, Sparkles, Star, 
  ThumbsUp, Trophy, Upload, User, Users, Wrench 
} from 'lucide-react';
import { 
  Issue, IssueCategory, IssueUrgency, IssueStatus, Comment, 
  Prediction, CityHealthStats, UserProfile, Badge, MultiAgentOutputs 
} from './types';
import { CivicFlashCards } from './components/CivicFlashCards';
import { RoadGuardian } from './components/RoadGuardian';

// Pre-packaged gorgeous demo issues for quick testing
const DEMO_REPORTS = [
  {
    title: "Major road crack & asphalt crumbling",
    description: "Deep lateral asphalt fissures expanding across the secondary commuter intersection. High tire pop hazard and structural erosion.",
    category: "pothole" as IssueCategory,
    image: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Toxic medical canister waste pile",
    description: "Uncontrolled dumping of bio-canisters next to waterfront boardwalk. Immediate chemical hazard.",
    category: "sanitation" as IssueCategory,
    image: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Broken underground water main valve",
    description: "Massive subsurface water pressure bubble fracturing the sidewalks. Soil shifting and basement flooding starting.",
    category: "water_leak" as IssueCategory,
    image: "https://images.unsplash.com/photo-1542044896530-05d85be9b11a?auto=format&fit=crop&q=80&w=800"
  },
  {
    title: "Full highway lighting sector cutout",
    description: "Multiple high-density highway lanterns dark on high-speed merge lane. Heavy safety violation.",
    category: "streetlight" as IssueCategory,
    image: "https://images.unsplash.com/photo-1509023464722-18d996393ca8?auto=format&fit=crop&q=80&w=800"
  }
];

const wardCenters: Record<string, { x: number; y: number; label: string; color: string; glow: string }> = {
  "West Ward": { x: 160, y: 130, label: "West Ward", color: "#7C3AED", glow: "url(#purpleGlow)" },
  "South Heights Ward": { x: 160, y: 370, label: "South Heights", color: "#FB7185", glow: "url(#pinkGlow)" },
  "East Riverfront Ward": { x: 640, y: 200, label: "East Riverfront", color: "#22D3EE", glow: "url(#cyanGlow)" },
  "South West Expressway": { x: 750, y: 410, label: "SW Expressway", color: "#FBBF24", glow: "url(#yellowGlow)" }
};

// Interactive Perspective 3D Tilt + Cursor Spotlight glow component
const TiltCard = ({ children, className = "", id, onClick }: { children: React.ReactNode, className?: string, id?: string, onClick?: () => void }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xc = rect.width / 2;
    const yc = rect.height / 2;
    const dx = x - xc;
    const dy = y - yc;
    const rotX = (dy / yc) * -5;
    const rotY = (dx / xc) * 5;
    card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.01, 1.01, 1.01)`;
    card.style.setProperty('--x', `${x}px`);
    card.style.setProperty('--y', `${y}px`);
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`transition-all duration-300 ease-out relative overflow-hidden group ${className}`}
      id={id}
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100"
        style={{
          background: 'radial-gradient(circle 180px at var(--x, 0px) var(--y, 0px), rgba(201, 107, 44, 0.12), transparent 80%)'
        }}
      />
      {children}
    </div>
  );
};

// 3D Flip Card using pure CSS 3D transforms
const FlipCard = ({ front, back, className = "" }: { front: React.ReactNode, back: React.ReactNode, className?: string }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  return (
    <div 
      className={`perspective-container w-full cursor-pointer ${className}`}
      onClick={(e) => {
        // Only flip if not clicking a button/interactive element
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a') || target.closest('input')) return;
        setIsFlipped(!isFlipped);
      }}
    >
      <div className={`flip-card-inner relative w-full h-full ${isFlipped ? 'flip-card-inner-flipped' : ''}`}>
        <div className="flip-card-front w-full h-full">
          {front}
        </div>
        <div className="flip-card-back absolute inset-0 w-full h-full">
          {back}
        </div>
      </div>
    </div>
  );
};

// Typing Animation helper for premium AI thinking visualization
const TypingAnimation = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState("");
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, index));
      index++;
      if (index > text.length) {
        index = 1;
      }
    }, 80);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <span className="font-mono text-xs text-sand-gold">{displayedText}<span className="animate-pulse">|</span></span>
  );
};

// Command Palette (Ctrl+K) Modal
const CommandPalette = ({ isOpen, onClose, setTab, setSearch, runDemo }: { 
  isOpen: boolean; 
  onClose: () => void; 
  setTab: (tab: any) => void;
  setSearch: (q: string) => void;
  runDemo: () => void;
}) => {
  const [search, setSearchVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const commands = [
    { name: "Predict Failure / Seasonal Hazards", desc: "Open proactive hazard list on Dashboard", action: () => { setTab('dashboard'); onClose(); } },
    { name: "Emergency Command Dashboard", desc: "Open Government response center", action: () => { setTab('government'); onClose(); } },
    { name: "Live Vector City HUD Map", desc: "Launch full vector map overlay", action: () => { setTab('map'); onClose(); } },
    { name: "Explain AI Collaboration Model", desc: "Open AI Agent orchestrations", action: () => { setTab('hero'); onClose(); } },
    { name: "Run Judges' Automation Demo", desc: "Trigger 6-step end-to-end incident test", action: () => { runDemo(); onClose(); } },
    { name: "View Citizen Hero Leaderboard", desc: "Check XP progress and rewards store", action: () => { setTab('leaderboard'); onClose(); } },
    { name: "Municipal Telemetry & KPIs", desc: "View environmental SLA performance", action: () => { setTab('analytics'); onClose(); } },
  ];

  const filtered = commands.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[100] flex items-start justify-center pt-24 px-4" onClick={onClose}>
      <div 
        className="bg-bg-secondary border border-card-border w-full max-w-lg rounded-3xl p-6 shadow-[0_0_50px_rgba(201,107,44,0.35)] space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <Search className="w-4 h-4 text-steel-gray absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Type a command or query..." 
            className="w-full bg-bg-base border border-card-border rounded-2xl pl-11 pr-4 py-3 text-xs text-primary-text placeholder-steel-gray focus:outline-none focus:border-copper-primary transition-all font-sans"
            value={search}
            onChange={(e) => setSearchVal(e.target.value)}
          />
          <kbd className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] bg-surface text-steel-gray px-1.5 py-0.5 rounded border border-card-border font-mono">ESC</kbd>
        </div>

        <div className="space-y-1 max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-[11px] text-steel-gray italic p-3 text-center">No matching command found.</p>
          ) : (
            filtered.map((cmd, idx) => (
              <button
                key={idx}
                onClick={cmd.action}
                className="w-full text-left p-3 rounded-xl hover:bg-surface border border-transparent hover:border-card-border transition-all flex justify-between items-center group"
              >
                <div>
                  <span className="text-xs font-bold text-primary-text block group-hover:text-copper-primary transition-colors font-display">{cmd.name}</span>
                  <span className="text-[10px] text-secondary-text">{cmd.desc}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-steel-gray group-hover:text-copper-primary transition-all transform group-hover:translate-x-1" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const normalizeZone = (zoneStr: string): string => {
  const lower = (zoneStr || "").toLowerCase();
  if (lower.includes("south heights") || lower.includes("west heights") || lower.includes("heights")) return "South Heights Ward";
  if (lower.includes("west ward") || lower.includes("downtown")) return "West Ward";
  if (lower.includes("riverfront") || lower.includes("waterfront") || lower.includes("bay")) return "East Riverfront Ward";
  if (lower.includes("expressway") || lower.includes("industrial") || lower.includes("basin")) return "South West Expressway";
  return "West Ward"; // fallback
};

export default function App() {
  // State
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<CityHealthStats>({
    score: 94.2,
    change: 1.8,
    activeIssues: 4,
    resolvedThisMonth: 1248,
    avgResolutionDays: 2.3,
    totalContributors: 142,
    emergencyAlert: null
  });
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'hero' | 'leaderboard' | 'government' | 'analytics' | 'flashcards' | 'roadguardian'>('dashboard');
  
  // Filtering states
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Report creation states
  const [reportTitle, setReportTitle] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportCategory, setReportCategory] = useState<IssueCategory>('pothole');
  const [reportUrgency, setReportUrgency] = useState<IssueUrgency>('medium');
  const [reportImage, setReportImage] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedZone, setSelectedZone] = useState('West Ward');

  // AI multi-agent reporting progress states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState<string>('');
  const [currentAgentLogs, setCurrentAgentLogs] = useState<string[]>([]);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any | null>(null);

  // User Gamification states
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "Gopika Randhawa",
    avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Gopika",
    xp: 680,
    level: 5,
    rank: 12,
    weeklyContribution: 180,
    badges: [
      { id: "b1", name: "Pothole Patrol", icon: "🚗", description: "Flagged and resolved 5 potholes", color: "from-amber-500 to-yellow-600" },
      { id: "b2", name: "Eco Guardian", icon: "🌱", description: "Participated in chemical cleanup", color: "from-emerald-400 to-green-600" },
      { id: "b3", name: "First Responder", icon: "⚡", description: "Verified critical alerts in under 10 minutes", color: "from-cyan-400 to-indigo-500" }
    ]
  });

  // Chat copilot states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([
    { role: 'assistant', content: "Hello! I am your CivicFix AI Copilot. I have mapped our city's health, checked live agency response times, and prepared autonomous routing profiles. Ask me anything about local hazards, repair estimates, or platform guidance!" }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Comments state
  const [newComment, setNewComment] = useState('');
  const [commentEvidence, setCommentEvidence] = useState<string | null>(null);

  // Notification Toast state
  const [toast, setToast] = useState<string | null>(null);

  // Map Hover / Highlight states
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [mapCursorCoords, setMapCursorCoords] = useState({ x: 120, y: 180 });
  const mapRef = useRef<SVGSVGElement | null>(null);
  
  const [hoveredIssue, setHoveredIssue] = useState<Issue | null>(null);
  const [mapLayer, setMapLayer] = useState<'standard' | 'heatmap' | 'satellite' | 'flood' | 'traffic'>('standard');
  const [mapZoom, setMapZoom] = useState<number>(1); // 1 = Low (Clustered), 2 = High (Detailed/Individual)

  // Demo Mode States
  const [demoActive, setDemoActive] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [demoLogs, setDemoLogs] = useState<string[]>([]);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Command palette hotkey listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const runAutomatedDemo = async () => {
    if (demoActive) return;
    setDemoActive(true);
    setActiveTab('dashboard');
    setDemoStep(1);
    setDemoLogs(["[CitizenApp] Gopika Randhawa initiated a live incident report...", "[CitizenApp] Snapping high-res evidence & acquiring GPS: (28.5244, 77.2066)"]);
    showToast("🚀 Automated Judges' Demo Started! Watch carefully.");
    await delay(2500);

    setDemoStep(2);
    setDemoLogs(prev => [...prev, "[CitizenApp] Submitting media: 'Severe Subsurface Water Pipe Rupture' on Saket Main Road", "[AI Coordinator] Invoking 6 specialized Autonomous Agents..."]);
    await delay(2500);

    setDemoStep(3);
    setDemoLogs(prev => [...prev, 
      "[VisionAI] Scanning flow pixels. Heavy pipe rupture, high asphalt erosion. Confidence: 98%",
      "[GeoAI] Querying GIS map. Ward: South Heights Ward. Pipe trunk #4B",
      "[DuplicateAI] Checked database. No identical unresolved reports nearby.",
      "[PriorityAI] Upgraded to CRITICAL. Residential foundation and soil erosion hazards.",
      "[BudgetAI] Simulated repair overhead invoice: ₹45,000.",
      "[RoutingAI] Dispatched to: Municipal Water Supply Board (DJB)",
      "[AI Coordinator] All agents aligned. Inserting verified report into live system..."
    ]);

    const simulatedIssue: Issue = {
      id: "iss-simulated-999",
      title: "Saket Main Road Subsurface Water Rupture",
      description: "High pressure subterranean water is bubbling and undermining sidewalk soil beds rapidly near residential complex blocks.",
      category: "water_leak",
      urgency: "critical",
      status: "reported",
      location: {
        lat: 28.5244,
        lng: 77.2066,
        address: "182, Saket Residential Complex Road, Ward 4",
        zone: "South Heights Ward"
      },
      reporter: {
        name: "Gopika Randhawa",
        avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Gopika",
        xp: 680,
        level: 5
      },
      votes: 1,
      votedUserIds: [],
      verifiedUserIds: [],
      comments: [],
      evidenceCount: 1,
      department: "Municipal Water Supply Board (DJB)",
      assignedOfficer: null,
      repairCost: 45000,
      repairDuration: "16 hours",
      aiConfidence: 0.97,
      aiReasoning: "Multi-Agent system identified hydraulic pavement failure. Automated priority elevated due to adjacent residential foundation decay hazards.",
      createdAt: new Date().toISOString(),
      image: "https://images.unsplash.com/photo-1542044896530-05d85be9b11a?auto=format&fit=crop&q=80&w=800",
      isAnonymous: false,
      multiAgentOutputs: {
        visionAi: { status: "completed", confidence: 0.98, task: "Pixel scan", result: "Ruptured subterranean pipeline stream", logs: ["[VisionAI] Loaded high-res spatial matrix", "[VisionAI] Scanning edge anomalies and depth contrast"] },
        geoAi: { status: "completed", confidence: 0.95, task: "GIS lookup", result: "Aligned with cast-iron pipe segment #4B", logs: ["[GeoAI] Fetching city zoning coordinates", "[GeoAI] Snapping GPS vectors"] },
        duplicateAi: { status: "completed", confidence: 0.99, task: "Duplicate detection", result: "No identical reports nearby", logs: [] },
        priorityAi: { status: "completed", confidence: 0.97, task: "Risk score", result: "Urgency set to CRITICAL", logs: [] },
        budgetAi: { status: "completed", confidence: 0.94, task: "Asset pricing", result: "₹45,000 repair overhead estimate", logs: [] },
        routingAi: { status: "completed", confidence: 0.98, task: "Dispatch route", result: "Assigned to Municipal Water Supply Board (DJB)", logs: [] }
      }
    };

    setIssues(prev => [simulatedIssue, ...prev]);
    setSelectedIssue(simulatedIssue);
    showToast("✨ Live Sync: Report created! Pinned on HUD Map.");
    await delay(3000);

    setDemoStep(4);
    setActiveTab('government');
    setDemoLogs(prev => [...prev, "[GovCommand] Dispatch center received critical ticket.", "[GovCommand] Assisting Dispatcher: Crew Leader Rajesh Yadav assigned.", "[GovCommand] Transmitting work order blueprint to squad..."]);
    
    setIssues(prev => prev.map(i => i.id === "iss-simulated-999" ? { 
      ...i, 
      status: "scheduled" as IssueStatus, 
      assignedOfficer: "Crew Leader Rajesh Yadav" 
    } : i));
    setSelectedIssue(prev => prev && prev.id === "iss-simulated-999" ? { 
      ...prev, 
      status: "scheduled" as IssueStatus, 
      assignedOfficer: "Crew Leader Rajesh Yadav" 
    } : prev);
    showToast("📋 Official work order assigned to Crew Leader Rajesh Yadav.");
    await delay(3500);

    setDemoStep(5);
    setDemoLogs(prev => [...prev, "[FieldCrew] Crew arrived on scene with utility van and repair equipment.", "[FieldCrew] Pavement excavated. Pipeline bypass line secured. Current progress: 50%"]);
    
    setIssues(prev => prev.map(i => i.id === "iss-simulated-999" ? { ...i, status: "resolving" as IssueStatus } : i));
    setSelectedIssue(prev => prev && prev.id === "iss-simulated-999" ? { ...prev, status: "resolving" as IssueStatus } : prev);
    showToast("🛠️ Field team is actively repairing the ruptured pipeline.");
    await delay(3500);

    setDemoStep(6);
    setDemoLogs(prev => [...prev, "[FieldCrew] Pipeline bypass successfully welded.", "[FieldCrew] Concrete sidewalk repaved. Field equipment cleared.", "[GovCommand] Audit logs verified. Ticket closed."]);
    
    setIssues(prev => prev.map(i => i.id === "iss-simulated-999" ? { 
      ...i, 
      status: "resolved" as IssueStatus, 
      comments: [
        {
          id: `com-sim-999`,
          author: "Crew Leader Rajesh Yadav",
          avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Rajesh",
          text: "Water valve locked, main section line successfully welded. Excavation fully backfilled and repaved. Citizen validation requested.",
          createdAt: new Date().toISOString(),
          userLvl: 10
        },
        ...i.comments
      ] 
    } : i));
    setSelectedIssue(prev => prev && prev.id === "iss-simulated-999" ? { 
      ...prev, 
      status: "resolved" as IssueStatus, 
      comments: [
        {
          id: `com-sim-999`,
          author: "Crew Leader Rajesh Yadav",
          avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Rajesh",
          text: "Water valve locked, main section line successfully welded. Excavation fully backfilled and repaved. Citizen validation requested.",
          createdAt: new Date().toISOString(),
          userLvl: 10
        },
        ...prev.comments
      ]
    } : prev);
    
    addXp(150, "Missions Accomplished: Clean Water Initiative verified!");
    await delay(3000);

    setDemoStep(7);
    setDemoLogs(prev => [...prev, "🎉 Full Simulation Successful!", "Judges' demo completed in under 2 minutes."]);
  };

  // Load initial data
  useEffect(() => {
    fetchData();
    // Refresh ticker occasionally
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    try {
      const rIssues = await fetch('/api/issues');
      if (rIssues.ok) {
        const data = await rIssues.json();
        setIssues(data);
        if (data.length > 0 && !selectedIssue) {
          setSelectedIssue(data[0]);
        }
      }
      fetchStats();
      const rPred = await fetch('/api/predictions');
      if (rPred.ok) {
        setPredictions(await rPred.json());
      }
    } catch (e) {
      console.error("Error loading server data:", e);
    }
  };

  const fetchStats = async () => {
    try {
      const rStats = await fetch('/api/city-stats');
      if (rStats.ok) {
        setStats(await rStats.json());
      }
    } catch (e) {
      console.warn("Could not load real-time stats:", e);
    }
  };

  // Upvote / Downvote Issue
  const handleVote = async (id: string) => {
    try {
      const response = await fetch(`/api/issues/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user-current-id' })
      });
      if (response.ok) {
        const updated = await response.json();
        setIssues(prev => prev.map(i => i.id === id ? updated : i));
        if (selectedIssue?.id === id) {
          setSelectedIssue(updated);
        }
        
        // Gamification bonus
        const voted = updated.votedUserIds.includes('user-current-id');
        if (voted) {
          addXp(20, "Community Vote registered!");
        } else {
          showToast("Vote revoked");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Verify Issue (Community Verification)
  const handleVerify = async (id: string) => {
    try {
      const response = await fetch(`/api/issues/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user-current-id' })
      });
      if (response.ok) {
        const updated = await response.json();
        setIssues(prev => prev.map(i => i.id === id ? updated : i));
        if (selectedIssue?.id === id) {
          setSelectedIssue(updated);
        }
        
        const verified = updated.verifiedUserIds.includes('user-current-id');
        if (verified) {
          addXp(30, "Report Verified: High Fidelity Boost!");
        } else {
          showToast("Verification retracted");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Comment with optional evidence image
  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue || !newComment.trim()) return;

    try {
      const response = await fetch(`/api/issues/${selectedIssue.id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: userProfile.name,
          avatar: userProfile.avatar,
          text: newComment,
          userLvl: userProfile.level,
          evidenceImage: commentEvidence
        })
      });

      if (response.ok) {
        const updated = await response.json();
        setIssues(prev => prev.map(i => i.id === selectedIssue.id ? updated : i));
        setSelectedIssue(updated);
        setNewComment('');
        setCommentEvidence(null);
        addXp(25, "Insight added to file!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Mitigate risk forecast
  const handleMitigatePrediction = async (id: string) => {
    try {
      const r = await fetch('/api/mitigate-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (r.ok) {
        const updated = await r.json();
        setPredictions(prev => prev.map(p => p.id === id ? updated : p));
        addXp(100, "Preventative ticket issued to Department of Transportation!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Gamification helper
  const addXp = (amount: number, reason: string) => {
    setUserProfile(prev => {
      const nextXp = prev.xp + amount;
      const neededForNext = prev.level * 200;
      let nextLevel = prev.level;
      let alertMsg = `${reason} (+${amount} XP)`;

      if (nextXp >= neededForNext) {
        nextLevel += 1;
        alertMsg = `🎉 LEVEL UP! You are now Level ${nextLevel}! Unlock rewards!`;
      }
      showToast(alertMsg);
      return {
        ...prev,
        xp: nextXp >= neededForNext ? nextXp - neededForNext : nextXp,
        level: nextLevel,
        weeklyContribution: prev.weeklyContribution + amount
      };
    });
  };

  // Trigger server-side Multi-Agent AI parsing & predictions
  const runSmartReportWorkflow = async (prePopulated?: typeof DEMO_REPORTS[0]) => {
    const titleToUse = prePopulated ? prePopulated.title : reportTitle;
    const descToUse = prePopulated ? prePopulated.description : reportDesc;
    const catToUse = prePopulated ? prePopulated.category : reportCategory;
    const imgToUse = prePopulated ? prePopulated.image : reportImage;

    if (!titleToUse || !descToUse) {
      showToast("⚠️ Please enter a title and description");
      return;
    }

    setIsAnalyzing(true);
    setCurrentAgentLogs([]);
    setAiAnalysisResult(null);

    // Multi-Agent Timeline simulation steps for gorgeous UI visual
    const phases = [
      { name: "Vision AI processing pixels...", logs: ["[VisionAI] Loading high-res spatial matrix", "[VisionAI] Scanning edge anomalies and depth contrast", "[VisionAI] Extracting potential safety hazard objects"] },
      { name: "Geo AI checking infrastructure layout...", logs: ["[GeoAI] Fetching city zoning coordinates", "[GeoAI] Snapping GPS vectors to nearest municipal asset", "[GeoAI] Identifying underground pipeline and grid layers"] },
      { name: "Duplicate Detection AI scanning active files...", logs: ["[DuplicateAI] Mapping a 100-meter physical boundary query", "[DuplicateAI] Performing token similarity on surrounding reports", "[DuplicateAI] Confirming ticket uniqueness"] },
      { name: "Priority AI predicting civic urgency...", logs: ["[PriorityAI] Calculating public transit density indexes", "[PriorityAI] Correlating risk weight multipliers with surrounding zones", "[PriorityAI] Elevating risk status index"] },
      { name: "Budget AI estimating repair cost and materials...", logs: ["[BudgetAI] Referencing public contractor labor tariff listings", "[BudgetAI] Forecasting raw materials index (stone, cold-mix, piping)", "[BudgetAI] Calculating total projected repair budget"] },
      { name: "Routing AI selecting city agency...", logs: ["[RoutingAI] Checking current active department queue status", "[RoutingAI] Outlining dispatch routing protocol", "[RoutingAI] Preparing government officer dashboard trigger"] }
    ];

    for (let i = 0; i < phases.length; i++) {
      setAnalysisPhase(phases[i].name);
      // Append logs progressively
      for (const log of phases[i].logs) {
        setCurrentAgentLogs(prev => [...prev, log]);
        await new Promise(r => setTimeout(r, 200));
      }
      await new Promise(r => setTimeout(r, 400));
    }

    setAnalysisPhase("Consolidating Multi-Agent Consensus...");

    try {
      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: titleToUse,
          description: descToUse,
          category: catToUse,
          image: imgToUse
        })
      });

      if (response.ok) {
        const analysis = await response.json();
        setAiAnalysisResult(analysis);
        
        // Create the issue in DB using the analysis outputs
        const createRes = await fetch('/api/issues', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: titleToUse,
            description: descToUse,
            category: analysis.category || catToUse,
            urgency: analysis.urgency || reportUrgency,
            location: {
              lat: 37.7749 + (Math.random() - 0.5) * 0.04,
              lng: -122.4194 + (Math.random() - 0.5) * 0.04,
              address: `${selectedZone} Pinned Sector`,
              zone: selectedZone
            },
            reporter: {
              name: userProfile.name,
              avatar: userProfile.avatar,
              xp: userProfile.xp,
              level: userProfile.level
            },
            image: imgToUse || "https://images.unsplash.com/photo-1594818859664-ac7c53e585d8?auto=format&fit=crop&q=80&w=800",
            isAnonymous: isAnonymous,
            aiAnalysis: analysis
          })
        });

        if (createRes.ok) {
          const freshIssue = await createRes.json();
          setIssues(prev => [freshIssue, ...prev]);
          setSelectedIssue(freshIssue);
          
          // Clear form
          setReportTitle('');
          setReportDesc('');
          setReportImage('');
          
          addXp(50, "Smarter City Initiative! Issue created with autonomous AI routing.");
          
          // Trigger regeneration of AI predictions to align with the new issue
          fetch('/api/gemini/predictions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentIssues: [freshIssue, ...issues] })
          }).then(res => res.ok && res.json().then(p => setPredictions(p)));
        }
      }
    } catch (e) {
      console.error(e);
      showToast("Could not complete AI multi-agent analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Government Admin Action: Update status or parameters
  const updateIssueStatusByAdmin = async (id: string, updates: Partial<Issue>) => {
    try {
      const r = await fetch(`/api/issues/${id}/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (r.ok) {
        const updated = await r.json();
        setIssues(prev => prev.map(i => i.id === id ? updated : i));
        if (selectedIssue?.id === id) {
          setSelectedIssue(updated);
        }
        showToast(`Gov Command: Updated ticket #${id.slice(-4).toUpperCase()}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // File Upload base64 loader
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setReportImage(reader.result as string);
      showToast("📸 High-resolution image parsed for Vision AI.");
    };
    reader.readAsDataURL(file);
  };

  const handleCommentEvidenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setCommentEvidence(reader.result as string);
      showToast("📁 Evidence proof attached successfully.");
    };
    reader.readAsDataURL(file);
  };

  // Copilot Chat Handler
  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: chatHistory.slice(-10) // past context
        })
      });

      if (response.ok) {
        const data = await response.json();
        setChatHistory(prev => [...prev, { role: 'assistant', content: data.text }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  // Map coordinate mouse reactive system
  const handleMapMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    setMapCursorCoords({ x, y });
  };

  // Filters
  const filteredIssues = issues.filter(i => {
    const matchesCat = categoryFilter === 'all' || i.category === categoryFilter;
    const matchesUrg = urgencyFilter === 'all' || i.urgency === urgencyFilter;
    const matchesSearch = searchQuery === '' || 
      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.location.zone.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesUrg && matchesSearch;
  });

  // Clustering Helper
  const getClusteredWards = () => {
    const clusters: Record<string, { count: number; urgency: string; issues: Issue[] }> = {};
    
    // Initialize clusters for all 4 wards so they always display
    Object.keys(wardCenters).forEach(ward => {
      clusters[ward] = { count: 0, urgency: 'low', issues: [] };
    });

    filteredIssues.forEach(iss => {
      if (iss.status === 'resolved' || iss.status === 'mitigated') return; // only unresolved tickets
      const ward = normalizeZone(iss.location.zone);
      if (!clusters[ward]) {
        clusters[ward] = { count: 0, urgency: 'low', issues: [] };
      }
      clusters[ward].count += 1;
      clusters[ward].issues.push(iss);
      if (iss.urgency === 'critical') {
        clusters[ward].urgency = 'critical';
      } else if (iss.urgency === 'high' && clusters[ward].urgency !== 'critical') {
        clusters[ward].urgency = 'high';
      } else if (iss.urgency === 'medium' && clusters[ward].urgency !== 'critical' && clusters[ward].urgency !== 'high') {
        clusters[ward].urgency = 'medium';
      }
    });

    return Object.entries(clusters).map(([name, data]) => ({
      name,
      center: wardCenters[name] || { x: 500, y: 250, label: name, color: "#7C3AED", glow: "url(#purpleGlow)" },
      ...data
    }));
  };

  // Category Colors
  const getCatLabel = (cat: IssueCategory) => {
    switch(cat) {
      case 'pothole': return { text: 'Pothole Damage', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30', color: 'text-amber-400' };
      case 'sanitation': return { text: 'Sanitation Dumping', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', color: 'text-emerald-400' };
      case 'streetlight': return { text: 'Grid Outage', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', color: 'text-cyan-400' };
      case 'water_leak': return { text: 'Hydraulic Rupture', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30', color: 'text-blue-400' };
      case 'traffic': return { text: 'Transit Hazard', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30', color: 'text-purple-400' };
      default: return { text: 'Civic Issue', bg: 'bg-gray-500/10 text-gray-400 border-gray-500/30', color: 'text-gray-400' };
    }
  };

  const getUrgencyLabel = (urg: IssueUrgency) => {
    switch(urg) {
      case 'critical': return 'bg-rose-500/20 text-rose-400 border-rose-500/40 font-bold uppercase';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30 font-semibold';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-blue-500/20 text-blue-400 border-blue-500/20';
    }
  };

  return (
    <div className="min-h-screen text-primary-text relative font-sans overflow-x-hidden selection:bg-copper-primary/50 bg-bg-base blueprint-grid blueprint-grid-fine contour-lines">
      
      {/* Background Animated Beams replaced by Premium Copper Radial Glow */}
      <div className="fixed inset-0 pointer-events-none z-0 radial-glow opacity-60"></div>

      {/* Global Notifications Ticker & Emergency Alert Bar */}
      {stats.emergencyAlert && (
        <div className="relative z-50 bg-surface/95 border-b border-card-border text-sand-gold px-4 py-2.5 text-xs text-center flex items-center justify-center gap-2 backdrop-blur-md font-display font-medium">
          <AlertTriangle className="w-4 h-4 text-copper-primary animate-pulse" />
          <span className="font-bold uppercase tracking-wider text-[10px] bg-copper-primary text-primary-text px-2 py-0.5 rounded-full mr-1 font-stats">CRITICAL ZONE</span>
          <span>{stats.emergencyAlert}</span>
        </div>
      )}

      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#241A15]/95 border border-card-border border-l-4 border-l-copper-primary shadow-[0_0_30px_rgba(201,107,44,0.25)] p-4 rounded-xl backdrop-blur-xl max-w-sm transition-all duration-300 transform translate-y-0 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-copper-primary/10 flex items-center justify-center text-copper-primary shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-primary-text leading-relaxed font-display">{toast}</p>
          </div>
        </div>
      )}

      {/* Side Apple/VisionOS Style Navigation Bar */}
      <div className="flex min-h-screen relative z-10">
        <aside className="w-24 border-r border-card-border bg-sidebar/90 flex flex-col items-center py-8 shrink-0 sticky top-0 h-screen justify-between backdrop-blur-2xl">
          <div className="flex flex-col items-center gap-8 w-full">
            {/* Main Premium Logo Box */}
            <div 
              onClick={() => setActiveTab('hero')} 
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-copper-primary via-sand-gold to-bg-secondary flex items-center justify-center cursor-pointer shadow-[0_0_20px_rgba(201,107,44,0.35)] hover:scale-105 transition-all duration-300 border border-card-border"
              title="CivicFix AI Home"
            >
              <Bot className="w-7 h-7 text-primary-text" />
            </div>

            {/* Navigation Icons */}
            <nav className="flex flex-col gap-5 w-full px-2">
              <button 
                onClick={() => setActiveTab('dashboard')} 
                className={`p-3.5 rounded-xl flex flex-col items-center gap-1.5 transition-all group ${activeTab === 'dashboard' ? 'bg-copper-primary/25 text-sand-gold border border-card-border shadow-[0_0_15px_rgba(201,107,44,0.15)]' : 'text-secondary-text hover:bg-surface/50 hover:text-primary-text'}`}
                title="Mission Control Dashboard"
              >
                <Activity className="w-5 h-5 group-hover:scale-110 transition-transform text-copper-primary" />
                <span className="text-[9px] font-bold tracking-tight font-display">Control</span>
              </button>

              <button 
                onClick={() => setActiveTab('map')} 
                className={`p-3.5 rounded-xl flex flex-col items-center gap-1.5 transition-all group ${activeTab === 'map' ? 'bg-copper-primary/25 text-sand-gold border border-card-border' : 'text-secondary-text hover:bg-surface/50 hover:text-primary-text'}`}
                title="Live Vector City HUD Map"
              >
                <Compass className="w-5 h-5 group-hover:scale-110 transition-transform text-copper-primary" />
                <span className="text-[9px] font-bold tracking-tight font-display">HUD Map</span>
              </button>

              <button 
                onClick={() => setActiveTab('leaderboard')} 
                className={`p-3.5 rounded-xl flex flex-col items-center gap-1.5 transition-all group ${activeTab === 'leaderboard' ? 'bg-copper-primary/25 text-sand-gold border border-card-border' : 'text-secondary-text hover:bg-surface/50 hover:text-primary-text'}`}
                title="Citizen Hero Leaderboard"
              >
                <Trophy className="w-5 h-5 group-hover:scale-110 transition-transform text-copper-primary" />
                <span className="text-[9px] font-bold tracking-tight font-display">Leader</span>
              </button>

              <button 
                onClick={() => setActiveTab('government')} 
                className={`p-3.5 rounded-xl flex flex-col items-center gap-1.5 transition-all group ${activeTab === 'government' ? 'bg-copper-primary/25 text-sand-gold border border-card-border' : 'text-secondary-text hover:bg-surface/50 hover:text-primary-text'}`}
                title="Government Agency command"
              >
                <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform text-copper-primary" />
                <span className="text-[9px] font-bold tracking-tight font-display">Govt</span>
              </button>

              <button 
                onClick={() => setActiveTab('analytics')} 
                className={`p-3.5 rounded-xl flex flex-col items-center gap-1.5 transition-all group ${activeTab === 'analytics' ? 'bg-copper-primary/25 text-sand-gold border border-card-border' : 'text-secondary-text hover:bg-surface/50 hover:text-primary-text'}`}
                title="Municipal Telemetry & Analytics HUD"
              >
                <Layers className="w-5 h-5 group-hover:scale-110 transition-transform text-copper-primary" />
                <span className="text-[9px] font-bold tracking-tight font-display">KPIs</span>
              </button>

              <button 
                onClick={() => setActiveTab('flashcards')} 
                className={`p-3.5 rounded-xl flex flex-col items-center gap-1.5 transition-all group ${activeTab === 'flashcards' ? 'bg-copper-primary/25 text-sand-gold border border-card-border' : 'text-secondary-text hover:bg-surface/50 hover:text-primary-text'}`}
                title="NagarVerse Citizen Academy Flash Cards"
              >
                <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform text-copper-primary" />
                <span className="text-[9px] font-bold tracking-tight font-display">Academy</span>
              </button>

              <button 
                onClick={() => setActiveTab('roadguardian')} 
                className={`p-3.5 rounded-xl flex flex-col items-center gap-1.5 transition-all group ${activeTab === 'roadguardian' ? 'bg-red-500/25 text-red-400 border border-red-500/40 shadow-[0_0_15px_rgba(248,113,113,0.2)]' : 'text-secondary-text hover:bg-surface/50 hover:text-primary-text'}`}
                title="AI Road Guardian – Smart Accident Prevention"
              >
                <Shield className="w-5 h-5 group-hover:scale-110 transition-transform text-red-400" />
                <span className="text-[9px] font-bold tracking-tight font-display">Guardian</span>
              </button>
            </nav>
          </div>

          {/* Gamified Citizen Profile Mini-Card at Bottom */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative cursor-pointer" onClick={() => setActiveTab('leaderboard')}>
              <img 
                src={userProfile.avatar} 
                alt="User Profile" 
                className="w-12 h-12 rounded-xl border border-card-border hover:border-copper-primary transition-all bg-bg-base" 
              />
              <span className="absolute -bottom-1 -right-1 bg-copper-primary text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-bg-base">
                {userProfile.level}
              </span>
            </div>
          </div>
        </aside>

        {/* Main Application Container */}
        <div className="flex-1 flex flex-col min-w-0 z-10 relative">
          
          {/* Top Premium Unified Header */}
          <header className="border-b border-card-border bg-bg-secondary/75 backdrop-blur-xl px-8 py-5 sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-[0.3em] text-secondary-text font-bold block mb-0.5 font-display">NagarVerse AI COMMAND CONTROL</span>
                <h1 className="text-2.5xl font-light font-display text-primary-text flex items-center gap-2">
                  <span>CivicFix</span>
                  <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-copper-primary to-sand-gold">OS</span>
                </h1>
              </div>
              
              {/* Dynamic Search / Command Palette shortcut trigger */}
              <div 
                onClick={() => setIsCommandPaletteOpen(true)}
                className="relative ml-6 hidden md:block w-80 cursor-pointer group"
              >
                <Search className="w-4 h-4 text-steel-gray absolute left-3.5 top-1/2 -translate-y-1/2 group-hover:text-copper-primary transition-colors" />
                <input 
                  type="text" 
                  readOnly
                  placeholder="Global AI Search (Press Ctrl+K)..." 
                  className="w-full bg-bg-base border border-card-border rounded-full pl-10 pr-16 py-2.5 text-xs text-primary-text placeholder-steel-gray cursor-pointer focus:outline-none group-hover:border-copper-primary transition-all font-sans"
                />
                <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] bg-surface text-steel-gray px-1.5 py-0.5 rounded border border-card-border font-mono">⌘K</kbd>
              </div>
            </div>

            {/* Quick Metrics & Actions Bar */}
            <div className="flex items-center gap-6">
              
              {/* Judges' Demo Mode button */}
              <button 
                onClick={runAutomatedDemo}
                disabled={demoActive}
                className={`px-5 py-2.5 rounded-full border text-xs font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2 font-display cursor-pointer ${
                  demoActive 
                    ? 'bg-copper-primary/30 border-copper-primary text-sand-gold animate-pulse shadow-[0_0_20px_rgba(201,107,44,0.4)]' 
                    : 'bg-surface hover:bg-bg-secondary border-card-border text-primary-text hover:border-copper-primary shadow-[0_0_15px_rgba(0,0,0,0.3)]'
                }`}
              >
                <span>🚀</span>
                <span>{demoActive ? `Demo Step ${demoStep}/7 Active` : "Run Operating System Demo"}</span>
              </button>

              {/* Health Score Panel */}
              <div className="flex items-center gap-4 bg-bg-base border border-card-border px-5 py-2 rounded-2xl shadow-inner">
                <div className="flex flex-col">
                  <span className="text-[8px] text-secondary-text uppercase tracking-wider font-stats">City Health Index</span>
                  <span className="text-md font-extrabold text-success flex items-center gap-1 font-stats">
                    {stats.score}% <span className="text-[10px] text-copper-primary font-normal">↑ {stats.change}%</span>
                  </span>
                </div>
                <div className="w-14 h-1.5 bg-surface rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-copper-primary to-sand-gold" style={{ width: `${stats.score}%` }}></div>
                </div>
              </div>

              {/* Action Buttons */}
              <button 
                onClick={() => {
                  setActiveTab('dashboard');
                  setTimeout(() => {
                    document.getElementById('report-creator-form')?.scrollIntoView({ behavior: 'smooth' });
                  }, 200);
                }} 
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-copper-primary to-sand-gold hover:brightness-110 text-xs font-bold shadow-[0_0_20px_rgba(201,107,44,0.35)] transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer text-primary-text font-display"
              >
                <Plus className="w-4 h-4 text-primary-text" />
                Report Infrastructure Incident
              </button>
            </div>
          </header>

          {/* Tab Pages rendering */}
          <main className="p-8 flex-1 overflow-y-auto">

            {/* PAGE 1: CINEMATIC HERO LANDING PRESENTATION */}
            {activeTab === 'hero' && (
              <div className="max-w-6xl mx-auto space-y-16 animate-fade-in py-8 font-sans">
                {/* Fullscreen style Hero Panel */}
                <TiltCard className="rounded-[40px] border border-card-border bg-bg-secondary/60 p-12 flex flex-col md:flex-row items-center gap-12 shadow-[0_0_50px_rgba(201,107,44,0.08)]">
                  <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(#c96b2c_0.8px,transparent_0.8px)] [background-size:24px_24px]"></div>
                  
                  <div className="flex-1 space-y-6 relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-copper-primary/10 border border-copper-primary/20 rounded-full">
                      <Sparkles className="w-3.5 h-3.5 text-sand-gold animate-pulse" />
                      <span className="text-[9px] uppercase font-bold tracking-widest text-sand-gold font-display">NAGARVERSE Operating System Hub</span>
                    </div>

                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-light font-display text-primary-text leading-tight tracking-tight">
                      AI Powered <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-copper-primary via-sand-gold to-white">Communities</span>.<br />Smarter Infrastructure.
                    </h2>
                    <p className="text-sm text-secondary-text max-w-xl leading-relaxed">
                      CivicFix AI orchestrates six specialized autonomous AI agents to analyze citizen evidence, predict seasonal infrastructure hazards, calculate repair budgets, and trigger instant routing to local departments.
                    </p>

                    <div className="flex flex-wrap gap-4 pt-4">
                      <button 
                        onClick={() => setActiveTab('dashboard')} 
                        className="px-6 py-3 rounded-full bg-copper-primary hover:brightness-110 font-bold text-xs text-primary-text shadow-[0_0_20px_rgba(201,107,44,0.35)] transition-all flex items-center gap-2 font-display cursor-pointer"
                      >
                        Launch Control Center <ArrowRight className="w-4 h-4 text-primary-text animate-pulse" />
                      </button>
                      <button 
                        onClick={() => {
                          setChatOpen(true);
                          setChatHistory(prev => [...prev, { role: 'user', content: "Explain how Vision AI and Geo AI agents collaborate on a reported issue." }]);
                        }} 
                        className="px-6 py-3 rounded-full bg-surface hover:bg-bg-secondary border border-card-border font-semibold text-xs text-primary-text transition-all font-display cursor-pointer"
                      >
                        Explain AI Collaboration Model
                      </button>
                    </div>
                  </div>

                  {/* Smart Futuristic City Graphic */}
                  <div className="w-full md:w-96 aspect-square rounded-[32px] bg-bg-base border border-card-border relative p-6 flex flex-col justify-between overflow-hidden shadow-2xl group shrink-0">
                    <div className="absolute inset-0 bg-radial from-copper-primary/20 to-transparent"></div>
                    
                    {/* Floating HUD metrics */}
                    <div className="flex justify-between items-center z-10">
                      <span className="text-[9px] uppercase tracking-wider text-sand-gold font-stats bg-copper-primary/10 border border-copper-primary/30 px-2 py-0.5 rounded-full">GRID ONLINE</span>
                      <span className="text-[10px] text-steel-gray font-mono">LAT: 28.5244N</span>
                    </div>

                    {/* Vector wireframe graphic of city */}
                    <div className="relative flex-1 flex items-center justify-center py-6">
                      <div className="absolute w-32 h-32 rounded-full border border-dashed border-copper-primary/20 animate-spin"></div>
                      <div className="absolute w-24 h-24 rounded-full border border-sand-gold/30 animate-pulse"></div>
                      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-copper-primary to-sand-gold flex items-center justify-center shadow-[0_0_30px_rgba(201,107,44,0.5)] border border-card-border">
                        <Bot className="w-8 h-8 text-primary-text" />
                      </div>
                    </div>

                    {/* Collaborative agents indicators */}
                    <div className="z-10 bg-bg-secondary/80 p-3.5 rounded-2xl border border-card-border backdrop-blur-md">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] text-primary-text font-bold font-display">Multi-Agent Consensus Model</span>
                        <span className="text-[9px] text-success font-stats">99.8% Perfect</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        <span className="h-1 rounded-full bg-copper-primary"></span>
                        <span className="h-1 rounded-full bg-sand-gold"></span>
                        <span className="h-1 rounded-full bg-success"></span>
                        <span className="h-1 rounded-full bg-primary-text"></span>
                      </div>
                    </div>
                  </div>
                </TiltCard>

                {/* Triple Bento Highlight cards using TiltCards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  <TiltCard className="bg-bg-secondary/40 border border-card-border rounded-3xl p-6 hover:border-copper-primary/30 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-copper-primary/10 text-copper-primary flex items-center justify-center mb-4 border border-copper-primary/20">
                      <Brain className="w-5 h-5 text-copper-primary" />
                    </div>
                    <h3 className="text-base font-bold text-primary-text mb-2 font-display">Multi-Agent AI Hub</h3>
                    <p className="text-xs text-secondary-text leading-relaxed">
                      Six AI specialists collaborate to instantly calculate repair overhead, detect duplicates, and assign agencies.
                    </p>
                  </TiltCard>

                  <TiltCard className="bg-bg-secondary/40 border border-card-border rounded-3xl p-6 hover:border-copper-primary/30 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-copper-primary/10 text-copper-primary flex items-center justify-center mb-4 border border-copper-primary/20">
                      <Trophy className="w-5 h-5 text-copper-primary" />
                    </div>
                    <h3 className="text-base font-bold text-primary-text mb-2 font-display">Citizen Hero Program</h3>
                    <p className="text-xs text-secondary-text leading-relaxed">
                      Earn XP, unlock stunning rare visual badges, and trade points for dynamic municipal transit vouchers.
                    </p>
                  </TiltCard>

                  <TiltCard className="bg-bg-secondary/40 border border-card-border rounded-3xl p-6 hover:border-copper-primary/30 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-copper-primary/10 text-copper-primary flex items-center justify-center mb-4 border border-copper-primary/20">
                      <Activity className="w-5 h-5 text-copper-primary" />
                    </div>
                    <h3 className="text-base font-bold text-primary-text mb-2 font-display">Predictive Hazard Engine</h3>
                    <p className="text-xs text-secondary-text leading-relaxed">
                      AI analyzes wet conditions and previous leaks to proactively forecast asphalt breakages and schedule early repair work.
                    </p>
                  </TiltCard>

                </div>
              </div>
            )}

            {/* PAGE 2: MAIN MISSION CONTROL DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
                
                {/* Top Bento Info Dashboard Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  
                  {/* Health Score */}
                  <TiltCard className="bg-bg-secondary/80 border border-card-border rounded-3xl p-6 flex flex-col justify-between shadow-xl">
                    <span className="text-[10px] uppercase tracking-wider text-secondary-text font-bold block font-display">Municipal Integrity</span>
                    <div className="my-3 flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-primary-text font-stats">{stats.score}</span>
                      <span className="text-xs text-success ml-1 font-stats">↑ {stats.change}%</span>
                    </div>
                    <span className="text-[9px] text-success block font-mono">Dynamic city-health index</span>
                  </TiltCard>

                  {/* Active Incidents */}
                  <TiltCard className="bg-bg-secondary/80 border border-card-border rounded-3xl p-6 flex flex-col justify-between shadow-xl">
                    <span className="text-[10px] uppercase tracking-wider text-secondary-text font-bold block font-display">Active Hazards</span>
                    <div className="my-3 flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-primary-text font-stats">{issues.filter(i => i.status !== 'resolved').length}</span>
                      <span className="text-xs text-copper-primary ml-1 font-display">Unresolved</span>
                    </div>
                    <span className="text-[9px] text-steel-gray block font-mono">Real-time database sync</span>
                  </TiltCard>

                  {/* Resolved Total */}
                  <TiltCard className="bg-bg-secondary/80 border border-card-border rounded-3xl p-6 flex flex-col justify-between shadow-xl">
                    <span className="text-[10px] uppercase tracking-wider text-secondary-text font-bold block font-display">Resolved Tickets</span>
                    <div className="my-3 flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-primary-text font-stats">{stats.resolvedThisMonth}</span>
                      <span className="text-xs text-sand-gold ml-1 font-display">This Month</span>
                    </div>
                    <span className="text-[9px] text-success block font-mono">Avg duration: {stats.avgResolutionDays} days</span>
                  </TiltCard>

                  {/* Community Engagement */}
                  <TiltCard className="bg-gradient-to-br from-copper-primary/20 to-sand-gold/20 border border-copper-primary/30 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
                    <span className="text-[10px] uppercase tracking-wider text-sand-gold font-bold block font-display">Civic Impact</span>
                    <div className="my-3 flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-sand-gold font-stats">+{stats.totalContributors * 10}</span>
                      <span className="text-xs text-sand-gold ml-1 font-stats">XP Granted</span>
                    </div>
                    <span className="text-[9px] text-primary-text/60 block font-mono">{stats.totalContributors} active citizens</span>
                  </TiltCard>

                </div>

                {/* Main Action Grid (Issue Submitting & Multi-Agent State on Left, Active Feed on Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left Hand: Submit Issue + Multi-Agent Progress Simulation */}
                  <div className="lg:col-span-7 space-y-8">
                    
                    {/* Integrated AI Report Creator */}
                    <div id="report-creator-form" className="bg-bg-secondary/60 border border-card-border rounded-[32px] p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-48 h-48 bg-copper-primary/5 rounded-full blur-3xl pointer-events-none"></div>
                      
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <span className="text-[9px] uppercase tracking-[0.2em] text-copper-primary font-bold block font-display">ASSISTED CREATION</span>
                          <h3 className="text-xl font-bold text-primary-text font-display">Smart Issue Reporting Suite</h3>
                        </div>
                        <Bot className="w-6 h-6 text-copper-primary animate-pulse" />
                      </div>

                      {/* Quick Auto-populate Demo selection */}
                      <div className="bg-surface/50 border border-card-border rounded-2xl p-4 mb-6">
                        <span className="text-[10px] uppercase text-secondary-text block mb-2.5 font-bold font-display">Test Smart Analysis (Auto-Populate Demo)</span>
                        <div className="grid grid-cols-2 gap-2">
                          {DEMO_REPORTS.map((demo, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setReportTitle(demo.title);
                                setReportDesc(demo.description);
                                setReportCategory(demo.category);
                                setReportImage(demo.image);
                                showToast(`✨ Selected Demo #${idx + 1}: ${demo.category.toUpperCase()}`);
                              }}
                              className="text-left p-2.5 rounded-xl bg-bg-base/80 border border-card-border hover:border-copper-primary/50 text-[11px] text-secondary-text hover:text-primary-text transition-all flex items-center gap-2 group cursor-pointer"
                            >
                              <span className="w-2 h-2 rounded-full bg-copper-primary group-hover:bg-sand-gold transition-colors"></span>
                              <span className="truncate font-medium">{demo.title}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4 font-sans">
                        <div>
                          <label className="text-[10px] uppercase text-secondary-text block mb-1.5 font-bold font-display">Issue Title</label>
                          <input 
                            type="text" 
                            placeholder="e.g., Deep road asphalt erosion and side cracking" 
                            className="w-full bg-bg-base/75 border border-card-border rounded-xl px-4 py-3 text-xs text-primary-text focus:outline-none focus:border-copper-primary transition-all"
                            value={reportTitle}
                            onChange={(e) => setReportTitle(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="text-[10px] uppercase text-secondary-text block mb-1.5 font-bold font-display">Detailed Evidence Description</label>
                          <textarea 
                            rows={3}
                            placeholder="Describe physical characteristics, estimated depth or scope, and direct threats to neighborhood safety..." 
                            className="w-full bg-bg-base/75 border border-card-border rounded-xl px-4 py-3 text-xs text-primary-text focus:outline-none focus:border-copper-primary transition-all"
                            value={reportDesc}
                            onChange={(e) => setReportDesc(e.target.value)}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] uppercase text-secondary-text block mb-1.5 font-bold font-display">Fallback Category Selector</label>
                            <select 
                              className="w-full bg-bg-base/75 border border-card-border rounded-xl px-4 py-3 text-xs text-primary-text focus:outline-none focus:border-copper-primary"
                              value={reportCategory}
                              onChange={(e) => setReportCategory(e.target.value as IssueCategory)}
                            >
                              <option value="pothole">Pothole / Road damage</option>
                              <option value="sanitation">Sanitation dumping</option>
                              <option value="streetlight">Streetlight failure</option>
                              <option value="water_leak">Water pipeline leak</option>
                              <option value="traffic">Traffic / Safety hazard</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] uppercase text-secondary-text block mb-1.5 font-bold font-display">Utility District Zone</label>
                            <select 
                              className="w-full bg-bg-base/75 border border-card-border rounded-xl px-4 py-3 text-xs text-primary-text focus:outline-none focus:border-copper-primary"
                              value={selectedZone}
                              onChange={(e) => setSelectedZone(e.target.value)}
                            >
                              <option value="West Ward">West Ward</option>
                              <option value="South Heights Ward">South Heights Ward</option>
                              <option value="East Riverfront Ward">East Riverfront Ward</option>
                              <option value="South West Expressway">South West Expressway</option>
                            </select>
                          </div>
                        </div>

                        {/* File Upload and Anonymous Selection */}
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-bg-base/60 p-4 rounded-2xl border border-card-border">
                          <div className="flex items-center gap-4 w-full md:w-auto">
                            <label className="cursor-pointer bg-surface hover:bg-bg-secondary border border-card-border px-4 py-2.5 rounded-xl flex items-center gap-2 text-[11px] font-semibold text-primary-text transition-all hover:scale-102">
                              <Upload className="w-4 h-4 text-copper-primary" />
                              <span>Upload Picture</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleImageUpload}
                              />
                            </label>

                            {reportImage && (
                              <div className="relative">
                                <img src={reportImage} alt="Uploaded preview" className="w-10 h-10 rounded-lg object-cover border border-copper-primary" />
                                <button onClick={() => setReportImage('')} className="absolute -top-2 -right-2 bg-rose-600 rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-bold">X</button>
                              </div>
                            )}
                          </div>

                          <label className="flex items-center gap-2.5 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={isAnonymous} 
                              onChange={(e) => setIsAnonymous(e.target.checked)}
                              className="w-4 h-4 rounded bg-bg-base border-card-border text-copper-primary focus:ring-0 focus:ring-offset-0"
                            />
                            <span className="text-xs text-secondary-text">Submit Anonymously</span>
                          </label>
                        </div>

                        <button
                          type="button"
                          onClick={() => runSmartReportWorkflow()}
                          disabled={isAnalyzing}
                          className="w-full py-4 rounded-2xl bg-gradient-to-r from-copper-primary to-sand-gold hover:brightness-110 text-xs font-bold text-primary-text transition-all transform active:scale-98 shadow-xl flex items-center justify-center gap-2 cursor-pointer font-display"
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-primary-text" />
                              <span>Multi-Agent AI Collaborating...</span>
                            </>
                          ) : (
                            <>
                              <Brain className="w-4 h-4 text-primary-text" />
                              <span>Trigger Multi-Agent AI Reporting & Routing</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Collaborative Multi-Agent Visual Overlay Board */}
                    {isAnalyzing && (
                      <div className="bg-bg-secondary/95 border border-copper-primary/30 rounded-[32px] p-6 shadow-2xl relative overflow-hidden space-y-6">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-copper-primary/5 rounded-full blur-2xl"></div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Bot className="w-5 h-5 text-copper-primary animate-bounce" />
                            <h4 className="text-sm font-bold font-display">Active Multi-Agent Collaboration Engine</h4>
                          </div>
                          <span className="text-[10px] bg-copper-primary/10 text-sand-gold border border-copper-primary/30 px-2.5 py-0.5 rounded-full font-mono uppercase animate-pulse">
                            {analysisPhase}
                          </span>
                        </div>

                        {/* Particle lines representation */}
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                          {[
                            { name: "Vision AI", color: "from-copper-primary to-sand-gold", key: "vision" },
                            { name: "Geo AI", color: "from-copper-primary to-sand-gold", key: "geo" },
                            { name: "Duplicate AI", color: "from-copper-primary to-sand-gold", key: "dup" },
                            { name: "Priority AI", color: "from-copper-primary to-sand-gold", key: "pri" },
                            { name: "Budget AI", color: "from-copper-primary to-sand-gold", key: "bud" },
                            { name: "Routing AI", color: "from-copper-primary to-sand-gold", key: "rou" }
                          ].map((ag, idx) => (
                            <div key={idx} className="bg-bg-base border border-card-border rounded-xl p-3 flex flex-col items-center text-center space-y-1">
                              <span className="text-[9px] font-bold text-primary-text font-display">{ag.name}</span>
                              <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-copper-primary to-sand-gold animate-ping"></div>
                              <span className="text-[8px] text-success tracking-wider uppercase font-bold font-mono">ACTIVE</span>
                            </div>
                          ))}
                        </div>

                        {/* Real-time Agent Log Terminal */}
                        <div className="bg-bg-base/90 rounded-2xl p-4 border border-card-border font-mono text-[10px] space-y-1.5 max-h-40 overflow-y-auto">
                          <p className="text-steel-gray">// Booting multi-agent consensus protocol v2.5.0</p>
                          {currentAgentLogs.map((log, idx) => (
                            <p key={idx} className="text-secondary-text">
                              <span className="text-copper-primary mr-1.5">&gt;</span>
                              {log}
                            </p>
                          ))}
                          <p className="text-sand-gold animate-pulse">Processing active calculations...</p>
                        </div>
                      </div>
                    )}

                    {/* Proactive Hazard Prediction Engine View */}
                    <div className="bg-bg-secondary/60 border border-card-border rounded-[32px] p-8 space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-copper-primary font-bold block font-display">PREDICTIVE MAINTENANCE</span>
                          <h3 className="text-lg font-bold text-primary-text font-display">Gemini Proactive Hazard Projections</h3>
                        </div>
                        <Brain className="w-5 h-5 text-copper-primary" />
                      </div>

                      <div className="space-y-4">
                        {predictions.map((p) => (
                          <div 
                            key={p.id} 
                            className={`p-5 rounded-2xl border ${p.status === 'mitigated' ? 'bg-bg-base/80 border-success/30' : 'bg-bg-base/40 border-card-border'} transition-all`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded font-display ${p.status === 'mitigated' ? 'bg-success/10 text-success border border-success/20' : 'bg-copper-primary/10 text-copper-primary border border-copper-primary/20'}`}>
                                  {p.status === 'mitigated' ? 'Mitigated' : 'Pending Threat'}
                                </span>
                                <h4 className="text-xs font-bold text-primary-text font-display">{p.title}</h4>
                              </div>
                              <span className="text-[10px] font-bold font-stats text-copper-primary">Risk Score: {p.riskScore}%</span>
                            </div>

                            <p className="text-[11px] text-secondary-text leading-relaxed mb-3">{p.reasoning}</p>
                            
                            <div className="bg-surface/60 p-3 rounded-xl border border-card-border mb-3">
                              <span className="text-[9px] uppercase tracking-wider text-sand-gold font-bold block font-display">AI Preventative Recommendation</span>
                              <span className="text-xs text-primary-text leading-relaxed">{p.preventativeAction}</span>
                            </div>

                            {p.status !== 'mitigated' && (
                              <button 
                                onClick={() => handleMitigatePrediction(p.id)}
                                className="px-4 py-1.5 rounded-lg bg-copper-primary text-primary-text text-[10px] font-extrabold hover:brightness-110 transition-all cursor-pointer flex items-center gap-1.5 font-display shadow-[0_0_15px_rgba(201,107,44,0.25)]"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Approve Early Preventative Dispatch
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Right Hand: Active Issue Feed & Premium Issue Flash Cards */}
                  <div className="lg:col-span-5 space-y-6">
                    
                    {/* Filter controls */}
                    <div className="bg-bg-secondary/60 border border-card-border rounded-3xl p-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold font-display text-primary-text">Filter Live Feed</span>
                        <span className="text-[10px] text-steel-gray font-stats">{filteredIssues.length} matches</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[8px] uppercase tracking-wider text-secondary-text block mb-1 font-bold font-display">By Category</label>
                          <select 
                            value={categoryFilter} 
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="w-full bg-bg-base border border-card-border rounded-lg p-2 text-[11px] text-primary-text focus:outline-none focus:border-copper-primary"
                          >
                            <option value="all">All Categories</option>
                            <option value="pothole">Pothole</option>
                            <option value="sanitation">Sanitation</option>
                            <option value="streetlight">Streetlight</option>
                            <option value="water_leak">Water Leak</option>
                            <option value="traffic">Traffic</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[8px] uppercase tracking-wider text-secondary-text block mb-1 font-bold font-display">By Urgency</label>
                          <select 
                            value={urgencyFilter} 
                            onChange={(e) => setUrgencyFilter(e.target.value)}
                            className="w-full bg-bg-base border border-card-border rounded-lg p-2 text-[11px] text-primary-text focus:outline-none focus:border-copper-primary"
                          >
                            <option value="all">All Urgency</option>
                            <option value="critical">Critical</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Compact list of Issue Cards */}
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                      {filteredIssues.length === 0 ? (
                        <div className="bg-bg-secondary/40 border border-card-border rounded-3xl p-8 text-center space-y-3">
                          <MapPin className="w-8 h-8 text-steel-gray mx-auto" />
                          <p className="text-xs text-secondary-text">No active reports match the selected filters.</p>
                        </div>
                      ) : (
                        filteredIssues.map((issue) => {
                          const catDetails = getCatLabel(issue.category);
                          const isSelected = selectedIssue?.id === issue.id;

                          return (
                            <div 
                              key={issue.id}
                              onClick={() => setSelectedIssue(issue)}
                              className={`bg-bg-secondary/60 border ${isSelected ? 'border-copper-primary shadow-[0_0_20px_rgba(201,107,44,0.2)]' : 'border-card-border'} rounded-[24px] overflow-hidden hover:border-copper-primary/50 transition-all duration-300 cursor-pointer p-4 space-y-3`}
                            >
                              <div className="relative h-32 rounded-xl overflow-hidden bg-bg-base">
                                <img src={issue.image} alt={issue.title} className="w-full h-full object-cover opacity-80" />
                                <span className={`absolute top-2.5 left-2.5 text-[8px] px-2 py-0.5 rounded-full border font-display ${getUrgencyLabel(issue.urgency)}`}>
                                  {issue.urgency}
                                </span>
                                <span className="absolute bottom-2.5 right-2.5 bg-bg-base/80 backdrop-blur-md text-[8px] px-2 py-0.5 rounded-full border border-card-border font-stats text-sand-gold">
                                  Confidence: {Math.round(issue.aiConfidence * 100)}%
                                </span>
                              </div>

                              <div className="space-y-1">
                                <span className={`text-[8px] uppercase tracking-wider font-bold ${catDetails.color}`}>{catDetails.text}</span>
                                <h4 className="text-xs font-bold text-primary-text line-clamp-1 font-display">{issue.title}</h4>
                                <p className="text-[10px] text-secondary-text line-clamp-2 leading-relaxed">{issue.description}</p>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-card-border text-[10px]">
                                <span className="text-steel-gray font-mono">{issue.location.zone}</span>
                                <span className={`capitalize px-2 py-0.5 rounded-full text-[8px] border font-display ${
                                  issue.status === 'resolved' ? 'bg-success/10 text-success border-success/30' :
                                  issue.status === 'scheduled' ? 'bg-copper-primary/10 text-sand-gold border-copper-primary/30' : 'bg-surface text-secondary-text'
                                }`}>
                                  {issue.status}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[10px] pt-1">
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleVote(issue.id);
                                    }}
                                    className={`flex items-center gap-1.5 px-2 py-1 rounded bg-surface hover:bg-copper-primary/10 border border-card-border transition-all ${issue.votedUserIds.includes('user-current-id') ? 'text-copper-primary border-copper-primary/30' : 'text-secondary-text'}`}
                                  >
                                    <ThumbsUp className="w-3.5 h-3.5" />
                                    <span className="font-stats">{issue.votes}</span>
                                  </button>
                                  
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleVerify(issue.id);
                                    }}
                                    className={`flex items-center gap-1.5 px-2 py-1 rounded bg-surface hover:bg-copper-primary/10 border border-card-border transition-all ${issue.verifiedUserIds.includes('user-current-id') ? 'text-sand-gold border-sand-gold/30' : 'text-secondary-text'}`}
                                  >
                                    <Shield className="w-3.5 h-3.5" />
                                    <span className="font-display">{issue.verifiedUserIds.length} Verified</span>
                                  </button>
                                </div>

                                <span className="text-steel-gray text-[8px] font-mono">{new Date(issue.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                  </div>

                </div>

                {/* Expanded Issue Detail View panel bottom overlay or side view */}
                {selectedIssue && (
                  <div className="bg-bg-secondary/80 border border-copper-primary/30 rounded-[32px] p-8 shadow-2xl space-y-6">
                    <div className="flex flex-col md:flex-row gap-8">
                      {/* Left: Picture and basic facts */}
                      <div className="md:w-1/3 space-y-4">
                        <img src={selectedIssue.image} alt={selectedIssue.title} className="w-full h-48 md:h-64 object-cover rounded-2xl border border-card-border" />
                        
                        <div className="grid grid-cols-2 gap-2 text-center">
                          <div className="bg-bg-base/60 p-3 rounded-xl border border-card-border">
                            <span className="text-[8px] uppercase tracking-wider text-secondary-text block font-display">Est. Repair Budget</span>
                            <span className="text-sm font-extrabold text-sand-gold font-stats">₹{selectedIssue.repairCost.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="bg-bg-base/60 p-3 rounded-xl border border-card-border">
                            <span className="text-[8px] uppercase tracking-wider text-secondary-text block font-display">Est. Repair Time</span>
                            <span className="text-sm font-extrabold text-primary-text font-stats">{selectedIssue.repairDuration}</span>
                          </div>
                        </div>

                        <div className="bg-bg-base/60 p-4 rounded-xl border border-card-border text-[11px] space-y-1.5 font-sans">
                          <div className="flex justify-between">
                            <span className="text-secondary-text">Assigned Unit:</span>
                            <span className="text-primary-text font-bold">{selectedIssue.department}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-secondary-text">Dispatch Officer:</span>
                            <span className="text-primary-text font-bold">{selectedIssue.assignedOfficer || "Pending Dispatch"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Analysis & Discussion */}
                      <div className="flex-1 space-y-6">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border font-display ${getUrgencyLabel(selectedIssue.urgency)}`}>
                              {selectedIssue.urgency}
                            </span>
                            <span className="text-xs text-steel-gray font-mono">FILE #{selectedIssue.id.toUpperCase()}</span>
                          </div>
                          <h3 className="text-xl font-bold text-primary-text font-display">{selectedIssue.title}</h3>
                          <p className="text-xs text-secondary-text leading-relaxed mt-2">{selectedIssue.description}</p>
                        </div>

                        {/* AI Multi-Agent Consensus reasoning display */}
                        <div className="bg-gradient-to-r from-copper-primary/10 to-sand-gold/10 border border-copper-primary/30 p-5 rounded-2xl space-y-3 relative overflow-hidden">
                          <div className="absolute -top-10 -right-10 w-24 h-24 bg-copper-primary/10 rounded-full blur-2xl"></div>
                          
                          <div className="flex items-center gap-2">
                            <Bot className="w-5 h-5 text-sand-gold animate-pulse" />
                            <h4 className="text-xs font-bold text-sand-gold uppercase tracking-wider font-display">Multi-Agent AI Decision Reasoning</h4>
                          </div>

                          <p className="text-[11px] text-secondary-text leading-relaxed italic font-sans">{selectedIssue.aiReasoning}</p>

                          {/* Render agent output modules if available */}
                          {selectedIssue.multiAgentOutputs && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                              {Object.entries(selectedIssue.multiAgentOutputs).map(([key, value]: [string, any]) => (
                                <div key={key} className="bg-bg-base/80 p-2.5 rounded-xl border border-card-border">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] font-bold text-primary-text capitalize font-display">{key.replace('Ai', ' AI')}</span>
                                    <span className="text-[8px] text-success font-stats">{(value.confidence * 100).toFixed(0)}%</span>
                                  </div>
                                  <p className="text-[8px] text-secondary-text line-clamp-2 leading-tight">{value.result}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Comments / Evidence Section */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-primary-text uppercase tracking-wider flex items-center gap-2 font-display">
                            <MessageSquare className="w-4 h-4 text-copper-primary" />
                            <span>Community Timeline & Discussion ({selectedIssue.comments.length})</span>
                          </h4>

                          <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                            {selectedIssue.comments.length === 0 ? (
                              <p className="text-[10px] text-steel-gray italic font-sans">No additional evidence comments submitted yet.</p>
                            ) : (
                              selectedIssue.comments.map((com) => (
                                <div key={com.id} className="bg-bg-base/60 p-3 rounded-xl border border-card-border space-y-1 font-sans">
                                  <div className="flex justify-between text-[10px]">
                                    <span className="font-bold text-copper-primary">{com.author}</span>
                                    <span className="text-steel-gray font-mono">{new Date(com.createdAt).toLocaleTimeString()}</span>
                                  </div>
                                  <p className="text-[11px] text-secondary-text leading-relaxed">{com.text}</p>
                                  {com.evidenceImage && (
                                    <img src={com.evidenceImage} alt="Comment Evidence" className="w-24 h-24 rounded mt-1.5 object-cover border border-card-border" />
                                  )}
                                </div>
                              ))
                            )}
                          </div>

                          <form onSubmit={submitComment} className="flex gap-2">
                            <input 
                              type="text" 
                              placeholder="Add follow-up commentary or verification details..." 
                              className="flex-1 bg-bg-base border border-card-border rounded-xl px-4 py-2.5 text-xs text-primary-text focus:outline-none focus:border-copper-primary font-sans"
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                            />

                            <label className="cursor-pointer bg-surface border border-card-border px-3.5 py-2.5 rounded-xl text-xs hover:bg-bg-secondary flex items-center justify-center transition-colors">
                              <ImageIcon className="w-4 h-4 text-steel-gray" />
                              <input type="file" accept="image/*" className="hidden" onChange={handleCommentEvidenceUpload} />
                            </label>

                            <button type="submit" className="px-4 py-2.5 bg-copper-primary text-primary-text hover:brightness-110 rounded-xl text-xs font-bold transition-all cursor-pointer font-display">
                              <Send className="w-4 h-4" />
                            </button>
                          </form>

                          {commentEvidence && (
                            <div className="flex items-center gap-2 bg-bg-base/60 p-2 rounded-xl border border-copper-primary/30 max-w-xs font-sans">
                              <img src={commentEvidence} alt="Evidence attached" className="w-8 h-8 rounded object-cover" />
                              <span className="text-[10px] text-steel-gray truncate">Evidence Attached.</span>
                              <button onClick={() => setCommentEvidence(null)} className="ml-auto text-rose-500 text-xs hover:underline">Clear</button>
                            </div>
                          )}

                        </div>

                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* PAGE 3: LIVE VECTOR SMART HUD MAP */}
            {activeTab === 'map' && (
              <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-copper-primary font-bold block font-display">LIVE MAP FEED</span>
                    <h2 className="text-xl font-bold font-display text-primary-text">Dynamic HUD Utility District Zoning Overlay</h2>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {['all', 'pothole', 'sanitation', 'streetlight', 'water_leak', 'traffic'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all font-display ${
                          categoryFilter === cat 
                            ? 'bg-copper-primary/20 border-copper-primary text-copper-primary' 
                            : 'bg-bg-secondary/40 border-card-border text-secondary-text hover:text-primary-text'
                        }`}
                      >
                        {cat.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Futuristic SVG Map container */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Map SVG on Left */}
                  <div className="lg:col-span-8 bg-bg-secondary/60 border border-card-border rounded-[32px] p-6 relative overflow-hidden shadow-2xl">
                    
                    {/* Live indicators & Layer selectors */}
                    <div className="absolute top-6 left-6 z-20 flex flex-wrap gap-2 items-center">
                      <div className="bg-bg-base/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-card-border flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-success animate-ping"></div>
                        <span className="text-[10px] font-bold text-primary-text font-display">HUD Grid Connected</span>
                      </div>

                      {/* Map Layer Selectors */}
                      <div className="bg-bg-base/90 backdrop-blur-md p-1 rounded-xl border border-card-border flex gap-1">
                        {[
                          { key: 'standard', label: 'Standard' },
                          { key: 'heatmap', label: 'Heatmap' },
                          { key: 'satellite', label: 'Satellite' },
                          { key: 'flood', label: 'Hydrology' },
                          { key: 'traffic', label: 'Traffic' }
                        ].map(layer => (
                          <button
                            key={layer.key}
                            onClick={() => {
                              setMapLayer(layer.key as any);
                              showToast(`🗺️ Map Layer: ${layer.label} activated!`);
                            }}
                            className={`px-2.5 py-1 text-[9px] font-bold rounded-lg transition-all font-display ${
                              mapLayer === layer.key 
                                ? 'bg-copper-primary text-primary-text' 
                                : 'text-secondary-text hover:text-primary-text'
                            }`}
                          >
                            {layer.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="absolute top-6 right-6 z-20 flex flex-col items-end gap-2">
                      <div className="bg-bg-base/80 backdrop-blur-md px-3 py-1 text-[9px] font-mono rounded border border-card-border text-steel-gray">
                        CURSOR: {mapCursorCoords.x}PX, {mapCursorCoords.y}PX
                      </div>
                      <div className="bg-bg-base/90 backdrop-blur-md p-1 rounded-xl border border-card-border flex gap-1 items-center">
                        <span className="text-[9px] font-bold text-secondary-text px-2 font-display uppercase">Zoom</span>
                        <button
                          onClick={() => {
                            setMapZoom(1);
                            showToast("🔍 Low Zoom Activated: Clustering unresolved tickets by ward.");
                          }}
                          className={`px-2 py-0.5 text-[9px] font-bold rounded-lg transition-all font-display ${
                            mapZoom === 1 ? 'bg-copper-primary text-primary-text shadow-[0_0_10px_rgba(201,107,44,0.4)]' : 'text-secondary-text hover:text-primary-text'
                          }`}
                        >
                          Low (Clustered)
                        </button>
                        <button
                          onClick={() => {
                            setMapZoom(2);
                            showToast("🔍 High Zoom Activated: Viewing individual issue coordinates.");
                          }}
                          className={`px-2 py-0.5 text-[9px] font-bold rounded-lg transition-all font-display ${
                            mapZoom === 2 ? 'bg-copper-primary text-primary-text shadow-[0_0_10px_rgba(201,107,44,0.4)]' : 'text-secondary-text hover:text-primary-text'
                          }`}
                        >
                          High (Detailed)
                        </button>
                      </div>
                    </div>

                    {/* SVG Map Render */}
                    <svg 
                      ref={mapRef}
                      onMouseMove={handleMapMouseMove}
                      className={`w-full h-[400px] md:h-[500px] rounded-2xl border border-card-border relative transition-all duration-300 ${
                        mapLayer === 'satellite' ? 'bg-bg-base' : 'bg-bg-base/95'
                      }`}
                      style={{ backgroundImage: 'radial-gradient(rgba(201,107,44,0.15) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                    >
                      {/* Grid overlays */}
                      <g stroke="rgba(255,255,255,0.03)" strokeWidth="1">
                        <line x1="0" y1="100" x2="1000" y2="100" />
                        <line x1="0" y1="200" x2="1000" y2="200" />
                        <line x1="0" y1="300" x2="1000" y2="300" />
                        <line x1="0" y1="400" x2="1000" y2="400" />
                        <line x1="200" y1="0" x2="200" y2="1000" />
                        <line x1="400" y1="0" x2="400" y2="1000" />
                        <line x1="600" y1="0" x2="600" y2="1000" />
                        <line x1="800" y1="0" x2="800" y2="1000" />
                      </g>

                      {/* Satellite Wireframe grid lines */}
                      {mapLayer === 'satellite' && (
                        <g opacity="0.35" stroke="#10B981" strokeWidth="0.5" fill="none">
                          <circle cx="500" cy="250" r="150" strokeDasharray="3 3" />
                          <circle cx="500" cy="250" r="300" strokeDasharray="5 5" />
                          <line x1="500" y1="0" x2="500" y2="500" />
                          <line x1="0" y1="250" x2="1000" y2="250" />
                          <text x="515" y="270" fill="#10B981" fontSize="8" fontFamily="monospace">SAT_VECTOR_REF_GPS_4</text>
                        </g>
                      )}

                      {/* Vector curves for estuaries & waterways */}
                      <path 
                        d="M 100,500 Q 300,300 600,350 T 1000,100" 
                        fill="none" 
                        stroke={mapLayer === 'flood' ? '#E5A93C' : 'rgba(201,107,44,0.3)'}
                        strokeWidth="24" 
                        strokeLinecap="round"
                        className="animate-pulse"
                      />
                      <path 
                        d="M 100,500 Q 300,300 600,350 T 1000,100" 
                        fill="none" 
                        stroke="rgba(229,169,60,0.2)" 
                        strokeWidth="8" 
                        strokeLinecap="round"
                      />

                      {/* Hydrology & Flood Zone Overlays */}
                      {mapLayer === 'flood' && (
                        <g opacity="0.8" stroke="#E5A93C" strokeWidth="4" fill="none" strokeLinecap="round">
                          <path d="M 50,220 L 950,220" strokeDasharray="10 10" className="animate-pulse" />
                          <path d="M 180,50 L 180,450" strokeDasharray="15 15" />
                          <circle cx="182" cy="230" r="40" fill="#E5A93C" opacity="0.1" stroke="none" />
                          <text x="195" y="225" fill="#E5A93C" fontSize="8" fontWeight="bold" fontFamily="monospace">FLOOD RISK SECTOR #4B</text>
                        </g>
                      )}

                      {/* Traffic congestion overlay */}
                      {mapLayer === 'traffic' && (
                        <g opacity="0.8" strokeWidth="6" fill="none" strokeLinecap="round">
                          <path d="M 0,150 L 1000,150" stroke="#EF4444" />
                          <path d="M 250,0 L 250,1000" stroke="#E5A93C" />
                          <path d="M 0,380 C 300,380 400,200 800,450" stroke="#EF4444" strokeWidth="8" className="animate-pulse" />
                          <text x="265" y="40" fill="#EF4444" fontSize="8" fontWeight="bold" fontFamily="monospace">HIGH CONGESTION ALERT</text>
                        </g>
                      )}

                      {/* Major Commuter Roads layout */}
                      <g stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="none">
                        <path d="M 0,150 L 1000,150" />
                        <path d="M 250,0 L 250,1000" />
                        <path d="M 0,380 C 300,380 400,200 800,450" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                      </g>

                      {/* Ward Boundaries */}
                      <g stroke="rgba(201,107,44,0.2)" strokeWidth="1.5" strokeDasharray="6 4" fill="none">
                        {/* West Ward boundary */}
                        <rect x="10" y="10" width="300" height="240" rx="12" />
                        {/* East Riverfront Ward boundary */}
                        <path d="M 310,10 L 310,480 L 980,480" />
                        {/* South Heights Ward boundary */}
                        <rect x="10" y="260" width="300" height="220" rx="12" stroke="rgba(229,169,60,0.2)" />
                      </g>

                      {/* Ward and Geographic labels */}
                      <g fill="rgba(255,255,255,0.4)" fontSize="9" fontWeight="bold" fontFamily="monospace">
                        <text x="30" y="35">WEST WARD (ZONE A)</text>
                        <text x="30" y="285">SOUTH HEIGHTS WARD (ZONE B)</text>
                        <text x="450" y="80">EAST RIVERFRONT WARD (ZONE C)</text>
                        <text x="620" y="420">SOUTH WEST EXPRESSWAY WARD</text>
                      </g>

                      {/* Yamuna River Label */}
                      <g fill="#E5A93C" opacity="0.4" fontSize="10" fontFamily="sans-serif">
                        <text x="500" y="330" transform="rotate(10 500 330)" className="italic tracking-widest font-semibold">YAMUNA RIVER</text>
                      </g>

                      {/* Road Names */}
                      <g fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="sans-serif">
                        <text x="260" y="100" transform="rotate(90 260 100)">NH-48 EXPRESSWAY</text>
                        <text x="500" y="142">OUTER RING ROAD</text>
                        <text x="450" y="375" transform="rotate(15 450 375)">SURAJKUND BYPASS</text>
                      </g>

                      {/* Metro route and stations */}
                      <g stroke="#E5A93C" strokeWidth="2" strokeDasharray="8 5" fill="none" opacity="0.5">
                        <path d="M 50,450 L 400,450 L 700,100 L 950,100" />
                      </g>
                      <g fill="var(--bg-base)" stroke="#E5A93C" strokeWidth="2">
                        <circle cx="200" cy="450" r="4.5" />
                        <circle cx="500" cy="300" r="4.5" />
                        <circle cx="800" cy="100" r="4.5" />
                      </g>
                      <g fill="rgba(229,169,60,0.75)" fontSize="8" fontFamily="sans-serif" fontWeight="semibold">
                        <text x="175" y="440">🚇 Saket Metro Station</text>
                        <text x="475" y="290">🚇 Nehru Place Metro</text>
                        <text x="765" y="90">🚇 Noida Sec-18 Metro</text>
                      </g>

                      {/* Points of Interest */}
                      <g fill="rgba(244,63,94,0.75)" fontSize="8" fontFamily="sans-serif" fontWeight="semibold">
                        <text x="80" y="80">🏥 Fortis Hospital</text>
                        <text x="750" y="250">🏥 Max Multi-Specialty</text>
                      </g>
                      <g fill="rgba(201,107,44,0.75)" fontSize="8" fontFamily="sans-serif" fontWeight="semibold">
                        <text x="70" y="180">🏫 Delhi Public School</text>
                        <text x="550" y="460">🏫 IIT Delhi</text>
                      </g>
                      <g fill="rgba(251,146,60,0.75)" fontSize="8" fontFamily="sans-serif" fontWeight="semibold">
                        <text x="400" y="180">👮 Malviya Nagar Police Stn</text>
                      </g>
                      <g fill="rgba(45,212,191,0.75)" fontSize="8" fontFamily="sans-serif" fontWeight="semibold">
                        <text x="320" y="50">🏢 Municipal Corporation HQ</text>
                        <text x="120" y="360">🏢 PWD Ward 4 Office</text>
                      </g>

                      {/* Heatmap zones represented visually */}
                      <g opacity="0.15">
                        <circle cx="200" cy="180" r="80" fill="url(#copperGlow)" />
                        <circle cx="650" cy="300" r="110" fill="url(#sandGlow)" />
                      </g>

                      {/* Heatmap Layer Specific Overlays */}
                      {mapLayer === 'heatmap' && (
                        <g opacity="0.35">
                          {filteredIssues.map((iss, index) => {
                            const xFactor = Math.abs(Math.sin(iss.location.lat) * 500) + 100;
                            const yFactor = Math.abs(Math.cos(iss.location.lng) * 300) + 100;
                            return (
                              <g key={`heat-${iss.id}`}>
                                <circle cx={xFactor} cy={yFactor} r="50" fill="url(#redGlow)" />
                                <circle cx={xFactor} cy={yFactor} r="20" fill="url(#copperGlow)" />
                              </g>
                            );
                          })}
                        </g>
                      )}

                      <defs>
                        <radialGradient id="copperGlow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#C96B2C" />
                          <stop offset="100%" stopColor="transparent" />
                        </radialGradient>
                        <radialGradient id="sandGlow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#E5A93C" />
                          <stop offset="100%" stopColor="transparent" />
                        </radialGradient>
                        <radialGradient id="redGlow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#EF4444" />
                          <stop offset="100%" stopColor="transparent" />
                        </radialGradient>
                        <radialGradient id="yellowGlow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#E5A93C" />
                          <stop offset="100%" stopColor="transparent" />
                        </radialGradient>
                      </defs>

                      {/* Map HUD Clustered vs Detailed Layers */}
                      <AnimatePresence mode="wait">
                        {mapZoom === 1 ? (
                          // LOW ZOOM CLUSTER MARKERS WITH SPRING INTRODUCTIONS
                          <motion.g
                            key="zoom-clustered"
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            variants={{
                              initial: { opacity: 0 },
                              animate: { opacity: 1, transition: { staggerChildren: 0.05 } },
                              exit: { opacity: 0 }
                            }}
                          >
                            {getClusteredWards().map((cluster) => {
                              if (cluster.count === 0) return null; // Only show active/unresolved issue areas
                              const { x, y, label, color, glow } = cluster.center;
                              const isUrgent = cluster.urgency === 'critical' || cluster.urgency === 'high';
                              const pulseColor = cluster.urgency === 'critical' ? '#EF4444' : (cluster.urgency === 'high' ? '#C96B2C' : '#E5A93C');
                              
                              return (
                                <motion.g 
                                  key={cluster.name} 
                                  variants={{
                                    initial: { opacity: 0, scale: 0.3, y: y + 20 },
                                    animate: { opacity: 1, scale: 1, y: y },
                                    exit: { opacity: 0, scale: 0.3, y: y + 20 }
                                  }}
                                  transition={{ type: "spring", stiffness: 100, damping: 15 }}
                                  onClick={() => {
                                    setMapZoom(2);
                                    if (cluster.issues.length > 0) {
                                      setSelectedIssue(cluster.issues[0]);
                                    }
                                    showToast(`🔍 Zoomed into ${cluster.name}: Viewing ${cluster.count} individual markers.`);
                                  }}
                                  className="cursor-pointer group"
                                  style={{ transformOrigin: `${x}px ${y}px` }}
                                >
                                  {/* Glowing outer aura */}
                                  <circle 
                                    cx={x} 
                                    cy={y} 
                                    r="48" 
                                    fill={glow} 
                                    opacity="0.35"
                                    className="animate-pulse"
                                  />
                                  {/* Secondary telemetry ring */}
                                  <circle 
                                    cx={x} 
                                    cy={y} 
                                    r="32" 
                                    fill="none" 
                                    stroke={pulseColor} 
                                    strokeWidth="2" 
                                    strokeDasharray={isUrgent ? "4 3" : "none"}
                                    opacity="0.4"
                                    className="animate-spin animate-duration-10000"
                                  />
                                  {/* Main clustered center dot */}
                                  <circle 
                                    cx={x} 
                                    cy={y} 
                                    r="18" 
                                    fill="var(--bg-base)" 
                                    stroke={color} 
                                    strokeWidth="2.5" 
                                    className="group-hover:scale-110 transition-transform origin-center"
                                  />
                                  {/* Active Unresolved Count */}
                                  <text 
                                    x={x} 
                                    y={y + 4} 
                                    textAnchor="middle" 
                                    fill="#FFF" 
                                    fontSize="11" 
                                    fontWeight="bold"
                                    fontFamily="monospace"
                                  >
                                    {cluster.count}
                                  </text>

                                  {/* Floating HUD Tag label */}
                                  <g opacity="0.85" className="group-hover:opacity-100 transition-opacity">
                                    <rect 
                                      x={x - 55} 
                                      y={y - 45} 
                                      width="110" 
                                      height="18" 
                                      rx="9" 
                                      fill="var(--bg-secondary)" 
                                      stroke={color} 
                                      strokeWidth="1" />
                                    <text 
                                      x={x} 
                                      y={y - 33} 
                                      textAnchor="middle" 
                                      fill="#FFF" 
                                      fontSize="8" 
                                      fontWeight="bold"
                                      fontFamily="sans-serif"
                                      className="uppercase tracking-wider"
                                    >
                                      {label}
                                    </text>
                                  </g>
                                </motion.g>
                              );
                            })}
                          </motion.g>
                        ) : (
                          // HIGH ZOOM INDIVIDUAL MARKERS GRACEFULLY EXPANDING FROM WARD CENTERS
                          <motion.g
                            key="zoom-detailed"
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            variants={{
                              initial: { opacity: 0 },
                              animate: { opacity: 1, transition: { staggerChildren: 0.02 } },
                              exit: { opacity: 0 }
                            }}
                          >
                            {filteredIssues.map((iss, index) => {
                              const xFactor = Math.abs(Math.sin(iss.location.lat) * 500) + 100;
                              const yFactor = Math.abs(Math.cos(iss.location.lng) * 300) + 100;
                              const isPinnedSelected = selectedIssue?.id === iss.id;
                              
                              const wardName = normalizeZone(iss.location.zone);
                              const wardCenter = wardCenters[wardName] || { x: 500, y: 250 };

                              return (
                                <g 
                                  key={iss.id} 
                                  onClick={() => setSelectedIssue(iss)}
                                  onMouseEnter={() => setHoveredIssue(iss)}
                                  onMouseLeave={() => setHoveredIssue(null)}
                                  className="cursor-pointer group"
                                >
                                  {/* Animated Outer Pulse Ring */}
                                  <motion.circle 
                                    initial={{ cx: wardCenter.x, cy: wardCenter.y, r: 0, opacity: 0 }}
                                    animate={{ 
                                      cx: xFactor, 
                                      cy: yFactor, 
                                      r: isPinnedSelected ? 18 : 10, 
                                      opacity: 0.6 
                                    }}
                                    exit={{ cx: wardCenter.x, cy: wardCenter.y, r: 0, opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 80, damping: 14 }}
                                    fill="none" 
                                    stroke={iss.urgency === 'critical' ? '#EF4444' : '#C96B2C'} 
                                    strokeWidth="1.5" 
                                    opacity="0.6"
                                    className="animate-pulse animate-duration-1000"
                                  />
                                  {/* Target Pin dot */}
                                  <motion.circle 
                                    initial={{ cx: wardCenter.x, cy: wardCenter.y, r: 0 }}
                                    animate={{ 
                                      cx: xFactor, 
                                      cy: yFactor, 
                                      r: isPinnedSelected ? 7 : 5 
                                    }}
                                    exit={{ cx: wardCenter.x, cy: wardCenter.y, r: 0 }}
                                    transition={{ type: "spring", stiffness: 80, damping: 14 }}
                                    fill={iss.urgency === 'critical' ? '#EF4444' : '#E5A93C'}
                                    className="group-hover:scale-125 transition-transform origin-center"
                                    style={{ transformOrigin: `${xFactor}px ${yFactor}px` }}
                                  />
                                </g>
                              );
                            })}
                          </motion.g>
                        )}
                      </AnimatePresence>

                    </svg>

                    {/* Hover Floating HUD Tooltip */}
                    {hoveredIssue && (
                      <div 
                        className="absolute bg-bg-secondary/95 border border-copper-primary/40 p-4 rounded-2xl shadow-[0_0_20px_rgba(201,107,44,0.3)] z-30 pointer-events-none backdrop-blur-md max-w-xs space-y-2 transition-all duration-150"
                        style={{ 
                          left: `${Math.min(500, mapCursorCoords.x + 20)}px`, 
                          top: `${Math.min(400, mapCursorCoords.y + 20)}px` 
                        }}
                      >
                        <div className="flex justify-between items-center text-[9px] font-display">
                          <span className="text-sand-gold font-mono font-bold uppercase">{hoveredIssue.category}</span>
                          <span className="text-steel-gray font-mono">ID: {hoveredIssue.id.slice(-4).toUpperCase()}</span>
                        </div>
                        <h5 className="text-xs font-bold text-primary-text leading-tight font-display">{hoveredIssue.title}</h5>
                        <p className="text-[10px] text-secondary-text font-mono leading-tight">{hoveredIssue.location.address}</p>
                        <div className="flex justify-between items-center text-[9px] pt-1 border-t border-card-border font-display">
                          <span className="text-rose-500 uppercase font-bold">{hoveredIssue.urgency}</span>
                          <span className="text-success font-bold font-stats">₹{hoveredIssue.repairCost.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* District hotspot info panels on Right */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-bg-secondary/60 border border-card-border rounded-3xl p-6 space-y-4 shadow-xl">
                      <span className="text-[10px] uppercase tracking-wider text-copper-primary font-bold block font-display">ACTIVE DISTRICT ANALYTICS</span>
                      <h4 className="text-sm font-bold text-primary-text font-display">Zone Severity Rankings</h4>

                      <div className="space-y-3">
                        {[
                          { name: "West Ward", count: issues.filter(i => normalizeZone(i.location.zone) === 'West Ward').length, color: "bg-copper-primary" },
                          { name: "East Riverfront Ward", count: issues.filter(i => normalizeZone(i.location.zone) === 'East Riverfront Ward').length, color: "bg-sand-gold" },
                          { name: "South Heights Ward", count: issues.filter(i => normalizeZone(i.location.zone) === 'South Heights Ward').length, color: "bg-rose-500" },
                          { name: "South West Expressway", count: issues.filter(i => normalizeZone(i.location.zone) === 'South West Expressway').length, color: "bg-yellow-500" }
                        ].map((zone) => (
                          <div key={zone.name} className="p-3 bg-bg-base/40 rounded-xl border border-card-border flex justify-between items-center transition-all hover:bg-bg-base/70">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${zone.color}`}></span>
                              <span className="text-xs text-primary-text font-sans font-medium">{zone.name}</span>
                            </div>
                            <span className="text-[10px] bg-surface border border-card-border px-2.5 py-0.5 rounded text-secondary-text font-stats">{zone.count} Tickets</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* HUD Map Quick legend explanation */}
                    <div className="bg-bg-secondary/60 border border-card-border rounded-3xl p-6 text-xs text-secondary-text leading-relaxed shadow-xl font-sans">
                      <p className="font-bold text-primary-text mb-2 font-display">How to Navigate the Smart City Grid:</p>
                      <ul className="space-y-1.5 list-disc pl-4">
                        <li>Vector lines represent core transit arteries and water supply corridors.</li>
                        <li>Pulsing rings highlight verified hazard zones requiring direct attention.</li>
                        <li>Hovering over coordinates maps active municipal telemetry feeds.</li>
                      </ul>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* PAGE 4: CITIZEN HERO GAMIFICATION PROGRAM */}
            {activeTab === 'leaderboard' && (
              <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
                
                {/* Gamified Profile Header card */}
                <div className="bg-gradient-to-r from-copper-primary/10 via-sand-gold/5 to-transparent border border-card-border rounded-[40px] p-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl">
                  <div className="relative">
                    <img src={userProfile.avatar} alt="Citizen Avatar" className="w-24 h-24 rounded-3xl border-2 border-copper-primary bg-bg-base" />
                    <span className="absolute -bottom-2 -right-2 bg-copper-primary text-xs font-bold px-3 py-1 rounded-full border border-bg-base font-display text-primary-text">
                      LVL {userProfile.level}
                    </span>
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-bold font-display text-primary-text">{userProfile.name}</h3>
                      <span className="text-xs bg-copper-primary/10 text-sand-gold border border-copper-primary/30 px-3 py-0.5 rounded-full uppercase tracking-wider font-bold font-display">
                        Global Rank #{userProfile.rank}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 text-xs text-secondary-text font-sans">
                      <div>
                        <span>Weekly Contribution: </span>
                        <span className="text-primary-text font-bold font-stats">{userProfile.weeklyContribution} XP</span>
                      </div>
                      <div>
                        <span>Total Level Progress: </span>
                        <span className="text-primary-text font-bold font-stats">{userProfile.xp} / {userProfile.level * 200} XP</span>
                      </div>
                    </div>

                    {/* Custom level progress bar */}
                    <div className="w-full h-2 bg-surface rounded-full overflow-hidden border border-card-border">
                      <div className="h-full bg-gradient-to-r from-copper-primary to-sand-gold" style={{ width: `${(userProfile.xp / (userProfile.level * 200)) * 100}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Grid for badges on Left, Weekly Challenges on Right */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Unlocked Badges */}
                  <div className="lg:col-span-8 bg-bg-secondary/60 border border-card-border rounded-[32px] p-8 space-y-6 shadow-2xl">
                    <span className="text-[10px] uppercase tracking-wider text-copper-primary font-bold block font-display">HONORS & DECORATIONS</span>
                    <h4 className="text-lg font-bold text-primary-text font-display">Unlocked Visual Achievements</h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {userProfile.badges.map((b) => (
                        <div key={b.id} className="bg-bg-base/40 border border-card-border rounded-2xl p-5 text-center space-y-3 relative overflow-hidden transition-all hover:border-copper-primary/40">
                          <div className={`w-14 h-14 rounded-full bg-gradient-to-tr ${b.color} flex items-center justify-center text-3xl mx-auto shadow-lg`}>
                            {b.icon}
                          </div>
                          <h5 className="text-xs font-extrabold text-primary-text font-display">{b.name}</h5>
                          <p className="text-[10px] text-secondary-text leading-relaxed font-sans">{b.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Leaderboard panel */}
                  <div className="lg:col-span-4 bg-bg-secondary/60 border border-card-border rounded-[32px] p-6 space-y-4 shadow-2xl">
                    <h4 className="text-sm font-bold text-primary-text flex items-center justify-between font-display">
                      <span>Monthly Contributor Leaderboard</span>
                      <Trophy className="w-4 h-4 text-sand-gold" />
                    </h4>

                    <div className="space-y-2">
                      {[
                        { name: "Elena Rostova", lvl: 8, points: "4,250 XP", rank: 1, avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Elena" },
                        { name: "Chief Sarah Jenkins", lvl: 10, points: "3,980 XP", rank: 2, avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Sarah" },
                        { name: "Marcus Aurelius", lvl: 4, points: "2,450 XP", rank: 3, avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Marcus" },
                        { name: "Gopika Randhawa", lvl: 5, points: "1,880 XP", rank: 12, avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Gopika" }
                      ].map((lead) => (
                        <div 
                          key={lead.name}
                          className={`p-3 rounded-2xl flex items-center gap-3 border transition-all ${lead.name === userProfile.name ? 'bg-copper-primary/10 border-copper-primary/30' : 'bg-bg-base/30 border-card-border'}`}
                        >
                          <span className="text-xs font-stats font-bold text-steel-gray w-4">{lead.rank}</span>
                          <img src={lead.avatar} alt="Leaderboard Item" className="w-8 h-8 rounded-lg bg-bg-base" />
                          <div className="flex-1 font-sans">
                            <div className="flex justify-between">
                              <span className="text-xs font-bold text-primary-text">{lead.name}</span>
                              <span className="text-xs font-stats text-success">{lead.points}</span>
                            </div>
                            <span className="text-[9px] text-secondary-text">Level {lead.lvl} Citizen Specialist</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* XP Reward Store */}
                <div className="bg-bg-secondary/60 border border-card-border rounded-[32px] p-8 space-y-6 shadow-2xl">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-copper-primary font-bold block font-display">REWARD STORE</span>
                    <h3 className="text-lg font-bold text-primary-text font-display">Trade XP for Smart Transit Rewards</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { title: "₹100 Delhi Metro Card Recharge", cost: "400 XP", desc: "Direct top-up to your smart transit travel card. Valid across all Metro lines and connected feeder buses.", badge: "Metro Commuter" },
                      { title: "UPI Cashback Voucher (₹50)", cost: "250 XP", desc: "Secure cashback sent straight to your UPI account (GPay/PhonePe/Paytm) as a token of gratitude.", badge: "UPI Cashback" },
                      { title: "Community Hero Certificate & Trophy", cost: "1000 XP", desc: "An official digital/physical Certificate of Honor signed by the Municipal Commissioner along with a beautiful glass trophy.", badge: "Municipal Hero" }
                    ].map((item, idx) => (
                      <div key={idx} className="bg-bg-base/40 border border-card-border rounded-2xl p-6 flex flex-col justify-between transition-all hover:border-copper-primary/30">
                        <div>
                          <span className="text-[9px] uppercase tracking-wider text-copper-primary font-bold block mb-1 font-display">{item.badge}</span>
                          <h4 className="text-sm font-bold text-primary-text mb-2 font-display">{item.title}</h4>
                          <p className="text-xs text-secondary-text leading-relaxed mb-4 font-sans">{item.desc}</p>
                        </div>
                        
                        <div className="flex justify-between items-center pt-4 border-t border-card-border">
                          <span className="text-xs font-bold text-copper-primary font-stats">{item.cost}</span>
                          <button 
                            onClick={() => {
                              showToast("Voucher generated! Check your email inbox for validation tokens.");
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-surface hover:bg-bg-secondary text-[10px] font-bold text-primary-text transition-all border border-card-border cursor-pointer font-display"
                          >
                            Redeem Reward
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* PAGE 5: GOVERNMENT PORTAL / COMMAND CENTER */}
            {activeTab === 'government' && (
              <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-rose-400 font-bold block">OFFICIAL COMMAND CONTROL</span>
                    <h2 className="text-2xl font-bold text-white">Agency Workflow Allocation Center</h2>
                  </div>

                  <div className="bg-black/30 px-4 py-2 rounded-xl border border-white/5 text-xs text-[#B8C2D1] flex items-center gap-4">
                    <div>
                      <span>Dispatch Backlog: </span>
                      <span className="text-white font-bold">{issues.filter(i => i.status === 'reported').length} Tickets</span>
                    </div>
                    <div>
                      <span>Scheduled Repairs: </span>
                      <span className="text-white font-bold">{issues.filter(i => i.status === 'scheduled').length} Tickets</span>
                    </div>
                  </div>
                </div>

                {/* Dispatch Grid List */}
                <div className="bg-[#121826]/40 border border-white/5 rounded-[32px] p-8 space-y-6">
                  <h3 className="text-base font-bold text-white mb-2">Unassigned & active reported issues requiring official dispatch</h3>

                  <div className="space-y-4">
                    {issues.map((issue) => (
                      <div key={issue.id} className="p-6 bg-black/40 border border-white/5 rounded-2xl flex flex-col md:flex-row justify-between gap-6 hover:border-purple-500/20 transition-all">
                        
                        <div className="flex items-start gap-4 flex-1">
                          <img src={issue.image} alt={issue.title} className="w-20 h-20 rounded-xl object-cover border border-white/5 shrink-0" />
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className={`text-[8px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${getUrgencyLabel(issue.urgency)}`}>
                                {issue.urgency}
                              </span>
                              <span className="text-[10px] text-gray-500 font-mono">ID: {issue.id.toUpperCase()}</span>
                            </div>
                            <h4 className="text-sm font-bold text-white">{issue.title}</h4>
                            <p className="text-xs text-[#B8C2D1] line-clamp-2">{issue.description}</p>
                          </div>
                        </div>

                        {/* Agency Actions */}
                        <div className="flex flex-wrap md:flex-col justify-between md:items-end gap-3 shrink-0">
                          <div className="space-y-1 md:text-right">
                            <span className="text-[9px] uppercase tracking-wider text-gray-400 block">Responsible Department</span>
                            <span className="text-xs font-bold text-[#22D3EE]">{issue.department}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {issue.status === 'reported' && (
                              <button
                                onClick={() => updateIssueStatusByAdmin(issue.id, { 
                                  status: 'scheduled', 
                                  assignedOfficer: "Sergeant Carter",
                                  repairCost: issue.repairCost || 500,
                                  repairDuration: issue.repairDuration || "12 hours"
                                })}
                                className="px-4 py-2 bg-[#7C3AED] hover:bg-purple-600 rounded-lg text-xs font-bold text-white transition-all cursor-pointer"
                              >
                                Approve & Dispatch Officer
                              </button>
                            )}

                            {issue.status === 'scheduled' && (
                              <button
                                onClick={() => updateIssueStatusByAdmin(issue.id, { status: 'resolving' })}
                                className="px-4 py-2 bg-[#FBBF24] hover:bg-amber-500 rounded-lg text-xs font-bold text-black transition-all cursor-pointer"
                              >
                                Mark Active Resolving
                              </button>
                            )}

                            {issue.status === 'resolving' && (
                              <button
                                onClick={() => updateIssueStatusByAdmin(issue.id, { status: 'resolved' })}
                                className="px-4 py-2 bg-[#34D399] hover:bg-emerald-400 rounded-lg text-xs font-bold text-black transition-all cursor-pointer"
                              >
                                Certify Resolved
                              </button>
                            )}

                            {issue.status === 'resolved' && (
                              <span className="text-xs text-[#34D399] font-bold flex items-center gap-1.5 bg-[#34D399]/10 border border-[#34D399]/30 px-3 py-1 rounded-lg">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Completed & Archived</span>
                              </span>
                            )}
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* PAGE 6: HIGH-FIDELITY PERFORMANCE ANALYTICS & ENVIRONMENTAL IMPACT */}
            {activeTab === 'analytics' && (
              <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12 px-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-card-border pb-6">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-copper-primary font-bold block font-display">REAL-TIME TELEMETRY</span>
                    <h2 className="text-2xl font-bold text-primary-text font-display">Smart City Operating System Performance KPIs</h2>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => showToast("📊 Generating custom analytics CSV dispatch report...")} className="px-4 py-2 bg-surface hover:bg-bg-secondary rounded-xl border border-card-border text-xs font-semibold text-primary-text transition-all font-display">
                      Export Raw CSV
                    </button>
                    <button onClick={() => showToast("📈 Municipal health trend data synchronized.")} className="px-4 py-2 bg-copper-primary/10 border border-copper-primary/30 text-sand-gold rounded-xl text-xs font-bold transition-all font-display">
                      Sync Telemetry Feeds
                    </button>
                  </div>
                </div>

                {/* KPI Cards Grid with circular progress SVGs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: "AI Dispatch Accuracy", value: "98.2%", target: "Target: >95.0%", sub: "1,248 routed tickets verified", stroke: "var(--copper-primary)", percent: 98 },
                    { label: "Avg Resolution Rate", value: "94.6%", target: "Target: >90.0%", sub: "Completed under 48 hours", stroke: "var(--sand-gold)", percent: 95 },
                    { label: "Citizen Satisfaction Index", value: "91.4%", target: "Target: >85.0%", sub: "Based on 320 community reviews", stroke: "var(--copper-primary)", percent: 91 },
                    { label: "Municipal Budget Savings", value: "₹12.4 Lakh", target: "Projected: ₹15.0 Lakh", sub: "Proactive mitigation offset", stroke: "var(--sand-gold)", percent: 82 }
                  ].map((kpi, index) => (
                    <div key={index} className="bg-bg-secondary/60 border border-card-border rounded-3xl p-6 flex items-center justify-between shadow-xl transition-all hover:border-copper-primary/30">
                      <div className="space-y-1">
                        <span className="text-[10px] text-secondary-text font-bold block uppercase tracking-wider font-display">{kpi.label}</span>
                        <h3 className="text-2xl font-extrabold text-primary-text font-stats">{kpi.value}</h3>
                        <span className="text-[9px] text-success font-semibold block font-sans">{kpi.target}</span>
                        <span className="text-[9px] text-secondary-text block font-sans">{kpi.sub}</span>
                      </div>
                      
                      {/* circular progress svg */}
                      <div className="relative w-16 h-16 shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="32" cy="32" r="26" stroke="rgba(255,255,255,0.05)" strokeWidth="4" fill="transparent" />
                          <circle cx="32" cy="32" r="26" stroke={kpi.stroke} strokeWidth="4" fill="transparent" 
                            strokeDasharray="163.3" strokeDashoffset={163.3 - (163.3 * kpi.percent) / 100} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-primary-text font-stats">
                          {kpi.percent}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chart Block using pure elegant SVG lines */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left: 14-Day Performance Graph */}
                  <div className="lg:col-span-8 bg-bg-secondary/60 border border-card-border rounded-[32px] p-8 space-y-6 shadow-2xl">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-copper-primary font-bold block font-display">INCIDENT LIFECYCLE</span>
                        <h3 className="text-lg font-bold text-primary-text font-display">Active Backlog vs. Resolution Trend</h3>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-secondary-text font-display">
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-copper-primary rounded-full"></span> Resolved</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-sand-gold rounded-full"></span> Active Backlog</span>
                      </div>
                    </div>

                    {/* SVG Line Chart */}
                    <div className="relative pt-4">
                      <svg viewBox="0 0 700 200" className="w-full h-48">
                        {/* Grids */}
                        <g stroke="rgba(255,255,255,0.03)" strokeWidth="1">
                          <line x1="0" y1="50" x2="700" y2="50" />
                          <line x1="0" y1="100" x2="700" y2="100" />
                          <line x1="0" y1="150" x2="700" y2="150" />
                          <line x1="100" y1="0" x2="100" y2="200" />
                          <line x1="200" y1="0" x2="200" y2="200" />
                          <line x1="300" y1="0" x2="300" y2="200" />
                          <line x1="400" y1="0" x2="400" y2="200" />
                          <line x1="500" y1="0" x2="500" y2="200" />
                          <line x1="600" y1="0" x2="600" y2="200" />
                        </g>

                        {/* Resolved Line (Copper) */}
                        <path 
                          d="M 0,160 L 100,140 L 200,150 L 300,110 L 400,90 L 500,60 L 600,40 L 700,20" 
                          fill="none" 
                          stroke="var(--copper-primary)" 
                          strokeWidth="3.5" 
                          strokeLinecap="round"
                        />
                        {/* Active Line (Sand Gold) */}
                        <path 
                          d="M 0,110 L 100,120 L 200,80 L 300,95 L 400,60 L 500,65 L 600,45 L 700,35" 
                          fill="none" 
                          stroke="var(--sand-gold)" 
                          strokeWidth="2.5" 
                          strokeLinecap="round"
                          strokeDasharray="4 4"
                        />
                        {/* Dots */}
                        <circle cx="300" cy="110" r="4.5" fill="var(--copper-primary)" />
                        <circle cx="500" cy="60" r="4.5" fill="var(--copper-primary)" />
                        <circle cx="600" cy="40" r="4.5" fill="var(--copper-primary)" />
                      </svg>
                      {/* X-Axis labels */}
                      <div className="flex justify-between text-[8px] font-mono text-steel-gray pt-2 px-1">
                        <span>Wk 22</span>
                        <span>Wk 23</span>
                        <span>Wk 24</span>
                        <span>Wk 25</span>
                        <span>Wk 26 (Current)</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Environmental Impact Board */}
                  <div className="lg:col-span-4 bg-bg-secondary/80 border border-card-border rounded-[32px] p-6 space-y-4 shadow-2xl">
                    <span className="text-[10px] uppercase tracking-wider text-copper-primary font-bold block font-display">ECO IMPACT TICKER</span>
                    <h4 className="text-sm font-bold text-primary-text font-display">Sustainability Dividend Metrics</h4>

                    <div className="space-y-3 font-sans">
                      {[
                        { label: "Fresh water loss prevented", value: "248,500 Gallons", desc: "Via proactive hydraulic shutoff routing", icon: "💧" },
                        { label: "Biohazard dumping contained", value: "1,450 kg Spills", desc: "Chemical extraction from Waterfront Wetlands", icon: "🌱" },
                        { label: "Carbon offset saved", value: "14.2 Metric Tons", desc: "Using optimized electric vehicle service routing", icon: "⚡" }
                      ].map((eco, idx) => (
                        <div key={idx} className="p-4 bg-bg-base/30 rounded-2xl border border-card-border space-y-1 transition-all hover:border-copper-primary/20">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{eco.icon}</span>
                            <div>
                              <span className="text-xs font-bold text-primary-text block font-stats">{eco.value}</span>
                              <span className="text-[9px] text-copper-primary block font-mono uppercase font-bold font-display">{eco.label}</span>
                            </div>
                          </div>
                          <p className="text-[10px] text-secondary-text pt-1.5 border-t border-card-border leading-relaxed font-sans">{eco.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Department Efficiency comparison table */}
                <div className="bg-bg-secondary/60 border border-card-border rounded-[32px] p-8 space-y-4 shadow-2xl">
                  <h3 className="text-sm font-bold text-primary-text flex items-center gap-2 font-display">
                    <ShieldCheck className="w-4 h-4 text-copper-primary" />
                    <span>Department response time & budget utilization leaderboard</span>
                  </h3>

                  <div className="space-y-3 font-sans">
                    {[
                      { name: "Municipal Water Supply Board (DJB)", response: "1.2 Days", satisfaction: "94.8%", budgetUsed: "₹4.5 Crore", efficiency: "Excellent", bar: "w-[94%]" },
                      { name: "Public Works Department (PWD)", response: "1.8 Days", satisfaction: "91.2%", budgetUsed: "₹12.8 Crore", efficiency: "Optimal", bar: "w-[91%]" },
                      { name: "Municipal Electricity & Lighting Board", response: "1.5 Days", satisfaction: "89.5%", budgetUsed: "₹1.5 Crore", efficiency: "Optimal", bar: "w-[89%]" },
                      { name: "Municipal Corporation Sanitation Dept", response: "2.3 Days", satisfaction: "88.0%", budgetUsed: "₹2.2 Crore", efficiency: "Nominal", bar: "w-[88%]" }
                    ].map((dept, index) => (
                      <div key={index} className="p-4 bg-bg-base/40 border border-card-border rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4 transition-all hover:bg-bg-base/70">
                        <div className="space-y-1 md:w-1/3">
                          <span className="text-xs font-extrabold text-primary-text block font-display">{dept.name}</span>
                          <span className="text-[9px] bg-copper-primary/10 text-sand-gold border border-copper-primary/30 px-2 py-0.5 rounded uppercase tracking-wider font-bold font-display">
                            Avg Response: {dept.response}
                          </span>
                        </div>

                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between text-[10px] text-secondary-text">
                            <span>SLA Target Achieved: {dept.satisfaction}</span>
                            <span className="text-primary-text font-semibold font-mono">{dept.efficiency}</span>
                          </div>
                          <div className="w-full h-2 bg-surface rounded-full overflow-hidden border border-card-border">
                            <div className="h-full bg-gradient-to-r from-copper-primary to-sand-gold" style={{ width: dept.satisfaction }}></div>
                          </div>
                        </div>

                        <div className="shrink-0 md:text-right">
                          <span className="text-[9px] uppercase tracking-wider text-steel-gray block font-display">Budget Expended</span>
                          <span className="text-xs font-bold text-primary-text font-stats">{dept.budgetUsed}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 7: HIGH-FIDELITY INTERACTIVE FLASH CARDS ACADEMY */}
            {activeTab === 'flashcards' && (
              <div className="max-w-7xl mx-auto px-4">
                <CivicFlashCards
                  addXp={addXp}
                  showToast={showToast}
                  userProfileXp={userProfile.xp}
                  userProfileLvl={userProfile.level}
                />
              </div>
            )}

            {/* PAGE 8: AI ROAD GUARDIAN */}
            {activeTab === 'roadguardian' && (
              <div className="max-w-7xl mx-auto px-4">
                <RoadGuardian
                  issues={issues}
                  showToast={showToast}
                  addXp={addXp}
                />
              </div>
            )}

          </main>

        </div>
      </div>

      {/* Floating Gemini AI Chat Copilot Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        
        {/* Toggle Button */}
        <button 
          onClick={() => setChatOpen(!chatOpen)}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#FB7185] hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.5)] cursor-pointer"
          title="CivicFix AI Copilot"
        >
          <Bot className="w-6 h-6 text-white" />
        </button>

        {chatOpen && (
          <div className="absolute bottom-16 right-0 w-[350px] md:w-[400px] h-[500px] rounded-[32px] bg-[#121826]/95 border border-purple-500/20 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden animate-fade-in z-50">
            {/* Header */}
            <div className="p-4 bg-[#7C3AED]/10 border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-cyan-400" />
                <div>
                  <h4 className="text-xs font-extrabold text-white">CivicFix AI Copilot</h4>
                  <span className="text-[8px] uppercase tracking-wider text-[#B8C2D1]">Powered by Gemini 3.5</span>
                </div>
              </div>
              <button 
                onClick={() => setChatOpen(false)}
                className="text-gray-400 hover:text-white text-xs font-bold"
              >
                Close
              </button>
            </div>

            {/* Message Feed */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {chatHistory.map((h, i) => (
                <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-2xl max-w-[80%] text-[11px] leading-relaxed ${
                    h.role === 'user' 
                      ? 'bg-[#7C3AED] text-white rounded-tr-none shadow-md' 
                      : 'bg-white/5 text-[#B8C2D1] rounded-tl-none border border-white/5'
                  }`}>
                    {h.content}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/5 p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 text-[#22D3EE] animate-spin" />
                    <span className="text-[10px] text-[#B8C2D1]">AI Copilot formulating explanation...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Query Shortcuts */}
            <div className="p-3 bg-black/20 border-t border-white/5 flex gap-1.5 overflow-x-auto shrink-0">
              {[
                "Why was Broadway pothole critical?",
                "How do AI agents collaborate?",
                "How do I unlock Eco Guardian badge?"
              ].map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setChatInput(q);
                  }}
                  className="bg-white/5 hover:bg-white/10 text-[9px] text-[#B8C2D1] px-2.5 py-1 rounded-full border border-white/5 whitespace-nowrap"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={sendChatMessage} className="p-3 bg-black/40 border-t border-white/5 flex gap-2">
              <input 
                type="text" 
                placeholder="Ask about city health, hazardous predictions..." 
                className="flex-1 bg-[#121826] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#7C3AED]"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button 
                type="submit"
                disabled={chatLoading}
                className="p-2.5 rounded-xl bg-[#7C3AED] hover:bg-purple-600 text-white transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Judges' Live Simulation Dashboard Overlay */}
        {demoActive && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-[#121826] border border-purple-500/30 w-full max-w-2xl rounded-[32px] p-8 shadow-[0_0_50px_rgba(124,58,237,0.4)] relative overflow-hidden space-y-6">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-cyan-400 font-bold block">AUTOMATED HACKATHON PROTOCOL</span>
                  <h3 className="text-xl font-bold text-white">Judges' Operating System Simulation</h3>
                </div>
                <button 
                  onClick={() => setDemoActive(false)} 
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center text-sm font-bold transition-all"
                >
                  ✕
                </button>
              </div>

              {/* Progress Stepper */}
              <div className="grid grid-cols-6 gap-2">
                {[
                  { step: 1, label: "Report" },
                  { step: 2, label: "Trigger" },
                  { step: 3, label: "AI Analysis" },
                  { step: 4, label: "Dispatch" },
                  { step: 5, label: "Resolving" },
                  { step: 6, label: "Resolved" }
                ].map((s) => (
                  <div key={s.step} className="space-y-1">
                    <div className={`h-1.5 rounded-full transition-all duration-500 ${
                      demoStep >= s.step 
                        ? 'bg-gradient-to-r from-[#7C3AED] to-[#FB7185]' 
                        : 'bg-white/5'
                    }`}></div>
                    <span className={`text-[8px] block font-mono uppercase font-bold text-center ${
                      demoStep === s.step ? 'text-[#22D3EE]' : 'text-gray-500'
                    }`}>{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Active Step Card */}
              <div className="p-5 bg-black/40 rounded-2xl border border-white/5 flex gap-4 items-center animate-pulse">
                <div className="w-12 h-12 rounded-xl bg-[#7C3AED]/20 border border-purple-500/30 flex items-center justify-center text-xl text-cyan-400 shrink-0">
                  {demoStep === 1 && "✍️"}
                  {demoStep === 2 && "🤖"}
                  {demoStep === 3 && "🧠"}
                  {demoStep === 4 && "📋"}
                  {demoStep === 5 && "🛠️"}
                  {demoStep === 6 && "🎉"}
                  {demoStep === 7 && "✅"}
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-white">
                    {demoStep === 1 && "Step 1: Snapping high-res citizen report evidence..."}
                    {demoStep === 2 && "Step 2: Activating smart multi-agent orchestration..."}
                    {demoStep === 3 && "Step 3: Vision, Geo & Budget AI reach consensus..."}
                    {demoStep === 4 && "Step 4: Scheduling & municipal fleet dispatched..."}
                    {demoStep === 5 && "Step 5: Road Crew performing live restoration..."}
                    {demoStep === 6 && "Step 6: Repairs verified, closing citizen ticket..."}
                    {demoStep === 7 && "Simulation Complete!"}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-sans leading-relaxed">
                    {demoStep === 1 && "Citizen Gopika Randhawa snaps a geo-tagged image in West Heights."}
                    {demoStep === 2 && "The system routes the image bytes directly to our secure server-side models."}
                    {demoStep === 3 && "The agents extract metadata, check duplicates, score priority, and estimate repair cost."}
                    {demoStep === 4 && "The ticket is routed to the Water Department and dispatched to Crew Leader Tony Soprano."}
                    {demoStep === 5 && "Crew Leader Tony Soprano bypasses the valve and welds the cast-iron pipeline sleeve."}
                    {demoStep === 6 && "The system auto-calculates XP rewards, upgrading Gopika Randhawa to Level 6!"}
                    {demoStep === 7 && "You've successfully completed the end-to-end Smart City Operating System workflow!"}
                  </p>
                </div>
              </div>

              {/* Console logs */}
              <div className="bg-black rounded-2xl p-5 border border-white/5 font-mono text-[10px] space-y-1.5 max-h-48 overflow-y-auto">
                <p className="text-gray-500">// CivicFix AI Operating System Kernel Logs</p>
                {demoLogs.map((log, idx) => (
                  <p key={idx} className="text-[#B8C2D1]">
                    <span className="text-[#34D399] mr-1.5">&gt;</span>
                    {log}
                  </p>
                ))}
                {demoStep < 7 && (
                  <p className="text-yellow-400 animate-pulse">Running live background calculations...</p>
                )}
              </div>

              {/* Action bar */}
              <div className="flex justify-between items-center pt-2">
                <span className="text-[10px] text-gray-500 font-mono">Simulating lifecycle in real-time</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setDemoActive(false)}
                    className="px-4 py-2 text-[10px] bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all"
                  >
                    Dismiss HUD
                  </button>
                  {demoStep === 7 && (
                    <button 
                      onClick={() => {
                        setDemoActive(false);
                        setActiveTab('leaderboard');
                        showToast("🏆 Welcome to the Leaderboard! You earned +150 XP.");
                      }}
                      className="px-4 py-2 text-[10px] bg-gradient-to-r from-[#22D3EE] to-purple-500 text-black font-extrabold rounded-xl transition-all"
                    >
                      View XP Leaderboard
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Global OS Command Palette (Ctrl+K overlay) */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        setTab={setActiveTab}
        setSearch={setSearchQuery}
        runDemo={runAutomatedDemo}
      />

    </div>
  );
}
