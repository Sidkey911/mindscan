// MindScan Lite main script (scanner page)

const HISTORY_KEY = "mindscan_history_v1";
const HABITS_KEY = "mindscan_habits_v1";
const PROFILE_KEY = "mindscan_profile_v1";
const BADGE_COUNT_KEY = "mindscan_badge_count_v1";

// ---------- Helpers ----------

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const data = JSON.parse(raw);
    return data === null || data === undefined ? fallback : data;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.log("Save error", key, e);
  }
}

function loadHistory() {
  const arr = loadJSON(HISTORY_KEY, []);
  return Array.isArray(arr) ? arr : [];
}

function saveHistory(list) {
  saveJSON(HISTORY_KEY, list || []);
}

function loadHabits() {
  return loadJSON(HABITS_KEY, {});
}

function saveHabits(obj) {
  saveJSON(HABITS_KEY, obj || {});
}

function loadProfile() {
  return loadJSON(PROFILE_KEY, {});
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// ---------- DOM refs ----------

const scanForm = document.getElementById("scanForm");
const clearBtn = document.getElementById("clearBtn");
const resultCard = document.getElementById("resultCard");
const resultBadge = document.getElementById("resultBadge");
const resultLabel = document.getElementById("resultLabel");
const resultScore = document.getElementById("resultScore");
const resultMessage = document.getElementById("resultMessage");
const suggestionList = document.getElementById("suggestionList");
const scoreBarInner = document.getElementById("scoreBarInner");
const scoreBarLabel = document.getElementById("scoreBarLabel");
const wellnessAvatar = document.getElementById("wellnessAvatar");
const avatarText = document.getElementById("avatarText");
const themeToggle = document.getElementById("themeToggle");
const userGreeting = document.getElementById("userGreeting");

// History modal
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistory");
const showHistoryBtn = document.getElementById("showHistoryBtn");
const historyModal = document.getElementById("historyModal");
const historyModalClose = document.getElementById("historyModalClose");

// Habits & insights
const habitsForm = document.getElementById("habitsForm");
const habitScoreText = document.getElementById("habitScoreText");
const insightsText = document.getElementById("insightsText");

// Intelligence / impact
const trendTextEl = document.getElementById("trendText");
const patternTextEl = document.getElementById("patternText");
const predictionTextEl = document.getElementById("predictionText");
const twinTextEl = document.getElementById("twinText");
const planTextEl = document.getElementById("planText");
const habitImpactList = document.getElementById("habitImpactList");
const xpSummaryEl = document.getElementById("xpSummary");
const badgeListEl = document.getElementById("badgeList");

// Floating tips
const extraTipsList = document.getElementById("extraTipsList");
const extraTipsBtn = document.getElementById("extraTipsBtn");
const tipsFab = document.getElementById("tipsFab");
const tipsPanel = document.getElementById("tipsPanel");
const tipsClose = document.getElementById("tipsClose");

// Breathing
const breathingFab = document.getElementById("breathingFab");
const breathingPanel = document.getElementById("breathingPanel");
const breathingClose = document.getElementById("breathingClose");
const breathingCircle = document.getElementById("breathingCircle");
const breathingInstruction = document.getElementById("breathingInstruction");
const breathingToggle = document.getElementById("breathingToggle");
let breathingTimer = null;

// Coach
const coachFab = document.getElementById("coachFab");
const coachPanel = document.getElementById("coachPanel");
const coachClose = document.getElementById("coachClose");
const coachLog = document.getElementById("coachLog");
const coachInput = document.getElementById("coachInput");
const coachButton = document.getElementById("coachButton");

// XP modal
const xpModal = document.getElementById("xpModal");
const xpModalClose = document.getElementById("xpModalClose");

// ---------- Theme ----------

function initTheme() {
  const stored = localStorage.getItem("mindscan_theme") || "light";
  if (stored === "dark") {
    document.body.classList.add("theme-light-dark");
    if (themeToggle) themeToggle.textContent = "Switch to light theme";
  } else {
    if (themeToggle) themeToggle.textContent = "Switch to dark theme";
  }
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("theme-light-dark");
    localStorage.setItem("mindscan_theme", isDark ? "dark" : "light");
    themeToggle.textContent = isDark
      ? "Switch to light theme"
      : "Switch to dark theme";
  });
}

