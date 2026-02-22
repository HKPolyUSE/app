import React, { useState, useEffect, useRef } from "react";

const MAX_ROUNDS = 20;
const TIERS = [
  { name: "Micro Instance", capacity: 80, cpu: 4, ram: 16, upgradeCost: 0, maintenance: 600 },
  { name: "Standard Instance", capacity: 160, cpu: 8, ram: 32, upgradeCost: 2000, maintenance: 1500 },
  { name: "Performance Instance", capacity: 320, cpu: 16, ram: 64, upgradeCost: 4000, maintenance: 3500 }
];
const SCALE_UP_DOWNTIME = 2;
const REBOOT_DOWNTIME = 3;
const HIGH_LOAD_THRESHOLD = 0.85;
const INITIAL_BUDGET = 5000; 

function getInitialUsers() { return 30; }
function getUserGrowth(round) { return 10 + Math.floor(round / 5); }

function getPerformanceRating({ gameOverReason, downtime, crashes, satisfaction, budget }) {
  if (gameOverReason === "budget") return { title: "💸 Bankrupt", desc: "Operational costs exceeded your revenue.", color: "text-red-700" };
  if (downtime <= 3 && crashes === 0 && satisfaction >= 0.9 && budget > 60000) return { title: "🌟 Tech Unicorn", desc: "Superb scaling and massive profits!", color: "text-green-800" };
  if (downtime <= 6 && crashes <= 1 && satisfaction >= 0.8 && budget > 20000) return { title: "👍 Solid Success", desc: "Minimal downtime and satisfied users.", color: "text-blue-700" };
  return { title: "😐 Survivor", desc: "You kept the lights on, but it was a rocky road.", color: "text-yellow-700" };
}

function getResponseTime(utilization) {
  if (utilization < 0.7) return 180 + Math.round(40 * utilization);
  if (utilization < 0.9) return 210 + Math.round(240 * (utilization - 0.7) / 0.2);
  if (utilization <= 1.0) return 450 + Math.round(550 * (utilization - 0.9) / 0.1);
  return 2000 + Math.round(3000 * (utilization - 1));
}

function getResponseDescription(rt, utilization) {
  if (utilization >= 1.01) return "System overloaded!";
  if (rt > 950) return "Extremely slow ⚠️";
  if (rt > 700) return "Very slow";
  if (rt > 450) return "Lagging";
  return "Fast";
}

const RESPONSE_TIME_CHURN_THRESHOLD = 450;
const SATISFACTION_CHURN_THRESHOLD = 0.6;

