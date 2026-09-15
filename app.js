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

const initialMessages = [
  { id: 1, sender: "Maya Chen", initials: "MC", email: "maya@northstar.studio", subject: "The latest workspace mockups", preview: "I dropped the new flow into Projects. The terminal panel feels especially good now.", body: "I dropped the new flow into Projects. The terminal panel feels especially good now.\n\nWould love your eyes on the handoff states when you have a minute.", time: "9:42 AM", unread: true, color: "coral" },
  { id: 2, sender: "Terminsave team", initials: "TS", email: "updates@terminsave.app", subject: "Your workspace is ready", preview: "Everything is set up. Start by creating a file or opening the terminal.", body: "Everything is set up. Start by creating a file or opening the terminal.\n\nYour workspace is private by default, and changes are saved locally in this prototype.", time: "Yesterday", unread: true, color: "green" },
  { id: 3, sender: "Alex Rivera", initials: "AR", email: "alex@orbit.dev", subject: "Quick question about roadmap.txt", preview: "Are we still aiming to invite the first testers this week?", body: "Are we still aiming to invite the first testers this week? I can help prepare the first invite list.", time: "Sep 14", unread: true, color: "blue" },
  { id: 4, sender: "You", initials: "PD", email: "prodomain4@terminsave.app", subject: "Re: terminal-first workflow", preview: "Ship the terminal-first workflow.", body: "Ship the terminal-first workflow.\nInvite the first testers.", time: "Sep 12", unread: false, color: "purple" },
];

