import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Award, CheckCircle2, Brain, Compass, HelpCircle, 
  Activity, Sparkles, Clock, ShieldAlert, Volume2, VolumeX, 
  Bookmark, ChevronDown, Check, Zap, RotateCcw, Info, ExternalLink 
} from 'lucide-react';

// Web Audio API Synthesizer for premium, high-fidelity mechanical click/whoosh sound effects
// Extremely safe and runs client-side without any external assets!
const playSound = (type: 'whoosh' | 'success' | 'click', isMuted: boolean) => {
  if (isMuted) return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    if (type === 'whoosh') {
      // Elegant wind/whoosh sound for card flip
      const bufferSize = ctx.sampleRate * 0.3; // 300ms
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(120, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.2);
      filter.Q.setValueAtTime(5.0, ctx.currentTime);
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      noise.start();
      noise.stop(ctx.currentTime + 0.3);
    } else if (type === 'click') {
      // Tiny mechanical tactile click sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.04);
      
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'success') {
      // Golden, shimmering chime of achievement
      const now = ctx.currentTime;
      const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
      
      frequencies.forEach((f, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + index * 0.06);
        
        gain.gain.setValueAtTime(0.0, now);
        gain.gain.linearRampToValueAtTime(0.06, now + index * 0.06 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.06 + 0.3);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + index * 0.06);
        osc.stop(now + index * 0.06 + 0.4);
      });
    }
  } catch (err) {
    console.warn("Audio context not allowed yet by user interaction.", err);
  }
};

export interface FlashCardData {
  id: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  xp: number;
  title: string;
  subtitle: string;
  backHeading: string;
  backDescription: string;
  checklistTitle: string;
  checklistItems: string[];
  proTip: string;
  accentColor: string; // Tailwinds colors or hex codes
  borderColor: string;
  icon: React.ReactNode;
}

interface CivicFlashCardsProps {
  addXp: (amount: number, reason: string) => void;
  showToast: (msg: string) => void;
  userProfileXp: number;
  userProfileLvl: number;
}

