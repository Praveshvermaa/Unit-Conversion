/* ============================================
   SCALE QUEST — GAME ENGINE v2
   Cross-unit conversion with visual feedback
   ============================================ */

// ─── SOUND ENGINE (Web Audio API) ────────────────────────
const SoundEngine = (() => {
  let ctx = null;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function playTone(freq, duration, type = 'sine', volume = 0.15) {
    try {
      const c = getCtx();
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(c.currentTime);
      osc.stop(c.currentTime + duration);
    } catch (_) {}
  }

  return {
    tick()    { playTone(1200, 0.05, 'square', 0.06); },
    click()   { playTone(800, 0.08, 'sine', 0.1); },
    pop()     { playTone(600, 0.12, 'sine', 0.15); playTone(900, 0.12, 'sine', 0.1); },
    correct() {
      [523, 659, 784, 1047].forEach((f, i) =>
        setTimeout(() => playTone(f, 0.2, 'sine', 0.12), i * 100)
      );
    },
    wrong()   { playTone(300, 0.3, 'sawtooth', 0.08); playTone(200, 0.4, 'sawtooth', 0.06); },
    addWeight()  { playTone(500, 0.1, 'triangle', 0.12); },
    balance()    {
      [400, 500, 600, 800].forEach((f, i) =>
        setTimeout(() => playTone(f, 0.25, 'sine', 0.1), i * 120)
      );
    },
    badge()   {
      [523, 659, 784, 1047, 1319].forEach((f, i) =>
        setTimeout(() => playTone(f, 0.15, 'sine', 0.1), i * 80)
      );
    },
    star(i = 0) { setTimeout(() => playTone(700 + i * 200, 0.2, 'sine', 0.1), 0); }
  };
})();


// ─── CONFETTI ENGINE ─────────────────────────────────────
const Confetti = (() => {
  const canvas = document.getElementById('confetti-canvas');
  const cCtx = canvas.getContext('2d');
  let particles = [];
  let animId = null;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const COLORS = ['#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#FF6B9D','#C084FC','#FFA07A','#20B2AA'];

  function create(count = 100) {
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height,
        w: Math.random() * 10 + 5,
        h: Math.random() * 6 + 3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        rot: Math.random() * 360,
        rv: (Math.random() - 0.5) * 8,
        opacity: 1
      });
    }
  }

  function draw() {
    cCtx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    particles.forEach(p => {
      if (p.opacity <= 0) return;
      alive = true;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.rv;
      p.vy += 0.05;
      if (p.y > canvas.height) p.opacity -= 0.02;
      cCtx.save();
      cCtx.translate(p.x, p.y);
      cCtx.rotate(p.rot * Math.PI / 180);
      cCtx.globalAlpha = Math.max(0, p.opacity);
      cCtx.fillStyle = p.color;
      cCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      cCtx.restore();
    });
    if (alive) animId = requestAnimationFrame(draw);
    else { cCtx.clearRect(0, 0, canvas.width, canvas.height); animId = null; }
  }

  return {
    fire(count = 120) {
      if (animId) cancelAnimationFrame(animId);
      create(count);
      draw();
    },
    clear() {
      if (animId) cancelAnimationFrame(animId);
      particles = [];
      cCtx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };
})();


// ─── UNIT DISPLAY HELPERS ────────────────────────────────
const UNIT_FULL_NAMES = {
  mm: 'millimeters (mm)',
  cm: 'centimeters (cm)',
  m: 'meters (m)',
  km: 'kilometers (km)',
  mg: 'milligrams (mg)',
  g: 'grams (g)',
  kg: 'kilograms (kg)'
};

function formatValue(val, unit) {
  // Clean up floating point
  const rounded = Math.round(val * 1000) / 1000;
  return rounded + ' ' + unit;
}


// ─── QUESTIONS ───────────────────────────────────────────