initTheme();

// ---------- Greeting from profile ----------

(function initGreeting() {
  if (!userGreeting) return;
  const p = loadProfile();
  if (p && p.name) {
    userGreeting.textContent =
      "Hi, " + p.name + ". Ready for today’s check-in?";
  } else {
    userGreeting.textContent =
      "Hi, welcome to MindScan Lite. Run your first check-in to start.";
  }
})();

// ---------- Scoring logic ----------

function computeResult(values) {
  const sleep = Number(values.sleep);
  const energy = Number(values.energy);
  const motivation = Number(values.motivation);
  const stress = Number(values.stress);
  const screen = Number(values.screen);
  const mood = Number(values.mood);

  const positive = sleep + energy + motivation + mood; // 4..20
  const negative = (stress - 1) * 1.5 + (screen - 1) * 1.0; // 0..8
  let raw = positive - negative; // -4 .. 20

  let norm = ((raw + 4) / 24) * 12;
  if (norm < 0) norm = 0;
  if (norm > 12) norm = 12;
  const score = norm;

  let label;
  if (score >= 9) label = "Green - doing okay";
  else if (score >= 5) label = "Yellow - mild stress warning";
  else label = "Red - high stress risk";

  let message;
  if (label.startsWith("Green")) {
    message =
      "Overall you seem to be coping fairly well today. Still, keep protecting your sleep, breaks and healthy connections so your wellness stays stable.";
  } else if (label.startsWith("Yellow")) {
    message =
      "You show some signs of stress or imbalance. This is a good time to slow down a bit, tidy your routine and give yourself more care before it becomes heavy.";
  } else {
    message =
      "Your answers show high stress or low mood. Please treat today gently: reduce pressure where possible, use calming strategies, and reach out to someone you trust if this feeling continues.";
  }

  const suggestions = [];

  if (sleep <= 2) {
    suggestions.push(
      "Plan a fixed sleep time tonight and avoid screens at least 30 minutes before bed."
    );
  }
  if (energy <= 2) {
    suggestions.push(
      "Consider a 10–15 minute walk or light stretching to gently boost your energy."
    );
  }
  if (motivation <= 2) {
    suggestions.push(
      "Break your tasks into very small steps (5–10 minutes) and start with the easiest one."
    );
  }
  if (stress >= 4) {
    suggestions.push(
      "Use the 4–4–4 breathing exercise in this app or another relaxation method for a few minutes."
    );
  }
  if (screen === 3) {
    suggestions.push(
      "Try to reduce non-study screen time tonight and replace it with an offline activity you enjoy."
    );
  }
  if (mood <= 2) {
    suggestions.push(
      "Talk to someone you trust about how you feel, even briefly, or write it down in a journal."
    );
  }

  if (!suggestions.length) {
    suggestions.push(
      "Document what is working well for you now (sleep, food, routine) so you can repeat it later."
    );
    suggestions.push(
      "Schedule a purposeful break like light exercise, hobby time or spiritual practice."
    );
  }

  let avatar = "🙂";
  let avatarMsg = "You seem reasonably balanced today.";
  if (label.startsWith("Yellow")) {
    avatar = "😐";
    avatarMsg = "Some tension is showing up; small changes can help you feel lighter.";
  }
  if (label.startsWith("Red")) {
    avatar = "😟";
    avatarMsg = "Your answers show a tough day. Please take extra care of yourself.";
  }

  return {
    score,
    label,
    message,
    suggestions,
    avatar,
    avatarMsg
  };
}

// ---------- Render result ----------

