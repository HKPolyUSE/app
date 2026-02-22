# Infra-Scaler v2: Simulation Guide & Documentation

1. Student Guide

Welcome to the front lines of IT Operations. You are responsible for managing a growing web application hosted on a single, monolithic server. Your goal is to survive 20 rounds of rapid user growth without going bankrupt or letting your system collapse.

Objective

Maximize your Active Users and Final Budget while maintaining a high User Satisfaction score.

Your Dashboard

Infrastructure Panel: Monitor your "System Status" and "Stability." If Stability hits 0%, a crash is nearly certain.

Load & Finance Panel: Track your "Utilization." If this exceeds 85%, your system is under heavy stress. Monitor your "Budget" to ensure your "Operating Cost" isn't higher than your income.

Live Stack: A visual representation of your server. The bars show the resource load on the Web App and Database.

Key Actions

Next Round: Advances time. Users grow, profit is collected, and expenses are paid.

Scale Up: Upgrades your hardware (CPU/RAM).

Warning: This causes 2 rounds of downtime. You earn $0 during this time and users will leave due to the outage.

Restart Server: If the system crashes (Status: Down), you must click this to begin a 3-round reboot.

Pro-Tips for Success

The Round 10 Viral Event: If your users are happy (Satisfaction > 85%) by Round 9, you will trigger a "Viral Surge" in Round 10, doubling your growth. Plan your capacity accordingly!

The Stability Buffer: You can survive one round of high utilization (>85%) without losing stability. Use this "buffer round" to trigger a Scale Up before your stability starts to drain.

Don't Over-Scale: Bigger servers have massive "Operating Costs." If you upgrade to a Performance Instance too early, your overhead might drain your budget before you have enough users to pay the bills.

2. Teacher Debriefing Guide

This simulation is designed to teach the trade-offs between Performance, Cost, and Availability in a vertical scaling environment.

Learning Objectives

Understand the "Downtime Penalty" associated with vertical scaling.

Observe how technical debt (low stability) leads to catastrophic failure.

Manage a Profit & Loss (P&L) statement while handling technical constraints.

Discussion Questions

The Scaling Dilemma: "Who scaled in Round 8 or 9 to prepare for the Round 10 event? Did the 2-round downtime hurt you more than the viral growth helped you?"

Stability vs. Risk: "Once your stability started dropping, did you try to 'ride it out' or did you scale immediately? What was the breaking point?"

The Monolithic Failure: "In this game, the App and DB share one server. If we moved the Database to its own server (Horizontal Scaling), how would that have changed your strategy?"

Financial Strategy: "Did anyone go bankrupt? Was it because of a crash, or because the Operating Cost of a large server was too high for your user base?"

Grading Rubric

The simulation awards a final grade based on:

S-Tier: Perfect uptime, zero crashes, >$60k budget.

A/B-Tier: High growth, perhaps one crash, maintained profitability.

C/D-Tier: High churn, low satisfaction, barely survived.

F-Tier: Bankruptcy or total user loss.

3. Appendix: Technical Logic & Mechanics

Initial Settings

Starting Budget: $5,000.

Initial Users: 30.

Instance Tiers: * Micro: 80 Capacity | $600/rd Maintenance.

Standard: 160 Capacity | $2,000 Upgrade | $1,500/rd Maintenance.

Performance: 320 Capacity | $4,000 Upgrade | $3,500/rd Maintenance.

Core Game Mechanics

1. Stability & Crash Logic

The simulation uses a Sustained Load Model.

Load Check: If Utilization > 85%, the system enters "High Load."

Consecutive Rounds: Round 1 of High Load is free. Round 2+ drains Stability by ConsecutiveRounds * 12%.

Crash Probability: (100 - Stability) / 110. If Stability is 50%, there is a ~45% chance of a crash every round.

Hard Limit: If Utilization exceeds 125%, the system crashes instantly.

2. User Churn (Loss)

Users leave the platform based on the "worst" current condition:

Downtime Churn: 6–10% of users leave per round when the system is Scaling, Crashed, or Rebooting.

Overload Churn: 20% leave instantly if Utilization ≥ 100%.

Latency Churn: If Response Time > 450ms, users leave based on a formula: (Utilization - 0.9) * 2.0.

Satisfaction Churn: If Satisfaction < 60%, users quit at a rate of (1 - Satisfaction) * 15%.

3. Performance Metrics

Response Time: Calculated using an exponential curve.

Healthy (<70% util): ~180-210ms.

Stressed (90-100% util): 450-1000ms.

Overloaded (>100% util): 2000ms+.

Satisfaction: Decreases by fixed amounts based on latency:

950ms: -11% per round.

700ms: -7% per round.

Downtime: -9% to -18% per round.

Game Design Issues Addressed

Vertical Scaling Limitation: In a monolithic vertical scale, you cannot "hot-swap." The simulation enforces this by requiring the server to be "Down" during upgrades.

Financial Balancing: The revenue per user ($25) is balanced against the exponential growth of Operating Costs to prevent users from simply buying the largest server immediately.

Manual Intervention: Requiring a "Restart" button ensures the player is actively monitoring the "Down" state rather than just clicking "Next Round" repeatedly.