// LEVEL 1: LENGTH — Every question asks in one unit, scale shows another
const LEVEL_1_QUESTIONS = [
  // ── mm ↔ cm (5 questions) ──
  {
    text: "1 centimeter is equal to how many millimeters?",
    askUnit: "cm", scaleUnit: "mm",
    rulerMin: 0, rulerMax: 20, rulerStep: 2,
    answer: 10, difficulty: "easy",
    hint: "1 cm = 10 mm. Find 10 on the mm scale!",
    explanation: "1 centimeter is exactly 10 millimeters.",
    conversionRule: "1 cm = 10 mm",
    learnVisual: ["1 cm", "=", "10 mm"]
  },
  {
    text: "2.5 centimeters is how many millimeters?",
    askUnit: "cm", scaleUnit: "mm",
    rulerMin: 0, rulerMax: 50, rulerStep: 5,
    answer: 25, difficulty: "medium",
    hint: "Each cm has 10 mm. So 2.5 × 10 = ?",
    explanation: "2.5 cm × 10 = 25 mm. Half a cm is 5 mm!",
    conversionRule: "1 cm = 10 mm",
    learnVisual: ["2.5 cm", "× 10 →", "25 mm"]
  },
  {
    text: "5 centimeters equals how many millimeters?",
    askUnit: "cm", scaleUnit: "mm",
    rulerMin: 0, rulerMax: 100, rulerStep: 10,
    answer: 50, difficulty: "easy",
    hint: "5 × 10 = ?",
    explanation: "5 cm × 10 = 50 mm. Every centimeter holds 10 millimeters!",
    conversionRule: "1 cm = 10 mm",
    learnVisual: ["5 cm", "× 10 →", "50 mm"]
  },
  {
    text: "20 millimeters is equal to how many centimeters?",
    askUnit: "mm", scaleUnit: "cm",
    rulerMin: 0, rulerMax: 5, rulerStep: 1,
    answer: 2, difficulty: "easy",
    hint: "10 mm = 1 cm. So 20 mm = ? cm",
    explanation: "20 mm ÷ 10 = 2 cm. Every 10 mm makes 1 cm!",
    conversionRule: "10 mm = 1 cm",
    learnVisual: ["20 mm", "÷ 10 →", "2 cm"]
  },
  {
    text: "50 millimeters equals how many centimeters?",
    askUnit: "mm", scaleUnit: "cm",
    rulerMin: 0, rulerMax: 10, rulerStep: 1,
    answer: 5, difficulty: "easy",
    hint: "Divide by 10: 50 ÷ 10 = ?",
    explanation: "50 mm ÷ 10 = 5 cm.",
    conversionRule: "10 mm = 1 cm",
    learnVisual: ["50 mm", "÷ 10 →", "5 cm"]
  },

  // ── cm ↔ m (6 questions) ──
  {
    text: "1 meter is equal to how many centimeters?",
    askUnit: "m", scaleUnit: "cm",
    rulerMin: 0, rulerMax: 200, rulerStep: 20,
    answer: 100, difficulty: "easy",
    hint: "1 meter = 100 centimeters!",
    explanation: "1 meter is exactly 100 centimeters.",
    conversionRule: "1 m = 100 cm",
    learnVisual: ["1 m", "=", "100 cm"]
  },
  {
    text: "2 meters is how many centimeters?",
    askUnit: "m", scaleUnit: "cm",
    rulerMin: 0, rulerMax: 300, rulerStep: 50,
    answer: 200, difficulty: "easy",
    hint: "2 × 100 = ?",
    explanation: "2 m × 100 = 200 cm. Double the meter, double the centimeters!",
    conversionRule: "1 m = 100 cm",
    learnVisual: ["2 m", "× 100 →", "200 cm"]
  },
  {
    text: "1.5 meters equals how many centimeters?",
    askUnit: "m", scaleUnit: "cm",
    rulerMin: 0, rulerMax: 200, rulerStep: 25,
    answer: 150, difficulty: "medium",
    hint: "1.5 × 100 = ?",
    explanation: "1.5 m × 100 = 150 cm. That's 1 meter + half a meter!",
    conversionRule: "1 m = 100 cm",
    learnVisual: ["1.5 m", "× 100 →", "150 cm"]
  },
  {
    text: "Half a meter is how many centimeters?",
    askUnit: "m", scaleUnit: "cm",
    rulerMin: 0, rulerMax: 100, rulerStep: 10,
    answer: 50, difficulty: "easy",
    hint: "Half of 100 = ?",
    explanation: "0.5 m = 50 cm. Half of 100 is 50!",
    conversionRule: "1 m = 100 cm",
    learnVisual: ["0.5 m", "× 100 →", "50 cm"]
  },
  {
    text: "500 centimeters is equal to how many meters?",
    askUnit: "cm", scaleUnit: "m",
    rulerMin: 0, rulerMax: 10, rulerStep: 1,
    answer: 5, difficulty: "medium",
    hint: "100 cm = 1 m. So 500 ÷ 100 = ?",
    explanation: "500 cm ÷ 100 = 5 m. Every 100 cm is 1 meter!",
    conversionRule: "100 cm = 1 m",
    learnVisual: ["500 cm", "÷ 100 →", "5 m"]
  },
  {
    text: "200 centimeters is how many meters?",
    askUnit: "cm", scaleUnit: "m",
    rulerMin: 0, rulerMax: 5, rulerStep: 1,
    answer: 2, difficulty: "easy",
    hint: "200 ÷ 100 = ?",
    explanation: "200 cm ÷ 100 = 2 m.",
    conversionRule: "100 cm = 1 m",
    learnVisual: ["200 cm", "÷ 100 →", "2 m"]
  },

  // ── m ↔ km (5 questions) ──
  {
    text: "1 kilometer is equal to how many meters?",
    askUnit: "km", scaleUnit: "m",
    rulerMin: 0, rulerMax: 2000, rulerStep: 200,
    answer: 1000, difficulty: "easy",
    hint: "1 km = 1000 meters. 'Kilo' means thousand!",
    explanation: "1 kilometer is exactly 1000 meters.",
    conversionRule: "1 km = 1000 m",
    learnVisual: ["1 km", "=", "1000 m"]
  },
  {
    text: "2 kilometers is how many meters?",
    askUnit: "km", scaleUnit: "m",
    rulerMin: 0, rulerMax: 2500, rulerStep: 500,
    answer: 2000, difficulty: "easy",
    hint: "2 × 1000 = ?",
    explanation: "2 km × 1000 = 2000 m.",
    conversionRule: "1 km = 1000 m",
    learnVisual: ["2 km", "× 1000 →", "2000 m"]
  },
  {
    text: "Half a kilometer is how many meters?",
    askUnit: "km", scaleUnit: "m",
    rulerMin: 0, rulerMax: 1000, rulerStep: 100,
    answer: 500, difficulty: "medium",
    hint: "Half of 1000 = ?",
    explanation: "0.5 km = 500 m. Half of 1000 is 500!",
    conversionRule: "1 km = 1000 m",
    learnVisual: ["0.5 km", "× 1000 →", "500 m"]
  },
  {
    text: "1000 meters is equal to how many kilometers?",
    askUnit: "m", scaleUnit: "km",
    rulerMin: 0, rulerMax: 5, rulerStep: 1,
    answer: 1, difficulty: "easy",
    hint: "1000 m = 1 km!",
    explanation: "1000 meters = 1 kilometer.",
    conversionRule: "1000 m = 1 km",
    learnVisual: ["1000 m", "÷ 1000 →", "1 km"]
  },
  {
    text: "2000 meters is how many kilometers?",
    askUnit: "m", scaleUnit: "km",
    rulerMin: 0, rulerMax: 5, rulerStep: 1,
    answer: 2, difficulty: "easy",
    hint: "2000 ÷ 1000 = ?",
    explanation: "2000 m ÷ 1000 = 2 km.",
    conversionRule: "1000 m = 1 km",
    learnVisual: ["2000 m", "÷ 1000 →", "2 km"]
  },

  // ── Mixed / Decimal (2 questions) ──
  {
    text: "1.5 centimeters is how many millimeters?",
    askUnit: "cm", scaleUnit: "mm",
    rulerMin: 0, rulerMax: 20, rulerStep: 2,
    answer: 15, difficulty: "medium",
    hint: "1.5 × 10 = ?",
    explanation: "1.5 cm × 10 = 15 mm.",
    conversionRule: "1 cm = 10 mm",
    learnVisual: ["1.5 cm", "× 10 →", "15 mm"]
  },
  {
    text: "10 millimeters is equal to how many centimeters?",
    askUnit: "mm", scaleUnit: "cm",
    rulerMin: 0, rulerMax: 5, rulerStep: 1,
    answer: 1, difficulty: "easy",
    hint: "10 mm = 1 cm!",
    explanation: "10 millimeters equals exactly 1 centimeter.",
    conversionRule: "10 mm = 1 cm",
    learnVisual: ["10 mm", "=", "1 cm"]
  }
];