function showResult(res) {
  if (!resultCard) return;
  resultCard.hidden = false;

  resultLabel.textContent = res.label;
  resultScore.textContent = "Score: " + res.score.toFixed(1);
  resultMessage.textContent = res.message;

  suggestionList.innerHTML = "";
  res.suggestions.forEach((s) => {
    const li = document.createElement("li");
    li.textContent = s;
    suggestionList.appendChild(li);
  });

  resultBadge.classList.remove("status-green", "status-yellow", "status-red");
  if (res.label.startsWith("Green")) {
    resultBadge.classList.add("status-green");
  } else if (res.label.startsWith("Yellow")) {
    resultBadge.classList.add("status-yellow");
  } else {
    resultBadge.classList.add("status-red");
  }

  if (scoreBarInner) {
    const pct = (res.score / 12) * 100;
    scoreBarInner.style.width = pct.toFixed(0) + "%";
  }
  if (scoreBarLabel) {
    scoreBarLabel.textContent = "Wellness level today (0–12 scale).";
  }

  if (wellnessAvatar) wellnessAvatar.textContent = res.avatar;
  if (avatarText) avatarText.textContent = res.avatarMsg;
}

// ---------- History ----------

function renderHistory() {
  const history = loadHistory();
  historyList.innerHTML = "";

  if (!history.length) {
    const li = document.createElement("li");
    li.textContent = "No scans yet. Run MindScan to build your history.";
    historyList.appendChild(li);
  } else {
    history
      .slice()
      .reverse()
      .forEach((item) => {
        const li = document.createElement("li");
        const left = document.createElement("span");
        const right = document.createElement("span");
        left.textContent = `${item.date} - ${item.label}`;
        right.textContent = `Score ${Number(item.score).toFixed(1)}`;
        right.className = "history-score";
        li.appendChild(left);
        li.appendChild(right);
        historyList.appendChild(li);
      });
  }

  generateInsights();
}

// ---------- Insights, patterns, prediction, XP, habit impact ----------

