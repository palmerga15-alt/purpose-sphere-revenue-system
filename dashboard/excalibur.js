"use strict";

(function () {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));

  const sectionLabels = [
    ["urgent", "URGENT"],
    ["billsAndOutstandingBalances", "BILLS & OUTSTANDING BALANCES"],
    ["appointments", "APPOINTMENTS"],
    ["speakingGigsAndOpportunities", "SPEAKING GIGS & OPPORTUNITIES"],
    ["sameDayActions", "SAME-DAY ACTIONS"],
    ["repliesAndBusinessMatters", "REPLIES & BUSINESS MATTERS"],
    ["accountsChecked", "ACCOUNTS CHECKED"],
    ["accessIssues", "ACCESS ISSUES"]
  ];

  function normalizeItems(value) {
    if (!Array.isArray(value)) return [];
    return value.map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        return item.text || item.title || item.message || JSON.stringify(item);
      }
      return String(item ?? "");
    }).filter(Boolean);
  }

  function render(data) {
    const grid = document.getElementById("grid");
    if (!grid) return;

    const old = document.getElementById("panel-excalibur");
    if (old) old.remove();

    const panel = document.createElement("section");
    panel.className = "panel wide";
    panel.id = "panel-excalibur";
    panel.style.borderColor = "rgba(83,199,240,.45)";

    const report = data?.report || {};
    const blocks = sectionLabels.map(([key, label]) => {
      const items = normalizeItems(report[key]);
      const body = items.length
        ? `<ul style="margin:7px 0 0 18px;line-height:1.65">${items.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`
        : `<div class="dim" style="margin-top:6px">Nothing requiring attention.</div>`;
      return `<div style="padding:10px 0;border-top:1px dashed rgba(40,70,120,.35)">
        <div style="color:var(--cyan);font-size:10px;letter-spacing:1.5px;font-weight:700">${label}</div>${body}
      </div>`;
    }).join("");

    const synced = data?.commandCenterSync === "connected";
    panel.innerHTML = `
      <div class="panel-head">
        <span class="panel-title">EXCALIBUR // COMMUNICATIONS REPORT</span>
        <span class="panel-badge ${synced ? "badge-online" : "badge-offline"}">${synced ? "● LIVE FEED" : "○ DEGRADED"}</span>
      </div>
      <div class="panel-body">
        <div class="brief-summary" style="margin-bottom:8px">Latest synchronized PurposeSphere communications status · ${esc(data?.lastUpdated || "unknown time")}</div>
        ${blocks}
      </div>`;

    grid.prepend(panel);
  }

  async function load() {
    try {
      const response = await fetch(`excalibur-status.json?ts=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      render(data);
    } catch (error) {
      console.error("Excalibur feed load failed", error);
      render({
        commandCenterSync: "blocked",
        lastUpdated: "unavailable",
        report: { accessIssues: ["Excalibur communications feed could not be loaded."] }
      });
    }
  }

  load();
  window.setInterval(load, 300000);
})();