// LEVEL 2: WEIGHT — mg ↔ g ↔ kg
const LEVEL_2_QUESTIONS = [
  // ── mg ↔ g (4 questions) ──
  {
    text: "1 gram equals how many milligrams?",
    answer: 1000, difficulty: "easy", askUnit: 'g', scaleUnit: 'mg',
    explanation: "1 gram is exactly 1000 milligrams.",
    conversionRule: "1 g = 1000 mg",
    learnVisual: ["1 g", "=", "1000 mg"],
    targetLabel: "1 g", targetIcon: "💎"
  },
  {
    text: "Make 500 milligrams on the scale.",
    answer: 500, difficulty: "easy", askUnit: 'mg', scaleUnit: 'mg',
    explanation: "500 mg is exactly half a gram.",
    conversionRule: "1 g = 1000 mg",
    learnVisual: ["500 mg", "=", "0.5 g"],
    targetLabel: "500 mg", targetIcon: "🍓"
  },
  {
    text: "Convert 2 grams into milligrams using the scale!",
    answer: 2000, difficulty: "medium", askUnit: 'g', scaleUnit: 'mg',
    explanation: "2 g × 1000 = 2000 mg.",
    conversionRule: "1 g = 1000 mg",
    learnVisual: ["2 g", "× 1000 →", "2000 mg"],
    targetLabel: "2 g", targetIcon: "🍔"
  },
  {
    text: "How many milligrams in 1.5 g?",
    answer: 1500, difficulty: "medium", askUnit: 'g', scaleUnit: 'mg',
    explanation: "1.5 g = 1 g + 0.5 g = 1500 mg!",
    conversionRule: "1 g = 1000 mg",
    learnVisual: ["1.5 g", "× 1000 →", "1500 mg"],
    targetLabel: "1.5 g", targetIcon: "🍰"
  },

  // ── g ↔ kg (8 questions) ──
  {
    text: "1 kilogram equals how many grams? Set the scale!",
    answer: 1000, difficulty: "easy", askUnit: 'kg', scaleUnit: 'g',
    explanation: "1 kg is exactly 1000 grams.",
    conversionRule: "1 kg = 1000 g",
    learnVisual: ["1 kg", "=", "1000 g"],
    targetLabel: "1 kg", targetIcon: "📦"
  },
  {
    text: "Place weights to make 500 grams on the scale.",
    answer: 500, difficulty: "easy", askUnit: 'g', scaleUnit: 'g',
    explanation: "500 grams = 0.5 kg. That's half a kilogram!",
    conversionRule: "1 kg = 1000 g",
    learnVisual: ["500 g", "=", "0.5 kg"],
    targetLabel: "500 g", targetIcon: "🎁"
  },
  {
    text: "Set the scale to 100 grams.",
    answer: 100, difficulty: "easy", askUnit: 'g', scaleUnit: 'g',
    explanation: "100 g is one-tenth of a kilogram (0.1 kg).",
    conversionRule: "1 kg = 1000 g",
    learnVisual: ["100 g", "=", "0.1 kg"],
    targetLabel: "100 g", targetIcon: "🧁"
  },
  {
    text: "Convert 2 kg into grams using the scale!",
    answer: 2000, difficulty: "medium", askUnit: 'kg', scaleUnit: 'g',
    explanation: "2 kg × 1000 = 2000 grams.",
    conversionRule: "1 kg = 1000 g",
    learnVisual: ["2 kg", "× 1000 →", "2000 g"],
    targetLabel: "2 kg", targetIcon: "🎒"
  },
  {
    text: "Make 750 grams on the scale.",
    answer: 750, difficulty: "medium", askUnit: 'g', scaleUnit: 'g',
    explanation: "750 g = 0.75 kg. Try 500 + 100 + 100 + 50!",
    conversionRule: "1 kg = 1000 g",
    learnVisual: ["750 g", "=", "0.75 kg"],
    targetLabel: "750 g", targetIcon: "🍞"
  },
  {
    text: "Add weights to reach 1500 grams.",
    answer: 1500, difficulty: "medium", askUnit: 'g', scaleUnit: 'g',
    explanation: "1500 g = 1 kg + 500 g = 1.5 kg!",
    conversionRule: "1 kg = 1000 g",
    learnVisual: ["1500 g", "=", "1.5 kg"],
    targetLabel: "1.5 kg", targetIcon: "🍉"
  },
  {
    text: "How many grams in 2.5 kg? Set the scale!",
    answer: 2500, difficulty: "hard", askUnit: 'kg', scaleUnit: 'g',
    explanation: "2.5 kg × 1000 = 2500 g.",
    conversionRule: "1 kg = 1000 g",
    learnVisual: ["2.5 kg", "× 1000 →", "2500 g"],
    targetLabel: "2.5 kg", targetIcon: "🏀"
  },
  {
    text: "Balance 3 kg with gram weights!",
    answer: 3000, difficulty: "hard", askUnit: 'kg', scaleUnit: 'g',
    explanation: "3 kg = 3000 grams. Three thousand!",
    conversionRule: "1 kg = 1000 g",
    learnVisual: ["3 kg", "× 1000 →", "3000 g"],
    targetLabel: "3 kg", targetIcon: "🧳"
  }
];


// ─── GAME STATE ──────────────────────────────────────────
const State = {
  level: 1,
  questionIndex: 0,
  questions: [],
  attempts: 0,
  totalStars: 0,
  questionStars: [],
  correctCount: 0,
  hintUsed: false,

  // Level 1: ruler
  markerValue: null,
  markerPlaced: false,
  currentSubStep: 1,

  // Level 2: weights
  addedWeights: [],
  totalWeight: 0,

  reset() {
    this.questionIndex = 0;
    this.attempts = 0;
    this.totalStars = 0;
    this.questionStars = [];
    this.correctCount = 0;
    this.markerValue = null;
    this.markerPlaced = false;
    this.currentSubStep = 1;
    this.addedWeights = [];
    this.totalWeight = 0;
  }
};


// ─── DOM REFERENCES ──────────────────────────────────────
const $ = id => document.getElementById(id);