const state = {
  files: loadFiles(),
  messages: loadMessages(),
  activeMessageId: null,
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
const youtubePlayer = document.querySelector("#youtube-player");
const youtubeFrame = document.querySelector("#youtube-frame");
const modalBackdrop = document.querySelector("#modal-backdrop");
const composerBackdrop = document.querySelector("#composer-backdrop");
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

function loadMessages() {
  try {
    const saved = window.localStorage.getItem("terminsave-messages");
    return saved ? JSON.parse(saved) : initialMessages.map((message) => ({ ...message }));
  } catch {
    return initialMessages.map((message) => ({ ...message }));
  }
}

function persistMessages() {
  window.localStorage.setItem("terminsave-messages", JSON.stringify(state.messages));
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
        <button class="file-menu" type="button" data-action="edit" aria-label="Edit in terminal">...</button>
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

function renderInbox() {
  const query = searchInput.value.trim().toLowerCase();
  const messages = state.messages.filter((message) => `${message.sender} ${message.subject} ${message.preview}`.toLowerCase().includes(query));
  const unreadCount = state.messages.filter((message) => message.unread).length;
  document.querySelector("#inbox-badge").textContent = unreadCount;
  document.querySelector("#inbox-badge").classList.toggle("hidden", unreadCount === 0);
  document.querySelector("#inbox-count").textContent = `${unreadCount} unread`;
  document.querySelector("#message-list").innerHTML = messages.length ? messages.map((message) => `
    <button class="message-row ${message.unread ? "unread" : ""} ${state.activeMessageId === message.id ? "selected" : ""}" data-message-id="${message.id}" type="button">
      <span class="message-avatar ${message.color}">${message.initials}</span>
      <span class="message-copy"><strong>${escapeHtml(message.sender)}</strong><b>${escapeHtml(message.subject)}</b><small>${escapeHtml(message.preview)}</small></span>
      <time>${escapeHtml(message.time)}</time>
    </button>
  `).join("") : `<div class="inbox-empty"><span>@</span><strong>No messages found</strong><p>Try a different search.</p></div>`;

  const activeMessage = state.messages.find((message) => message.id === state.activeMessageId);
  document.querySelector("#message-view").innerHTML = activeMessage ? `
    <div class="message-view-header"><div><p class="eyebrow">MESSAGE</p><h2>${escapeHtml(activeMessage.subject)}</h2></div><button type="button" class="message-action" data-action="toggle-read">${activeMessage.unread ? "Mark read" : "Mark unread"}</button></div>
    <div class="sender-line"><span class="message-avatar ${activeMessage.color}">${activeMessage.initials}</span><div><strong>${escapeHtml(activeMessage.sender)}</strong><small>${escapeHtml(activeMessage.email)}</small></div><time>${escapeHtml(activeMessage.time)}</time></div>
    <div class="message-body">${escapeHtml(activeMessage.body).replace(/\n/g, "<br><br>")}</div>
    <button class="reply-button" id="reply-button" type="button">Reply <span>-&gt;</span></button>
  ` : `<div class="message-placeholder"><span>@</span><strong>Select a message</strong><p>Open a conversation to read it here.</p></div>`;
}

function openComposer(replyTo = null) {
  document.querySelector("#composer-title").textContent = replyTo ? `Reply to ${replyTo.sender}` : "Compose";
  document.querySelector("#composer-to").value = replyTo ? replyTo.email : "";
  document.querySelector("#composer-subject").value = replyTo ? `Re: ${replyTo.subject.replace(/^Re:\s*/i, "")}` : "";
  document.querySelector("#composer-body").value = replyTo ? `\n\n--- Original message ---\n${replyTo.body}` : "";
  composerBackdrop.classList.remove("hidden");
  document.querySelector("#composer-to").focus();
}

function closeComposer() {
  composerBackdrop.classList.add("hidden");
}

function sendMessage(event) {
  event.preventDefault();
  const recipient = document.querySelector("#composer-to").value.trim();
  const subject = document.querySelector("#composer-subject").value.trim();
  const body = document.querySelector("#composer-body").value.trim();
  if (!recipient || !subject || !body) return;
  const message = { id: Date.now(), sender: "You", initials: "PD", email: recipient, subject, preview: body, body, time: "Just now", unread: false, color: "purple" };
  state.messages.unshift(message);
  state.activeMessageId = message.id;
  persistMessages();
  closeComposer();
  renderInbox();
  showToast("Message sent. Waiting for a reply...");
  simulateReply(message, recipient);
}

function simulateReply(sentMessage, recipient) {
  const recipientName = recipient.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  window.setTimeout(() => {
    const reply = {
      id: Date.now(),
      sender: recipientName || "Workspace contact",
      initials: (recipientName || "WC").split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase(),
      email: recipient,
      subject: sentMessage.subject,
      preview: `Thanks for your note about ${sentMessage.subject.toLowerCase()}.`,
      body: `Thanks for your note about ${sentMessage.subject.toLowerCase()}.\n\nI got it and will take a closer look. Let’s keep the conversation going here.`,
      time: "Just now",
      unread: true,
      color: "blue",
    };
    state.messages.unshift(reply);
    state.activeMessageId = reply.id;
    persistMessages();
    renderInbox();
    showToast(`${reply.sender} replied`);
  }, 1200);
}

function fileKind(name) {
  const extension = name.split(".").pop().toLowerCase();
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(extension)) return "image";
  if (["xls", "xlsx", "csv"].includes(extension)) return "sheet";
  if (["js", "json", "css", "html", "ts"].includes(extension)) return "code";
  return "doc";
}

function uploadFiles(fileList) {
  const files = [...fileList];
  if (!files.length) return;
  let remaining = files.length;
  files.forEach((uploadedFile) => {
    if (findFile(uploadedFile.name)) {
      remaining -= 1;
      if (!remaining) showToast("Upload finished");
      return;
    }
    const file = { name: uploadedFile.name, kind: fileKind(uploadedFile.name), description: `${uploadedFile.type || "Uploaded file"}`, updated: "Just now", size: uploadedFile.size };
    if (file.kind === "doc" || file.kind === "code") {
      const reader = new FileReader();
      reader.onload = () => {
        file.content = String(reader.result || "");
        state.files.unshift(file);
        persistFiles();
        renderFiles();
        remaining -= 1;
        if (!remaining) showToast(`${files.length} file${files.length === 1 ? "" : "s"} uploaded`);
      };
      reader.onerror = () => {
        state.files.unshift(file);
        persistFiles();
        renderFiles();
        remaining -= 1;
        if (!remaining) showToast("Upload finished");
      };
      reader.readAsText(uploadedFile);
    } else {
      state.files.unshift(file);
      persistFiles();
      renderFiles();
      remaining -= 1;
      if (!remaining) showToast(`${files.length} file${files.length === 1 ? "" : "s"} uploaded`);
    }
  });
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

function youtubeVideoId(value) {
  const candidate = value.trim().replace(/^<|>$/g, "");
  if (/^[\w-]{11}$/.test(candidate)) return candidate;
  try {
    const url = new URL(candidate.startsWith("www.") ? `https://${candidate}` : candidate);
    const hostname = url.hostname.replace(/^www\./, "");
    if (hostname === "youtu.be") return url.pathname.slice(1).match(/^[\w-]{11}/)?.[0] || null;
    if (!hostname.endsWith("youtube.com")) return null;
    if (url.searchParams.get("v")) return url.searchParams.get("v").match(/^[\w-]{11}/)?.[0] || null;
    return url.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})/)?.[1] || null;
  } catch {
    return null;
  }
}

