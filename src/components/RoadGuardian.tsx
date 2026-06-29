import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle, Navigation, Shield, Zap, Radio, Eye, 
  Activity, MapPin, Clock, Users, ChevronRight, X, 
  Volume2, VolumeX, Car, CloudRain, Sun, Wind,
  TrendingUp, Award, CheckCircle2, Flame, Star,
  RotateCcw, ArrowRight, Info
} from 'lucide-react';

// Types
interface Hazard {
  id: string;
  type: string;
  icon: string;
  lat: number;
  lng: number;
  address: string;
  riskScore: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  verifiedBy: number;
  distance: number; // meters (simulated)
  estimatedRepair: string;
  aiRecommendation: string[];
  aiReasoning: string;
  reportedAt: string;
  accidentProbability: number;
  weatherImpact: string;
  nearbySchool: boolean;
  category: 'pothole' | 'flooding' | 'construction' | 'obstruction' | 'signal' | 'crack';
}

interface SafetyAlert {
  hazard: Hazard;
  visible: boolean;
}

interface RouteOption {
  label: string;
  timeDiff: string;
  distanceDiff: string;
  fuelDiff: string;
  safetyImprovement: string;
  recommended: boolean;
}

interface Props {
  issues: Array<{ category: string; urgency: string; location: { address: string; lat: number; lng: number }; votes: number; aiConfidence: number }>;
  showToast: (msg: string) => void;
  addXp: (amount: number, reason: string) => void;
}

const HAZARD_DATA: Hazard[] = [
  {
    id: 'hz-001',
    type: 'Large Pothole',
    icon: '🕳️',
    lat: 28.6304, lng: 77.2177,
    address: 'Sector 17 Main Road, Near Metro Gate 2',
    riskScore: 96,
    severity: 'critical',
    confidence: 98,
    verifiedBy: 42,
    distance: 120,
    estimatedRepair: 'Tomorrow 10:30 AM',
    aiRecommendation: ['Reduce speed immediately', 'Move slightly left', 'Drive carefully'],
    aiReasoning: 'Deep subsurface fracture detected. High vehicle damage probability due to crater dimensions exceeding 45cm. Night driving multiplies risk by 3.2x.',
    reportedAt: '2 hours ago',
    accidentProbability: 78,
    weatherImpact: 'Rain forecast increases hydroplaning risk by 40%',
    nearbySchool: true,
    category: 'pothole'
  },
  {
    id: 'hz-002',
    type: 'Road Flooding',
    icon: '🌊',
    lat: 28.6250, lng: 77.2200,
    address: 'Ring Road Underpass, South Sector',
    riskScore: 88,
    severity: 'high',
    confidence: 94,
    verifiedBy: 28,
    distance: 280,
    estimatedRepair: 'Weather dependent – 6–12 hrs',
    aiRecommendation: ['Avoid underpass route', 'Take Ring Road alternate', 'Do not attempt if water above 10cm'],
    aiReasoning: 'Water depth sensor indicates 23cm accumulation. Vehicle stall probability: 62% for sedans. Emergency services response time in this zone is 18 minutes.',
    reportedAt: '45 minutes ago',
    accidentProbability: 55,
    weatherImpact: 'Active rainfall worsening conditions in real-time',
    nearbySchool: false,
    category: 'flooding'
  },
  {
    id: 'hz-003',
    type: 'Construction Zone',
    icon: '🚧',
    lat: 28.6380, lng: 77.2100,
    address: 'MG Road, Phase 3 Flyover Construction',
    riskScore: 72,
    severity: 'high',
    confidence: 99,
    verifiedBy: 67,
    distance: 450,
    estimatedRepair: 'Dec 15, 2025 (project completion)',
    aiRecommendation: ['Reduce speed to 20 km/h zone', 'Follow diversion boards', 'Expect 8–12 min delay'],
    aiReasoning: 'Active heavy machinery operating. Dust and loose gravel coating creates 0.2μ friction coefficient drop. Worker pedestrian risk zone active 8AM–8PM.',
    reportedAt: '3 days ago',
    accidentProbability: 34,
    weatherImpact: 'Low wind conditions today – dust impact reduced',
    nearbySchool: false,
    category: 'construction'
  },
  {
    id: 'hz-004',
    type: 'Open Manhole',
    icon: '⚠️',
    lat: 28.6290, lng: 77.2250,
    address: 'Lajpat Nagar Market Lane, Near Exit 3',
    riskScore: 91,
    severity: 'critical',
    confidence: 87,
    verifiedBy: 19,
    distance: 85,
    estimatedRepair: 'Emergency crew dispatched – ETA 2 hrs',
    aiRecommendation: ['Avoid left lane entirely', 'Warn other motorists', 'Report if cover still missing'],
    aiReasoning: 'Cover fully displaced. 90cm drop detected. Two-wheeler tire fall-in probability: 82%. Emergency notification sent to PWD and Traffic Police.',
    reportedAt: '30 minutes ago',
    accidentProbability: 82,
    weatherImpact: 'Visibility normal – no weather impact',
    nearbySchool: false,
    category: 'obstruction'
  },
  {
    id: 'hz-005',
    type: 'Broken Signal',
    icon: '🚦',
    lat: 28.6320, lng: 77.2140,
    address: 'Nehru Place Intersection – Signal 4B',
    riskScore: 79,
    severity: 'high',
    confidence: 96,
    verifiedBy: 35,
    distance: 200,
    estimatedRepair: 'Technician scheduled – 4 hours',
    aiRecommendation: ['Treat as 4-way stop', 'Expect congestion – add 6 min buffer', 'Prioritize pedestrian crossing'],
    aiReasoning: 'All 4 signal heads non-functional since 07:45. Traffic volume at this intersection averages 3,400 vehicles/hr. Manual regulation needed.',
    reportedAt: '1.5 hours ago',
    accidentProbability: 48,
    weatherImpact: 'Peak hour + signal failure = compounded risk',
    nearbySchool: true,
    category: 'signal'
  }
];