function generateInsights() {
  if (!insightsText) return;

  const history = loadHistory();
  if (!history.length) {
    insightsText.textContent =
      "Run MindScan a few times and we will show patterns in your stress, mood and habits here.";

    if (trendTextEl) trendTextEl.textContent = "";
    if (patternTextEl) patternTextEl.textContent = "";
    if (predictionTextEl) predictionTextEl.textContent = "";
    if (twinTextEl) twinTextEl.textContent = "";
    if (planTextEl) planTextEl.textContent = "";
    if (habitImpactList) habitImpactList.innerHTML = "";
    if (xpSummaryEl) xpSummaryEl.textContent = "";
    if (badgeListEl) badgeListEl.innerHTML = "";
    return;
  }

  const last = history[history.length - 1];
  const total = history.length;
  let sum = 0;
  let redCount = 0;
  let yellowCount = 0;
  let greenCount = 0;

  history.forEach((h) => {
    const sc = Number(h.score) || 0;
    sum += sc;
    const label = h.label || "";
    if (label.startsWith("Red")) redCount++;
    else if (label.startsWith("Yellow")) yellowCount++;
    else if (label.startsWith("Green")) greenCount++;
  });

  const avg = sum / total;

  let trendText = "";
  if (history.length >= 4) {
    const firstAvg =
      (Number(history[0].score) + Number(history[1].score)) / 2;
    const lastAvg =
      (Number(history[history.length - 1].score) +
        Number(history[history.length - 2].score)) /
      2;

    if (lastAvg - firstAvg > 1) {
      trendText =
        "Your recent wellness scores are improving compared to earlier scans.";
    } else if (firstAvg - lastAvg > 1) {
      trendText =
        "Recent scores are lower than before, which may indicate increasing stress.";
    } else {
      trendText = "Your overall wellness has been fairly stable.";
    }
  } else {
    trendText = "More scans are needed to see a clear trend.";
  }

  let colourText = "";
  if (redCount >= 2) {
    colourText =
      "You have had " +
      redCount +
      " high-stress (red) scans. It may help to plan more rest or talk to someone you trust.";
  } else if (yellowCount > greenCount) {
    colourText =
      "Many of your scans are in the yellow zone. These are early warning signs; small changes in sleep, screen time and breaks can help.";
  } else {
    colourText =
      "Most of your scans are in the green zone. Keep protecting your healthy habits.";
  }

  let predictionText = "";
  if (history.length >= 3) {
    const last3 = history.slice(-3);
    let psum = 0;
    last3.forEach((h) => {
      psum += Number(h.score) || 0;
    });
    const pred = psum / last3.length;
    let level;
    if (pred >= 9) level = "likely to be in the green zone (doing okay)";
    else if (pred >= 5)
      level = "likely to be in the yellow zone (mild stress)";
    else level = "at risk of entering the red zone (high stress)";

    predictionText =
      "Based on your last three scans, tomorrow you are " + level + ".";
  } else {
    predictionText =
      "After a few more scans, we can start predicting your next-day wellness.";
  }

  let habitExtra = "";
  if (habitScoreText) {
    const t = habitScoreText.textContent || "";
    if (t.includes("0 / 5") || t.includes("1 / 5")) {
      habitExtra =
        "Your habit score today is quite low. Strengthening basics (sleep, water, movement, quiet time, low screen) will support better scores.";
    } else if (t.includes("4 / 5") || t.includes("5 / 5")) {
      habitExtra =
        "You are doing well with your daily habits. This strongly supports your mental health.";
    }
  }

  let twinType;
  if (avg >= 9 && greenCount >= yellowCount && greenCount >= redCount) {
    twinType =
      "Resilient Balancer – generally coping well with occasional stress spikes.";
  } else if (avg >= 6 && yellowCount >= greenCount && yellowCount > redCount) {
    twinType =
      "Overloaded Achiever – functioning, but often under moderate stress. Small adjustments in routine could give a big improvement.";
  } else if (avg < 6 && redCount >= yellowCount) {
    twinType =
      "Tired Struggler – your answers show frequent high stress or low mood. It may help to seek more support and protect your rest time.";
  } else {
    twinType =
      "Mixed Pattern – your wellness scores move up and down. Tracking habits and stressors more closely can help stabilise your days.";
  }

  insightsText.innerHTML =
    "<strong>Latest status:</strong> " +
    last.label +
    " (score " +
    Number(last.score).toFixed(1) +
    ").<br>" +
    "<strong>Average score:</strong> " +
    avg.toFixed(1) +
    " across " +
    total +
    " scans.<br>" +
    "<strong>Colour pattern:</strong> " +
    colourText +
    (habitExtra ? "<br><strong>Habits:</strong> " + habitExtra : "");

  if (trendTextEl) trendTextEl.textContent = "Trend: " + trendText;
  if (predictionTextEl)
    predictionTextEl.textContent = "Prediction: " + predictionText;
  if (twinTextEl) twinTextEl.textContent = "Your wellness type: " + twinType;

  let patternMessage = "";
  if (redCount >= 2 && avg < 6) {
    patternMessage =
      "Pattern detected: high stress risk. Many days show low scores – please consider building a stronger rest routine and seeking support.";
  } else if (yellowCount > greenCount && avg >= 6 && avg < 9) {
    patternMessage =
      "Pattern detected: digital or workload overload. You are functioning but under constant pressure – try to protect sleep and reduce late-night screen time.";
  } else if (greenCount >= yellowCount && avg >= 9) {
    patternMessage =
      "Pattern detected: generally healthy routine. Keep repeating what works for you (sleep, food, movement and breaks).";
  } else {
    patternMessage =
      "Pattern detected: fluctuating days. Watch for triggers that make some days much lower than others.";
  }
  if (patternTextEl) patternTextEl.textContent = patternMessage;

  // Action plan based on pattern
  let planText = "";
  const highRisk =
    avg < 6 || redCount >= 2 || predictionText.includes("red zone");
  const moderateRisk =
    !highRisk &&
    (yellowCount > greenCount || predictionText.includes("yellow zone"));
  const mostlyGreen = !highRisk && !moderateRisk && greenCount >= yellowCount;

  if (highRisk) {
    planText =
      "Next 3–7 days: 1) Protect sleep as your first priority (fixed bedtime, no screens 30–60 min before). 2) Do at least one short calming activity daily (breathing, prayer, journaling or quiet walk). 3) Reduce unnecessary screen time and multitasking. 4) Choose one safe person to talk to. If you still get many red days, consider meeting a counsellor or mental health professional.";
  } else if (moderateRisk) {
    planText =
      "Next 3–7 days: 1) Identify your biggest stress source and break it into tiny tasks. 2) Keep a minimum of 7 hours of sleep on most nights. 3) Limit late-night scrolling and schedule short breaks every 60–90 minutes. 4) Use the breathing exercise on days when your score feels lower than usual.";
  } else if (mostlyGreen) {
    planText =
      "Maintenance: 1) Continue the habits that keep you in the green zone. 2) Plan buffer days before big exams instead of last-minute rush. 3) Share healthy strategies with a friend. 4) Use MindScan once or twice a week to catch early changes.";
  } else {
    planText =
      "Action plan: keep tracking your days and try simple adjustments – consistent sleep timing, a bit of daily movement, and short breaks away from screens. Use your trends to see which changes help you feel better.";
  }

  if (planTextEl) {
    planTextEl.textContent = "Action plan: " + planText;
  }

  updateHabitImpactAndXP(history, avg, {
    green: greenCount,
    yellow: yellowCount,
    red: redCount
  });
}