function runCommand(rawCommand) {
  const command = rawCommand.trim();
  if (!command) return;
  printTerminal(`prodomain4@terminsave:~$ ${command}`, "command");
  const [verb, ...args] = command.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  const unquote = (value = "") => value.replace(/^"|"$/g, "");
  const cleanArgs = args.map(unquote);
  const rest = args.join(" ").trim();
  const target = cleanArgs[0];
  const pastedVideoId = youtubeVideoId(command);
  if (pastedVideoId && /^(?:https?:\/\/|www\.|(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be))/i.test(command)) {
    openYouTube(pastedVideoId, `Loading YouTube video ${pastedVideoId}`);
    return;
  }
  switch (verb.toLowerCase()) {
    case "help":
      printTerminal("Commands: ls, pwd, cat <file>, edit <file>, touch <file>, mkdir <folder>, write <file> <text>, append <file> <text>, rm <file>, yt <search>, yt watch <url-or-id>, clear");
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
      writeFile(target, cleanArgs.slice(1).join(" "), false);
      break;
    case "append":
      writeFile(target, cleanArgs.slice(1).join(" "), true);
      break;
    case "edit":
      editFile(target);
      break;
    case "rm":
      removeFile(target);
      break;
    case "yt":
    case "youtube": {
      if (!target) {
        printTerminal("Usage: yt <search terms> OR yt watch <video url or id>", "error");
        break;
      }
      if (target.toLowerCase() === "watch") {
        const videoTarget = cleanArgs.slice(1).join(" ");
        const videoId = youtubeVideoId(videoTarget);
        if (!videoId) {
          printTerminal("yt: expected a YouTube URL or 11-character video id", "error");
          break;
        }
        openYouTube(videoId, `Loading YouTube video ${videoId}`);
      } else if (youtubeVideoId(target)) {
        const videoId = youtubeVideoId(target);
        openYouTube(videoId, `Loading YouTube video ${videoId}`);
      } else {
        const query = cleanArgs.join(" ");
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        printTerminal(`Searching YouTube for: ${query}`);
        printTerminal(searchUrl);
        window.open(searchUrl, "_blank", "noopener,noreferrer");
      }
      break;
    }
    case "clear":
      terminalOutput.innerHTML = "";
      break;
    default:
      printTerminal(`${verb}: command not found. Type "help" to see available commands.`, "error");
  }
  renderFiles();
}

