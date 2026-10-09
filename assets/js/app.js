(function () {
  const cfg = window.WHEELTRACK_CONFIG;
  const store = window.WheeltrackState;
  const page = window.WHEELTRACK_PAGE || { screen: "landing", root: "" };
  let state = store.load();
  // Earlier prototype builds stored "unavailable" / "manual" as the Aadhaar status.
  if (state.aadhaar.status === "unavailable") Object.assign(state.aadhaar, { status: "failed", failedReason: state.aadhaar.failedReason || "PROVIDER_UNAVAILABLE" });
  if (state.aadhaar.status === "manual") Object.assign(state.aadhaar, { status: "idle", method: "manual" });
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
    ["transporter-id", "Transporter ID", "driver/transporter/transporter-id.php"],
    ["transporter-details", "Details", "driver/transporter/transporter-details.php"],
    ["review", "Review", "driver/transporter/review.php"],
    ["request-status", "Approval", "driver/transporter/request-status.php"],
    ["status", "Approved", "driver/transporter/status.php"],
    ["dashboard", "Dashboard", "driver/transporter/dashboard.php"]
  ];
  const svc = window.WheeltrackServices;
  // Values that must never be persisted (full Aadhaar number, OTPs being typed).
  const temp = { aadhaarNumber: "", aadhaarOtp: "", loginOtp: "", mobileOtp: "", emailOtp: "", forgotOtp: "", password: "", confirm: "", forgotPassword: "", forgotConfirm: "" };
  // Earlier prototype builds stored passwords and OTPs; keep only a "password set" flag.
  if (state.password.value || state.password.confirm) {
    state.password.set = state.password.set || (String(state.password.value || "").length >= 8 && /\d/.test(state.password.value) && state.password.value === state.password.confirm);
    delete state.password.value;
    delete state.password.confirm;
  }
  ["mobile", "email"].forEach((key) => delete state[key].otp);
  ["otp", "password", "confirm"].forEach((key) => delete state.forgot[key]);
  state.login.password = "";
  store.save(state);

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
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
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
  // Sidebar navigation: earlier steps are always reachable but only show ✓ when actually complete; a later
  // step is reachable only if it was reached before AND every earlier step's requirement is still complete.
  function passwordValid() {
    return Boolean(state.password.set);
  }
  // Password inputs whose value is kept only in memory (temp), never in localStorage.
  function tempPassword(label, key) {
    const id = `pw-${key}`;
    return `<div class="field"><label for="${id}">${label}</label><div class="pw-wrap"><input id="${id}" type="password" autocomplete="new-password" data-temp="${key}" value="${esc(temp[key])}"><button class="pw-eye" type="button" data-toggle-password aria-label="Show password" aria-pressed="false">${icons.eye}</button></div></div>`;
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
      if (index < currentIndex) return isDone() ? "done" : "open";
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
    () => !cfg.ENFORCE_PERSONAL_GATE || personalReady(),
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
  const transporterFlowRules = () => {
    const t = state.transporter;
    return [
      () => Boolean(t.match),
      () => Boolean(t.match) && t.confirmed,
      () => t.submission === "submitted",
      () => t.association === "approved",
      () => t.association === "approved"
    ];
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
    const onboarding = /^(driver|owner|transporter|company):/.test(s) || /^business-(oem|insurance|gps|vehicle)$/.test(s) || /-register$/.test(s);
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
    const method = state.login.method === "password" ? "password" : "otp";
    if (store.getByPath(state, "login.password")) store.setByPath(state, "login.password", "");
    const tab = (value, label) => `<button class="auth-tab ${method === value ? "active" : ""}" type="button" role="tab" aria-selected="${method === value}" data-login-method="${value}">${label}</button>`;
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
        <header class="login-head">${langSwitch()}${callLink()}</header>
        <div class="login-body">
          <div class="login-hero">${brand("xl")}</div>
          <div class="auth-card" data-login-card>
            <h1>Login</h1>
            <p class="subtle">Welcome back! Please login to your account.</p>
            <div class="auth-tabs" role="tablist" aria-label="Login method">${tab("otp", "Login with OTP")}${tab("password", "Login with Password")}</div>
            ${method === "otp" ? loginOtpForm() : loginPasswordForm()}
            <p class="auth-register">Don't have an account? <a href="${root("register/index.php")}">Register</a></p>
          </div>
        </div>
      </section>${devbar()}
    </main>`;
  }
  function loginPasswordForm() {
    const user = store.getByPath(state, "login.user") || "";
    return `<form data-form="login" novalidate>
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
    </form>`;
  }
  function maskMobile(number) {
    const d = String(number || "");
    return d.length === 10 ? `+91 ${d.slice(0, 2)}XXXXXX${d.slice(-2)}` : `+91 ${d}`;
  }
  function loginOtpForm() {
    const l = state.login;
    if (!l.referenceId) {
      return `<form data-form="login-otp" novalidate>
        <div class="auth-field">
          <label for="login-mobile">Mobile Number</label>
          <div class="auth-input auth-phone">${icons.phone}<span class="auth-code" aria-label="Country code">+91</span><input id="login-mobile" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="10" placeholder="Enter 10-digit mobile number" value="${esc(l.mobile)}" aria-describedby="login-mobile-error"></div>
          <p class="field-error" id="login-mobile-error" aria-live="polite"></p>
        </div>
        <button class="btn full auth-submit" type="submit"><span class="spinner" aria-hidden="true"></span>${icons.phoneVerify}<span class="auth-submit-label">Send OTP</span></button>
        <p class="auth-note">${icons.lockSmall}<span>We'll send a one-time password to your registered mobile number.</span></p>
      </form>`;
    }
    return `<form data-form="login-verify" novalidate>
      <div class="otp-sent">
        <p><span>Enter the 6-digit OTP sent to</span> <strong data-no-translate>${esc(maskMobile(l.mobile))}</strong></p>
        <button class="link-btn" type="button" data-action="login-change-mobile">Change number</button>
      </div>
      <div class="auth-field">
        <label>One-Time Password</label>
        ${otpTemp("loginOtp")}
        <p class="field-error" id="login-otp-error" aria-live="polite"></p>
      </div>
      ${resendRow("login", l)}
      <button class="btn full auth-submit" type="submit"><span class="spinner" aria-hidden="true"></span>${icons.login}<span class="auth-submit-label">Verify & Login</span></button>
    </form>`;
  }
  function loginSuccess() {
    return `<div class="auth-success" role="status">
      <span class="auth-success-icon">${icons.check}</span>
      <h1>Login successful</h1>
      <p class="subtle">Redirecting to your dashboard…</p>
    </div>`;
  }
  // OTP inputs whose value is kept only in memory (temp), never in localStorage.
  function otpTemp(key) {
    const chars = String(temp[key] || "").padEnd(6, " ").slice(0, 6).split("");
    return `<div class="otp-row" data-otp-temp="${key}" role="group" aria-label="One-Time Password">${chars.map((char, index) => `<input class="otp" inputmode="numeric" autocomplete="${index === 0 ? "one-time-code" : "off"}" maxlength="1" value="${esc(char.trim())}" data-otp-index="${index}" aria-label="Digit ${index + 1}">`).join("")}</div>`;
  }
  function secondsLeft(sentAt, seconds) {
    return Math.max(0, Math.ceil((sentAt + seconds * 1000 - Date.now()) / 1000));
  }
  function clock(total) {
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
  }
  function resendRow(kind, session) {
    const left = secondsLeft(session.sentAt, session.resendIn);
    return `<div class="resend-row"><span>Didn't receive the OTP?</span><button class="link-btn" type="button" data-action="${kind}-resend" data-resend-at="${session.sentAt + session.resendIn * 1000}" ${left ? "disabled" : ""}>${left ? `Resend OTP in ${clock(left)}` : "Resend OTP"}</button></div>`;
  }
  function renderForgot() {
    return shell(`${pageTitle("Forgot Password", "Enter your account details and reset the password with a demo OTP.")}
      <div class="card panel">${field("Email or Mobile Number", "forgot.user")}${otpTemp("forgotOtp")}<p class="notice">Demo OTP is <strong>${cfg.DEMO_MOBILE_OTP}</strong>.</p>${tempPassword("New Password", "forgotPassword")}${tempPassword("Confirm Password", "forgotConfirm")}<button class="btn full" type="button" data-action="reset-password">Reset Password</button></div>`, { back: "login.php", narrow: true });
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
    return regMobileForm({ form: "mobile", codePath: "mobile.code", numberPath: "mobile.number", code: state.mobile.code, number, text: t });
  }
  // ---- Shared registration components: Driver and Transporter / Shipper onboarding use the same markup. ----
  function regTitle(icon, title, note) {
    return `<div class="ws-title"><span class="ws-title-icon">${icons[icon] || icons.phoneVerify}</span><div><h1>${title}</h1><p>${note}</p></div></div>`;
  }
  // Mobile number + country code + Send OTP. `form` names the submit handler; `extra` adds role-specific lines.
  function regMobileForm({ form, codePath, numberPath, code, number, text: t, extra = "" }) {
    return `<div class="ws-title">
        <span class="ws-title-icon">${icons.phoneVerify}</span>
        <div><h1>${t.title}</h1><p>${t.note}</p></div>
      </div>
      <form class="ws-form" data-form="${form}" novalidate>
        <div class="ws-field">
          <label for="mobile-number">${t.label}</label>
          <div class="ws-phone">
            ${icons.phone}
            <select class="ws-code" data-field="${codePath}" aria-label="Country code">${["+91"].map((c) => `<option ${c === code ? "selected" : ""}>${c}</option>`).join("")}</select>
            <input id="mobile-number" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="10" placeholder="${t.placeholder}" data-field="${numberPath}" value="${esc(number)}" aria-describedby="mobile-number-error" aria-invalid="false" required>
          </div>
          <p class="field-error" id="mobile-number-error" aria-live="polite"></p>
        </div>
        <button class="ws-cta" type="submit"><span class="spinner" aria-hidden="true"></span><span class="ws-cta-label">${t.send}</span>${icons.arrowRight}</button>
        <p class="ws-secure">${icons.lockSmall}<span>${t.secure}</span></p>${extra}
      </form>`;
  }
  function regOtpCard({ tempKey, verified, verifiedText, button, extra = "" }) {
    return `<div class="card panel">${otpTemp(tempKey)}${verified ? `<p class="notice success">${verifiedText}</p>` : ""}${extra}${button}</div>`;
  }
  function regEmailCard({ input, button, extra = "" }) {
    return `<div class="card panel">${input}${extra}${button}</div>`;
  }
  function regPasswordCard({ set, keys, button, extra = "" }) {
    return `<div class="card panel">${set ? '<p class="notice success">Password set. Enter a new one below only if you want to change it.</p>' : ""}${tempPassword("Password", keys[0])}${tempPassword("Confirm Password", keys[1])}${extra}${button}</div>`;
  }
  function regConsentCard({ items, errorId, button }) {
    return `<div class="card panel consent-list">${items.map(([key, label]) => consentItem(key, label)).join("")}<p class="field-error" id="${errorId}" aria-live="polite"></p>${button}</div>`;
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
    const lockAttr = (opts.locked ? ' readonly aria-readonly="true"' : "") + (opts.aadhaarPending ? ' placeholder="Filled after Aadhaar verification"' : "");
    const control = opts.type === "textarea" ? `<textarea ${attrs}${lockAttr} rows="3">${value}</textarea>` : `<input type="${opts.type || "text"}" ${attrs}${lockAttr} value="${value}">`;
    const marker = (opts.required ? ' <span class="req">*</span>' : opts.recommended ? ' <span class="tag-rec">Recommended</span>' : "") + (opts.locked && !opts.aadhaarPending ? ` <span class="tag-rec tag-verified">${opts.tag || "From Aadhaar"}</span>` : "");
    return `<div class="pd-field"><label for="${id}">${label}${marker}</label>${control}</div>`;
  }
  function pdSelect(label, path, options, required) {
    const id = `pd-${path.replace(/\W/g, "-")}`;
    const value = store.getByPath(state, path) || "";
    return `<div class="pd-field"><label for="${id}">${label}${required ? ' <span class="req">*</span>' : ""}</label><select id="${id}" data-field="${path}">${options.map((o) => `<option value="${esc(o)}" ${o === value ? "selected" : ""}>${o || "Select"}</option>`).join("")}</select></div>`;
  }
  // Searchable dropdown. source: "states" or "districts:<path of the selected state>".
  const LOCATIONS = window.WHEELTRACK_LOCATIONS || {};
  function comboOptions(source) {
    if (source === "states") return Object.keys(LOCATIONS);
    const statePath = source.split(":")[1];
    return LOCATIONS[store.getByPath(state, statePath)] || [];
  }
  function pdCombo(label, path, source, opts = {}) {
    const id = `pd-${path.replace(/\W/g, "-")}`;
    const value = store.getByPath(state, path) || "";
    const locked = opts.locked;
    const disabled = !locked && !comboOptions(source).length;
    const marker = (opts.required ? ' <span class="req">*</span>' : "") + (locked && !opts.aadhaarPending ? ` <span class="tag-rec tag-verified">${opts.tag || "From Aadhaar"}</span>` : "");
    const placeholder = opts.aadhaarPending ? "Filled after Aadhaar verification" : opts.placeholder || "";
    return `<div class="pd-field"><label for="${id}">${label}${marker}</label>
      <div class="combo ${locked ? "locked" : ""}" ${locked ? "" : `data-combo="${path}" data-source="${source}"`}>
        <input id="${id}" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="${id}-list" autocomplete="off" spellcheck="false" value="${esc(value)}" placeholder="${placeholder}" ${locked ? 'readonly aria-readonly="true"' : ""} ${disabled ? "disabled" : ""} data-no-translate>
        <ul class="combo-list" id="${id}-list" role="listbox" hidden data-no-translate></ul>
      </div></div>`;
  }
  function docUpload(label, path, opts = {}) {
    const done = Boolean(store.getByPath(state, path));
    const marker = opts.required ? ' <span class="req">*</span>' : opts.optionalNote ? ' <span class="tag-rec">Optional if API verified</span>' : "";
    return `<div class="doc-up ${done ? "done" : ""}"><span class="doc-icon">${done ? icons.check : icons.upload}</span><span class="doc-text"><strong>${label}${marker}</strong><small>${done ? "Uploaded" : opts.hint || ""}</small></span><button class="pd-upload-btn" type="button" data-upload="${path}">${done ? "Replace" : "Upload"}</button></div>`;
  }
  // Verified by API, or API could not verify and the licence images were provided for manual review.
  function dlManualComplete() {
    const d = state.dl;
    const m = d.manual || {};
    return svc.DrivingLicenceVerificationService.isValid(d.number) && Boolean(d.dob) && [m.state, m.type, m.issueDate, m.expiry].every((v) => String(v || "").trim()) && Boolean(d.front && d.back);
  }
  // Licence route for this driver, kept for review/compliance. Manual data is never "Licence Verified".
  function dlSource() {
    if (dlStatus() === "verified") return "verified";
    if (state.dl.method === "manual") return state.dl.manualStatus === "submitted" ? "manual_submitted" : "manual_draft";
    return dlStatus();
  }
  function dlReady() {
    return ["verified", "manual_submitted"].includes(dlSource());
  }
  function dlActions() {
    const hint = state.dl.method === "manual" ? "Submit your licence for manual verification to continue." : "Verify your driving licence or submit it for manual verification to continue.";
    return pdActions("driver/identity.php", "driver/operating-model.php", !cfg.ENFORCE_DL_GATE || dlReady(), hint);
  }
  function pdActions(back, next, enabled = true, hint = "Complete all identity checks to continue.") {
    const cta = enabled
      ? `<a class="ws-cta pd-next" href="${root(next)}"><span>Continue</span>${icons.arrowRight}</a>`
      : `<div class="pd-next-wrap"><button class="ws-cta pd-next" type="button" disabled aria-describedby="pd-next-hint"><span>Continue</span>${icons.arrowRight}</button><small id="pd-next-hint">${hint}</small></div>`;
    return `<div class="pd-actions"><a class="pd-back" href="${root(back)}">${icons.back}<span>Back</span></a>${cta}</div>`;
  }
  function wsTitle(step, title, note) {
    return regTitle(driverStepIcons[step], title, note);
  }
  function langSwitch() {
    const current = state.mobile.language === "Hindi" ? "Hindi" : "English";
    return `<div class="lang-switch" role="radiogroup" aria-label="Preferred language (required)" aria-required="true">${[["English", "English"], ["Hindi", "हिंदी"]].map(([value, label]) => `<label class="${value === current ? "selected" : ""}"><input type="radio" name="mobileLanguage" value="${value}" ${value === current ? "checked" : ""}><span>${label}</span></label>`).join("")}</div>`;
  }


  // Shown on any result produced by a test adapter, so sandbox data is never mistaken for a real verification.
  function sourceTag(source) {
    return source === "sandbox" ? '<span class="sandbox-tag" title="Real provider integration pending">Sandbox data · provider integration pending</span>' : "";
  }
  function photoCaptured() {
    return /^data:image\//.test(state.personal.photo || "");
  }
  // Identity source for this driver, kept for review/compliance. Manual entry is never shown as Aadhaar Verified.
  function identitySource() {
    const a = state.aadhaar;
    if (a.status === "verified") return "aadhaar";
    if (a.method === "manual") return "manual";
    return a.status === "failed" ? "failed" : "pending";
  }
  function personalReady() {
    const p = state.personal;
    const filled = (...values) => values.every((v) => String(v || "").trim());
    const pin = (v) => /^\d{6}$/.test(v || "");
    if (!photoCaptured()) return false;
    const source = identitySource();
    if (source === "aadhaar") {
      const currentOk = p.sameAddress || (filled(p.current, p.currentState, p.currentCity) && pin(p.currentPincode));
      return filled(p.first, p.dob, p.permanent, p.state, p.city) && pin(p.pincode) && currentOk;
    }
    if (source === "manual") return filled(p.first, p.last, p.dob, p.gender, p.current, p.state, p.city) && pin(p.pincode);
    return false;
  }
  function personalHint() {
    if (!["aadhaar", "manual"].includes(identitySource())) return "Verify your Aadhaar or enter your details manually to continue.";
    if (!photoCaptured()) return "Capture your profile photo to continue.";
    return "Complete all required fields to continue.";
  }
  function methodChoice(method) {
    const option = (value, action, icon, title, note, extra) => `<button class="vc-option ${method === value ? "active" : ""}" type="button" role="radio" aria-checked="${method === value}" data-action="${action}">
        <span class="vc-radio" aria-hidden="true"></span><span class="vc-icon">${icons[icon]}</span><span class="vc-text"><strong>${title}</strong><small>${note}</small></span>${extra || ""}
      </button>`;
    return `<div class="vc">
      <p class="vc-title">Verify your details</p>
      <div class="vc-grid" role="radiogroup" aria-label="Verify your details">
        ${option("aadhaar", "aadhaar-mode", "shield", "Verify with Aadhaar", "Faster verification", badge("Recommended", "green"))}
        <span class="vc-or">or</span>
        ${option("manual", "aadhaar-manual", "edit", "Enter details manually", "Continue without Aadhaar")}
      </div>
    </div>`;
  }
  function manualCard() {
    const a = state.aadhaar;
    return `<div class="kyc-card unavailable" data-aadhaar>
      <span class="kyc-icon">${icons.edit}</span>
      <div class="kyc-text">
        <strong>Details Entered Manually</strong>
        <small>Fill in your details below. Wheeltrack will review them before approval.</small>
        ${a.failedReason ? "<small>Aadhaar verification could not be completed.</small>" : ""}
      </div>
      <button class="link-btn" type="button" data-action="aadhaar-mode">Verify with Aadhaar instead</button>
    </div>`;
  }
  function aadhaarCard() {
    const a = state.aadhaar;
    const masked = a.last4 ? svc.AadhaarVerificationService.maskAadhaar(a.last4) : "";
    if (a.status === "verified") {
      return `<div class="kyc-card verified" data-aadhaar>
        <span class="kyc-icon">${icons.shield}</span>
        <div class="kyc-text">
          <strong class="kyc-ok">Aadhaar Verified ✓</strong>
          <span><span data-no-translate>${esc(masked)}</span></span>
          <small>Name, date of birth, gender, guardian and address were filled from your verified Aadhaar.</small>
          ${sourceTag(a.source)}
        </div>
        <button class="link-btn" type="button" data-action="aadhaar-reset">Use a different Aadhaar</button>
      </div>`;
    }
    if (a.status === "failed") {
      return `<div class="kyc-card failed" data-aadhaar>
        <span class="kyc-icon">${icons.idCard}</span>
        <div class="kyc-text">
          <strong>Aadhaar Verification Failed</strong>
          <small>We couldn't verify your Aadhaar right now. You can try again or continue by entering your details manually.</small>
          ${masked ? `<span><span>Aadhaar</span> <strong data-no-translate>${esc(masked)}</strong></span>` : ""}
        </div>
        <div class="kyc-actions">
          <button class="ws-cta kyc-btn" type="button" data-action="aadhaar-change"><span>Try Again</span></button>
          <button class="pd-back kyc-alt" type="button" data-action="aadhaar-manual">${icons.edit}<span>Enter Details Manually</span></button>
        </div>
      </div>`;
    }
    if (a.status === "otp_sent") {
      return `<div class="kyc-card" data-aadhaar>
        <span class="kyc-icon">${icons.idCard}</span>
        <div class="kyc-text">
          <strong>Verify Aadhaar OTP</strong>
          <span><span>OTP sent to the mobile number linked with Aadhaar</span> <strong data-no-translate>${esc(masked)}</strong></span>
          <button class="link-btn" type="button" data-action="aadhaar-change">Change Aadhaar number</button>
        </div>
        <div class="kyc-form">
          <span class="kyc-label">Enter OTP <span class="req">*</span></span>
          <div class="kyc-row">
            ${otpTemp("aadhaarOtp")}
            <button class="ws-cta kyc-btn" type="button" data-action="aadhaar-verify"><span class="spinner" aria-hidden="true"></span><span class="ws-cta-label">Verify Aadhaar</span>${icons.arrowRight}</button>
          </div>
          <p class="field-error" id="aadhaar-error" aria-live="polite"></p>
          ${resendRow("aadhaar", a)}
        </div>
      </div>`;
    }
    const digits = temp.aadhaarNumber;
    return `<div class="kyc-card" data-aadhaar>
      <span class="kyc-icon">${icons.idCard}</span>
      <div class="kyc-text">
        <strong>Aadhaar Verification <span class="req">*</span></strong>
        <small>Verify with an OTP sent to your Aadhaar-linked mobile number. Your verified details will be filled in automatically.</small>
      </div>
      <div class="kyc-form">
        <label class="kyc-label" for="aadhaar-number">Aadhaar Number <span class="req">*</span></label>
        <div class="kyc-row">
          <input id="aadhaar-number" class="kyc-input" type="text" inputmode="numeric" autocomplete="off" maxlength="14" placeholder="XXXX XXXX XXXX" value="${esc(digits.replace(/(\d{4})(?=\d)/g, "$1 "))}" aria-describedby="aadhaar-error" data-no-translate>
          <button class="ws-cta kyc-btn" type="button" data-action="aadhaar-send"><span class="spinner" aria-hidden="true"></span><span class="ws-cta-label">Send OTP</span>${icons.arrowRight}</button>
        </div>
        <div class="kyc-consent">
          <label class="pd-check"><input type="checkbox" data-field="aadhaar.consent" ${a.consent ? "checked" : ""}><span>I consent to authenticate my identity using Aadhaar OTP for driver registration.</span></label>
          <button class="link-btn" type="button" data-policy="aadhaar">Read Aadhaar consent</button>
        </div>
        <p class="field-error" id="aadhaar-error" aria-live="polite"></p>
        <p class="ws-secure">${icons.lockSmall}<span>Your full Aadhaar number is never stored. Only the last 4 digits are kept.</span></p>
      </div>
    </div>`;
  }
  function photoCard() {
    const p = state.personal;
    const captured = photoCaptured();
    return `<div class="pd-photo ${captured ? "done" : ""}">
      <span class="pd-avatar">${captured ? `<img src="${esc(p.photo)}" alt="Captured profile photo">` : icons.camera}</span>
      <div class="pd-photo-text">
        <strong>Profile Photo <span class="req">*</span></strong>
        <span>${captured ? "Profile photo captured ✓" : "Take a live photo with your camera. Uploading from the gallery is not allowed."}</span>
        <button class="pd-upload-btn" type="button" data-action="open-camera">${icons.camera}<span>${captured ? "Retake Photo" : "Capture Photo"}</span></button>
      </div>
      <small class="pd-photo-note">Face the camera in good light • No cap or sunglasses</small>
    </div>`;
  }
  function cameraDialog(view, message) {
    const body = {
      starting: `<div class="cam-stage cam-msg"><span class="spinner dark" aria-hidden="true"></span><p>Requesting camera permission…</p><small>Allow camera access when your browser asks.</small></div>`,
      live: `<div class="cam-stage"><video data-cam-video autoplay playsinline muted></video><span class="cam-guide" aria-hidden="true"></span></div>`,
      preview: `<div class="cam-stage"><img data-cam-preview alt="Photo preview"></div>`,
      error: `<div class="cam-stage cam-msg cam-error">${icons.camera}<p>${message || ""}</p><small>${view === "error" && /permission/i.test(message || "") ? "Allow camera access in your browser settings, then try again." : "Check that a camera is connected and not used by another app."}</small></div>`
    }[view];
    const foot = {
      starting: `<button class="pd-back" type="button" data-modal-close>Cancel</button>`,
      live: `<button class="pd-back" type="button" data-modal-close>Cancel</button><button class="ws-cta" type="button" data-cam="take">${icons.camera}<span>Take Photo</span></button>`,
      preview: `<button class="pd-back" type="button" data-cam="retake">Retake</button><button class="ws-cta" type="button" data-cam="use">${icons.check}<span>Use Photo</span></button>`,
      error: `<button class="pd-back" type="button" data-modal-close>Close</button><button class="ws-cta" type="button" data-cam="retry"><span>Try Again</span></button>`
    }[view];
    return `<div class="wt-modal" role="dialog" aria-modal="true" aria-labelledby="cam-title" data-modal="camera">
      <div class="wt-modal-card wt-camera">
        <header class="wt-modal-head"><div><h2 id="cam-title">Capture Profile Photo</h2><p>Keep your face inside the frame.</p></div><button class="wt-modal-close" type="button" data-modal-close aria-label="Close">×</button></header>
        <div class="wt-modal-body">${body}</div>
        <footer class="wt-modal-foot">${foot}</footer>
      </div>
    </div>`;
  }
  function dlStatus() {
    return state.dl.result ? state.dl.status : "unverified";
  }
  function formatDate(value) {
    if (!value) return "—";
    const d = new Date(`${value.slice(0, 10)}T00:00:00`);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  }
  function ensureDriverId() {
    if (!state.driverId) {
      state.driverId = `WT-DRV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      store.save(state);
    }
    return state.driverId;
  }

  function driverBody(step) {
    if (step === "mobile-otp") {
      return `${wsTitle(step, "Enter Mobile OTP", `Use demo OTP ${cfg.DEMO_MOBILE_OTP} to verify ${state.mobile.code} ${state.mobile.number || "your mobile number"}.`)}
        ${regOtpCard({ tempKey: "mobileOtp", verified: state.mobile.verified, verifiedText: "Mobile OTP verified.", button: '<button class="btn full" type="button" data-verify="mobile">Verify & Continue</button>' })}`;
    }
    if (step === "email") {
      return `${wsTitle(step, "Verify Email Address", "We will send an OTP to verify your email address.")}
        ${regEmailCard({ input: field("Email Address", "email.address", "email"), button: '<button class="btn full" type="button" data-next="driver/email-otp.php">Send OTP</button>' })}`;
    }
    if (step === "email-otp") {
      return `${wsTitle(step, "Enter Email OTP", `Use demo OTP ${cfg.DEMO_EMAIL_OTP} to verify ${state.email.address || "your email"}.`)}
        ${regOtpCard({ tempKey: "emailOtp", verified: state.email.verified, verifiedText: "Email OTP verified.", button: '<button class="btn full" type="button" data-verify="email">Verify & Continue</button>' })}`;
    }
    if (step === "password") {
      return `${wsTitle(step, "Set Your Password", "Use at least 8 characters with a number.")}
        ${regPasswordCard({ set: state.password.set, keys: ["password", "confirm"], button: '<button class="btn full" type="button" data-action="password-next">Continue</button>' })}`;
    }
    if (step === "consent") {
      return `${wsTitle(step, "Terms & Consent", "Review the required terms before moving ahead.")}
        ${regConsentCard({ items: [["terms", "I agree to Terms & Conditions"], ["privacy", "I agree to Privacy Policy"], ["communication", "I agree to receive relevant communication via SMS, Email or WhatsApp."]], errorId: "consent-error", button: '<button class="btn full" type="button" data-action="consent-next">Continue</button>' })}`;
    }
    if (step === "personal-details") {
      const p = state.personal;
      const source = identitySource();
      const fromAadhaar = source === "aadhaar";
      const manual = source === "manual";
      // Verified Aadhaar data is read-only; manual entry uses the approved Personal Details fields, all editable.
      const idField = (label, path, opts = {}) => pdField(label, path, fromAadhaar ? { ...opts, locked: true } : opts);
      const addressAadhaar = `<section class="pd-section">
            ${pdHead("pin", "Address", "As per your Aadhaar")}
            ${idField("Permanent Address", "personal.permanent", { required: true, type: "textarea" })}
            <div class="pd-grid cols-3">
              ${pdCombo("State", "personal.state", "states", { required: true, locked: true })}
              ${pdCombo("District / City", "personal.city", "districts:personal.state", { required: true, locked: true })}
              ${idField("Pincode", "personal.pincode", { required: true })}
            </div>
            <label class="pd-check"><input type="checkbox" data-field="personal.sameAddress" ${p.sameAddress ? "checked" : ""}><span>I currently live at this address</span></label>
            ${p.sameAddress ? "" : `${pdField("Current Address", "personal.current", { required: true, type: "textarea", autocomplete: "street-address" })}
            <div class="pd-grid cols-3">
              ${pdCombo("State", "personal.currentState", "states", { required: true, placeholder: "Search state" })}
              ${pdCombo("District / City", "personal.currentCity", "districts:personal.currentState", { required: true, placeholder: p.currentState ? "Search district" : "Select state first" })}
              ${pdField("Pincode", "personal.currentPincode", { required: true, inputmode: "numeric", maxlength: 6, autocomplete: "postal-code" })}
            </div>`}
          </section>`;
      const addressManual = `<section class="pd-section">
            ${pdHead("pin", "Address", "Where you currently live")}
            ${pdField("Current Address", "personal.current", { required: true, type: "textarea", autocomplete: "street-address" })}
            <label class="pd-check"><input type="checkbox" data-field="personal.permanentSame" ${p.permanentSame ? "checked" : ""}><span>Permanent address is the same as current address</span></label>
            ${p.permanentSame ? "" : pdField("Permanent Address", "personal.permanent", { type: "textarea" })}
            <div class="pd-grid cols-3">
              ${pdCombo("State", "personal.state", "states", { required: true, placeholder: "Search state" })}
              ${pdCombo("District / City", "personal.city", "districts:personal.state", { required: true, placeholder: p.state ? "Search district" : "Select state first" })}
              ${pdField("Pincode", "personal.pincode", { required: true, inputmode: "numeric", maxlength: 6, autocomplete: "postal-code" })}
            </div>
          </section>`;
      return `${wsTitle(step, "Personal Details", "Tell us a little about yourself so we can complete your driver profile.")}
        <div class="pd">
          <section class="pd-section">
            ${fromAadhaar ? aadhaarCard() : `${methodChoice(manual ? "manual" : "aadhaar")}${manual ? manualCard() : aadhaarCard()}`}
            ${fromAadhaar || manual ? `<div class="pd-grid cols-3">
              ${idField("First Name", "personal.first", { required: true, autocomplete: "given-name" })}
              ${idField("Middle Name", "personal.middle", { autocomplete: "additional-name" })}
              ${idField("Last Name", "personal.last", { required: manual, autocomplete: "family-name" })}
              ${idField("Date of Birth", "personal.dob", { required: true, type: "date", autocomplete: "bday" })}
              ${fromAadhaar ? idField("Gender", "personal.gender") : pdSelect("Gender", "personal.gender", ["", "Male", "Female", "Other"], true)}
              ${idField("Father's / Guardian's Name", "personal.father")}
            </div>` : ""}
            <div class="pd-grid cols-2">
              ${pdField("Emergency Contact Name", "personal.emergencyName", { recommended: true })}
              <div class="pd-field"><label for="pd-personal-emergencyNumber">Emergency Contact Number <span class="tag-rec">Recommended</span></label><div class="ws-phone pd-phone"><span class="pd-code">+91</span><input id="pd-personal-emergencyNumber" type="tel" inputmode="numeric" maxlength="10" placeholder="Enter contact number" data-field="personal.emergencyNumber" value="${esc(p.emergencyNumber)}"></div></div>
            </div>
          </section>
          ${fromAadhaar ? addressAadhaar : manual ? addressManual : ""}
          <section class="pd-section">
            ${pdHead("camera", "Profile Photo", "Take a live photo using your device camera")}
            ${photoCard()}
          </section>
          ${pdActions("driver/consent.php", "driver/identity.php", !cfg.ENFORCE_PERSONAL_GATE || personalReady(), personalHint())}
        </div>`;
    }
    if (step === "identity") {
      const verified = state.kyc.status === "verified";
      const p = state.personal;
      const aadhaarOk = identitySource() === "aadhaar";
      const aadhaarManual = identitySource() === "manual";
      const ready = (aadhaarOk || aadhaarManual) && photoCaptured();
      const stages = [
        ["Address", (p.permanent || p.current) && p.pincode ? "ok" : "wait"],
        ["Identity Verification", aadhaarOk ? "ok" : aadhaarManual ? "manual" : "wait"],
        ["KYC / DigiLocker", aadhaarOk ? "ok" : aadhaarManual ? "manual" : "wait"],
        ["Identity Confirmation", verified ? "ok" : "wait"],
        ["Selfie Capture", photoCaptured() ? "ok" : "wait"],
        ["Liveness Check", verified ? "ok" : "wait"],
        ["Identity Verified", verified ? "ok" : "wait"]
      ];
      return `${wsTitle(step, "Identity Verification", "Complete KYC status checks for the driver profile.")}
        <div class="pd">
          <section class="pd-section">
            ${pdHead("shield", "Verification Progress", "Each check completes in this order")}
            <ol class="id-flow" data-id-flow>${stages.map(([label, status], index) => `<li class="id-stage ${status === "ok" ? "is-done" : "is-pending"}"><span class="id-dot">${status === "ok" ? icons.check : index + 1}</span><span class="id-label">${label}</span>${badge(status === "ok" ? "Completed" : status === "manual" ? "Manual review" : "Pending", status === "ok" ? "green" : "yellow")}</li>`).join("")}</ol>
            ${verified ? sourceTag(state.kyc.source) : ""}
          </section>
          ${verified ? "" : ready
            ? `<div class="verify-row"><span>Your Aadhaar and live photo are ready for face match and liveness checks.</span><button class="pd-upload-btn" type="button" data-action="run-identity">${icons.shield}<span>Start Verification</span></button></div><p class="field-error" id="identity-error" aria-live="polite"></p>`
            : `<p class="notice warning">Complete Aadhaar verification and capture your profile photo on Personal Details first. <a href="${root("driver/personal-details.php")}">Go to Personal Details</a></p>`}
          ${pdActions("driver/personal-details.php", "driver/driving-licence.php", verified)}
        </div>`;
    }
    if (step === "driving-licence") {
      const d = state.dl;
      const online = dlStatus();
      const verified = online === "verified";
      const manual = !verified && d.method === "manual";
      const submitted = manual && d.manualStatus === "submitted";
      const r = d.result || {};
      if (!d.dob && state.personal.dob) d.dob = state.personal.dob;
      const lic = (label, path, opts = {}) => pdField(label, path, { ...opts, locked: true, tag: "From licence records" });
      const choice = (value, action, icon, title, note, extra) => `<button class="vc-option ${(manual ? "manual" : "online") === value ? "active" : ""}" type="button" role="radio" aria-checked="${(manual ? "manual" : "online") === value}" data-action="${action}">
          <span class="vc-radio" aria-hidden="true"></span><span class="vc-icon">${icons[icon]}</span><span class="vc-text"><strong>${title}</strong><small>${note}</small></span>${extra || ""}
        </button>`;
      const routeChoice = `<div class="vc">
          <p class="vc-title">Verify your driving licence</p>
          <div class="vc-grid" role="radiogroup" aria-label="Verify your driving licence">
            ${choice("online", "dl-online", "shield", "Verify Online", "Faster verification", badge("Recommended", "green"))}
            <span class="vc-or">or</span>
            ${choice("manual", "dl-manual", "edit", "Enter Details Manually", "Submit for manual verification")}
          </div>
        </div>`;
      const problem = (cls, title, text) => `<div class="kyc-card ${cls}">
          <span class="kyc-icon">${icons.idCard}</span>
          <div class="kyc-text"><strong>${title}</strong><small>${text}</small>${sourceTag(d.source)}</div>
          <div class="kyc-actions">
            <button class="ws-cta kyc-btn" type="button" data-action="dl-retry"><span class="spinner" aria-hidden="true"></span><span class="ws-cta-label">Try Again</span></button>
            <button class="pd-back kyc-alt" type="button" data-action="dl-manual">${icons.edit}<span>Enter Details Manually</span></button>
          </div>
        </div>`;
      const onlineBlock = `<form class="dl-form" data-form="dl" novalidate>
              <div class="pd-grid cols-2">
                ${pdField("Driving Licence Number", "dl.number", { required: true })}
                ${pdField("Date of Birth", "dl.dob", { required: true, type: "date" })}
              </div>
              <p class="field-error" id="dl-error" aria-live="polite"></p>
              <div class="verify-row"><span class="ws-secure">${icons.lockSmall}<span>Other licence details are fetched automatically from the issuing authority's records.</span></span><button class="ws-cta dl-verify" type="submit"><span class="spinner" aria-hidden="true"></span><span class="ws-cta-label">${online === "unverified" ? "Verify Licence" : "Verify Again"}</span>${icons.shield}</button></div>
            </form>
            ${verified ? `<div class="dl-banner ok"><span class="status-dot ok">✓</span><div><strong>Licence Verified</strong><small>Your driving licence was verified with the issuing authority's records.</small></div>${r.nameMatch === "matched" ? badge("Matches Aadhaar", "green") : ""}${sourceTag(d.source)}</div>` : ""}
            ${online === "pending" ? problem("unavailable", "Verification Pending", "The licence records service hasn't confirmed your licence yet. You can try again later or submit your licence details for manual verification.") : ""}
            ${online === "failed" ? problem("failed", "Unable to Verify", `We couldn't verify your driving licence online. You can try again or submit your licence details for manual verification.${r.reason === "NOT_FOUND" ? " No licence matched this number and date of birth." : ""}`) : ""}`;
      const manualBlock = `<div class="kyc-card unavailable">
            <span class="kyc-icon">${icons.edit}</span>
            <div class="kyc-text"><strong>${submitted ? "Submitted for Manual Verification" : "Manual Verification"}</strong><small>${submitted ? "Wheeltrack will verify your licence. Your status will update after review." : "Enter your licence details and upload both sides of your licence. Wheeltrack will verify them manually."}</small></div>
            <button class="link-btn" type="button" data-action="dl-online">Verify online instead</button>
          </div>`;
      return `${wsTitle(step, "Driving Licence", "Enter and verify licence information.")}
        <div class="pd">
          <section class="pd-section">
            ${pdHead("idCard", "Licence Details", "As printed on your driving licence")}
            ${verified ? "" : routeChoice}
            ${manual ? manualBlock : onlineBlock}
          </section>
          ${verified ? `<section class="pd-section">
            ${pdHead("shield", "Licence Information", "Returned by the licence verification service")}
            <div class="pd-grid cols-3">
              ${lic("Name on Licence", "dl.manual.name")}
              ${lic("Licence Type / Class", "dl.manual.type")}
              ${lic("Issue Date", "dl.manual.issueDate", { type: "date" })}
              ${lic("Valid Until (Transport)", "dl.manual.validTransport", { type: "date" })}
              ${lic("Valid Until (Non-Transport)", "dl.manual.validNonTransport", { type: "date" })}
              ${pdCombo("Issuing State", "dl.manual.state", "states", { locked: true, tag: "From licence records" })}
            </div>
            <div class="pd-grid cols-2">
              ${lic("Issuing Authority / RTO", "dl.manual.authority")}
              ${lic("Authorised Vehicle Classes", "dl.manual.classes")}
            </div>
          </section>` : ""}
          ${manual ? `<section class="pd-section">
            ${pdHead("edit", "Licence Details for Manual Verification", "Fill these in exactly as printed on your licence")}
            <div class="pd-grid cols-2">
              ${pdField("Driving Licence Number", "dl.number", { required: true })}
              ${pdField("Date of Birth", "dl.dob", { required: true, type: "date" })}
            </div>
            <div class="pd-grid cols-3">
              ${pdCombo("Issuing State", "dl.manual.state", "states", { required: true, placeholder: "Search state" })}
              ${pdField("Issuing Authority / RTO", "dl.manual.authority")}
              ${pdSelect("Licence Type / Class", "dl.manual.type", ["", "Transport", "Non-Transport"], true)}
              ${pdField("Issue Date", "dl.manual.issueDate", { required: true, type: "date" })}
              ${pdField("Expiry / Validity Date", "dl.manual.expiry", { required: true, type: "date" })}
              ${pdField("Authorised Vehicle Classes", "dl.manual.classes")}
            </div>
          </section>
          <section class="pd-section">
            ${pdHead("upload", "Licence Images", "Required for manual verification")}
            <div class="pd-grid cols-2">
              ${docUpload("Driving Licence Front", "dl.front", { required: true, hint: "JPG/PNG • Max 2 MB" })}
              ${docUpload("Driving Licence Back", "dl.back", { required: true, hint: "JPG/PNG • Max 2 MB" })}
            </div>
            <p class="field-error" id="dl-manual-error" aria-live="polite"></p>
            ${submitted
              ? '<p class="notice success">Submitted for Manual Verification. You can continue; Wheeltrack will verify your licence before final approval.</p>'
              : `<div class="verify-row"><span class="ws-secure">${icons.lockSmall}<span>Manually entered details are not marked verified until Wheeltrack reviews them.</span></span><button class="ws-cta dl-verify" type="button" data-action="dl-manual-submit"><span>Submit for Manual Verification</span>${icons.arrowRight}</button></div>`}
          </section>` : ""}
          ${dlActions()}
        </div>`;
    }
    return `${wsTitle(step, "Operating Model", "Select the option that best describes how you drive.")}
      <div class="card panel"><div class="op-cards" role="radiogroup" aria-label="Operating model">${operateChoice("owner", "Owner Driver", "I own/manage<br>a vehicle and drive.", "opTruck")}${operateChoice("transporter", "Transporter Driver", "I drive for a transporter.<br>I will enter my Transporter ID.", "opDriver")}</div><button class="btn full" type="button" data-action="choose-operating">Continue</button></div>`;
  }
  // Legal content structure. Final wording must come from the client; until then each section is marked as pending.
  const POLICIES = {
    terms: {
      title: "Terms & Conditions", link: "Read Terms & Conditions", path: "consent.terms", required: true,
      sections: ["Introduction", "Eligibility & Registration", "Driver Responsibilities", "Use of the Platform", "Fees & Payments", "Suspension & Termination", "Limitation of Liability", "Governing Law & Disputes", "Contact Us"]
    },
    privacy: {
      title: "Privacy Policy", link: "Read Privacy Policy", path: "consent.privacy", required: true,
      sections: ["Information We Collect", "How We Use Your Information", "Identity & Document Verification", "Sharing with Transporters & Partners", "Data Retention", "Your Rights", "Security", "Grievance Officer & Contact"]
    },
    communication: {
      title: "Communication Consent", link: "Read communication details", path: "consent.communication", required: false,
      sections: ["Channels (SMS, Email, WhatsApp)", "Types of Messages", "How to Opt Out"]
    },
    aadhaar: {
      title: "Aadhaar Authentication Consent", link: "Read Aadhaar consent", path: "aadhaar.consent", required: true,
      sections: ["Purpose of Authentication", "Information Received from UIDAI", "Storage & Masking of Aadhaar Number", "Voluntary Consent & Alternatives"]
    },
    // Transporter / Shipper company registration.
    coTerms: {
      title: "Terms & Conditions", link: "Read Terms & Conditions", path: "company.consent.terms", required: true,
      sections: ["Introduction", "Eligibility & Company Registration", "Company & Representative Responsibilities", "Driver Association & Vehicle Assignment", "Use of the Platform", "Fees & Payments", "Suspension & Termination", "Limitation of Liability", "Governing Law & Disputes", "Contact Us"]
    },
    coPrivacy: {
      title: "Privacy Policy", link: "Read Privacy Policy", path: "company.consent.privacy", required: true,
      sections: ["Information We Collect", "How We Use Your Information", "Business KYC & Document Verification", "Representative Identity Data", "Sharing with Drivers & Partners", "Data Retention", "Your Rights", "Security", "Grievance Officer & Contact"]
    },
    coDeclaration: {
      title: "Business Information Declaration", link: "Read declaration", path: "company.consent.declaration", required: true,
      sections: ["Accuracy of Company Information", "Authority to Register the Company", "Validity of Uploaded Documents", "Obligation to Update Changes"]
    },
    coIdentity: {
      title: "Identity Verification Consent", link: "Read identity consent", path: "company.consent.identity", required: true,
      sections: ["Purpose of Identity Verification", "Information Received from the Verification Provider", "Storage & Masking of Identity Numbers", "Voluntary Consent & Alternatives"]
    },
    coCommunication: {
      title: "Communication Consent", link: "Read communication details", path: "company.consent.communication", required: false,
      sections: ["Channels (SMS, Email, WhatsApp)", "Types of Messages", "How to Opt Out"]
    }
  };
  function consentItem(key, label) {
    const policy = POLICIES[key];
    const checked = Boolean(store.getByPath(state, policy.path));
    return `<div class="consent-item ${checked ? "checked" : ""}">
      <label class="check-row"><input type="checkbox" data-field="${policy.path}" ${checked ? "checked" : ""}><span>${label}</span></label>
      <div class="consent-meta">${policy.required ? badge("Required", "red") : badge("Optional")}<button class="link-btn" type="button" data-policy="${key}">${policy.link}</button></div>
    </div>`;
  }
  function policyDialog(key) {
    const policy = POLICIES[key];
    const accepted = Boolean(store.getByPath(state, policy.path));
    return `<div class="wt-modal" role="dialog" aria-modal="true" aria-labelledby="policy-title" data-modal="policy">
      <div class="wt-modal-card wt-policy">
        <header class="wt-modal-head">
          <div><h2 id="policy-title">${policy.title}</h2><p>${policy.required ? badge("Required", "red") : badge("Optional")}<span class="policy-version">Version: Draft</span></p></div>
          <button class="wt-modal-close" type="button" data-modal-close aria-label="Close">×</button>
        </header>
        <div class="wt-modal-body" tabindex="0">
          <p class="notice warning">Awaiting client-approved legal content. The section structure below is a placeholder and is not final legal wording.</p>
          ${policy.sections.map((heading, index) => `<section class="policy-section"><h3><span data-no-translate>${index + 1}.</span> ${heading}</h3><p class="policy-pending">Client-approved text for this section will appear here.</p></section>`).join("")}
        </div>
        <footer class="wt-modal-foot">
          <button class="pd-back" type="button" data-modal-close>Close</button>
          ${accepted ? `<span class="policy-accepted">${icons.check}<span>Accepted</span></span>` : `<button class="ws-cta" type="button" data-policy-accept="${key}"><span>${policy.required ? "Accept" : "I Agree"}</span>${icons.check}</button>`}
        </footer>
      </div>
    </div>`;
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
  // GPS status is saved per vehicle. Any answer (or none) is accepted; it never blocks vehicle registration.
  const GPS_OPTIONS = [["yes", "Yes"], ["no", "No"], ["unknown", "Don't Know"]];
  function gpsQuestion(v) {
    return `<fieldset class="ws-field">
            <legend class="ws-label">Does this vehicle have GPS installed?</legend>
            <div class="lang-switch gps-switch" role="radiogroup" aria-label="Does this vehicle have GPS installed?">${GPS_OPTIONS.map(([value, label]) => `<label class="${v.gps === value ? "selected" : ""}"><input type="radio" name="vehicleGps" value="${value}" ${v.gps === value ? "checked" : ""}><span>${label}</span></label>`).join("")}</div>
          </fieldset>`;
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
          ${gpsQuestion(v)}
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

  const transporterGroups = [
    ["Transporter ID", ["transporter-id"]],
    ["Transporter Details", ["transporter-details"]],
    ["Review & Submit", ["review"]],
    ["Approval Status", ["request-status"]],
    ["Approved", ["status"]]
  ];
  const transporterStepInfo = [
    ["Transporter ID", "Enter & validate ID"],
    ["Transporter Details", "Confirm your transporter"],
    ["Review & Submit", "Send association request"],
    ["Approval Status", "Transporter approval"],
    ["Approved", "Ready to start"]
  ];
  const transporterTitleIcons = { "transporter-id": "idCard", "transporter-details": "handshake", review: "idCard", "request-status": "shield", status: "check" };
  function renderTransporter(step) {
    if (step === "dashboard") return dashboard(false);
    return shell(onboardWorkspace(step, transporterBody(step), {
      key: "transporter",
      rules: transporterFlowRules(),
      paths: transporterGroups.map(([, ids]) => transporterSteps.find(([id]) => id === ids[0])[2]),
      groups: transporterGroups,
      info: transporterStepInfo,
      label: "Transporter driver onboarding progress",
      kicker: "Transporter Driver",
      heading: 'Link your<br><span class="brand-red">transporter.</span>'
    }), { back: "driver/operating-model.php", mainClass: "ws-shell", pageClass: "ws-page" });
  }
  function transporterTitle(step, title, note) {
    return `<div class="ws-title"><span class="ws-title-icon">${icons[transporterTitleIcons[step]] || icons.truck}</span><div><h1>${title}</h1><p>${note}</p></div></div>`;
  }
  function needsFirst(step, title, message, back) {
    return `${transporterTitle(step, title, "")}<div class="pd"><p class="notice warning">${message}</p>${pdActions(back, back, false, message)}</div>`;
  }
  function transporterCard(t) {
    const m = t.match;
    return `<div class="tr-card">
      <div class="tr-card-head">
        <span class="tr-logo" data-no-translate>${esc(m.company.split(" ").map((w) => w[0]).join("").slice(0, 2))}</span>
        <div><strong data-no-translate>${esc(m.company)}</strong><small><span>Transporter ID</span> <span data-no-translate>${esc(m.id)}</span></small></div>
        ${m.verified ? badge("Verified Transporter", "green") : badge("Pending verification", "yellow")}
      </div>
      <dl class="api-grid">
        <div><dt>Contact Number</dt><dd data-no-translate>${esc(m.contact)}</dd></div>
        <div><dt>Email Address</dt><dd data-no-translate>${esc(m.email)}</dd></div>
        <div><dt>Operating Base</dt><dd data-no-translate>${esc(m.city)}, ${esc(m.state)}</dd></div>
        <div><dt>Fleet Size</dt><dd><span data-no-translate>${esc(m.fleetSize)}</span> <span>vehicles</span></dd></div>
        <div class="wide"><dt>On Wheeltrack Since</dt><dd data-no-translate>${esc(m.since)}</dd></div>
      </dl>
      ${sourceTag(t.source)}
    </div>`;
  }
  function associationLabel(t) {
    return { none: "Not submitted", pending: "Pending Transporter Approval", approved: "Transporter Approved", rejected: "Declined by Transporter", removed: "Removed by Transporter" }[t.association] || "Not submitted";
  }
  function transporterBody(step) {
    const t = state.transporter;
    const driverName = [state.personal.first, state.personal.last].filter(Boolean).join(" ");
    if (step === "transporter-id") {
      const locked = t.submission === "submitted";
      return `${transporterTitle(step, "Enter Transporter ID", "Ask your transporter for their Wheeltrack Transporter ID. We'll validate it and show their details.")}
        <form class="ws-form" data-form="transporter" novalidate>
          <div class="ws-field">
            <label for="transporter-id">Transporter ID <span class="req">*</span></label>
            <div class="ws-phone reg-input">${icons.idCard}<input id="transporter-id" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="20" placeholder="e.g. WTT-10021" data-field="transporter.query" value="${esc(t.query || t.id)}" aria-describedby="transporter-id-error"></div>
            <p class="field-error" id="transporter-id-error" aria-live="polite"></p>
          </div>
          ${t.match ? `<p class="notice success"><span>Transporter validated:</span> <strong data-no-translate>${esc(t.match.company)}</strong></p>` : ""}
          ${locked ? '<p class="notice warning">You already sent an association request. Validating a different Transporter ID will withdraw it.</p>' : ""}
          <button class="ws-cta" type="submit"><span class="spinner" aria-hidden="true"></span><span class="ws-cta-label">${t.match ? "Validate Again" : "Validate Transporter"}</span>${icons.arrowRight}</button>
          ${t.match ? `<a class="pd-back center-link" href="${root("driver/transporter/transporter-details.php")}">View transporter details${icons.arrowRight}</a>` : ""}
          <p class="ws-secure">${icons.lockSmall}<span>Only you can link your driver profile to a transporter. Transporters cannot create or edit your registration.</span></p>
        </form>`;
    }
    if (!t.match) return needsFirst(step, "Transporter Details", "Validate your Transporter ID first.", "driver/transporter/transporter-id.php");
    if (step === "transporter-details") {
      return `${transporterTitle(step, "Transporter Details", "Confirm this is the transporter you drive for.")}
        <div class="pd">
          <section class="pd-section">
            ${pdHead("truck", "Matched Transporter", "Returned from Wheeltrack transporter records")}
            ${transporterCard(t)}
          </section>
          <section class="pd-section">
            ${pdHead("handshake", "Driver Association", "Link your driver profile to this transporter")}
            <dl class="api-grid">
              <div><dt>Driver</dt><dd data-no-translate>${esc(driverName || "—")}</dd></div>
              <div><dt>Driver ID</dt><dd data-no-translate>${esc(ensureDriverId())}</dd></div>
              <div><dt>Mobile Number</dt><dd data-no-translate>${esc(state.mobile.number ? maskMobile(state.mobile.number) : "—")}</dd></div>
              <div><dt>Driving Licence</dt><dd>${dlSource() === "verified" ? badge("Licence Verified", "green") : dlSource() === "manual_submitted" ? badge("Submitted for Manual Verification", "yellow") : badge("Verification Pending", "yellow")}</dd></div>
            </dl>
            <label class="pd-check tr-confirm"><input type="checkbox" data-field="transporter.confirmed" ${t.confirmed ? "checked" : ""} ${t.submission === "submitted" ? "disabled" : ""}><span>I confirm I drive for this transporter and want to link my driver profile to it.</span></label>
            <p class="ws-secure">${icons.lockSmall}<span>The transporter can approve or decline your request. They cannot create, add or edit your driver profile.</span></p>
          </section>
          ${pdActions("driver/transporter/transporter-id.php", "driver/transporter/review.php", t.confirmed, "Confirm the association to continue.")}
        </div>`;
    }
    if (!t.confirmed) return needsFirst(step, "Review & Submit", "Confirm your transporter association first.", "driver/transporter/transporter-details.php");
    if (step === "review") {
      const rows = [
        ["Personal Details", personalReady(), "driver/personal-details.php"],
        ["Identity/KYC", state.kyc.status === "verified", "driver/identity.php"],
        ["Driving Licence", dlReady(), "driver/driving-licence.php"],
        ["Terms/Consent", state.consent.terms && state.consent.privacy, "driver/consent.php"],
        ["Transporter", Boolean(t.match), "driver/transporter/transporter-id.php"],
        ["Association confirmed", t.confirmed, "driver/transporter/transporter-details.php"]
      ];
      const submitted = t.submission === "submitted";
      return `${transporterTitle(step, "Review & Submit", "Check your details before sending the association request.")}
        <div class="pd">
          <section class="pd-section">
            ${pdHead("idCard", "Application Summary", "Check each section before submitting")}
            <ul class="review-list">${rows.map(([label, ok, href]) => `<li><span>${label}</span>${badge(ok ? "Ready" : "Pending", ok ? "green" : "yellow")}${submitted ? "<span></span>" : `<a class="btn ghost" href="${root(href)}">Edit</a>`}</li>`).join("")}</ul>
          </section>
          <section class="pd-section">
            ${pdHead("truck", "Transporter", "The association request will be sent here")}
            ${transporterCard(t)}
          </section>
          <p class="field-error" id="association-error" aria-live="polite"></p>
          <div class="pd-actions"><a class="pd-back" href="${root("driver/transporter/transporter-details.php")}">${icons.back}<span>Back</span></a>${submitted
            ? `<a class="ws-cta pd-next" href="${root("driver/transporter/request-status.php")}"><span>View Approval Status</span>${icons.arrowRight}</a>`
            : `<button class="ws-cta pd-next" type="button" data-action="submit-association"><span class="spinner" aria-hidden="true"></span><span class="ws-cta-label">Submit Association Request</span>${icons.arrowRight}</button>`}</div>
        </div>`;
    }
    if (t.submission !== "submitted") return needsFirst(step, "Approval Status", "Submit your association request first.", "driver/transporter/review.php");
    if (step === "request-status") {
      const approved = t.association === "approved";
      const rejected = ["rejected", "removed"].includes(t.association);
      const stages = [
        ["Registration submitted", true],
        ["Transporter validated", true],
        ["Association request sent", true],
        ["Transporter approval", approved]
      ];
      return `${transporterTitle(step, "Approval Status", "Track your association request with the transporter.")}
        <div class="pd">
          <div class="approved-card ${approved ? "ok" : rejected ? "bad" : ""}">
            <span class="approved-icon">${approved ? icons.check : icons.shield}</span>
            <div><strong>${associationLabel(t)}</strong><span><span data-no-translate>${esc(t.match.company)}</span> · <span data-no-translate>${esc(t.requestId)}</span></span></div>
          </div>
          <section class="pd-section">
            ${pdHead("shield", "Request Timeline", "Updated when the transporter responds")}
            <ol class="id-flow">${stages.map(([label, ok], index) => `<li class="id-stage ${ok ? "is-done" : "is-pending"}"><span class="id-dot">${ok ? icons.check : index + 1}</span><span class="id-label">${label}</span>${badge(ok ? "Completed" : "Pending", ok ? "green" : "yellow")}</li>`).join("")}</ol>
          </section>
          <section class="pd-section">
            ${pdHead("idCard", "Association Record", "Stored with your driver profile")}
            <dl class="api-grid">
              <div><dt>Request ID</dt><dd data-no-translate>${esc(t.requestId)}</dd></div>
              <div><dt>Driver ID</dt><dd data-no-translate>${esc(state.driverId)}</dd></div>
              <div><dt>Transporter ID</dt><dd data-no-translate>${esc(t.id)}</dd></div>
              <div><dt>Submitted On</dt><dd>${esc(formatDate(t.submittedAt))}</dd></div>
              <div><dt>Status</dt><dd>${badge(associationLabel(t), approved ? "green" : rejected ? "red" : "yellow")}</dd></div>
              <div><dt>Last Checked</dt><dd data-last-checked>${t.lastCheckedAt ? esc(new Date(t.lastCheckedAt).toLocaleTimeString("en-GB")) : "—"}</dd></div>
              ${t.reason && ["rejected", "removed"].includes(t.association) ? `<div class="wide"><dt>Reason from Transporter</dt><dd data-no-translate>${esc(t.reason)}</dd></div>` : ""}
            </dl>
            ${sourceTag(t.source)}
          </section>
          <p class="field-error" id="association-error" aria-live="polite"></p>
          <div class="pd-actions"><a class="pd-back" href="${root("driver/transporter/review.php")}">${icons.back}<span>Back</span></a>${approved
            ? `<a class="ws-cta pd-next" href="${root("driver/transporter/status.php")}"><span>Continue</span>${icons.arrowRight}</a>`
            : `<button class="ws-cta pd-next" type="button" data-action="check-association"><span class="spinner" aria-hidden="true"></span><span class="ws-cta-label">Refresh Status</span>${icons.arrowRight}</button>`}</div>
        </div>`;
    }
    if (t.association !== "approved") return needsFirst(step, "Approved", "Your transporter has not approved the request yet.", "driver/transporter/request-status.php");
    state.finalApproved = true;
    store.save(state);
    return `${transporterTitle(step, "Approved", "Your transporter driver profile is approved.")}
      <div class="pd">
        <div class="approved-card ok">
          <span class="approved-icon">${icons.check}</span>
          <div><strong>APPROVED</strong><span><span>Transporter Driver</span> · <span data-no-translate>${esc(t.match.company)}</span></span></div>
        </div>
        <a class="ws-cta" href="${root("driver/transporter/dashboard.php")}"><span>Go to Dashboard</span>${icons.arrowRight}</a>
      </div>`;
  }
  // Transporter driver home: everything about the driver, their transporter and the (read-only) vehicle in one place.
  function transporterDashboard() {
    const p = state.personal;
    const t = state.transporter;
    const m = t.match || {};
    const v = t.vehicle;
    const name = [p.first, p.middle, p.last].filter(Boolean).join(" ") || "Driver";
    const initials = [p.first, p.last].map((part) => (part || "")[0] || "").join("").toUpperCase() || "DR";
    const lic = state.dl.result && state.dl.result.number ? state.dl.result : null;
    const manual = state.dl.method === "manual" ? state.dl.manual : null;
    const dlOk = dlSource() === "verified";
    const dlLabel = dlOk ? "Verified" : dlSource() === "manual_submitted" ? "Under Review" : "Pending";
    const licValid = lic ? lic.validTransport : manual ? manual.validTransport || manual.expiry : "";
    const approved = t.association === "approved";
    const kycOk = state.kyc.status === "verified" || state.aadhaar.status === "verified";
    const dash = (value) => esc(value || "—");
    const nav = [["Dashboard", "grid", "#overview"], ["My Profile", "driver", "#profile"], ["My Vehicle", "truck", "#vehicle"], ["Documents", "idCard", "#documents"], ["Status", "shield", "#status"]];
    const kpis = [
      ["Account Status", approved ? "Approved" : "Pending", "check", approved ? "green" : ""],
      ["Transporter", m.company || "—", "handshake", "", true],
      ["Driving Licence", dlLabel, "idCard", dlOk ? "green" : ""],
      ["Vehicle", v ? v.registration : "Not assigned", "truck", v ? "green" : "", Boolean(v)]
    ];
    const next = !approved
      ? ["Waiting for transporter approval", "You can start once your transporter approves your request.", ""]
      : !v
        ? ["Waiting for vehicle assignment", "Your transporter will assign a vehicle to you. It will appear here automatically.", ""]
        : ["You are ready to start", "Your profile is approved and a vehicle is assigned. Contact your transporter for your first trip.", "ok"];
    const specs = (rows) => `<dl class="db-specs">${rows.map(([label, value, raw]) => `<div><dt>${label}</dt><dd${raw ? " data-no-translate" : ""}>${value}</dd></div>`).join("")}</dl>`;
    const address = [p.current, p.currentCity, p.currentState, p.currentPincode].filter(Boolean).join(", ") || [p.city, p.state].filter(Boolean).join(", ");
    const profile = specs([
      ["Driver ID", dash(state.driverId), true],
      ["Mobile Number", dash(state.mobile.number && maskMobile(state.mobile.number)), true],
      ["Email Address", dash(state.email.address), true],
      ["Date of Birth", esc(formatDate(p.dob)), true],
      ["Gender", dash(p.gender)],
      ["Preferred Language", dash(p.language || state.mobile.language)],
      ["Emergency Contact", `${dash(p.emergencyName)}${p.emergencyNumber ? ` · ${esc(p.emergencyNumber)}` : ""}`, true],
      ["Current Address", dash(address), true]
    ]);
    const transporter = specs([
      ["Company", dash(m.company), true],
      ["Transporter ID", dash(t.id || m.id), true],
      ["Contact Number", dash(m.contact), true],
      ["Email Address", dash(m.email), true],
      ["Operating Base", dash([m.city, m.state].filter(Boolean).join(", ")), true],
      ["Request ID", dash(t.requestId), true],
      ["Requested On", esc(formatDate(t.submittedAt)), true],
      ["Approved On", esc(approved ? formatDate(t.decidedAt || t.lastCheckedAt) : "—"), true]
    ]);
    const vehicle = v
      ? `<div class="db-plate"><span class="db-plate-icon">${icons.truck}</span><span><small>Registration Number</small><strong data-no-translate>${esc(v.registration)}</strong></span></div>
        ${specs([["Vehicle Type", dash(v.type)], ["Body Type", dash(v.body)], ["Payload Capacity", `${dash(v.payload)} <span>tons</span>`], ["Edit Access", badge("Read Only", "yellow")]])}
        <p class="db-note">${icons.lockSmall}<span>Only your transporter can assign or change this vehicle.</span></p>`
      : `<div class="db-empty"><span class="db-empty-icon">${icons.truck}</span><strong>No vehicle assigned yet</strong><span>Your transporter will assign a vehicle to you. It will appear here automatically.</span></div>`;
    const vc = (v && v.compliance) || {};
    const docRow = (label, sub, status) => {
      const tone = status === "Verified" ? "green" : status === "Not assigned" ? "" : "yellow";
      return `<li><span class="db-doc-icon">${icons.idCard}</span><span class="db-doc-name"><strong>${label}</strong>${sub ? `<small>${sub}</small>` : ""}</span>${badge(status, tone)}</li>`;
    };
    const vehicleDoc = (key) => (!v ? "Not assigned" : vc[key] === "verified" ? "Verified" : "Pending");
    const docs = [
      docRow("Driving Licence", lic || (manual && manual.validTransport) ? `<span data-no-translate>${esc((lic && lic.number) || state.dl.number)}</span>${licValid ? ` · <span>Valid Upto</span> <span data-no-translate>${esc(formatDate(licValid))}</span>` : ""}` : "", dlLabel),
      docRow("Aadhaar / KYC", state.aadhaar.last4 ? `<span data-no-translate>XXXX XXXX ${esc(state.aadhaar.last4)}</span>` : "", kycOk ? "Verified" : "Pending"),
      docRow("Assigned Vehicle RC", v ? "<span>Managed by your transporter</span>" : "", vehicleDoc("rc")),
      docRow("Insurance", v ? "<span>Managed by your transporter</span>" : "", vehicleDoc("insurance")),
      docRow("PUC", v ? "<span>Managed by your transporter</span>" : "", vehicleDoc("puc")),
      docRow("Fitness/Permit", v ? "<span>Managed by your transporter</span>" : "", vehicleDoc("fitness"))
    ].join("");
    const checklist = [
      ["Mobile number verified", state.mobile.verified],
      ["Email verified", state.email.verified],
      ["Identity / KYC verified", kycOk],
      ["Driving licence verified", dlOk],
      ["Terms accepted", state.consent.terms && state.consent.privacy],
      ["Transporter approval", approved],
      ["Vehicle assigned by transporter", Boolean(v)]
    ];
    const card = (id, title, head, body) => `<section class="db-card" id="${id}"><header class="db-card-head"><h2>${title}</h2>${head}</header>${body}</section>`;
    return `<main class="dashboard db">
      <aside class="dash-nav db-nav">
        ${brand("sm")}
        <nav class="db-menu">${nav.map(([label, icon, href], i) => `<a class="${i === 0 ? "active" : ""}" href="${href}" ${i === 0 ? 'aria-current="page"' : ""}>${icons[icon]}<span>${label}</span></a>`).join("")}</nav>
        <div class="db-user"><span class="db-avatar" data-no-translate>${/^data:image\//.test(p.photo || "") ? `<img src="${p.photo}" alt="">` : esc(initials)}</span><span><strong data-no-translate>${esc(name)}</strong><small>Transporter Driver</small></span></div>
      </aside>
      <section class="dash-main db-main">
        <header class="db-top">
          <div><p class="db-kicker">Transporter driver dashboard</p><h1><span>Welcome,</span> <span data-no-translate>${esc(p.first || name)}</span></h1></div>
          <div class="db-actions">${langSwitch()}${callLink()}</div>
        </header>
        <div class="db-body" id="overview">
          <div class="db-next ${next[2]}"><span class="db-next-icon">${next[2] ? icons.check : icons.shield}</span><span><strong>${next[0]}</strong><small>${next[1]}</small></span></div>
          <div class="db-kpis">${kpis.map(([label, value, icon, tone, raw]) => `<div class="db-kpi"><span class="db-kpi-icon ${tone}">${icons[icon]}</span><span><small>${label}</small><strong${raw ? " data-no-translate" : ""}>${esc(value)}</strong></span></div>`).join("")}</div>
          <div class="db-grid">
            ${card("profile", "My Profile", badge(approved ? "Approved" : "Pending", approved ? "green" : "yellow"), `<div class="db-person"><span class="db-avatar lg" data-no-translate>${/^data:image\//.test(p.photo || "") ? `<img src="${p.photo}" alt="">` : esc(initials)}</span><span><strong data-no-translate>${esc(name)}</strong><small>Transporter Driver</small></span></div>${profile}`)}
            ${card("transporter", "My Transporter", m.verified ? badge("Verified Transporter", "green") : "", transporter)}
            ${card("vehicle", "My Vehicle", v ? badge("Read Only", "yellow") : badge("Not assigned", ""), vehicle)}
            ${card("documents", "Documents", "", `<ul class="db-docs">${docs}</ul>`)}
            ${card("status", "Account Status", "", `<ol class="id-flow">${checklist.map(([label, ok], index) => `<li class="id-stage ${ok ? "is-done" : "is-pending"}"><span class="id-dot">${ok ? icons.check : index + 1}</span><span class="id-label">${label}</span>${badge(ok ? "Completed" : "Pending", ok ? "green" : "yellow")}</li>`).join("")}</ol>`)}
          </div>
        </div>
      </section>${devbar()}</main>`;
  }
  function dashboard(owner) {
    if (!owner) return transporterDashboard();
    const name = `${state.personal.first || "Rajesh"} ${state.personal.last || "Kumar"}`;
    const initials = name.split(" ").map((part) => part[0] || "").join("").slice(0, 2).toUpperCase();
    const nav = [["Dashboard", "grid", "#overview", true], ["My Profile", "driver", root("driver/personal-details.php")], ["My Vehicle", "truck", "#vehicle"], ["Documents", "idCard", "#documents"], ["Status", "shield", root("driver/owner/status.php")]];
    const kpis = [
      ["Vehicle Status", owner ? "Active" : "Read-only", "truck", "green"],
      ["Documents", "Valid", "idCard", "green"],
      ["Trips This Month", "12", "pin", ""],
      ["Earnings", "Rs 48,320", "chart", ""]
    ];
    return `<main class="dashboard db">
      <aside class="dash-nav db-nav">
        ${brand("sm")}
        <nav class="db-menu">${nav.map(([label, icon, href, active]) => `<a class="${active ? "active" : ""}" href="${href}" ${active ? 'aria-current="page"' : ""}>${icons[icon]}<span>${label}</span></a>`).join("")}</nav>
        <div class="db-user"><span class="db-avatar" data-no-translate>${esc(initials)}</span><span><strong data-no-translate>${esc(name)}</strong><small>${owner ? "Owner Driver" : "Transporter Driver"}</small></span></div>
      </aside>
      <section class="dash-main db-main">
        <header class="db-top">
          <div><p class="db-kicker">${owner ? "Owner driver dashboard" : "Transporter driver dashboard"}</p><h1>Welcome, ${esc(name)}</h1></div>
          <div class="db-actions">${langSwitch()}${callLink()}</div>
        </header>
        <div class="db-body" id="overview">
          <div class="db-kpis">${kpis.map(([label, value, icon, tone]) => `<div class="db-kpi"><span class="db-kpi-icon ${tone}">${icons[icon]}</span><span><small>${label}</small><strong>${value}</strong></span></div>`).join("")}</div>
          <div class="db-grid">
            <section class="db-card" id="vehicle">
              <header class="db-card-head"><h2>${owner ? "Owner Driver Vehicle" : "Transporter Assigned Vehicle"}</h2>${badge("Verified", "green")}</header>
              ${ownerVehicleSummary(owner)}
            </section>
            <section class="db-card" id="documents">
              <header class="db-card-head"><h2>Document Status</h2>${badge("Valid", "green")}</header>
              ${documentTable(owner)}
            </section>
          </div>
        </div>
      </section>${devbar()}</main>`;
  }
  function ownerVehicleSummary(owner) {
    const v = owner ? state.vehicle : state.transporter.vehicle || { registration: "", type: "—", body: "—", payload: "—" };
    const payload = owner ? v.payload || "16" : v.payload;
    const rows = [
      ["Type", v.type],
      ["Body", v.body || "Container"],
      ["Payload", /^\d+(\.\d+)?$/.test(payload) ? `${payload} tons` : payload],
      ["Mode", owner ? "Editable owner vehicle" : "Read-only transporter vehicle"]
    ];
    return `<div class="db-plate"><span class="db-plate-icon">${icons.truck}</span><span><small>Registration Number</small><strong data-no-translate>${esc(v.registration || (owner ? "MH12AB1234" : "—"))}</strong></span></div>
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
    return Boolean(i18n) && state.mobile.language === "Hindi" && (/^(driver|owner|transporter|company):/.test(page.screen) || page.screen === "login");
  }
  // Dialogs (policy text, camera) live outside #app so a re-render never closes them.
  const layer = document.createElement("div");
  layer.className = "wt-layer";
  document.body.appendChild(layer);
  function applyLanguage() {
    document.documentElement.lang = hindiActive() ? "hi" : "en";
    if (hindiActive()) {
      i18n.translateTree(app);
      i18n.translateTree(layer);
    }
  }
  if (i18n) {
    const observer = new MutationObserver((mutations) => {
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
    });
    [app, layer].forEach((node) => observer.observe(node, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["aria-label", "placeholder", "title"] }));
    const nativeAlert = window.alert.bind(window);
    window.alert = (message) => nativeAlert(hindiActive() ? i18n.translate(String(message)) : message);
    const nativeConfirm = window.confirm.bind(window);
    window.confirm = (message) => nativeConfirm(hindiActive() ? i18n.translate(String(message)) : message);
  }
  // Opening a later onboarding page directly (URL/bookmark/back) sends the driver to the first incomplete step.
  function flowRedirect(screen) {
    const [flow, step] = screen.split(":");
    if (!["driver", "owner", "transporter"].includes(flow) || step === "dashboard") return "";
    const firstGap = (rules, paths, upto) => {
      for (let i = 0; i < upto; i += 1) if (!rules[i]()) return paths[i];
      return "";
    };
    const pathsOf = (groups, steps) => groups.map(([, ids]) => steps.find(([id]) => id === ids[0])[2]);
    const driverPaths = pathsOf(driverGroups, driverSteps);
    if (flow === "driver") return firstGap(driverFlowRules(), driverPaths, driverGroups.findIndex(([, ids]) => ids.includes(step)));
    const driverGap = firstGap(driverFlowRules(), driverPaths, driverGroups.length);
    if (driverGap) return driverGap;
    const [groups, steps, rules] = flow === "owner" ? [ownerGroups, ownerSteps, ownerFlowRules()] : [transporterGroups, transporterSteps, transporterFlowRules()];
    return firstGap(rules, pathsOf(groups, steps), groups.findIndex(([, ids]) => ids.includes(step)));
  }
  function render() {
    const screen = page.screen;
    const redirect = screen.startsWith("company:") ? (company ? company.redirect(screen.split(":")[1]) : "register/index.php") : flowRedirect(screen);
    if (redirect) {
      window.location.replace(root(redirect));
      return;
    }
    if (screen === "landing") app.innerHTML = renderLanding();
    else if (screen === "register") app.innerHTML = renderRegister();
    else if (screen === "business-partner" || screen === "register-business") app.innerHTML = renderBusinessPartner();
    else if (screen === "login") {
      const active = document.activeElement && document.activeElement.closest("[data-login-method], .lang-switch");
      app.innerHTML = renderLogin();
      if (!active) {
        const target = document.querySelector("#login-mobile, [data-otp-temp] .otp, #login-password");
        if (target) (target.id === "login-password" && !store.getByPath(state, "login.user") ? document.getElementById("login-user") : target).focus();
      }
    }
    else if (screen === "forgot") app.innerHTML = renderForgot();
    else if (screen.startsWith("driver:")) app.innerHTML = renderDriver(screen.split(":")[1]);
    else if (screen.startsWith("owner:")) app.innerHTML = renderOwner(screen.split(":")[1]);
    else if (screen.startsWith("transporter:")) app.innerHTML = renderTransporter(screen.split(":")[1]);
    else if (screen === "business-oem") app.innerHTML = renderPlaceholder("OEM / Parts", "assets/images/oem-parts.png");
    else if (screen === "business-insurance") app.innerHTML = renderPlaceholder("Insurance", "assets/images/driver-truck.png");
    else if (screen === "business-gps") app.innerHTML = renderPlaceholder("GPS Companies", "assets/images/driver-truck.png");
    else if (screen === "business-vehicle") app.innerHTML = renderPlaceholder("Vehicle Manufacturer", "assets/images/login-truck.png");
    else if (screen.startsWith("company:")) app.innerHTML = company.render(screen.split(":")[1]);
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
  function setMessage(id, message, tone) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = message || "";
    el.classList.toggle("ok", tone === "ok");
  }
  function setLoading(button, loading, label) {
    if (!button) return;
    button.disabled = loading;
    button.classList.toggle("loading", loading);
    const text = button.querySelector(".ws-cta-label, .auth-submit-label");
    if (text && label) text.textContent = label;
  }
  function serviceError(code, fallback) {
    return {
      INVALID_OTP: "Incorrect OTP. Please check and try again.",
      OTP_EXPIRED: "This OTP has expired. Please request a new OTP.",
      TOO_MANY_ATTEMPTS: "Too many incorrect attempts. Please request a new OTP.",
      RESEND_TOO_SOON: "Please wait before requesting another OTP.",
      CONSENT_REQUIRED: "Please give your consent to continue.",
      NOT_CONFIGURED: "Verification service is not connected yet.",
      PROVIDER_UNAVAILABLE: "The verification service is temporarily unavailable. Please try again."
    }[code] || fallback || "Something went wrong. Please try again.";
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
  function dashboardPath() {
    return state.operatingModel === "transporter" ? "driver/transporter/dashboard.php" : "driver/owner/dashboard.php";
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
    setTimeout(() => go(dashboardPath()), 500);
  }
  async function sendLoginOtp(form) {
    const input = form.querySelector("#login-mobile");
    const digits = input.value.replace(/\D/g, "");
    const error = !digits ? "Enter your mobile number." : isValidMobile(digits) ? "" : "Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9.";
    setFieldError(input, error);
    if (error) return input.focus();
    const button = form.querySelector(".auth-submit");
    setLoading(button, true, "Sending OTP…");
    const res = await svc.AuthService.sendLoginOtp({ mobile: digits });
    if (!res.ok) {
      setLoading(button, false, "Send OTP");
      return setFieldError(input, res.code === "NOT_CONFIGURED" ? "Login service is not connected yet." : serviceError(res.code));
    }
    temp.loginOtp = "";
    Object.assign(state.login, { mobile: digits, referenceId: res.referenceId, sentAt: Date.now(), expiresIn: res.expiresIn, resendIn: res.resendIn });
    store.save(state);
    render();
  }
  async function verifyLoginOtp(form) {
    const otpCode = temp.loginOtp;
    if (!/^\d{6}$/.test(otpCode)) return setMessage("login-otp-error", "Enter the 6-digit OTP.");
    const button = form.querySelector(".auth-submit");
    setLoading(button, true, "Verifying…");
    const res = await svc.AuthService.verifyLoginOtp({ referenceId: state.login.referenceId, otp: otpCode });
    if (!res.ok) {
      setLoading(button, false, "Verify & Login");
      temp.loginOtp = "";
      form.querySelectorAll("[data-otp-temp] .otp").forEach((el) => { el.value = ""; });
      form.querySelector("[data-otp-temp] .otp").focus();
      return setMessage("login-otp-error", serviceError(res.code));
    }
    temp.loginOtp = "";
    Object.assign(state.login, { referenceId: "", sentAt: 0, user: `+91${state.login.mobile}` });
    store.save(state);
    const card = document.querySelector("[data-login-card]");
    card.innerHTML = loginSuccess();
    setTimeout(() => go(dashboardPath()), 1000);
  }
  async function verifyDrivingLicence(form) {
    const numberInput = form.querySelector("#pd-dl-number");
    const dobInput = form.querySelector("#pd-dl-dob");
    const DL = svc.DrivingLicenceVerificationService;
    const number = DL.normalize(numberInput.value);
    const dob = dobInput.value;
    const error = !number ? "Enter your driving licence number." : !DL.isValid(number) ? "Enter a valid driving licence number, e.g. MH1220190001234." : !dob ? "Enter your date of birth." : "";
    setMessage("dl-error", error);
    if (error) return (number && DL.isValid(number) ? dobInput : numberInput).focus();
    const button = form.querySelector(".dl-verify");
    setLoading(button, true, "Verifying licence…");
    const fullName = state.aadhaar.status === "verified" ? [state.personal.first, state.personal.middle, state.personal.last].filter(Boolean).join(" ") : "";
    const res = await DL.verify({ number, dob, expectedName: fullName });
    Object.assign(state.dl, { number, dob, checkedAt: new Date().toISOString(), checkedFor: `${number}|${dob}`, source: res.source });
    if (res.ok) {
      state.dl.status = res.status;
      state.dl.result = res.licence || { reason: res.reason };
      if (res.licence) {
        const l = res.licence;
        state.dl.state = l.state;
        state.dl.manual = { ...state.dl.manual, name: l.name, type: l.type, issueDate: l.issueDate, validTransport: l.validTransport, validNonTransport: l.validNonTransport, expiry: l.type === "Transport" ? l.validTransport : l.validNonTransport, state: l.state, authority: l.authority, classes: (l.classes || []).join(", ") };
        state.dl.method = "online";
      }
    } else {
      // Service unreachable or not configured: online verification is not possible right now.
      state.dl.status = "failed";
      state.dl.result = { reason: res.code };
    }
    store.save(state);
    render();
  }
  async function validateTransporter(form) {
    const input = form.querySelector("#transporter-id");
    const TS = svc.TransporterService;
    const id = TS.normalizeId(input.value);
    const t = state.transporter;
    const error = !id ? "Enter your Transporter ID." : TS.isValidId(id) ? "" : "Enter a valid Transporter ID, e.g. WTT-10021.";
    const showError = (msg) => {
      input.closest(".ws-phone").classList.toggle("invalid", Boolean(msg));
      input.setAttribute("aria-invalid", msg ? "true" : "false");
      setMessage("transporter-id-error", msg);
    };
    showError(error);
    if (error) return input.focus();
    const switching = t.submission === "submitted" && id !== t.id;
    if (switching && !confirm("Validating a different Transporter ID will withdraw your current association request. Continue?")) return;
    const button = form.querySelector(".ws-cta");
    setLoading(button, true, "Validating…");
    const res = await TS.lookup({ transporterId: id });
    if (!res.ok) {
      setLoading(button, false, "Validate Transporter");
      return showError(res.code === "NOT_FOUND" ? "No transporter found with this ID. Please check the ID with your transporter." : serviceError(res.code));
    }
    if (switching && t.requestId) await TS.withdrawAssociation({ requestId: t.requestId });
    if (id !== t.id) Object.assign(t, { confirmed: false, requestId: "", association: "none", submission: "draft", submittedAt: "", decidedAt: "", lastCheckedAt: "", vehicle: null });
    Object.assign(t, { id, query: id, match: res.transporter, source: res.source });
    ensureDriverId();
    store.save(state);
    go("driver/transporter/transporter-details.php");
  }
  async function checkAssociation(button, silent) {
    const t = state.transporter;
    if (!t.requestId) return;
    if (button) setLoading(button, true, "Checking…");
    const res = await svc.TransporterService.getAssociationStatus({ requestId: t.requestId });
    if (!res.ok) {
      if (button) setLoading(button, false, "Refresh Status");
      if (!silent) setMessage("association-error", serviceError(res.code));
      return;
    }
    const changed = res.status !== t.association;
    Object.assign(t, { association: res.status, decidedAt: res.decidedAt || t.decidedAt, reason: res.reason || "", vehicle: res.vehicle !== undefined ? res.vehicle : t.vehicle, lastCheckedAt: new Date().toISOString(), source: res.source });
    store.save(state);
    if (changed || !silent) render();
    else {
      const cell = document.querySelector("[data-last-checked]");
      if (cell) cell.textContent = new Date(t.lastCheckedAt).toLocaleTimeString("en-GB");
    }
  }

  // ---- Modal layer: policy text and camera ----
  let lastFocus = null;
  let camStream = null;
  let camShot = "";
  function openModal(html) {
    if (!layer.innerHTML) lastFocus = document.activeElement;
    layer.innerHTML = html;
    document.body.classList.add("modal-open");
    const focusTarget = layer.querySelector("[data-cam], [data-policy-accept], .wt-modal-body[tabindex], [data-modal-close]");
    if (focusTarget) focusTarget.focus();
  }
  function closeModal() {
    stopCamera();
    layer.innerHTML = "";
    document.body.classList.remove("modal-open");
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    lastFocus = null;
  }
  function stopCamera() {
    if (camStream) camStream.getTracks().forEach((track) => track.stop());
    camStream = null;
  }
  async function startCamera() {
    stopCamera();
    openModal(cameraDialog("starting"));
    if (!window.isSecureContext || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return openModal(cameraDialog("error", "Camera is not available. Open this page over HTTPS on a device with a camera."));
    }
    try {
      camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 960 } }, audio: false });
    } catch (err) {
      const name = err && err.name;
      const message = name === "NotAllowedError" || name === "SecurityError" ? "Camera permission was denied."
        : name === "NotFoundError" || name === "OverconstrainedError" ? "No camera was found on this device."
          : name === "NotReadableError" ? "The camera is being used by another app."
            : "The camera could not be started.";
      return openModal(cameraDialog("error", message));
    }
    if (!layer.querySelector('[data-modal="camera"]')) return stopCamera();
    openModal(cameraDialog("live"));
    layer.querySelector("[data-cam-video]").srcObject = camStream;
  }
  function takePhoto() {
    const video = layer.querySelector("[data-cam-video]");
    if (!video || !video.videoWidth) return;
    const side = Math.min(video.videoWidth, video.videoHeight);
    const canvas = document.createElement("canvas");
    canvas.width = 480;
    canvas.height = 480;
    canvas.getContext("2d").drawImage(video, (video.videoWidth - side) / 2, (video.videoHeight - side) / 2, side, side, 0, 0, 480, 480);
    camShot = canvas.toDataURL("image/jpeg", 0.85);
    stopCamera();
    openModal(cameraDialog("preview"));
    layer.querySelector("[data-cam-preview]").src = camShot;
  }

  // ---- Aadhaar ----
  async function sendAadhaarOtp(button) {
    const digits = temp.aadhaarNumber;
    const error = !digits ? "Enter your Aadhaar number." : digits.length !== 12 ? "Aadhaar number must have 12 digits." : !svc.AadhaarVerificationService.isValidAadhaar(digits) ? "This is not a valid Aadhaar number. Please check the digits and try again." : !state.aadhaar.consent ? "Please give your consent to continue." : "";
    setMessage("aadhaar-error", error);
    if (error) return document.getElementById(digits && state.aadhaar.consent ? "aadhaar-number" : digits ? "pd-aadhaar-consent" : "aadhaar-number")?.focus();
    setLoading(button, true, "Sending OTP…");
    const res = await svc.AadhaarVerificationService.sendOtp({ aadhaar: digits, consent: true });
    if (!res.ok && AADHAAR_FATAL.includes(res.code)) return aadhaarFailed(res.code, digits.slice(-4), res.source);
    if (!res.ok) {
      setLoading(button, false, "Send OTP");
      return setMessage("aadhaar-error", serviceError(res.code));
    }
    temp.aadhaarNumber = "";
    temp.aadhaarOtp = "";
    Object.assign(state.aadhaar, { status: "otp_sent", referenceId: res.referenceId, last4: res.last4, sentAt: Date.now(), expiresIn: res.expiresIn, resendIn: res.resendIn, source: res.source });
    store.save(state);
    render();
    const first = document.querySelector('[data-otp-temp="aadhaarOtp"] .otp');
    if (first) first.focus();
  }
  // Errors after which retrying the same OTP cannot succeed: offer Try Again or manual entry.
  const AADHAAR_FATAL = ["NOT_CONFIGURED", "PROVIDER_UNAVAILABLE", "TOO_MANY_ATTEMPTS"];
  function aadhaarFailed(code, last4, source) {
    temp.aadhaarNumber = "";
    temp.aadhaarOtp = "";
    Object.assign(state.aadhaar, { status: "failed", failedReason: code, referenceId: "", last4: last4 || "", sentAt: 0, source: source || "" });
    store.save(state);
    render();
  }
  async function verifyAadhaarOtp(button) {
    if (!/^\d{6}$/.test(temp.aadhaarOtp)) return setMessage("aadhaar-error", "Enter the 6-digit OTP.");
    setLoading(button, true, "Verifying…");
    const res = await svc.AadhaarVerificationService.verifyOtp({ referenceId: state.aadhaar.referenceId, otp: temp.aadhaarOtp });
    temp.aadhaarOtp = "";
    if (!res.ok && AADHAAR_FATAL.includes(res.code)) return aadhaarFailed(res.code, state.aadhaar.last4, res.source);
    if (!res.ok) {
      setLoading(button, false, "Verify Aadhaar");
      document.querySelectorAll('[data-otp-temp="aadhaarOtp"] .otp').forEach((el) => { el.value = ""; });
      return setMessage("aadhaar-error", serviceError(res.code));
    }
    // Map provider fields into Basic Information; identity attributes become read-only.
    const profile = res.profile || {};
    const names = String(profile.name || "").trim().split(/\s+/);
    const p = state.personal;
    Object.assign(p, { dob: profile.dob || "", gender: profile.gender || "" });
    if (names[0]) Object.assign(p, { first: names[0], middle: names.length > 2 ? names.slice(1, -1).join(" ") : "", last: names.length > 1 ? names[names.length - 1] : "" });
    p.father = profile.careOf || "";
    if (profile.address) {
      Object.assign(p, { permanent: profile.address.line || "", city: profile.address.district || "", state: profile.address.state || "", pincode: profile.address.pincode || "", sameAddress: true });
      p.current = p.permanent;
    }
    Object.assign(state.aadhaar, { method: "aadhaar", failedReason: "", status: "verified", last4: res.last4 || state.aadhaar.last4, verifiedAt: res.verifiedAt || new Date().toISOString(), source: res.source, profile: null });
    state.kyc.status = "pending";
    store.save(state);
    render();
  }
  async function resendOtpFor(kind) {
    const session = kind === "login" ? state.login : state.aadhaar;
    const service = kind === "login" ? svc.AuthService.resendLoginOtp : svc.AadhaarVerificationService.resendOtp;
    const res = await service({ referenceId: session.referenceId });
    const errorId = kind === "login" ? "login-otp-error" : "aadhaar-error";
    if (!res.ok) return setMessage(errorId, serviceError(res.code));
    Object.assign(session, { referenceId: res.referenceId || session.referenceId, sentAt: Date.now(), expiresIn: res.expiresIn, resendIn: res.resendIn });
    temp[kind === "login" ? "loginOtp" : "aadhaarOtp"] = "";
    store.save(state);
    render();
    setMessage(errorId, "A new OTP has been sent.", "ok");
  }
  async function runIdentityChecks(button) {
    button.disabled = true;
    button.querySelector("span").textContent = "Verifying…";
    const res = await svc.IdentityVerificationService.runChecks({ aadhaarReference: state.aadhaar.referenceId || "manual-review", photoCaptured: photoCaptured() });
    if (!res.ok) {
      button.disabled = false;
      button.querySelector("span").textContent = "Start Verification";
      return setMessage("identity-error", serviceError(res.code));
    }
    const pending = [...document.querySelectorAll("[data-id-flow] .id-stage.is-pending")];
    pending.forEach((stage, index) => setTimeout(() => {
      stage.classList.replace("is-pending", "is-done");
      stage.querySelector(".id-dot").innerHTML = icons.check;
      const tag = stage.querySelector(".badge");
      tag.className = "badge green";
      tag.textContent = "Completed";
    }, (index + 1) * 400));
    setTimeout(() => {
      Object.assign(state.kyc, { status: "verified", checkedAt: res.checkedAt || new Date().toISOString(), source: res.source });
      store.save(state);
      render();
    }, (pending.length + 1) * 400);
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
    const handlers = {
      "login-otp": sendLoginOtp,
      "login-verify": verifyLoginOtp,
      dl: verifyDrivingLicence,
      transporter: validateTransporter,
      login: submitLogin
    };
    const form = event.target.closest("[data-form]");
    if (!form || !handlers[form.dataset.form]) return;
    event.preventDefault();
    handlers[form.dataset.form](form);
  });

  document.addEventListener("input", (event) => {
    if (event.target.closest(".auth-input.invalid")) setFieldError(event.target, "");
    if (/^dl\./.test(event.target.dataset.field || "")) {
      store.setByPath(state, event.target.dataset.field, event.target.value);
      if (state.dl.method === "manual" && state.dl.manualStatus === "submitted") state.dl.manualStatus = "draft";
      const actions = document.querySelector(".ws-driving-licence .pd-actions");
      if (actions) actions.outerHTML = dlActions();
    }
    if (event.target.id === "mobile-number") {
      const input = event.target;
      input.value = input.value.replace(/\D/g, "").slice(0, 10);
      // Send OTP stays enabled (solid red); an empty or invalid number is rejected on submit with an inline error.
      const valid = isValidMobile(input.value);
      if (valid || input.closest(".ws-phone").classList.contains("invalid")) showMobileError(input, input.value, input.value.length === 10);
    }
    if (event.target.dataset.temp) temp[event.target.dataset.temp] = event.target.value;
    if (event.target.id === "login-mobile") {
      event.target.value = event.target.value.replace(/\D/g, "").slice(0, 10);
      state.login.mobile = event.target.value;
      store.save(state);
    }
    if (event.target.id === "aadhaar-number") {
      const input = event.target;
      temp.aadhaarNumber = input.value.replace(/\D/g, "").slice(0, 12);
      input.value = temp.aadhaarNumber.replace(/(\d{4})(?=\d)/g, "$1 ");
      setMessage("aadhaar-error", "");
    }
  });

  document.addEventListener("input", (event) => {
    const field = event.target.closest("[data-field]");
    if (field) {
      store.setByPath(state, field.dataset.field, field.type === "checkbox" ? field.checked : field.value);
      if (field.type === "checkbox" || field.tagName === "SELECT") render();
    }
    const otpInput = event.target.closest("[data-otp-index]");
    if (otpInput) {
      otpInput.value = otpInput.value.replace(/\D/g, "").slice(-1);
      const wrap = otpInput.closest("[data-otp], [data-otp-temp]");
      const code = [...wrap.querySelectorAll(".otp")].map((input) => input.value).join("");
      if (wrap.dataset.otpTemp) temp[wrap.dataset.otpTemp] = code;
      else store.setByPath(state, wrap.dataset.otp, code);
      if (otpInput.value && otpInput.nextElementSibling) otpInput.nextElementSibling.focus();
      setMessage(wrap.dataset.otpTemp === "loginOtp" ? "login-otp-error" : "aadhaar-error", "");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && layer.innerHTML) return closeModal();
    const otpInput = event.target.closest && event.target.closest("[data-otp-index]");
    if (otpInput && event.key === "Backspace" && !otpInput.value && otpInput.previousElementSibling) otpInput.previousElementSibling.focus();
  });

  document.addEventListener("paste", (event) => {
    const otpInput = event.target.closest && event.target.closest("[data-otp-index]");
    if (!otpInput) return;
    const digits = (event.clipboardData || window.clipboardData).getData("text").replace(/\D/g, "").slice(0, 6);
    if (!digits) return;
    event.preventDefault();
    const inputs = [...otpInput.parentElement.querySelectorAll(".otp")];
    inputs.forEach((input, index) => { input.value = digits[index] || ""; });
    inputs[Math.min(digits.length, inputs.length) - 1].dispatchEvent(new Event("input", { bubbles: true }));
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
    if (event.target.name === "vehicleGps") {
      state.vehicle.gps = event.target.value;
      store.save(state);
      event.target.closest(".gps-switch").querySelectorAll("label").forEach((label) => label.classList.toggle("selected", label.contains(event.target)));
      return;
    }
    if (event.target.name === "operatingModel") {
      state.operatingModel = event.target.value;
      store.save(state);
      render();
    }
    // Editing the licence number or DOB after a check invalidates the previous result.
    if (["dl.number", "dl.dob"].includes(event.target.dataset.field) && state.dl.result) {
      const key = `${svc.DrivingLicenceVerificationService.normalize(state.dl.number)}|${state.dl.dob}`;
      if (key !== state.dl.checkedFor) {
        Object.assign(state.dl, { status: "unverified", result: null, checkedFor: "" });
        store.save(state);
        render();
      }
    }
    const demo = event.target.closest("[data-demo]");
    if (demo && demo.value) {
      runDemo(demo.value);
      demo.value = "";
    }
  });

  document.addEventListener("click", (event) => {
    if (event.target.matches(".wt-modal") || event.target.closest("[data-modal-close]")) {
      closeModal();
      return;
    }
    const dbLink = event.target.closest(".db-menu a");
    if (dbLink) {
      document.querySelectorAll(".db-menu a").forEach((a) => {
        a.classList.toggle("active", a === dbLink);
        if (a === dbLink) a.setAttribute("aria-current", "page");
        else a.removeAttribute("aria-current");
      });
    }
    const cam = event.target.closest("[data-cam]");
    if (cam) {
      const kind = cam.dataset.cam;
      if (kind === "take") takePhoto();
      if (kind === "retake" || kind === "retry") startCamera();
      if (kind === "use" && camShot) {
        Object.assign(state.personal, { photo: camShot, photoCapturedAt: new Date().toISOString() });
        state.kyc.status = "pending";
        store.save(state);
        camShot = "";
        closeModal();
        render();
      }
      return;
    }
    const policy = event.target.closest("[data-policy]");
    if (policy) {
      openModal(policyDialog(policy.dataset.policy));
      return;
    }
    const accept = event.target.closest("[data-policy-accept]");
    if (accept) {
      store.setByPath(state, POLICIES[accept.dataset.policyAccept].path, true);
      closeModal();
      render();
      return;
    }
    const method = event.target.closest("[data-login-method]");
    if (method) {
      state.login.method = method.dataset.loginMethod;
      store.save(state);
      render();
      const active = document.querySelector(`[data-login-method="${state.login.method}"]`);
      if (active) active.focus();
      return;
    }
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
      if (/^dl\./.test(uploadButton.dataset.upload) && state.dl.manualStatus === "submitted") state.dl.manualStatus = "draft";
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
        if (temp.mobileOtp !== cfg.DEMO_MOBILE_OTP) return alert(`Use demo OTP ${cfg.DEMO_MOBILE_OTP}.`);
        temp.mobileOtp = "";
        state.mobile.verified = true;
        store.save(state);
        go("driver/email.php");
      } else {
        if (temp.emailOtp !== cfg.DEMO_EMAIL_OTP) return alert(`Use demo OTP ${cfg.DEMO_EMAIL_OTP}.`);
        temp.emailOtp = "";
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
    const action = event.target.closest("[data-action]");
    if (!action) return;
    const name = action.dataset.action;
    if (name === "reset-password") go("login.php");
    if (name === "open-camera") startCamera();
    if (name === "login-change-mobile") {
      Object.assign(state.login, { referenceId: "", sentAt: 0 });
      temp.loginOtp = "";
      store.save(state);
      render();
    }
    if (name === "login-resend") resendOtpFor("login");
    if (name === "aadhaar-send") sendAadhaarOtp(action);
    if (name === "aadhaar-verify") verifyAadhaarOtp(action);
    if (name === "aadhaar-resend") resendOtpFor("aadhaar");
    // Switching method never clears what the driver has already typed.
    if (name === "aadhaar-manual") {
      temp.aadhaarOtp = "";
      state.aadhaar.method = "manual";
      if (state.aadhaar.status === "otp_sent") Object.assign(state.aadhaar, { status: "idle", referenceId: "", sentAt: 0 });
      store.save(state);
      render();
      document.getElementById("pd-personal-first")?.focus();
    }
    if (name === "aadhaar-mode") {
      state.aadhaar.method = "aadhaar";
      if (state.aadhaar.status === "failed") state.aadhaar.status = "idle";
      store.save(state);
      render();
      document.getElementById("aadhaar-number")?.focus();
    }
    if (name === "aadhaar-change") {
      Object.assign(state.aadhaar, { method: "aadhaar", status: "idle", referenceId: "", last4: "", sentAt: 0 });
      temp.aadhaarOtp = "";
      store.save(state);
      render();
      document.getElementById("aadhaar-number")?.focus();
    }
    if (name === "aadhaar-reset") {
      if (!confirm("This will remove your verified Aadhaar status. You will need to verify again. Continue?")) return;
      Object.assign(state.aadhaar, { status: "idle", referenceId: "", last4: "", sentAt: 0, verifiedAt: "", source: "", consent: false });
      ["first", "middle", "last", "dob", "gender", "father", "permanent", "current", "city", "state", "pincode", "currentState", "currentCity", "currentPincode"].forEach((key) => { state.personal[key] = ""; });
      state.personal.sameAddress = false;
      state.kyc.status = "pending";
      store.save(state);
      render();
    }
    if (name === "run-identity") runIdentityChecks(action);
    // Switching licence route keeps everything already entered.
    if (name === "dl-manual" || name === "dl-online") {
      state.dl.method = name === "dl-manual" ? "manual" : "online";
      store.save(state);
      render();
      document.getElementById("pd-dl-number")?.focus();
    }
    if (name === "dl-retry") {
      if (state.dl.method === "manual") { state.dl.method = "online"; store.save(state); render(); }
      const form = document.querySelector("[data-form=dl]");
      if (form) verifyDrivingLicence(form);
    }
    if (name === "dl-manual-submit") {
      if (!dlManualComplete()) return setMessage("dl-manual-error", "Complete all required licence details and upload both sides of your licence.");
      Object.assign(state.dl, { number: svc.DrivingLicenceVerificationService.normalize(state.dl.number), manualStatus: "submitted", manualSubmittedAt: new Date().toISOString() });
      store.save(state);
      render();
    }
    if (name === "owner-verify") {
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
    if (name === "password-next") {
      // Leaving the fields empty keeps a password that was already set.
      if (state.password.set && !temp.password && !temp.confirm) return go("driver/consent.php");
      if (temp.password.length < 8 || !/\d/.test(temp.password) || temp.password !== temp.confirm) return alert("Password must be 8+ characters, include a number, and match confirmation.");
      state.password.set = true;
      temp.password = "";
      temp.confirm = "";
      store.save(state);
      go("driver/consent.php");
    }
    if (name === "consent-next") {
      if (!state.consent.terms || !state.consent.privacy) return setMessage("consent-error", "Terms and Privacy Policy are required.");
      go("driver/personal-details.php");
    }
    if (name === "choose-operating") {
      if (!state.operatingModel) return alert("Select Owner Driver or Transporter Driver.");
      go(state.operatingModel === "owner" ? "driver/owner/vehicle.php" : "driver/transporter/transporter-id.php");
    }
    if (name === "submit-owner") {
      state.approvalState = "Approved";
      state.finalApproved = true;
      store.save(state);
      go("driver/owner/status.php");
    }
    if (name === "submit-association") {
      const t = state.transporter;
      setLoading(action, true, "Submitting…");
      // Read-only summary for the transporter's review. Only masked identifiers are shared.
      const driver = {
        name: [state.personal.first, state.personal.middle, state.personal.last].filter(Boolean).join(" "),
        mobile: state.mobile.number ? maskMobile(state.mobile.number) : "",
        city: [state.personal.city, state.personal.state].filter(Boolean).join(", "),
        kyc: state.kyc.status === "verified" ? "verified" : identitySource() === "manual" ? "manual_review" : "pending",
        licence: dlSource(),
        licenceClasses: state.dl.manual.classes || ""
      };
      svc.TransporterService.requestAssociation({ driverId: ensureDriverId(), transporterId: t.id, driver }).then((res) => {
        if (!res.ok) {
          setLoading(action, false, "Submit Association Request");
          return setMessage("association-error", serviceError(res.code));
        }
        Object.assign(t, { requestId: res.requestId, association: res.status, submission: "submitted", submittedAt: res.createdAt || new Date().toISOString(), source: res.source });
        store.save(state);
        go("driver/transporter/request-status.php");
      });
    }
    if (name === "check-association") checkAssociation(action, false);
  });

  // ---- Searchable dropdown behaviour ----
  function comboRender(combo, query) {
    const list = combo.querySelector(".combo-list");
    const input = combo.querySelector("input");
    const q = (query || "").trim().toLowerCase();
    const matches = comboOptions(combo.dataset.source).filter((o) => o.toLowerCase().includes(q));
    const current = store.getByPath(state, combo.dataset.combo);
    list.innerHTML = matches.length
      ? matches.map((o, i) => `<li role="option" id="${input.id}-opt-${i}" data-value="${esc(o)}" class="${i === 0 ? "active" : ""}" aria-selected="${o === current}">${esc(o)}</li>`).join("")
      : `<li class="combo-empty" role="option" aria-disabled="true">${hindiActive() ? "कोई परिणाम नहीं" : "No matches"}</li>`;
    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
    const active = list.querySelector("li.active");
    if (active) input.setAttribute("aria-activedescendant", active.id);
  }
  function comboClose(combo) {
    const list = combo.querySelector(".combo-list");
    list.hidden = true;
    combo.querySelector("input").setAttribute("aria-expanded", "false");
  }
  function comboSelect(combo, value) {
    const path = combo.dataset.combo;
    if (value !== store.getByPath(state, path)) {
      store.setByPath(state, path, value);
      // A new state invalidates the district chosen under the old one.
      const dependent = { "personal.currentState": "personal.currentCity", "personal.state": "personal.city", "company.details.state": "company.details.city", "company.details.opState": "company.details.opCity" }[path];
      if (dependent) store.setByPath(state, dependent, "");
    }
    comboClose(combo);
    render();
    const next = document.getElementById({ "personal.currentState": "pd-personal-currentCity", "personal.currentCity": "pd-personal-currentPincode", "personal.state": "pd-personal-city", "personal.city": "pd-personal-pincode", "dl.manual.state": "pd-dl-manual-authority" }[path]);
    if (next) next.focus();
  }
  document.addEventListener("focusin", (event) => {
    const combo = event.target.closest && event.target.closest("[data-combo]");
    if (combo && event.target.tagName === "INPUT") {
      event.target.select();
      comboRender(combo, "");
    }
  });
  document.addEventListener("input", (event) => {
    const combo = event.target.closest("[data-combo]");
    if (combo) comboRender(combo, event.target.value);
  });
  document.addEventListener("keydown", (event) => {
    const combo = event.target.closest && event.target.closest("[data-combo]");
    if (!combo) return;
    const list = combo.querySelector(".combo-list");
    const items = [...list.querySelectorAll("li[data-value]")];
    let index = items.findIndex((li) => li.classList.contains("active"));
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (list.hidden) return comboRender(combo, event.target.value);
      if (!items.length) return;
      index = (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items.forEach((li, i) => li.classList.toggle("active", i === index));
      items[index].scrollIntoView({ block: "nearest" });
      event.target.setAttribute("aria-activedescendant", items[index].id);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (!list.hidden && items[index]) comboSelect(combo, items[index].dataset.value);
    } else if (event.key === "Escape" && !list.hidden) {
      event.stopPropagation();
      event.target.value = store.getByPath(state, combo.dataset.combo) || "";
      comboClose(combo);
    }
  }, true);
  document.addEventListener("mousedown", (event) => {
    const option = event.target.closest(".combo-list li[data-value]");
    if (option) {
      event.preventDefault();
      comboSelect(option.closest("[data-combo]"), option.dataset.value);
    }
  });
  document.addEventListener("focusout", (event) => {
    const combo = event.target.closest && event.target.closest("[data-combo]");
    if (!combo || event.target.tagName !== "INPUT") return;
    const typed = event.target.value.trim().toLowerCase();
    const exact = comboOptions(combo.dataset.source).find((o) => o.toLowerCase() === typed);
    if (exact && exact !== store.getByPath(state, combo.dataset.combo)) return comboSelect(combo, exact);
    // Only values from the list are accepted; anything else reverts.
    event.target.value = store.getByPath(state, combo.dataset.combo) || "";
    comboClose(combo);
  });

  // Resend countdowns.
  setInterval(() => {
    document.querySelectorAll("[data-resend-at]").forEach((button) => {
      const left = Math.max(0, Math.ceil((Number(button.dataset.resendAt) - Date.now()) / 1000));
      const label = left ? `Resend OTP in ${clock(left)}` : "Resend OTP";
      button.disabled = Boolean(left);
      if (button.dataset.label !== label) {
        button.dataset.label = label;
        button.textContent = label;
      }
    });
  }, 1000);

  function runDemo(kind) {
    if (kind === "reset") state = store.clone(store.defaults);
    if (kind === "otp") {
      temp.mobileOtp = cfg.DEMO_MOBILE_OTP;
      temp.emailOtp = cfg.DEMO_EMAIL_OTP;
      state.mobile.verified = true;
      state.email.verified = true;
    }
    if (["rc", "insurance", "puc", "fitness"].includes(kind)) state.documents[kind] = "verified";
    if (kind === "finalApproved") {
      state.approvalState = "Approved";
      state.finalApproved = true;
    }
    store.save(state);
    render();
  }

  // Transporter / Shipper company module (assets/js/company.js) renders with the shared UI helpers.
  const company = window.WheeltrackCompany && window.WheeltrackCompany({
    page, cfg, svc, store, icons, temp, POLICIES,
    getState: () => state,
    render, root, go, esc, badge, shell, onboardWorkspace, pdHead, pdField, pdSelect, pdCombo, sourceTag, otpTemp, resendRow,
    setMessage, setLoading, serviceError, formatDate, maskMobile, isValidMobile, langSwitch, brand, callLink, devbar, consentItem,
    field, regTitle, regMobileForm, regOtpCard, regEmailCard, regPasswordCard, regConsentCard,
    openModal, closeModal, hindiActive
  });

  render();
  if (page.screen === "transporter:request-status" && state.transporter.association === "pending") checkAssociation(null, true);
})();