const DOM = {
  welcomeScreen:   $('welcome-screen'),
  gameScreen:      $('game-screen'),
  resultsScreen:   $('results-screen'),
  feedbackOverlay: $('feedback-overlay'),
  feedbackCard:    $('feedback-card'),

  // Top bar
  levelLabel:    $('level-label'),
  progressFill:  $('progress-fill'),
  progressText:  $('progress-text'),
  starTotal:     $('star-total'),

  // Activity
  activityTitle: $('activity-title'),

  // Question
  questionText:  $('question-text'),
  difficultyBadge: $('difficulty-badge'),
  guideAvatar:   $('guide-avatar'),

  // Ruler
  rulerContainer: $('ruler-container'),
  rulerTrack:     $('ruler-track'),
  rulerTicks:     $('ruler-ticks'),
  rulerMarker:    $('ruler-marker'),
  rulerValue:     $('ruler-value'),
  rulerUnitLabel: $('ruler-unit-label'),
  rulerHint:      $('ruler-hint'),
  rulerCorrectMarker: $('ruler-correct-marker'),
  rulerFill:      $('ruler-fill'),

  // Scale
  scaleContainer:    $('scale-container'),
  scaleValueDisplay: $('scale-value-display'),
  scaleHint:         $('scale-hint'),
  scaleBeam:         $('scale-beam'),
  leftPanItems:      $('left-pan-items'),
  leftPanLabel:      $('left-pan-label'),
  rightPanItems:     $('right-pan-items'),
  correctPanItems:   $('correct-pan-items'),
  rightPanLabel:     $('right-pan-label'),
  totalGrams:        $('total-grams'),
  weightChips:       $('weight-chips'),
  leftPan:           $('left-pan'),
  rightPan:          $('right-pan'),

  // Learning
  learningPanel: $('learning-panel'),
  learnText:     $('learn-text'),
  learnVisual:   $('learn-visual'),

  // Feedback
  feedbackIcon:    $('feedback-icon'),
  feedbackTitle:   $('feedback-title'),
  feedbackMessage: $('feedback-message'),
  feedbackStars:   $('feedback-stars'),
  feedbackExplanation: $('feedback-explanation'),
  feedbackExpText: $('feedback-exp-text'),

  // Results
  resultsTrophy:   $('results-trophy'),
  resultsTitle:    $('results-title'),
  resultsSubtitle: $('results-subtitle'),
  statCorrect:     $('stat-correct'),
  statTotalStars:  $('stat-total-stars'),
  statAccuracy:    $('stat-accuracy'),
  resultsStars:    $('results-stars'),
  badgesGrid:      $('badges-grid'),
  badgesSection:   $('badges-section'),

  scaleArea: $('scale-area')
};


// ─── SCREEN MANAGEMENT ──────────────────────────────────
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}


// ─── SHUFFLE ─────────────────────────────────────────────
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}


// ─── LEVEL START ─────────────────────────────────────────
function startLevel(level) {
  State.reset();
  State.level = level;

  // Shuffle questions for variety
  State.questions = level === 1
    ? shuffleArray(LEVEL_1_QUESTIONS)
    : [...LEVEL_2_QUESTIONS];

  // Setup UI
  DOM.gameScreen.className = `screen active ${level === 2 ? 'level-2' : ''}`;
  DOM.levelLabel.textContent = level === 1 ? 'Level 1: Length' : 'Level 2: Weight';
  DOM.activityTitle.textContent = level === 1 ? 'Length Conversion Challenge' : 'Weight Balance Challenge';

  // Show/hide weight controls
  const undoBtn = $('btn-undo-weight');
  const hintBtn = $('btn-hint');
  if (undoBtn) undoBtn.style.display = level === 2 ? '' : 'none';
  if (hintBtn) hintBtn.style.display = '';

  if (level === 1) {
    DOM.rulerContainer.style.display = 'flex';
    DOM.scaleContainer.style.display = 'none';
  } else {
    DOM.rulerContainer.style.display = 'none';
    DOM.scaleContainer.style.display = 'flex';
  }

  showScreen('game-screen');
  loadQuestion();
  SoundEngine.click();
}


// ─── LOAD QUESTION ───────────────────────────────────────
function loadQuestion() {
  const q = State.questions[State.questionIndex];
  if (!q) return endLevel();

  State.attempts = 0;
  State.hintUsed = false;
  State.markerValue = null;
  State.markerPlaced = false;
  State.addedWeights = [];
  State.totalWeight = 0;

  // Hide panels
  DOM.learningPanel.classList.remove('visible');
  DOM.scaleArea.classList.remove('glow-correct', 'shake-wrong');

  // Update question UI
  DOM.questionText.textContent = q.text;
  DOM.difficultyBadge.textContent = q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1);
  DOM.difficultyBadge.className = `difficulty-badge ${q.difficulty}`;

  // Guide reaction
  DOM.guideAvatar.textContent = '🤖';

  // Progress
  const total = State.questions.length;
  const pct = (State.questionIndex / total) * 100;
  DOM.progressFill.style.width = pct + '%';
  DOM.progressText.textContent = `${State.questionIndex + 1} / ${total}`;
  DOM.starTotal.textContent = State.totalStars;

  // Setup the appropriate scale
  if (State.level === 1) {
    setupRuler(q);
  } else {
    setupScale(q);
  }
}


