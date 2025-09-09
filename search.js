
const searchBox = document.getElementById("searchBox");
const resultsDiv = document.getElementById("results");
const proximitySelect = document.getElementById("proximity");

async function loadChunks() {
  const chunkList = [
    "chunks/3856c5ab.json",
    "chunks/1b339d69.json",
    "chunks/cd747a16.json"
  ];
  let allEntries = [];
  for (const file of chunkList) {
    try {
      const res = await fetch(file);
      const json = await res.json();
      allEntries = allEntries.concat(json);
    } catch (e) {
      console.error("Fehler beim Laden von", file, e);
    }
  }
  return allEntries;
}

function highlight(text, terms) {
  const pattern = new RegExp("(" + terms.map(t => t.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")).join("|") + ")", "gi");
  return text.replace(pattern, "<span class='highlight'>$1</span>");
}

function extractContext(entryText, terms, charsBefore = 200, charsAfter = 700) {
  const lowerText = entryText.toLowerCase();
  for (let term of terms) {
    const idx = lowerText.indexOf(term.toLowerCase());
    if (idx !== -1) {
      const start = Math.max(0, idx - charsBefore);
      const end = Math.min(entryText.length, idx + charsAfter);
      return entryText.slice(start, end) + "...";
    }
  }
  return entryText.slice(0, 900) + "...";
}

function makeResult(entry, terms) {
  const pubBase = "https://publish.obsidian.md/steiner-ga/";
  const link = `${pubBase}${entry.path}`;
  const context = extractContext(entry.text, terms);
  return `
    <div class="result">
      <strong><a href="${link}">${entry.title}</a></strong><br>
      ${highlight(context, terms)}
    </div>
  `;
}

function tokensWithinDistance(text, terms, maxDistance) {
  const tokens = text.toLowerCase().split(/\s+/);
  const positions = terms.map(term => []);

  tokens.forEach((token, index) => {
    terms.forEach((term, i) => {
      if (token.includes(term.toLowerCase())) positions[i].push(index);
    });
  });

  // Prüfe, ob es ein Set von Positionen gibt, die innerhalb von maxDistance liegen
  for (let i of positions[0]) {
    const rest = positions.slice(1);
    if (checkProximity(i, rest, maxDistance)) return true;
  }
  return false;
}

function checkProximity(start, remainingPositions, maxDistance) {
  if (remainingPositions.length === 0) return true;
  for (let pos of remainingPositions[0]) {
    if (Math.abs(pos - start) <= maxDistance) {
      if (checkProximity(pos, remainingPositions.slice(1), maxDistance)) {
        return true;
      }
    }
  }
  return false;
}

async function initSearch() {
  const entries = await loadChunks();

  searchBox.addEventListener("input", doSearch);
  proximitySelect.addEventListener("change", doSearch);

  function doSearch() {
    const query = searchBox.value.trim();
    const maxDistance = parseInt(proximitySelect.value, 10);
    if (!query) {
      resultsDiv.innerHTML = "";
      return;
    }
    const terms = query.toLowerCase().split(/\s+/);
    const filtered = entries.filter(entry => tokensWithinDistance(entry.text, terms, maxDistance));
    resultsDiv.innerHTML = filtered.slice(0, 50).map(e => makeResult(e, terms)).join("");
  }
}

initSearch();
