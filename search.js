const searchBox = document.getElementById("searchBox");
const resultsDiv = document.getElementById("results");

async function loadChunks() {
  const chunkList = [
    // ⚠️ HIER chunk-Dateien manuell eintragen, z. B.:
    "chunks/3856c5ab.json",
    "chunks/1b339d69.json",
    "chunks/cd747a16.json"
    // usw.
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

function extractContext(entryText, terms, charsBefore = 300, charsAfter = 700) {
  const lowerText = entryText.toLowerCase();
  for (let term of terms) {
    const idx = lowerText.indexOf(term.toLowerCase());
    if (idx !== -1) {
      const start = Math.max(0, idx - charsBefore);
      const end = Math.min(entryText.length, idx + charsAfter);
      return entryText.slice(start, end) + "...";
    }
  }
  return entryText.slice(0, 700) + "...";
}

function makeResult(entry, terms) {
  const pubBase = "https://publish.obsidian.md/steiner-ga/";
  const link = `${pubBase}${entry.path}`;

  const context = extractContext(entry.text, terms);

  return `
    <div class="result">
      <strong><a href="${link}" target="_blank">${entry.title}</a></strong><br>
      ${highlight(context, terms)}
    </div>
  `;
}

async function initSearch() {
  const entries = await loadChunks();

  searchBox.addEventListener("input", () => {
    const query = searchBox.value.trim();
    if (!query) {
      resultsDiv.innerHTML = "";
      return;
    }

    const terms = query.toLowerCase().split(/\s+/);
    const filtered = entries.filter(entry =>
      terms.every(term => entry.text.toLowerCase().includes(term))
    );

    resultsDiv.innerHTML = filtered.slice(0, 50).map(e => makeResult(e, terms)).join("");
  });
}

initSearch();