function openYouTube(videoId, message) {
  printTerminal(message);
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;
  printTerminal(embedUrl);
  youtubeFrame.src = embedUrl;
  youtubePlayer.classList.remove("hidden");
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function closeYouTube() {
  youtubeFrame.src = "";
  youtubePlayer.classList.add("hidden");
}

function editFile(name) {
  if (!name) return printTerminal("edit: missing file operand", "error");
  const file = findFile(name);
  if (!file) return printTerminal(`edit: ${name}: No such file`, "error");
  if (file.kind === "folder") return printTerminal(`${name}: Is a directory`, "error");
  const content = window.prompt(`Edit ${name}`, file.content || "");
  if (content === null) return printTerminal(`Edit cancelled for ${name}`);
  file.content = `${content}\n`;
  file.updated = "Just now";
  persistFiles();
  printTerminal(`Updated ${name}`);
  showToast(`Saved ${name}`);
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
document.querySelector("#close-youtube").addEventListener("click", closeYouTube);
document.querySelector("#clear-terminal").addEventListener("click", () => { terminalOutput.innerHTML = ""; terminalInput.focus(); });
document.querySelector("#upload-button").addEventListener("click", () => document.querySelector("#file-picker").click());
document.querySelector("#file-picker").addEventListener("change", (event) => {
  uploadFiles(event.target.files);
  event.target.value = "";
});
document.querySelector("#upgrade-button").addEventListener("click", () => showToast("You are on the generous free plan."));
document.querySelector("#notifications-button").addEventListener("click", () => showToast("You are all caught up."));
document.querySelector("#activity-button").addEventListener("click", () => showToast("Activity history is up to date."));
document.querySelector("#compose-button").addEventListener("click", () => openComposer());
document.querySelector("#composer-form").addEventListener("submit", sendMessage);
document.querySelector("#composer-close").addEventListener("click", closeComposer);
document.querySelector("#composer-cancel").addEventListener("click", closeComposer);
composerBackdrop.addEventListener("click", (event) => { if (event.target === composerBackdrop) closeComposer(); });
document.querySelector("#mark-read-button").addEventListener("click", () => {
  state.messages.forEach((message) => { message.unread = false; });
  persistMessages();
  renderInbox();
  showToast("Inbox marked as read");
});

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    state.view = button.dataset.view;
    document.querySelector("#view-title").textContent = state.view;
    document.querySelector("#section-title").textContent = state.view === "My files" ? "Your files" : state.view;
    const inboxActive = state.view === "Inbox";
    document.querySelector("#files-workspace").classList.toggle("hidden", inboxActive);
    document.querySelector("#inbox-workspace").classList.toggle("hidden", !inboxActive);
    searchInput.placeholder = inboxActive ? "Search inbox..." : "Search files...";
    document.querySelector(".breadcrumbs .muted").textContent = inboxActive ? "Messages" : "Workspace";
    if (inboxActive) renderInbox();
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

searchInput.addEventListener("input", () => state.view === "Inbox" ? renderInbox() : renderFiles());
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
  if (!card) return;
  const file = findFile(card.dataset.name);
  if (!file) return;
  if (event.target.closest("[data-action='edit']")) {
    openTerminal();
    editFile(file.name);
    return;
  }
  if (file.kind === "folder") {
    showToast(`${file.name} is ready to browse.`);
    return;
  }
  openTerminal();
  printTerminal(`Opened ${file.name}`);
  printTerminal(file.content || `${file.name} has no text content.`);
});

document.querySelector("#message-list").addEventListener("click", (event) => {
  const row = event.target.closest("[data-message-id]");
  if (!row) return;
  state.activeMessageId = Number(row.dataset.messageId);
  const message = state.messages.find((item) => item.id === state.activeMessageId);
  if (message) message.unread = false;
  persistMessages();
  renderInbox();
});

document.querySelector("#message-view").addEventListener("click", (event) => {
  if (event.target.closest("[data-action='toggle-read']")) {
    const message = state.messages.find((item) => item.id === state.activeMessageId);
    if (!message) return;
    message.unread = !message.unread;
    persistMessages();
    renderInbox();
  }
  if (event.target.closest("#reply-button")) {
    const message = state.messages.find((item) => item.id === state.activeMessageId);
    if (message) openComposer(message);
  }
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
    closeComposer();
    closeTerminal();
  }
});

printTerminal('Welcome to Terminsave. Type "help" to get started.');
renderFiles();
renderActivity();
renderInbox();