// ─── RULER SETUP & INTERACTION (Level 1) ────────────────
function setupRuler(q) {
  DOM.rulerTicks.innerHTML = '';
  DOM.rulerMarker.style.left = '0%';
  DOM.rulerMarker.style.display = 'block';
  DOM.rulerMarker.classList.remove('snapping');
  DOM.rulerCorrectMarker.style.display = 'none';
  DOM.rulerHint.classList.remove('visible');
  DOM.rulerHint.textContent = '';
  DOM.rulerFill.style.width = '0%';
  DOM.rulerFill.style.transition = 'none';
  DOM.rulerValue.textContent = '↕ Drag the marker!';
  DOM.rulerValue.style.color = 'var(--primary)';

  const range = q.rulerMax - q.rulerMin;
  const step = q.rulerStep;

  // Calculate sub-step for finer control
  let subStep;
  if (step >= 100) subStep = step / 5;
  else if (step >= 10) subStep = step / 5;
  else if (step >= 5) subStep = step / 5;
  else if (step >= 2) subStep = 1;
  else subStep = step / 2;

  // Make sure subStep stays reasonable (at least 50 ticks, max ~100)
  let totalSubTicks = range / subStep;
  if (totalSubTicks > 100) subStep = range / 100;
  totalSubTicks = range / subStep;

  State.currentSubStep = subStep;

  // Determine number of major ticks
  const numMajorTicks = range / step;

  // Decide label interval (to avoid crowding)
  const isMobile = window.innerWidth <= 480;
  let labelEvery = 1;
  if (numMajorTicks > 15) labelEvery = 5;
  else if (numMajorTicks > 10) labelEvery = 2;
  if (isMobile && numMajorTicks > 8) labelEvery = Math.max(labelEvery, 2);
  if (isMobile && numMajorTicks > 12) labelEvery = Math.max(labelEvery, 5);

  // Generate ticks
  for (let i = 0; i <= totalSubTicks; i++) {
    const val = q.rulerMin + i * subStep;
    const pct = ((val - q.rulerMin) / range) * 100;

    const tick = document.createElement('div');

    // Check if this is a major tick
    const distFromMajor = (val - q.rulerMin) % step;
    const isMajor = Math.abs(distFromMajor) < 0.0001 || Math.abs(distFromMajor - step) < 0.0001;

    // Mid tick (halfway between majors)
    const distFromHalf = (val - q.rulerMin) % (step / 2);
    const isMid = !isMajor && step >= 4 &&
      (Math.abs(distFromHalf) < 0.0001 || Math.abs(distFromHalf - step/2) < 0.0001);

    tick.className = `ruler-tick ${isMajor ? 'major' : isMid ? 'mid' : 'minor'}`;
    tick.style.left = pct + '%';

    if (isMajor) {
      const majorIndex = Math.round((val - q.rulerMin) / step);
      if (majorIndex % labelEvery === 0) {
        const label = document.createElement('div');
        label.className = 'ruler-tick-label';
        // Show clean numbers
        label.textContent = Number.isInteger(val) ? val : val.toFixed(1);
        tick.appendChild(label);
      }
    }

    DOM.rulerTicks.appendChild(tick);
  }

  // Unit label
  DOM.rulerUnitLabel.textContent = '📏 Scale: ' + (UNIT_FULL_NAMES[q.scaleUnit] || q.scaleUnit);
  DOM.rulerHint.textContent = 'Hint: ' + (q.conversionRule || q.hint);

  // Remove old listeners then add new
  if (DOM.rulerTrack._cleanup) DOM.rulerTrack._cleanup();

  function getValueFromEvent(e) {
    const rect = DOM.rulerTrack.getBoundingClientRect();
    let clientX;
    if (e.touches) clientX = e.touches[0].clientX;
    else clientX = e.clientX;

    let pct = (clientX - rect.left) / rect.width;
    pct = Math.max(0, Math.min(1, pct));

    let val = q.rulerMin + pct * range;

    // Snap to nearest sub-step
    val = Math.round(val / subStep) * subStep;
    // Round to fix floating point
    val = Math.round(val * 1000) / 1000;
    val = Math.max(q.rulerMin, Math.min(q.rulerMax, val));

    return val;
  }

  function placeMarker(val) {
    State.markerValue = val;
    State.markerPlaced = true;

    const pct = ((val - q.rulerMin) / range) * 100;
    DOM.rulerMarker.style.left = pct + '%';
    DOM.rulerMarker.style.display = 'block';
    DOM.rulerFill.style.transition = 'width 0.12s ease';
    DOM.rulerFill.style.width = pct + '%';
    DOM.rulerMarker.classList.add('snapping');
    setTimeout(() => DOM.rulerMarker.classList.remove('snapping'), 200);

    // Show value with scale unit
    DOM.rulerValue.textContent = formatValue(val, q.scaleUnit);
    DOM.rulerValue.style.color = 'var(--primary)';

    SoundEngine.tick();
  }

  let dragging = false;

  function onStart(e) {
    e.preventDefault();
    e.stopPropagation();
    dragging = true;
    placeMarker(getValueFromEvent(e));
  }

  function onMove(e) {
    if (!dragging) return;
    e.preventDefault();
    placeMarker(getValueFromEvent(e));
  }

  function onEnd() { dragging = false; }

  DOM.rulerTrack.addEventListener('mousedown', onStart);
  DOM.rulerMarker.addEventListener('mousedown', onStart);
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onEnd);
  DOM.rulerTrack.addEventListener('touchstart', onStart, { passive: false });
  DOM.rulerMarker.addEventListener('touchstart', onStart, { passive: false });
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('touchend', onEnd);

  DOM.rulerTrack._cleanup = () => {
    DOM.rulerTrack.removeEventListener('mousedown', onStart);
    DOM.rulerMarker.removeEventListener('mousedown', onStart);
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onEnd);
    DOM.rulerTrack.removeEventListener('touchstart', onStart);
    DOM.rulerMarker.removeEventListener('touchstart', onStart);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onEnd);
  };
}


// ─── SCALE SETUP & INTERACTION (Level 2) ─────────────────
function setupScale(q) {
  State.addedWeights = [];
  State.totalWeight = 0;
  const su = q.scaleUnit || 'g';
  document.querySelectorAll('.weight-chip .chip-value').forEach(span => {
    const w = span.parentElement.dataset.weight;
    span.textContent = w + ' ' + su;
  });

  DOM.scaleValueDisplay.textContent = 'Add weights to match!';
  DOM.scaleValueDisplay.style.color = 'var(--primary)';
  DOM.scaleHint.classList.remove('visible');
  DOM.scaleHint.textContent = 'Hint: ' + (q.conversionRule || q.hint);
  DOM.totalGrams.textContent = '0 ' + su;
  DOM.rightPanItems.innerHTML = '';
  DOM.correctPanItems.innerHTML = '';
  DOM.correctPanItems.classList.remove('visible');
  DOM.rightPan.classList.remove('show-correct');
  DOM.rightPanLabel.textContent = 'Your weights: 0 ' + su;

  // Left pan - target
  DOM.leftPanItems.innerHTML = `<span class="pan-item">${q.targetIcon || '📦'}</span>`;
  DOM.leftPanLabel.textContent = q.targetLabel || q.answer + ' ' + su;

  // Hide conversion context (it's for ruler)
  if (DOM.conversionContext) DOM.conversionContext.style.display = 'none';

  // Reset beam
  updateBeamTilt();
  DOM.scaleArea.classList.remove('glow-correct', 'shake-wrong');
}

function addWeight(w) {
  State.addedWeights.push(w);
  State.totalWeight += w;
  updateWeightUI();
  SoundEngine.addWeight();
}

function removeLastWeight() {
  if (State.addedWeights.length === 0) return;
  const removed = State.addedWeights.pop();
  State.totalWeight -= removed;
  updateWeightUI();
  SoundEngine.click();
}

function clearWeights() {
  State.addedWeights = [];
  State.totalWeight = 0;
  updateWeightUI();
  SoundEngine.click();
}

function updateWeightUI() {
  const q = State.questions[State.questionIndex];
  const su = q ? (q.scaleUnit || 'g') : 'g';

  DOM.totalGrams.textContent = State.totalWeight + ' ' + su;
  DOM.rightPanLabel.textContent = 'Your weights: ' + State.totalWeight + ' ' + su;
  DOM.correctPanItems.innerHTML = '';
  DOM.correctPanItems.classList.remove('visible');
  DOM.rightPan.classList.remove('show-correct');
  DOM.scaleValueDisplay.style.color = 'var(--primary)';
  DOM.scaleValueDisplay.textContent = State.totalWeight > 0
    ? State.totalWeight + ' ' + su
    : 'Add weights to match!';

  const iconMap = { 1: '🪙', 5: '🫘', 10: '🍬', 50: '🍎', 100: '🧱', 500: '🏋️' };
  DOM.rightPanItems.innerHTML = '';

  const counts = {};
  State.addedWeights.forEach(w => { counts[w] = (counts[w] || 0) + 1; });

  Object.entries(counts).sort((a, b) => b[0] - a[0]).forEach(([w, c]) => {
    for (let i = 0; i < c; i++) {
      const span = document.createElement('span');
      span.className = 'pan-item';
      span.textContent = iconMap[w] || '📦';
      span.title = w + ' ' + su;
      DOM.rightPanItems.appendChild(span);
    }
  });

  updateBeamTilt();
}

