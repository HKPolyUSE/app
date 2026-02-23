import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { 
  Cpu, 
  Database, 
  ChevronRight, 
  ArrowUpCircle, 
  RotateCcw, 
  AlertTriangle,
  X,
  Server,
  Settings2,
  Zap,
  HardDrive,
  ZoomIn,
  ZoomOut,
  Maximize,
  CheckCircle2,
  XCircle,
  Activity,
  RefreshCw
} from "lucide-react";

const MAX_ROUNDS = 20;
const INITIAL_BUDGET = 10000;
const INITIAL_USERS = 50; 

const SERVER_LEVELS = [
  { id: 0, type: 'balanced', name: "MVP Sandbox", capacity: 150, specs: "2 vCPU / 4GB RAM", cost: 0, maintenance: 400, cpuMult: 1.0, memMult: 1.0 },
  { id: 1, type: 'balanced', name: "Standard Rack", capacity: 400, specs: "8 vCPU / 16GB RAM", cost: 2500, maintenance: 1200, cpuMult: 1.0, memMult: 1.0 },
  { id: 2, type: 'compute', name: "Compute Pro", capacity: 450, specs: "16 vCPU / 8GB RAM", cost: 2800, maintenance: 1400, cpuMult: 0.6, memMult: 1.5 },
  { id: 3, type: 'memory', name: "Memory Vault", capacity: 450, specs: "4 vCPU / 32GB RAM", cost: 2800, maintenance: 1400, cpuMult: 1.5, memMult: 0.6 },
  { id: 4, type: 'balanced', name: "Enterprise Mainframe", capacity: 2000, specs: "64 vCPU / 256GB RAM", cost: 12000, maintenance: 6000, cpuMult: 1.0, memMult: 1.0 }
];

const SCENARIOS = {
  1: { event: "The MVP Launch", context: "Byte-Bites is live! The load is balanced, but the API logic is fresh and unoptimized.", webMult: 1.2, dbMult: 0.8 },
  5: { event: "Weekend Surge", context: "Pizza orders are flying in. High write-volume on the DB tier!", webMult: 1.0, dbMult: 1.8 },
  10: { event: "Viral Marketing", context: "Millions are browsing menus. The Web CPU is redlining from search requests!", webMult: 2.2, dbMult: 0.9 },
  15: { event: "Global Scale", context: "Massive sustained load on all tiers. No room for error.", webMult: 1.5, dbMult: 1.5 }
};

const apiKey = "";

const callGemini = async (prompt) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload = { contents: [{ parts: [{ text: prompt }] }] };
  const delays = [1000, 2000, 4000, 8000, 16000];

  for (let attempt = 0; attempt <= 5; attempt++) {
    try {
      const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      return result.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
    } catch (error) {
      if (attempt === 5) throw error;
      await new Promise(res => setTimeout(res, delays[attempt]));
    }
  }
};

function getUserGrowth(round) { return 25 + Math.floor(round * 1.5); }

function getDetailedReflection({ crashes, activeUsers, budget }) {
  const isBankrupt = budget <= 0;
  if (!isBankrupt && activeUsers >= 1200 && crashes === 0) {
    return { grade: "S", style: "The Hardware Whisperer", color: "text-emerald-600", causal: "Perfectly timed upgrades. You pushed vertical scaling to its absolute limit without dropping a single order." };
  }
  if (!isBankrupt && activeUsers >= 800) {
    return { grade: "A", style: "Solid Sysadmin", color: "text-indigo-600", causal: "Good scaling and survival instincts. You managed the downtime well and kept the business afloat." };
  }
  if (!isBankrupt && activeUsers > 200) {
    return { grade: "C", style: "Survivalist", color: "text-amber-600", causal: "You survived the monolith, but struggled with load. Your customers experienced heavy lag, capping growth." };
  }
  return { grade: "F", style: "Kitchen Nightmare", color: "text-rose-600", causal: "The server melted down. Whether through bankruptcy or complete unresponsiveness, the monolith collapsed under pressure." };
}

