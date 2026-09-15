const initialFiles = [
  { name: "Projects", kind: "folder", description: "12 items", updated: "2 min ago", starred: true },
  { name: "Design notes.md", kind: "doc", description: "Markdown file", updated: "Today, 10:42 AM", starred: true, content: "# Design notes\n\nKeep the interface calm, quick, and useful.\n" },
  { name: "roadmap.txt", kind: "doc", description: "Plain text", updated: "Yesterday", content: "Ship the terminal-first workflow.\nInvite the first testers.\n" },
  { name: "Budget 2024.xlsx", kind: "sheet", description: "Spreadsheet", updated: "Sep 12, 2024" },
  { name: "portfolio", kind: "folder", description: "8 items", updated: "Sep 11, 2024" },
  { name: "config.json", kind: "code", description: "JSON file", updated: "Sep 09, 2024", content: '{\n  "theme": "calm",\n  "terminal": true\n}\n' },
  { name: "Headshot final.png", kind: "image", description: "PNG image", updated: "Sep 07, 2024" },
  { name: "ideas.md", kind: "doc", description: "Markdown file", updated: "Sep 05, 2024", content: "# Ideas\n\n- Share files from the terminal\n- Add team workspaces\n" },
];

const state = {
  files: loadFiles(),
  view: "My files",
  layout: "grid",
  sort: "Last modified",
};

const fileGrid = document.querySelector("#file-grid");
const emptyState = document.querySelector("#empty-state");
const searchInput = document.querySelector("#search-input");
const terminalPanel = document.querySelector("#terminal-panel");
const terminalOutput = document.querySelector("#terminal-output");
const terminalInput = document.querySelector("#terminal-input");
const modalBackdrop = document.querySelector("#modal-backdrop");
const toast = document.querySelector("#toast");

function loadFiles() {
  try {
    const saved = window.localStorage.getItem("terminsave-files");
    return saved ? JSON.parse(saved) : initialFiles.map((file) => ({ ...file }));
  } catch {
    return initialFiles.map((file) => ({ ...file }));
  }
}

function persistFiles() {
  window.localStorage.setItem("terminsave-files", JSON.stringify(state.files));
}

function iconFor(kind) {
  return { folder: "~", doc: "_", sheet: "#", code: "</>", image: "img" }[kind] || "_";
}

function visibleFiles() {
  const query = searchInput.value.trim().toLowerCase();
  let files = state.files.filter((file) => {
    if (state.view === "Starred" && !file.starred) return false;
    if (state.view === "Trash" && !file.trashed) return false;
    if (state.view !== "Trash" && file.trashed) return false;
    if (state.view === "Recent" && file.updated.includes("2024")) return false;
    return !query || `${file.name} ${file.description}`.toLowerCase().includes(query);
  });
  if (state.sort === "Name") files.sort((a, b) => a.name.localeCompare(b.name));
  return files;
}

function renderFiles() {
  const files = visibleFiles();
  fileGrid.classList.toggle("list-layout", state.layout === "list");
  fileGrid.innerHTML = files.map((file) => `
    <article class="file-card" data-name="${escapeAttribute(file.name)}" data-kind="${file.kind}" tabindex="0">
      <div class="file-top">
        <span class="file-type ${file.kind}">${iconFor(file.kind)}</span>
        <button class="file-menu" type="button" data-action="menu" aria-label="More actions">...</button>
      </div>
      <div class="file-meta">
        <strong class="file-name">${escapeHtml(file.name)}</strong>
        <p class="file-description">${escapeHtml(file.description)}</p>
        <span class="file-updated">${escapeHtml(file.updated)}</span>
      </div>
    </article>
  `).join("");
  emptyState.classList.toggle("hidden", files.length > 0);
  fileGrid.classList.toggle("hidden", files.length === 0);
  document.querySelector("#section-count").textContent = `${files.length} item${files.length === 1 ? "" : "s"}`;
  document.querySelector("#file-count").textContent = state.files.filter((file) => file.kind !== "folder" && !file.trashed).length;
  document.querySelector("#folder-count").textContent = state.files.filter((file) => file.kind === "folder" && !file.trashed).length;
}

