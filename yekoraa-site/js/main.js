/* ==========================================================
   YEKORAA demo — shared interactive behavior
   ========================================================== */

const RING_TOTAL = 60; // seconds the ring visually represents
const RING_R = 20; // matches small ring radius in SVG markup below
const RING_C = 2 * Math.PI * RING_R;

/* ---------- Mobile nav ---------- */
function yekInitNav() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links) return;
  toggle.addEventListener("click", () => {
    const open = links.style.display === "flex";
    links.style.display = open ? "none" : "flex";
    links.style.cssText += open
      ? ""
      : "position:absolute;top:68px;left:0;right:0;flex-direction:column;align-items:flex-start;gap:16px;background:#14211A;padding:20px 24px;border-bottom:1px solid #263B2C;";
  });
}

/* ---------- Toast ---------- */
let toastTimer = null;
function yekToast(message) {
  let el = document.getElementById("yek-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "yek-toast";
    el.className = "toast";
    el.innerHTML = `<span class="toast-icon">🔔</span><span class="toast-text"></span>`;
    document.body.appendChild(el);
  }
  el.querySelector(".toast-text").textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
}

/* ---------- Countdown ring SVG builder ---------- */
function yekRingSVG(seconds, size = "sm") {
  const capped = Math.min(seconds, RING_TOTAL);
  const pct = capped / RING_TOTAL;
  const offset = RING_C * (1 - pct);
  const urgent = seconds <= 15 && seconds > 0;
  const closed = seconds <= 0;
  return `
    <div class="ring-wrap ${size === "lg" ? "ring-lg" : ""}">
      <svg viewBox="0 0 48 48">
        <circle class="ring-bg" cx="24" cy="24" r="${RING_R}" />
        <circle class="ring-fg ${urgent ? "urgent" : ""}" cx="24" cy="24" r="${RING_R}"
          stroke-dasharray="${RING_C}" stroke-dashoffset="${closed ? RING_C : offset}" />
      </svg>
      <div class="ring-label ${urgent ? "urgent" : ""}">${closed ? "Closed" : seconds + "s"}</div>
    </div>`;
}

/* ---------- Auction card builder ---------- */
function yekCardHTML(a) {
  return `
  <a class="card" href="auction-detail.html?id=${a.id}" data-auction-id="${a.id}">
    <div class="card-media">
      <img src="${a.img}" alt="${a.title}" loading="lazy" />
      <span class="card-badge" data-badge>${a.bids} bids</span>
    </div>
    <div class="card-body">
      <div>
        <div class="card-title">${a.title}</div>
        <div class="card-seller">by ${a.seller}</div>
      </div>
      <div class="card-foot">
        <div>
          <div class="card-label">Current bid</div>
          <div class="card-bid" data-bid>${yekFmtNaira(a.bid)}</div>
        </div>
        <div data-ring>${yekRingSVG(a.seconds)}</div>
      </div>
    </div>
  </a>`;
}

/* ---------- Render a grid of auctions into a container ---------- */
function yekRenderGrid(containerId, auctions) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = auctions.map(yekCardHTML).join("");
}

/* ---------- Live countdown + simulated rival bids for cards on a page ---------- */
function yekRunLiveCards(auctions) {
  const state = {};
  auctions.forEach((a) => (state[a.id] = { seconds: a.seconds, bid: a.bid, bids: a.bids }));

  const intervalId = setInterval(() => {
    auctions.forEach((a) => {
      const s = state[a.id];
      if (s.seconds <= 0) return;
      s.seconds -= 1;

      // Simulated rival bid landing in the closing window -> anti-sniping extension
      if (s.seconds > 0 && s.seconds <= 60 && s.seconds % 23 === 0) {
        s.bid = Math.round(s.bid * 1.015);
        s.bids += 1;
        s.seconds += 60;
        yekToast(`New bid on "${a.title}" — timer extended`);
      }

      const card = document.querySelector(`[data-auction-id="${a.id}"]`);
      if (!card) return;
      const badge = card.querySelector("[data-badge]");
      const bidEl = card.querySelector("[data-bid]");
      const ringEl = card.querySelector("[data-ring]");
      if (badge) badge.textContent = s.seconds <= 0 ? "Closed" : `${s.bids} bids`;
      if (bidEl) bidEl.textContent = yekFmtNaira(s.bid);
      if (ringEl) ringEl.innerHTML = yekRingSVG(s.seconds);
    });
  }, 1000);

  return { state, intervalId };
}

document.addEventListener("DOMContentLoaded", yekInitNav);
