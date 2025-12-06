// MindScan Lite - Main Page Logic

// ---------- CONSTANTS ----------
const HISTORY_KEY = "mindscan_history_v1";
const PROFILE_KEY = "mindscan_profile_v1";

// ---------- DOM ELEMENTS ----------
const form = document.getElementById("scanForm");
const clearBtn = document.getElementById("clearBtn");

const resultCard = document.getElementById("resultCard");
const resultBadge = document.getElementById("resultBadge");
const resultLabel = document.getElementById("resultLabel");
const resultScore = document.getElementById("resultScore");
const resultMessage = document.getElementById("resultMessage");
const suggestionList = document.getElementById("suggestionList");

const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistory");

// Profile elements
const profileForm = document.getElementById("profileForm");
const saveProfileBtn = document.getElementById("saveProfileBtn");

// Breathing & tips
const breathingCircle = document.getElementById("breathingCircle");
const breathingInstruction = document.getElementById("breathingInstruction");
const breathingToggle = document.getElementById("breathingToggle");
const extraTipsBtn = document.getElementById("extraTipsBtn");
const extraTipsList = document.getElementById("extraTipsList");

// ---------- STORAGE HELPERS ----------
function loadHistory() {
  try {
    const data = JSON.parse(localStorage.getItem(HISTORY_KEY));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function loadProfile() {
  try {
    const data = JSON.parse(localStorage.getItem(PROFILE_KEY));
    return data || {};
  } catch {
    return {};
  }
}

function saveProfile(data) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
}

// ---------- PROFILE HANDLING ----------
function fillProfileForm() {
  if (!profileForm) return;
  const p = loadProfile();
  profileForm.name.value = p.name || "";
  profileForm.age.value = p.age || "";
  profileForm.gender.value = p.gender || "";
  profileForm.studentId.value = p.studentId || "";
  profileForm.course.value = p.course || "";
  profileForm.email.value = p.email || "";
}

// ---------- SCORE INTERPRETATION ----------
function interpretScore(score) {
  const s = Math.max(0, Math.round(score));

  let status, label, message;
  if (s >= 9) {
    status = "green";
    label = "Green - doing okay";
    message =
      "You seem to be in a relatively good state overall. Keep maintaining your healthy behaviours and continue to monitor your stress.";
  } else if (s >= 5) {
    status = "yellow";
    label = "Yellow - mild stress warning";
    message =
      "You show some signs of stress or imbalance. It is a good time to slow down a bit and give yourself more care.";
  } else {
    status = "red";
    label = "Red - high stress risk";
    message =
      "Your answers suggest a high level of stress or low mood. It is important to rest and, if possible, talk to someone you trust.";
  }

  const suggestionMap = {
    0: [
      "Stop everything for a moment and check basic needs: have you eaten, drunk water, and slept enough?",
      "Find a quiet place and do 3–5 minutes of slow breathing before continuing tasks.",
      "If this level continues for several days, please consider contacting a counsellor or trusted adult."
    ],
    1: [
      "Give yourself permission to take a full break from study/work for at least 30 minutes.",
      "Reach out to someone you trust and tell them honestly how you feel.",
      "Avoid big decisions today; focus only on simple, necessary tasks."
    ],
    2: [
      "Choose one small task only and complete it slowly, then rest.",
      "Limit social media for the next few hours to reduce mental overload.",
      "Plan one comforting activity for tonight, such as a warm shower or favourite show."
    ],
    3: [
      "Drink a full glass of water and have a light, balanced snack.",
      "Do a 5-minute stretch for neck, shoulders, and back to release tension.",
      "Write down everything that is worrying you, then circle only what needs attention today."
    ],
    4: [
      "Schedule a short walk (5–10 minutes) outside or along the corridor.",
      "Reduce caffeine for the rest of the day to avoid feeling more wired and anxious.",
      "Set a realistic cut-off time tonight to stop studying and start winding down."
    ],
    5: [
      "Organise your to-do list into: must do today, can do later, can drop.",
      "Take a 5-minute breathing break before starting your next task.",
      "If possible, talk briefly with a friend just to share how your day is going."
    ],
    6: [
      "Protect 10–15 minutes tonight just for yourself (no phone) to unwind.",
      "Swap one unhealthy snack today with a fruit, nuts, or yogurt.",
      "Check your posture while studying and adjust your chair or table height."
    ],
    7: [
      "Plan your next 24 hours with one small goal for sleep, food, and movement.",
      "Do a quick digital declutter: close unused tabs and mute unnecessary notifications.",
      "Celebrate one thing you handled well today, even if it feels small."
    ],
    8: [
      "Maintain your current routine, but add one extra self-care action (for example, stretching before sleep).",
      "Share something positive about your day with someone close to you.",
      "Prepare your study/work area for tomorrow so you can start calmly."
    ],
    9: [
      "Keep the same sleep schedule for the next few days to support your good state.",
      "Use your energy to finish one task you’ve been delaying.",
      "Do something kind for another person; helping others also supports your own wellness."
    ],
    10: [
      "Document what is working well for you now (sleep, food, routine) so you can repeat it later.",
      "Schedule a purposeful break: maybe light exercise, hobby time, or spiritual practice.",
      "Check if there is any small habit that you can improve further, such as drinking more water."
    ],
    11: [
      "Maintain balance: don’t overload yourself just because you feel okay now.",
      "Take a moment to reflect on what you are grateful for today.",
      "Keep practising short breaks to protect your mental energy in the long term."
    ],
    12: [
      "You are doing very well; use this period to build strong habits that will help during stressful times.",
      "Support a friend or classmate who may not be feeling as good as you right now.",
      "Review your weekly schedule to ensure you still have enough time for rest and hobbies."
    ],
    13: [
      "Great score. Continue maintaining your healthy lifestyle and boundaries.",
      "Consider writing down your current routine as a ‘personal wellness plan’ to use during exam weeks.",
      "Remember balance: even when you feel good, rest and downtime are still important."
    ]
  };

  const suggestions =
    suggestionMap[s] ||
    [
      "Take a short break and move your body for a few minutes.",
      "Drink some water and check if you need food or rest.",
      "Plan one small positive action for yourself before the day ends."
    ];

  return { status, label, message, suggestions };
}

// ---------- SCORING ----------
function computeScore(values) {
  const sleep = Number(values.sleep);
  const energy = Number(values.energy);
  const motivation = Number(values.motivation);
  const stress = Number(values.stress);
  const screen = Number(values.screen);
  const mood = Number(values.mood);

  const sleepPts = sleep;
  const energyPts = energy;
  const motivationPts = motivation;
  const moodPts = mood;

  const stressPenalty = stress;
  let screenPenalty = 0;
  if (screen === 2) screenPenalty = 1;
  if (screen === 3) screenPenalty = 2;

  const raw =
    sleepPts + energyPts + motivationPts + moodPts - (stressPenalty + screenPenalty);

  return Math.max(0, raw);
}

// ---------- RENDERING ----------
function renderResult(score, interpretation) {
  if (!resultCard) return;
  resultCard.hidden = false;

  resultBadge.classList.remove("status-green", "status-yellow", "status-red");

  if (interpretation.status === "green") {
    resultBadge.classList.add("status-green");
  } else if (interpretation.status === "yellow") {
    resultBadge.classList.add("status-yellow");
  } else {
    resultBadge.classList.add("status-red");
  }

  resultLabel.textContent = interpretation.label;
  resultScore.textContent = "Score: " + score.toFixed(1);
  resultMessage.textContent = interpretation.message;

  suggestionList.innerHTML = "";
  interpretation.suggestions.forEach((s) => {
    const li = document.createElement("li");
    li.textContent = s;
    suggestionList.appendChild(li);
  });
}

function renderHistory() {
  if (!historyList) return;
  const history = loadHistory();

  historyList.innerHTML = "";
  if (!history.length) {
    const li = document.createElement("li");
    li.textContent = "No previous scans yet.";
    historyList.appendChild(li);
    return;
  }

  history
    .slice()
    .reverse()
    .forEach((item) => {
      const li = document.createElement("li");
      const left = document.createElement("span");
      const right = document.createElement("span");
      left.textContent = `${item.date} - ${item.label}`;
      right.textContent = "Score " + Number(item.score).toFixed(1);
      right.className = "history-score";
      li.appendChild(left);
      li.appendChild(right);
      historyList.appendChild(li);
    });
}

// ---------- EXTRA TIPS ----------
const extraTipsPool = [
  "Take 5 deep breaths before you check your phone in the morning.",
  "Keep a water bottle on your table and sip every 20 minutes.",
  "Stand up and stretch for 30 seconds after each long task.",
  "Try to keep one hour before sleep free from social media scrolling.",
  "Write down three things you are grateful for today.",
  "Eat at least one serving of fruit or vegetables with your main meal.",
  "Schedule a ‘no-study’ block this week just for rest or hobbies.",
  "Do a short walk outdoors or near a window to get some daylight.",
  "Lower your screen brightness at night and turn on night mode.",
  "Choose one person to send a kind message to today."
];

function pickRandomTips(n) {
  const copy = [...extraTipsPool];
  const chosen = [];
  while (copy.length && chosen.length < n) {
    const idx = Math.floor(Math.random() * copy.length);
    chosen.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return chosen;
}

function renderExtraTips() {
  if (!extraTipsList) return;
  extraTipsList.innerHTML = "";
  pickRandomTips(3).forEach((tip) => {
    const li = document.createElement("li");
    li.textContent = tip;
    extraTipsList.appendChild(li);
  });
}

// ---------- EVENT LISTENERS ----------

// Main form
form?.addEventListener("submit", (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const values = {
    sleep: formData.get("sleep"),
    energy: formData.get("energy"),
    motivation: formData.get("motivation"),
    stress: formData.get("stress"),
    screen: formData.get("screen"),
    mood: formData.get("mood")
  };

  const score = computeScore(values);
  const interpretation = interpretScore(score);
  renderResult(score, interpretation);

  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);

  const history = loadHistory();
  history.push({
    date: dateStr,
    score,
    label: interpretation.label
  });
  saveHistory(history);
  renderHistory();
});

clearBtn?.addEventListener("click", () => {
  form.reset();
  if (resultCard) resultCard.hidden = true;
});

clearHistoryBtn?.addEventListener("click", () => {
  if (confirm("Clear all saved scan history from this browser?")) {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
  }
});

// Profile save
saveProfileBtn?.addEventListener("click", () => {
  if (!profileForm) return;
  const data = {
    name: profileForm.name.value.trim(),
    age: profileForm.age.value.trim(),
    gender: profileForm.gender.value,
    studentId: profileForm.studentId.value.trim(),
    course: profileForm.course.value.trim(),
    email: profileForm.email.value.trim()
  };
  saveProfile(data);
  alert("Profile saved successfully!");
});

// Breathing toggle with automated 4-4-4 cycle
if (breathingToggle && breathingCircle && breathingInstruction) {
  let breathingOn = false;
  let breathingTimer = null;

  function resetBreathingText() {
    breathingInstruction.textContent =
      'Tap "Start breathing" to begin a 4–4–4 breathing cycle.';
  }

  function startBreathingLoop() {
    let phase = 0; // 0 = inhale, 1 = hold, 2 = exhale

    function nextPhase() {
      if (!breathingOn) return;

      if (phase === 0) {
        breathingInstruction.textContent = "Inhale slowly for 4 seconds…";
      } else if (phase === 1) {
        breathingInstruction.textContent = "Hold your breath for 4 seconds…";
      } else {
        breathingInstruction.textContent = "Exhale gently for 4 seconds…";
      }

      phase = (phase + 1) % 3;
      breathingTimer = setTimeout(nextPhase, 4000);
    }

    nextPhase();
  }

  function stopBreathingLoop() {
    clearTimeout(breathingTimer);
    breathingTimer = null;
    resetBreathingText();
  }

  breathingToggle.addEventListener("click", () => {
    breathingOn = !breathingOn;

    if (breathingOn) {
      breathingCircle.classList.add("breathing-active");
      breathingToggle.textContent = "Stop breathing exercise";
      startBreathingLoop();
    } else {
      breathingCircle.classList.remove("breathing-active");
      breathingToggle.textContent = "Start breathing";
      stopBreathingLoop();
    }
  });

  resetBreathingText();
}

// Extra tips
if (extraTipsBtn) {
  extraTipsBtn.addEventListener("click", renderExtraTips);
}

// ---------- INITIALISE ----------
fillProfileForm();
renderHistory();
renderExtraTips();

  