function openXpModal() {
  if (xpModal) xpModal.hidden = false;
}

if (xpModalClose && xpModal) {
  xpModalClose.addEventListener("click", () => {
    xpModal.hidden = true;
  });
}

function updateHabitImpactAndXP(history, avgScore, counts) {
  const allHabits = loadHabits();

  // Habit impact
  if (habitImpactList) {
    habitImpactList.innerHTML = "";

    const habitKeys = ["sleep7", "water", "movement", "mindful", "lowScreen"];
    const habitLabels = {
      sleep7: "Slept at least 7 hours",
      water: "Drank at least 1 litre of water",
      movement: "Did some physical movement / exercise",
      mindful: "Relaxation / prayer / mindfulness",
      lowScreen: "Limited non-study screen time at night"
    };

    const stats = {};
    habitKeys.forEach((k) => {
      stats[k] = { with: [], without: [] };
    });

    history.forEach((h) => {
      const date = h.date;
      const sc = Number(h.score) || 0;
      const hv = allHabits[date];
      if (!hv) return;

      habitKeys.forEach((k) => {
        if (hv[k]) stats[k].with.push(sc);
        else stats[k].without.push(sc);
      });
    });

    const avgFn = (arr) =>
      arr.reduce((a, b) => a + b, 0) / (arr.length || 1);

    habitKeys.forEach((k) => {
      const s = stats[k];
      if (!s) return;
      if (s.with.length < 2 && s.without.length < 2) return;

      const avgWith = s.with.length ? avgFn(s.with) : null;
      const avgWithout = s.without.length ? avgFn(s.without) : null;
      if (avgWith === null || avgWithout === null) return;

      const diff = avgWith - avgWithout;
      const li = document.createElement("li");
      let message =
        "When you did \"" +
        habitLabels[k] +
        "\", your average score was " +
        avgWith.toFixed(1) +
        " vs " +
        avgWithout.toFixed(1) +
        " on days you skipped it.";

      if (diff > 0.7) {
        message += " This habit has a strong positive impact on your wellness.";
      } else if (diff > 0.3) {
        message += " This habit seems to support your wellness.";
      } else if (diff < -0.5) {
        message +=
          " On days you used this habit, scores were lower – check if you usually do it only when already very stressed.";
      }

      li.textContent = message;
      habitImpactList.appendChild(li);
    });

    if (!habitImpactList.children.length) {
      const liEmpty = document.createElement("li");
      liEmpty.textContent =
        "More days of data are needed before we can estimate how each habit affects your score.";
      habitImpactList.appendChild(liEmpty);
    }
  }

  // XP & badges (shown only in popup)
  if (!xpSummaryEl || !badgeListEl) return;

  let xp = 0;
  history.forEach((h) => {
    const label = h.label || "";
    if (label.startsWith("Green")) xp += 5;
    else if (label.startsWith("Yellow")) xp += 3;
    else xp += 1;
  });

  Object.keys(allHabits || {}).forEach((date) => {
    const hv = allHabits[date];
    if (!hv) return;
    Object.keys(hv).forEach((k) => {
      if (hv[k]) xp += 1;
    });
  });

  const level = Math.floor(xp / 25) + 1;

  xpSummaryEl.textContent =
    "Total wellness XP: " +
    xp +
    " • Level " +
    level +
    " (higher levels mean more consistent self-care and check-ins).";

  badgeListEl.innerHTML = "";

  const totalScans = history.length;

  function addBadge(text) {
    const li = document.createElement("li");
    li.textContent = text;
    badgeListEl.appendChild(li);
  }

  if (totalScans >= 7) {
    addBadge("Consistency Starter – you have recorded at least 7 wellness check-ins.");
  }
  if (totalScans >= 21) {
    addBadge("Habit Builder – more than 21 check-ins, building a long-term picture of your wellness.");
  }

  let longestGreen = 0;
  let currentGreen = 0;
  history.forEach((h) => {
    if ((h.label || "").startsWith("Green")) {
      currentGreen++;
      if (currentGreen > longestGreen) longestGreen = currentGreen;
    } else {
      currentGreen = 0;
    }
  });
  if (longestGreen >= 3) {
    addBadge("Calm Streak – at least " + longestGreen + " green days in a row.");
  }

  const hadRed = history.some((h) => (h.label || "").startsWith("Red"));
  const latestIsGreen = (history[history.length - 1].label || "").startsWith(
    "Green"
  );
  if (hadRed && latestIsGreen) {
    addBadge("Bounce Back – you returned to green after a high-stress period.");
  }

  if (avgScore >= 9 && counts.green >= counts.yellow && counts.green >= counts.red) {
    addBadge("Resilience Badge – your average score is very high over time.");
  }

  if (!badgeListEl.children.length) {
    addBadge("Keep scanning and practising habits to unlock wellness badges.");
  }

  // Show popup only when new badges are unlocked
  const badgeCount = badgeListEl.children.length;
  const prevCount = Number(localStorage.getItem(BADGE_COUNT_KEY) || "0");
  if (badgeCount > prevCount) {
    openXpModal();
  }
  localStorage.setItem(BADGE_COUNT_KEY, String(badgeCount));
}

