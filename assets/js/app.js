(function () {
  const cfg = window.WHEELTRACK_CONFIG;
  const store = window.WheeltrackState;
  const page = window.WHEELTRACK_PAGE || { screen: "landing", root: "" };
  let state = store.load();
  const app = document.getElementById("app");

  const driverSteps = [
    ["mobile", "Mobile", "driver/mobile.php"],
    ["mobile-otp", "Mobile OTP", "driver/mobile-otp.php"],
    ["email", "Email", "driver/email.php"],
    ["email-otp", "Email OTP", "driver/email-otp.php"],
    ["password", "Password", "driver/password.php"],
    ["consent", "Consent", "driver/consent.php"],
    ["personal-details", "Personal", "driver/personal-details.php"],
    ["identity", "KYC", "driver/identity.php"],
    ["driving-licence", "Licence", "driver/driving-licence.php"],
    ["operating-model", "Operate", "driver/operating-model.php"]
  ];
  const ownerSteps = [
    ["vehicle", "Vehicle", "driver/owner/vehicle.php"],
    ["rc", "RC", "driver/owner/rc.php"],
    ["insurance", "Insurance", "driver/owner/insurance.php"],
    ["puc", "PUC", "driver/owner/puc.php"],
    ["fitness-permit", "Fitness", "driver/owner/fitness-permit.php"],
    ["compliance", "Compliance", "driver/owner/compliance.php"],
    ["review", "Review", "driver/owner/review.php"],
    ["status", "Status", "driver/owner/status.php"],
    ["dashboard", "Dashboard", "driver/owner/dashboard.php"]
  ];
  const transporterSteps = [
    ["transporter-id", "Transporter", "driver/transporter/transporter-id.php"],
    ["transporter-details", "Details", "driver/transporter/transporter-details.php"],
    ["request-status", "Approval", "driver/transporter/request-status.php"],
    ["assigned-vehicle", "Vehicle", "driver/transporter/assigned-vehicle.php"],
    ["compliance", "Compliance", "driver/transporter/compliance.php"],
    ["review", "Review", "driver/transporter/review.php"],
    ["status", "Status", "Approved", "driver/transporter/status.php"],
    ["dashboard", "Dashboard", "driver/transporter/dashboard.php"]
  ].map((step) => step.length === 4 ? [step[0], step[2], step[3]] : step);

  const icons = {
    back: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/><path d="M21 12H9"/></svg>',
    phone: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.77.63 2.6a2 2 0 0 1-.45 2.11L8 9.72a16 16 0 0 0 6.28 6.28l1.29-1.29a2 2 0 0 1 2.11-.45c.83.3 1.7.51 2.6.63A2 2 0 0 1 22 16.92Z"/></svg>',
    login: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/></svg>',
    mail: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
    lock: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    eye: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeOff: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.7 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-2.2 3.2"/><path d="M6.6 6.6A17.4 17.4 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="m2 2 20 20"/></svg>',
    driver: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a6.5 6.5 0 0 1 13 0"/><circle cx="12" cy="15" r="3"/></svg>',
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>',
    factory: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"/><path d="M5 21V9l5 3V9l5 3V5h4v16"/><path d="M9 17h1M14 17h1"/></svg>',
    handshake: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m11 17 2 2a3 3 0 0 0 4.2 0l3.3-3.3a2 2 0 0 0 0-2.8l-5.4-5.4a2 2 0 0 0-2.8 0l-.8.8"/><path d="m13 7-2.5-2.5a2 2 0 0 0-2.8 0L3.5 8.7a2 2 0 0 0 0 2.8L9 17"/><path d="m8 12 3-3"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.3a2 2 0 1 1-4 0V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 1 1 4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H2.7a2 2 0 1 1 0-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 1 1 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.3a2 2 0 1 1 4 0V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.3a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.6 1Z"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
    truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 17H5V6h9v11"/><path d="M14 9h4l3 4v4h-3"/><circle cx="7" cy="17" r="2"/><circle cx="16" cy="17" r="2"/></svg>',
    driverFill: '<svg viewBox="0 0 48 48"><circle cx="24" cy="13" r="9" fill="#111"/><circle cx="24" cy="13" r="3.5" fill="#fff"/><path d="M7 45v-6c0-9 7.6-15 17-15s17 6 17 15v6Z" fill="#111"/><path d="M19 27v18M29 27v18" stroke="#fff" stroke-width="2.6"/></svg>',
    boxFill: '<svg viewBox="0 0 48 48"><path d="M24 3 43 13.5v21L24 45 5 34.5v-21Z" fill="#111"/><path d="M5 13.5 24 24l19-10.5M24 24v21" fill="none" stroke="#ef1017" stroke-width="2.6" stroke-linejoin="round"/></svg>',
    factoryFill: '<svg viewBox="0 0 48 48"><rect x="32" y="3" width="8" height="7" rx="1" fill="#ef1017"/><path d="M3 45V22l10 6.5V22l10 6.5V22l9 6V10h8v35Z" fill="#111"/><path d="M9 37h6M20 37h6M31 37h6" stroke="#fff" stroke-width="3.2"/></svg>',
    handshakeFill: '<svg viewBox="0 0 24 24" fill="none" stroke="#ef1017" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/></svg>',
    gearFill: '<svg viewBox="0 0 48 48"><circle cx="20" cy="20" r="12.5" fill="#111"/><circle cx="20" cy="20" r="14.5" fill="none" stroke="#111" stroke-width="5" stroke-dasharray="5.7 5.7"/><circle cx="20" cy="20" r="5" fill="#fff"/><circle cx="35" cy="35" r="11.5" fill="#fff"/><circle cx="35" cy="35" r="6.5" fill="#ef1017"/><circle cx="35" cy="35" r="8" fill="none" stroke="#ef1017" stroke-width="4" stroke-dasharray="4.2 4.2"/><circle cx="35" cy="35" r="2.6" fill="#fff"/></svg>',
    shieldFill: '<svg viewBox="0 0 48 48"><path d="M24 3 41 9v13c0 11-7.5 19-17 23C14.5 41 7 33 7 22V9Z" fill="#111"/><path d="m16 24 6 6 11-12" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    pinFill: '<svg viewBox="0 0 48 48"><ellipse cx="24" cy="41" rx="13" ry="4.5" fill="none" stroke="#ef1017" stroke-width="3"/><path d="M24 2c-8 0-14 6-14 14 0 10 14 25 14 25s14-15 14-25c0-8-6-14-14-14Z" fill="#111"/><circle cx="24" cy="16" r="5" fill="#fff"/></svg>',
    truckFill: '<svg viewBox="0 0 48 48"><rect x="2" y="10" width="28" height="22" rx="2" fill="#111"/><path d="M32 16h8l6 8v8H32Z" fill="#ef1017"/><path d="M35 19h4l3.5 5H35Z" fill="#fff"/><circle cx="11" cy="36" r="5" fill="#111" stroke="#fff" stroke-width="2"/><circle cx="38" cy="36" r="5" fill="#111" stroke="#fff" stroke-width="2"/></svg>',
    chevronUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 15 6-6 6 6"/></svg>',
    phoneFill: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#111" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1Z"/></svg>',
    phoneVerify: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/><path d="m9.5 10.5 2 2 3.5-4"/></svg>',
    arrowRight: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>',
    lockSmall: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><rect width="16" height="10" x="4" y="11" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    idCard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2.5"/><circle cx="8" cy="12" r="2.5"/><path d="M14 10h4M14 14h4"/></svg>',
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7.5 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.5Z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    upload: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M20 15v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4"/></svg>',
    opTruck: '<svg viewBox="0 0 120 72" aria-hidden="true"><rect x="4" y="10" width="68" height="40" rx="4" fill="#111"/><path d="M76 22h22c2.5 0 4.6 1.2 6 3.2l10.4 14.6c.7 1 1.1 2.2 1.1 3.4V50a4 4 0 0 1-4 4H76Z" fill="#ef1017"/><path d="M84 28h12.5l7.5 10.5H84Z" fill="#fff"/><rect x="2" y="50" width="114" height="6" rx="3" fill="#111"/><circle cx="24" cy="58" r="9" fill="#111" stroke="#fff" stroke-width="3"/><circle cx="24" cy="58" r="3" fill="#fff"/><circle cx="52" cy="58" r="9" fill="#111" stroke="#fff" stroke-width="3"/><circle cx="52" cy="58" r="3" fill="#fff"/><circle cx="96" cy="58" r="9" fill="#111" stroke="#fff" stroke-width="3"/><circle cx="96" cy="58" r="3" fill="#fff"/><path d="M14 20h40M14 28h28" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".35"/></svg>',
    opDriver: '<svg viewBox="0 0 96 96" aria-hidden="true"><path d="M26 30c0-4 2-8 6-9.5C36 18 42 16 48 16s12 2 16 4.5c4 1.5 6 5.5 6 9.5v3H26Z" fill="#111"/><rect x="24" y="32" width="48" height="6" rx="3" fill="#ef1017"/><circle cx="48" cy="24" r="4" fill="#fff"/><path d="M32 38c0 10 7 18 16 18s16-8 16-18Z" fill="#111"/><path d="M14 92V80c0-12 10-20 22-22l12 10 12-10c12 2 22 10 22 22v12Z" fill="#111"/><path d="M48 68 40 60l8-2 8 2Z" fill="#fff"/><path d="M48 68v24" stroke="#ef1017" stroke-width="4"/><path d="M34 62v30M62 62v30" stroke="#fff" stroke-width="3" opacity=".5"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/></svg>',
    globe: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="3"><path d="m20 6-11 11-5-5"/></svg>'
  };

  function root(path) {
    return `${page.root || ""}${path}`;
  }
  function go(path) {
    window.location.href = root(path);
  }
  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));
  }
  function brand(size = "sm", tag = "a") {
    const href = tag === "a" ? ` href="${root("index.php")}" aria-label="Wheeltrack home"` : "";
    return `<${tag} class="wt-logo wt-logo-${size}"${href}><span class="wt-logo-row"><span class="wt-pin"></span><span class="wt-word"><span>Wheel</span><span class="brand-red">track</span></span></span><span class="wt-tagline">Smarter tracking. Safer roads.</span></${tag}>`;
  }
  function callLink() {
    return `<a class="call-link" href="tel:${cfg.BUSINESS_PHONE}" aria-label="Call Us"><span class="call-icon">${icons.phone}</span><span>Call Us</span></a>`;
  }
  function topbar(back) {
    return `<header class="topbar">${back ? `<a class="back-link" href="${root(back)}" aria-label="Back">${icons.back}<span>Back</span></a>` : "<span></span>"}${brand("md")}${callLink()}</header>`;
  }
  function shell(inner, opts = {}) {
    return `<main class="shell ${opts.mainClass || ""}">${topbar(opts.back)}<section class="page ${opts.narrow ? "narrow" : ""} ${opts.wide ? "wide" : ""} ${opts.flow ? "flow" : ""} ${opts.pageClass || ""}">${inner}</section>${devbar()}</main>`;
  }
  function pageTitle(title, note) {
    return `<div class="title-row"><h1>${title}</h1><p class="subtle">${note}</p></div>`;
  }
  function iconCircle(name) {
    return `<span class="icon-circle">${icons[name]}</span>`;
  }
  function field(label, path, type = "text", attrs = "") {
    const value = store.getByPath(state, path) || "";
    if (type === "textarea") return `<div class="field"><label>${label}</label><textarea data-field="${path}" ${attrs}>${esc(value)}</textarea></div>`;
    if (type === "password") {
      const id = `pw-${path.replace(/\W/g, "-")}`;
      return `<div class="field"><label for="${id}">${label}</label><div class="pw-wrap"><input id="${id}" type="password" autocomplete="new-password" data-field="${path}" value="${esc(value)}" ${attrs}><button class="pw-eye" type="button" data-toggle-password aria-label="Show password" aria-pressed="false">${icons.eye}</button></div></div>`;
    }
    return `<div class="field"><label>${label}</label><input type="${type}" data-field="${path}" value="${esc(value)}" ${attrs}></div>`;
  }
  function selectField(label, path, options) {
    const value = store.getByPath(state, path) || "";
    return `<div class="field"><label>${label}</label><select data-field="${path}">${options.map((o) => `<option value="${esc(o)}" ${o === value ? "selected" : ""}>${o || "Select"}</option>`).join("")}</select></div>`;
  }
  function check(label, path, required = false) {
    return `<label class="check-row"><input type="checkbox" data-field="${path}" ${store.getByPath(state, path) ? "checked" : ""}><span>${label}${required ? " *" : ""}</span></label>`;
  }
  function upload(label, path, text) {
    const value = store.getByPath(state, path);
    return `<div class="field"><label>${label}</label><button class="upload" type="button" data-upload="${path}"><span><strong>${value ? "Document uploaded" : text}</strong><br><small>JPG/PNG/PDF (Max 2 MB). Prototype placeholder.</small></span></button></div>`;
  }
  function otp(path) {
    const chars = String(store.getByPath(state, path) || "").padEnd(6, " ").slice(0, 6).split("");
    return `<div class="otp-row" data-otp="${path}">${chars.map((char, index) => `<input class="otp" inputmode="numeric" maxlength="1" value="${esc(char.trim())}" data-otp-index="${index}">`).join("")}</div>`;
  }
  function badge(text, color = "") {
    return `<span class="badge ${color}">${text}</span>`;
  }
  function statusRow(label, status) {
    const cls = status === "ok" ? "ok" : status === "bad" ? "bad" : "wait";
    const mark = status === "ok" ? "✓" : status === "bad" ? "!" : "…";
    return `<div class="status-row"><span class="status-dot ${cls}">${mark}</span><span>${label}</span><span>${status === "ok" ? badge("Verified", "green") : status === "bad" ? badge("Rejected", "red") : badge("Pending", "yellow")}</span></div>`;
  }
  function stepper(steps, current, kind, flow) {
    const currentIndex = steps.findIndex(([id]) => id === current);
    const access = flow ? stepAccess(flow.key, currentIndex, flow.rules()) : null;
    return `<div class="stepper ${kind || ""}">${steps.map(([id, label, path], index) => {
      const status = access ? access[index] : index < currentIndex ? "done" : id === current ? "active" : "";
      const inner = `<span class="step-dot">${status === "done" ? "✓" : index + 1}</span><span>${label}</span>`;
      if (access && (status === "done" || status === "open")) return `<a class="step-item ${status} step-link" href="${root(path)}">${inner}</a>`;
      return `<div class="step-item ${status}" ${status === "active" ? 'aria-current="step"' : ""} ${status === "locked" ? 'aria-disabled="true"' : ""}>${inner}</div>`;
    }).join("")}</div>`;
  }
  const driverGroups = [
    ["Mobile", ["mobile", "mobile-otp"]],
    ["Email", ["email", "email-otp"]],
    ["Password", ["password"]],
    ["Consent", ["consent"]],
    ["Personal", ["personal-details"]],
    ["Identity", ["identity"]],
    ["Licence", ["driving-licence"]],
    ["Operation", ["operating-model"]]
  ];
  function flowStepper(groups, current) {
    const currentIndex = groups.findIndex(([, ids]) => ids.includes(current));
    return `<ol class="flow-stepper" aria-label="Registration progress">${groups.map(([label], index) => {
      const status = index < currentIndex ? "done" : index === currentIndex ? "active" : "";
      return `<li class="flow-step ${status}" ${status === "active" ? 'aria-current="step"' : ""}><span class="flow-dot">${status === "done" ? icons.check : index + 1}</span><span class="flow-label">${label}</span></li>`;
    }).join("")}</ol>`;
  }
  // Sidebar navigation: earlier steps are always reachable; a later step is reachable only if it was
  // reached before AND every earlier step's mandatory requirement is complete (no bypassing).
  function passwordValid() {
    const p = state.password;
    return p.value.length >= 8 && /\d/.test(p.value) && p.value === p.confirm;
  }
  function stepAccess(key, currentIndex, complete) {
    state.progress = state.progress || {};
    if (currentIndex > (state.progress[key] ?? -1)) {
      state.progress[key] = currentIndex;
      store.save(state);
    }
    const reached = state.progress[key];
    return complete.map((isDone, index) => {
      if (index === currentIndex) return "active";
      if (index < currentIndex) return "done";
      const open = index <= reached && complete.slice(0, index).every((fn) => fn());
      if (!open) return "locked";
      return isDone() ? "done" : "open";
    });
  }
  const driverFlowRules = () => [
    () => state.mobile.verified,
    () => state.email.verified,
    passwordValid,
    () => state.consent.terms && state.consent.privacy,
    () => true,
    () => state.kyc.status === "verified",
    () => !cfg.ENFORCE_DL_GATE || dlReady(),
    () => Boolean(state.operatingModel)
  ];
  const ownerFlowRules = () => [
    () => state.documents.rc === "verified",
    () => state.documents.rc === "verified",
    () => state.documents.insurance === "verified",
    () => state.documents.puc === "verified",
    () => state.documents.fitness === "verified",
    () => ["rc", "insurance", "puc", "fitness"].every((key) => state.documents[key] === "verified"),
    () => state.approvalState !== "Draft",
    () => state.approvalState === "Approved"
  ];
  const transporterFlow = {
    key: "transporter",
    rules: () => [
      () => state.transporter.found,
      () => state.transporter.requested,
      () => state.transporter.approval === "Transporter Approves",
      () => state.transporter.vehicleAssigned,
      () => true,
      () => true,
      () => state.finalApproved,
      () => true
    ]
  };
  function prevPath(steps, current, fallback) {
    const index = steps.findIndex(([id]) => id === current);
    return index <= 0 ? fallback : steps[index - 1][2];
  }
  function nextPath(steps, current, fallback) {
    const index = steps.findIndex(([id]) => id === current);
    return index < 0 || index >= steps.length - 1 ? fallback : steps[index + 1][2];
  }

  function renderLanding() {
    return `<main class="landing"><img class="landing-bg" src="${root("assets/images/landing-truck.png")}" alt="Commercial truck on a highway in a logistics city environment"><div class="landing-top">${callLink()}</div><section class="landing-content">${brand("xl", "div")}</section><div class="landing-actions"><a class="btn landing-register" href="${root("register/index.php")}">${icons.driver}<span>Register</span></a><a class="btn landing-login" href="${root("login.php")}">${icons.login}<span>Login</span></a></div>${devbar()}</main>`;
  }

  function renderRegister() {
    return shell(`<section class="selection-hero">${pageTitle("Registration Type", "Choose the profile that matches your role.")}
      <div class="profile-grid">
        ${choice("Driver", "Find nearby loads, bid your price, track trips, SOS, feed and payments.", "driverFill", "driver/mobile.php", "Driver")}
        ${choice("Transporter / Shipper", "Post loads, compare driver bids, track route and manage invoices.", "boxFill", "transporter/register.php", "Transporter / Shipper")}
        ${choice("Manufacturer", "Post offers, buy or sell old vehicles, message drivers and manage deals.", "factoryFill", "manufacturer/register.php", "Manufacturer")}
      </div>
      <a class="card partner-card" href="${root("business-partner.php")}" data-profile="Business Partner">${iconCircle("handshakeFill")}<span><strong>Business Partner</strong><small>OEM / parts, insurance, GPS and commercial vehicle partners.</small></span>${arrowAction()}</a>
      </section>`, { back: "index.php", wide: true });
  }
  function choice(title, text, icon, href, profile) {
    return `<a class="card choice-card" href="${root(href)}" data-profile="${esc(profile)}">${iconCircle(icon)}<h3>${title}</h3><p>${text}</p>${arrowAction()}</a>`;
  }
  function benefit(icon, title, text) {
    return `<div class="benefit"><span class="benefit-icon">${icons[icon]}</span><div><h3>${title}</h3><p>${text}</p></div></div>`;
  }
  function siteFooter() {
    const s = page.screen;
    const onboarding = /^(driver|owner|transporter):/.test(s) || /^business-(oem|insurance|gps|vehicle)$/.test(s) || /-register$/.test(s);
    if (onboarding) return "";
    const partner = page.screen === "business-partner" || page.screen === "register-business";
    const title = partner ? "Not sure which category fits your business?" : "Need help with Wheeltrack?";
    const text = partner ? "Talk to our partner team and we'll help you choose." : "Talk to our team and we'll guide you through it.";
    const cta = partner ? "Call Partner Team" : "Call Us";
    return `<footer class="site-footer"><div class="help-band"><div><strong>${title}</strong><span>${text}</span></div><a class="btn" href="tel:${cfg.BUSINESS_PHONE}">${icons.phone}<span>${cta}</span></a></div></footer>`;
  }
  function arrowAction() {
    return `<span class="arrow-action" aria-hidden="true">→</span>`;
  }

  function renderBusinessPartner() {
    return shell(`<section class="selection-hero business-selection">
      <div class="card partner-card partner-card-open">${iconCircle("handshakeFill")}<span><h1>Business Partner</h1><small>Choose a category to continue: OEM / parts, insurance, GPS or commercial vehicles.</small></span><a class="arrow-action collapse-action" href="${root("register/index.php")}" aria-label="Collapse and go back to registration types">${icons.chevronUp}</a></div>
      <div class="grid cols-4 partner-options">
        ${choice("OEM / Parts", "Sell truck parts, manage product stock, buyer requests and payments.", "gearFill", "business/oem-parts.php", "OEM / Parts")}
        ${choice("Insurance", "Offer insurance plans, manage policies and customer support.", "shieldFill", "business/insurance.php", "Insurance")}
        ${choice("GPS Companies", "Sell GPS devices, track vehicle location, billing and subscriptions.", "pinFill", "business/gps.php", "GPS Companies")}
        ${choice("Vehicle Manufacturer", "Sell new commercial vehicles, manage leads, bookings and payments.", "truckFill", "business/vehicle-manufacturer.php", "Vehicle Manufacturer")}
      </div>
      <section class="partner-benefits" aria-labelledby="partner-benefits-title">
        <h2 id="partner-benefits-title">Why partner with Wheeltrack?</h2>
        <div class="benefit-grid">
          ${benefit("driver", "Reach fleet owners & drivers", "Get your products in front of verified transporters and owner drivers.")}
          ${benefit("truck", "Leads in one place", "Track enquiries, bookings and requests from a single dashboard.")}
          ${benefit("shield", "Secure payments", "Collect payments and manage invoices without the paperwork.")}
          ${benefit("handshake", "Dedicated support", "Our partner team helps you set up and grow on Wheeltrack.")}
        </div>
      </section>
      </section>`, { back: "register/index.php", wide: true });
  }

  function renderLogin() {
    const user = store.getByPath(state, "login.user") || "";
    if (store.getByPath(state, "login.password")) store.setByPath(state, "login.password", "");
    return `<main class="login-screen">
      <aside class="login-visual">
        <img src="${root("assets/images/login-sunset-truck.png")}" alt="">
        <a class="login-back" href="${root("index.php")}">${icons.back}<span>Back</span></a>
        <div class="login-visual-copy">
          <p class="login-kicker">Wheeltrack</p>
          <h2>Every truck. Every trip.<br>One place.</h2>
          <p>Manage your vehicles, documents and trips from one place.</p>
        </div>
      </aside>
      <section class="login-side">
        <header class="login-head">${callLink()}</header>
        <div class="login-body">
          <div class="login-hero">${brand("xl")}</div>
          <form class="auth-card" data-form="login" novalidate>
            <h1>Login</h1>
            <p class="subtle">Welcome back! Please login to your account.</p>
            <div class="form-alert" data-login-alert role="alert" hidden></div>
            <div class="auth-field">
              <label for="login-user">Email or Mobile Number</label>
              <div class="auth-input">${icons.mail}<input id="login-user" name="username" type="text" autocomplete="username" autocapitalize="none" spellcheck="false" data-field="login.user" value="${esc(user)}" placeholder="you@example.com or 98XXXXXXXX" aria-describedby="login-user-error"></div>
              <p class="field-error" id="login-user-error"></p>
            </div>
            <div class="auth-field">
              <label for="login-password">Password</label>
              <div class="auth-input">${icons.lock}<input id="login-password" name="password" type="password" autocomplete="current-password" placeholder="Enter your password" aria-describedby="login-password-error"><button class="auth-eye" type="button" data-toggle-password aria-label="Show password" aria-pressed="false">${icons.eye}</button></div>
              <p class="field-error" id="login-password-error"></p>
            </div>
            <button class="btn full auth-submit" type="submit"><span class="spinner" aria-hidden="true"></span>${icons.login}<span>Login</span></button>
            <p class="auth-forgot-row"><a class="auth-forgot" href="${root("forgot-password.php")}">Forgot password?</a></p>
            <p class="auth-register">Don't have an account? <a href="${root("register/index.php")}">Register</a></p>
          </form>
        </div>
      </section>${devbar()}
    </main>`;
  }
  function renderForgot() {
    return shell(`${pageTitle("Forgot Password", "Enter your account details and reset the password with a demo OTP.")}
      <div class="card panel">${field("Email or Mobile Number", "forgot.user")}${otp("forgot.otp")}<p class="notice">Demo OTP is <strong>${cfg.DEMO_MOBILE_OTP}</strong>.</p>${field("New Password", "forgot.password", "password")}${field("Confirm Password", "forgot.confirm", "password")}<button class="btn full" type="button" data-action="reset-password">Reset Password</button></div>`, { back: "login.php", narrow: true });
  }

  function renderDriver(step) {
    if (state.personal.language !== state.mobile.language) store.setByPath(state, "personal.language", state.mobile.language || "English");
    const back = "register/index.php";
    const body = step === "mobile" ? mobileStep() : driverBody(step);
    return shell(driverWorkspace(step, body), { back, mainClass: "ws-shell", pageClass: "ws-page" });
  }
  const driverStepInfo = [
    ["Mobile", "Verify phone number"],
    ["Email", "Verify email address"],
    ["Password", "Secure your account"],
    ["Consent", "Terms & preferences"],
    ["Personal Details", "Your basic information"],
    ["Identity Verification", "KYC & selfie checks"],
    ["Driving Licence", "Licence verification"],
    ["Operating Model", "How you operate"]
  ];
  const mobileCopy = {
    English: {
      title: "Verify your mobile number",
      note: "We'll send a one-time password to verify your number.",
      label: "Mobile Number",
      placeholder: "Enter 10-digit mobile number",
      send: "Send OTP",
      sending: "Sending OTP…",
      secure: "Your mobile number is used only for account verification.",
      empty: "Enter your mobile number.",
      invalid: "Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9."
    }
  };
  function mobileText() {
    return mobileCopy.English;
  }
  function isValidMobile(value) {
    return /^[6-9]\d{9}$/.test(String(value || ""));
  }
  function driverWorkspace(step, body) {
    return onboardWorkspace(step, body, {
      key: "driver",
      rules: driverFlowRules(),
      paths: driverGroups.map(([, ids]) => driverSteps.find(([id]) => id === ids[0])[2]),
      groups: driverGroups,
      info: driverStepInfo,
      label: "Driver registration progress",
      kicker: "Driver Onboarding",
      heading: 'Let\'s get you<br><span class="brand-red">road-ready.</span>'
    });
  }
  function onboardWorkspace(step, body, flow) {
    const driverGroups = flow.groups;
    const driverStepInfo = flow.info;
    const currentIndex = driverGroups.findIndex(([, ids]) => ids.includes(step));
    const total = driverStepInfo.length;
    const access = stepAccess(flow.key, currentIndex, flow.rules);
    return `<div class="ws ws-${step}">
      <aside class="ws-side" aria-label="${flow.label}">
        <p class="ws-kicker">${icons.driver}<span>${flow.kicker}</span></p>
        <h2 class="ws-heading">${flow.heading}</h2>
        <p class="ws-status"><span class="ws-status-dot" aria-hidden="true"></span><span><strong>Step ${currentIndex + 1} of ${total}</strong><small>${currentIndex === 0 ? "Getting started" : driverStepInfo[currentIndex][1]}</small></span></p>
        <ol class="ws-steps">${driverStepInfo.map(([label, sub], index) => {
          const status = access[index];
          const link = (status === "done" || status === "open") ? `<a class="ws-step-hit" href="${root(flow.paths[index])}" aria-label="Go to ${label}"></a>` : "";
          return `<li class="ws-step ${status} ${link ? "is-link" : ""}" ${status === "active" ? 'aria-current="step"' : ""} ${status === "locked" ? 'aria-disabled="true"' : ""}><span class="ws-dot">${status === "done" ? icons.check : String(index + 1).padStart(2, "0")}</span><span class="ws-step-text"><strong>${label}</strong><small>${sub}</small></span>${link}</li>`;
        }).join("")}</ol>
        <div class="ws-compact" aria-hidden="true"><span>Step ${currentIndex + 1} of ${total} · ${driverStepInfo[currentIndex][0]}</span><span class="ws-bar"><span style="width:${((currentIndex + 1) / total) * 100}%"></span></span></div>
      </aside>
      <section class="ws-main">
        <div class="ws-toolbar">${langSwitch()}</div>
        <div class="ws-content">
          <p class="ws-count">Step ${String(currentIndex + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}</p>
          ${body}
        </div>
      </section>
    </div>`;
  }
  function mobileStep() {
    const t = mobileText();
    const number = String(state.mobile.number || "").replace(/\D/g, "").slice(0, 10);
    return `<div class="ws-title">
        <span class="ws-title-icon">${icons.phoneVerify}</span>
        <div><h1>${t.title}</h1><p>${t.note}</p></div>
      </div>
      <form class="ws-form" data-form="mobile" novalidate>
        <div class="ws-field">
          <label for="mobile-number">${t.label}</label>
          <div class="ws-phone">
            ${icons.phone}
            <select class="ws-code" data-field="mobile.code" aria-label="Country code">${["+91"].map((c) => `<option ${c === state.mobile.code ? "selected" : ""}>${c}</option>`).join("")}</select>
            <input id="mobile-number" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="10" placeholder="${t.placeholder}" data-field="mobile.number" value="${esc(number)}" aria-describedby="mobile-number-error" aria-invalid="false" required>
          </div>
          <p class="field-error" id="mobile-number-error" aria-live="polite"></p>
        </div>
        <button class="ws-cta" type="submit" ${isValidMobile(number) ? "" : "disabled"}><span class="spinner" aria-hidden="true"></span><span class="ws-cta-label">${t.send}</span>${icons.arrowRight}</button>
        <p class="ws-secure">${icons.lockSmall}<span>${t.secure}</span></p>
      </form>`;
  }
  const driverStepIcons = {
    "mobile-otp": "phoneVerify",
    email: "mail",
    "email-otp": "mail",
    password: "lock",
    consent: "shield",
    "personal-details": "driver",
    identity: "shield",
    "driving-licence": "idCard",
    "operating-model": "truck"
  };
  function pdHead(icon, title, text) {
    return `<header class="pd-head"><span class="pd-head-icon">${icons[icon]}</span><div><h2>${title}</h2><p>${text}</p></div></header>`;
  }
  function pdField(label, path, opts = {}) {
    const id = `pd-${path.replace(/\W/g, "-")}`;
    const value = esc(store.getByPath(state, path) || "");
    const attrs = `id="${id}" data-field="${path}"${opts.autocomplete ? ` autocomplete="${opts.autocomplete}"` : ""}${opts.inputmode ? ` inputmode="${opts.inputmode}"` : ""}${opts.maxlength ? ` maxlength="${opts.maxlength}"` : ""}${opts.required ? ' aria-required="true"' : ""}`;
    const control = opts.type === "textarea" ? `<textarea ${attrs} rows="3">${value}</textarea>` : `<input type="${opts.type || "text"}" ${attrs} value="${value}">`;
    const marker = opts.required ? ' <span class="req">*</span>' : opts.recommended ? ' <span class="tag-rec">Recommended</span>' : "";
    return `<div class="pd-field"><label for="${id}">${label}${marker}</label>${control}</div>`;
  }
  function pdSelect(label, path, options, required) {
    const id = `pd-${path.replace(/\W/g, "-")}`;
    const value = store.getByPath(state, path) || "";
    return `<div class="pd-field"><label for="${id}">${label}${required ? ' <span class="req">*</span>' : ""}</label><select id="${id}" data-field="${path}">${options.map((o) => `<option value="${esc(o)}" ${o === value ? "selected" : ""}>${o || "Select"}</option>`).join("")}</select></div>`;
  }
  function docUpload(label, path, opts = {}) {
    const done = Boolean(store.getByPath(state, path));
    const marker = opts.required ? ' <span class="req">*</span>' : opts.optionalNote ? ' <span class="tag-rec">Optional if API verified</span>' : "";
    return `<div class="doc-up ${done ? "done" : ""}"><span class="doc-icon">${done ? icons.check : icons.upload}</span><span class="doc-text"><strong>${label}${marker}</strong><small>${done ? "Uploaded" : opts.hint || ""}</small></span><button class="pd-upload-btn" type="button" data-upload="${path}">${done ? "Replace" : "Upload"}</button></div>`;
  }
  function protoBox(label, text, attrs) {
    if (!cfg.PROTOTYPE_MODE) return "";
    return `<div class="proto-box" role="note"><span class="proto-tag">Prototype only</span><span class="proto-text">${text}</span><button class="proto-btn" type="button" ${attrs}>${label}</button></div>`;
  }
  function dlReady() {
    const dl = state.dl;
    return Boolean(dl.number && dl.number.trim() && dl.dob && dl.state && dl.document && dl.status === "verified");
  }
  function dlActions() {
    return pdActions("driver/identity.php", "driver/operating-model.php", !cfg.ENFORCE_DL_GATE || dlReady(), "Complete the required licence details and verification to continue.");
  }
  function pdActions(back, next, enabled = true, hint = "Complete all identity checks to continue.") {
    const cta = enabled
      ? `<a class="ws-cta pd-next" href="${root(next)}"><span>Continue</span>${icons.arrowRight}</a>`
      : `<div class="pd-next-wrap"><button class="ws-cta pd-next" type="button" disabled aria-describedby="pd-next-hint"><span>Continue</span>${icons.arrowRight}</button><small id="pd-next-hint">${hint}</small></div>`;
    return `<div class="pd-actions"><a class="pd-back" href="${root(back)}">${icons.back}<span>Back</span></a>${cta}</div>`;
  }
  function wsTitle(step, title, note) {
    return `<div class="ws-title"><span class="ws-title-icon">${icons[driverStepIcons[step]] || icons.phoneVerify}</span><div><h1>${title}</h1><p>${note}</p></div></div>`;
  }
  function langSwitch() {
    const current = state.mobile.language === "Hindi" ? "Hindi" : "English";
    return `<div class="lang-switch" role="radiogroup" aria-label="Preferred language (required)" aria-required="true">${[["English", "English"], ["Hindi", "हिंदी"]].map(([value, label]) => `<label class="${value === current ? "selected" : ""}"><input type="radio" name="mobileLanguage" value="${value}" ${value === current ? "checked" : ""}><span>${label}</span></label>`).join("")}</div>`;
  }


  function driverBody(step) {
    if (step === "mobile-otp") {
      return `${wsTitle(step, "Enter Mobile OTP", `Use demo OTP ${cfg.DEMO_MOBILE_OTP} to verify ${state.mobile.code} ${state.mobile.number || "your mobile number"}.`)}
        <div class="card panel">${otp("mobile.otp")}${state.mobile.verified ? '<p class="notice success">Mobile OTP verified.</p>' : ""}<button class="btn full" type="button" data-verify="mobile">Verify & Continue</button></div>`;
    }
    if (step === "email") {
      return `${wsTitle(step, "Verify Email Address", "We will send an OTP to verify your email address.")}
        <div class="card panel">${field("Email Address", "email.address", "email")}<button class="btn full" type="button" data-next="driver/email-otp.php">Send OTP</button></div>`;
    }
    if (step === "email-otp") {
      return `${wsTitle(step, "Enter Email OTP", `Use demo OTP ${cfg.DEMO_EMAIL_OTP} to verify ${state.email.address || "your email"}.`)}
        <div class="card panel">${otp("email.otp")}${state.email.verified ? '<p class="notice success">Email OTP verified.</p>' : ""}<button class="btn full" type="button" data-verify="email">Verify & Continue</button></div>`;
    }
    if (step === "password") {
      return `${wsTitle(step, "Set Your Password", "Use at least 8 characters with a number.")}
        <div class="card panel">${field("Password", "password.value", "password")}${field("Confirm Password", "password.confirm", "password")}<button class="btn full" type="button" data-action="password-next">Continue</button></div>`;
    }
    if (step === "consent") {
      return `${wsTitle(step, "Terms & Consent", "Review the required terms before moving ahead.")}
        <div class="card panel">${check("I agree to Terms & Conditions", "consent.terms", true)}${check("I agree to Privacy Policy", "consent.privacy", true)}${check("I agree to receive relevant communication via SMS, Email or WhatsApp. (Optional)", "consent.communication")}<button class="btn full" type="button" data-action="consent-next">Continue</button></div>`;
    }
    if (step === "personal-details") {
      const p = state.personal;
      return `${wsTitle(step, "Personal Details", "Tell us a little about yourself so we can complete your driver profile.")}
        <div class="pd">
          <section class="pd-section">
            ${pdHead("driver", "Basic Information", "Your personal and contact information")}
            <div class="pd-grid cols-3">
              ${pdField("First Name", "personal.first", { required: true, autocomplete: "given-name" })}
              ${pdField("Middle Name", "personal.middle", { autocomplete: "additional-name" })}
              ${pdField("Last Name", "personal.last", { required: true, autocomplete: "family-name" })}
              ${pdField("Date of Birth", "personal.dob", { required: true, type: "date", autocomplete: "bday" })}
              ${pdSelect("Gender", "personal.gender", ["", "Male", "Female", "Other"])}
              ${pdField("Father's / Guardian's Name", "personal.father")}
            </div>
            <div class="pd-grid cols-2">
              ${pdField("Emergency Contact Name", "personal.emergencyName", { recommended: true })}
              <div class="pd-field"><label for="pd-personal-emergencyNumber">Emergency Contact Number <span class="tag-rec">Recommended</span></label><div class="ws-phone pd-phone"><span class="pd-code">+91</span><input id="pd-personal-emergencyNumber" type="tel" inputmode="numeric" maxlength="10" placeholder="Enter contact number" data-field="personal.emergencyNumber" value="${esc(p.emergencyNumber)}"></div></div>
            </div>
          </section>
          <section class="pd-section">
            ${pdHead("pin", "Address", "Where you currently live")}
            ${pdField("Current Address", "personal.current", { required: true, type: "textarea", autocomplete: "street-address" })}
            <label class="pd-check"><input type="checkbox" data-field="personal.sameAddress" ${p.sameAddress ? "checked" : ""}><span>Permanent address is the same as current address</span></label>
            ${p.sameAddress ? "" : pdField("Permanent Address", "personal.permanent", { type: "textarea" })}
            <div class="pd-grid cols-3">
              ${pdField("State", "personal.state", { required: true, autocomplete: "address-level1" })}
              ${pdField("District / City", "personal.city", { required: true, autocomplete: "address-level2" })}
              ${pdField("Pincode", "personal.pincode", { required: true, autocomplete: "postal-code", inputmode: "numeric", maxlength: 6 })}
            </div>
          </section>
          <section class="pd-section">
            ${pdHead("camera", "Profile Photo", "Add a clear photo for your driver profile")}
            <div class="pd-photo ${p.photo ? "done" : ""}">
              <span class="pd-avatar">${p.photo ? icons.check : icons.driver}</span>
              <div class="pd-photo-text">
                <strong>Profile Photo <span class="req">*</span></strong>
                <span>${p.photo ? "Photo uploaded" : "Upload a clear recent photo"}</span>
                <span class="pd-verify">Face / liveness verification: ${badge(state.kyc.status === "verified" ? "Verified" : "Pending", state.kyc.status === "verified" ? "green" : "yellow")}</span>
                <button class="pd-upload-btn" type="button" data-upload="personal.photo">${icons.upload}<span>${p.photo ? "Replace Photo" : "Upload Photo"}</span></button>
              </div>
              <small class="pd-photo-note">JPG or PNG • Max 2 MB</small>
            </div>
          </section>
          <div class="pd-actions">
            <a class="pd-back" href="${root("driver/consent.php")}">${icons.back}<span>Back</span></a>
            <a class="ws-cta pd-next" href="${root("driver/identity.php")}"><span>Continue</span>${icons.arrowRight}</a>
          </div>
        </div>`;
    }
    if (step === "identity") {
      const verified = state.kyc.status === "verified";
      const stages = [
        ["Address", "ok"],
        ["Identity Verification", verified ? "ok" : "wait"],
        ["KYC / DigiLocker", verified ? "ok" : "wait"],
        ["Identity Confirmation", verified ? "ok" : "wait"],
        ["Selfie Capture", verified ? "ok" : "wait"],
        ["Liveness Check", verified ? "ok" : "wait"],
        ["Identity Verified", verified ? "ok" : "wait"]
      ];
      return `${wsTitle(step, "Identity Verification", "Complete KYC status checks for the driver profile.")}
        <div class="pd">
          <section class="pd-section">
            ${pdHead("shield", "Verification Progress", "Each check completes in this order")}
            <ol class="id-flow" data-id-flow>${stages.map(([label, status], index) => `<li class="id-stage ${status === "ok" ? "is-done" : "is-pending"}"><span class="id-dot">${status === "ok" ? icons.check : index + 1}</span><span class="id-label">${label}</span>${badge(status === "ok" ? "Completed" : "Pending", status === "ok" ? "green" : "yellow")}</li>`).join("")}</ol>
          </section>
          ${verified ? "" : protoBox("Simulate KYC verification", "Runs all identity checks in order so you can continue to Step 07.", 'data-action="simulate-kyc"')}
          ${pdActions("driver/personal-details.php", "driver/driving-licence.php", stages.every(([, status]) => status === "ok"))}
        </div>`;
    }
    if (step === "driving-licence") {
      const verified = state.dl.status === "verified";
      const api = (value) => verified ? value : '<span class="api-wait">Fetched after verification</span>';
      return `${wsTitle(step, "Driving Licence", "Enter and verify licence information.")}
        <div class="pd">
          <section class="pd-section">
            ${pdHead("idCard", "Licence Details", "As printed on your driving licence")}
            <div class="pd-grid cols-3">
              ${pdField("Driving Licence Number", "dl.number", { required: true })}
              ${pdField("Date of Birth", "dl.dob", { required: true, type: "date" })}
              ${pdSelect("Issuing State", "dl.state", ["", "Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Gujarat"], true)}
            </div>
          </section>
          <section class="pd-section">
            ${pdHead("upload", "Licence Documents", "Front and back images are optional once the licence is verified via API")}
            ${docUpload("DL Document", "dl.document", { required: true, hint: "JPG/PNG/PDF • Max 2 MB" })}
            <div class="pd-grid cols-2">
              ${docUpload("DL Front Image", "dl.front", { optionalNote: true, hint: "JPG/PNG • Max 2 MB" })}
              ${docUpload("DL Back Image", "dl.back", { optionalNote: true, hint: "JPG/PNG • Max 2 MB" })}
            </div>
          </section>
          <section class="pd-section">
            ${pdHead("shield", "Licence Verification", "These details are returned by the licence verification API")}
            <dl class="api-grid">
              <div><dt>DL Status</dt><dd>${badge(verified ? "DL Verified" : "Pending Verification", verified ? "green" : "yellow")}</dd></div>
              <div><dt>Licence Type / Class</dt><dd>${api("LMV / HMV")}</dd></div>
              <div><dt>Issue Date</dt><dd>${api("12 Jan 2020")}</dd></div>
              <div><dt>Expiry Date</dt><dd>${api("12 Jan 2036")}</dd></div>
              <div class="wide"><dt>Authorised Vehicle Classes</dt><dd>${api("LCV, HCV, Trailer")}</dd></div>
            </dl>
          </section>
          ${verified ? "" : protoBox("Simulate licence API verification", "Marks the licence as verified and fills the API fields.", 'data-simulate="dl"')}
          ${dlActions()}
        </div>`;
    }
    return `${wsTitle(step, "Operating Model", "Select the option that best describes how you drive.")}
      <div class="card panel"><div class="op-cards" role="radiogroup" aria-label="Operating model">${operateChoice("owner", "Owner Driver", "I own/manage<br>a vehicle and drive.", "opTruck")}${operateChoice("transporter", "Transporter Driver", "I drive for a transporter.<br>I will enter my Transporter ID.", "opDriver")}</div><button class="btn full" type="button" data-action="choose-operating">Continue</button></div>`;
  }
  function operateChoice(value, title, text, icon) {
    const selected = state.operatingModel === value;
    return `<label class="op-card ${selected ? "selected" : ""}"><input type="radio" name="operatingModel" value="${value}" ${selected ? "checked" : ""}><span class="op-radio" aria-hidden="true"></span><span class="op-art">${icons[icon]}</span><strong class="op-title">${title}</strong><span class="op-text">${text}</span></label>`;
  }

  const ownerGroups = [
    ["Vehicle Registration", ["vehicle"]],
    ["RC Verification", ["rc"]],
    ["Insurance", ["insurance"]],
    ["PUC", ["puc"]],
    ["Fitness / Permit", ["fitness-permit"]],
    ["Compliance Check", ["compliance"]],
    ["Exception Review", ["review"]],
    ["Approved", ["status"]]
  ];
  const ownerStepInfo = [
    ["Vehicle Registration", "Enter registration number"],
    ["RC Verification", "Vehicle details from RC"],
    ["Insurance Verification", "Policy & document"],
    ["PUC Verification", "Pollution certificate"],
    ["Fitness / Permit", "Where applicable"],
    ["Compliance Check", "Automated checks"],
    ["Exception Review", "Wheeltrack review"],
    ["Approved", "Ready to start"]
  ];
  const ownerTitleIcons = { vehicle: "truck", rc: "idCard", insurance: "shield", puc: "check", "fitness-permit": "idCard", compliance: "shield", review: "driver", status: "check" };
  // Prototype RC response (no RC API integrated yet). Only used when cfg.PROTOTYPE_MODE is true.
  const PROTOTYPE_RC = { type: "HCV", body: "Container", bodyLength: "32 ft", payload: "16" };
  function renderOwner(step) {
    if (step === "dashboard") return dashboard(true);
    const back = "driver/operating-model.php";
    return shell(onboardWorkspace(step, ownerBody(step), {
      key: "owner",
      rules: ownerFlowRules(),
      paths: ownerGroups.map(([, ids]) => ownerSteps.find(([id]) => id === ids[0])[2]),
      groups: ownerGroups,
      info: ownerStepInfo,
      label: "Owner driver onboarding progress",
      kicker: "Owner Driver",
      heading: 'Get your vehicle<br><span class="brand-red">road-ready.</span>'
    }), { back, mainClass: "ws-shell", pageClass: "ws-page" });
  }
  function ownerTitle(step, title, note) {
    return `<div class="ws-title"><span class="ws-title-icon">${icons[ownerTitleIcons[step]] || icons.truck}</span><div><h1>${title}</h1><p>${note}</p></div></div>`;
  }
  function verifiedBadge(ok, okText = "Verified", waitText = "Pending verification") {
    return badge(ok ? okText : waitText, ok ? "green" : "yellow");
  }
  function ownerBody(step) {
    const v = state.vehicle;
    const rcOk = state.documents.rc === "verified";
    if (step === "vehicle") {
      return `${ownerTitle(step, "Vehicle Registration", "Enter your vehicle registration number to verify the RC.")}
        <form class="ws-form" data-form="rc" novalidate>
          <div class="ws-field">
            <label for="vehicle-reg">Vehicle Registration Number <span class="req">*</span></label>
            <div class="ws-phone reg-input">${icons.truck}<input id="vehicle-reg" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="13" placeholder="e.g. MH12AB1234" data-field="vehicle.registration" value="${esc(v.registration)}" aria-describedby="vehicle-reg-error"></div>
            <p class="field-error" id="vehicle-reg-error" aria-live="polite"></p>
          </div>
          ${rcOk ? `<p class="notice success">RC verified for <strong>${esc(v.registration)}</strong>. Vehicle details have been fetched.</p>` : ""}
          <button class="ws-cta" type="submit"><span class="spinner" aria-hidden="true"></span><span class="ws-cta-label">${rcOk ? "Re-verify RC" : "Verify RC"}</span>${icons.arrowRight}</button>
          ${rcOk ? `<a class="pd-back center-link" href="${root("driver/owner/rc.php")}">View RC details${icons.arrowRight}</a>` : ""}
          <p class="ws-secure">${icons.lockSmall}<span>Vehicle details are fetched from your Registration Certificate after verification.</span></p>
        </form>`;
    }
    if (step === "rc") {
      if (!rcOk) {
        return `${ownerTitle(step, "RC Verification", "Vehicle details are fetched from your Registration Certificate.")}
          <div class="pd"><p class="notice warning">Verify your vehicle registration number first.</p>${pdActions("driver/owner/vehicle.php", "driver/owner/vehicle.php", false, "RC verification is pending.")}</div>`;
      }
      return `${ownerTitle(step, "RC Verification", "Vehicle details fetched from your Registration Certificate.")}
        <div class="pd">
          <section class="pd-section">
            ${pdHead("shield", "Verified from RC", "Auto-filled from RC verification")}
            <dl class="api-grid">
              <div><dt>Vehicle Registration Number</dt><dd>${esc(v.registration)} ${verifiedBadge(true)}</dd></div>
              <div><dt>Vehicle Type</dt><dd>${esc(v.type)} <span class="tag-rec">From RC</span></dd></div>
              <div><dt>Body Type</dt><dd>${esc(v.body)} <span class="tag-rec">From RC</span></dd></div>
              <div><dt>Body Length</dt><dd>${esc(v.bodyLength)} <span class="tag-rec">From RC</span></dd></div>
              <div class="wide"><dt>Payload Capacity (tons)</dt><dd>${esc(v.payload)} <span class="tag-rec">From RC</span></dd></div>
            </dl>
          </section>
          <section class="pd-section">
            ${pdHead("truck", "Vehicle Operations", "Details not available on the RC")}
            <div class="pd-grid cols-3">
              ${pdField("Cargo Type Supported (Can Carry)", "vehicle.cargo")}
              ${pdField("Operating Area (Permit)", "vehicle.area")}
              ${pdSelect("Availability", "vehicle.availability", ["Available", "Unavailable", "On Trip"])}
              ${pdField("Bed Length", "vehicle.bedLength")}
              ${pdField("Bed Height", "vehicle.bedHeight")}
              ${pdField("Bed Width", "vehicle.bedWidth")}
            </div>
          </section>
          <section class="pd-section">
            ${pdHead("upload", "RC Document", "Registration Certificate")}
            ${docUpload("RC Upload", "uploads.rc", { required: true, hint: "JPG/PNG/PDF • Max 2 MB" })}
          </section>
          ${pdActions("driver/owner/vehicle.php", "driver/owner/insurance.php")}
        </div>`;
    }
    if (["insurance", "puc", "fitness-permit"].includes(step)) return ownerDoc(step);
    if (step === "compliance") {
      const checks = [["RC Verification", "rc"], ["Insurance Verification", "insurance"], ["PUC Verification", "puc"], ["Fitness / Permit", "fitness"]];
      return `${ownerTitle(step, "Compliance Check", "Automated checks across your vehicle documents.")}
        <div class="pd">
          <section class="pd-section">
            ${pdHead("shield", "Automated Compliance Check", "Each document is checked for validity")}
            <ol class="id-flow">${checks.map(([label, key], index) => {
              const ok = state.documents[key] === "verified";
              return `<li class="id-stage ${ok ? "is-done" : "is-pending"}"><span class="id-dot">${ok ? icons.check : index + 1}</span><span class="id-label">${label}</span>${badge(ok ? "Passed" : "Pending", ok ? "green" : "yellow")}</li>`;
            }).join("")}</ol>
          </section>
          ${pdActions("driver/owner/fitness-permit.php", "driver/owner/review.php")}
        </div>`;
    }
    if (step === "review") {
      const rows = ["Personal Details", "Identity/KYC", "Driving Licence", "Vehicle", "RC", "Insurance", "PUC", "Fitness/Permit", "Terms/Consent"];
      return `${ownerTitle(step, "Wheeltrack Exception Review", "Submit your application. Wheeltrack reviews any exceptions before approval.")}
        <div class="pd">
          <section class="pd-section">
            ${pdHead("idCard", "Application Summary", "Check each section before submitting")}
            <ul class="review-list">${rows.map((row) => `<li><span>${row}</span>${badge("Ready", "green")}${editLink(row)}</li>`).join("")}</ul>
          </section>
          <div class="pd-actions"><a class="pd-back" href="${root("driver/owner/compliance.php")}">${icons.back}<span>Back</span></a><button class="ws-cta pd-next" type="button" data-action="submit-owner"><span>Submit for Review</span>${icons.arrowRight}</button></div>
        </div>`;
    }
    const approved = state.approvalState === "Approved";
    if (!approved && state.approvalState === "Draft") {
      return `${ownerTitle(step, "Application not submitted", "Submit your application for Wheeltrack review to get approved.")}
        <div class="pd">${pdActions("driver/owner/compliance.php", "driver/owner/review.php", true).replace("<span>Continue</span>", "<span>Go to Review</span>")}</div>`;
    }
    return `${ownerTitle(step, approved ? "Approved" : "Under Wheeltrack Review", approved ? "Your owner driver profile and vehicle are approved." : "We'll notify you once the review is complete.")}
      <div class="pd">
        <div class="approved-card ${approved ? "ok" : ""}">
          <span class="approved-icon">${approved ? icons.check : icons.shield}</span>
          <div><strong>${approved ? "APPROVED" : esc(state.approvalState)}</strong><span>${esc(v.registration || "Your vehicle")} · Owner Driver</span></div>
        </div>
        ${approved ? `<a class="ws-cta" href="${root("driver/owner/dashboard.php")}"><span>Go to Dashboard</span>${icons.arrowRight}</a>` : ""}
      </div>`;
  }
  function ownerDoc(step) {
    const map = {
      insurance: ["Insurance Verification", "insurance", "Insurance Upload", "driver/owner/puc.php", "Your vehicle insurance policy."],
      puc: ["PUC Verification", "puc", "PUC Upload", "driver/owner/fitness-permit.php", "Pollution Under Control certificate."],
      "fitness-permit": ["Fitness / Permit", "fitness", "Fitness Certificate Upload", "driver/owner/compliance.php", "Fitness certificate and permit, where applicable."]
    };
    const [title, key, uploadLabel, next, note] = map[step];
    const ok = state.documents[key] === "verified";
    const fields = key === "insurance"
      ? `<div class="pd-grid cols-2">${pdField("Insurance Company", "insurance.company")}${pdField("Policy Number", "insurance.policy")}${pdField("Valid From", "insurance.from", { type: "date" })}${pdField("Valid Upto", "insurance.upto", { type: "date" })}</div>`
      : key === "puc"
        ? `<div class="pd-grid cols-3">${pdField("PUC Number", "puc.number")}${pdField("Valid From", "puc.from", { type: "date" })}${pdField("Valid Upto", "puc.upto", { type: "date" })}</div>`
        : `<div class="pd-grid cols-2">${pdField("Fitness Certificate Number", "fitness.certificate")}${pdField("Fitness Valid Upto", "fitness.valid", { type: "date" })}${pdField("Permit Number", "fitness.permit")}${pdField("Permit Valid Upto", "fitness.permitValid", { type: "date" })}</div>`;
    return `${ownerTitle(step, title, note)}
      <div class="pd">
        <section class="pd-section">
          ${pdHead("idCard", `${title.replace(" Verification", "")} Details`, "As printed on the certificate")}
          ${fields}
        </section>
        <section class="pd-section">
          ${pdHead("upload", "Document", "Required for verification")}
          ${docUpload(uploadLabel, `uploads.${key}`, { required: true, hint: "JPG/PNG/PDF • Max 2 MB" })}
          <div class="verify-row"><span>Status ${verifiedBadge(ok)}</span>${ok ? "" : `<button class="pd-upload-btn" type="button" data-action="owner-verify" data-key="${key}">${icons.shield}<span>Verify ${title.replace(" Verification", "")}</span></button>`}</div>
        </section>
        ${pdActions(prevPath(ownerSteps, step, "driver/owner/vehicle.php"), next)}
      </div>`;
  }
  function editLink(row) {
    const map = {
      "Personal Details": "driver/personal-details.php",
      "Identity/KYC": "driver/identity.php",
      "Driving Licence": "driver/driving-licence.php",
      Vehicle: "driver/owner/vehicle.php",
      RC: "driver/owner/rc.php",
      Insurance: "driver/owner/insurance.php",
      PUC: "driver/owner/puc.php",
      "Fitness/Permit": "driver/owner/fitness-permit.php",
      "Terms/Consent": "driver/consent.php"
    };
    return `<a class="btn ghost" href="${root(map[row])}">Edit</a>`;
  }

  function renderTransporter(step) {
    if (step === "dashboard") return dashboard(false);
    return shell(`<div class="ws-toolbar">${langSwitch()}</div>${stepper(transporterSteps, step, "trans-stepper", transporterFlow)}${transporterBody(step)}`, { back: "driver/operating-model.php" });
  }
  function transporterBody(step) {
    if (step === "transporter-id") {
      return `${pageTitle("Enter Transporter ID", "Driver registers himself first. Transporters do not create or edit driver profiles.")}
        <div class="card panel">${field("Transporter ID *", "transporter.id")}<button class="btn full" type="button" data-action="verify-transporter">Verify</button>${state.transporter.found ? transporterSummary() : '<p class="notice">After verification, transporter details will be displayed.</p>'}</div>`;
    }
    if (step === "transporter-details") {
      return `${pageTitle("Transporter Details", "Confirm the transporter and request to join.")}
        <div class="card panel">${transporterSummary()}<p class="notice success">Transporter found. The transporter cannot create, add or edit your driver profile.</p><button class="btn full" type="button" data-action="request-join">Request to Join</button></div>`;
    }
    if (step === "request-status") {
      return `${pageTitle("Pending Transporter Approval", "Your request has been sent and is waiting for transporter approval.")}
        <div class="grid cols-2"><div class="card panel">${timeline(["Driver Identity / DL Verification", "Transporter Found", "Request to Join", "Pending Transporter Approval", "Transporter Approves", "Vehicle Assigned"], state.transporter.approval)}</div><div class="card panel notice warning"><h2>${state.transporter.approval}</h2><button class="btn" type="button" data-simulate="transporter-approved">Continue</button></div></div>`;
    }
    if (step === "assigned-vehicle") {
      return `${pageTitle("Assigned Vehicle", "Vehicle information is read only for the driver.")}
        <div class="card panel">${assignedVehicle()}<a class="btn full" href="${root("driver/transporter/compliance.php")}">Continue</a></div>`;
    }
    if (step === "compliance") {
      return `${pageTitle("Vehicle Compliance", "Compliance is checked at the assigned vehicle level.")}
        <div class="card panel status-list">${statusRow("RC Verification", "ok")}${statusRow("Insurance Verification", "ok")}${statusRow("PUC Verification", "ok")}${statusRow("Fitness / Permit", "ok")}${statusRow("Vehicle Assigned", state.transporter.vehicleAssigned ? "ok" : "wait")}<a class="btn full" href="${root("driver/transporter/review.php")}">Continue</a></div>`;
    }
    if (step === "review") {
      return `${pageTitle("Review", "Review the transporter-driver relationship and assigned vehicle.")}
        <div class="card panel">${transporterSummary()}${assignedVehicle()}<a class="btn full" href="${root("driver/transporter/status.php")}">Submit for Approval</a></div>`;
    }
    if (step === "status") return statusPage("Transporter Driver Approved", "driver/transporter/dashboard.php", true);
    return dashboard(false);
  }
  function transporterSummary() {
    return `<table class="mini-table"><tbody><tr><th>Company Name</th><td>ABC Logistics Pvt Ltd</td></tr><tr><th>Contact Number</th><td>+91 98765 43210</td></tr><tr><th>Email Address</th><td>info@abclogistics.com</td></tr><tr><th>Address</th><td>Mumbai, Maharashtra</td></tr></tbody></table>`;
  }
  function assignedVehicle() {
    return `<table class="mini-table"><tbody><tr><th>Registration Number</th><td>MH12AB1234</td><th>Vehicle Type</th><td>HCV</td></tr><tr><th>Body Type</th><td>Container</td><th>Payload Capacity</th><td>16 Ton</td></tr><tr><th>Insurance Status</th><td>${badge("Verified", "green")}</td><th>PUC Status</th><td>${badge("Verified", "green")}</td></tr><tr><th>Fitness / Permit Status</th><td>${badge("Verified", "green")}</td><th>Edit Access</th><td>${badge("Read Only", "yellow")}</td></tr></tbody></table>`;
  }
  function timeline(items, active) {
    const index = Math.max(0, items.indexOf(active));
    return `<div class="timeline">${items.map((item, i) => `<div class="timeline-item"><span class="status-dot ${i <= index ? "ok" : "wait"}">${i <= index ? "✓" : "…"}</span><div><strong>${item}</strong><br><small>${i <= index ? "Completed / current" : "Pending"}</small></div></div>`).join("")}</div>`;
  }
  function statusPage(title, dashboardPath, approved) {
    if (approved) state.finalApproved = true;
    return `${pageTitle(title, "Track review state and continue once approved.")}
      <div class="grid cols-2"><div class="card panel">${timeline(["Draft", "Submitted", "Under Review", "Document Rejected / Re-upload Required", "Compliance Check", "Exception Review", "Approved", "Inactive/Suspended"], state.approvalState)}</div><div class="card panel notice ${state.approvalState === "Approved" || approved ? "success" : "warning"}"><h2>${approved ? "Approved" : state.approvalState}</h2><p>Your profile can move through submitted, review, rejected, exception, approved and suspended states.</p><a class="btn full" href="${root(dashboardPath)}">Go to Dashboard</a></div></div>`;
  }
  function dashboard(owner) {
    const name = `${state.personal.first || "Rajesh"} ${state.personal.last || "Kumar"}`;
    const initials = name.split(" ").map((part) => part[0] || "").join("").slice(0, 2).toUpperCase();
    const nav = [["Dashboard", "grid", true], ["My Profile", "driver"], ["My Vehicle", "truck"], ["Documents", "idCard"], ["Status", "shield"]];
    const kpis = [
      ["Vehicle Status", owner ? "Active" : "Read-only", "truck", "green"],
      ["Documents", "Valid", "idCard", "green"],
      ["Trips This Month", "12", "pin", ""],
      ["Earnings", "Rs 48,320", "chart", ""]
    ];
    return `<main class="dashboard db">
      <aside class="dash-nav db-nav">
        ${brand("sm")}
        <nav class="db-menu">${nav.map(([label, icon, active]) => `<a class="${active ? "active" : ""}" href="#" ${active ? 'aria-current="page"' : ""}>${icons[icon]}<span>${label}</span></a>`).join("")}</nav>
        <div class="db-user"><span class="db-avatar" data-no-translate>${esc(initials)}</span><span><strong data-no-translate>${esc(name)}</strong><small>${owner ? "Owner Driver" : "Transporter Driver"}</small></span></div>
      </aside>
      <section class="dash-main db-main">
        <header class="db-top">
          <div><p class="db-kicker">${owner ? "Owner driver dashboard" : "Transporter driver dashboard"}</p><h1>Welcome, ${esc(name)}</h1></div>
          <div class="db-actions">${langSwitch()}${callLink()}</div>
        </header>
        <div class="db-body">
          <div class="db-kpis">${kpis.map(([label, value, icon, tone]) => `<div class="db-kpi"><span class="db-kpi-icon ${tone}">${icons[icon]}</span><span><small>${label}</small><strong>${value}</strong></span></div>`).join("")}</div>
          <div class="db-grid">
            <section class="db-card">
              <header class="db-card-head"><h2>${owner ? "Owner Driver Vehicle" : "Transporter Assigned Vehicle"}</h2>${badge("Verified", "green")}</header>
              ${ownerVehicleSummary(owner)}
            </section>
            <section class="db-card">
              <header class="db-card-head"><h2>Document Status</h2>${badge("Valid", "green")}</header>
              ${documentTable(owner)}
            </section>
          </div>
        </div>
      </section>${devbar()}</main>`;
  }
  function ownerVehicleSummary(owner) {
    const v = state.vehicle;
    const payload = owner ? v.payload || "16" : "16";
    const rows = [
      ["Type", owner ? v.type : "HCV"],
      ["Body", owner ? v.body || "Container" : "Container"],
      ["Payload", /^\d+(\.\d+)?$/.test(payload) ? `${payload} tons` : payload],
      ["Mode", owner ? "Editable owner vehicle" : "Read-only transporter vehicle"]
    ];
    return `<div class="db-plate"><span class="db-plate-icon">${icons.truck}</span><span><small>Registration Number</small><strong data-no-translate>${esc(owner ? v.registration || "MH12AB1234" : "MH12AB1234")}</strong></span></div>
      <dl class="db-specs">${rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${esc(value)}</dd></div>`).join("")}</dl>`;
  }
  function documentTable(owner) {
    const rows = ["Driving Licence", owner ? "RC" : "Assigned Vehicle RC", "Insurance", "PUC", "Fitness/Permit"];
    const dates = ["12 Dec 2036", "15 Jan 2027", "20 Mar 2027", "10 Feb 2027", "05 Mar 2027"];
    return `<ul class="db-docs">${rows.map((row, index) => `<li><span class="db-doc-icon">${icons.idCard}</span><span class="db-doc-name"><strong>${row}</strong><small><span>Valid Upto</span> ${dates[index]}</small></span>${badge("Verified", "green")}</li>`).join("")}</ul>`;
  }

  function renderPlaceholder(title, image) {
    return shell(`${pageTitle(title, "Prototype placeholder page preserved for this registration type.")}
      <div class="grid cols-2"><div class="card panel"><h2>${title}</h2><p class="notice">This screen is available as an independent PHP page. No backend registration is performed in the prototype.</p><a class="btn full" href="${root("register/index.php")}">Return to Registration</a></div><img class="card" src="${root(image || "assets/images/oem-parts.png")}" alt=""></div>`, { back: /^business-/.test(page.screen) ? "business-partner.php" : "register/index.php" });
  }

  function devbar() {
    return "";
  }

  const i18n = window.WheeltrackI18n;
  function hindiActive() {
    return Boolean(i18n) && state.mobile.language === "Hindi" && /^(driver|owner|transporter):/.test(page.screen);
  }
  function applyLanguage() {
    document.documentElement.lang = hindiActive() ? "hi" : "en";
    if (hindiActive()) i18n.translateTree(app);
  }
  if (i18n) {
    new MutationObserver((mutations) => {
      if (!hindiActive()) return;
      mutations.forEach((m) => {
        if (m.type === "characterData") {
          const next = i18n.translate(m.target.nodeValue);
          if (next !== m.target.nodeValue && !m.target.parentElement.closest("textarea")) m.target.nodeValue = next;
        } else if (m.type === "attributes") {
          i18n.translateTree(m.target);
        } else {
          m.addedNodes.forEach((n) => n.nodeType === 1 ? i18n.translateTree(n) : n.nodeType === 3 && n.parentElement && i18n.translateTree(n.parentElement));
        }
      });
    }).observe(app, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["aria-label", "placeholder", "title"] });
    const nativeAlert = window.alert.bind(window);
    window.alert = (message) => nativeAlert(hindiActive() ? i18n.translate(String(message)) : message);
  }
  function render() {
    const screen = page.screen;
    if (screen === "landing") app.innerHTML = renderLanding();
    else if (screen === "register") app.innerHTML = renderRegister();
    else if (screen === "business-partner" || screen === "register-business") app.innerHTML = renderBusinessPartner();
    else if (screen === "login") {
      app.innerHTML = renderLogin();
      document.getElementById(store.getByPath(state, "login.user") ? "login-password" : "login-user").focus();
    }
    else if (screen === "forgot") app.innerHTML = renderForgot();
    else if (screen.startsWith("driver:")) app.innerHTML = renderDriver(screen.split(":")[1]);
    else if (screen.startsWith("owner:")) app.innerHTML = renderOwner(screen.split(":")[1]);
    else if (screen.startsWith("transporter:")) app.innerHTML = renderTransporter(screen.split(":")[1]);
    else if (screen === "business-oem") app.innerHTML = renderPlaceholder("OEM / Parts", "assets/images/oem-parts.png");
    else if (screen === "business-insurance") app.innerHTML = renderPlaceholder("Insurance", "assets/images/driver-truck.png");
    else if (screen === "business-gps") app.innerHTML = renderPlaceholder("GPS Companies", "assets/images/driver-truck.png");
    else if (screen === "business-vehicle") app.innerHTML = renderPlaceholder("Vehicle Manufacturer", "assets/images/login-truck.png");
    else if (screen === "transporter-register") app.innerHTML = renderPlaceholder("Transporter / Shipper Registration", "assets/images/driver-truck.png");
    else if (screen === "manufacturer-register") app.innerHTML = renderPlaceholder("Manufacturer Registration", "assets/images/login-truck.png");
    app.insertAdjacentHTML("beforeend", siteFooter());
    applyLanguage();
  }

  function setFieldError(input, message) {
    const error = document.getElementById(`${input.id}-error`);
    input.closest(".auth-input").classList.toggle("invalid", Boolean(message));
    input.setAttribute("aria-invalid", message ? "true" : "false");
    if (error) error.textContent = message || "";
  }
  function validateLoginUser(value) {
    const v = value.trim();
    if (!v) return "Enter your email or mobile number.";
    if (/^[\d\s+-]+$/.test(v)) return /^(\+?91)?[6-9]\d{9}$/.test(v.replace(/[\s-]/g, "")) ? "" : "Enter a valid 10-digit mobile number.";
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "Enter a valid email address.";
  }
  function showMobileError(input, digits, strict) {
    const t = mobileText();
    const message = !digits ? (strict ? t.empty : "") : isValidMobile(digits) ? "" : t.invalid;
    input.closest(".ws-phone").classList.toggle("invalid", Boolean(message));
    input.setAttribute("aria-invalid", message ? "true" : "false");
    document.getElementById("mobile-number-error").textContent = message;
    return !message;
  }
  function submitLogin(form) {
    const user = form.querySelector("#login-user");
    const password = form.querySelector("#login-password");
    const userError = validateLoginUser(user.value);
    const passwordError = password.value ? "" : "Enter your password.";
    setFieldError(user, userError);
    setFieldError(password, passwordError);
    if (userError || passwordError) {
      (userError ? user : password).focus();
      return;
    }
    const button = form.querySelector(".auth-submit");
    button.disabled = true;
    button.classList.add("loading");
    store.setByPath(state, "login.user", user.value.trim());
    setTimeout(() => go("driver/owner/dashboard.php"), 500);
  }

  document.addEventListener("submit", (event) => {
    const rcForm = event.target.closest("[data-form=rc]");
    if (rcForm) {
      event.preventDefault();
      const input = rcForm.querySelector("#vehicle-reg");
      const reg = input.value.toUpperCase().replace(/[\s-]/g, "");
      const error = !reg ? "Enter your vehicle registration number." : /^[A-Z]{2}\d{1,2}[A-Z]{0,3}\d{1,4}$/.test(reg) ? "" : "Enter a valid registration number, e.g. MH12AB1234.";
      const setError = (msg) => {
        input.closest(".ws-phone").classList.toggle("invalid", Boolean(msg));
        input.setAttribute("aria-invalid", msg ? "true" : "false");
        document.getElementById("vehicle-reg-error").textContent = msg;
      };
      setError(error);
      if (error) return input.focus();
      if (!cfg.PROTOTYPE_MODE) return setError("RC verification service is not connected yet.");
      const button = rcForm.querySelector(".ws-cta");
      button.disabled = true;
      button.classList.add("loading");
      button.querySelector(".ws-cta-label").textContent = "Verifying RC…";
      setTimeout(() => {
        Object.assign(state.vehicle, { registration: reg }, PROTOTYPE_RC);
        state.documents.rc = "verified";
        store.save(state);
        go("driver/owner/rc.php");
      }, 800);
      return;
    }
    const mobileForm = event.target.closest("[data-form=mobile]");
    if (mobileForm) {
      event.preventDefault();
      const input = mobileForm.querySelector("#mobile-number");
      const digits = input.value.replace(/\D/g, "");
      if (!showMobileError(input, digits, true)) return input.focus();
      const button = mobileForm.querySelector(".ws-cta");
      button.disabled = true;
      button.classList.add("loading");
      button.querySelector(".ws-cta-label").textContent = mobileText().sending;
      store.setByPath(state, "mobile.number", digits);
      setTimeout(() => go("driver/mobile-otp.php"), 600);
      return;
    }
    const form = event.target.closest("[data-form=login]");
    if (!form) return;
    event.preventDefault();
    submitLogin(form);
  });

  document.addEventListener("input", (event) => {
    if (event.target.closest(".auth-input.invalid")) setFieldError(event.target, "");
    if (/^dl\./.test(event.target.dataset.field || "")) {
      store.setByPath(state, event.target.dataset.field, event.target.value);
      const actions = document.querySelector(".ws-driving-licence .pd-actions");
      if (actions) actions.outerHTML = dlActions();
    }
    if (event.target.id === "mobile-number") {
      const input = event.target;
      input.value = input.value.replace(/\D/g, "").slice(0, 10);
      const valid = isValidMobile(input.value);
      input.closest("form").querySelector(".ws-cta").disabled = !valid;
      if (valid || input.closest(".ws-phone").classList.contains("invalid")) showMobileError(input, input.value, input.value.length === 10);
    }  });

  document.addEventListener("input", (event) => {
    const field = event.target.closest("[data-field]");
    if (field) {
      store.setByPath(state, field.dataset.field, field.type === "checkbox" ? field.checked : field.value);
      if (field.type === "checkbox" || field.tagName === "SELECT") render();
    }
    const otpInput = event.target.closest("[data-otp-index]");
    if (otpInput) {
      const wrap = otpInput.closest("[data-otp]");
      const code = [...wrap.querySelectorAll(".otp")].map((input) => input.value.replace(/\D/g, "").slice(0, 1)).join("");
      store.setByPath(state, wrap.dataset.otp, code);
      if (otpInput.value && otpInput.nextElementSibling) otpInput.nextElementSibling.focus();
    }
  });

  document.addEventListener("focusout", (event) => {
    if (event.target.id === "mobile-number" && event.target.value) showMobileError(event.target, event.target.value, true);
  });

  document.addEventListener("change", (event) => {
    if (event.target.name === "mobileLanguage") {
      store.setByPath(state, "mobile.language", event.target.value);
      store.setByPath(state, "personal.language", event.target.value);
      render();
      const selected = document.querySelector('input[name="mobileLanguage"]:checked');
      if (selected) selected.focus();
      return;
    }
    if (event.target.name === "operatingModel") {
      state.operatingModel = event.target.value;
      store.save(state);
      render();
    }
    const demo = event.target.closest("[data-demo]");
    if (demo && demo.value) {
      runDemo(demo.value);
      demo.value = "";
    }
  });

  document.addEventListener("click", (event) => {
    const toggle = event.target.closest("[data-toggle-password]");
    if (toggle) {
      const input = toggle.parentElement.querySelector("input");
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      toggle.innerHTML = show ? icons.eyeOff : icons.eye;
      toggle.setAttribute("aria-label", show ? "Hide password" : "Show password");
      toggle.setAttribute("aria-pressed", String(show));
      return;
    }
    const profile = event.target.closest("[data-profile]");
    if (profile) {
      state.selectedProfile = profile.dataset.profile;
      store.save(state);
      return;
    }
    const uploadButton = event.target.closest("[data-upload]");
    if (uploadButton) {
      store.setByPath(state, uploadButton.dataset.upload, "uploaded");
      render();
      return;
    }
    const next = event.target.closest("[data-next]");
    if (next) {
      go(next.dataset.next);
      return;
    }
    const verify = event.target.closest("[data-verify]");
    if (verify) {
      if (verify.dataset.verify === "mobile") {
        if (state.mobile.otp !== cfg.DEMO_MOBILE_OTP) return alert(`Use demo OTP ${cfg.DEMO_MOBILE_OTP}.`);
        state.mobile.verified = true;
        store.save(state);
        go("driver/email.php");
      } else {
        if (state.email.otp !== cfg.DEMO_EMAIL_OTP) return alert(`Use demo OTP ${cfg.DEMO_EMAIL_OTP}.`);
        state.email.verified = true;
        store.save(state);
        go("driver/password.php");
      }
      return;
    }
    const doc = event.target.closest("[data-doc]");
    if (doc) {
      state.documents[doc.dataset.doc] = "verified";
      store.save(state);
      render();
      return;
    }
    const simulate = event.target.closest("[data-simulate]");
    if (simulate) {
      simulateState(simulate.dataset.simulate);
      return;
    }
    const action = event.target.closest("[data-action]");
    if (!action) return;
    if (action.dataset.action === "reset-password") go("login.php");
    if (action.dataset.action === "owner-verify") {
      if (!cfg.PROTOTYPE_MODE) return alert("Verification service is not connected yet.");
      action.disabled = true;
      action.querySelector("span").textContent = "Verifying…";
      setTimeout(() => {
        state.documents[action.dataset.key] = "verified";
        store.save(state);
        render();
      }, 700);
      return;
    }
    if (action.dataset.action === "simulate-kyc" && cfg.PROTOTYPE_MODE) {
      action.disabled = true;
      action.textContent = "Verifying…";
      const pending = [...document.querySelectorAll("[data-id-flow] .id-stage.is-pending")];
      pending.forEach((stage, index) => setTimeout(() => {
        stage.classList.replace("is-pending", "is-done");
        stage.querySelector(".id-dot").innerHTML = icons.check;
        const tag = stage.querySelector(".badge");
        tag.className = "badge green";
        tag.textContent = "Completed";
      }, (index + 1) * 450));
      setTimeout(() => {
        state.kyc.status = "verified";
        store.save(state);
        render();
      }, (pending.length + 1) * 450);
      return;
    }
    if (action.dataset.action === "password-next") {
      if (state.password.value.length < 8 || !/\d/.test(state.password.value) || state.password.value !== state.password.confirm) return alert("Password must be 8+ characters, include a number, and match confirmation.");
      go("driver/consent.php");
    }
    if (action.dataset.action === "consent-next") {
      if (!state.consent.terms || !state.consent.privacy) return alert("Terms and Privacy Policy are required.");
      go("driver/personal-details.php");
    }
    if (action.dataset.action === "choose-operating") {
      if (!state.operatingModel) return alert("Select Owner Driver or Transporter Driver.");
      go(state.operatingModel === "owner" ? "driver/owner/vehicle.php" : "driver/transporter/transporter-id.php");
    }
    if (action.dataset.action === "submit-owner") {
      state.approvalState = "Approved";
      state.finalApproved = true;
      store.save(state);
      go("driver/owner/status.php");
    }
    if (action.dataset.action === "verify-transporter") {
      state.transporter.found = true;
      store.save(state);
      go("driver/transporter/transporter-details.php");
    }
    if (action.dataset.action === "request-join") {
      state.transporter.requested = true;
      state.transporter.approval = "Pending Transporter Approval";
      store.save(state);
      go("driver/transporter/request-status.php");
    }
  });

  function simulateState(kind) {
    if (kind === "kyc") state.kyc.status = "verified";
    if (kind === "dl") state.dl.status = "verified";
    if (kind === "transporter-approved") {
      state.transporter.approval = "Transporter Approves";
      state.transporter.vehicleAssigned = true;
      store.save(state);
      go("driver/transporter/assigned-vehicle.php");
      return;
    }
    store.save(state);
    render();
  }

  function runDemo(kind) {
    if (kind === "reset") state = store.clone(store.defaults);
    if (kind === "otp") {
      state.mobile.otp = cfg.DEMO_MOBILE_OTP;
      state.email.otp = cfg.DEMO_EMAIL_OTP;
      state.mobile.verified = true;
      state.email.verified = true;
    }
    if (kind === "kyc") state.kyc.status = "verified";
    if (kind === "dl") state.dl.status = "verified";
    if (["rc", "insurance", "puc", "fitness"].includes(kind)) state.documents[kind] = "verified";
    if (kind === "transporterFound") state.transporter.found = true;
    if (kind === "transporterApproved") state.transporter.approval = "Transporter Approves";
    if (kind === "vehicleAssigned") state.transporter.vehicleAssigned = true;
    if (kind === "finalApproved") {
      state.approvalState = "Approved";
      state.finalApproved = true;
    }
    store.save(state);
    render();
  }

  render();
})();
