import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Cpu, 
  Database, 
  ChevronRight, 
  ArrowUpCircle, 
  RotateCcw, 
  AlertTriangle,
  X,
  Server
} from "lucide-react";

const MAX_ROUNDS = 20;
const INITIAL_BUDGET = 10000;
const INITIAL_USERS = 50; 

const SERVER_LEVELS = [
  { name: "MVP Sandbox", capacity: 150, specs: "2 vCPU / 4GB RAM", cost: 0, maintenance: 400 },
  { name: "Standard Rack", capacity: 400, specs: "8 vCPU / 16GB RAM", cost: 2500, maintenance: 1200 },
  { name: "Performance Rig", capacity: 900, specs: "16 vCPU / 64GB RAM", cost: 5000, maintenance: 2800 },
  { name: "Enterprise Mainframe", capacity: 2000, specs: "64 vCPU / 256GB RAM", cost: 12000, maintenance: 6000 }
];

const SCENARIOS = {
  1: { event: "The MVP Launch", context: "Byte-Bites is live! You are running the entire application, user sessions, and database on a single MVP server. Monitor your capacity as word of mouth spreads." },
  5: { event: "Weekend Surge", context: "It's Friday night. Users are logging in to order pizza and wings. Watch your server load closely, vertical scaling is your only option here." },
  10: { event: "Viral Marketing", context: "Our promo code just went viral on social media. A massive wave of new customers is hitting the platform right now!" },
  15: { event: "The Ceiling", context: "Traffic is immense. You are reaching the physical limits of vertical scaling. Try to survive until Round 20 without going bankrupt." }
};

const apiKey = "";

const callGemini = async (prompt) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload = { contents: [{ parts: [{ text: prompt }] }] };
  const delays = [1000, 2000, 4000, 8000, 16000];

  for (let attempt = 0; attempt <= 5; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      return result.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
    } catch (error) {
      if (attempt === 5) throw error;
      await new Promise(res => setTimeout(res, delays[attempt]));
    }
  }
};

function getUserGrowth(round) { return 20 + Math.floor(round * 1.5); }

function getDetailedReflection({ crashes, activeUsers, budget }) {
  const isBankrupt = budget <= 0;
  if (!isBankrupt && activeUsers >= 1200 && crashes === 0) {
    return { grade: "S", style: "The Hardware Whisperer", color: "text-black", causal: "Perfectly timed upgrades. You pushed vertical scaling to its absolute limit without dropping a single order." };
  }
  if (!isBankrupt && activeUsers >= 800) {
    return { grade: "A", style: "Solid Sysadmin", color: "text-black", causal: "Good scaling and survival instincts. You managed the downtime well and kept the business afloat." };
  }
  if (!isBankrupt && activeUsers > 200) {
    return { grade: "C", style: "Survivalist", color: "text-black", causal: "You survived the monolith, but struggled with load. Your customers experienced heavy lag, capping your overall growth." };
  }
  return { grade: "F", style: "Kitchen Nightmare", color: "text-black", causal: "The server melted down. Whether through bankruptcy or complete unresponsiveness, the monolith collapsed under pressure." };
}