// Shared Modal Component
function Modal({ title, children, onClose, icon, footer }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black bg-opacity-40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-fadein border border-slate-100">
        <div className="p-8 text-center">
          {icon && <div className="text-5xl mb-4">{icon}</div>}
          <h2 className="text-2xl font-bold text-slate-800 mb-2">{title}</h2>
          <div className="text-slate-600 mb-6">{children}</div>
          {footer ? footer : (
            <button onClick={onClose} className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-md active:scale-[0.98]">
              Continue
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
  const [showInstructions, setShowInstructions] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showScaleConfirm, setShowScaleConfirm] = useState(false);
  const [totalDowntime, setTotalDowntime] = useState(0);
  const [totalCrashes, setTotalCrashes] = useState(0);
  const [budget, setBudget] = useState(INITIAL_BUDGET); 
  const [lastProfit, setLastProfit] = useState(0);
  const [upgrades, setUpgrades] = useState(0);
  const [gameOverReason, setGameOverReason] = useState(null);
  const [stability, setStability] = useState(100);
  const [consecutiveHighLoad, setConsecutiveHighLoad] = useState(0);

  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  const currentTier = TIERS[tier];
  const { capacity, cpu, ram, maintenance } = currentTier;
  const utilization = activeUsers / capacity;
  const responseTime = getResponseTime(utilization);
  const responseDesc = getResponseDescription(responseTime, utilization);

  const nextTierIndex = tier + 1;
  const nextTier = TIERS[nextTierIndex];
  const nextUpgradeCost = nextTier?.upgradeCost;
  const enoughBudgetForUpgrade = nextUpgradeCost === undefined || budget >= nextUpgradeCost;
  
  const isRecovering = crash && crashLeft > 0;
  const isCrashedWaiting = crash && crashLeft === 0;
  const isScaling = downtimeLeft > 0;
  const isDown = isScaling || crash;
  const isGameOver = round > MAX_ROUNDS || !!gameOverReason || (round > 1 && activeUsers <= 0);

  const handleRestart = () => {
    if (!isCrashedWaiting) return;
    setCrashLeft(REBOOT_DOWNTIME);
    setLog(prev => [...prev, { type: "recover", text: `Round ${round} — 🔄 Reboot initiated (${REBOOT_DOWNTIME} rounds)...` }]);
  };

  const nextRound = () => {
    if (isGameOver) return;
    if (round === MAX_ROUNDS) { setGameOverReason("finished"); return; }

    let growthMultiplier = 1;
    let eventOccurred = false;
    if (round === 9 && userSatisfaction >= 0.85) { growthMultiplier = 2; eventOccurred = true; }

    let growth = !isDown ? getUserGrowth(round) * growthMultiplier : 0;
    let pool = activeUsers + growth;
    
    let churnedUsers = 0;
    let churnMsg = "";
    let churnType = "info";

    if (isDown) {
      churnedUsers = Math.ceil(pool * (0.06 + Math.random() * 0.04));
      churnMsg = `${churnedUsers} users left while site was offline.`;
      churnType = "warnslow";
    } else if (utilization >= 1.0) {
      churnedUsers = Math.ceil(pool * 0.20);
      churnMsg = "System overloaded! 20% of users left.";
      churnType = "warnover";
    } else if (responseTime > RESPONSE_TIME_CHURN_THRESHOLD) {
      churnedUsers = Math.ceil(pool * ((utilization - 0.9) * 2.0 + 0.05));
      churnMsg = `${churnedUsers} users lost to slowness.`;
      churnType = "warnslow";
    } else if (userSatisfaction < SATISFACTION_CHURN_THRESHOLD) {
      churnedUsers = Math.ceil((1 - userSatisfaction) * 0.15 * pool);
      churnMsg = churnedUsers > 0 ? `${churnedUsers} users quit due to low satisfaction.` : "";
      churnType = "warndissat";
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
      newStability = Math.max(0, newStability - (newConsecutive * 12));
    } else if (!isDown && nextUtil < 0.70) {
      newStability = Math.min(100, newStability + 15);
    }

    const crashChance = (100 - newStability) / 110; 
    
    if (!isDown && (Math.random() < crashChance || nextUtil > 1.25)) {
      newCrash = true;
      newCrashLeft = 0; 
      newStability = Math.max(0, newStability - 30);
      newSatisfaction = Math.max(0, newSatisfaction - 0.25);
      events.push({ type: "crash", text: "🔥 CRITICAL FAILURE! Sustained load broke the system. MANUAL RESTART REQUIRED." });
      setTotalDowntime((v) => v + 1);
      setTotalCrashes((v) => v + 1);
      crashedThisRound = true;
      newConsecutive = 0;
    }

    if (downtimeLeft > 0) {
      newDowntime--;
      newSatisfaction = Math.max(0, newSatisfaction - 0.09);
      events.push({ type: "downtime", text: `Downtime: scaling... (${newDowntime} rounds left)` });
      if (newDowntime === 0) events.push({ type: "recover", text: "Scaling complete! System online." });
      setTotalDowntime((v) => v + 1);
      newStability = Math.min(100, newStability + 5);
    } else if (crash) {
      if (newCrashLeft > 0) {
        newCrashLeft--;
        newSatisfaction = Math.max(0, newSatisfaction - 0.14);
        events.push({ type: "crash", text: `Downtime: Rebooting... (${newCrashLeft} rounds left)` });
        if (newCrashLeft === 0) {
          newCrash = false;
          events.push({ type: "recover", text: "Reboot finished! System online." });
          newStability = 60; 
        }
      } else {
        newSatisfaction = Math.max(0, newSatisfaction - 0.18);
        events.push({ type: "crash", text: "System is offline. Restart required." });
      }
      setTotalDowntime((v) => v + 1);
    }

    if (!isDown && !crashedThisRound) {
      if (responseTime > 950) newSatisfaction = Math.max(0, newSatisfaction - 0.11);
      else if (responseTime > 700) newSatisfaction = Math.max(0, newSatisfaction - 0.07);
      else if (responseTime > 450) newSatisfaction = Math.max(0, newSatisfaction - 0.03);
    }
    newSatisfaction = Math.min(1, Math.max(0, Math.round(newSatisfaction * 100) / 100));

    let reason = null;
    if (newBudget < 0) { newBudget = 0; reason = "budget"; }
    else if (nextUsers <= 0 && round > 1) reason = "no-users";

    let roundLog = [{ type: "normal", text: `Round ${round} — Users: ${activeUsers} → ${nextUsers} (Net: ${netBudgetChange >= 0 ? "+" : ""}$${netBudgetChange})` }];
    if (eventOccurred) { roundLog.push({ type: "recover", text: "🚀 Viral Success!" }); setShowEventModal(true); }
    if (churnMsg) roundLog.push({ type: churnType, text: churnMsg });
    roundLog = roundLog.concat(events.map(e => ({ ...e, type: e.type || "info" })));

    setRound((r) => r + 1);
    setActiveUsers(nextUsers);
    setDowntimeLeft(newDowntime);
    setCrash(newCrash);
    setCrashLeft(newCrashLeft);
    setUserSatisfaction(newSatisfaction);
    setBudget(newBudget);
    setLastProfit(netBudgetChange);
    setStability(newStability);
    setConsecutiveHighLoad(newConsecutive);
    setLog(prev => [...prev, ...roundLog]);
    if (reason) setGameOverReason(reason);
  };

  const handleScaleUp = () => {
    if (!canUpgradeStatus) return;
    setDowntimeLeft(SCALE_UP_DOWNTIME);
    setTier((cur) => cur + 1);
    setUpgrades((u) => u + 1);
    setBudget((prev) => prev - nextUpgradeCost);
    setLastProfit(0);
    setLog(prev => [...prev, { type: "downtime", text: `Round ${round} — ⬆️ Scaling to Tier ${tier + 2}.` }]);
    setTotalDowntime((v) => v + 1);
  };

  const reset = () => {
    setRound(1); setTier(0); setDowntimeLeft(0); setCrash(false); setCrashLeft(0);
    setUserSatisfaction(1); setActiveUsers(getInitialUsers()); setLog([]);
    setTotalDowntime(0); setTotalCrashes(0); setBudget(INITIAL_BUDGET); setLastProfit(0);
    setUpgrades(0); setStability(100); setConsecutiveHighLoad(0); setGameOverReason(null);
  };

  const satisEmoji = userSatisfaction >= 0.85 ? "🟢" : userSatisfaction >= 0.6 ? "😐" : "😡";
  const systemStatusEmoji = crash ? "🔥" : downtimeLeft ? "⏳" : utilization > 0.85 ? "⚠️" : "✅";
  const systemStatusLabel = isRecovering ? "Rebooting" : crash ? "Down" : isScaling ? "Scaling" : utilization > 0.85 ? "High Load" : "Stable";
  const stabilityColor = stability > 70 ? "text-green-600" : stability > 30 ? "text-yellow-600" : "text-red-600";
  const canUpgradeStatus = tier < TIERS.length - 1 && !isDown && !isGameOver && enoughBudgetForUpgrade;

  const rating = getPerformanceRating({ gameOverReason, downtime: totalDowntime, crashes: totalCrashes, satisfaction: userSatisfaction, budget });

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-2 sm:p-4 font-sans text-slate-900 overflow-hidden">
      {showEventModal && (
        <Modal title="🚀 Viral Surge!" icon="📈" onClose={() => setShowEventModal(false)}>
          Growth for Round 10 was doubled due to high satisfaction!
        </Modal>
      )}

      {/* Scale Up Confirmation Modal */}
      {showScaleConfirm && nextTier && (
        <Modal 
          title="Scale Up Instance" 
          icon="⬆️" 
          onClose={() => setShowScaleConfirm(false)}
          footer={
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setShowScaleConfirm(false)} 
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-[0.98]"
              >
                Cancel
              </button>
              <button 
                onClick={() => { handleScaleUp(); setShowScaleConfirm(false); }} 
                className="flex-1 py-4 bg-pink-600 text-white rounded-2xl font-bold hover:bg-pink-700 transition-all shadow-md active:scale-[0.98]"
              >
                Confirm Upgrade
              </button>
            </div>
          }
        >
          <div className="text-sm space-y-4 text-left">
            <p>You are about to upgrade your server to a <b>{nextTier.name}</b>.</p>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="block text-[10px] text-slate-400 uppercase font-black">Capacity</span>
                <span className="font-bold">{nextTier.capacity} Users</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 uppercase font-black">Op. Cost</span>
                <span className="font-bold text-rose-500">-${nextTier.maintenance}/rd</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 uppercase font-black">Upgrade Cost</span>
                <span className="font-bold text-indigo-600">${nextTier.upgradeCost}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 uppercase font-black">Hardware</span>
                <span className="font-bold">{nextTier.cpu}vCPU, {nextTier.ram}GB</span>
              </div>
            </div>
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <p className="text-amber-800 font-medium text-xs leading-relaxed">
                <b>DOWNTIME WARNING:</b> Scaling will take <b>{SCALE_UP_DOWNTIME} rounds</b>. Your web app and database will be completely offline, incurring user churn and zero profit.
              </p>
            </div>
          </div>
        </Modal>
      )}

      {gameOverReason && (
        <Modal title="Simulation Result" icon={gameOverReason === "budget" ? "💸" : "🏆"} onClose={reset}>
          <div className={`text-xl font-bold mb-2 ${rating.color}`}>{rating.title}</div>
          <p className="mb-4 text-sm italic">"{rating.desc}"</p>
          <div className="grid grid-cols-2 gap-4 text-left bg-slate-50 p-4 rounded-2xl text-sm border border-slate-100">
            <div>Final Users: <b>{Math.round(activeUsers)}</b></div>
            <div>Final Budget: <b>${Math.round(budget).toLocaleString()}</b></div>
            <div>Satisfaction: <b>{(userSatisfaction * 100).toFixed(0)}%</b></div>
            <div>Downtime: <b>{totalDowntime} rds</b></div>
          </div>
        </Modal>
      )}

      {showInstructions && (
        <Modal title="System Handbook" onClose={() => setShowInstructions(false)}>
          <div className="text-left text-xs space-y-2 leading-relaxed">
            <p>• <span className="font-bold">Scaling State:</span> While scaling, the system is offline. <span className="font-bold">Utilization</span> and <span className="font-bold">Stability</span> readouts are unavailable.</p>
            <p>• <span className="font-bold">Utilization Buffer:</span> System handles one round above 85% load. After that, <span className="text-rose-500 font-bold">Stability</span> drains.</p>
            <p>• <span className="font-bold">Colocated Architecture:</span> App and DB share the same host resources.</p>
          </div>
        </Modal>
      )}

      <div className="flex flex-col w-full max-w-6xl h-full max-h-[900px] bg-white border border-slate-200 rounded-[2.5rem] shadow-xl overflow-hidden">
        
        <header className="flex-shrink-0 p-4 sm:px-8 border-b bg-white flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <h1 className="text-lg font-black tracking-tight text-slate-800 uppercase">Infra-Scaler v2</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vertical Stack Sim</p>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setShowInstructions(true)} className="h-9 px-3 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-bold transition-all">Manual</button>
            <button onClick={nextRound} className="h-9 px-5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-20 transition-all shadow-sm" disabled={isGameOver}>
              {round === MAX_ROUNDS ? "Results" : "Run Round"}
            </button>
            {isCrashedWaiting ? (
              <button onClick={handleRestart} className="h-9 px-5 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 transition-all animate-pulse shadow-md">Restart</button>
            ) : (
              <button 
                onClick={() => setShowScaleConfirm(true)} 
                className="h-9 px-5 bg-pink-600 text-white rounded-lg font-bold hover:bg-pink-700 disabled:opacity-20 transition-all shadow-md" 
                disabled={!canUpgradeStatus}
              >
                Scale Up
              </button>
            )}
            <button onClick={reset} className="h-9 w-9 flex items-center justify-center bg-slate-100 text-slate-400 rounded-lg hover:bg-slate-200 transition-all">↺</button>
          </div>
        </header>

        <main className="flex-1 flex flex-col md:flex-row overflow-hidden border-b border-slate-100">
          
          <section className="w-full md:w-3/5 p-6 sm:p-8 overflow-y-auto border-r border-slate-50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
              <div className="space-y-3">
                <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-300 pb-2 border-b border-slate-50">Infrastructure</h4>
                {[
                  { label: "Round", value: `${Math.min(round, MAX_ROUNDS)} / ${MAX_ROUNDS}` },
                  { label: "Status", value: <div className="flex items-center gap-2"><span>{systemStatusEmoji}</span><span className="font-bold">{systemStatusLabel}</span></div> },
                  { label: "Instance", value: `${currentTier.name} (${cpu}vCPU, ${ram}GB)` }, // Updated to show CPU and Memory
                  { label: "Stability", value: isDown ? "—" : <span className={`font-black ${stabilityColor}`}>{stability.toFixed(0)}%</span> },
                  { label: "Total Crashes", value: totalCrashes }
                ].map((m, i) => (
                  <div key={i} className="flex justify-between items-center"><span className="text-slate-400 text-[10px] font-bold uppercase">{m.label}</span><div className="text-xs font-bold text-slate-800">{m.value}</div></div>
                ))}
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-300 pb-2 border-b border-slate-50">Ops & Finance</h4>
                {[
                  { label: "Active Users", value: Math.round(activeUsers) },
                  { label: "Latency", value: isDown ? "—" : <span className={responseTime > 700 ? "text-rose-500 font-bold" : "text-emerald-600"}>{responseTime}ms</span> },
                  { label: "Utilization", value: isDown ? "—" : <span className={utilization >= 0.85 ? "text-rose-500 font-black" : "text-emerald-500 font-bold"}>{(utilization * 100).toFixed(0)}%</span> },
                  { label: "User Mood", value: <div className="flex items-center gap-2 font-black"><span>{satisEmoji}</span><span>{(userSatisfaction * 100).toFixed(0)}%</span></div> },
                  { label: "Budget", value: <span className="font-black text-indigo-600">${Math.round(budget).toLocaleString()}</span> },
                  { label: "Operating Cost", value: <span className="text-rose-400 font-bold">-${maintenance}/rd</span> }
                ].map((m, i) => (
                  <div key={i} className="flex justify-between items-center"><span className="text-slate-400 text-[10px] font-bold uppercase">{m.label}</span><div className="text-xs font-bold text-slate-800">{m.value}</div></div>
                ))}
              </div>
            </div>
          </section>

          <section className="w-full md:w-2/5 bg-slate-50/50 p-6 flex flex-col items-center justify-center relative overflow-hidden">
            <h4 className="absolute top-6 left-6 text-[9px] uppercase font-black tracking-widest text-slate-300">Live Stack</h4>
            
            <div className={`relative w-full max-w-[240px] p-1 rounded-[2rem] border-4 transition-all duration-700 shadow-xl ${crash ? 'border-rose-200 bg-rose-50' : isScaling ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}>
              <div className="p-5 space-y-3">
                <div className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-1 ${isDown ? 'bg-slate-100 text-slate-400 grayscale' : 'bg-indigo-50 border-indigo-100 text-indigo-600 shadow-sm'}`}>
                  <span className="text-[10px] font-black uppercase">Web App</span>
                  <div className="w-full">
                    <div className="flex justify-between text-[8px] font-bold mb-0.5 uppercase tracking-tighter opacity-70">
                      <span>Resource Load</span>
                      <span>{isDown ? '0%' : `${(utilization * 100).toFixed(0)}%`}</span>
                    </div>
                    <div className="w-full bg-indigo-200 h-1 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full transition-all duration-700" style={{ width: isDown ? '0%' : `${utilization * 100}%` }}></div>
                    </div>
                  </div>
                </div>
                <div className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-1 ${isDown ? 'bg-slate-100 text-slate-400 grayscale' : 'bg-emerald-50 border-emerald-100 text-emerald-600 shadow-sm'}`}>
                  <span className="text-[10px] font-black uppercase">Database</span>
                  <div className="w-full">
                    <div className="flex justify-between text-[8px] font-bold mb-0.5 uppercase tracking-tighter opacity-70">
                      <span>Resource Load</span>
                      <span>{isDown ? '0%' : `${(Math.min(utilization * 1.1, 1) * 100).toFixed(0)}%`}</span>
                    </div>
                    <div className="w-full bg-emerald-200 h-1 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full transition-all duration-700" style={{ width: isDown ? '0%' : `${Math.min(utilization * 1.1, 1) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
                <div className="pt-2 flex justify-between gap-1 text-[9px] font-bold text-slate-500">
                  <div className="flex-1 bg-slate-100 p-1.5 rounded-lg text-center">{cpu}vCPU</div>
                  <div className="flex-1 bg-slate-100 p-1.5 rounded-lg text-center">{ram}GB</div>
                </div>
              </div>
            </div>
            <p className="mt-4 text-[9px] text-slate-400 font-bold text-center leading-tight uppercase tracking-widest">Monolithic Topology</p>
          </section>
        </main>

        <footer className="flex-shrink-0 h-40 p-4 sm:px-8 bg-slate-50">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Event Stream</h3>
          <div className="bg-white border border-slate-100 rounded-2xl h-[calc(100%-20px)] overflow-y-auto text-[10px] p-3 shadow-inner flex flex-col gap-1">
            {log.length === 0 ? (
              <div className="p-4 text-slate-300 italic text-center font-bold">Awaiting telemetry...</div>
            ) : (
              <>
                {log.map((item, i) => (
                  <div className={`p-2 rounded-lg border-b border-transparent ${item.type === "crash" ? "bg-rose-50 text-rose-800 font-bold" : item.type === "downtime" ? "bg-amber-50 text-amber-800" : item.type === "warn" ? "bg-orange-50 text-orange-900 font-bold" : "bg-slate-50 text-slate-600"}`} key={i}>
                    {item.text}
                  </div>
                ))}
                <div ref={logEndRef} />
              </>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