// ---------- Habits ----------

function updateHabitScoreText() {
  if (!habitScoreText || !habitsForm) return;
  const checkboxes = habitsForm.querySelectorAll("input[type=checkbox]");
  let done = 0;
  checkboxes.forEach((cb) => {
    if (cb.checked) done++;
  });
  habitScoreText.textContent = "Today’s habit score: " + done + " / 5";
}

function initHabits() {
  if (!habitsForm) return;
  const allHabits = loadHabits();
  const today = todayISO();
  const todayHabits = allHabits[today] || {};

  const checkboxes = habitsForm.querySelectorAll("input[type=checkbox]");
  checkboxes.forEach((cb) => {
    cb.checked = !!todayHabits[cb.name];
  });
  updateHabitScoreText();

  habitsForm.addEventListener("change", () => {
    const all = loadHabits();
    const t = todayISO();
    const obj = {};
    const cbs = habitsForm.querySelectorAll("input[type=checkbox]");
    cbs.forEach((cb) => {
      obj[cb.name] = cb.checked;
    });
    all[t] = obj;
    saveHabits(all);
    updateHabitScoreText();
    generateInsights();
  });
}

initHabits();

// ---------- Breathing exercise (auto 4–4–4 with stop) ----------

function stopBreathingSession() {
  if (!breathingCircle || !breathingInstruction) return;
  breathingCircle.classList.remove("breathing-active");
  breathingInstruction.textContent =
    "Cycle finished. Tap \"Run again\" if you want another 4–4–4 session.";
  if (breathingTimer) {
    clearTimeout(breathingTimer);
    breathingTimer = null;
  }
}