function renderActivity() {
  const activities = [
    ["_", "You edited", "Design notes.md", "2 min ago"],
    ["~", "You opened", "Projects", "1 hour ago"],
    ["+", "You created", "ideas.md", "Yesterday"],
  ];
  document.querySelector("#activity-list").innerHTML = activities.map(([icon, verb, item, time]) => `
    <div class="activity-row">
      <span class="activity-dot">${icon}</span>
      <span class="activity-text">${verb} <strong>${item}</strong></span>
      <span class="activity-time">${time}</span>
    </div>
  `).join("");
}

function openTerminal() {
  terminalPanel.classList.add("open");
  terminalPanel.setAttribute("aria-hidden", "false");
  terminalInput.focus();
}

function closeTerminal() {
  terminalPanel.classList.remove("open");
  terminalPanel.setAttribute("aria-hidden", "true");
}

function printTerminal(text, type = "output") {
  const line = document.createElement("div");
  line.className = `terminal-line ${type}`;
  line.textContent = text;
  terminalOutput.appendChild(line);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function runCommand(rawCommand) {
  const command = rawCommand.trim();
  if (!command) return;
  printTerminal(`prodomain4@terminsave:~$ ${command}`, "command");
  const [verb, ...args] = command.split(" ");
  const rest = args.join(" ").trim();
  const target = args[0];
  switch (verb.toLowerCase()) {
    case "help":
      printTerminal("Commands: ls, pwd, cat <file>, touch <file>, mkdir <folder>, write <file> <text>, append <file> <text>, rm <file>, clear");
      break;
    case "ls":
      printTerminal(state.files.filter((file) => !file.trashed).map((file) => file.kind === "folder" ? `${file.name}/` : file.name).join("  ") || "(empty)");
      break;
    case "pwd":
      printTerminal("/workspace");
      break;
    case "cat": {
      const file = findFile(target);
      if (!file) printTerminal(`cat: ${target || "(missing file)"}: No such file`, "error");
      else if (file.kind === "folder") printTerminal(`cat: ${file.name}: Is a directory`, "error");
      else printTerminal(file.content || `${file.name} has no text content.`);
      break;
    }
    case "touch":
      if (!target) printTerminal("touch: missing file operand", "error");
      else createFile(target);
      break;
    case "mkdir":
      if (!target) printTerminal("mkdir: missing operand", "error");
      else createFolder(target);
      break;
    case "write":
      writeFile(target, args.slice(1).join(" "), false);
      break;
    case "append":
      writeFile(target, args.slice(1).join(" "), true);
      break;
    case "rm":
      removeFile(target);
      break;
    case "clear":
      terminalOutput.innerHTML = "";
      break;
    default:
      printTerminal(`${verb}: command not found. Type "help" to see available commands.`, "error");
  }
  renderFiles();
}

function findFile(name) {
  return state.files.find((file) => file.name === name && !file.trashed);
}

function createFile(name) {
  if (findFile(name)) return printTerminal(`touch: ${name}: File exists`, "error");
  state.files.unshift({ name, kind: "doc", description: "Plain text", updated: "Just now", content: "" });
  persistFiles();
  printTerminal(`Created ${name}`);
  showToast(`Created ${name}`);
}

function createFolder(name) {
  if (findFile(name)) return printTerminal(`mkdir: ${name}: File exists`, "error");
  state.files.unshift({ name, kind: "folder", description: "0 items", updated: "Just now" });
  persistFiles();
  printTerminal(`Created directory ${name}/`);
  showToast(`Created ${name}`);
}

function writeFile(name, content, append) {
  if (!name) return printTerminal(`${append ? "append" : "write"}: missing file operand`, "error");
  const file = findFile(name);
  if (!file) return printTerminal(`${append ? "append" : "write"}: ${name}: No such file`, "error");
  if (file.kind === "folder") return printTerminal(`${name}: Is a directory`, "error");
  file.content = append ? `${file.content || ""}${content}\n` : `${content}\n`;
  file.updated = "Just now";
  persistFiles();
  printTerminal(`Updated ${name}`);
  showToast(`Saved ${name}`);
}

function removeFile(name) {
  const file = findFile(name);
  if (!file) return printTerminal(`rm: ${name || "(missing file)"}: No such file`, "error");
  file.trashed = true;
  persistFiles();
  printTerminal(`Moved ${name} to trash`);
  showToast(`Moved ${name} to trash`);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove("show"), 2200);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

document.querySelector("#terminal-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const command = terminalInput.value;
  terminalInput.value = "";
  runCommand(command);
});