function Modal({ title, children, onClose, icon, footer }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] bg-slate-900 bg-opacity-60 backdrop-blur-md p-4 antialiased font-sans text-black">
      <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-2xl max-w-[90vw] md:max-w-lg w-full overflow-hidden border border-slate-100 relative text-center">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors z-20">
          <X size={20} />
        </button>
        <div className="p-6 md:p-8">
          {icon && <div className="text-5xl md:text-6xl mb-4 flex justify-center">{icon}</div>}
          <h2 className="text-[16px] md:text-[18px] font-normal text-black mb-3 uppercase tracking-wide">{title}</h2>
          <div className="mb-6 md:mb-8 leading-relaxed text-[14px] sm:text-[18px] text-black font-normal">{children}</div>
          {footer ? footer : (
            <button onClick={onClose} className="w-full py-3 md:py-4 bg-slate-900 text-white rounded-xl font-normal text-[16px] md:text-[18px] hover:bg-slate-800 transition-all shadow-lg active:scale-[0.98]">
              Proceed
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const OverviewScreen = ({ onStart }) => {
  return (
    <div className="h-screen w-full bg-white flex flex-col items-center justify-center font-sans text-black selection:bg-indigo-100 overflow-hidden px-4 sm:px-12 py-4 text-black">
      <div className="max-w-4xl w-full h-full max-h-[900px] flex flex-col items-center justify-center text-center">
        <h1 className="text-[22px] sm:text-[34px] md:text-[42px] font-normal tracking-tight mb-1 sm:mb-2 uppercase tracking-widest">Byte-Bites Phase 1: The Monolith</h1>
        <p className="text-[14px] sm:text-[18px] text-slate-500 mb-4 sm:mb-10 italic flex-shrink-0">Welcome to the Kitchen.</p>
        <div className="bg-slate-50 border border-slate-100 rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-8 mb-4 sm:mb-10 text-left w-full shadow-sm flex-shrink min-h-0 overflow-y-auto">
          <p className="text-[14px] sm:text-[16px] leading-relaxed mb-4">Byte-Bites is growing fast. Right now, everything runs on one single server. Monitor your capacity as word of mouth spreads.</p>
          <p className="text-[14px] sm:text-[16px] leading-relaxed mb-6"><strong>Your Mission:</strong> Survive 20 rounds of viral surges using specialized hardware configuration paths.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="flex flex-col gap-1 sm:gap-2 text-black">
              <div className="text-[18px] sm:text-[24px]">📈</div>
              <h3 className="font-normal uppercase text-[13px] sm:text-[15px]">Monitor Load</h3>
              <p className="text-[12px] sm:text-[14px] text-slate-600 leading-snug">Watch the server capacity. If it hits 100%, orders fail and stability drops.</p>
            </div>
            <div className="flex flex-col gap-1 sm:gap-2 text-black">
              <div className="text-[18px] sm:text-[24px]">⚙️</div>
              <h3 className="font-normal uppercase text-[13px] sm:text-[15px]">Config Hardware</h3>
              <p className="text-[12px] sm:text-[14px] text-slate-600 leading-snug">Choose between Balanced, Compute, or Memory focused server nodes.</p>
            </div>
            <div className="flex flex-col gap-1 sm:gap-2 text-black">
              <div className="text-[18px] sm:text-[24px]">💰</div>
              <h3 className="font-normal uppercase text-[13px] sm:text-[15px]">Manage Capital</h3>
              <p className="text-[12px] sm:text-[14px] text-slate-600 leading-snug">Upgrades require downtime and cost money. Round expenses occur even if down!</p>
            </div>
          </div>
        </div>
        <button onClick={onStart} className="flex-shrink-0 px-8 sm:px-12 py-3 sm:py-5 bg-indigo-600 text-white rounded-[1.25rem] sm:rounded-[1.5rem] font-normal text-[16px] sm:text-[20px] hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-200">Start Phase 1 Simulation</button>
      </div>
    </div>
  );
};

export default function App() {
  const [gameState, setGameState] = useState("overview");
  const [round, setRound] = useState(1);
  const [serverIdx, setServerIdx] = useState(0);
  const [downtimeLeft, setDowntimeLeft] = useState(0);
  const [crash, setCrash] = useState(false);
  const [crashLeft, setCrashLeft] = useState(0);
  const [activeUsers, setActiveUsers] = useState(INITIAL_USERS);
  const [log, setLog] = useState([]);
  const [showScaleModal, setShowScaleModal] = useState(false); 
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [showRebootModal, setShowRebootModal] = useState(false);
  const [budget, setBudget] = useState(INITIAL_BUDGET);
  const [gameOverReason, setGameOverReason] = useState(null);
  const [stability, setStability] = useState(100); 
  const [zoomLevel, setZoomLevel] = useState(1);
  const [advisorText, setAdvisorText] = useState("");
  const [isAdvising, setIsAdvising] = useState(false);
  const [showAdvisorModal, setShowAdvisorModal] = useState(false);
  const [aiPostMortem, setAiPostMortem] = useState("");
  const [isGeneratingPostMortem, setIsGeneratingPostMortem] = useState(false);

  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [topologyHeight, setTopologyHeight] = useState(350);
  const isResizingSidebar = useRef(false);
  const isResizingTopology = useRef(false);
  const logTopRef = useRef(null);
  const mainAreaRef = useRef(null);

  useEffect(() => { logTopRef.current?.scrollIntoView({ behavior: "smooth" }); }, [log]);

  const handleMouseMove = useCallback((e) => {
    if (isResizingSidebar.current) {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 200 && newWidth < window.innerWidth * 0.4) setSidebarWidth(newWidth);
    }
    if (isResizingTopology.current && mainAreaRef.current) {
      const rect = mainAreaRef.current.getBoundingClientRect();
      const newHeight = e.clientY - rect.top;
      if (newHeight > 150 && newHeight < rect.height - 150) setTopologyHeight(newHeight);
    }
  }, []);

  const stopResizing = useCallback(() => {
    isResizingSidebar.current = false;
    isResizingTopology.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", stopResizing);
    document.body.style.cursor = "default";
  }, [handleMouseMove]);

  const startResizingSidebar = (e) => { isResizingSidebar.current = true; document.addEventListener("mousemove", handleMouseMove); document.addEventListener("mouseup", stopResizing); document.body.style.cursor = "col-resize"; };
  const startResizingTopology = (e) => { isResizingTopology.current = true; document.addEventListener("mousemove", handleMouseMove); document.addEventListener("mouseup", stopResizing); document.body.style.cursor = "row-resize"; };

  const currentServer = SERVER_LEVELS[serverIdx];
  const currentScenario = useMemo(() => {
    const keys = Object.keys(SCENARIOS).map(Number).sort((a, b) => b - a);
    const roundKey = keys.find(k => k <= round) || 1;
    return SCENARIOS[roundKey];
  }, [round]);

  const baseUtil = activeUsers / currentServer.capacity;
  const webLoad = Math.min(baseUtil * (currentScenario.webMult || 1) * currentServer.cpuMult, 1.25);
  const dataLoad = Math.min(baseUtil * (currentScenario.dbMult || 1) * currentServer.memMult, 1.25);
  const effectiveUtil = Math.max(webLoad, dataLoad);

  const isScaling = downtimeLeft > 0;
  const isDown = isScaling || crash;
  const isRecovering = crash && crashLeft > 0;
  const isGameOver = round > MAX_ROUNDS || !!gameOverReason || (round > 1 && activeUsers <= 0);
  
  const systemStatusLabel = isRecovering ? "Rebooting" : crash ? "Down" : downtimeLeft > 0 ? "Maintenance" : effectiveUtil > 0.85 ? "High load" : "Stable";

  const getBarColor = (util, isNodeDown) => {
    if (isNodeDown) return 'bg-slate-400';
    if (util >= 1.0) return 'bg-rose-500';
    if (util >= 0.85) return 'bg-amber-500';
    return 'bg-indigo-500';
  };

  const getStatusDisplay = () => {
    if (crash || isRecovering) return <span className="text-rose-600 font-bold flex items-center gap-1.5"><XCircle size={16} /> {systemStatusLabel}</span>;
    if (downtimeLeft > 0) return <span className="text-amber-600 font-bold flex items-center gap-1.5"><Activity size={16} /> {systemStatusLabel}</span>;
    if (effectiveUtil > 0.85) return <span className="text-amber-600 font-bold flex items-center gap-1.5"><AlertTriangle size={16} /> {systemStatusLabel}</span>;
    return <span className="text-emerald-600 font-bold flex items-center gap-1.5"><CheckCircle2 size={16} /> {systemStatusLabel}</span>;
  };

  const handleGetAdvice = async () => {
    setShowAdvisorModal(true);
    setIsAdvising(true);
    setAdvisorText("Pinging the Staff Engineer on Slack...");
    try {
      const utilPercent = Math.round(effectiveUtil * 100);
      const prompt = `You are a brilliant Senior Staff Engineer at "Byte-Bites", a fast-growing food delivery app. The Lead Architect (the player) is asking for your advice on the current infrastructure. 
      Current game state: Round ${round}/20, Server Load: ${utilPercent}%, Active Users: ${activeUsers}, Budget: $${budget}, Stability: ${stability}%. The current server is the ${currentServer.name} (${currentServer.specs}).
      Give them 2-3 sentences of advice. Tell them if they are doing well or about to crash. Be slightly sarcastic but actually helpful regarding vertical scaling and their budget. Use food or server puns. Do not use markdown formatting.`;
      
      const text = await callGemini(prompt);
      setAdvisorText(text);
    } catch (e) { setAdvisorText("The Staff Engineer is asleep at their keyboard (API Error). Try again later."); }
    setIsAdvising(false);
  };

  const generatePostMortem = async () => {
    setIsGeneratingPostMortem(true);
    setAiPostMortem("Analyzing server logs...");
    try {
      const text = await callGemini(`Final stats: Round ${round}, Users ${activeUsers}, Budget $${budget}. Post-mortem in 3 sentences.`);
      setAiPostMortem(text);
    } catch (e) { setAiPostMortem("Grease fire corrupted the logs."); }
    setIsGeneratingPostMortem(false);
  };

  const handleUpgrade = (idx) => {
    const next = SERVER_LEVELS[idx];
    setBudget(b => b - next.cost);
    setServerIdx(idx);
    setDowntimeLeft(1); 
    setLog(prev => [{ type: "warn", text: `Round ${round}: Scaling to ${next.name}. Infrastructure offline.` }, ...prev]);
    setShowScaleModal(false);
  };

  const handleRestart = () => {
    // UPDATED: Reboot is now immediate but leaves the system unstable
    setCrash(false);
    setCrashLeft(0);
    setStability(25); // System is back up but very fragile
    setLog(prev => [{ type: "recover", text: `Round ${round}: [System] Forced reboot successful. Systems online but highly unstable.` }, ...prev]);
    setShowRebootModal(false);
  };

  const nextRound = () => {
    if (isGameOver) return;
    if (round === MAX_ROUNDS) { setGameOverReason("finished"); return; }

    const growth = !isDown ? getUserGrowth(round) : 0;
    const pool = activeUsers + growth;
    
    let churn = 0;
    if (isDown) churn = Math.ceil(pool * 0.12); 
    else if (effectiveUtil >= 1.0) churn = Math.ceil(pool * 0.15);
    else if (effectiveUtil >= 0.85) churn = Math.ceil(pool * 0.04);

    const nextUsers = Math.max(0, pool - churn);
    const maintenance = currentServer.maintenance; 
    const revenue = !isDown ? (nextUsers * 25) : 0; 
    const netIncome = revenue - maintenance;
    const newBudget = budget + netIncome;

    let nextStability = stability;
    if (effectiveUtil > 0.90 && !isDown) nextStability = Math.max(0, nextStability - 15);
    else if (!isDown && effectiveUtil < 0.70) nextStability = Math.min(100, nextStability + 10);

    let nextCrash = crash;
    let nextCrashLeft = crashLeft;
    let nextDowntime = downtimeLeft;

    if (!isDown && Math.random() > (nextStability / 100 + 0.25)) {
      nextCrash = true;
      nextStability = Math.max(0, nextStability - 30);
      setLog(prev => [{ type: "crash", text: `Round ${round}: [FATAL] Monolith overloaded and crashed!` }, ...prev]);
    }

    if (downtimeLeft > 0) {
      nextDowntime--;
      if (nextDowntime === 0) setLog(prev => [{ type: "recover", text: `Round ${round}: [System] Upgrade complete. Monolith online.` }, ...prev]);
    } else if (crash) {
      if (nextCrashLeft > 0) {
        nextCrashLeft--;
        if (nextCrashLeft === 0) {
          nextCrash = false;
          nextStability = 50;
          setLog(prev => [{ type: "recover", text: `Round ${round}: [System] Monolith recovered. Restoration complete.` }, ...prev]);
        }
      }
    }

    setRound(r => r + 1);
    setActiveUsers(nextUsers);
    setBudget(newBudget);
    setStability(nextStability);
    setCrash(nextCrash);
    setCrashLeft(nextCrashLeft);
    setDowntimeLeft(nextDowntime);

    setLog(prev => [{ 
      type: isDown ? "crash" : "normal", 
      text: `Round ${round}: Net ${netIncome >= 0 ? "+" : ""}${netIncome} | Cost: $${maintenance} | Customers: ${nextUsers}` 
    }, ...prev]);

    if (newBudget <= 0) setGameOverReason("bankrupt");
  };

  const reset = () => {
    setRound(1); setServerIdx(0); setDowntimeLeft(0); setCrash(false); setCrashLeft(0);
    setActiveUsers(INITIAL_USERS); setBudget(INITIAL_BUDGET); setStability(100);
    setLog([]); setGameOverReason(null); setGameState("overview"); setShowRestartModal(false);
  };

  const reflection = getDetailedReflection({ crashes: 0, activeUsers, budget });

  const getNodeBorder = (util, isNodeDown) => {
    if (isNodeDown) return 'border-rose-300 ring-4 ring-rose-50';
    if (util >= 1.0) return 'border-rose-500 ring-4 ring-rose-100';
    if (util >= 0.85) return 'border-amber-400 ring-4 ring-amber-50';
    return 'border-slate-200 hover:border-indigo-400';
  };

  if (gameState === "overview") return <OverviewScreen onStart={() => setGameState("playing")} />;

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-100 font-sans text-[18px] overflow-hidden antialiased select-none text-black">
      
      {showRestartModal && (
        <Modal title="Reset Simulation" icon={<AlertTriangle className="text-rose-500" size={60} />} onClose={() => setShowRestartModal(false)} footer={<div className="flex gap-4 w-full"><button onClick={() => setShowRestartModal(false)} className="flex-1 py-4 bg-slate-100 rounded-xl text-black font-normal">Cancel</button><button onClick={reset} className="flex-1 py-4 bg-rose-600 text-white rounded-xl font-normal text-white">Reset</button></div>}>Confirm reset? All round progress will be lost.</Modal>
      )}

      {showRebootModal && (
        <Modal 
          title="System Recovery" 
          icon={<RefreshCw className="text-rose-500 animate-spin-slow" size={60} />} 
          onClose={() => setShowRebootModal(false)}
          footer={
            <div className="flex gap-4 w-full">
              <button onClick={() => setShowRebootModal(false)} className="flex-1 py-4 bg-slate-100 rounded-xl text-black font-normal">Cancel</button>
              <button onClick={handleRestart} className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-normal text-white">Reboot Server</button>
            </div>
          }
        >
          The monolith server has encountered a fatal crash. System reboot is required to restore customer access. Note: Initial boot stability will be critical (25%).
        </Modal>
      )}

      {showAdvisorModal && (
        <Modal title="Senior Staff Engineer" icon="🧔🏻‍♂️" onClose={() => setShowAdvisorModal(false)} footer={<button onClick={() => setShowAdvisorModal(false)} className="w-full py-4 bg-slate-900 text-white rounded-xl font-normal text-white">Close advice</button>}>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 min-h-[140px] flex items-center justify-center">
            {isAdvising ? <span className="text-slate-400 animate-pulse italic">Thinking...</span> : <p className="text-black font-normal leading-relaxed">"{advisorText}"</p>}
          </div>
        </Modal>
      )}

      {showScaleModal && (
        <Modal title="Hardware Configuration" icon={<Settings2 size={60} className="text-slate-700" />} onClose={() => setShowScaleModal(false)} footer={<button onClick={() => setShowScaleModal(false)} className="w-full py-4 bg-slate-100 text-black rounded-xl font-normal text-black">Cancel</button>}>
          <div className="grid grid-cols-1 gap-3 text-left">
            {[
              { idx: 1, type: 'Balanced', icon: <Cpu />, specs: "8 vCPU / 16GB RAM", cost: 2500 },
              { idx: 2, type: 'Compute', icon: <Zap />, specs: "16 vCPU / 8GB RAM", cost: 2800 },
              { idx: 3, type: 'Memory', icon: <HardDrive />, specs: "4 vCPU / 32GB RAM", cost: 2800 }
            ].map((opt) => (
              <button key={opt.idx} onClick={() => handleUpgrade(opt.idx)} className="flex items-center gap-4 p-4 border-2 border-slate-100 rounded-2xl hover:border-indigo-400 hover:bg-indigo-50 transition-all text-left">
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm">{opt.icon}</div>
                <div className="flex-1"><div className="flex justify-between items-center"><span className="font-bold text-black">{opt.type}</span><span className="text-indigo-600 font-bold">${opt.cost}</span></div><div className="text-sm text-slate-500 font-normal">{opt.specs}</div></div>
              </button>
            ))}
          </div>
          <p className="mt-4 text-rose-600 text-sm font-bold flex items-center justify-center gap-1.5">
            <AlertTriangle size={14} /> Note: Applying a new config causes 1 round of system downtime.
          </p>
        </Modal>
      )}

      {gameOverReason && (
        <Modal title="Analysis Report" icon="🏆" onClose={reset}>
          <div className="flex flex-col items-center gap-2 mb-4">
            <div className={`text-[40px] font-bold border-4 rounded-full w-20 h-20 flex items-center justify-center ${reflection.color} border-current`}>{reflection.grade}</div>
            <div className={`text-[20px] font-bold uppercase ${reflection.color}`}>{reflection.style}</div>
          </div>
          <p className="mb-4 text-black font-normal">{reflection.causal}</p>
          {!aiPostMortem ? <button onClick={generatePostMortem} disabled={isGeneratingPostMortem} className="w-full py-4 bg-purple-600 text-white rounded-xl font-normal text-white">Generate AI Post-Mortem ✨</button> : <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 text-left text-sm leading-relaxed text-black font-normal">{aiPostMortem}</div>}
        </Modal>
      )}

      <div className="flex flex-col w-full max-w-[1440px] h-full bg-white lg:border border-slate-200 lg:shadow-2xl overflow-hidden font-sans text-black">
        <header className="flex-shrink-0 p-5 lg:px-10 border-b bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-4 h-auto min-h-[100px] shadow-sm z-10 text-white">
          <div className="flex flex-col md:w-auto text-center md:text-left">
            <h1 className="text-[18px] font-normal flex items-center justify-center md:justify-start gap-2 uppercase tracking-widest text-white"><Server size={18} className="text-indigo-400" /> Phase 1</h1>
            <p className="text-[14px] font-normal text-slate-400 uppercase">The Monolith</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={handleGetAdvice} className="h-12 px-6 bg-purple-600 rounded-xl text-sm font-bold shadow-md text-white" disabled={isGameOver}>Ask Staff Eng ✨</button>
            <button onClick={nextRound} className="h-12 px-10 bg-indigo-600 rounded-xl text-sm font-bold text-white flex items-center gap-2 shadow-md" disabled={isGameOver}>Next Round <ChevronRight size={18} /></button>
            <button onClick={() => setShowRestartModal(true)} className="h-12 px-4 bg-slate-800 rounded-xl text-white"><RotateCcw size={18} /></button>
          </div>
        </header>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative text-black">
          <main ref={mainAreaRef} className="flex-1 flex flex-col overflow-hidden bg-slate-50 min-h-0 text-black">
            <section style={{ height: `${topologyHeight}px` }} className="bg-white flex-shrink-0 flex items-center justify-center relative p-6 border-b border-slate-200 shadow-inner overflow-hidden text-black">
              <h4 className="absolute top-5 left-10 font-normal text-slate-400 uppercase text-[12px] tracking-widest">Infrastructure Topology</h4>
              
              <div className="absolute bottom-5 right-5 flex gap-1 p-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30">
                <button onClick={() => setZoomLevel(0.75)} className={`p-2 rounded-lg ${zoomLevel === 0.75 ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400'}`}><ZoomOut size={18} /></button>
                <button onClick={() => setZoomLevel(1)} className={`p-2 rounded-lg ${zoomLevel === 1 ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400'}`}><Maximize size={18} /></button>
                <button onClick={() => setZoomLevel(1.5)} className={`p-2 rounded-lg ${zoomLevel === 1.5 ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400'}`}><ZoomIn size={18} /></button>
              </div>

              <div className="transition-transform duration-300" style={{ transform: `scale(${zoomLevel})` }}>
                <button 
                  onClick={() => {
                    if (crash && crashLeft === 0) setShowRebootModal(true);
                    else if (!isDown && !isGameOver) setShowScaleModal(true);
                  }}
                  disabled={(isDown && !crash) || isRecovering || isGameOver}
                  className={`relative w-[280px] h-[160px] max-w-[280px] max-h-[160px] p-3 rounded-[2rem] border-[4px] bg-slate-50 flex flex-col items-center justify-center gap-3 shadow-xl group outline-none transition-all duration-300 ${getNodeBorder(effectiveUtil, isDown)}`}
                >
                  {isDown && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 -rotate-12 z-20 pointer-events-none">
                      <div className="bg-red-600 text-white font-bold px-4 py-2 rounded-lg shadow-xl border-4 border-white text-xl uppercase tracking-widest animate-bounce">
                        Down
                      </div>
                    </div>
                  )}
                  
                  <div className={`w-full flex gap-2 h-full transition-all duration-300 ${isDown ? 'grayscale opacity-60' : ''}`}>
                    <div className={`flex-1 p-3 rounded-2xl border-2 transition-all flex flex-col justify-center ${isDown ? 'bg-slate-200 border-slate-300' : 'bg-indigo-50 border-indigo-100'}`}>
                      <span className="text-[10px] uppercase font-bold text-indigo-500 mb-1 flex items-center gap-1"><Cpu size={12} className="opacity-70 flex-shrink-0" /> Web App</span>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold mb-1"><span>CPU</span><span>{isDown ? '0%' : `${(webLoad * 100).toFixed(0)}%`}</span></div>
                      <div className="w-full bg-indigo-100 h-1.5 rounded-full overflow-hidden"><div className={`h-full transition-all duration-700 ${getBarColor(webLoad, isDown)}`} style={{ width: isDown ? '0%' : `${Math.min(webLoad * 100, 100)}%` }}></div></div>
                    </div>
                    <div className={`flex-1 p-3 rounded-2xl border-2 transition-all flex flex-col justify-center ${isDown ? 'bg-slate-200 border-slate-300' : 'bg-emerald-50 border-emerald-100'}`}>
                      <span className="text-[10px] uppercase font-bold text-emerald-500 mb-1 flex items-center gap-1"><Database size={12} className="opacity-70 flex-shrink-0" /> Database</span>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold mb-1"><span>I/O</span><span>{isDown ? '0%' : `${(dataLoad * 100).toFixed(0)}%`}</span></div>
                      <div className="w-full bg-emerald-100 h-1.5 rounded-full overflow-hidden"><div className={`h-full transition-all duration-700 ${getBarColor(dataLoad, isDown)}`} style={{ width: isDown ? '0%' : `${Math.min(dataLoad * 100, 100)}%` }}></div></div>
                    </div>
                  </div>
                  <div className={`w-full flex justify-between gap-2 mt-1 px-1 transition-all duration-300 ${isDown ? 'grayscale opacity-60' : ''}`}>
                    <div className="flex-1 bg-white py-1 px-2 rounded-lg text-center border border-slate-100 text-[10px] font-bold shadow-sm truncate text-black uppercase leading-tight">Load: {isDown ? '0%' : `${(effectiveUtil * 100).toFixed(0)}%`}</div>
                    <div className="flex-1 bg-white py-1 px-2 rounded-lg text-center border border-slate-100 text-[10px] font-bold shadow-sm truncate text-black uppercase leading-tight">{currentServer.specs}</div>
                  </div>
                </button>
              </div>
            </section>
            
            <div onMouseDown={startResizingTopology} className="h-2 bg-slate-200 hover:bg-indigo-400 transition-colors flex items-center justify-center cursor-row-resize"><div className="w-12 h-1 bg-slate-300 rounded-full" /></div>

            <section className="flex-1 overflow-y-auto p-6 space-y-6 text-black font-normal">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Round", value: `${round} / ${MAX_ROUNDS}`, color: "bg-slate-50 border-slate-100" },
                  { label: "Status", value: getStatusDisplay(), color: "bg-slate-50 border-slate-100" },
                  { label: "Customers", value: Math.round(activeUsers).toLocaleString(), color: "bg-slate-50 border-slate-100" },
                  { label: "Stability", value: isDown ? "—" : `${stability.toFixed(0)}%`, color: stability > 50 ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100" },
                  { label: "Sys Load", value: isDown ? "—" : `${(effectiveUtil * 100).toFixed(0)}%`, color: effectiveUtil >= 0.85 ? "bg-rose-50 border-rose-100" : "bg-indigo-50 border-indigo-100" },
                  { label: "Capacity", value: currentServer.capacity, color: "bg-slate-50 border-slate-100" },
                  { label: "Latency", value: isDown ? "—" : `${Math.round(250 + (effectiveUtil > 0.8 ? (effectiveUtil - 0.8) * 1000 : 0))}ms`, color: effectiveUtil >= 0.85 ? "bg-rose-50 border-rose-100" : "bg-amber-50 border-amber-100" },
                  { label: "Capital", value: `$${Math.round(budget).toLocaleString()}`, color: "bg-violet-50 border-violet-100 text-violet-700" }
                ].map((m, i) => (
                  <div key={i} className={`flex flex-col gap-1 border p-4 rounded-2xl shadow-sm ${m.color}`}><span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">{m.label}</span><div className="font-bold text-[18px] text-black leading-none">{m.value}</div></div>
                ))}
              </div>
              <div className="bg-orange-50 border border-orange-100 p-8 rounded-[2rem] text-center shadow-sm text-black">
                <h4 className="font-bold text-black uppercase tracking-wide mb-2">{currentScenario.event}</h4>
                <p className="text-slate-600 leading-relaxed max-w-2xl mx-auto text-[16px] font-normal text-black">{currentScenario.context}</p>
              </div>
            </section>
          </main>
          
          <div className="hidden lg:flex w-2 cursor-col-resize bg-slate-200 hover:bg-indigo-400 items-center justify-center" onMouseDown={startResizingSidebar}><div className="w-1 h-20 bg-slate-300 rounded-full" /></div>

          <aside className="bg-white flex flex-col overflow-hidden border-l border-slate-200 text-black" style={{ width: `${sidebarWidth}px` }}>
            <div className="p-6 border-b bg-slate-50 h-[70px] flex items-center justify-between text-black"><h3 className="font-bold flex items-center gap-2 text-[14px] uppercase tracking-widest text-black"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span> Telemetry</h3></div>
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3 bg-slate-100/30 text-black">
              <div ref={logTopRef} />
              {log.length === 0 ? <div className="p-10 text-slate-400 italic text-center uppercase text-sm tracking-widest font-normal text-black text-center">Awaiting Pulse...</div> : 
                log.map((item, i) => (<div key={i} className={`p-4 rounded-xl text-[14px] shadow-sm border font-normal text-black ${item.type === 'crash' ? 'bg-rose-50 border-rose-200 text-rose-700 font-bold' : 'bg-white border-slate-200 text-slate-700'}`}>{item.text}</div>))
              }
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
