// ===== Screen switching =====
const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const winnerScreen = document.getElementById("winner-screen");

const startBtn = document.getElementById("start-btn");
const showWinnerBtn = document.getElementById("show-winner-btn");
const restartBtn = document.getElementById("restart-btn");
const resetBtn = document.getElementById("reset-game-btn");

function showScreen(screen) {
  [startScreen, gameScreen, winnerScreen].forEach(s => s.classList.remove("active"));
  screen.classList.add("active");
}

startBtn.addEventListener("click", () => showScreen(gameScreen));

restartBtn.addEventListener("click", () => {
  if (confirm("Restablecer todos los datos? (Se perderán los jugadores y sus puntos)")) {
    localStorage.removeItem("trivial_state");
    players = [];
    playerList.innerHTML = "";
    questionText.textContent = "";
    answerText.textContent = "";
    questionArea.classList.add("hidden");
    answerText.classList.add("hidden");
    showScreen(startScreen);
  }
});

// ===== Load questions =====
let questions = [];

fetch("questions.json")  // Updated path: questions.json is in the root folder, main.js is in src/
  .then(res => res.json())
  .then(data => {
    questions = data || [];
    console.log("Loaded questions:", questions.length);
  })
  .catch(err => console.error("Failed to load questions:", err));

// ===== Question panel =====
const showQuestionBtn = document.getElementById("show-question-btn");
const showAnswerBtn = document.getElementById("show-answer-btn");
const questionArea = document.getElementById("question-area");
const questionText = document.getElementById("question-text");
const answerText = document.getElementById("answer-text");
const categorySelect = document.getElementById("category-select");

let currentQuestion = null;
let currentAnswer = null;

showQuestionBtn.addEventListener("click", () => {
  if (questions.length === 0) {
    alert("No questions loaded.");
    return;
  }
  const selectedCategory = categorySelect.value;  // Get selected category
  const filteredQuestions = questions.filter(q => q.category === selectedCategory);
  if (filteredQuestions.length === 0) {
    alert(`No hay preguntas de la categoría: ${selectedCategory}`);
    return;
  }
  const randomIndex = Math.floor(Math.random() * filteredQuestions.length);
  currentQuestion = filteredQuestions[randomIndex].question;
  currentAnswer = filteredQuestions[randomIndex].answers[0];  // Assuming first answer is correct
  questionArea.classList.remove("hidden");
  questionText.textContent = currentQuestion;
  answerText.classList.add("hidden");
  saveState();
});

showAnswerBtn.addEventListener("click", () => {
  if (!currentAnswer) {
    alert("No question shown yet.");
    return;
  }
  answerText.textContent = `Respuesta: ${currentAnswer}`;
  answerText.classList.remove("hidden");
  saveState();
});

// ===== Timer =====
let timerInterval = null;
let timeRemaining = 0;
const timerCircle = document.getElementById("timer-progress");
const timerText = document.getElementById("timer-text");
const timerDurationInput = document.getElementById("timer-duration");
const startTimerBtn = document.getElementById("start-timer-btn");
const FULL_DASH_ARRAY = 283;

function startTimer() {
  clearInterval(timerInterval);
  const duration = parseInt(timerDurationInput.value, 10);
  if (isNaN(duration) || duration <= 0) return;
  timeRemaining = duration;
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timeRemaining--;
    updateTimerDisplay();
    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      timerText.textContent = "Time’s up!";
    }
  }, 1000);
}

function updateTimerDisplay() {
  timerText.textContent = timeRemaining;
  const ratio = timeRemaining / parseInt(timerDurationInput.value, 10);
  const progress = ratio * FULL_DASH_ARRAY;
  timerCircle.style.strokeDashoffset = FULL_DASH_ARRAY - progress;
  timerCircle.style.stroke = ratio > 0.5 ? "green" : ratio > 0.25 ? "orange" : "red";
}

startTimerBtn.addEventListener("click", startTimer);

// ===== Scoreboard =====
const addPlayerBtn = document.getElementById("add-player-btn");
const newPlayerName = document.getElementById("new-player-name");
const playerList = document.getElementById("player-list");

let players = [];
let categories = [];

// ===== Load categories and then render =====
fetch("categories.json")
  .then(res => res.json())
  .then(data => {
    categories = data.core || [];
    // console.log("Loaded categories:", categories);
    loadState();
    renderPlayers();
  })
  .catch(err => console.error("Failed to load categories:", err));

addPlayerBtn.addEventListener("click", () => {
  const name = newPlayerName.value.trim();
  if (!name) return;
  players.push(name);
  newPlayerName.value = "";
  renderPlayers();
  saveState();
});

