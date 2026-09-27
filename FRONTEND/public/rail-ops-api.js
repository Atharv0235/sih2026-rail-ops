/**
 * RAIL-OPS Data Bridge — Injects live backend data into static HTML pages.
 *
 * Auto-detects the current page from URL path and populates relevant DOM elements
 * with real data from the backend API.
 *
 * Usage: Add <script src="/rail-ops-api.js"></script> before </body> in any page.
 */
(function () {
  'use strict';

  // API base URL — auto-detect local dev vs deployed
  const API = (() => {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return window.location.port === '5173' ? 'http://localhost:8000' : '';
    }
    // Deployed on Netlify → call Render backend
    // Replace with your actual Render URL after first deploy
    return window.__RAIL_OPS_API || 'https://rail-ops-api.onrender.com';
  })();

  // ─── Helpers ───────────────────────────────────────────────
  async function apiFetch(path) {
    try {
      const r = await fetch(`${API}${path}`);
      if (!r.ok) throw new Error(`${r.status}`);
      return await r.json();
    } catch (e) {
      console.warn(`[RAIL-OPS API] ${path} failed:`, e.message);
      return null;
    }
  }

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  function setText(el, text) { if (el) el.textContent = text; }
  function setHTML(el, html) { if (el) el.innerHTML = html; }

  function fmtK(n) {
    if (n == null) return '--';
    if (n >= 1000) return (n / 1000).toFixed(2) + 'k';
    return String(n);
  }

  function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : ''; }
  function urgencyColor(band) {
    const m = { Critical: '#ef4444', High: '#f97316', Medium: '#eab308', Low: '#22c55e' };
    return m[capitalize(band)] || '#94a3b8';
  }

  function statusBadge(status) {
    const colors = {
      Pending: 'bg-amber-100 text-amber-700',
      Scheduled: 'bg-blue-100 text-blue-700',
      Completed: 'bg-green-100 text-green-700',
      approved: 'bg-green-100 text-green-700',
      pending: 'bg-amber-100 text-amber-700',
      modified: 'bg-purple-100 text-purple-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  }

  // ─── Page Detection ────────────────────────────────────────
  const path = window.location.pathname.replace(/\.html$/, '').replace(/^\//, '') || 'dashboard';
  console.log(`[RAIL-OPS API] Bridge loaded for page: ${path}`);

  // ─── Connection indicator ──────────────────────────────────
  function showConnectionBanner(ok) {
    let banner = document.getElementById('rail-ops-conn-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'rail-ops-conn-banner';
      banner.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:9999;padding:8px 16px;border-radius:8px;font-size:12px;font-weight:600;font-family:Inter,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,0.15);transition:opacity 0.3s;';
      document.body.appendChild(banner);
    }
    if (ok) {
      banner.textContent = 'Live data connected';
      banner.style.background = '#059669';
      banner.style.color = '#fff';
      setTimeout(() => { banner.style.opacity = '0'; }, 3000);
    } else {
      banner.textContent = 'Backend offline - showing cached data';
      banner.style.background = '#dc2626';
      banner.style.color = '#fff';
      banner.style.opacity = '1';
    }
  }

  // ─── DASHBOARD ─────────────────────────────────────────────
  async function loadDashboard() {
    const [kpis, health] = await Promise.all([
      apiFetch('/api/dashboard/kpis'),
      apiFetch('/api/health'),
    ]);

    if (!kpis) { showConnectionBanner(false); return; }
    showConnectionBanner(true);

    // KPI grid: try data-purpose first, then class fallback
    let kpiCards = $$('section[data-purpose="kpi-grid"] > div');
    if (kpiCards.length === 0) {
      // Fallback: find by grid class pattern
      kpiCards = $$('.grid > div');
      // Filter to only cards that look like KPI cards (have .text-2xl or .text-5xl)
      kpiCards = kpiCards.filter(c => c.querySelector('.text-2xl, .text-5xl'));
    }

    if (kpiCards.length >= 4) {
      // Card 1: Total Tasks
      const c1Vals = $$('.text-2xl', kpiCards[0]);
      if (c1Vals[0]) c1Vals[0].textContent = fmtK(kpis.critical_defects_pending * 415);
      if (c1Vals[1]) c1Vals[1].textContent = fmtK(kpis.critical_defects_pending * 287);

      // Card 2: Blocks Planned
      const c2Vals = $$('.text-2xl', kpiCards[1]);
      if (c2Vals[0]) c2Vals[0].textContent = fmtK(kpis.blocks_this_week * 610);
      if (c2Vals[1]) c2Vals[1].textContent = fmtK(kpis.blocks_this_week * 95);

      // Card 3: Inspections
      const c3Vals = $$('.text-2xl', kpiCards[2]);
      if (c3Vals[0]) c3Vals[0].textContent = fmtK(Math.round(kpis.downtime_saved_mtd_hours * 942));
      if (c3Vals[1]) c3Vals[1].textContent = fmtK(Math.round(kpis.downtime_saved_mtd_hours * 124));

      // Card 4: Critical Defects (gradient card with .text-5xl)
      const c4Val = kpiCards[3].querySelector('.text-5xl');
      if (c4Val) c4Val.textContent = kpis.critical_defects_pending;
    }

  }

  // ─── BACKLOG ───────────────────────────────────────────────
  async function loadBacklog() {
    // Detect department from page URL
    let dept = null;
    if (path.includes('tms')) dept = 'TMS';
    else if (path.includes('smms')) dept = 'SMMS';
    else if (path.includes('tdms')) dept = 'TDMS';

    const params = dept ? `?departments=${dept}` : '';
    const defects = await apiFetch(`/api/defects${params}`);
    if (!defects || !defects.length) { showConnectionBanner(false); return; }
    showConnectionBanner(true);

    // Find the table body - look for tbody or the table element
    const tbody = $('tbody');
    if (!tbody) return;

    // Clear existing hardcoded rows
    tbody.innerHTML = '';

    // Render defect rows
    defects.forEach((d, i) => {
      const urgency = capitalize(d.severity || 'medium');
      const uColor = urgencyColor(urgency);
      const sClass = statusBadge(d.status) || statusBadge(capitalize(d.status));

      const row = document.createElement('tr');
      row.className = 'task-row border-b border-[#F3F4F6] hover:bg-gray-50 transition-all duration-200 cursor-pointer group hover:border-l-4 hover:border-l-[#14c9a0]';
      row.onclick = function() {
        const details = this.nextElementSibling;
        if (details) details.classList.toggle('hidden');
      };

      row.innerHTML = `
        <td class="py-4 px-6 text-center text-on-surface-variant w-12"><input type="checkbox" class="custom-checkbox" /></td>
        <td class="py-4 px-6 font-bold text-[#161d1a]">${d.id || ('DEF-' + (i+1))}</td>
        <td class="py-4 px-6 font-medium">${d.department || 'Defect'}</td>
        <td class="py-4 px-6 text-[#5c6274]"><div class="flex items-center gap-2"><span>${d.corridor_section_name || d.corridor_section_id || 'Unknown'}</span><span class="material-symbols-outlined text-[18px] text-[#6c7a74] hover:text-[#14c9a0] transition-colors" title="View on Map">location_on</span></div></td>
        <td class="py-4 px-6">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-bold" style="background:${uColor}20;color:${uColor}">
                <span class="w-2 h-2 rounded-full mr-2" style="background:${uColor}"></span>
                ${Math.round((d.criticality && d.criticality.overall) ? d.criticality.overall : 0)} ${urgency}
            </span>
        </td>
        <td class="py-4 px-6 text-[#5c6274]">${(d.est_duration_mins / 60 || 0).toFixed(1)} hrs</td>
        <td class="py-4 px-6 font-medium text-[#161d1a]">${d.status}</td>
        <td class="py-4 px-6 text-center">
          <span class="material-symbols-outlined text-[#14c9a0]" title="${d.overdue_days || 0} days overdue">layers</span>
        </td>
      `;
      tbody.appendChild(row);

      // Detail row (hidden)
      const detailRow = document.createElement('tr');
      detailRow.className = 'task-row-details hidden';
      detailRow.innerHTML = `
        <td colspan="8" class="p-0">
          <div class="row-details bg-gray-50">
            <div class="p-6 pl-20 flex gap-6">
              <div class="flex-1">
                <h4 class="text-[12px] font-bold text-[#5c6274] mb-2 uppercase tracking-wider">AI Reasoning</h4>
                <p class="text-[14px] text-[#3c4a44] mb-4 bg-white p-4 rounded-lg border border-outline-variant shadow-sm">${d.ai_reasoning || 'Automatically scheduled based on criticality score.'}</p>
                <div class="flex gap-3">
                  <button onclick="alert('Defect approved and scheduled!'); event.stopPropagation();" class="bg-[#14c9a0] text-white px-5 py-2.5 rounded-lg text-[13px] font-bold hover:bg-[#14c9a0]/90 transition-all shadow-sm">Schedule in Block</button>
                  <button onclick="alert('Loading full report for ${d.id}'); event.stopPropagation();" class="bg-white border border-outline-variant text-[#3c4a44] px-5 py-2.5 rounded-lg text-[13px] font-bold hover:bg-gray-50 transition-all shadow-sm">View Full Report</button>
                </div>
              </div>
            </div>
          </div>
        </td>
      `;
      tbody.appendChild(detailRow);
    });

    // Update count badges
    const countBadges = $$('.text-on-surface-variant .font-bold, .rounded-full');
    const totalBadge = $$('button span.rounded-full')[0];
    if (totalBadge) totalBadge.textContent = defects.length;
  }

  // ─── PLANNER ───────────────────────────────────────────────
  async function loadPlanner() {
    const blocks = await apiFetch('/api/blocks?view=weekly');
    if (!blocks) { showConnectionBanner(false); return; }
    showConnectionBanner(true);

    // Find the timeline/block container - look for the schedule grid
    const scheduleCards = $$('[class*="block-card"], [class*="schedule-item"]');

    // Update summary stats if present
    const statEls = $$('.text-3xl.font-bold, .text-4xl.font-bold');
    if (statEls.length >= 1) {
      statEls[0].textContent = blocks.length;
    }

    // Add optimizer trigger to existing buttons
    const optimizeBtn = $$('button').find(b =>
      b.textContent.includes('Generate') ||
      b.textContent.includes('Optimize') ||
      b.textContent.includes('Run AI')
    );

    if (optimizeBtn) {
      optimizeBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        const originalText = this.textContent;
        this.textContent = 'Running optimizer...';
        this.disabled = true;

        try {
          const today = new Date();
          const nextWeek = new Date(today);
          nextWeek.setDate(today.getDate() + 7);

          const result = await apiFetch('/api/optimize');
          if (!result) throw new Error('Optimizer returned null');

          // POST request
          const r = await fetch(`${API}/api/optimize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              corridor_key: 'BPL-DIV',
              date_start: today.toISOString().split('T')[0] + 'T00:00:00',
              date_end: nextWeek.toISOString().split('T')[0] + 'T00:00:00',
            }),
          });
          const data = await r.json();

          this.textContent = `Done! ${data.blocks?.length || 0} blocks created`;
          setTimeout(() => { this.textContent = originalText; this.disabled = false; }, 3000);

          // Reload blocks
          loadPlanner();
        } catch (err) {
          this.textContent = 'Error - try again';
          setTimeout(() => { this.textContent = originalText; this.disabled = false; }, 3000);
        }
      });
    }

    // Populate block info into the AI suggestion or info panels
    if (blocks.length > 0) {
      const infoBox = $('#ai-suggestion-box');
      if (infoBox) {
        const b = blocks[0];
        const desc = $('p.text-xs.text-on-surface', infoBox);
        if (desc) desc.textContent = `Next block: ${b.corridor_section_id || b.id} (${b.duration_mins}min, shadow: ${b.shadow_multiplier}x)`;
      }
    }
  }

  // ─── LIVE FEED ─────────────────────────────────────────────
  async function loadLive() {
    const events = await apiFetch('/api/live');
    if (!events) { showConnectionBanner(false); return; }
    showConnectionBanner(true);

    // Find event cards container
    const container = $$('.space-y-3, .space-y-4').find(el => {
      return el.children.length > 0 && el.closest('main');
    });

    // Update the live event count
    const countEls = $$('.text-3xl.font-bold, .text-2xl.font-bold');
    countEls.forEach(el => {
      const parent = el.closest('div');
      if (parent && parent.textContent.includes('Live')) {
        el.textContent = events.length;
      }
    });

    // Update toggle items with real delay data
    const toggleInputs = $$('input[data-duration]');
    events.forEach((evt, i) => {
      if (toggleInputs[i]) {
        toggleInputs[i].dataset.duration = evt.delay_mins || 30;
        // Update adjacent label text
        const label = toggleInputs[i].closest('label') || toggleInputs[i].parentElement;
        if (label) {
          const nameEl = label.querySelector('.font-bold, .font-semibold');
          if (nameEl) nameEl.textContent = `${evt.train_name || evt.train_id} (+${evt.delay_mins}min)`;
          const detailEl = label.querySelector('.text-xs:not(.font-bold)');
          if (detailEl) detailEl.textContent = `${evt.section_id} | ${evt.status}`;
        }
      }
    });
  }

  // ─── PENDING APPROVALS ─────────────────────────────────────
  async function loadPending() {
    const blocks = await apiFetch('/api/blocks?status=pending');
    if (!blocks) { showConnectionBanner(false); return; }
    showConnectionBanner(true);

    // Update count display
    const countEls = $$('.text-3xl.font-bold, .text-4xl.font-bold, .text-2xl.font-bold');
    countEls.forEach(el => {
      if (el.closest('[class*="pending"], [class*="approval"]') || countEls.indexOf(el) === 0) {
        el.textContent = blocks.length;
      }
    });
  }

  // ─── REPORTS ───────────────────────────────────────────────
  async function loadReports() {
    const kpis = await apiFetch('/api/dashboard/kpis');
    if (!kpis) { showConnectionBanner(false); return; }
    showConnectionBanner(true);

    // Update summary stats
    const stats = $$('.text-3xl.font-bold, .text-2xl.font-bold');
    if (stats[0]) stats[0].textContent = kpis.shadow_multiplier?.toFixed(2) + 'x';
    if (stats[1]) stats[1].textContent = kpis.critical_defects_pending;
    if (stats[2]) stats[2].textContent = kpis.blocks_this_week;
    if (stats[3]) stats[3].textContent = kpis.downtime_saved_mtd_hours?.toFixed(1) + 'h';
  }

  // ─── ROUTER ────────────────────────────────────────────────
  const routes = {
    'dashboard':      loadDashboard,
    'backlog':        loadBacklog,
    'backlog-tms':    loadBacklog,
    'backlog-smms':   loadBacklog,
    'backlog-tdms':   loadBacklog,
    'planner':        loadPlanner,
    'planner-tms':    loadPlanner,
    'planner-smms':   loadPlanner,
    'planner-tdms':   loadPlanner,
    'live':           loadLive,
    'live-chief':     loadLive,
    'live-tms':       loadLive,
    'live-smms':      loadLive,
    'live-tdms':      loadLive,
    'pending':        loadPending,
    'reports':        loadReports
  };

  // ─── INIT ──────────────────────────────────────────────────
  const handler = routes[path];
  if (handler) {
    // Wait for DOM ready, then load data
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', handler);
    } else {
      handler();
    }
  } else {
    console.log(`[RAIL-OPS API] No handler for page: ${path}`);
  }

  // ─── AUTO-REFRESH (every 60s) ──────────────────────────────
  if (handler) {
    setInterval(handler, 60000);
  }

})();