function startBreathingSession() {
  if (!breathingCircle || !breathingInstruction) return;
  if (breathingTimer) clearTimeout(breathingTimer);
  breathingCircle.classList.add("breathing-active");
  breathingInstruction.textContent =
    "Inhale for 4 seconds as the circle grows, hold for 4, exhale for 4 as it shrinks.";
  const cycles = 3; // 3 × 12s = 36s
  breathingTimer = setTimeout(stopBreathingSession, cycles * 12000);
}

if (breathingFab && breathingPanel) {
  breathingFab.addEventListener("click", () => {
    const willShow = breathingPanel.hidden;
    breathingPanel.hidden = !willShow;
    if (willShow) {
      startBreathingSession();
    } else {
      stopBreathingSession();
    }
  });
}

if (breathingClose && breathingPanel) {
  breathingClose.addEventListener("click", () => {
    breathingPanel.hidden = true;
    stopBreathingSession();
  });
}

if (breathingToggle) {
  breathingToggle.addEventListener("click", () => {
    startBreathingSession();
  });
}

// ---------- Extra tips (hidden behind button) ----------

const extraTipsPool = [
  "Do a 5-minute stretch or walk between classes to reset your body.",
  "Drink a glass of water before you continue scrolling or studying.",
  "Write down three small wins or things you are grateful for today.",
  "Put your phone away from your bed 30 minutes before sleep.",
  "Plan tomorrow’s top 3 priorities so your mind can relax at night.",
  "If your thoughts race, try slow counting breaths from 1 to 10.",
  "Schedule a short catch-up with a friend or family member.",
  "Change your study location for a fresh environment."
];

if (tipsFab && tipsPanel) {
  tipsFab.addEventListener("click", () => {
    tipsPanel.hidden = !tipsPanel.hidden;
  });
}

if (tipsClose && tipsPanel) {
  tipsClose.addEventListener("click", () => {
    tipsPanel.hidden = true;
  });
}

if (extraTipsBtn && extraTipsList) {
  extraTipsBtn.addEventListener("click", () => {
    extraTipsList.innerHTML = "";
    const shuffled = extraTipsPool.sort(() => Math.random() - 0.5);
    shuffled.slice(0, 3).forEach((tip) => {
      const li = document.createElement("li");
      li.textContent = tip;
      extraTipsList.appendChild(li);
    });
  });
}

// ---------- AI Coach (chat style, rule-based) ----------

function appendCoachBubble(text, who) {
  if (!coachLog) return;
  const div = document.createElement("div");
  div.className = "coach-bubble " + (who === "user" ? "user" : "bot");
  div.textContent = text;
  coachLog.appendChild(div);
  coachLog.scrollTop = coachLog.scrollHeight;
}