document.querySelector("#terminal-button").addEventListener("click", openTerminal);
document.querySelector("#tip-terminal-button").addEventListener("click", openTerminal);
document.querySelector("#close-terminal").addEventListener("click", closeTerminal);
document.querySelector("#clear-terminal").addEventListener("click", () => { terminalOutput.innerHTML = ""; terminalInput.focus(); });
document.querySelector("#upload-button").addEventListener("click", () => showToast("Uploads are coming soon - try the terminal for now."));
document.querySelector("#upgrade-button").addEventListener("click", () => showToast("You are on the generous free plan."));
document.querySelector("#notifications-button").addEventListener("click", () => showToast("You are all caught up."));
document.querySelector("#activity-button").addEventListener("click", () => showToast("Activity history is up to date."));

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.view = button.dataset.view;
    document.querySelector("#view-title").textContent = state.view;
    document.querySelector("#section-title").textContent = state.view === "My files" ? "Your files" : state.view;
    renderFiles();
  });
});

document.querySelectorAll(".view-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".view-toggle").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.layout = button.dataset.layout;
    renderFiles();
  });
});

document.querySelector("#sort-button").addEventListener("click", () => {
  state.sort = state.sort === "Last modified" ? "Name" : "Last modified";
  document.querySelector("#sort-button").innerHTML = `${state.sort} <span>v</span>`;
  renderFiles();
});

searchInput.addEventListener("input", renderFiles);
document.querySelector("#new-button").addEventListener("click", () => modalBackdrop.classList.remove("hidden"));
document.querySelector("#modal-close").addEventListener("click", () => modalBackdrop.classList.add("hidden"));
modalBackdrop.addEventListener("click", (event) => { if (event.target === modalBackdrop) modalBackdrop.classList.add("hidden"); });
document.querySelectorAll("[data-new-type]").forEach((button) => {
  button.addEventListener("click", () => {
    const type = button.dataset.newType;
    const name = window.prompt(`Name your new ${type}:`);
    if (!name) return;
    type === "folder" ? createFolder(name) : createFile(name);
    modalBackdrop.classList.add("hidden");
    renderFiles();
  });
});

fileGrid.addEventListener("click", (event) => {
  const card = event.target.closest(".file-card");
  if (!card || event.target.closest("[data-action='menu']")) return;
  const file = findFile(card.dataset.name);
  if (!file) return;
  if (file.kind === "folder") {
    showToast(`${file.name} is ready to browse.`);
    return;
  }
  openTerminal();
  printTerminal(`Opened ${file.name}`);
  printTerminal(file.content || `${file.name} has no text content.`);
});

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    searchInput.focus();
  }
  if (event.key.toLowerCase() === "n" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
    modalBackdrop.classList.remove("hidden");
  }
  if (event.key === "Escape") {
    modalBackdrop.classList.add("hidden");
    closeTerminal();
  }
});

printTerminal('Welcome to Terminsave. Type "help" to get started.');
renderFiles();
renderActivity();