// ===== Rendering =====
function renderPlayers() {
  playerList.innerHTML = "";

  if (categories.length === 0) {
    console.error("Cannot render players: Categories array is empty.");
    console.warn("No categories loaded, skipping render");
    return;
  }

  players.forEach((player, idx) => {
    const li = document.createElement("li");
    li.classList.add("player-entry");

    const nameSpan = document.createElement("span");
    nameSpan.textContent = player;

    const boxesContainer = document.createElement("div");
    boxesContainer.classList.add("player-boxes");

    categories.forEach(cat => {
      const box = document.createElement("div");
      box.classList.add("player-box");
      box.dataset.playerIndex = idx;
      box.dataset.category = cat.name;

      // set initial appearance from storage
      const initial = !!getBoxState(idx, cat.name);
      applyBoxStyle(box, cat.color, initial);

      // click handler: read current DOM state, compute new, persist, apply
      box.addEventListener("click", () => {
        const currentlyFilled = box.classList.contains("filled"); // read live
        const newState = !currentlyFilled;
        setBoxState(idx, cat.name, newState);    // persist
        applyBoxStyle(box, cat.color, newState); // update DOM immediately
        saveState();                              // optional: keep full state saved
      });

      boxesContainer.appendChild(box);
    });

    li.appendChild(nameSpan);
    li.appendChild(boxesContainer);
    playerList.appendChild(li);
  });

  console.log(document.querySelectorAll(".player-box").length, "boxes rendered");
}

function applyBoxStyle(box, color, filled) {
  if (filled) {
    box.classList.add("filled");
    box.style.backgroundColor = color;
    box.style.border = `2px solid ${color}`;
  } else {
    box.classList.remove("filled");
    box.style.backgroundColor = hexToPale(color, 0.25);
    box.style.border = `2px solid ${color}`;
  }
}

function hexToPale(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ===== Persistence =====
function saveState() {
  const state = {
    players,
    boxes: getAllBoxStates(),
    currentCategory: categorySelect.value,
    lastQuestion: currentQuestion,
    lastAnswer: currentAnswer,
    questionVisible: !questionArea.classList.contains("hidden"),
    answerVisible: !answerText.classList.contains("hidden")
  };
  localStorage.setItem("trivial_state", JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem("trivial_state");
  if (!saved) return;
  const state = JSON.parse(saved);
  players = state.players || [];
  categorySelect.value = state.currentCategory || "history";
  currentQuestion = state.lastQuestion || null;
  currentAnswer = state.lastAnswer || null;
  if (state.questionVisible) {
    questionArea.classList.remove("hidden");
    questionText.textContent = currentQuestion || "";
  }
  if (state.answerVisible) {
    answerText.classList.remove("hidden");
    answerText.textContent = currentAnswer ? `Answer: ${currentAnswer}` : "";
  }

  renderPlayers();
}

function getBoxState(playerIdx, catName) {
  const state = JSON.parse(localStorage.getItem("trivial_state") || "{}");
  return state.boxes?.[playerIdx]?.[catName] || false;
}

function setBoxState(playerIdx, catName, value) {
  const state = JSON.parse(localStorage.getItem("trivial_state") || "{}");
  if (!state.boxes) state.boxes = {};
  if (!state.boxes[playerIdx]) state.boxes[playerIdx] = {};
  state.boxes[playerIdx][catName] = value;
  localStorage.setItem("trivial_state", JSON.stringify(state));
}

function getAllBoxStates() {
  const boxes = {};
  players.forEach((_, idx) => {
    boxes[idx] = {};
    categories.forEach(cat => {
      boxes[idx][cat.name] = getBoxState(idx, cat.name);
    });
  });
  return boxes;
}

// ===== End Game =====
showWinnerBtn.addEventListener("click", () => {
  if (players.length === 0) {
    alert("No has añadido jugadores aún!");
    return;
  }
  const winner = prompt("Quién es el ganador?");
  document.getElementById("winner-name").textContent = winner || "No winner selected";
  showScreen(winnerScreen);
});

// ===== Reset Game =====
resetBtn.addEventListener("click", () => {
  if (confirm("Restablecer todos los datos? (Se perderán los jugadores y sus puntos)")) {
    localStorage.removeItem("trivial_state");
    players = [];
    playerList.innerHTML = "";
    questionText.textContent = "";
    answerText.textContent = "";
    questionArea.classList.add("hidden");
    answerText.classList.add("hidden");
    showScreen(startScreen);
  }
});

window.addEventListener("beforeunload", saveState);
