import React, { useState, useEffect, useRef, useCallback } from "react";

const MAX_ROUNDS = 20;
const TIERS = [
  { name: "Micro Instance", capacity: 80, cpu: 4, ram: 16, upgradeCost: 0, maintenance: 600 },
  { name: "Standard Instance", capacity: 160, cpu: 8, ram: 32, upgradeCost: 2000, maintenance: 1500 },
  { name: "Performance Instance", capacity: 320, cpu: 16, ram: 64, upgradeCost: 4000, maintenance: 3500 }
];
const SCALE_UP_DOWNTIME = 2;
const REBOOT_DOWNTIME = 3;
const HIGH_LOAD_THRESHOLD = 0.85;
const INITIAL_BUDGET = 20000; 

const SCENARIOS = {
  1: { event: "Market entry", context: "You've just launched. Traffic is low, but costs are real. Every decision now determines your future runway. Keep a close eye on your initial burn rate and accumulate a cash buffer before traffic begins to ramp up." },
  5: { event: "Tech blog feature", context: "A popular tech blog has featured your app! This is causing a steady stream of new sign-ups. Growth is accelerating faster than previous trends. Watch utilization carefully; you have very little time to react." },
  9: { event: "Viral warning", context: "User sentiment is extremely high. Our marketing team predicts a massive viral surge in the next round. The current infrastructure will likely fail if left as-is. Vertical scaling takes 2 rounds; act now." },
  10: { event: "The viral surge", context: "Traffic has doubled! Our servers are under immense scrutiny from thousands of new users. Any latency now will lead to massive churn and reputation damage. Prioritize stability over profit during this surge." },
  15: { event: "Enterprise shift", context: "A major enterprise client is testing our platform. They demand zero downtime and perfect stability. This is our chance to secure a massive long-term contract. Keep load low to allow the system to stabilize." }
};

function getInitialUsers() { return 30; }
function getUserGrowth(round) { return 10 + Math.floor(round / 4); }

function getDetailedReflection({ downtime, crashes, satisfaction, budget, activeUsers, currentMaintenance }) {
  const isBankrupt = budget <= 0;
  const currentRevenue = activeUsers * 25;
  const isCashflowPositive = currentRevenue > currentMaintenance;
  
  if (!isBankrupt && activeUsers >= 240 && crashes === 0 && satisfaction >= 0.9) {
    return { 
      grade: "S", 
      style: "The tech visionary", 
      color: "text-emerald-700",
      causal: "Exceptional scaling. You built a high-capacity engine that never faltered. By anticipating demand, you achieved the maximum possible market reach with 100% uptime."
    };
  }
  
  if (!isBankrupt && activeUsers >= 170 && crashes <= 1 && isCashflowPositive) {
    return { 
      grade: "A", 
      style: "The growth strategist", 
      color: "text-indigo-700",
      causal: "Balanced and sustainable. You navigated growth hurdles effectively. While there was minor friction, the business is now a profitable, high-scale operation."
    };
  }

  if (!isBankrupt && crashes <= 3 && satisfaction >= 0.6) {
    return { 
      grade: "B", 
      style: "The reliable operator", 
      color: "text-blue-700",
      causal: "Stable but cautious. You prioritized uptime over aggressive expansion. You have a solid user base, though you may have left some growth on the table by playing it safe."
    };
  }

  if (!isBankrupt && isCashflowPositive && budget < INITIAL_BUDGET) {
    return { 
      grade: "C", 
      style: "The high-burn scaler", 
      color: "text-amber-700",
      causal: "You have the hardware and the users, but your margins are razor-thin. You invested heavily in Tier 3, and while it works, one bad round of downtime could lead to a liquidity crisis."
    };
  }

  if (!isBankrupt && (crashes > 3 || !isCashflowPositive)) {
    return { 
      grade: "D", 
      style: "The firefighter", 
      color: "text-orange-700",
      causal: "Reactive management. Frequent crashes and late scaling caused permanent user churn. Your current operating costs are unsustainable given the users you lost."
    };
  }

  return { 
    grade: "F", 
    style: "The failed start-up", 
    color: "text-rose-700",
    causal: "Liquidity reached zero. Whether through scaling too early without a user base or staying offline too long, the business ran out of cash to keep the servers running."
  };
}