export const CivicFlashCards: React.FC<CivicFlashCardsProps> = ({
  addXp,
  showToast,
  userProfileXp,
  userProfileLvl
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [masteredIds, setMasteredIds] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [activeAccordionId, setActiveAccordionId] = useState<string | null>(null);

  // Detect mobile viewport to trigger click flips instead of hover
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pre-configured rich list of Civic Flash Cards matching CivicFix OS lore
  const CARDS_DATA: FlashCardData[] = [
    {
      id: 'fc-water',
      category: 'WATER SYSTEM SAFETY',
      difficulty: 'Intermediate',
      xp: 50,
      title: 'Water Trunk Isolation',
      subtitle: 'Locating and locking local gate valves safely during critical pipe ruptures.',
      backHeading: 'Local Bypass & Dispatch Blueprint',
      backDescription: 'Locate the nearest yellow gate-valve cap at your sector ward boundary. Rotate clockwise to choke local pressure and isolate the water spill. Submit geotagged snaps through CivicFix OS to trigger the autonomous GeoAI agent instantly.',
      checklistTitle: 'Emergency Hydraulic Verification:',
      checklistItems: [
        'Survey structural soil shifting or basement water seepage surrounding the leak.',
        'Never stand over asphalt bubbles or buckled sidewalks (heavy washouts hazard).',
        'Upload clear reference objects (e.g., street signs) for Vision AI depth parsing.',
        'DJB municipal field response SLA is guaranteed under 12 hours for critical isolations.'
      ],
      proTip: 'Slowing localized water loss immediately protects residential soil foundations from catastrophic pavement collapse.',
      accentColor: '#E5A93C', // Sand Gold
      borderColor: 'border-[#E5A93C]/30',
      icon: <Activity className="w-6 h-6 text-[#E5A93C]" />
    },
    {
      id: 'fc-transit',
      category: 'TRANSIT SAFETY',
      difficulty: 'Beginner',
      xp: 30,
      title: 'Road Cracks & Potholes',
      subtitle: 'Sizing criteria and photo reference scaling for autonomous PWD routing.',
      backHeading: 'Scaling & Upvoting Directives',
      backDescription: 'Depressions deeper than 3 inches qualify as critical transit obstacles. Stand at a safe distance and place a recognizable standard scaling reference (e.g., a pen or coin) adjacent to the edge of the crack before taking the picture.',
      checklistTitle: 'Sizing & Scale Reporting Actions:',
      checklistItems: [
        'Maintain absolute visibility to passing traffic. Stand clear of curves.',
        'Verify if metal rebar grid structures or underlying steel mesh is exposed.',
        'Upvote pre-existing HUD pins instead of duplicating. This concentrates AI priority weight.',
        'PWD crews dispatch standard cold-mix asphalt routing within 24 hours for level upvotes.'
      ],
      proTip: 'Accurate pixel scale variables help our server-side Budget AI predict cold-mix compound mass needs to an accuracy rate of 98%.',
      accentColor: '#C96B2C', // Copper Primary
      borderColor: 'border-[#C96B2C]/30',
      icon: <Compass className="w-6 h-6 text-[#C96B2C]" />
    },
    {
      id: 'fc-ai',
      category: 'CIVIC OS TECHNOLOGY',
      difficulty: 'Advanced',
      xp: 100,
      title: 'Multi-Agent Consensus',
      subtitle: 'Understanding how six distinct AI micro-agents collaborate under 1.5 seconds.',
      backHeading: 'The Orchestrator Ecosystem',
      backDescription: 'When a citizen submits evidence, CivicFix OS spins up six isolated server processes: VisionAI (pixel metrics), GeoAI (GIS database mapping), DuplicateAI (spam prevention), PriorityAI (SLA risk model), BudgetAI (pricing database), and RoutingAI (department assignment).',
      checklistTitle: 'The Processing Core Stack:',
      checklistItems: [
        'Vision AI processes raw file uploads to extract exact materials and hazard labels.',
        'Geo AI intersects geographic vectors with deep ward database zoning boundaries.',
        'Duplicate AI calculates localized text-token embeddings to match identical tickets.',
        'Budget AI parses current material tariffs and outputs a precise digital bill of materials.'
      ],
      proTip: 'The autonomous agency flow completely eliminates municipal queue administration, saving tax overhead by 18%.',
      accentColor: '#A78BFA', // Purple Highlight
      borderColor: 'border-purple-500/30',
      icon: <Brain className="w-6 h-6 text-purple-400" />
    },
    {
      id: 'fc-eco',
      category: 'ECO PROTECTION',
      difficulty: 'Advanced',
      xp: 75,
      title: 'Biohazard Contamination',
      subtitle: 'Intervening safely when spotting illegal chemical dumping in city wetlands.',
      backHeading: 'Proximity Controls & Safety Filters',
      backDescription: 'Never make physical contact with unknown canisters, canisters with danger labels, or metallic runoffs near waterfronts. Stand at least 30 meters clear, downwind, and submit a high-priority Eco ticket to lock localized water flow systems.',
      checklistTitle: 'Hazmat Containment Checklist:',
      checklistItems: [
        'Take pictures from a safe angle. Capture warning placards, vehicle logos, or license plates.',
        'Record visible indicators of toxic fumes, colored sludge, or dying vegetation.',
        'Sanitation Department specialized hazmat response is triggered in 10 minutes.',
        'CivicOS automatically flags surrounding residential community wells for monitoring.'
      ],
      proTip: 'Every containment saves vulnerable wetlands, boosting the real-time Environmental Impact Ticker on the analytics board.',
      accentColor: '#34D399', // Emerald/Green Highlight
      borderColor: 'border-emerald-500/30',
      icon: <ShieldAlert className="w-6 h-6 text-emerald-400" />
    },
    {
      id: 'fc-rewards',
      category: 'CITIZEN INCENTIVES',
      difficulty: 'Beginner',
      xp: 25,
      title: 'Reward Store & UPI Vouchers',
      subtitle: 'How to convert XP into verified GPay/Paytm cashbacks or honor trophies.',
      backHeading: 'Claiming Contribution Value',
      backDescription: 'Level 5+ citizens with at least 600 cumulative contribution points can exchange XP directly in the Reward Store. CivicFix OS works on a real-time smart integration which dispatches vouchers directly to your linked UPI mobile phone number.',
      checklistTitle: 'Redemption Flow & Honor Milestones:',
      checklistItems: [
        'Points traded do not reduce your position on the global citizen ranking leaderboard.',
        'Leveling multipliers automatically scale the XP rewards of all active daily civic missions.',
        'Redeem ₹50 cashback directly to GPay, Paytm, or PhonePe verified accounts.',
        'Top weekly contributors receive hand-signed Certificate plaques from the Municipal Commissioner.'
      ],
      proTip: 'Earning the "Community Hero" trophy grants permanent upvote multipliers to all your future report posts.',
      accentColor: '#E5A93C', // Sand Gold
      borderColor: 'border-[#E5A93C]/30',
      icon: <Sparkles className="w-6 h-6 text-[#E5A93C]" />
    },
    {
      id: 'fc-grid',
      category: 'ELECTRICAL NETWORK',
      difficulty: 'Intermediate',
      xp: 40,
      title: 'Grid Blackout Diagnostics',
      subtitle: 'Differentiating individual lantern faults from dangerous transformer failures.',
      backHeading: 'Electrical Hazard Mapping',
      backDescription: 'Individual streetlamp failures are marked low-priority. However, 3+ contiguous dead streetlights signal localized underground cable decay or transformer fuse blowout. Flag these as "Grid Outage" immediately to secure dark sectors.',
      checklistTitle: 'Grid Diagnostic Indicators:',
      checklistItems: [
        'Examine if street numbers or pole labels are legible from the sidewalk. Include in description.',
        'Look for flashing, high-frequency light cycling, or buzzing terminal sound loops.',
        'Street grid blackouts trigger an automated law enforcement patrol coordinate update.',
        'Restoration SLA by electricity teams is guaranteed within 6 hours of AI dispatch.'
      ],
      proTip: 'Reporting dark sectors promptly lowers crime safety risks on the commuter bypass roads by up to 34%.',
      accentColor: '#C96B2C', // Copper Primary
      borderColor: 'border-[#C96B2C]/30',
      icon: <Clock className="w-6 h-6 text-[#C96B2C]" />
    }
  ];

  const categories = ['all', 'WATER SYSTEM SAFETY', 'TRANSIT SAFETY', 'CIVIC OS TECHNOLOGY', 'ECO PROTECTION', 'CITIZEN INCENTIVES', 'ELECTRICAL NETWORK'];

  const filteredCards = filterCategory === 'all' 
    ? CARDS_DATA 
    : CARDS_DATA.filter(c => c.category === filterCategory);

  const handleMarkMastered = (id: string, xpAmount: number) => {
    if (masteredIds.includes(id)) {
      setMasteredIds(prev => prev.filter(mid => mid !== id));
      playSound('click', isMuted);
      showToast("🗑️ Card marked as un-mastered.");
    } else {
      setMasteredIds(prev => [...prev, id]);
      addXp(xpAmount, "🎓 Civic Academy Module Mastered!");
      playSound('success', isMuted);
    }
  };

  const handleResetProgress = () => {
    setMasteredIds([]);
    playSound('click', isMuted);
    showToast("🔄 Civic Academy cards reset. Start training again!");
  };

  return (
    <div id="civic-flashcards-container" className="space-y-8 animate-fade-in pb-16">
      
      {/* Title Header with Progress Card */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-bg-secondary/40 border border-card-border rounded-[32px] p-8 shadow-2xl">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-copper-primary/10 border border-copper-primary/20 rounded-full">
            <BookOpen className="w-3.5 h-3.5 text-sand-gold animate-pulse" />
            <span className="text-[9px] uppercase font-bold tracking-widest text-sand-gold font-display">CITIZEN TRAINING CENTER</span>
          </div>
          <h2 className="text-3xl font-light font-display text-primary-text leading-tight">
            NagarVerse <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-copper-primary to-sand-gold">Academy</span>
          </h2>
          <p className="text-sm text-secondary-text max-w-2xl leading-relaxed">
            Master localized city rules, hazard protocols, and AI orchestrations. Complete each interactive 3D training card to claim bonus contribution XP points and boost your citizen ranking!
          </p>
        </div>

        {/* Progress Tracker Widget */}
        <div className="bg-bg-base/80 border border-card-border rounded-2xl p-5 flex items-center gap-5 w-full lg:w-80 shadow-inner">
          <div className="relative shrink-0 w-16 h-16">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-surface stroke-current"
                strokeWidth="3.5"
                fill="none"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-copper-primary stroke-current transition-all duration-500 ease-out"
                strokeDasharray={`${(masteredIds.length / CARDS_DATA.length) * 100}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary-text font-stats">
              {Math.round((masteredIds.length / CARDS_DATA.length) * 100)}%
            </div>
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-[11px] font-bold text-primary-text font-display">
              <span>Progress Dashboard</span>
              <span>{masteredIds.length} / {CARDS_DATA.length} Mastered</span>
            </div>
            <p className="text-[10px] text-secondary-text leading-tight">
              {masteredIds.length === CARDS_DATA.length 
                ? "🏆 Magnificent! You have achieved perfect Civic Mastery."
                : `${CARDS_DATA.length - masteredIds.length} modules remaining to master.`}
            </p>
            {masteredIds.length > 0 && (
              <button 
                onClick={handleResetProgress}
                className="text-[9px] font-bold text-copper-primary hover:text-sand-gold transition-colors flex items-center gap-1 font-display mt-1.5"
              >
                <RotateCcw className="w-3 h-3" /> Reset Civic Academy
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar - Categories Filtering & Sound Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-bg-secondary/20 border border-card-border p-4 rounded-2xl">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setFilterCategory(cat);
                playSound('click', isMuted);
              }}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all font-display uppercase tracking-wider cursor-pointer ${
                filterCategory === cat 
                  ? 'bg-copper-primary/25 border-copper-primary text-sand-gold shadow-[0_0_12px_rgba(201,107,44,0.15)]' 
                  : 'bg-bg-base/40 border-card-border text-secondary-text hover:text-primary-text'
              }`}
            >
              {cat === 'all' ? 'All Modules' : cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2.5 rounded-xl bg-bg-base border border-card-border text-secondary-text hover:text-primary-text hover:border-copper-primary transition-all cursor-pointer"
            title={isMuted ? "Unmute sound effects" : "Mute sound effects"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-copper-primary" />}
          </button>
          <div className="text-[10px] font-mono text-steel-gray px-3 py-1 bg-bg-base rounded-lg border border-card-border">
            ACADEMY LEVEL: {userProfileLvl} (XP: {userProfileXp})
          </div>
        </div>
      </div>

      {/* Flash Cards Grid Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredCards.map((card) => (
            <InteractiveFlashCard
              key={card.id}
              card={card}
              isMobile={isMobile}
              isMuted={isMuted}
              isMastered={masteredIds.includes(card.id)}
              onToggleMastered={() => handleMarkMastered(card.id, card.xp)}
              activeAccordionId={activeAccordionId}
              setActiveAccordionId={setActiveAccordionId}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

interface InteractiveFlashCardProps {
  card: FlashCardData;
  isMobile: boolean;
  isMuted: boolean;
  isMastered: boolean;
  onToggleMastered: () => void;
  activeAccordionId: string | null;
  setActiveAccordionId: (id: string | null) => void;
}

const InteractiveFlashCard: React.FC<InteractiveFlashCardProps> = ({
  card,
  isMobile,
  isMuted,
  isMastered,
  onToggleMastered,
  activeAccordionId,
  setActiveAccordionId
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Custom Motion Values for smooth spring physics using Framer Motion springs
  const tiltX = useRef(0);
  const tiltY = useRef(0);
  const shadowX = useRef(0);
  const shadowY = useRef(0);
  const magneticX = useRef(0);
  const magneticY = useRef(0);

  // Update card transform styles directly on the DOM element for lag-free performance
  const updateCardStyles = () => {
    const el = cardRef.current;
    if (!el) return;
    
    // Set 3D rotation, magnetic displacement, and dynamic height changes dynamically
    const flipRotation = isFlipped ? 180 : 0;
    
    // Set variables for cursor radial spotlight tracking
    el.style.transform = `perspective(1200px) rotateX(${tiltX.current}deg) rotateY(${tiltY.current + flipRotation}deg) translate3d(${magneticX.current}px, ${magneticY.current}px, 0)`;
    el.style.boxShadow = `${shadowX.current}px ${shadowY.current}px 30px -5px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.03)`;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Spotlight position variables mapped to CSS
    el.style.setProperty('--mouse-x', `${x}px`);
    el.style.setProperty('--mouse-y', `${y}px`);

    if (isMobile) return; // Disable tilt & magnetics on mobile

    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Calculate deviation from center (-1 to 1)
    const dx = (x - centerX) / centerX;
    const dy = (y - centerY) / centerY;

    // Desktop: 3D Tilt rotations (max 12deg rotation)
    tiltX.current = -dy * 12;
    tiltY.current = dx * 12;

    // Desktop: Dynamic shadow offsets (shifting in opposition to rotation)
    shadowX.current = -dx * 20;
    shadowY.current = -dy * 20;

    // Desktop: Magnetic attraction offset pull (max 8px displacement)
    magneticX.current = dx * 8;
    magneticY.current = dy * 8;

    updateCardStyles();
  };

  const handleMouseLeave = () => {
    // Reset spring positions on mouse leave
    tiltX.current = 0;
    tiltY.current = 0;
    shadowX.current = 0;
    shadowY.current = 0;
    magneticX.current = 0;
    magneticY.current = 0;
    
    // Play smooth snap back transition via CSS
    const el = cardRef.current;
    if (el) {
      el.style.transition = 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.8s cubic-bezier(0.25, 1, 0.5, 1)';
      updateCardStyles();
      setTimeout(() => {
        if (el) el.style.transition = '';
      }, 800);
    }
  };

  const handleMouseEnter = () => {
    const el = cardRef.current;
    if (el) el.style.transition = 'transform 0.1s ease-out, box-shadow 0.1s ease-out';
    if (!isMobile && !isFlipped) {
      setIsFlipped(true);
      playSound('whoosh', isMuted);
    }
  };

  const handleFlipToggle = (e: React.MouseEvent) => {
    // Only toggle if not clicking interactive buttons
    const target = e.target as HTMLElement;
    if (target.closest('.interactive-btn')) return;

    setIsFlipped(!isFlipped);
    playSound('whoosh', isMuted);
  };

  // Synchronize CSS transforms on mount/flip
  useEffect(() => {
    updateCardStyles();
  }, [isFlipped]);

  const isAccordionOpen = activeAccordionId === card.id;
  const toggleAccordion = () => {
    playSound('click', isMuted);
    setActiveAccordionId(isAccordionOpen ? null : card.id);
  };

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -15 }}
      transition={{ type: 'spring', stiffness: 80, damping: 14 }}
      className="perspective-container relative w-full select-none"
      style={{
        perspective: '1500px',
      }}
    >
      {/* 3D Rotatable Card Body */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={!isMobile ? () => {
          setIsFlipped(true);
          playSound('whoosh', isMuted);
        } : undefined}
        onClick={isMobile ? handleFlipToggle : undefined}
        className={`w-full relative rounded-3xl bg-bg-secondary/40 border border-card-border p-6 cursor-pointer overflow-hidden transition-shadow duration-300 min-h-[360px] flex flex-col justify-between`}
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.1), box-shadow 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.1)',
        }}
      >
        
        {/* Dynamic Specular Lighting Highlight & Cursor Spotlight Glow */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: 'radial-gradient(circle 220px at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(255,255,255,0.03), transparent 80%)'
          }}
        />
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle 180px at var(--mouse-x, 100px) var(--mouse-y, 100px), rgba(201, 107, 44, 0.15), transparent 75%)'
          }}
        />

        {/* Diagonal Gloss Glass Sweep on Hover */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
          <div 
            className="absolute top-0 -left-full w-[200%] h-full bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-20 transition-all duration-1000 ease-in-out"
            style={{
              transform: isFlipped ? 'translateX(100%)' : 'none',
              transition: 'transform 1s cubic-bezier(0.25, 1, 0.5, 1)'
            }}
          />
        </div>

        {/* --- FRONT OF CARD --- */}
        <div 
          className="w-full h-full flex flex-col justify-between"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(0deg)',
          }}
        >
          {/* Card Head */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md bg-surface border border-card-border font-display" style={{ color: card.accentColor }}>
                {card.category}
              </span>
              <div className="flex items-center gap-1.5 text-[10px] text-steel-gray font-mono">
                <Clock className="w-3.5 h-3.5" />
                <span>{card.xp} XP</span>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2">
              <div className="p-3 bg-bg-base border border-card-border rounded-2xl shrink-0 shadow-md">
                {card.icon}
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold font-display text-primary-text leading-snug">
                  {card.title}
                </h3>
                <span className="text-[10px] font-bold tracking-wider font-mono text-[#E5A93C] flex items-center gap-1">
                  <Zap className="w-3 h-3" /> DIFFICULTY: {card.difficulty.toUpperCase()}
                </span>
              </div>
            </div>

            <p className="text-xs text-secondary-text leading-relaxed font-sans pt-3 border-t border-card-border/50">
              {card.subtitle}
            </p>
          </div>

          {/* Card Foot */}
          <div className="flex justify-between items-center pt-4 mt-6 border-t border-card-border/50">
            <span className="text-[9px] uppercase tracking-wider text-steel-gray font-display flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-copper-primary" /> Hover to reveal protocol
            </span>
            <div className="w-2.5 h-2.5 rounded-full bg-copper-primary animate-pulse"></div>
          </div>
        </div>

        {/* --- BACK OF CARD --- */}
        <div 
          className="absolute inset-0 w-full h-full p-6 flex flex-col justify-between bg-[#19130F]/95 backdrop-blur-md rounded-3xl"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="space-y-3 flex-1 flex flex-col justify-between overflow-y-auto no-scrollbar">
            
            {/* Header */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-bold tracking-wider text-sand-gold uppercase font-display">
                  ACADEMY PROTOCOL
                </span>
                <span className="text-[10px] font-extrabold text-success font-stats">
                  +{card.xp} XP AWARD
                </span>
              </div>
              <h4 className="text-md font-bold font-display text-primary-text">
                {card.backHeading}
              </h4>
              <p className="text-[11px] text-secondary-text leading-relaxed pt-2 border-t border-card-border">
                {card.backDescription}
              </p>
            </div>

            {/* Accordion Expandable Section */}
            <div className="space-y-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleAccordion();
                }}
                className="interactive-btn w-full px-3 py-2 rounded-xl bg-surface hover:bg-bg-secondary border border-card-border flex items-center justify-between text-xs font-bold text-primary-text transition-all cursor-pointer font-display"
              >
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-copper-primary" />
                  {isAccordionOpen ? "Hide Training Checklist" : "Show Training Checklist"}
                </span>
                <ChevronDown className={`w-4 h-4 text-steel-gray transition-transform duration-300 ${isAccordionOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence initial={false}>
                {isAccordionOpen && (
                  <motion.div
                    key="accordion-content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 120, damping: 16 }}
                    className="overflow-hidden bg-bg-base/60 border border-card-border rounded-xl p-3 space-y-2 text-left"
                    onClick={(e) => e.stopPropagation()} // Prevent card flip on click inside accordion
                  >
                    <span className="text-[9px] uppercase font-bold text-sand-gold font-display block">
                      {card.checklistTitle}
                    </span>
                    <ul className="space-y-1.5 pl-3 list-decimal text-[10px] text-secondary-text leading-relaxed font-sans">
                      {card.checklistItems.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                    <div className="pt-2 border-t border-card-border text-[9px] text-steel-gray italic flex items-start gap-1.5 font-sans leading-relaxed">
                      <span className="text-copper-primary font-bold">PRO TIP:</span>
                      <span>{card.proTip}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Actions Row */}
            <div className="flex gap-2 pt-3 border-t border-card-border mt-auto">
              {/* Mark Mastered Toggle Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMastered();
                }}
                className={`interactive-btn flex-1 py-2 px-3 rounded-xl border text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer font-display ${
                  isMastered
                    ? 'bg-success/20 border-success text-success'
                    : 'bg-copper-primary hover:brightness-110 border-copper-primary text-primary-text shadow-[0_0_12px_rgba(201,107,44,0.3)]'
                }`}
              >
                {isMastered ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mastered! ({card.xp} XP Claimed)</span>
                  </>
                ) : (
                  <>
                    <Award className="w-3.5 h-3.5 animate-bounce" />
                    <span>Mark as Mastered (+{card.xp} XP)</span>
                  </>
                )}
              </button>

              {/* Mobile Back-to-Front Flip Button */}
              {isMobile && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFlipped(false);
                    playSound('whoosh', isMuted);
                  }}
                  className="interactive-btn p-2 rounded-xl bg-surface border border-card-border hover:border-copper-primary text-steel-gray hover:text-primary-text transition-all cursor-pointer"
                  title="Flip back to front"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>
        </div>

      </div>
    </motion.div>
  );
};