function updateBeamTilt() {
  const q = State.questions[State.questionIndex];
  if (!q) return;

  const target = q.answer;
  const current = State.totalWeight;
  let diff = current - target;
  let maxDiff = Math.max(target, 1000);
  let tiltDeg = (diff / maxDiff) * 15;
  tiltDeg = Math.max(-15, Math.min(15, tiltDeg));

  DOM.scaleBeam.style.transform = `translateX(-50%) rotate(${tiltDeg}deg)`;
  const panOffset = tiltDeg * 2;
  DOM.leftPan.style.transform = `translateY(${-panOffset}px) rotate(${tiltDeg}deg)`;
  DOM.rightPan.style.transform = `translateY(${panOffset}px) rotate(${tiltDeg}deg)`;
}


// ─── SUBMIT ANSWER ───────────────────────────────────────
function showCorrectWeightPreview(q) {
  const su = q.scaleUnit || 'g';
  const iconMap = { 1: '🪙', 5: '🫙', 10: '🍬', 50: '🍎', 100: '🧱', 500: '🏋️' };
  const availableWeights = [500, 100, 50, 10, 5, 1];
  let remaining = q.answer;

  DOM.correctPanItems.innerHTML = '';

  availableWeights.forEach(w => {
    const count = Math.floor(remaining / w);
    remaining -= count * w;

    for (let i = 0; i < count; i++) {
      const span = document.createElement('span');
      span.className = 'pan-item correct-preview-item';
      span.textContent = iconMap[w] || '📦';
      span.title = w + ' ' + su;
      span.style.animationDelay = (DOM.correctPanItems.children.length * 0.08) + 's';
      DOM.correctPanItems.appendChild(span);
    }
  });

  DOM.rightPan.classList.add('show-correct');
  DOM.correctPanItems.classList.add('visible');
}

function submitAnswer() {
  const q = State.questions[State.questionIndex];
  if (!q) return;

  let playerAnswer;
  let isCorrect;

  if (State.level === 1) {
    if (!State.markerPlaced) {
      DOM.rulerTrack.classList.add('shake-wrong');
      setTimeout(() => DOM.rulerTrack.classList.remove('shake-wrong'), 500);
      DOM.guideAvatar.textContent = '🤔';
      DOM.rulerValue.textContent = '⬆️ Drag the marker first!';
      return;
    }
    playerAnswer = State.markerValue;
    // Use small tolerance for floating point safety
    const tol = State.currentSubStep * 0.6;
    isCorrect = Math.abs(playerAnswer - q.answer) <= tol;
  } else {
    if (State.totalWeight === 0) {
      DOM.scaleContainer.classList.add('shake-wrong');
      setTimeout(() => DOM.scaleContainer.classList.remove('shake-wrong'), 500);
      DOM.guideAvatar.textContent = '🤔';
      return;
    }
    playerAnswer = State.totalWeight;
    isCorrect = playerAnswer === q.answer;
  }

  State.attempts++;

  if (isCorrect) {
    handleCorrectAnswer(q);
  } else {
    handleWrongAnswer(q, playerAnswer);
  }
}


// ─── CORRECT ANSWER ──────────────────────────────────────
function handleCorrectAnswer(q) {
  SoundEngine.correct();

  // Stars
  let stars = 3;
  if (State.attempts === 2) stars = 2;
  else if (State.attempts >= 3) stars = 1;
  stars = Math.max(1, stars);

  State.questionStars.push(stars);
  State.totalStars += stars;
  State.correctCount++;
  DOM.starTotal.textContent = State.totalStars;

  // Visual feedback on scale
  if (State.level === 1) {
    const range = q.rulerMax - q.rulerMin;
    const pct = ((q.answer - q.rulerMin) / range) * 100;

    // Snap marker exactly to correct position
    DOM.rulerMarker.style.left = pct + '%';
    DOM.rulerValue.textContent = '✅ ' + formatValue(q.answer, q.scaleUnit);
    DOM.rulerValue.style.color = 'var(--success)';

    // Green fill animation up to correct value
    DOM.rulerFill.style.transition = 'width 0.6s ease';
    DOM.rulerFill.style.width = pct + '%';

    DOM.scaleArea.classList.add('glow-correct');
    setTimeout(() => DOM.scaleArea.classList.remove('glow-correct'), 1500);
  } else {
    DOM.scaleValueDisplay.textContent = '✅ ' + q.answer + ' ' + q.scaleUnit + ' — Balanced!';
    DOM.scaleValueDisplay.style.color = 'var(--success)';
    DOM.scaleBeam.style.transform = 'translateX(-50%) rotate(0deg)';
    DOM.leftPan.style.transform = 'translateY(0) rotate(0deg)';
    DOM.rightPan.style.transform = 'translateY(0) rotate(0deg)';
    DOM.scaleArea.classList.add('glow-correct');
    setTimeout(() => DOM.scaleArea.classList.remove('glow-correct'), 1500);
  }

  DOM.guideAvatar.textContent = '🎉';
  Confetti.fire();
  showFeedback(true, stars, q);
}


// ─── WRONG ANSWER ────────────────────────────────────────
function handleWrongAnswer(q, playerAnswer) {
  SoundEngine.wrong();
  DOM.guideAvatar.textContent = '😅';

  if (State.level === 1) {
    DOM.rulerTrack.classList.add('shake-wrong');
    setTimeout(() => DOM.rulerTrack.classList.remove('shake-wrong'), 500);
    DOM.rulerValue.textContent = '❌ ' + formatValue(playerAnswer, q.scaleUnit) + ' — not quite!';
    DOM.rulerValue.style.color = 'var(--error)';
  } else {
    DOM.scaleContainer.classList.add('shake-wrong');
    setTimeout(() => DOM.scaleContainer.classList.remove('shake-wrong'), 500);
    DOM.scaleValueDisplay.textContent = '❌ ' + playerAnswer + ' ' + q.scaleUnit + ' — not quite!';
    DOM.scaleValueDisplay.style.color = 'var(--error)';
  }

  // Highlight the correct answer on the scale visually
  showCorrectOnScale(q);

  if (State.level === 1) {
    DOM.rulerValue.textContent = '❌ Wrong answer';
    DOM.rulerValue.style.color = 'var(--error)';
  } else {
    DOM.scaleValueDisplay.textContent = '❌ Wrong answer';
    DOM.scaleValueDisplay.style.color = 'var(--error)';
  }
}