function Modal({ title, children, onClose, icon, footer }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] bg-slate-900 bg-opacity-60 backdrop-blur-md p-4 antialiased font-sans">
      <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-2xl max-w-[90vw] md:max-w-lg w-full overflow-hidden border border-slate-100 relative text-center">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors z-20"
        >
          <X size={20} />
        </button>

        <div className="p-6 md:p-8">
          {icon && <div className="text-5xl md:text-6xl mb-4 flex justify-center">{icon}</div>}
          <h2 className="text-[16px] md:text-[18px] font-normal text-black mb-3 uppercase tracking-wide">{title}</h2>
          <div className="text-black mb-6 md:mb-8 leading-relaxed text-[14px] sm:text-[18px]">{children}</div>
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
    <div className="h-screen w-full bg-white flex flex-col items-center justify-center font-sans text-black selection:bg-indigo-100 overflow-hidden px-4 sm:px-12 py-4">
      <div className="max-w-4xl w-full h-full max-h-[900px] flex flex-col items-center justify-center text-center">

        <h1 className="text-[22px] sm:text-[34px] md:text-[42px] font-normal tracking-tight text-black mb-1 sm:mb-2 uppercase flex-shrink-0">Byte-Bites Phase 1: The Monolith</h1>
        <p className="text-[14px] sm:text-[18px] text-slate-500 mb-4 sm:mb-10 italic flex-shrink-0">Welcome to the Kitchen.</p>

        <div className="bg-slate-50 border border-slate-100 rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-8 mb-4 sm:mb-10 text-left w-full shadow-sm flex-shrink min-h-0 overflow-y-auto">
          <p className="text-[14px] sm:text-[16px] leading-relaxed mb-4">
            Byte-Bites is the fastest-growing food delivery startup in the city. Right now, our entire platform—web routing, user data, and restaurant menus—is running on a single, unified server.
          </p>
          <p className="text-[14px] sm:text-[16px] leading-relaxed mb-6">
            <strong>Your Mission:</strong> Survive 20 rounds of increasing weekend traffic, viral marketing spikes, and hungry customers using only vertical scaling.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="flex flex-col gap-1 sm:gap-2">
              <div className="text-[18px] sm:text-[24px]">📈</div>
              <h3 className="font-normal uppercase text-[13px] sm:text-[15px]">Monitor Load</h3>
              <p className="text-[12px] sm:text-[14px] text-slate-600 leading-snug">Watch the server capacity. If it hits 100%, the app crashes and customers churn.</p>
            </div>
            <div className="flex flex-col gap-1 sm:gap-2">
              <div className="text-[18px] sm:text-[24px]">⬆️</div>
              <h3 className="font-normal uppercase text-[13px] sm:text-[15px]">Scale Up</h3>
              <p className="text-[12px] sm:text-[14px] text-slate-600 leading-snug">Buy bigger hardware (Vertical Scaling) before traffic overwhelms your current specs.</p>
            </div>
            <div className="flex flex-col gap-1 sm:gap-2">
              <div className="text-[18px] sm:text-[24px]">💰</div>
              <h3 className="font-normal uppercase text-[13px] sm:text-[15px]">Manage Capital</h3>
              <p className="text-[12px] sm:text-[14px] text-slate-600 leading-snug">Upgrades require planned downtime and cost money. Do not go bankrupt!</p>
            </div>
          </div>
        </div>

        <button 
          onClick={onStart} 
          className="flex-shrink-0 px-8 sm:px-12 py-3 sm:py-5 bg-indigo-600 text-white rounded-[1.25rem] sm:rounded-[1.5rem] font-normal text-[16px] sm:text-[20px] hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-200"
        >
          Start Phase 1 Simulation
        </button>
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
  const [budget, setBudget] = useState(INITIAL_BUDGET);
  const [gameOverReason, setGameOverReason] = useState(null);
  const [stability, setStability] = useState(100); 

  const [advisorText, setAdvisorText] = useState("");
  const [isAdvising, setIsAdvising, ] = useState(false);
  const [showAdvisorModal, setShowAdvisorModal] = useState(false);
  const [aiPostMortem, setAiPostMortem] = useState("");
  const [isGeneratingPostMortem, setIsGeneratingPostMortem] = useState(false);

  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [topologyHeight, setTopologyHeight] = useState(350);
  const isResizingSidebar = useRef(false);
  const isResizingTopology = useRef(false);
  const logTopRef = useRef(null);
  const mainAreaRef = useRef(null);

  useEffect(() => {
    logTopRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

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

  const startResizingSidebar = (e) => { 
    isResizingSidebar.current = true; 
    document.addEventListener("mousemove", handleMouseMove); 
    document.addEventListener("mouseup", stopResizing); 
    document.body.style.cursor = "col-resize"; 
  };

  const startResizingTopology = (e) => { 
    isResizingTopology.current = true; 
    document.addEventListener("mousemove", handleMouseMove); 
    document.addEventListener("mouseup", stopResizing); 
    document.body.style.cursor = "row-resize"; 
  };

  const currentServer = SERVER_LEVELS[serverIdx];
  const utilization = activeUsers / currentServer.capacity;
  
  // Simulated separate loads for visualization
  const webLoad = Math.min(utilization * 1.05, 1.25);
  const dataLoad = Math.min(utilization * 0.92, 1.25);

  const isScaling = downtimeLeft > 0;
  const isDown = isScaling || crash;
  const isRecovering = crash && crashLeft > 0;
  const isGameOver = round > MAX_ROUNDS || !!gameOverReason || (round > 1 && activeUsers <= 0);

  const systemStatusEmoji = crash ? "🔥" : isScaling ? "⏳" : utilization > 0.85 ? "⚠️" : "✅";
  const systemStatusLabel = isRecovering ? "Rebooting" : crash ? "Down" : isScaling ? "Scaling" : utilization > 0.85 ? "High load" : "Stable";

  const currentScenario = SCENARIOS[round] || { event: "Operational phase", context: "Traffic flow is consistent. Keep monitoring your capacity limits." };

  const handleGetAdvice = async () => {
    setShowAdvisorModal(true);
    setIsAdvising(true);
    setAdvisorText("Pinging the Staff Engineer on Slack...");
    try {
      const utilPercent = Math.round(utilization * 100);
      const prompt = `You are a brilliant Senior Staff Engineer at "Byte-Bites", a fast-growing food delivery app. The Lead Architect (the player) is asking for your advice on the current infrastructure. 
      Current game state: Round ${round}/20, Server Load: ${utilPercent}%, Active Users: ${activeUsers}, Budget: $${budget}, Stability: ${stability}%. The current server is the ${currentServer.name} (${currentServer.specs}).
      Give them 2-3 sentences of advice. Tell them if they are doing well or about to crash. Be slightly sarcastic but actually helpful regarding vertical scaling and their budget. Use food or server puns. Do not use markdown formatting.`;
      
      const text = await callGemini(prompt);
      setAdvisorText(text);
    } catch (e) {
      setAdvisorText("The Staff Engineer is asleep at their keyboard (API Error). Try again later.");
    }
    setIsAdvising(false);
  };

  const generatePostMortem = async () => {
    setIsGeneratingPostMortem(true);
    setAiPostMortem("Analyzing server logs and telemetry...");
    try {
      const prompt = `You are a seasoned DevOps Consultant hired by Byte-Bites to review a recent monolith server simulation. The architect reached Round ${round}/20. They ended with ${activeUsers} active users, $${budget} capital remaining, and a final stability of ${stability}%.
      Write a 3-sentence executive post-mortem report summarizing their performance. Highlight their successes or heavily roast their failures based on these metrics. Keep it thematic to food delivery and monolithic servers. Do not use markdown.`;
      
      const text = await callGemini(prompt);
      setAiPostMortem(text);
    } catch (e) {
      setAiPostMortem("Failed to generate report. The logs were corrupted in the grease fire (API Error).");
    }
    setIsGeneratingPostMortem(false);
  };

  const handleRestart = () => {
    if (crash && crashLeft === 0) {
      setCrashLeft(3);
      setLog(prev => [{ type: "recover", text: `Round ${round}: [System] Initiating full server reboot sequence.` }, ...prev]);
    }
  };

  const handleUpgrade = () => {
    const nextLevel = SERVER_LEVELS[serverIdx + 1];
    setBudget(b => b - nextLevel.cost);
    setServerIdx(i => i + 1);
    setDowntimeLeft(2);
    setLog(prev => [{ type: "warn", text: `Round ${round}: Hardware upgrade initiated. Server going offline.` }, ...prev]);
    setShowScaleModal(false);
  };

  const nextRound = () => {
    if (isGameOver) return;
    if (round === MAX_ROUNDS) { setGameOverReason("finished"); return; }

    const growth = !isDown ? getUserGrowth(round) : 0;
    const pool = activeUsers + growth;
    
    const nextUtil = pool / currentServer.capacity;

    let churn = 0;
    if (isDown) churn = Math.ceil(pool * 0.08);
    else if (nextUtil >= 1.0) churn = Math.ceil(pool * 0.15);
    else if (nextUtil >= 0.85) churn = Math.ceil(pool * 0.04);

    const nextUsers = Math.max(0, pool - churn);

    let nextStability = stability;
    if (nextUtil > 0.90 && !isDown) nextStability = Math.max(0, nextStability - 15);
    else if (!isDown && nextUtil < 0.70) nextStability = Math.min(100, nextStability + 10);

    let nextCrash = crash;
    let nextCrashLeft = crashLeft;
    let nextDowntime = downtimeLeft;

    if (!isDown && Math.random() > (nextStability / 100 + 0.2)) {
      nextCrash = true;
      nextStability = Math.max(0, nextStability - 30);
      setLog(prev => [{ type: "crash", text: `Round ${round}: [FATAL] Server overloaded and crashed!` }, ...prev]);
    }

    if (downtimeLeft > 0) {
      nextDowntime--;
      if (nextDowntime === 0) setLog(prev => [{ type: "recover", text: `Round ${round}: [System] Upgrade complete. Server Online.` }, ...prev]);
    } else if (crash) {
      if (nextCrashLeft > 0) {
        nextCrashLeft--;
        if (nextCrashLeft === 0) {
          nextCrash = false;
          nextStability = 50;
          setLog(prev => [{ type: "recover", text: `Round ${round}: [System] Server recovered. Services restored.` }, ...prev]);
        }
      }
    }

    const roundIsFunctionallyDown = isDown || nextCrash;
    const revenue = !roundIsFunctionallyDown ? (nextUsers * 25) : 0;
    const maintenance = !roundIsFunctionallyDown ? currentServer.maintenance : 0;
    const netIncome = revenue - maintenance;
    const newBudget = budget + netIncome;

    setRound(r => r + 1);
    setActiveUsers(nextUsers);
    setBudget(newBudget);
    setStability(nextStability);
    setCrash(nextCrash);
    setCrashLeft(nextCrashLeft);
    setDowntimeLeft(nextDowntime);
    
    setLog(prev => [{ 
      type: "normal", 
      text: `Round ${round}: Net ${netIncome >= 0 ? "+" : ""}${netIncome} | Cost: $${maintenance} | Customers: ${nextUsers}` 
    }, ...prev]);

    if (newBudget <= 0) setGameOverReason("bankrupt");
  };

  const reset = () => {
    setGameState("overview");
    setRound(1);
    setServerIdx(0);
    setDowntimeLeft(0);
    setCrash(false);
    setCrashLeft(0);
    setActiveUsers(INITIAL_USERS);
    setBudget(INITIAL_BUDGET);
    setStability(100);
    setLog([]);
    setGameOverReason(null);
    setAiPostMortem("");
    setShowRestartModal(false);
  };

  const getNodeBorder = (util, isNodeDown) => {
    if (isNodeDown) return 'border-rose-300 ring-4 ring-rose-50 grayscale opacity-70';
    if (util >= 1.0) return 'border-rose-500 ring-4 ring-rose-100';
    if (util >= 0.85) return 'border-amber-400 ring-4 ring-amber-50';
    return 'border-slate-200';
  };

  const getBarColor = (util, isNodeDown, defaultColor) => {
    if (isNodeDown) return 'bg-slate-400';
    if (util >= 1.0) return 'bg-rose-500';
    if (util >= 0.85) return 'bg-amber-500';
    return defaultColor;
  };

  if (gameState === "overview") {
    return <OverviewScreen onStart={() => setGameState("playing")} />;
  }

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-100 font-sans text-[18px] font-normal overflow-hidden antialiased select-none">
      
      {/* Restart Warning Modal */}
      {showRestartModal && (
        <Modal 
          title="Reset Simulation" 
          icon={<AlertTriangle className="text-rose-500" size={60} />} 
          onClose={() => setShowRestartModal(false)}
          footer={
            <div className="flex gap-4 w-full">
              <button onClick={() => setShowRestartModal(false)} className="flex-1 py-4 bg-slate-100 text-black rounded-xl font-normal hover:bg-slate-200 transition-all text-[18px]">Cancel</button>
              <button onClick={reset} className="flex-1 py-4 bg-rose-600 text-white rounded-xl font-normal hover:bg-rose-700 transition-all text-[18px]">Reset Progress</button>
            </div>
          }
        >
          Are you sure you want to restart? All your round history and budget progress will be lost.
        </Modal>
      )}

      {showAdvisorModal && (
        <Modal
          title="Senior Staff Engineer"
          icon="🧔🏻‍♂️"
          onClose={() => setShowAdvisorModal(false)}
          footer={
            <button 
              onClick={() => setShowAdvisorModal(false)} 
              className="w-full py-3 md:py-4 bg-slate-900 text-white rounded-xl font-normal text-[16px] md:text-[18px] hover:bg-slate-800 transition-all shadow-lg active:scale-[0.98]"
            >
              Close Advice
            </button>
          }
        >
          <div className="text-left bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200 min-h-[140px] flex items-center justify-center transition-all duration-300">
            {isAdvising ? (
                <span className="text-slate-500 animate-pulse text-[14px] sm:text-[18px] italic">Staff Engineer is typing insights...</span>
            ) : (
                <p className="text-black leading-relaxed text-[14px] sm:text-[18px] font-normal">"{advisorText}"</p>
            )}
          </div>
        </Modal>
      )}

      {showScaleModal && (
        <Modal 
          title="Hardware Upgrade" 
          icon={<ArrowUpCircle className="text-blue-500" size={60} />}
          onClose={() => setShowScaleModal(false)}
          footer={
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full">
              <button onClick={() => setShowScaleModal(false)} className="flex-1 py-3 sm:py-4 bg-slate-100 text-black rounded-xl font-normal hover:bg-slate-200 transition-all text-[16px] sm:text-[18px]">Cancel</button>
              <button onClick={handleUpgrade} className="flex-1 py-3 sm:py-4 bg-indigo-600 text-white rounded-xl font-normal hover:bg-indigo-700 transition-all text-[16px] sm:text-[18px]">Confirm</button>
            </div>
          }
        >
          Upgrade the monolith to <strong className="break-words">{SERVER_LEVELS[serverIdx + 1].name}</strong> ({SERVER_LEVELS[serverIdx + 1].specs}).<br/><br/>
          Cost: ${SERVER_LEVELS[serverIdx + 1].cost.toLocaleString()}.<br/>
          Downtime: 2 rounds.
        </Modal>
      )}

      {gameOverReason && (
        <Modal title="Analysis report" icon="🏆" onClose={reset}>
          <div className="flex flex-col items-center gap-2 mb-4 sm:mb-6">
            <div className={`text-[32px] sm:text-[40px] font-normal border-[4px] sm:border-[5px] border-current rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center ${reflection.color}`}>{reflection.grade}</div>
            <div className={`text-[18px] sm:text-[22px] font-normal uppercase text-center ${reflection.color}`}>{reflection.style}</div>
          </div>
          <p className="font-normal text-black leading-relaxed text-[14px] sm:text-[18px] mb-4">{reflection.causal}</p>
          <div className="pt-4 border-t border-slate-200 italic text-black text-[14px] sm:text-[16px]">Final capital: ${Math.round(budget).toLocaleString()}</div>

          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-slate-200 text-left">
            {!aiPostMortem ? (
                <button
                  onClick={generatePostMortem}
                  disabled={isGeneratingPostMortem}
                  className="w-full py-3 bg-purple-100 text-purple-700 rounded-xl font-normal hover:bg-purple-200 transition-all flex justify-center items-center gap-2 disabled:opacity-50 text-[14px] sm:text-[16px]"
                >
                  {isGeneratingPostMortem ? "Analyzing logs..." : "Generate AI Post-Mortem ✨"}
                </button>
            ) : (
                <div className="bg-purple-50 p-3 sm:p-4 rounded-xl border border-purple-100 max-h-[30vh] overflow-y-auto">
                    <h4 className="text-purple-800 text-[12px] sm:text-[14px] uppercase mb-2 font-normal">AI Consultant Notes</h4>
                    <p className="text-black text-[14px] sm:text-[16px] leading-relaxed">{aiPostMortem}</p>
                </div>
            )}
          </div>
        </Modal>
      )}

      <div className="flex flex-col w-full max-w-[1440px] h-full bg-white lg:border border-slate-200 lg:shadow-2xl overflow-hidden font-sans" style={{ '--sidebar-width': `${sidebarWidth}px` }}>
        
        {/* Dynamic Header */}
        <header className="flex-shrink-0 p-4 sm:p-5 lg:px-10 border-b bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 h-auto min-h-[100px] lg:h-[100px] shadow-sm z-10 text-center md:text-left">
          <div className="flex flex-col md:w-auto">
            <h1 className="text-[16px] sm:text-[18px] font-normal leading-none uppercase tracking-wide flex items-center justify-center md:justify-start gap-2">
              <Server size={18} className="text-indigo-400" /> Phase 1
            </h1>
            <p className="text-[14px] sm:text-[18px] font-normal text-slate-300 mt-1.5 leading-none">The Monolith</p>
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-end gap-2 sm:gap-4 w-full md:w-auto">
            <button onClick={handleGetAdvice} className="h-10 sm:h-14 px-4 sm:px-6 bg-purple-600 text-white rounded-xl font-normal shadow-md hover:bg-purple-700 transition-all flex items-center gap-2 text-[13px] sm:text-[16px]" disabled={isGameOver}>
              <span className="truncate">Ask Staff Eng ✨</span>
            </button>
            <button onClick={nextRound} className="h-10 sm:h-14 px-6 sm:px-10 bg-indigo-600 text-white rounded-xl font-normal hover:bg-indigo-500 shadow-lg active:scale-95 transition-all text-[13px] sm:text-[16px] flex items-center gap-2" disabled={isGameOver}>
              Next round <ChevronRight size={18} />
            </button>
            {crash && crashLeft === 0 ? (
              <button onClick={handleRestart} className="h-10 sm:h-14 px-4 sm:px-8 bg-orange-500 text-white rounded-xl font-normal hover:bg-orange-600 animate-pulse text-[13px] sm:text-[16px]">
                Restart server
              </button>
            ) : (
              <button onClick={() => setShowScaleModal(true)} className="h-10 sm:h-14 px-4 sm:px-8 bg-blue-600 text-white rounded-xl font-normal shadow-md hover:bg-blue-700 disabled:opacity-30 transition-all text-[13px] sm:text-[16px] flex items-center gap-2" disabled={serverIdx >= SERVER_LEVELS.length - 1 || isDown}>
                Scale Up <ArrowUpCircle size={18} />
              </button>
            )}
            <button onClick={() => setShowRestartModal(true)} className="h-10 sm:h-14 px-3 sm:px-6 bg-slate-800 text-white rounded-xl font-normal hover:bg-slate-700 active:scale-95 flex items-center justify-center">
              <RotateCcw size={18} />
            </button>
          </div>
        </header>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          
          <main ref={mainAreaRef} className="flex-1 flex flex-col overflow-hidden bg-slate-50 w-full min-h-0">
            
            <section style={{ height: `${topologyHeight}px` }} className="bg-white flex-shrink-0 flex items-center justify-center relative p-4 sm:p-6 transition-none overflow-hidden border-b border-slate-200 shadow-inner">
              <h4 className="hidden sm:block absolute top-4 sm:top-5 left-4 sm:left-10 font-normal text-black uppercase text-[12px] sm:text-[14px]">Infrastructure topology</h4>
              
              {/* Monolith Server Box - HEIGHT AND WIDTH LOCKED TO DEFAULT PIXEL VALUES */}
              <div className={`relative w-[280px] h-[160px] p-2 sm:p-3 rounded-[1.5rem] sm:rounded-[2rem] border-[3px] sm:border-[5px] transition-all duration-700 bg-slate-50 flex flex-col items-center justify-center gap-2 sm:gap-3 shadow-xl ${getNodeBorder(utilization, isDown)}`}>
                
                {/* DOWN Sticker Overlay */}
                {isDown && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 -rotate-12 z-20">
                    <div className="bg-rose-500 text-white font-bold px-4 py-2 rounded-lg shadow-xl border-4 border-white text-xl uppercase tracking-widest animate-bounce flex items-center gap-2">
                      Down
                    </div>
                  </div>
                )}

                <div className="w-full flex flex-row gap-2 flex-grow overflow-hidden">
                  {/* Web App Column */}
                  <div className={`flex-1 p-2 sm:p-3 rounded-xl border-2 transition-all flex flex-col justify-center gap-1 sm:gap-2 ${isDown ? 'bg-slate-200 border-slate-300' : 'bg-indigo-50 border-indigo-200'}`}>
                    <span className="font-normal text-black text-[10px] sm:text-[13px] leading-none uppercase tracking-wide text-center flex items-center justify-center gap-1.5 truncate">
                       <Cpu size={14} className="opacity-70 flex-shrink-0" /> Web App
                    </span>
                    <div className="flex flex-col gap-0.5 sm:gap-1">
                      <div className="flex justify-between text-[9px] sm:text-[11px] font-normal text-black opacity-80 leading-none">
                        <span>CPU</span>
                        <span>{isDown ? '0%' : `${(webLoad * 100).toFixed(0)}%`}</span>
                      </div>
                      <div className="w-full bg-indigo-100 h-1 sm:h-2 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-700 ${getBarColor(webLoad, isDown, 'bg-indigo-500')}`} style={{ width: isDown ? '0%' : `${Math.min(webLoad * 100, 100)}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Database Column */}
                  <div className={`flex-1 p-2 sm:p-3 rounded-xl border-2 transition-all flex flex-col justify-center gap-1 sm:gap-2 ${isDown ? 'bg-slate-200 border-slate-300' : 'bg-emerald-50 border-emerald-100'}`}>
                    <span className="font-normal text-black text-[10px] sm:text-[13px] leading-none uppercase tracking-wide text-center flex items-center justify-center gap-1.5 truncate">
                       <Database size={14} className="opacity-70 flex-shrink-0" /> Database
                    </span>
                    <div className="flex flex-col gap-0.5 sm:gap-1">
                      <div className="flex justify-between text-[9px] sm:text-[11px] font-normal text-black opacity-80 leading-none">
                        <span>I/O</span>
                        <span>{isDown ? '0%' : `${(dataLoad * 100).toFixed(0)}%`}</span>
                      </div>
                      <div className="w-full bg-emerald-100 h-1 sm:h-2 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-700 ${getBarColor(dataLoad, isDown, 'bg-emerald-500')}`} style={{ width: isDown ? '0%' : `${Math.min(dataLoad * 100, 100)}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Specs Area */}
                <div className="w-full flex justify-between gap-2 mt-1 flex-shrink-0">
                  <div className="flex-1 bg-white py-1 px-1.5 rounded-lg text-center border border-slate-200 shadow-sm text-[9px] sm:text-[11px] text-black truncate leading-tight uppercase font-medium">
                    Load: {isDown ? '0%' : `${(utilization * 100).toFixed(0)}%`}
                  </div>
                  <div className="flex-1 bg-white py-1 px-1.5 rounded-lg text-center border border-slate-200 shadow-sm text-[9px] sm:text-[11px] text-black truncate leading-tight uppercase font-medium">
                    {currentServer.specs}
                  </div>
                </div>
              </div>
            </section>
            
            <div onMouseDown={startResizingTopology} className="h-2 w-full cursor-row-resize bg-slate-200 hover:bg-indigo-400 transition-colors flex items-center justify-center z-10 flex-shrink-0">
              <div className="w-20 h-1 bg-slate-300 rounded-full opacity-50" />
            </div>

            <section className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-10 bg-slate-50">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-x-8 lg:gap-y-6">
                {[
                  { label: "Round", value: `${round} / ${MAX_ROUNDS}`, color: "bg-slate-50 border-slate-200" },
                  { label: "Status", value: <div className="flex items-center gap-1.5 sm:gap-2 text-[14px] sm:text-[18px]"><span>{systemStatusEmoji}</span><span className="truncate">{systemStatusLabel}</span></div>, color: "bg-slate-50 border-slate-200" },
                  { label: "Customers", value: Math.round(activeUsers).toLocaleString(), color: "bg-slate-50 border-slate-200" },
                  { label: "Stability", value: isDown ? "—" : `${stability.toFixed(0)}%`, color: stability > 50 ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100" },
                  { label: "Sys Load", value: isDown ? "—" : `${(utilization * 100).toFixed(0)}%`, color: utilization >= 0.85 ? "bg-rose-50 border-rose-100" : "bg-indigo-50 border-indigo-100" },
                  { label: "Capacity", value: currentServer.capacity.toLocaleString(), color: "bg-slate-50 border-slate-200" },
                  { label: "Latency", value: isDown ? "—" : `${Math.round(50 + utilization * 600)}ms`, color: utilization >= 0.85 ? "bg-rose-50 border-rose-100" : "bg-amber-50 border-amber-100" },
                  { label: "Capital", value: `$${Math.round(budget).toLocaleString()}`, color: "bg-violet-50 border-violet-100" },
                ].map((m, i) => (
                  <div key={i} className={`flex flex-col gap-0.5 border p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm overflow-hidden ${m.color}`}>
                    <span className="text-black text-[10px] sm:text-[12px] lg:text-[14px] font-normal uppercase truncate">{m.label}</span>
                    <div className="font-normal text-black leading-none text-[14px] sm:text-[16px] lg:text-[18px] truncate">{m.value}</div>
                  </div>
                ))}
              </div>

              <div className="bg-orange-50 border border-orange-100 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] space-y-2 sm:space-y-4 font-normal shadow-sm">
                <h4 className="font-normal text-black text-[14px] sm:text-[18px] uppercase">
                  {currentScenario.event}
                </h4>
                <p className="font-normal text-black leading-relaxed max-w-4xl text-[14px] sm:text-[18px]">
                  {currentScenario.context}
                </p>
              </div>
            </section>
          </main>
          
          <div className="hidden lg:flex w-2 cursor-col-resize bg-slate-200 hover:bg-indigo-400 transition-colors z-50 items-center justify-center flex-shrink-0" onMouseDown={startResizingSidebar}>
            <div className="w-1 h-20 bg-slate-300 rounded-full" />
          </div>

          <aside className="bg-white flex flex-col overflow-hidden border-t lg:border-t-0 lg:border-l border-slate-200 transition-none w-full h-[35vh] lg:h-full lg:w-[var(--sidebar-width)] flex-shrink-0 z-20 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)] lg:shadow-none">
            <div className="p-4 sm:p-6 border-b bg-slate-50 flex justify-between items-center flex-shrink-0 h-[50px] sm:h-[70px]">
              <h3 className="font-normal text-black flex items-center gap-2 text-[14px] sm:text-[18px] uppercase">
                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                Telemetry
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-2 sm:gap-3 scrollbar-hide bg-slate-100/30">
              <div ref={logTopRef} />
              {log.length === 0 ? (
                <div className="p-6 sm:p-10 text-black italic text-center font-normal text-[14px] sm:text-[18px] leading-relaxed uppercase">Awaiting telemetry pulse...</div>
              ) : (
                <>
                  {log.map((item, i) => (
                    <div key={i} className={`p-3 sm:p-4 rounded-xl leading-snug transition-all font-normal text-black text-[13px] sm:text-[16px] lg:text-[18px] shadow-sm border ${item.type === 'warn' ? 'bg-amber-100 border-amber-200' : item.type === 'recover' ? 'bg-emerald-100 border-emerald-200' : item.type === 'crash' ? 'bg-rose-100 border-rose-200 border-l-4 border-l-rose-500' : 'bg-white border-slate-200'}`}>
                      {item.text}
                    </div>
                  ))}
                </>
              )}
            </div>
          </aside>
          
        </div>
      </div>
    </div>
  );
}
