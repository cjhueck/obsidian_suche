const searchBox = document.getElementById("searchBox");
const resultsDiv = document.getElementById("results");

// Lade alle JSON-Chunks dynamisch
async function loadChunks() {
  const chunkList = [
    // Liste der Dateien im chunks/-Ordner (wird automatisch aufgebaut)
    "3856c5ab.json", "1b339d69.json", "cd747a16.json", "229ea8c5.json", "b895e271.json",
    // Füge hier alle weiteren Chunk-Dateien ein
  ];

  let allEntries = [];

  for (const file of chunkList) {
    try {
      const res = await fetch(`chunks/${file}`);
      const json = await res.json();
      allEntries = allEntries.concat(json);
    } catch (e) {
      console.error("Fehler beim Laden von", file, e);
    }
  }

  return allEntries;
}

function highlight(text, terms) {
  const pattern = new RegExp("(" + terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join("|") + ")", "gi");
  return text.replace(pattern, "<span class='highlight'>$1</span>");
}

function makeResult(entry, terms) {
  const pubBase = "https://publish.obsidian.md/steiner-ga/";
  const link = `${pubBase}${entry.path}`;

  return `
    <div class="result">
      <strong><a href="${link}" target="_blank">${entry.title}</a></strong><br>
      ${highlight(entry.text.slice(0, 300) + "...", terms)}
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