function showCorrectOnScale(q) {
  if (State.level === 1) {
    const range = q.rulerMax - q.rulerMin;
    const pct = ((q.answer - q.rulerMin) / range) * 100;

    // Show the correct marker
    DOM.rulerCorrectMarker.style.left = pct + '%';
    DOM.rulerCorrectMarker.style.display = 'block';

    // Animated green fill up to correct answer
    DOM.rulerFill.style.transition = 'width 1.2s ease';
    DOM.rulerFill.style.width = pct + '%';

    DOM.rulerValue.textContent = '✅ Correct: ' + formatValue(q.answer, q.scaleUnit);
    DOM.rulerValue.style.color = 'var(--success)';
  } else {
    DOM.scaleValueDisplay.textContent = '✅ Correct: ' + q.answer + ' ' + q.scaleUnit;
    showCorrectWeightPreview(q);
    DOM.scaleBeam.style.transform = 'translateX(-50%) rotate(0deg)';
    DOM.leftPan.style.transform = 'translateY(0) rotate(0deg)';
    DOM.rightPan.style.transform = 'translateY(0) rotate(0deg)';
  }
}


// ─── LEARNING PANEL ──────────────────────────────────────
function showLearningPanel(q) {
  DOM.learnText.textContent = q.explanation;

  if (q.learnVisual) {
    DOM.learnVisual.innerHTML = '';
    q.learnVisual.forEach((part, i) => {
      const span = document.createElement('span');
      if (i === 1) {
        span.className = 'learn-arrow';
        span.textContent = part;
      } else {
        span.textContent = part;
        span.style.fontWeight = '800';
        span.style.background = i === 0 ? '#E3F2FD' : '#E8F5E9';
        span.style.padding = '6px 14px';
        span.style.borderRadius = '10px';
        span.style.fontSize = '1rem';
      }
      DOM.learnVisual.appendChild(span);
    });
  }

  DOM.learningPanel.classList.add('visible');
}


// ─── FEEDBACK OVERLAY ────────────────────────────────────
function showFeedback(isCorrect, stars, q, isFinal = false) {
  DOM.feedbackOverlay.classList.add('active');

  if (isCorrect) {
    DOM.feedbackCard.className = 'feedback-card correct';
    DOM.feedbackIcon.textContent = '🎉';
    DOM.feedbackTitle.textContent = getCorrectPhrase();
    DOM.feedbackMessage.textContent = q.explanation;

    // Stars
    DOM.feedbackStars.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const span = document.createElement('span');
      span.className = `feedback-star ${i < stars ? 'earned' : 'empty'}`;
      span.textContent = '⭐';
      span.style.animationDelay = (i * 0.15) + 's';
      DOM.feedbackStars.appendChild(span);
      if (i < stars) setTimeout(() => SoundEngine.star(i), i * 150 + 300);
    }

    // Show conversion rule as a bonus fact
    DOM.feedbackExplanation.style.display = 'block';
    DOM.feedbackExpText.textContent = '📐 Remember: ' + (q.conversionRule || q.explanation);
    $('btn-next').textContent = State.questionIndex < State.questions.length - 1 ? 'Next →' : 'Finish 🏆';
  } else {
    DOM.feedbackCard.className = 'feedback-card wrong';
    DOM.feedbackIcon.textContent = isFinal ? '📖' : '🔄';
    DOM.feedbackTitle.textContent = isFinal ? "Let's Learn!" : getWrongPhrase();
    DOM.feedbackMessage.textContent = isFinal
      ? 'Here\'s the correct answer — study the visual!'
      : 'Try again! Check the learning visual below.';

    DOM.feedbackStars.innerHTML = '';

    if (isFinal) {
      DOM.feedbackExplanation.style.display = 'block';
      DOM.feedbackExpText.textContent = q.conversionRule + ' → ' + q.explanation;
      $('btn-next').textContent = State.questionIndex < State.questions.length - 1 ? 'Next →' : 'Finish 🏆';
    } else {
      DOM.feedbackExplanation.style.display = 'none';
      $('btn-next').textContent = 'Try Again 💪';
    }
  }

  DOM.feedbackOverlay._isCorrect = isCorrect;
  DOM.feedbackOverlay._isFinal = isFinal;
}

function closeFeedback() {
  DOM.feedbackOverlay.classList.remove('active');
  Confetti.clear();

  const wasCorrect = DOM.feedbackOverlay._isCorrect;
  const wasFinal = DOM.feedbackOverlay._isFinal;

  if (wasCorrect || wasFinal) {
    State.questionIndex++;
    if (DOM.rulerTrack._cleanup) DOM.rulerTrack._cleanup();
    if (State.questionIndex < State.questions.length) {
      loadQuestion();
    } else {
      endLevel();
    }
  }
  // else: wrong & not final — user retries
}




// ─── RESET ───────────────────────────────────────────────
function resetQuestion() {
  const q = State.questions[State.questionIndex];
  if (!q) return;

  if (State.level === 1) {
    State.markerValue = null;
    State.markerPlaced = false;
    State.hintUsed = false;
    DOM.rulerMarker.style.left = '0%';
    DOM.rulerMarker.style.display = 'block';
    DOM.rulerMarker.classList.remove('snapping');
    DOM.rulerCorrectMarker.style.display = 'none';
    DOM.rulerHint.classList.remove('visible');
    DOM.rulerFill.style.transition = 'none';
    DOM.rulerFill.style.width = '0%';
    DOM.rulerValue.textContent = '↕ Drag the marker!';
    DOM.rulerValue.style.color = 'var(--primary)';
  } else {
    clearWeights();
    DOM.scaleValueDisplay.textContent = 'Add weights to match!';
    DOM.scaleValueDisplay.style.color = 'var(--primary)';
    DOM.scaleHint.classList.remove('visible');
  }

  DOM.scaleArea.classList.remove('glow-correct', 'shake-wrong');
  DOM.guideAvatar.textContent = '🤖';
  SoundEngine.click();
}