function getCoachReply(text) {
  const t = (text || "").toLowerCase();

  if (!t || t.length < 5) {
    return "Try to describe what you feel and what situation you are in, then I can suggest one small step.";
  }

  if (t.includes("sleep") || t.includes("insomnia") || t.includes("tidur")) {
    return "Sleep problems are very common when stressed. Try to set a fixed cut-off time for screens, do 3–5 minutes of slow breathing, and keep your room dim and quiet. If this continues for many nights, talk to a counsellor or doctor.";
  }

  if (
    t.includes("exam") ||
    t.includes("test") ||
    t.includes("assignment") ||
    t.includes("study")
  ) {
    return "When exams or assignments feel overwhelming, break them into tiny tasks: list topics, set 25-minute focused blocks with short breaks, and start with the easiest piece. Combine this with good sleep instead of all-nighters.";
  }

  if (
    t.includes("friend") ||
    t.includes("family") ||
    t.includes("relationship")
  ) {
    return "Relationship stress can drain your energy a lot. Choose one safe person to talk to honestly, write down what you feel before you talk, and give yourself permission to set boundaries when you need space.";
  }

  if (t.includes("anxious") || t.includes("anxiety") || t.includes("panic")) {
    return "During anxiety, focus on your body first: slow breathing (4–4–4), grounding with 5 things you see, 4 you can touch, 3 you can hear. After it settles, identify one small action that reduces the trigger.";
  }

  if (
    t.includes("motivation") ||
    t.includes("malas") ||
    t.includes("no energy")
  ) {
    return "Low motivation often means your brain is tired, not lazy. Start with a very small step (5–10 minutes of work), reward yourself, and connect the task to a personal goal or value that matters to you.";
  }

  if (t.includes("sad") || t.includes("depress") || t.includes("down")) {
    return "Feeling low for a while can be really heavy. Try gentle routines: regular sleep, daylight, movement and small positive activities. If you feel this way most days, please consider talking to a counsellor or mental health professional.";
  }

  return "Thank you for sharing. Try to combine healthy basics (sleep, food, water, movement) with small, realistic tasks. If the feeling is heavy for many days or you feel unsafe, please reach out to a counsellor, doctor, or trusted adult for support.";
}

if (coachFab && coachPanel) {
  coachFab.addEventListener("click", () => {
    const willShow = coachPanel.hidden;
    coachPanel.hidden = !willShow;
    if (willShow && coachLog && !coachLog.hasChildNodes()) {
      appendCoachBubble(
        "Hi, I am your wellness coach demo. You can ask about stress, sleep, study or mood, and I’ll suggest one small step you can try.",
        "bot"
      );
    }
  });
}

if (coachClose && coachPanel) {
  coachClose.addEventListener("click", () => {
    coachPanel.hidden = true;
  });
}

if (coachButton && coachInput) {
  coachButton.addEventListener("click", () => {
    const q = coachInput.value.trim();
    if (!q) return;
    appendCoachBubble(q, "user");
    const reply = getCoachReply(q);
    appendCoachBubble(reply, "bot");
    coachInput.value = "";
  });

  coachInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      coachButton.click();
    }
  });
}

// ---------- History modal controls ----------

if (showHistoryBtn && historyModal) {
  showHistoryBtn.addEventListener("click", () => {
    historyModal.hidden = false;
  });
}

if (historyModalClose && historyModal) {
  historyModalClose.addEventListener("click", () => {
    historyModal.hidden = true;
  });
}

if (historyModal) {
  historyModal.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-backdrop")) {
      historyModal.hidden = true;
    }
  });
}

if (clearHistoryBtn) {
  clearHistoryBtn.addEventListener("click", () => {
    if (!confirm("Clear all previous scans on this device?")) return;
    saveHistory([]);
    renderHistory();
  });
}

// ---------- Scan form handlers ----------

if (scanForm) {
  scanForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = scanForm.elements;

    const values = {
      sleep: form.sleep.value,
      energy: form.energy.value,
      motivation: form.motivation.value,
      stress: form.stress.value,
      screen: form.screen.value,
      mood: form.mood.value
    };

    if (
      !values.sleep ||
      !values.energy ||
      !values.motivation ||
      !values.stress ||
      !values.screen ||
      !values.mood
    ) {
      alert("Please answer all questions first.");
      return;
    }

    const res = computeResult(values);
    showResult(res);

    const history = loadHistory();
    history.push({
      date: todayISO(),
      score: res.score.toFixed(1),
      label: res.label
    });
    saveHistory(history);
    renderHistory();
  });
}

if (clearBtn && scanForm) {
  clearBtn.addEventListener("click", () => {
    scanForm.reset();
  });
}

// ---------- Initial load ----------

renderHistory();

