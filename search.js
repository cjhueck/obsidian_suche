const searchBox = document.getElementById("searchBox");
const resultsDiv = document.getElementById("results");
const distanceSelect = document.getElementById("distanceSelect");

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
  const pattern = new RegExp("(" + terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")", "gi");
  return text.replace(pattern, "<span class='highlight'>$1</span>");
}

function extractContext(entryText, terms, charsBefore = 100, charsAfter = 800) {
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

function atLeastThreeTermsWithinDistance(text, terms, maxDistance) {
  const words = text.toLowerCase().split(/\s+/);
  const termPositions = terms.map(term => {
    const positions = [];
    for (let i = 0; i < words.length; i++) {
      if (words[i].includes(term.toLowerCase())) {
        positions.push(i);
      }
    }
    return positions;
  });

  const validPositions = termPositions.filter(pos => pos.length > 0);
  if (validPositions.length < 3) return false;

  for (let i = 0; i < validPositions.length - 2; i++) {
    for (let j = i + 1; j < validPositions.length - 1; j++) {
      for (let k = j + 1; k < validPositions.length; k++) {
        for (let a of validPositions[i]) {
          for (let b of validPositions[j]) {
            for (let c of validPositions[k]) {
              const positions = [a, b, c].sort((x, y) => x - y);
              if (positions[2] - positions[0] <= maxDistance) {
                return true;
              }
            }
          }
        }
      }
    }
  }

  return false;
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

async function initSearch() {
  const entries = await loadChunks();

  searchBox.addEventListener("input", doSearch);
  distanceSelect.addEventListener("change", doSearch);

  function doSearch() {
    const query = searchBox.value.trim();
    if (!query) {
      resultsDiv.innerHTML = "";
      return;
    }

    const terms = query.toLowerCase().split(/\s+/);
    const maxDistance = parseInt(distanceSelect.value, 10);

    const filtered = entries.filter(entry =>
      atLeastThreeTermsWithinDistance(entry.text, terms, maxDistance)
    );

    resultsDiv.innerHTML = filtered.slice(0, 50).map(e => makeResult(e, terms)).join("");
  }
}

initSearch();