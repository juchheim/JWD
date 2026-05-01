(function () {
  const routeToPageId = {
    "/": "home",
    "/index.html": "home",
    "/about.html": "about",
    "/services.html": "services",
    "/contact.html": "contact",
    "/portfolio.html": "portfolio",
  };

  const pageId = routeToPageId[window.location.pathname];
  if (!pageId) return;

  const state = {
    enabled: false,
    contentByKey: {},
    markers: [],
    activeKey: null,
  };

  let toggleBtn = null;
  let markerLayer = null;
  let editorPanel = null;
  let editorBody = null;
  let saveButton = null;
  let cancelButton = null;
  let editorKeyLabel = null;
  let editorTypeLabel = null;
  let loadingLabel = null;
  let valueInput = null;

  function createStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .aie-toggle {
        position: fixed;
        right: 16px;
        bottom: 16px;
        z-index: 2147483645;
        border: 1px solid rgba(0,0,0,0.2);
        border-radius: 999px;
        background: rgba(18, 25, 35, 0.95);
        color: #fff;
        font: 12px/1.2 ui-sans-serif, system-ui, -apple-system, sans-serif;
        padding: 8px 12px;
        cursor: pointer;
      }
      .aie-toggle[data-active="1"] {
        background: rgba(0, 212, 168, 0.95);
        color: #07201a;
      }
      .aie-marker-layer {
        position: fixed;
        inset: 0;
        z-index: 2147483644;
        pointer-events: none;
      }
      .aie-marker {
        position: absolute;
        pointer-events: auto;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: 1px solid rgba(0,0,0,0.18);
        background: rgba(0, 212, 168, 0.96);
        color: #06231c;
        font: 700 12px/1 ui-sans-serif, system-ui, -apple-system, sans-serif;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }
      .aie-panel {
        position: fixed;
        right: 16px;
        bottom: 58px;
        width: min(560px, calc(100vw - 32px));
        max-height: calc(100vh - 90px);
        z-index: 2147483646;
        border: 1px solid rgba(0,0,0,0.15);
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.98);
        color: #0f172a;
        box-shadow: 0 20px 40px rgba(0,0,0,0.25);
        display: none;
        overflow: hidden;
        font: 13px/1.4 ui-sans-serif, system-ui, -apple-system, sans-serif;
      }
      .aie-panel[data-open="1"] { display: flex; flex-direction: column; }
      .aie-panel-hd {
        padding: 10px 12px;
        border-bottom: 1px solid rgba(0,0,0,0.08);
        background: #f8fafc;
      }
      .aie-panel-hd strong { display: block; margin-bottom: 4px; font-size: 13px; }
      .aie-panel-meta { color: #475569; font-size: 11px; word-break: break-all; }
      .aie-panel-body {
        padding: 10px 12px;
        overflow: auto;
        min-height: 80px;
      }
      .aie-panel textarea,
      .aie-panel input {
        width: 100%;
        box-sizing: border-box;
        border: 1px solid rgba(0,0,0,0.2);
        border-radius: 8px;
        font: 13px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace;
        padding: 8px;
      }
      .aie-panel textarea { min-height: 170px; resize: vertical; }
      .aie-panel-ft {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        padding: 10px 12px;
        border-top: 1px solid rgba(0,0,0,0.08);
        background: #f8fafc;
      }
      .aie-btn {
        border: 1px solid rgba(0,0,0,0.2);
        border-radius: 8px;
        padding: 6px 10px;
        font: 12px/1.2 ui-sans-serif, system-ui, -apple-system, sans-serif;
        background: #fff;
        cursor: pointer;
      }
      .aie-btn.primary {
        background: #10b981;
        color: #07201a;
        border-color: rgba(6, 95, 70, 0.35);
        font-weight: 700;
      }
      .aie-help {
        margin-top: 8px;
        color: #64748b;
        font-size: 11px;
      }
      .aie-loading { color: #64748b; font-size: 12px; margin-bottom: 8px; }
      .aie-error {
        margin-top: 8px;
        color: #b91c1c;
        font-size: 12px;
      }
    `;
    document.head.appendChild(style);
  }

  function normalizeLineBreaks(value) {
    return value.replace(/\r\n/g, "\n");
  }

  function decodeHtmlEntities(value) {
    const txt = document.createElement("textarea");
    txt.innerHTML = value;
    return txt.value;
  }

  function getFieldType(key) {
    const row = state.contentByKey[key];
    return row && row.fieldType ? row.fieldType : "text";
  }

  function getStoredValue(key) {
    const row = state.contentByKey[key];
    return row ? row.value : null;
  }

  function queryByKey(key) {
    return Array.from(document.querySelectorAll(`[data-content-key="${key}"]`));
  }

  function hasNonEmptyArray(value) {
    return Array.isArray(value) && value.length > 0;
  }

  function inferValueFromDom(key, fieldType) {
    const nodes = queryByKey(key);
    if (nodes.length < 1) return fieldType === "string_list" ? [] : "";
    const node = nodes[0];

    if (fieldType === "string_list") {
      if (node.tagName === "SELECT") {
        return Array.from(node.querySelectorAll("option"))
          .map((option) => option.textContent ? option.textContent.trim() : "")
          .filter(Boolean);
      }
      if (node.classList.contains("service-features")) {
        return Array.from(node.querySelectorAll(".service-feature"))
          .map((item) => item.textContent ? item.textContent.trim() : "")
          .filter(Boolean);
      }
      return Array.from(node.querySelectorAll("div[style*='font-size:0.85rem']"))
        .map((item) => item.textContent ? item.textContent.trim() : "")
        .filter(Boolean);
    }

    if (fieldType === "faq_items") {
      return Array.from(node.querySelectorAll("details.faq-item")).map((item) => ({
        question: item.querySelector(".faq-q")
          ? (item.querySelector(".faq-q").childNodes[0]?.textContent || "").trim()
          : "",
        answer: item.querySelector(".faq-a")
          ? (item.querySelector(".faq-a").textContent || "").trim()
          : "",
      }));
    }

    if (fieldType === "team_members") {
      return Array.from(node.querySelectorAll(".team-card")).map((item, index) => {
        const name = (item.querySelector(".team-name")?.textContent || "").trim();
        return {
          id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || `member-${index + 1}`,
          initials: (item.querySelector(".team-avatar-initials")?.textContent || "").trim(),
          name,
          role: (item.querySelector(".team-role")?.textContent || "").trim(),
          bio: (item.querySelector(".team-bio")?.textContent || "").trim(),
          accentStyle: item.querySelector(".team-avatar-initials")?.getAttribute("style") || "",
          sortOrder: index + 1,
          isActive: true,
        };
      });
    }

    if (fieldType === "structured_list") {
      return Array.from(node.querySelectorAll(".stack-item")).map((item) => ({
        category: (item.querySelector(".stack-category")?.textContent || "").trim(),
        label: decodeHtmlEntities(
          (item.textContent || "").replace((item.querySelector(".stack-category")?.textContent || ""), "").trim()
        ),
      }));
    }

    if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
      return node.placeholder || "";
    }
    const html = node.innerHTML || "";
    if (html.includes("<br")) {
      return normalizeLineBreaks(html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").trim());
    }
    return (node.textContent || "").trim();
  }

  function applyText(key, value, preserveBreaks) {
    queryByKey(key).forEach((node) => {
      if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
        node.placeholder = value;
        return;
      }
      if (preserveBreaks) {
        node.innerHTML = value
          .split("\n")
          .map((line) => line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"))
          .join("<br/>");
      } else {
        node.textContent = value;
      }
    });
  }

  function applyStringList(key, list) {
    const values = list.map((item) => String(item).trim()).filter(Boolean);
    queryByKey(key).forEach((node) => {
      if (node.tagName === "SELECT") {
        node.innerHTML = values
          .map((value, index) =>
            index === 0
              ? `<option value="" disabled selected>${value.replace(/</g, "&lt;")}</option>`
              : `<option>${value.replace(/</g, "&lt;")}</option>`
          )
          .join("");
      } else if (node.classList.contains("service-features")) {
        node.innerHTML = values
          .map((value) => `<div class="service-feature">${value.replace(/</g, "&lt;")}</div>`)
          .join("");
      } else {
        node.innerHTML = values
          .map(
            (value, index) => `<div style="display:flex;gap:0.75rem;align-items:flex-start;">
              <div style="width:22px;height:22px;border-radius:50%;background:var(--accent-teal-dim);border:1px solid rgba(0,212,168,0.3);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:0.65rem;font-weight:700;color:var(--accent-teal);">${index + 1}</div>
              <div class="balance-wrap" style="font-size:0.85rem;color:var(--text-secondary);">${value.replace(/</g, "&lt;")}</div>
            </div>`
          )
          .join("");
      }
    });
  }

  function applyFaq(key, items) {
    queryByKey(key).forEach((node) => {
      node.innerHTML = items
        .map(
          (item) => `<details class="faq-item">
        <summary class="faq-q">${String(item.question || "").replace(/</g, "&lt;")}<span class="faq-icon">+</span></summary>
        <div class="faq-a">${String(item.answer || "").replace(/</g, "&lt;")}</div>
      </details>`
        )
        .join("\n");
    });
  }

  function applyTeamMembers(key, members) {
    const activeMembers = members.filter((item) => item && item.isActive !== false);
    queryByKey(key).forEach((node) => {
      node.innerHTML = activeMembers
        .map((member, index) => {
          const revealClass =
            index === 0
              ? "reveal visible"
              : `reveal visible reveal-delay-${Math.min(index, 3)}`;
          const styleAttr = member.accentStyle ? ` style="${String(member.accentStyle).replace(/"/g, "&quot;")}"` : "";
          return `<div class="team-card ${revealClass}">
        <div class="team-avatar">
          <div class="team-avatar-initials"${styleAttr}>${String(member.initials || "").replace(/</g, "&lt;")}</div>
        </div>
        <div class="team-info">
          <div class="team-name">${String(member.name || "").replace(/</g, "&lt;")}</div>
          <div class="team-role">${String(member.role || "").replace(/</g, "&lt;")}</div>
          <div class="team-bio">${String(member.bio || "").replace(/</g, "&lt;")}</div>
        </div>
      </div>`;
        })
        .join("\n");
    });
  }

  function applyStructuredList(key, rows) {
    queryByKey(key).forEach((node) => {
      node.innerHTML = rows
        .map(
          (item) =>
            `<div class="stack-item"><div class="stack-category">${String(item.category || "").replace(/</g, "&lt;")}</div>${String(item.label || "").replace(/</g, "&lt;")}</div>`
        )
        .join("\n");
    });
  }

  function applyOptimisticValue(key, fieldType, value) {
    if (fieldType === "text") {
      applyText(key, String(value ?? ""), false);
      return;
    }
    if (fieldType === "multiline_text") {
      const shouldBreak = queryByKey(key).some((node) => /<br/i.test(node.innerHTML || ""));
      applyText(key, String(value ?? ""), shouldBreak);
      return;
    }
    if (fieldType === "string_list") {
      applyStringList(key, Array.isArray(value) ? value : []);
      return;
    }
    if (fieldType === "faq_items") {
      applyFaq(key, Array.isArray(value) ? value : []);
      return;
    }
    if (fieldType === "team_members") {
      applyTeamMembers(key, Array.isArray(value) ? value : []);
      return;
    }
    if (fieldType === "structured_list") {
      applyStructuredList(key, Array.isArray(value) ? value : []);
    }
  }

  function parseEditorValue(fieldType, rawValue) {
    if (fieldType === "text" || fieldType === "multiline_text") return rawValue.trim();
    if (fieldType === "string_list") {
      return rawValue
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);
    }
    try {
      return JSON.parse(rawValue);
    } catch {
      throw new Error("Invalid JSON. Please provide valid JSON for this field.");
    }
  }

  function renderMarkers() {
    if (!state.enabled || !markerLayer) return;
    markerLayer.innerHTML = "";
    state.markers = [];

    const keyedNodes = Array.from(document.querySelectorAll("[data-content-key]"));
    const uniqueByKey = new Map();
    keyedNodes.forEach((node) => {
      const key = node.getAttribute("data-content-key");
      if (!key) return;
      if (!uniqueByKey.has(key)) uniqueByKey.set(key, node);
    });

    uniqueByKey.forEach((node, key) => {
      const rect = node.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "aie-marker";
      btn.textContent = "✎";
      btn.title = `Edit ${key}`;
      btn.style.top = `${Math.max(4, rect.top + 4)}px`;
      btn.style.left = `${Math.max(4, rect.left + 4)}px`;
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        openEditorForKey(key);
      });
      markerLayer.appendChild(btn);
      state.markers.push(btn);
    });
  }

  function openEditorForKey(key) {
    state.activeKey = key;
    const fieldType = getFieldType(key);
    const currentStored = getStoredValue(key);
    const fallback = inferValueFromDom(key, fieldType);
    const prefersDomFallback =
      (fieldType === "string_list" ||
        fieldType === "faq_items" ||
        fieldType === "team_members" ||
        fieldType === "structured_list") &&
      Array.isArray(currentStored) &&
      currentStored.length === 0 &&
      hasNonEmptyArray(fallback);
    const effectiveValue = currentStored == null || prefersDomFallback ? fallback : currentStored;

    editorKeyLabel.textContent = key;
    editorTypeLabel.textContent = fieldType;
    loadingLabel.textContent = "";
    editorPanel.dataset.open = "1";

    let inputValue = "";
    if (fieldType === "text" || fieldType === "multiline_text") {
      inputValue = String(effectiveValue ?? "");
    } else if (fieldType === "string_list") {
      inputValue = Array.isArray(effectiveValue) ? effectiveValue.join("\n") : "";
    } else {
      inputValue = JSON.stringify(effectiveValue ?? [], null, 2);
    }

    valueInput.value = inputValue;
    editorBody.querySelector(".aie-error")?.remove();
  }

  function closeEditor() {
    state.activeKey = null;
    editorPanel.dataset.open = "0";
    editorBody.querySelector(".aie-error")?.remove();
  }

  async function saveActiveField() {
    if (!state.activeKey) return;
    const key = state.activeKey;
    const fieldType = getFieldType(key);
    const raw = valueInput.value;

    let parsed;
    try {
      parsed = parseEditorValue(fieldType, raw);
    } catch (error) {
      const old = editorBody.querySelector(".aie-error");
      if (old) old.remove();
      const err = document.createElement("div");
      err.className = "aie-error";
      err.textContent = error instanceof Error ? error.message : "Invalid value.";
      editorBody.appendChild(err);
      return;
    }

    saveButton.disabled = true;
    loadingLabel.textContent = "Saving...";
    editorBody.querySelector(".aie-error")?.remove();

    try {
      const response = await fetch(`/api/worker/admin/static-content/${encodeURIComponent(key)}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ value: parsed }),
      });
      const body = await response.json();
      if (!response.ok || !body.ok) {
        throw new Error(body?.error?.message || "Save failed.");
      }

      const savedValue =
        body && body.entry && Object.prototype.hasOwnProperty.call(body.entry, "value")
          ? body.entry.value
          : parsed;
      state.contentByKey[key] = {
        fieldType,
        value: savedValue,
      };
      applyOptimisticValue(key, fieldType, savedValue);
      loadingLabel.textContent = "Saved.";
      setTimeout(() => {
        loadingLabel.textContent = "";
      }, 1200);
      renderMarkers();
    } catch (error) {
      const err = document.createElement("div");
      err.className = "aie-error";
      err.textContent = error instanceof Error ? error.message : "Save failed.";
      editorBody.appendChild(err);
      loadingLabel.textContent = "";
    } finally {
      saveButton.disabled = false;
    }
  }

  function createUi() {
    createStyles();

    toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "aie-toggle";
    toggleBtn.dataset.active = "0";
    toggleBtn.textContent = "Edit page";
    document.body.appendChild(toggleBtn);

    markerLayer = document.createElement("div");
    markerLayer.className = "aie-marker-layer";
    markerLayer.style.display = "none";
    document.body.appendChild(markerLayer);

    editorPanel = document.createElement("div");
    editorPanel.className = "aie-panel";
    editorPanel.dataset.open = "0";
    editorPanel.innerHTML = `
      <div class="aie-panel-hd">
        <strong>Inline edit</strong>
        <div class="aie-panel-meta"><span id="aie-key"></span></div>
        <div class="aie-panel-meta">Field type: <span id="aie-type"></span></div>
      </div>
      <div class="aie-panel-body">
        <div class="aie-loading" id="aie-loading"></div>
      </div>
      <div class="aie-panel-ft">
        <button type="button" class="aie-btn" id="aie-cancel">Close</button>
        <button type="button" class="aie-btn primary" id="aie-save">Save</button>
      </div>
    `;
    document.body.appendChild(editorPanel);

    editorBody = editorPanel.querySelector(".aie-panel-body");
    editorKeyLabel = editorPanel.querySelector("#aie-key");
    editorTypeLabel = editorPanel.querySelector("#aie-type");
    loadingLabel = editorPanel.querySelector("#aie-loading");
    saveButton = editorPanel.querySelector("#aie-save");
    cancelButton = editorPanel.querySelector("#aie-cancel");

    valueInput = document.createElement("textarea");
    editorBody.appendChild(valueInput);
    const help = document.createElement("div");
    help.className = "aie-help";
    help.textContent = "For list fields: one item per line. For FAQ/team/structured fields: valid JSON.";
    editorBody.appendChild(help);

    toggleBtn.addEventListener("click", () => {
      state.enabled = !state.enabled;
      toggleBtn.dataset.active = state.enabled ? "1" : "0";
      toggleBtn.textContent = state.enabled ? "Editing on" : "Edit page";
      markerLayer.style.display = state.enabled ? "block" : "none";
      if (!state.enabled) {
        markerLayer.innerHTML = "";
        closeEditor();
      } else {
        renderMarkers();
      }
    });

    saveButton.addEventListener("click", () => {
      void saveActiveField();
    });
    cancelButton.addEventListener("click", closeEditor);

    const refreshMarkers = () => {
      if (!state.enabled) return;
      renderMarkers();
    };
    window.addEventListener("resize", refreshMarkers);
    window.addEventListener("scroll", refreshMarkers, { passive: true });
  }

  async function loadContentState() {
    const response = await fetch(`/api/worker/admin/static-content?pageId=${encodeURIComponent(pageId)}`, {
      method: "GET",
      credentials: "include",
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Failed to load editable content.");
    const body = await response.json();
    const content = body && body.content ? body.content : {};
    state.contentByKey = content;
  }

  async function start() {
    try {
      const sessionResponse = await fetch("/api/worker/admin/auth/session", {
        method: "GET",
        credentials: "include",
        headers: { accept: "application/json" },
        cache: "no-store",
      });
      if (!sessionResponse.ok) return;

      await loadContentState();
      createUi();
    } catch {
      // Silent fail: visitors and broken sessions should see normal site.
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      void start();
    });
  } else {
    void start();
  }
})();
