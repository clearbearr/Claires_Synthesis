
console.log("Page Loading...");


const SITE_NAME = "The Shiny Shokoto Files";
const STORAGE_KEY = "shokotoVotes";
let isDark = false;

console.log("typeof SITE_NAME:", typeof SITE_NAME);
console.log("typeof isDark:", typeof isDark);

const labels = {
  yes: "Absolutely, let it shine",
  no: "Absolutely not",
  depends: "Depends on the occasion",
};
const options = ["yes", "no", "depends"];


function loadVotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { yes: 0, no: 0, depends: 0 };
  } catch (err) {
    console.log("Could not read saved votes:", err.message);
    return { yes: 0, no: 0, depends: 0 };
  }
}

function saveVotes(votes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(votes));
  } catch (err) {
    console.log("Could not save votes:", err.message);
  }
}

function totalVotes(votes) {
  let sum = 0;
  for (let i = 0; i < options.length; i++) {
    sum += votes[options[i]];
  }
  return sum;
}

function confidenceLabel(score) {
  
  const n = Number(score);
  if (Number.isNaN(n) || n < 1 || n > 10) {
    return "unknown";
  } else if (n >= 8) {
    return "strong opinion";
  } else if (n >= 4) {
    return "fairly sure";
  }
  return "still deciding";
}

function setupTheme() {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;

  isDark = localStorage.getItem("shokotoDark") === "true";
  document.body.classList.toggle("dark", isDark);
  btn.textContent = isDark ? "Light mode" : "Dark mode";

  btn.addEventListener("click", () => {
    isDark = !isDark;
    document.body.classList.toggle("dark", isDark);
    btn.textContent = isDark ? "Light mode" : "Dark mode";
    localStorage.setItem("shokotoDark", String(isDark));
  });
}

function highlightActiveNav() {
  const links = document.querySelectorAll("nav a");
  const here = location.pathname.split("/").pop() || "index.html";
  links.forEach((link) => {
    if (link.getAttribute("href") === here) {
      link.classList.add("active");
    }
  });
}

function setFooterYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
}


function renderResults() {
  const votes = loadVotes();
  const total = totalVotes(votes);

  const countEl = document.getElementById("voteCount");
  if (countEl) countEl.textContent = total;

  const box = document.getElementById("results");
  if (!box) return;
  box.innerHTML = "";

  if (total === 0) {
    box.textContent = "No votes yet. Be the first to settle it.";
    return;
  }

  let leader = options[0];
  for (let i = 0; i < options.length; i++) {
    const key = options[i];
    const pct = Math.round((votes[key] / total) * 100);
    if (votes[key] > votes[leader]) leader = key;

    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML =
      `<span>${labels[key]}: ${votes[key]} vote${votes[key] === 1 ? "" : "s"} (${pct}%)</span>` +
      `<div class="bar-track"><div class="bar-fill" style="--pct:${pct}"></div></div>`;
    box.appendChild(row);
  }

  const note = document.createElement("p");
  note.innerHTML = `Currently leading: <strong>${labels[leader]}</strong>`;
  box.appendChild(note);
}


function setupVoteForm() {
  const form = document.getElementById("voteForm");
  if (!form) return;

  const comment = document.getElementById("comment");
  const counter = document.getElementById("charCounter");
  const errorBox = document.getElementById("formError");
  const thanks = document.getElementById("thanks");

  function updateCounter() {
    counter.textContent = `${comment.maxLength - comment.value.length} characters remaining`;
  }
  comment.addEventListener("input", updateCounter);
  updateCounter();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    errorBox.textContent = "";
    thanks.textContent = "";

    if (!form.reportValidity()) {
      errorBox.textContent = "Please fix the highlighted fields and try again.";
      return;
    }

    const data = new FormData(form);
    const verdict = data.get("verdict");
    const name = data.get("voterName") || "Anonymous";
    const confidence = data.get("confidence");

    const votes = loadVotes();
    votes[verdict] += 1;
    saveVotes(votes);

    thanks.textContent =
      `Thanks, ${name}! Vote counted (${confidenceLabel(confidence)}).`;

    renderResults();
    form.reset();
    updateCounter();
  });

  const clearBtn = document.getElementById("clearVotes");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (confirm("Reset the whole poll back to zero?")) {
        saveVotes({ yes: 0, no: 0, depends: 0 });
        renderResults();
      }
    });
  }
}


function setupTableFilter() {
  const input = document.getElementById("tableFilter");
  const rows = document.querySelectorAll("#argTable tbody tr");
  if (!input || rows.length === 0) return;

  input.addEventListener("input", () => {
    const term = input.value.trim().toLowerCase();
    let shown = 0;
    rows.forEach((row) => {
      const match = row.textContent.toLowerCase().includes(term);
      row.hidden = !match;
      if (match) shown++;
    });
    const status = document.getElementById("filterStatus");
    status.textContent = shown === 0 ? "No arguments match that search." : `${shown} argument(s) showing.`;
  });
}


setupTheme();
highlightActiveNav();
setFooterYear();
renderResults();
setupVoteForm();
setupTableFilter();