function showHint() {
  const q = State.questions[State.questionIndex];
  if (!q) return;

  State.hintUsed = true;
  const hintText = 'Hint: ' + (q.conversionRule || q.hint);
  if (State.level === 1) {
    DOM.rulerHint.textContent = hintText;
    DOM.rulerHint.classList.add('visible');
  } else {
    DOM.scaleHint.textContent = hintText;
    DOM.scaleHint.classList.add('visible');
  }
  SoundEngine.click();
}


// ─── END LEVEL ───────────────────────────────────────────
function endLevel() {
  if (State.timerInterval) clearInterval(State.timerInterval);
  if (DOM.rulerTrack._cleanup) DOM.rulerTrack._cleanup();

  const total = State.questions.length;
  const correct = State.correctCount;
  const accuracy = Math.round((correct / total) * 100);
  const maxStars = total * 3;

  // Results UI
  DOM.statCorrect.textContent = correct + '/' + total;
  DOM.statTotalStars.textContent = State.totalStars;
  DOM.statAccuracy.textContent = accuracy + '%';

  // Overall stars (1-5)
  const fullStars = Math.min(5, Math.round((State.totalStars / maxStars) * 5));
  DOM.resultsStars.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const span = document.createElement('span');
    span.className = `star ${i < fullStars ? '' : 'empty'}`;
    span.textContent = '⭐';
    DOM.resultsStars.appendChild(span);
  }

  // Trophy
  if (accuracy >= 90) DOM.resultsTrophy.textContent = '🏆';
  else if (accuracy >= 70) DOM.resultsTrophy.textContent = '🥈';
  else if (accuracy >= 50) DOM.resultsTrophy.textContent = '🥉';
  else DOM.resultsTrophy.textContent = '💪';

  // Title
  if (accuracy >= 90) {
    DOM.resultsTitle.textContent = 'Outstanding!';
    DOM.resultsSubtitle.textContent = "You're a true Scale Master!";
  } else if (accuracy >= 70) {
    DOM.resultsTitle.textContent = 'Great Job!';
    DOM.resultsSubtitle.textContent = "You're getting really good at this!";
  } else if (accuracy >= 50) {
    DOM.resultsTitle.textContent = 'Good Effort!';
    DOM.resultsSubtitle.textContent = 'Practice makes perfect — keep going!';
  } else {
    DOM.resultsTitle.textContent = 'Keep Trying!';
    DOM.resultsSubtitle.textContent = 'Every attempt helps you learn. Try again!';
  }

  // Badges
  const badges = [];
  if (State.level === 1) {
    if (correct >= 1) badges.push({ icon: '📏', name: 'Ruler Rookie' });
    if (correct >= 6) badges.push({ icon: '📐', name: 'Measure Pro' });
    if (correct >= 12) badges.push({ icon: '🌟', name: 'Length Legend' });
    if (correct >= 16) badges.push({ icon: '🔬', name: 'Conversion Wizard' });
    if (accuracy === 100) badges.push({ icon: '👑', name: 'Perfect Ruler' });
  } else {
    if (correct >= 1) badges.push({ icon: '⚖️', name: 'Scale Starter' });
    if (correct >= 4) badges.push({ icon: '🔬', name: 'Weight Wizard' });
    if (correct >= 6) badges.push({ icon: '🏅', name: 'Scale Master' });
    if (accuracy === 100) badges.push({ icon: '💎', name: 'Perfect Balance' });
  }

  DOM.badgesGrid.innerHTML = '';
  if (badges.length > 0) {
    DOM.badgesSection.style.display = 'block';
    badges.forEach((b, i) => {
      const div = document.createElement('div');
      div.className = 'badge-item';
      div.style.animationDelay = (i * 0.15) + 's';
      div.innerHTML = `<span class="badge-icon">${b.icon}</span><span class="badge-name">${b.name}</span>`;
      DOM.badgesGrid.appendChild(div);
    });
    setTimeout(() => SoundEngine.badge(), 500);
  } else {
    DOM.badgesSection.style.display = 'none';
  }

  showScreen('results-screen');
  if (accuracy >= 70) setTimeout(() => Confetti.fire(80), 300);
}


// ─── PHRASES ─────────────────────────────────────────────
const CORRECT_PHRASES = [
  'Awesome!', 'Perfect!', 'Nailed it!', 'Brilliant!',
  'You got it!', 'Superb!', 'Excellent!', 'Spot on!'
];
const WRONG_PHRASES = [
  'Almost!', 'Not quite!', 'Close!', 'Try again!',
  'Oops!', 'So close!', 'Nearly there!', 'Keep going!'
];

function getCorrectPhrase() {
  return CORRECT_PHRASES[Math.floor(Math.random() * CORRECT_PHRASES.length)];
}
function getWrongPhrase() {
  return WRONG_PHRASES[Math.floor(Math.random() * WRONG_PHRASES.length)];
}


// ─── EVENT LISTENERS ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Level selection
  $('btn-level-1').addEventListener('click', () => startLevel(1));
  $('btn-level-2').addEventListener('click', () => startLevel(2));
  $('btn-level-1').addEventListener('keydown', e => { if (e.key === 'Enter') startLevel(1); });
  $('btn-level-2').addEventListener('keydown', e => { if (e.key === 'Enter') startLevel(2); });

  // Controls
  $('btn-submit').addEventListener('click', submitAnswer);
  $('btn-reset').addEventListener('click', resetQuestion);
  $('btn-hint').addEventListener('click', showHint);

  // Feedback
  $('btn-next').addEventListener('click', closeFeedback);

  // Back
  $('btn-back-home').addEventListener('click', () => {
    if (State.timerInterval) clearInterval(State.timerInterval);
    if (DOM.rulerTrack._cleanup) DOM.rulerTrack._cleanup();
    Confetti.clear();
    showScreen('welcome-screen');
  });

  // Weight chips
  document.querySelectorAll('.weight-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const w = parseInt(chip.dataset.weight);
      addWeight(w);
    });
  });

  // Undo last weight
  $('btn-undo-weight').addEventListener('click', () => {
    removeLastWeight();
    if (State.totalWeight === 0) {
      DOM.scaleValueDisplay.textContent = 'Add weights to match!';
    }
  });

  // Results buttons
  $('btn-play-again').addEventListener('click', () => startLevel(State.level));
  $('btn-home').addEventListener('click', () => {
    Confetti.clear();
    showScreen('welcome-screen');
  });

  // Close feedback by clicking outside (only if retrying)
  DOM.feedbackOverlay.addEventListener('click', (e) => {
    if (e.target === DOM.feedbackOverlay && !DOM.feedbackOverlay._isCorrect && !DOM.feedbackOverlay._isFinal) {
      DOM.feedbackOverlay.classList.remove('active');
    }
  });
});