function getResponseTime(utilization) {
  if (utilization < 0.7) return 180 + Math.round(40 * utilization);
  if (utilization < 0.9) return 210 + Math.round(240 * (utilization - 0.7) / 0.2);
  if (utilization <= 1.0) return 450 + Math.round(550 * (utilization - 0.9) / 0.1);
  return 2000 + Math.round(3000 * (utilization - 1));
}

function Modal({ title, children, onClose, icon, footer }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] bg-slate-900 bg-opacity-60 backdrop-blur-md p-4 antialiased font-sans">
      <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full overflow-hidden animate-fadein border border-slate-100">
        <div className="p-8 text-center">
          {icon && <div className="text-6xl mb-4">{icon}</div>}
          <h2 className="text-[18px] font-normal text-slate-800 mb-3">{title}</h2>
          <div className="text-slate-600 mb-8 leading-relaxed text-[18px]">{children}</div>
          {footer ? footer : (
            <button onClick={onClose} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-normal text-[18px] hover:bg-indigo-700 transition-all shadow-lg active:scale-[0.98]">
              Proceed
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerticalScaleSimulation() {
  const [round, setRound] = useState(1);
  const [tier, setTier] = useState(0);
  const [downtimeLeft, setDowntimeLeft] = useState(0);
  const [crash, setCrash] = useState(false);
  const [crashLeft, setCrashLeft] = useState(0);
  const [userSatisfaction, setUserSatisfaction] = useState(1);
  const [activeUsers, setActiveUsers] = useState(getInitialUsers());
  const [log, setLog] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showScaleConfirm, setShowScaleConfirm] = useState(false);
  const [totalDowntime, setTotalDowntime] = useState(0);
  const [totalCrashes, setTotalCrashes] = useState(0);
  const [budget, setBudget] = useState(INITIAL_BUDGET);
  const [gameOverReason, setGameOverReason] = useState(null);
  const [stability, setStability] = useState(100);
  const [consecutiveHighLoad, setConsecutiveHighLoad] = useState(0);

  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [topologyHeight, setTopologyHeight] = useState(380); 
  const isResizingSidebar = useRef(false);
  const isResizingTopology = useRef(false);

  const mainAreaRef = useRef(null);
  const logTopRef = useRef(null);

  useEffect(() => {
    logTopRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  const handleMouseMove = useCallback((e) => {
    if (isResizingSidebar.current) {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 200 && newWidth < window.innerWidth * 0.4) {
        setSidebarWidth(newWidth);
      }
    }
    if (isResizingTopology.current && mainAreaRef.current) {
      const rect = mainAreaRef.current.getBoundingClientRect();
      const newHeight = e.clientY - rect.top;
      if (newHeight > 150 && newHeight < rect.height - 150) {
        setTopologyHeight(newHeight);
      }
    }
  }, []);

  const stopResizing = useCallback(() => {
    isResizingSidebar.current = false;
    isResizingTopology.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", stopResizing);
    document.body.style.cursor = "default";
  }, [handleMouseMove]);

  const startResizingSidebar = useCallback((e) => {
    isResizingSidebar.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", stopResizing);
    document.body.style.cursor = "col-resize";
  }, [handleMouseMove, stopResizing]);

  const startResizingTopology = useCallback((e) => {
    isResizingTopology.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", stopResizing);
    document.body.style.cursor = "row-resize";
  }, [handleMouseMove, stopResizing]);

  const currentTier = TIERS[tier];
  const { capacity, cpu, ram, maintenance } = currentTier;
  const utilization = activeUsers / capacity;
  const responseTime = getResponseTime(utilization);

  const nextTierIndex = tier + 1;
  const nextTier = TIERS[nextTierIndex];
  const nextUpgradeCost = nextTier?.upgradeCost;
  const enoughBudgetForUpgrade = nextUpgradeCost === undefined || budget >= nextUpgradeCost;
  
  const isRecovering = crash && crashLeft > 0;
  const isCrashedWaiting = crash && crashLeft === 0;
  const isScaling = downtimeLeft > 0;
  const isDown = isScaling || crash;
  const isGameOver = round > MAX_ROUNDS || !!gameOverReason || (round > 1 && activeUsers <= 0);

  const currentScenario = SCENARIOS[round] || { event: "Standard operations", context: "Traffic flow remains consistent with historical patterns. All endpoints are reporting healthy status codes. Systems are stable." };

  const handleRestart = () => {
    if (!isCrashedWaiting) return;
    setCrashLeft(REBOOT_DOWNTIME);
    setLog(prev => [{ type: "recover", text: `Round ${round}: [Recovery] Server reboot sequence initiated.` }, ...prev]);
  };

  const nextRound = () => {
    if (isGameOver) return;
    if (round === MAX_ROUNDS) { setGameOverReason("finished"); return; }

    let growthMultiplier = 1;
    let eventOccurred = false;
    if (round === 9 && userSatisfaction >= 0.80) { growthMultiplier = 2.2; eventOccurred = true; }

    let growth = !isDown ? getUserGrowth(round) * growthMultiplier : 0;
    let pool = activeUsers + growth;
    
    let churnedUsers = 0;
    let churnType = "info";
    let churnMsg = "";

    if (isDown) {
      churnedUsers = Math.ceil(pool * (0.07 + Math.random() * 0.05));
      churnMsg = `${churnedUsers} users lost to system outage.`;
      churnType = "warnslow";
    } else if (utilization >= 1.0) {
      churnedUsers = Math.ceil(pool * 0.22);
      churnMsg = "System overload! Mass user dropout.";
      churnType = "warnover";
    } else if (responseTime > 450) {
      churnedUsers = Math.ceil(pool * ((utilization - 0.85) * 1.5 + 0.05));
      churnMsg = `${churnedUsers} users left due to system lag.`;
      churnType = "warnslow";
    }

    let nextUsers = Math.max(0, pool - churnedUsers);
    let nextUtil = nextUsers / capacity;
    let profit = !isDown ? nextUsers * 25 : 0;
    let netBudgetChange = profit - maintenance;
    let newBudget = budget + netBudgetChange;
    
    let newSatisfaction = userSatisfaction;
    let events = [];
    let newDowntime = downtimeLeft;
    let newCrash = crash;
    let newCrashLeft = crashLeft;
    let crashedThisRound = false;

    let newConsecutive = (!isDown && nextUtil > HIGH_LOAD_THRESHOLD) ? consecutiveHighLoad + 1 : 0;
    let newStability = stability;

    if (newConsecutive >= 2) {
      newStability = Math.max(0, newStability - (newConsecutive * 14));
    } else if (!isDown && nextUtil < 0.70) {
      newStability = Math.min(100, newStability + 15);
    }

    const crashChance = (100 - newStability) / 100; 
    
    if (!isDown && (Math.random() < crashChance || nextUtil > 1.30)) {
      newCrash = true;
      newCrashLeft = 0; 
      newStability = Math.max(0, newStability - 40);
      newSatisfaction = Math.max(0, newSatisfaction - 0.25);
      events.push({ type: "crash", text: "🔥 [Failure] Critical hardware fault detected." });
      setTotalDowntime((v) => v + 1);
      setTotalCrashes((v) => v + 1);
      crashedThisRound = true;
      newConsecutive = 0;
    }

    if (downtimeLeft > 0) {
      newDowntime--;
      newSatisfaction = Math.max(0, newSatisfaction - 0.10);
      events.push({ type: "downtime", text: `[Scaling] Transition in progress... (${newDowntime} rounds)` });
      if (newDowntime === 0) events.push({ type: "recover", text: "🚀 [Online] Upgrade completed successfully." });
      setTotalDowntime((v) => v + 1);
      newStability = Math.min(100, newStability + 5);
    } else if (crash) {
      if (newCrashLeft > 0) {
        newCrashLeft--;
        newSatisfaction = Math.max(0, newSatisfaction - 0.15);
        events.push({ type: "crash", text: `[Reboot] Data recovery... (${newCrashLeft} rounds)` });
        if (newCrashLeft === 0) {
          newCrash = false;
          events.push({ type: "recover", text: "✅ [Online] Server restored." });
          newStability = 60; 
        }
      }
      setTotalDowntime((v) => v + 1);
    }

    if (!isDown && !crashedThisRound) {
      if (responseTime > 950) newSatisfaction -= 0.12;
      else if (responseTime > 700) newSatisfaction -= 0.08;
      else if (responseTime > 450) newSatisfaction -= 0.04;
      else newSatisfaction = Math.min(1, newSatisfaction + 0.02);
    }
    newSatisfaction = Math.min(1, Math.max(0, Math.round(newSatisfaction * 100) / 100));

    let reason = null;
    if (newBudget < 0) { newBudget = 0; reason = "budget"; }
    else if (nextUsers <= 0 && round > 1) reason = "no-users";

    let roundLog = [{ type: "normal", text: `Round ${round}: Profit & loss ${netBudgetChange >= 0 ? "+" : ""}${netBudgetChange} | User mood: ${(newSatisfaction * 100).toFixed(0)}%` }];
    if (eventOccurred) { roundLog.push({ type: "recover", text: "🌟 [Surge] Viral attraction detected!" }); setShowEventModal(true); }
    if (churnMsg) roundLog.push({ type: churnType, text: `[Info] ${churnMsg}` });
    roundLog = roundLog.concat(events.map(e => ({ ...e, type: e.type || "info" })));

    setRound((r) => r + 1);
    setActiveUsers(nextUsers);
    setDowntimeLeft(newDowntime);
    setCrash(newCrash);
    setCrashLeft(newCrashLeft);
    setUserSatisfaction(newSatisfaction);
    setBudget(newBudget);
    setStability(newStability);
    setConsecutiveHighLoad(newConsecutive);
    setLog(prev => [...roundLog.slice().reverse(), ...prev]);

    if (reason) setGameOverReason(reason);
  };

  const handleScaleUp = () => {
    setDowntimeLeft(SCALE_UP_DOWNTIME);
    setTier((cur) => cur + 1);
    setBudget((prev) => prev - nextUpgradeCost);
    setLog(prev => [{ type: "downtime", text: `Round ${round}: Initiated scale up to ${TIERS[tier+1].name}.` }, ...prev]);
    setTotalDowntime((v) => v + 1);
  };

  const reset = () => {
    setRound(1); setTier(0); setDowntimeLeft(0); setCrash(false); setCrashLeft(0);
    setUserSatisfaction(1); setActiveUsers(getInitialUsers()); setLog([]);
    setTotalDowntime(0); setTotalCrashes(0); setBudget(INITIAL_BUDGET);
    setStability(100); setConsecutiveHighLoad(0); setGameOverReason(null);
  };

  const satisEmoji = userSatisfaction >= 0.80 ? "🟢" : userSatisfaction >= 0.6 ? "😐" : "😡";
  const systemStatusEmoji = crash ? "🔥" : downtimeLeft ? "⏳" : utilization > 0.85 ? "⚠️" : "✅";
  const systemStatusLabel = isRecovering ? "Rebooting" : crash ? "Down" : isScaling ? "Scaling" : utilization > 0.85 ? "High load" : "Stable";
  const stabilityColor = stability > 70 ? "text-green-600" : stability > 30 ? "text-amber-600" : "text-rose-600";
  const canUpgradeStatus = tier < TIERS.length - 1 && !isDown && !isGameOver && enoughBudgetForUpgrade;

  const reflection = getDetailedReflection({ 
    downtime: totalDowntime, 
    crashes: totalCrashes, 
    satisfaction: userSatisfaction, 
    budget, 
    activeUsers,
    currentMaintenance: maintenance
  });

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-100 font-sans text-[18px] font-normal overflow-hidden antialiased select-none">
      {showEventModal && (
        <Modal title="Viral surge!" icon="📈" onClose={() => setShowEventModal(false)}>
          User interest has peaked! A massive traffic surge is imminent.
        </Modal>
      )}

      {showScaleConfirm && nextTier && (
        <Modal 
          title="Upgrade infrastructure" 
          icon="⚡" 
          onClose={() => setShowScaleConfirm(false)}
          footer={
            <div className="flex gap-4 w-full">
              <button onClick={() => setShowScaleConfirm(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-xl font-normal hover:bg-slate-200 transition-all">Cancel</button>
              <button onClick={() => { handleScaleUp(); setShowScaleConfirm(false); }} className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-normal shadow-md">Confirm</button>
            </div>
          }
        >
          Scale to {nextTier.name} for ${nextTier.upgradeCost}.<br/>Warning: 2 rounds of downtime.
        </Modal>
      )}

      {gameOverReason && (
        <Modal title="Analysis report" icon="🏆" onClose={reset}>
          <div className="flex flex-col items-center gap-2 mb-6">
            <div className={`text-[40px] font-normal border-[5px] border-current rounded-full w-20 h-20 flex items-center justify-center ${reflection.color}`}>{reflection.grade}</div>
            <div className={`text-[22px] font-normal uppercase ${reflection.color}`}>{reflection.style}</div>
          </div>
          <div className="space-y-4 text-left bg-slate-50 p-6 rounded-[1.5rem] border border-slate-200 shadow-inner">
            <p className="font-normal text-slate-600 leading-relaxed">{reflection.causal}</p>
            <div className="pt-4 border-t border-slate-200 italic text-slate-400">
              Score: ${Math.round(budget).toLocaleString()} | Reach: {Math.round(activeUsers)}
            </div>
          </div>
        </Modal>
      )}

      <div className="flex flex-col w-full max-w-[1440px] h-full bg-white border border-slate-200 shadow-2xl overflow-hidden font-sans">
        <header className="flex-shrink-0 p-5 sm:px-10 border-b bg-slate-900 text-white flex items-center justify-between gap-6 h-[100px] shadow-sm z-10">
          <div className="flex flex-col">
            <h1 className="text-[18px] font-normal leading-none">Infra-Scaler v2</h1>
            <p className="text-[18px] font-normal text-slate-400 mt-1.5 leading-none">Vertical stack simulation</p>
          </div>
          
          <div className="flex gap-4">
            <button onClick={nextRound} className="h-14 px-10 bg-indigo-600 text-white rounded-xl font-normal hover:bg-indigo-500 shadow-lg active:scale-95 transition-all" disabled={isGameOver}>
              Next round
            </button>
            {isCrashedWaiting ? (
              <button onClick={handleRestart} className="h-14 px-8 bg-orange-500 text-white rounded-xl font-normal hover:bg-orange-600 animate-pulse">Restart server</button>
            ) : (
              <button onClick={() => setShowScaleConfirm(true)} className="h-14 px-8 bg-pink-600 text-white rounded-xl font-normal disabled:opacity-30 active:scale-95 transition-all shadow-md" disabled={!canUpgradeStatus}>
                Scale up {nextUpgradeCost !== undefined ? `($${nextUpgradeCost})` : ""}
              </button>
            )}
            <button onClick={reset} className="h-14 px-6 bg-slate-800 text-slate-300 rounded-xl font-normal hover:bg-slate-700 transition-all active:scale-95 flex items-center gap-2">
              <span>↺</span>
              <span>Restart game</span>
            </button>
          </div>
        </header>
        
        <div className="flex-1 flex overflow-hidden relative">
          <main ref={mainAreaRef} className="flex-1 flex flex-col overflow-hidden bg-slate-50">
            <section style={{ height: `${topologyHeight}px` }} className="bg-white flex items-center justify-center relative p-6 transition-none overflow-hidden border-b border-slate-200 shadow-inner">
              <h4 className="absolute top-5 left-10 font-normal text-slate-600">Internal system topology</h4>
              <div className={`relative h-[85%] w-full max-w-[240px] p-4 rounded-[2.5rem] border-[5px] transition-all duration-700 bg-slate-50 flex flex-col items-center gap-4 shadow-xl ${crash ? 'border-rose-300 ring-4 ring-rose-50' : isScaling ? 'border-amber-300 ring-4 ring-amber-50' : 'border-slate-200'}`}>
                <div className={`w-full flex-1 min-h-0 p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${isDown ? 'bg-slate-200 border-slate-300 text-slate-400 grayscale' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}>
                  <span className="font-normal text-[18px]">Web application</span>
                  <div className="w-full px-2">
                    <div className="flex justify-between text-[14px] font-normal mb-1.5 opacity-60">
                      <span>Compute load</span>
                      <span>{isDown ? '0%' : `${(utilization * 100).toFixed(0)}%`}</span>
                    </div>
                    <div className="w-full bg-indigo-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full transition-all duration-700 ease-out" style={{ width: isDown ? '0%' : `${utilization * 100}%` }}></div>
                    </div>
                  </div>
                </div>
                <div className={`w-full flex-1 min-h-0 p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${isDown ? 'bg-slate-200 border-slate-300 text-slate-400 grayscale' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                  <span className="font-normal text-[18px]">Database tier</span>
                  <div className="w-full px-2">
                    <div className="flex justify-between text-[14px] font-normal mb-1.5 opacity-60">
                      <span>Storage I/O</span>
                      <span>{isDown ? '0%' : `${(Math.min(utilization * 1.1, 1) * 100).toFixed(0)}%`}</span>
                    </div>
                    <div className="w-full bg-emerald-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full transition-all duration-700 ease-out" style={{ width: isDown ? '0%' : `${Math.min(utilization * 1.1, 1) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
                <div className="w-full flex justify-between gap-2 font-normal text-slate-700 text-[16px]">
                  <div className="flex-1 bg-white p-2 rounded-lg text-center border border-slate-200 shadow-sm">{cpu} vCPU</div>
                  <div className="flex-1 bg-white p-2 rounded-lg text-center border border-slate-200 shadow-sm">{ram} GB RAM</div>
                </div>
              </div>
            </section>
            
            <div onMouseDown={startResizingTopology} className="h-2 w-full cursor-row-resize bg-slate-200 hover:bg-indigo-400 transition-colors flex items-center justify-center group z-10 shadow-sm">
              <div className="w-20 h-1 bg-slate-300 group-hover:bg-white rounded-full opacity-50" />
            </div>
            
            <section className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6">
                {[
                  { label: "Round", value: `${Math.min(round, MAX_ROUNDS)} / ${MAX_ROUNDS}`, color: "bg-indigo-50 border-indigo-100" },
                  { label: "Status", value: <div className="flex items-center gap-2"><span>{systemStatusEmoji}</span><span>{systemStatusLabel}</span></div>, color: "bg-slate-50 border-slate-200" },
                  { label: "Instance", value: `${currentTier.name}`, color: "bg-indigo-50 border-indigo-100" },
                  { label: "Stability", value: isDown ? "—" : <span className={`font-normal ${stabilityColor}`}>{stability.toFixed(0)}%</span>, color: "bg-emerald-50 border-emerald-100" },
                  { label: "Users", value: Math.round(activeUsers).toLocaleString(), color: "bg-emerald-50 border-emerald-100" },
                  { label: "Latency", value: isDown ? "—" : <span className={responseTime > 700 ? "text-rose-500 font-normal" : "text-emerald-600"}>{responseTime}ms</span>, color: "bg-amber-50 border-amber-100" },
                  { label: "Load", value: isDown ? "—" : <span className={utilization >= 0.85 ? "text-rose-500 font-normal" : "text-emerald-700"}>{(utilization * 100).toFixed(0)}%</span>, color: "bg-amber-50 border-amber-100" },
                  { label: "Budget", value: <span className="text-violet-700">${Math.round(budget).toLocaleString()}</span>, color: "bg-violet-50 border-violet-100" },
                ].map((m, i) => (
                  <div key={i} className={`flex flex-col gap-0.5 border p-4 rounded-2xl shadow-sm ${m.color}`}>
                    <span className="text-slate-600 text-[14px] font-normal">{m.label}</span>
                    <div className="font-normal text-slate-800 leading-none text-[18px]">{m.value}</div>
                  </div>
                ))}
              </div>

              <div className="bg-orange-50 border border-orange-100 p-8 rounded-[2.5rem] animate-fadein space-y-4 font-normal shadow-sm">
                <h4 className="font-normal text-orange-800 text-[18px]">
                  {currentScenario.event}
                </h4>
                <p className="font-normal text-orange-900 leading-relaxed max-w-4xl text-[18px]">
                  {currentScenario.context}
                </p>
              </div>
            </section>
          </main>
          
          <div className="w-2 cursor-col-resize bg-slate-200 hover:bg-indigo-400 transition-colors z-50 flex items-center justify-center group" onMouseDown={startResizingSidebar}>
            <div className="w-1 h-20 bg-slate-300 group-hover:bg-white rounded-full opacity-50" />
          </div>

          <aside className="bg-white flex flex-col overflow-hidden border-l border-slate-200 transition-none" style={{ width: `${sidebarWidth}px` }}>
            <div className="p-6 border-b bg-slate-50 flex justify-between items-center flex-shrink-0">
              <h3 className="font-normal text-slate-700 flex items-center gap-2 text-[18px]">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                Telemetry feed
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3 scrollbar-hide bg-slate-100/30">
              <div ref={logTopRef} />
              {log.length === 0 ? (
                <div className="p-10 text-slate-400 italic text-center font-normal text-[18px] leading-relaxed">Awaiting telemetry pulse...</div>
              ) : (
                <>
                  {log.map((item, i) => (
                    <div key={i} className={`p-4 rounded-xl leading-snug transition-all font-normal text-[18px] shadow-sm border ${item.type === "crash" ? "bg-rose-100 text-rose-800 border-rose-200 border-l-4 border-l-rose-500" : item.type === "downtime" ? "bg-amber-100 text-amber-800 border-amber-200" : item.type === "warn" ? "bg-orange-100 text-orange-900 border-orange-200" : "bg-white text-slate-700 border-slate-200"}`}>
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