const ROUTES: RouteOption[] = [
  { label: 'Current Route (Hazardous)', timeDiff: '+0 min', distanceDiff: '+0 km', fuelDiff: '+0₹', safetyImprovement: 'Baseline', recommended: false },
  { label: 'Via NH-48 Bypass', timeDiff: '+4 min', distanceDiff: '+1.2 km', fuelDiff: '+8₹', safetyImprovement: '+72% Safer', recommended: true },
  { label: 'Via Outer Ring Road', timeDiff: '+9 min', distanceDiff: '+2.8 km', fuelDiff: '+18₹', safetyImprovement: '+91% Safer', recommended: false },
];

const SEVERITY_CONFIG = {
  low: { color: 'text-success', bg: 'bg-success/10', border: 'border-success/30', glow: '0 0 20px rgba(16,185,129,0.3)', label: 'LOW RISK' },
  medium: { color: 'text-sand-gold', bg: 'bg-sand-gold/10', border: 'border-sand-gold/30', glow: '0 0 20px rgba(251,191,36,0.3)', label: 'MODERATE RISK' },
  high: { color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30', glow: '0 0 20px rgba(251,146,60,0.3)', label: 'HIGH RISK' },
  critical: { color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30', glow: '0 0 30px rgba(248,113,113,0.4)', label: 'CRITICAL' },
};

const GUARDIAN_BADGES = [
  { id: 'rg-badge-1', icon: '🛡️', name: 'Road Guardian', desc: 'Activated Road Guardian protection for the first time', color: 'from-red-500 to-orange-400', xp: 150 },
  { id: 'rg-badge-2', icon: '⚡', name: 'Safety Champion', desc: 'Avoided 5 hazard zones using AI alerts', color: 'from-yellow-400 to-amber-500', xp: 300 },
  { id: 'rg-badge-3', icon: '🌟', name: 'Accident Preventer', desc: 'Reported a hazard that prevented a verified incident', color: 'from-green-400 to-emerald-500', xp: 500 },
  { id: 'rg-badge-4', icon: '🔭', name: 'Early Reporter', desc: 'First citizen to report a critical hazard zone', color: 'from-blue-400 to-cyan-500', xp: 200 },
];

// --- Animated Radar Pulse ---
const RadarPulse = ({ severity }: { severity: string }) => {
  const colors: Record<string, string> = { critical: '#F87171', high: '#FB923C', medium: '#FBBF24', low: '#34D399' };
  const c = colors[severity] || '#C96B2C';
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="absolute rounded-full border opacity-0"
          style={{
            width: `${i * 20 + 16}px`, height: `${i * 20 + 16}px`,
            borderColor: c,
            animation: `ping ${1.5 + i * 0.4}s ease-out ${i * 0.3}s infinite`,
          }}
        />
      ))}
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl z-10"
        style={{ background: `${c}22`, border: `2px solid ${c}` }}>
        <AlertTriangle className="w-5 h-5" style={{ color: c }} />
      </div>
    </div>
  );
};

// --- Risk Meter ---
const RiskMeter = ({ score }: { score: number }) => {
  const color = score > 85 ? '#F87171' : score > 65 ? '#FB923C' : score > 40 ? '#FBBF24' : '#34D399';
  const pct = Math.min(score, 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[9px] uppercase tracking-wider text-steel-gray font-display">Road Risk Score</span>
        <span className="text-lg font-extrabold font-stats" style={{ color }}>{score}<span className="text-xs text-steel-gray">/100</span></span>
      </div>
      <div className="h-2.5 bg-surface rounded-full overflow-hidden border border-card-border">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, #34D399, ${color})` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </div>
      <div className="flex justify-between text-[8px] text-steel-gray font-sans">
        <span>Safe</span><span>Moderate</span><span>Danger</span>
      </div>
    </div>
  );
};

// --- AI Safety Alert Modal ---
const AlertModal = ({ alert, onNavigate, onDismiss, onViewDetails, isMuted }: {
  alert: SafetyAlert;
  onNavigate: () => void;
  onDismiss: () => void;
  onViewDetails: () => void;
  isMuted: boolean;
}) => {
  const h = alert.hazard;
  const sev = SEVERITY_CONFIG[h.severity];

  return (
    <AnimatePresence>
      {alert.visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          className="fixed inset-0 z-[200] flex items-end justify-center pb-8 px-4 pointer-events-none"
        >
          <div
            className="w-full max-w-md pointer-events-auto rounded-[28px] overflow-hidden backdrop-blur-2xl border"
            style={{
              background: 'rgba(15, 10, 8, 0.94)',
              borderColor: h.severity === 'critical' ? '#F87171' : '#C96B2C',
              boxShadow: sev.glow + ', 0 25px 60px rgba(0,0,0,0.6)',
            }}
          >
            {/* Alert Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between"
              style={{ background: h.severity === 'critical' ? 'rgba(248,113,113,0.08)' : 'rgba(201,107,44,0.08)' }}>
              <div className="flex items-center gap-3">
                <RadarPulse severity={h.severity} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-extrabold tracking-[0.2em] ${sev.color} font-display`}>
                      ⚠️ AI ROAD GUARDIAN ALERT
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-primary-text font-display">{h.type} Detected</h3>
                </div>
              </div>
              <button onClick={onDismiss} className="p-2 rounded-xl hover:bg-white/5 text-steel-gray hover:text-primary-text transition-all cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Key Stats */}
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-surface/60 border border-card-border rounded-xl p-2.5 text-center">
                  <div className="text-[9px] text-steel-gray uppercase tracking-wider font-display mb-1">Distance</div>
                  <div className="text-sm font-extrabold text-primary-text font-stats">{h.distance}m</div>
                  <div className="text-[8px] text-secondary-text font-sans">ahead</div>
                </div>
                <div className={`${sev.bg} border ${sev.border} rounded-xl p-2.5 text-center`}>
                  <div className="text-[9px] text-steel-gray uppercase tracking-wider font-display mb-1">Risk Level</div>
                  <div className={`text-sm font-extrabold ${sev.color} font-stats`}>{sev.label}</div>
                  <div className="text-[8px] text-secondary-text font-sans">severity</div>
                </div>
                <div className="bg-surface/60 border border-card-border rounded-xl p-2.5 text-center">
                  <div className="text-[9px] text-steel-gray uppercase tracking-wider font-display mb-1">Confidence</div>
                  <div className="text-sm font-extrabold text-success font-stats">{h.confidence}%</div>
                  <div className="text-[8px] text-secondary-text font-sans">AI certainty</div>
                </div>
              </div>

              {/* Verification & Location */}
              <div className="flex items-center gap-3 text-xs text-secondary-text font-sans">
                <span className="flex items-center gap-1"><Users className="w-3 h-3 text-copper-primary" /> Verified by {h.verifiedBy} citizens</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-copper-primary" /> {h.address.split(',')[0]}</span>
              </div>

              {/* AI Recommendations */}
              <div className="bg-bg-base/50 border border-card-border rounded-xl p-3 space-y-1.5">
                <span className="text-[9px] uppercase tracking-wider text-copper-primary font-bold font-display">AI Recommendation</span>
                {h.aiRecommendation.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3 h-3 text-success mt-0.5 shrink-0" />
                    <span className="text-[11px] text-primary-text font-sans">{rec}</span>
                  </div>
                ))}
              </div>

              {/* Repair ETA */}
              <div className="flex items-center gap-2 text-[10px] text-secondary-text font-sans">
                <Clock className="w-3 h-3 text-copper-primary" />
                <span>Estimated repair: <span className="text-primary-text font-bold">{h.estimatedRepair}</span></span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={onNavigate}
                  className="col-span-2 py-2.5 rounded-xl bg-copper-primary hover:brightness-110 text-primary-text text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer font-display shadow-[0_0_20px_rgba(201,107,44,0.4)]"
                >
                  <Navigation className="w-3.5 h-3.5" /> Navigate Safely
                </button>
                <button
                  onClick={onViewDetails}
                  className="py-2.5 rounded-xl bg-surface border border-card-border text-secondary-text text-xs font-bold flex items-center justify-center gap-1 transition-all hover:text-primary-text cursor-pointer font-display"
                >
                  <Eye className="w-3.5 h-3.5" /> Details
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ===================== MAIN COMPONENT =====================
export const RoadGuardian: React.FC<Props> = ({ issues, showToast, addXp }) => {
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activeAlert, setActiveAlert] = useState<SafetyAlert | null>(null);
  const [selectedHazard, setSelectedHazard] = useState<Hazard | null>(null);
  const [showRoutes, setShowRoutes] = useState(false);
  const [badgesEarned, setBadgesEarned] = useState<string[]>([]);
  const [monitoringTick, setMonitoringTick] = useState(0);
  const [mapViewHazard, setMapViewHazard] = useState<string | null>(null);
  const [alertQueue, setAlertQueue] = useState<Hazard[]>([]);
  const [safetyScore, setSafetyScore] = useState(88);
  const [hazardsSorted, setHazardsSorted] = useState<Hazard[]>([...HAZARD_DATA].sort((a, b) => b.riskScore - a.riskScore));
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [guardianActivations, setGuardianActivations] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Simulate GPS monitoring when active
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setMonitoringTick(t => t + 1);
        // Occasionally simulate hazard alerts
        const rand = Math.random();
        if (rand < 0.2 && !activeAlert) {
          const nearby = hazardsSorted.filter(h => !alertQueue.find(q => q.id === h.id));
          if (nearby.length > 0) {
            const hazard = nearby[Math.floor(Math.random() * nearby.length)];
            setActiveAlert({ hazard, visible: true });
          }
        }
        // Simulate safety score fluctuation
        setSafetyScore(s => Math.max(60, Math.min(98, s + (Math.random() > 0.5 ? 1 : -1))));
      }, 5000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isActive, activeAlert, alertQueue, hazardsSorted]);

  const handleActivate = () => {
    setIsActive(true);
    setGuardianActivations(a => a + 1);
    showToast('🛡️ Road Guardian activated! AI monitoring your route...');
    addXp(50, "Road Guardian Activated");
    if (!badgesEarned.includes('rg-badge-1')) {
      setBadgesEarned(b => [...b, 'rg-badge-1']);
      setTimeout(() => showToast('🏆 Badge Unlocked: Road Guardian! +150 XP'), 1500);
      setTimeout(() => addXp(150, "Road Guardian Badge Unlocked"), 1500);
    }
    // Trigger first alert after 3 seconds
    setTimeout(() => {
      setActiveAlert({ hazard: HAZARD_DATA[3], visible: true }); // Open manhole - closest
    }, 3000);
  };

  const handleDeactivate = () => {
    setIsActive(false);
    setActiveAlert(null);
    showToast('Road Guardian deactivated.');
  };

  const handleNavigate = () => {
    setActiveAlert(null);
    setShowRoutes(true);
    showToast('🗺️ Calculating safest alternate route...');
    addXp(25, "Chose Safe Navigation");
  };

  const handleDismissAlert = () => {
    setActiveAlert(null);
  };

  const handleViewDetails = () => {
    if (activeAlert) {
      setSelectedHazard(activeAlert.hazard);
      setActiveAlert(null);
    }
  };

  const handleTriggerAlert = (hazard: Hazard) => {
    setActiveAlert({ hazard, visible: true });
  };

  const filteredHazards = filterSeverity === 'all'
    ? hazardsSorted
    : hazardsSorted.filter(h => h.severity === filterSeverity);

  const criticalCount = hazardsSorted.filter(h => h.severity === 'critical').length;
  const avgRisk = Math.round(hazardsSorted.reduce((a, b) => a + b.riskScore, 0) / hazardsSorted.length);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">

      {/* ── ALERT MODAL ── */}
      {activeAlert && (
        <AlertModal
          alert={activeAlert}
          onNavigate={handleNavigate}
          onDismiss={handleDismissAlert}
          onViewDetails={handleViewDetails}
          isMuted={isMuted}
        />
      )}

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <span className="text-[9px] uppercase tracking-wider text-copper-primary font-bold block font-display">AI ROAD GUARDIAN</span>
          <h2 className="text-xl font-bold font-display text-primary-text">Preventing Accidents Before They Happen</h2>
          <p className="text-xs text-secondary-text mt-1 font-sans">
            Continuous GPS monitoring · Hazard detection · AI-powered proactive safety alerts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2.5 rounded-xl bg-surface border border-card-border text-secondary-text hover:text-primary-text transition-all cursor-pointer"
            title={isMuted ? 'Unmute voice alerts' : 'Mute voice alerts'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          {isActive ? (
            <button
              onClick={handleDeactivate}
              className="px-5 py-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold flex items-center gap-2 hover:bg-red-500/30 transition-all cursor-pointer font-display"
            >
              <div className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
              Deactivate Guardian
            </button>
          ) : (
            <button
              onClick={handleActivate}
              className="px-5 py-2.5 rounded-xl bg-copper-primary hover:brightness-110 text-primary-text text-xs font-bold flex items-center gap-2 transition-all cursor-pointer font-display shadow-[0_0_20px_rgba(201,107,44,0.35)]"
            >
              <Shield className="w-4 h-4" />
              Activate Road Guardian
            </button>
          )}
        </div>
      </div>

      {/* ── STATS ROW ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Hazards', value: hazardsSorted.length, sub: `${criticalCount} critical`, icon: <AlertTriangle className="w-4 h-4 text-red-400" />, color: 'text-red-400' },
          { label: 'Avg Risk Score', value: `${avgRisk}/100`, sub: 'Zone average', icon: <Activity className="w-4 h-4 text-orange-400" />, color: 'text-orange-400' },
          { label: 'Route Safety', value: `${safetyScore}%`, sub: isActive ? 'Live monitoring' : 'Guardian off', icon: <Shield className="w-4 h-4 text-success" />, color: 'text-success' },
          { label: 'Citizens Warned', value: '1,247', sub: 'This week', icon: <Users className="w-4 h-4 text-copper-primary" />, color: 'text-copper-primary' },
        ].map((s, i) => (
          <div key={i} className="bg-bg-secondary/60 border border-card-border rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-wider text-steel-gray font-display">{s.label}</span>
              {s.icon}
            </div>
            <div className={`text-xl font-extrabold ${s.color} font-stats`}>{s.value}</div>
            <div className="text-[10px] text-secondary-text font-sans flex items-center gap-1">
              {isActive && s.label === 'Route Safety' && (
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping inline-block" />
              )}
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* LEFT: HazardMap (SVG) */}
        <div className="lg:col-span-7 bg-bg-secondary/60 border border-card-border rounded-[32px] p-6 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-copper-primary font-bold font-display">SMART HAZARD MAP</span>
              <h3 className="text-sm font-bold text-primary-text font-display">Live Danger Zone Visualization</h3>
            </div>
            {isActive && (
              <div className="flex items-center gap-2 bg-success/10 border border-success/30 px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 rounded-full bg-success animate-ping" />
                <span className="text-[10px] font-bold text-success font-display">GPS MONITORING LIVE</span>
              </div>
            )}
          </div>

          {/* SVG Map */}
          <div className="relative rounded-2xl overflow-hidden border border-card-border" style={{ background: 'radial-gradient(rgba(201,107,44,0.07) 1px, transparent 1px)', backgroundSize: '20px 20px', backgroundColor: '#0A0704' }}>
            <svg viewBox="0 0 800 450" className="w-full h-[320px]">
              {/* Grid */}
              <g stroke="rgba(255,255,255,0.03)" strokeWidth="1">
                {[1, 2, 3, 4].map(i => <line key={`h${i}`} x1="0" y1={i * 90} x2="800" y2={i * 90} />)}
                {[1, 2, 3, 4, 5, 6, 7].map(i => <line key={`v${i}`} x1={i * 100} y1="0" x2={i * 100} y2="450" />)}
              </g>

              {/* Roads */}
              <g stroke="rgba(201,107,44,0.2)" strokeWidth="3" fill="none">
                <path d="M 0,225 Q 200,200 400,225 T 800,225" />
                <path d="M 400,0 Q 380,225 400,450" />
                <path d="M 0,100 Q 200,80 800,120" />
                <path d="M 0,350 Q 300,320 800,370" />
                <path d="M 150,0 Q 160,225 140,450" />
                <path d="M 650,0 Q 640,225 660,450" />
              </g>
              <g stroke="rgba(201,107,44,0.1)" strokeWidth="1" strokeDasharray="4 4" fill="none">
                <path d="M 0,225 Q 200,200 400,225 T 800,225" />
                <path d="M 400,0 Q 380,225 400,450" />
              </g>

              {/* Hazard zones */}
              {HAZARD_DATA.map((h, idx) => {
                const positions = [
                  { x: 200, y: 180 }, { x: 520, y: 300 }, { x: 120, y: 100 },
                  { x: 650, y: 200 }, { x: 350, y: 370 }
                ];
                const pos = positions[idx];
                const colors: Record<string, string> = { critical: '#F87171', high: '#FB923C', medium: '#FBBF24', low: '#34D399' };
                const c = colors[h.severity];
                const isSelected = mapViewHazard === h.id;

                return (
                  <g key={h.id} onClick={() => { setMapViewHazard(isSelected ? null : h.id); setSelectedHazard(isSelected ? null : h); }} style={{ cursor: 'pointer' }}>
                    {/* Danger radius */}
                    <circle cx={pos.x} cy={pos.y} r={isSelected ? 55 : 40} fill={`${c}11`} stroke={`${c}44`} strokeWidth="1" strokeDasharray="4 4">
                      <animateTransform attributeName="transform" type="rotate" from={`0 ${pos.x} ${pos.y}`} to={`360 ${pos.x} ${pos.y}`} dur="20s" repeatCount="indefinite" />
                    </circle>
                    {/* Radar pulse */}
                    <circle cx={pos.x} cy={pos.y} r="20" fill="none" stroke={c} strokeWidth="1" opacity="0.6">
                      <animate attributeName="r" values="12;32;12" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
                    </circle>
                    {/* Core marker */}
                    <circle cx={pos.x} cy={pos.y} r="12" fill={`${c}33`} stroke={c} strokeWidth="2" />
                    <text x={pos.x} y={pos.y + 5} textAnchor="middle" fontSize="10" fill={c}>
                      {idx === 0 ? '⚠' : idx === 1 ? '🌊' : idx === 2 ? '🚧' : idx === 3 ? '⛔' : '🚦'}
                    </text>
                    {/* Label */}
                    <text x={pos.x} y={pos.y + 26} textAnchor="middle" fontSize="7" fill={c} fontFamily="monospace" fontWeight="bold">
                      {h.riskScore}%
                    </text>

                    {/* Tooltip on select */}
                    {isSelected && (
                      <g>
                        <rect x={pos.x - 60} y={pos.y - 62} width="120" height="46" rx="6" fill="rgba(15,10,8,0.92)" stroke={c} strokeWidth="1" />
                        <text x={pos.x} y={pos.y - 46} textAnchor="middle" fontSize="7.5" fill="#E8D5B8" fontFamily="monospace" fontWeight="bold">{h.type}</text>
                        <text x={pos.x} y={pos.y - 35} textAnchor="middle" fontSize="6.5" fill={c}>{h.distance}m away · {h.confidence}% confidence</text>
                        <text x={pos.x} y={pos.y - 23} textAnchor="middle" fontSize="6" fill="#6B7280">{h.address.split(',')[0]}</text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* User position (GPS marker) */}
              {isActive && (
                <g>
                  <circle cx="400" cy="225" r="16" fill="rgba(201,107,44,0.15)" stroke="#C96B2C" strokeWidth="2">
                    <animate attributeName="r" values="12;22;12" dur="2.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="1;0.3;1" dur="2.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="400" cy="225" r="7" fill="#C96B2C" />
                  <text x="400" y="248" textAnchor="middle" fontSize="7.5" fill="#C96B2C" fontFamily="monospace" fontWeight="bold">YOU</text>
                </g>
              )}

              {/* Legend */}
              <g>
                {[{ c: '#F87171', l: 'Critical' }, { c: '#FB923C', l: 'High' }, { c: '#FBBF24', l: 'Medium' }].map((leg, i) => (
                  <g key={leg.l} transform={`translate(${10 + i * 70}, 425)`}>
                    <circle cx="5" cy="5" r="4" fill={`${leg.c}33`} stroke={leg.c} strokeWidth="1.5" />
                    <text x="14" y="9" fontSize="7" fill="#6B7280" fontFamily="monospace">{leg.l}</text>
                  </g>
                ))}
              </g>
            </svg>

            {/* Map overlay info */}
            <div className="absolute top-3 left-3 bg-bg-base/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-card-border flex items-center gap-2">
              <MapPin className="w-3 h-3 text-copper-primary" />
              <span className="text-[9px] font-bold text-primary-text font-display">City Danger Zone Grid</span>
            </div>
            <div className="absolute top-3 right-3 text-[9px] font-mono text-steel-gray bg-bg-base/70 px-2 py-1 rounded border border-card-border">
              {hazardsSorted.length} ACTIVE ZONES
            </div>
          </div>

          <p className="text-[10px] text-steel-gray font-sans text-center">Click any hazard marker to inspect · Markers pulse with live risk level</p>
        </div>

        {/* RIGHT: Hazard List + Details */}
        <div className="lg:col-span-5 space-y-4">

          {/* Filter Bar */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'critical', 'high', 'medium'].map(sev => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all font-display ${filterSeverity === sev ? 'bg-copper-primary/20 border-copper-primary text-copper-primary' : 'bg-bg-secondary/40 border-card-border text-secondary-text hover:text-primary-text'}`}
              >
                {sev.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Hazard Cards */}
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredHazards.map((h) => {
              const sev = SEVERITY_CONFIG[h.severity];
              const isExpanded = selectedHazard?.id === h.id;
              return (
                <motion.div
                  key={h.id}
                  layout
                  className={`bg-bg-secondary/60 border rounded-2xl overflow-hidden cursor-pointer transition-all ${isExpanded ? `border-opacity-80 ${sev.border}` : 'border-card-border hover:border-copper-primary/30'}`}
                  style={isExpanded ? { boxShadow: sev.glow } : {}}
                  onClick={() => setSelectedHazard(isExpanded ? null : h)}
                >
                  <div className="p-4 flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl ${sev.bg} border ${sev.border} flex items-center justify-center text-lg shrink-0`}>
                      {h.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-primary-text font-display">{h.type}</h4>
                          <p className="text-[10px] text-secondary-text font-sans truncate">{h.address}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${sev.bg} ${sev.color} font-display`}>{sev.label}</span>
                          <span className="text-[9px] text-steel-gray font-sans">{h.distance}m away</span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-[9px] text-steel-gray font-sans">
                        <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-copper-primary" /> Risk: {h.riskScore}/100</span>
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3 text-copper-primary" /> {h.confidence}% confidence</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3 text-copper-primary" /> {h.verifiedBy}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                        className="border-t border-card-border overflow-hidden"
                      >
                        <div className="p-4 space-y-3">
                          <RiskMeter score={h.riskScore} />

                          {/* AI Reasoning */}
                          <div className="bg-bg-base/60 border border-card-border rounded-xl p-3">
                            <span className="text-[9px] uppercase tracking-wider text-copper-primary font-bold font-display block mb-1.5">AI Reasoning</span>
                            <p className="text-[10px] text-secondary-text leading-relaxed font-sans">{h.aiReasoning}</p>
                          </div>

                          {/* Flags */}
                          <div className="flex flex-wrap gap-2">
                            {h.nearbySchool && (
                              <span className="text-[9px] bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 px-2 py-0.5 rounded-full font-display">🏫 School Zone</span>
                            )}
                            <span className="text-[9px] bg-red-400/10 border border-red-400/30 text-red-400 px-2 py-0.5 rounded-full font-display">
                              💥 Accident Prob: {h.accidentProbability}%
                            </span>
                            <span className="text-[9px] bg-blue-400/10 border border-blue-400/30 text-blue-400 px-2 py-0.5 rounded-full font-display">
                              🌧 {h.weatherImpact.split(' ').slice(0, 3).join(' ')}...
                            </span>
                          </div>

                          {/* Recommendations */}
                          <div className="space-y-1">
                            {h.aiRecommendation.map((rec, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <ChevronRight className="w-3 h-3 text-copper-primary mt-0.5 shrink-0" />
                                <span className="text-[10px] text-primary-text font-sans">{rec}</span>
                              </div>
                            ))}
                          </div>

                          {/* Actions */}
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleTriggerAlert(h); }}
                              className="py-2 rounded-xl bg-copper-primary/10 border border-copper-primary/30 text-copper-primary text-[10px] font-bold flex items-center justify-center gap-1.5 hover:bg-copper-primary/20 transition-all cursor-pointer font-display"
                            >
                              <Radio className="w-3 h-3" /> Simulate Alert
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setShowRoutes(true); showToast('🗺️ Loading safe route options...'); }}
                              className="py-2 rounded-xl bg-success/10 border border-success/30 text-success text-[10px] font-bold flex items-center justify-center gap-1.5 hover:bg-success/20 transition-all cursor-pointer font-display"
                            >
                              <Navigation className="w-3 h-3" /> Route Around
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── SAFE ROUTE PANEL ── */}
      <AnimatePresence>
        {showRoutes && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-bg-secondary/60 border border-card-border rounded-[32px] p-8 shadow-2xl space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-copper-primary font-bold font-display block">AI ROUTE OPTIMIZER</span>
                <h3 className="text-base font-bold text-primary-text font-display">Safe Route Recommendation</h3>
              </div>
              <button onClick={() => setShowRoutes(false)} className="p-2 rounded-xl hover:bg-surface border border-card-border text-secondary-text hover:text-primary-text transition-all cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ROUTES.map((route, i) => (
                <div
                  key={i}
                  className={`rounded-2xl border p-5 space-y-3 transition-all relative overflow-hidden ${route.recommended ? 'border-success/40 bg-success/5 shadow-[0_0_20px_rgba(16,185,129,0.15)]' : 'border-card-border bg-bg-base/30'}`}
                >
                  {route.recommended && (
                    <div className="absolute top-3 right-3 bg-success/20 border border-success/30 text-success text-[9px] font-bold px-2 py-0.5 rounded-full font-display flex items-center gap-1">
                      <Star className="w-2.5 h-2.5" /> AI PICK
                    </div>
                  )}
                  <h4 className="text-xs font-bold text-primary-text font-display pr-14">{route.label}</h4>
                  <div className="space-y-1.5">
                    {[
                      { label: 'Time', val: route.timeDiff },
                      { label: 'Distance', val: route.distanceDiff },
                      { label: 'Fuel', val: route.fuelDiff },
                      { label: 'Safety', val: route.safetyImprovement },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between text-[10px]">
                        <span className="text-steel-gray font-sans">{row.label}</span>
                        <span className={`font-bold font-stats ${row.label === 'Safety' ? 'text-success' : 'text-primary-text'}`}>{row.val}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => { showToast(`🗺️ Navigating via ${route.label}!`); addXp(30, "Safe Route Selected"); }}
                    className={`w-full py-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer font-display ${route.recommended ? 'bg-success text-white hover:brightness-110 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-surface border border-card-border text-secondary-text hover:text-primary-text'}`}
                  >
                    <Navigation className="w-3 h-3" /> Take This Route
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CITIZEN SAFETY REWARDS ── */}
      <div className="bg-bg-secondary/60 border border-card-border rounded-[32px] p-8 space-y-6 shadow-2xl">
        <div>
          <span className="text-[9px] uppercase tracking-wider text-copper-primary font-bold font-display block">GUARDIAN ACHIEVEMENTS</span>
          <h3 className="text-base font-bold text-primary-text font-display">Safety Rewards & Badges</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {GUARDIAN_BADGES.map(badge => {
            const earned = badgesEarned.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`rounded-2xl border p-5 text-center space-y-3 transition-all ${earned ? 'border-copper-primary/40 bg-copper-primary/5' : 'border-card-border bg-bg-base/30 opacity-50'}`}
              >
                <div className={`w-14 h-14 rounded-full bg-gradient-to-tr ${badge.color} flex items-center justify-center text-2xl mx-auto shadow-lg ${earned ? '' : 'grayscale'}`}>
                  {earned ? badge.icon : '🔒'}
                </div>
                <div>
                  <h5 className="text-xs font-extrabold text-primary-text font-display">{badge.name}</h5>
                  <p className="text-[9px] text-secondary-text leading-relaxed font-sans mt-1">{badge.desc}</p>
                </div>
                <span className={`text-[9px] font-bold font-stats ${earned ? 'text-success' : 'text-steel-gray'}`}>
                  {earned ? `✓ +${badge.xp} XP Earned` : `+${badge.xp} XP`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── AI PREDICTION CENTER ── */}
      <div className="bg-bg-secondary/60 border border-card-border rounded-[32px] p-8 space-y-6 shadow-2xl">
        <div>
          <span className="text-[9px] uppercase tracking-wider text-copper-primary font-bold font-display block">AI PREDICTION ENGINE</span>
          <h3 className="text-base font-bold text-primary-text font-display">Predicted Road Hazards — Next 72 Hours</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { hazard: 'Pothole Expansion after Rain', zone: 'West Ward', prob: 84, timing: 'Tonight 11PM', impact: 'High Vehicle Damage', icon: '🕳️' },
            { hazard: 'Waterlogging at Ring Road', zone: 'South Sector', prob: 91, timing: 'Tomorrow 6AM', impact: 'Traffic Gridlock', icon: '🌧' },
            { hazard: 'Streetlight Failure (Sector 22)', zone: 'North Ward', prob: 68, timing: 'Next 48 hrs', impact: 'Night Drive Risk', icon: '💡' },
          ].map((pred, i) => (
            <div key={i} className="bg-bg-base/40 border border-card-border rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{pred.icon}</span>
                <div>
                  <h4 className="text-xs font-bold text-primary-text font-display">{pred.hazard}</h4>
                  <p className="text-[9px] text-steel-gray font-sans">{pred.zone}</p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-secondary-text font-sans">Probability</span>
                  <span className="text-orange-400 font-bold font-stats">{pred.prob}%</span>
                </div>
                <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-orange-400 to-red-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${pred.prob}%` }}
                    transition={{ duration: 1.5, delay: i * 0.2 }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-[9px]">
                <span className="text-steel-gray font-sans">⏰ {pred.timing}</span>
                <span className="text-orange-400 font-sans">{pred.impact}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Explainability Footer */}
      <div className="bg-bg-base/40 border border-card-border rounded-2xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-copper-primary/10 border border-copper-primary/30 flex items-center justify-center shrink-0">
          <Info className="w-5 h-5 text-copper-primary" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-primary-text font-display mb-1">AI Explainability — How Road Guardian Works</h4>
          <p className="text-[10px] text-secondary-text leading-relaxed font-sans">
            Every alert is generated by analyzing GPS proximity, vehicle speed estimation, community verification count, 
            weather API data, historical accident patterns, time-of-day risk multipliers, and Gemini Vision analysis of 
            reported images. Confidence scores reflect the aggregate certainty of all signals combined. 
            Alternative routes are calculated by scoring all known hazards along each path and optimizing for 
            safety-first with minimal time penalty.
          </p>
        </div>
      </div>
    </div>
  );
};
