/*
 * Wheeltrack – Transporter / Shipper company module.
 *
 * Registration (8 steps), the post-registration company dashboard and the transporter vehicle workflow.
 * Rendering reuses the shared helpers from app.js (passed in as `ui`); every verification goes through
 * assets/js/services.js, so sandbox results are always labelled and never shown as real verifications.
 *
 * Client-side checks here are for the user only. Permissions, state transitions, duplicate checks and
 * file rules must be enforced again on the server (see database/transporter_schema.sql).
 */
(function () {
  window.WheeltrackCompany = function (ui) {
    const { cfg, svc, store, icons, temp, esc, badge, root, go, pdHead, pdField, pdSelect, pdCombo, sourceTag, setMessage, setLoading, formatDate } = ui;
    const params = new URLSearchParams(window.location.search);
    const S = () => ui.getState();
    const C = () => S().company;
    const save = () => store.save(S());
    const REC = cfg.COMPANY_RECOMMENDATIONS !== false;
    const now = () => new Date().toISOString();
    const uid = (prefix) => `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    const isSandbox = (service) => svc.providerFor(service) === "sandbox";
    const filled = (v) => String(v ?? "").trim() !== "";
    const today = () => new Date().toISOString().slice(0, 10);
    const timeOf = (iso) => (iso ? new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "");
    const dateTime = (iso) => (iso ? `${formatDate(iso)} ${timeOf(iso)}` : "—");

    // ---------------------------------------------------------------- constants
    // The first four steps follow Driver Registration exactly (shared components in app.js).
    // [id, path, label, sidebar note, icon, sub-pages grouped under the same sidebar step]
    const STEPS = [
      ["mobile", "transporter/register.php", "Mobile Verification", "Verify phone number", "phoneVerify", ["mobile-otp"]],
      ["email", "transporter/email.php", "Email Verification", "Verify email address", "mail", ["email-otp"]],
      ["password", "transporter/password.php", "Password Setup", "Secure your account", "lock"],
      ["consent", "transporter/consent.php", "Consent", "Terms & preferences", "shield"],
      ["details", "transporter/company-details.php", "Company Details", "Legal & contact information", "factory"],
      ["representative", "transporter/representative.php", "Business Representative", "People who act for the company", "driver"],
      ["identity", "transporter/identity.php", "Identity Verification", "Aadhaar or manual review", "shield"],
      ["kyc", "transporter/business-kyc.php", "Business KYC", "PAN, GSTIN & CIN", "idCard"],
      ["documents", "transporter/documents.php", "Documents", "Upload & track documents", "upload"],
      ["review", "transporter/review.php", "Review & Submit", "Check & submit", "check"],
      ["status", "transporter/status.php", "Registration Approval", "Wheeltrack review", "shield"]
    ];
    const STEP_IDS = STEPS.map(([id]) => id);
    const SUB_PAGES = { "mobile-otp": "transporter/mobile-otp.php", "email-otp": "transporter/email-otp.php" };
    const COMMON = ["mobile", "mobile-otp", "email", "email-otp", "password", "consent"];
    // Page order for Back links: every step followed by its sub-pages.
    const PAGE_ORDER = STEPS.flatMap(([id, , , , , subs]) => [id, ...(subs || [])]);
    const stepOf = (page) => (STEPS.find(([id, , , , , subs]) => id === page || (subs || []).includes(page)) || [])[0];
    const pathOf = (id) => SUB_PAGES[id] || STEPS.find(([key]) => key === id)[1];
    // Common steps reuse the driver step ids so they get the same workspace classes; business steps are prefixed.
    const wsId = (page) => (COMMON.includes(page) ? page : `co-${page}`);
    const INDUSTRIES = ["", "Logistics & Transportation", "Manufacturing", "FMCG", "Agriculture", "Construction & Infrastructure", "Mining & Minerals", "Retail & E-commerce", "Pharmaceuticals", "Automotive", "Chemicals", "Textiles", "Other"];
    const NATURES = ["", "Transporter", "Shipper", "Both"];
    const ROLES = ["Company Admin", "Authorized Representative", "Operations Manager", "Fleet Manager", "Driver Association Manager", "Document / Compliance Manager", "Finance Manager", "Viewer"];
    const EMPLOYEE_TYPES = ["", "Permanent Employee", "Contract Employee", "Director / Partner / Proprietor", "Authorized Agent", "Other"];
    const EMPLOYEE_DOCS = [["joining", "Joining Letter"], ["offer", "Offer Letter"], ["appointment", "Appointment Letter"], ["authorization", "Authorization Letter"], ["other", "Other Supporting Document"]];
    const ID_DOC_TYPES = ["", "PAN Card", "Passport", "Voter ID", "Driving Licence", "Other Government ID"];
    const MODULES = [["overview", "Overview", "grid"], ["profile", "Company Profile", "factory"], ["representatives", "Representatives", "driver"], ["vehicles", "Vehicles", "truck"], ["drivers", "Drivers", "handshake"], ["assignments", "Vehicle Assignment", "pin"], ["documents", "Documents & Compliance", "idCard"], ["audit", "Audit Log", "chart"]];
    const ROLE_PERMISSIONS = {
      "Company Admin": MODULES.map(([key]) => key),
      "Authorized Representative": ["overview", "profile", "vehicles", "drivers", "assignments", "documents"],
      "Operations Manager": ["overview", "vehicles", "drivers", "assignments"],
      "Fleet Manager": ["overview", "vehicles", "assignments"],
      "Driver Association Manager": ["overview", "drivers"],
      "Document / Compliance Manager": ["overview", "profile", "documents"],
      "Finance Manager": ["overview", "profile"],
      Viewer: ["overview"]
    };
    const V_STATUS = {
      not_started: ["Not Started", ""], pending: ["Pending", "yellow"], under_review: ["Under Review", "yellow"],
      verified: ["Verified", "green"], rejected: ["Rejected", "red"], failed: ["Failed / Unavailable", "red"], na: ["Not Applicable", ""]
    };
    const vBadge = (status) => badge(...(V_STATUS[status] || V_STATUS.not_started));
    const DOC_STATUS = { pending: ["Uploaded", "yellow"], under_review: ["Under Review", "yellow"], verified: ["Verified", "green"], rejected: ["Rejected", "red"] };
    const SECTIONS = [["details", "Company Details"], ["representative", "Business Representative"], ["identity", "Identity Verification"], ["kyc", "Business KYC"], ["documents", "Documents"]];

    // ---------------------------------------------------------------- state helpers
    function otpSession() {
      return { referenceId: "", sentAt: 0, expiresIn: 0, resendIn: 0 };
    }
    function newIdentity() {
      return { method: "aadhaar", status: "idle", consent: false, referenceId: "", last4: "", sentAt: 0, expiresIn: 0, resendIn: 0, verifiedAt: "", source: "", failedReason: "", profile: null, manual: { name: "", dob: "", gender: "", address: "", docType: "", docRef: "" }, manualStatus: "draft", manualSubmittedAt: "", doc: null };
    }
    function newRep(primary) {
      const a = C().account;
      return {
        id: uid("REP"), primary, name: "", designation: "", employeeType: "", employeeCode: "",
        mobile: primary ? a.mobile : "", mobileVerified: primary && a.mobileVerified, mobileOtp: otpSession(),
        email: primary ? a.email : "", emailVerified: primary && a.emailVerified, emailOtp: otpSession(),
        joiningDate: "", department: "", signatory: "", role: primary ? "Company Admin" : "", permissions: null,
        status: "draft", saved: false, docs: {}, identity: newIdentity(), addedAt: now()
      };
    }
    function newVehicle() {
      const docState = () => ({ status: "not_started", result: null, source: "", checkedAt: "", history: [] });
      return {
        id: uid("VEH"), registration: "", type: "", body: "", bodyLength: "", payload: "", cargo: "", area: "", availability: "Available",
        bedLength: "", bedHeight: "", bedWidth: "", gps: "",
        rc: docState(), insurance: { ...docState(), company: "", number: "", from: "", upto: "" }, puc: { ...docState(), number: "", from: "", upto: "" },
        fitness: { ...docState(), na: false, number: "", upto: "", permit: "", permitUpto: "" },
        docs: {}, status: "draft", submittedAt: "", decidedAt: "", remarks: "", createdAt: now()
      };
    }
    const reps = () => C().reps;
    const primaryRep = () => reps().find((r) => r.primary) || null;
    const repIndex = (id) => reps().findIndex((r) => r.id === id);
    const sub = () => C().submission;
    const submitted = () => sub().status !== "draft";
    const approved = () => sub().status === "approved";
    function actor() {
      const acting = approved() && reps().find((r) => r.id === C().actingAs);
      const r = acting || primaryRep();
      return { name: (r && r.name) || "Applicant", id: (r && r.id) || "" };
    }
    function audit(action, detail, opts = {}) {
      const who = opts.actor ? { name: opts.actor, id: "" } : actor();
      C().audit.unshift({ id: uid("AUD"), at: now(), actor: who.name, actorId: who.id, action, detail: detail || "", subjectId: opts.subject || "", type: opts.type || "registration" });
      if (C().audit.length > 500) C().audit.length = 500;
    }
    // Sections the applicant may change: everything while drafting; after a decision only what Wheeltrack reopened.
    function editable(section) {
      const status = sub().status;
      if (status === "draft") return true;
      if (["info_required", "rejected"].includes(status)) return ((sub().registration || {}).pendingRequirements || []).includes(section);
      return false;
    }

    // ---------------------------------------------------------------- readiness rules
    function kycRule(key) {
      const rules = cfg.COMPANY_KYC_RULES[C().details.type] || cfg.COMPANY_KYC_RULES.Other;
      return rules[key] || "optional";
    }
    function docRule(doc) {
      if (doc.recommended && !REC) return "na";
      if (doc.need === "required") return "required";
      if (doc.need === "optional") return "optional";
      return doc.need.includes(C().details.type) ? "required" : "na";
    }
    const companyDocs = () => cfg.COMPANY_DOCUMENTS.filter((doc) => docRule(doc) !== "na");
    const accountReady = () => C().account.mobileVerified && C().account.emailVerified && C().account.passwordSet;
    const consentReady = () => ["terms", "privacy", "identity"].every((key) => C().consent[key]);
    const detailsReady = () => !Object.keys(validateDetails()).length;
    const repsReady = () => Boolean(primaryRep()) && reps().every((r, i) => r.saved && !Object.keys(validateRep(i)).length);
    const identityDone = (rep) => rep && (rep.identity.status === "verified" || ["submitted", "approved"].includes(rep.identity.manualStatus));
    const identityReady = () => identityDone(primaryRep());
    const kycReady = () => !Object.keys(validateKyc()).length;
    const docsReady = () => !Object.keys(validateDocuments()).length;
    const flowRules = () => [() => C().account.mobileVerified, () => C().account.emailVerified, () => C().account.passwordSet, consentReady, detailsReady, repsReady, identityReady, kycReady, docsReady, submitted, approved];

    // ---------------------------------------------------------------- validation
    const MOBILE_RE = /^[6-9]\d{9}$/;
    const isEmail = (v) => svc.CompanyAccountService.isValidEmail(v);
    function validateDetails() {
      const d = C().details;
      const e = {};
      const base = "company.details.";
      if ((d.legalName || "").trim().length < 2) e[`${base}legalName`] = "Enter the legal company name.";
      if (!d.type) e[`${base}type`] = "Select the company type.";
      if (d.type === "Other" && !filled(d.typeOther)) e[`${base}typeOther`] = "Describe the company type.";
      if (REC && !d.nature) e[`${base}nature`] = "Select the nature of business.";
      if (!d.industry) e[`${base}industry`] = "Select the industry.";
      if ((d.regAddress || "").trim().length < 10) e[`${base}regAddress`] = "Enter the full registered address.";
      if (filled(d.pincode) && !/^\d{6}$/.test(d.pincode)) e[`${base}pincode`] = "Enter a valid 6-digit pincode.";
      if (!d.opSame && filled(d.opPincode) && !/^\d{6}$/.test(d.opPincode)) e[`${base}opPincode`] = "Enter a valid 6-digit pincode.";
      if (!MOBILE_RE.test(d.contact || "")) e[`${base}contact`] = filled(d.contact) ? "Enter a valid 10-digit mobile number." : "Enter the company contact number.";
      if (!isEmail(d.email)) e[`${base}email`] = filled(d.email) ? "Enter a valid email address." : "Enter the official business email.";
      if (filled(d.website) && !/^(https?:\/\/)?[\w-]+(\.[\w-]+)+([/?#].*)?$/i.test(d.website.trim())) e[`${base}website`] = "Enter a valid website, e.g. www.example.com.";
      const count = (key, label) => {
        if (filled(d[key]) && !/^\d{1,6}$/.test(d[key])) e[`${base}${key}`] = `Enter the ${label} as a whole number.`;
      };
      count("fleet", "number of vehicles");
      count("locations", "number of locations");
      // Recommendation: transporters must state their fleet size.
      if (REC && ["Transporter", "Both"].includes(d.nature) && !filled(d.fleet)) e[`${base}fleet`] = "Enter the number of vehicles in your fleet.";
      if (REC && filled(d.year) && (!/^\d{4}$/.test(d.year) || Number(d.year) < 1800 || Number(d.year) > new Date().getFullYear())) e[`${base}year`] = "Enter a valid year of establishment.";
      return e;
    }
    function validateRep(i) {
      const r = reps()[i];
      const e = {};
      if (!r) return e;
      const base = `company.reps.${i}.`;
      if ((r.name || "").trim().length < 2) e[`${base}name`] = "Enter the representative's full name.";
      if (!filled(r.designation)) e[`${base}designation`] = "Enter the designation.";
      if (!r.employeeType) e[`${base}employeeType`] = "Select the employee type.";
      if (!r.mobileVerified) e[`${base}mobile`] = MOBILE_RE.test(r.mobile || "") ? "Verify this mobile number with OTP." : "Enter a valid 10-digit mobile number.";
      if (!r.emailVerified) e[`${base}email`] = isEmail(r.email) ? "Verify this email address with OTP." : "Enter a valid email address.";
      if (filled(r.joiningDate) && r.joiningDate > today()) e[`${base}joiningDate`] = "Joining date can't be in the future.";
      if (!r.signatory) e[`${base}signatory`] = "Select whether this person is an authorized signatory.";
      if (!r.role) e[`${base}role`] = "Select a role.";
      const dup = reps().find((other, j) => j !== i && ((r.mobile && other.mobile === r.mobile) || (r.email && other.email && other.email.toLowerCase() === (r.email || "").toLowerCase())));
      if (dup) e[`${base}mobile`] = "Another representative already uses this mobile number or email.";
      // Recommendations: a non-signatory needs an authorization letter; employees need one employment document.
      if (REC && r.signatory === "no" && !r.docs.authorization) e[`${base}docs.authorization`] = "Upload an authorization letter for a representative who is not an authorized signatory.";
      if (REC && ["Permanent Employee", "Contract Employee"].includes(r.employeeType) && !["joining", "offer", "appointment"].some((k) => r.docs[k])) e[`${base}docs.joining`] = "Upload a joining, offer or appointment letter.";
      return e;
    }
    function validateRepsStep() {
      const e = {};
      if (!reps().length) e._ = "Add the business representative.";
      reps().forEach((r, i) => {
        const errors = validateRep(i);
        if (C().repEditing === r.id) Object.assign(e, errors);
        else if (!r.saved || Object.keys(errors).length) e[`_rep${i}`] = `Complete the details for ${r.name || "the representative"} or remove them.`;
      });
      if (C().repEditing && !e._) e._editing = "Save the representative you are editing.";
      return e;
    }
    function validateIdentity() {
      return identityReady() ? {} : { _: "Verify the primary representative's identity with Aadhaar or submit it for manual review." };
    }
    const KYC_TITLES = { pan: "PAN", gstin: "GSTIN", cin: "CIN" };
    function validateKyc() {
      const e = {};
      if (!C().details.type) return { _: "Select the company type in Company Details first." };
      ["pan", "gstin", "cin"].forEach((key) => {
        const rule = kycRule(key);
        const k = C().kyc[key];
        if (rule === "na") return;
        const ok = ["verified", "under_review"].includes(k.status);
        if (rule === "required" && !ok) e[`company.kyc.${key}.number`] = `Verify the ${cinLabel(key)} or submit it for manual review.`;
        if (rule === "optional" && filled(k.number) && !ok) e[`company.kyc.${key}.number`] = `Verify the ${cinLabel(key)}, submit it for manual review, or clear the field.`;
      });
      return e;
    }
    function validateDocuments() {
      const e = {};
      companyDocs().forEach((doc) => {
        const path = `company.docs.${doc.key}`;
        const meta = C().docs[doc.key];
        if (docRule(doc) === "required" && !meta) e[path] = `Upload the ${doc.label}.`;
        if (meta && meta.status === "rejected") e[path] = `Upload a new ${doc.label}. The previous file was rejected.`;
        if (meta && doc.expiry && !filled(meta.expiry)) e[path] = `Enter the validity date for the ${doc.label}.`;
        if (meta && doc.expiry && filled(meta.expiry) && meta.expiry < today()) e[path] = `The ${doc.label} has expired. Upload a valid document.`;
      });
      return e;
    }
    function validateReview() {
      const e = {};
      const gaps = flowRules().slice(0, 9).map((fn, i) => (fn() ? "" : STEPS[i][2])).filter(Boolean);
      if (gaps.length) e._ = `Complete these sections first: ${gaps.join(", ")}.`;
      const c = C().consent;
      if (!c.declaration) e["company.consent.declaration"] = "This consent is required.";
      return e;
    }
    const VALIDATORS = { details: validateDetails, representative: validateRepsStep, identity: validateIdentity, kyc: validateKyc, documents: validateDocuments, review: validateReview };

    // Inline errors: attach to the field (data-field, data-doc-path or id); anything else goes to the step message.
    const attempted = {};
    function fieldFor(path) {
      return document.querySelector(`[data-field="${path}"]`) || document.querySelector(`[data-doc-path="${path}"]`) || document.getElementById(`pd-${path.replace(/\W/g, "-")}`) || document.getElementById(path);
    }
    function clearFieldError(el) {
      const wrap = el && el.closest(".pd-field, .co-field, .co-doc, .consent-item");
      if (!wrap) return;
      wrap.classList.remove("invalid");
      wrap.querySelectorAll(".co-err").forEach((n) => n.remove());
      el.removeAttribute("aria-invalid");
      const summary = document.getElementById("co-step-error");
      if (summary && summary.dataset.generic && !document.querySelector(".co-err")) setMessage("co-step-error", "");
    }
    function showFieldError(path, message) {
      const el = fieldFor(path);
      const wrap = el && el.closest(".pd-field, .co-field, .co-doc, .consent-item");
      if (!wrap) return false;
      clearFieldError(el);
      if (!message) return true;
      wrap.classList.add("invalid");
      if (el.matches("input, select, textarea")) el.setAttribute("aria-invalid", "true");
      wrap.insertAdjacentHTML("beforeend", `<p class="field-error co-err">${esc(message)}</p>`);
      return true;
    }
    function showErrors(errors, focus) {
      document.querySelectorAll(".co-err").forEach((n) => n.remove());
      document.querySelectorAll(".invalid[class*='co-'], .pd-field.invalid").forEach((n) => n.classList.remove("invalid"));
      const loose = [];
      let first = null;
      Object.entries(errors).forEach(([path, message]) => {
        if (path.startsWith("_") || !showFieldError(path, message)) loose.push(message);
        else if (!first) first = fieldFor(path);
      });
      const count = Object.keys(errors).length;
      setMessage("co-step-error", loose.length ? loose.join(" ") : count ? "Please correct the highlighted fields." : "");
      const summary = document.getElementById("co-step-error");
      if (summary) summary.dataset.generic = loose.length ? "" : "1";
      if (focus && first) {
        first.scrollIntoView({ block: "center", behavior: "smooth" });
        if (first.matches("input, select, textarea, button")) first.focus({ preventScroll: true });
      }
    }

    // ---------------------------------------------------------------- shared renderers
    const PROTO_TAG = '<span class="sandbox-tag co-proto" title="Nothing here is sent to Wheeltrack">Prototype data · saved in this browser only</span>';
    const TEST_DECISION = '<span class="sandbox-tag co-test-decision">Test-only decision · not a real Wheeltrack approval</span>';
    function title(icon, heading, note) {
      return `${PROTO_TAG}<div class="ws-title"><span class="ws-title-icon">${icons[icon] || icons.truck}</span><div><h1>${heading}</h1><p>${note}</p></div></div>`;
    }
    function stepTitle(step, note) {
      const s = STEPS.find(([id]) => id === step);
      return title(s[4], s[2], note);
    }
    function actionsBar(step, opts = {}) {
      const i = STEP_IDS.indexOf(step);
      const back = opts.back || (i > 0 ? STEPS[i - 1][1] : "register/index.php");
      const nextPath = i < STEPS.length - 1 ? STEPS[i + 1][1] : "";
      const canEdit = opts.editable !== false;
      const next = opts.next !== undefined ? opts.next
        : canEdit ? `<button class="ws-cta pd-next" type="button" data-co-action="continue" data-step="${step}"><span class="spinner" aria-hidden="true"></span><span class="ws-cta-label">Continue</span>${icons.arrowRight}</button>`
          : `<a class="ws-cta pd-next" href="${root(nextPath)}"><span>Continue</span>${icons.arrowRight}</a>`;
      return `<div class="co-foot">
          <p class="field-error" id="co-step-error" aria-live="polite"></p>
          <div class="pd-actions"><a class="pd-back" href="${root(back)}">${icons.back}<span>Back</span></a><div class="co-actions-right">${next}</div></div>
        </div>`;
    }
    function lockNotice(section) {
      const status = sub().status;
      if (status === "draft" || editable(section)) return "";
      if (approved()) return `<p class="notice success">Your registration is approved. Changes to verified company details need a Wheeltrack review. Contact support to request a change.</p>`;
      if (["info_required", "rejected"].includes(status)) return `<p class="notice warning">Wheeltrack did not ask for changes in this section. <a href="${root(pathOf("status"))}">View requested changes</a></p>`;
      return `<p class="notice">Your registration has been submitted and is being reviewed. Editing is locked until Wheeltrack responds.</p>`;
    }
    // section: a registration section name, or true / false for an explicit open / locked state.
    function lockWrap(section, html) {
      const open = typeof section === "boolean" ? section : editable(section);
      return open ? html : `<fieldset class="co-lock" disabled>${html}</fieldset>`;
    }
    function pills(name, path, options, value) {
      return `<div class="lang-switch co-pills" role="radiogroup" aria-label="${esc(name)}">${options.map(([v, label]) => `<label class="${value === v ? "selected" : ""}"><input type="radio" name="${esc(path)}" value="${v}" data-co-radio="${esc(path)}" ${value === v ? "checked" : ""}><span>${label}</span></label>`).join("")}</div>`;
    }
    function fileSize(bytes) {
      return bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }
    // One document slot: upload, preview, replace, delete (before submission), expiry, status, reviewer comment, versions.
    function docRow(path, label, opts = {}) {
      const meta = store.getByPath(S(), path);
      const status = meta ? meta.status : "";
      const canEdit = opts.editable !== false;
      const tag = opts.need === "required" ? ' <span class="req">*</span>' : opts.need === "optional" ? ' <span class="tag-rec">Optional</span>' : "";
      const recTag = opts.recommended ? ' <span class="tag-rec tag-reco">Recommended addition</span>' : "";
      const info = meta ? `<small><span data-no-translate>${esc(meta.name)}</span> · <span data-no-translate>${fileSize(meta.size)}</span> · <span>Version</span> <span data-no-translate>${meta.version}</span> · <span>Uploaded</span> <span data-no-translate>${esc(formatDate(meta.uploadedAt))}</span></small>` : `<small>${opts.hint || "PDF, JPG or PNG"}</small>`;
      const id = `co-file-${path.replace(/\W/g, "-")}`;
      const versions = meta && meta.history && meta.history.length ? `<details class="co-history"><summary>Version history (${meta.history.length + 1})</summary><ol>${[{ version: meta.version, name: meta.name, uploadedAt: meta.uploadedAt, status: meta.status, comment: meta.comment }, ...meta.history.slice().reverse()].map((h) => `<li><span data-no-translate>v${h.version}</span> · <span data-no-translate>${esc(h.name)}</span> · <span data-no-translate>${esc(formatDate(h.uploadedAt))}</span> · ${badge(...(DOC_STATUS[h.status] || ["Replaced", ""]))}${h.comment ? ` <small data-no-translate>${esc(h.comment)}</small>` : ""}</li>`).join("")}</ol></details>` : "";
      return `<li class="co-doc ${status ? `is-${status}` : ""}" data-doc-path="${esc(path)}" tabindex="-1">
          <span class="doc-icon">${meta ? icons.check : icons.upload}</span>
          <span class="co-doc-main">
            <strong>${label}${tag}${recTag}</strong>
            ${info}
            ${meta && meta.status === "rejected" && meta.comment ? `<span class="co-doc-comment"><span>Reviewer comment:</span> <span data-no-translate>${esc(meta.comment)}</span></span>` : ""}
            ${meta && opts.expiry ? `<label class="co-expiry"><span>Valid until</span> <input type="date" data-co-expiry="${esc(path)}" value="${esc(meta.expiry || "")}" ${canEdit ? "" : "disabled"}></label>` : ""}
          </span>
          ${meta ? badge(...DOC_STATUS[status]) : badge("Not Uploaded")}
          <span class="co-doc-actions">
            ${meta ? `<button class="link-btn" type="button" data-co-action="preview-doc" data-path="${esc(path)}">Preview</button>` : ""}
            ${canEdit && meta && !submitted() ? `<button class="link-btn" type="button" data-co-action="delete-doc" data-path="${esc(path)}">Delete</button>` : ""}
            ${canEdit && (!meta || meta.status !== "verified") ? `<button class="pd-upload-btn" type="button" data-co-action="pick-file" data-target="${id}">${icons.upload}<span>${meta ? (meta.status === "rejected" ? "Re-upload" : "Replace") : "Upload"}</span></button><input id="${id}" class="co-file" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" data-co-file="${esc(path)}" hidden>` : ""}
          </span>
          ${versions}
        </li>`;
    }
    function historyList(history) {
      if (!history || !history.length) return "";
      return `<details class="co-history"><summary>Verification history (${history.length})</summary><ol>${history.slice().reverse().map((h) => `<li><span data-no-translate>${esc(dateTime(h.at))}</span> · ${vBadge(h.status)}${h.reason ? ` <small>${esc(reasonText(h.reason))}</small>` : ""}${h.source === "sandbox" ? ' <small class="co-muted">Sandbox</small>' : ""}</li>`).join("")}</ol></details>`;
    }
    function reasonText(code) {
      return { NOT_FOUND: "No record found", PROVIDER_UNAVAILABLE: "Provider unavailable", NOT_CONFIGURED: "Provider not connected", MANUAL: "Submitted for manual review", INVALID_INPUT: "Invalid number" }[code] || code;
    }

    // ---------------------------------------------------------------- contact (mobile / email) verification
    function contactBlock(kind, scope, obj, opts = {}) {
      const value = obj[kind] || "";
      const verified = obj[`${kind}Verified`];
      const session = obj[`${kind}Otp`] || otpSession();
      const path = `${scope}.${kind}`;
      const id = `pd-${path.replace(/\W/g, "-")}`;
      const otpKey = `co_${scope.replace(/\W/g, "_")}_${kind}`;
      const label = opts.label || (kind === "mobile" ? "Mobile Number" : "Email Address");
      const lock = verified || session.referenceId || opts.locked;
      const input = kind === "mobile"
        ? `<div class="ws-phone pd-phone"><span class="pd-code">+91</span><input id="${id}" type="tel" inputmode="numeric" maxlength="10" autocomplete="tel-national" placeholder="Enter 10-digit mobile number" data-field="${path}" value="${esc(value)}" ${lock ? 'readonly aria-readonly="true"' : ""}></div>`
        : `<input id="${id}" type="email" autocomplete="email" autocapitalize="none" spellcheck="false" placeholder="name@company.com" data-field="${path}" value="${esc(value)}" ${lock ? 'readonly aria-readonly="true"' : ""}>`;
      let control;
      if (verified) {
        control = `<div class="co-inline">${input}<span class="co-verified">${icons.check}<span>Verified</span></span>${opts.locked ? "" : `<button class="link-btn" type="button" data-co-action="change-contact" data-scope="${scope}" data-kind="${kind}">Change</button>`}</div>`;
      } else if (session.referenceId) {
        const left = Math.max(0, Math.ceil((session.sentAt + session.resendIn * 1000 - Date.now()) / 1000));
        control = `<div class="co-inline">${input}<button class="link-btn" type="button" data-co-action="change-contact" data-scope="${scope}" data-kind="${kind}">Change</button></div>
          <div class="co-otp">
            <span class="kyc-label">Enter the 6-digit OTP sent to <strong data-no-translate>${esc(kind === "mobile" ? ui.maskMobile(value) : value)}</strong></span>
            <div class="kyc-row">${ui.otpTemp(otpKey)}<button class="ws-cta kyc-btn" type="button" data-co-action="verify-otp" data-scope="${scope}" data-kind="${kind}"><span class="spinner" aria-hidden="true"></span><span class="ws-cta-label">Verify</span></button></div>
            <div class="resend-row"><span>Didn't receive the OTP?</span><button class="link-btn" type="button" data-co-action="resend-otp" data-scope="${scope}" data-kind="${kind}" data-resend-at="${session.sentAt + session.resendIn * 1000}" ${left ? "disabled" : ""}>${left ? `Resend OTP in ${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}` : "Resend OTP"}</button></div>
          </div>`;
      } else {
        control = `<div class="co-inline">${input}<button class="pd-upload-btn" type="button" data-co-action="send-otp" data-scope="${scope}" data-kind="${kind}"><span class="spinner dark" aria-hidden="true"></span><span class="ws-cta-label">Send OTP</span></button></div>`;
      }
      return `<div class="pd-field co-field"><label for="${id}">${label} <span class="req">*</span></label>${control}<p class="field-error" id="${id}-otp-error" aria-live="polite"></p></div>`;
    }
    async function sendContactOtp(button) {
      const { scope, kind } = button.dataset;
      const obj = store.getByPath(S(), scope);
      const value = kind === "mobile" ? String(obj.mobile || "").replace(/\D/g, "") : String(obj.email || "").trim().toLowerCase();
      const path = `${scope}.${kind}`;
      const error = kind === "mobile"
        ? (!value ? "Enter the mobile number." : MOBILE_RE.test(value) ? "" : "Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9.")
        : (!value ? "Enter the email address." : isEmail(value) ? "" : "Enter a valid email address.");
      if (error) return showFieldError(path, error);
      obj[kind] = value;
      setLoading(button, true, "Sending…");
      // Account contacts must not belong to another registered company.
      if (scope === "company.account") {
        const check = await svc.CompanyAccountService.checkAvailability({ [kind]: value, ownId: sub().transporterId });
        if (check.ok && check[`${kind}Taken`]) {
          setLoading(button, false, "Send OTP");
          return showFieldError(path, kind === "mobile" ? "This mobile number is already registered with a company account. Log in instead." : "This email is already registered with a company account. Log in instead.");
        }
      }
      const res = await svc.CompanyAccountService.sendOtp({ channel: kind, target: value });
      if (!res.ok) {
        setLoading(button, false, "Send OTP");
        return showFieldError(path, ui.serviceError(res.code));
      }
      temp[`co_${scope.replace(/\W/g, "_")}_${kind}`] = "";
      obj[`${kind}Otp`] = { referenceId: res.referenceId, sentAt: Date.now(), expiresIn: res.expiresIn, resendIn: res.resendIn };
      save();
      ui.render();
      document.querySelector(`[data-otp-temp="co_${scope.replace(/\W/g, "_")}_${kind}"] .otp`)?.focus();
    }
    async function verifyContactOtp(button) {
      const { scope, kind } = button.dataset;
      const obj = store.getByPath(S(), scope);
      const key = `co_${scope.replace(/\W/g, "_")}_${kind}`;
      const errorId = `pd-${scope.replace(/\W/g, "-")}-${kind}-otp-error`;
      if (!/^\d{6}$/.test(temp[key] || "")) return setMessage(errorId, "Enter the 6-digit OTP.");
      setLoading(button, true, "Verifying…");
      const res = await svc.CompanyAccountService.verifyOtp({ referenceId: obj[`${kind}Otp`].referenceId, otp: temp[key] });
      temp[key] = "";
      if (!res.ok) {
        setLoading(button, false, "Verify");
        document.querySelectorAll(`[data-otp-temp="${key}"] .otp`).forEach((el) => { el.value = ""; });
        return setMessage(errorId, ui.serviceError(res.code));
      }
      obj[`${kind}Verified`] = true;
      obj[`${kind}Otp`] = otpSession();
      audit(kind === "mobile" ? "Mobile number verified" : "Email address verified", kind === "mobile" ? ui.maskMobile(obj.mobile) : obj.email, { subject: obj.id || "" });
      // The registrant's verified contacts carry over to the primary representative.
      const p = primaryRep();
      if (scope === "company.account" && p && p[kind] === obj[kind]) p[`${kind}Verified`] = true;
      save();
      ui.render();
    }
    async function resendContactOtp(button) {
      const { scope, kind } = button.dataset;
      const obj = store.getByPath(S(), scope);
      const res = await svc.CompanyAccountService.resendOtp({ referenceId: obj[`${kind}Otp`].referenceId });
      const errorId = `pd-${scope.replace(/\W/g, "-")}-${kind}-otp-error`;
      if (!res.ok) return setMessage(errorId, ui.serviceError(res.code));
      Object.assign(obj[`${kind}Otp`], { referenceId: res.referenceId || obj[`${kind}Otp`].referenceId, sentAt: Date.now(), expiresIn: res.expiresIn, resendIn: res.resendIn });
      save();
      ui.render();
      setMessage(errorId, "A new OTP has been sent.", "ok");
    }

    // ---------------------------------------------------------------- steps 1-4: mobile, email, password, consent
    // Same screens as Driver Registration; only the wording and the account service differ.
    const MOBILE_TEXT = {
      title: "Verify your mobile number",
      note: "We'll send a one-time password to verify your business mobile number.",
      label: "Mobile Number",
      placeholder: "Enter 10-digit mobile number",
      send: "Send OTP",
      sending: "Sending OTP…",
      secure: "Your mobile number is used only for your company account and verification."
    };
    const lockedAccount = () => submitted();
    const readonlyAttr = () => (lockedAccount() ? ' readonly aria-readonly="true"' : "");
    function resendLine(kind) {
      const session = C().account[`${kind}Otp`];
      if (!session.referenceId) return "";
      const at = session.sentAt + session.resendIn * 1000;
      const left = Math.max(0, Math.ceil((at - Date.now()) / 1000));
      return `<div class="resend-row"><span>Didn't receive the OTP?</span><button class="link-btn" type="button" data-co-action="acct-resend" data-kind="${kind}" data-resend-at="${at}" ${left ? "disabled" : ""}>${left ? `Resend OTP in ${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}` : "Resend OTP"}</button></div>`;
    }
    function stepMobile() {
      const a = C().account;
      const notice = a.mobileVerified ? '<p class="notice success co-verified-note">Mobile number verified. Continue, or enter a different number to verify it.</p>' : "";
      const form = ui.regMobileForm({ form: "co-mobile", codePath: "company.account.code", numberPath: "company.account.mobile", code: a.code || "+91", number: a.mobile, text: { ...MOBILE_TEXT, send: a.mobileVerified || lockedAccount() ? "Continue" : MOBILE_TEXT.send }, extra: notice });
      return `${lockNotice("account")}${form.replace('<input id="mobile-number"', `<input id="mobile-number"${readonlyAttr()}`)}`;
    }
    function otpStep(kind) {
      const a = C().account;
      const target = kind === "mobile" ? `${a.code || "+91"} ${a.mobile}` : a.email;
      const next = kind === "mobile" ? pathOf("email") : pathOf("password");
      const button = a[`${kind}Verified`]
        ? `<a class="btn full" href="${root(next)}">Continue</a>`
        : `<button class="btn full" type="button" data-co-action="acct-verify" data-kind="${kind}"><span class="ws-cta-label">Verify & Continue</span></button>`;
      return `${ui.regTitle(kind === "mobile" ? "phoneVerify" : "mail", kind === "mobile" ? "Enter Mobile OTP" : "Enter Email OTP", `Use demo OTP ${cfg.SANDBOX.OTP} to verify ${target}.`)}
        ${ui.regOtpCard({ tempKey: kind === "mobile" ? "coMobileOtp" : "coEmailOtp", verified: a[`${kind}Verified`], verifiedText: kind === "mobile" ? "Mobile OTP verified." : "Email OTP verified.", button, extra: `<p class="field-error" id="co-otp-error" aria-live="polite"></p>${a[`${kind}Verified`] ? "" : resendLine(kind)}` })}`;
    }
    function stepEmail() {
      const a = C().account;
      const verified = a.emailVerified;
      return `${lockNotice("account")}${ui.regTitle("mail", "Verify Email Address", "We will send an OTP to verify your official business email address.")}
        ${ui.regEmailCard({
          input: ui.field("Official Email Address", "company.account.email", "email", `id="co-email" autocomplete="email" autocapitalize="none" spellcheck="false" placeholder="name@company.com"${readonlyAttr()}`),
          extra: `${verified ? '<p class="notice success">Email address verified. Continue, or enter a different email to verify it.</p>' : ""}<p class="field-error" id="co-email-error" aria-live="polite"></p>`,
          button: `<button class="btn full" type="button" data-co-action="acct-send-email"><span class="ws-cta-label">${verified || lockedAccount() ? "Continue" : "Send OTP"}</span></button>`
        })}`;
    }
    function stepPassword() {
      const a = C().account;
      if (lockedAccount()) return `${lockNotice("account")}${ui.regTitle("lock", "Set Your Password", "Your password is set.")}<div class="card panel"><p class="notice success">Password set.</p><a class="btn full" href="${root(pathOf("consent"))}">Continue</a></div>`;
      return `${ui.regTitle("lock", "Set Your Password", "Use at least 8 characters with a letter and a number.")}
        ${ui.regPasswordCard({ set: a.passwordSet, keys: ["coPassword", "coConfirm"], extra: '<p class="field-error" id="co-password-error" aria-live="polite"></p>', button: '<button class="btn full" type="button" data-co-action="acct-password">Continue</button>' })}`;
    }
    function stepConsent() {
      const card = ui.regConsentCard({
        items: [["coTerms", "I agree to Terms & Conditions"], ["coPrivacy", "I agree to Privacy Policy"], ["coIdentity", "I consent to identity verification of the company's representatives for this registration."], ["coCommunication", "I agree to receive relevant communication via SMS, Email or WhatsApp."]],
        errorId: "co-consent-error",
        button: lockedAccount() ? `<a class="btn full" href="${root(pathOf("details"))}">Continue</a>` : '<button class="btn full" type="button" data-co-action="acct-consent">Continue</button>'
      });
      return `${lockNotice("account")}${ui.regTitle("shield", "Terms & Consent", "Review the required terms before moving ahead.")}
        ${lockedAccount() ? card.replace(/<input type="checkbox"/g, '<input type="checkbox" disabled') : card}`;
    }
    function contactError(kind, message) {
      if (kind === "mobile") {
        const input = document.getElementById("mobile-number");
        input?.closest(".ws-phone").classList.toggle("invalid", Boolean(message));
        input?.setAttribute("aria-invalid", message ? "true" : "false");
        return setMessage("mobile-number-error", message);
      }
      return setMessage("co-email-error", message);
    }
    // The contact value that passed OTP verification (older saved data: the current value).
    function verifiedValue(kind) {
      const a = C().account;
      return a[`${kind}VerifiedValue`] || (a[`${kind}Verified`] ? a[kind] : "");
    }
    async function accountSend(kind, button) {
      const a = C().account;
      const next = kind === "mobile" ? pathOf("email") : pathOf("password");
      if (lockedAccount()) return go(next);
      const value = kind === "mobile" ? String(document.getElementById("mobile-number").value || "").replace(/\D/g, "") : String(document.getElementById("co-email").value || "").trim().toLowerCase();
      const error = kind === "mobile"
        ? (!value ? "Enter your mobile number." : ui.isValidMobile(value) ? "" : "Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9.")
        : (!value ? "Enter your official email address." : isEmail(value) ? "" : "Enter a valid email address.");
      contactError(kind, error);
      if (error) return;
      // Already verified and unchanged: nothing to send.
      if (a[`${kind}Verified`] && verifiedValue(kind) === value) return go(next);
      setLoading(button, true, kind === "mobile" ? MOBILE_TEXT.sending : "Sending OTP…");
      const check = await svc.CompanyAccountService.checkAvailability({ [kind]: value, ownId: sub().transporterId });
      if (check.ok && check[`${kind}Taken`]) {
        setLoading(button, false, kind === "mobile" ? MOBILE_TEXT.send : "Send OTP");
        return contactError(kind, kind === "mobile" ? "This mobile number is already registered with a company account. Log in instead." : "This email is already registered with a company account. Log in instead.");
      }
      const res = await svc.CompanyAccountService.sendOtp({ channel: kind, target: value });
      if (!res.ok) {
        setLoading(button, false, kind === "mobile" ? MOBILE_TEXT.send : "Send OTP");
        return contactError(kind, ui.serviceError(res.code));
      }
      a[kind] = value;
      a[`${kind}Verified`] = false;
      a[`${kind}Otp`] = { referenceId: res.referenceId, sentAt: Date.now(), expiresIn: res.expiresIn, resendIn: res.resendIn };
      temp[kind === "mobile" ? "coMobileOtp" : "coEmailOtp"] = "";
      save();
      go(pathOf(`${kind}-otp`));
    }
    async function accountVerify(kind, button) {
      const a = C().account;
      const key = kind === "mobile" ? "coMobileOtp" : "coEmailOtp";
      if (!/^\d{6}$/.test(temp[key] || "")) return setMessage("co-otp-error", "Enter the 6-digit OTP.");
      setLoading(button, true, "Verifying…");
      const res = await svc.CompanyAccountService.verifyOtp({ referenceId: a[`${kind}Otp`].referenceId, otp: temp[key] });
      temp[key] = "";
      if (!res.ok) {
        setLoading(button, false, "Verify & Continue");
        document.querySelectorAll(`[data-otp-temp="${key}"] .otp`).forEach((el) => { el.value = ""; });
        return setMessage("co-otp-error", ui.serviceError(res.code));
      }
      a[`${kind}Verified`] = true;
      a[`${kind}VerifiedValue`] = a[kind];
      a[`${kind}Otp`] = otpSession();
      // The registrant's verified contacts carry over to the primary representative.
      const p = primaryRep();
      if (p && p[kind] === a[kind]) p[`${kind}Verified`] = true;
      audit(kind === "mobile" ? "Mobile number verified" : "Email address verified", kind === "mobile" ? ui.maskMobile(a.mobile) : a.email);
      save();
      go(kind === "mobile" ? pathOf("email") : pathOf("password"));
    }
    async function accountResend(kind) {
      const a = C().account;
      const res = await svc.CompanyAccountService.resendOtp({ referenceId: a[`${kind}Otp`].referenceId });
      if (!res.ok) return setMessage("co-otp-error", ui.serviceError(res.code));
      Object.assign(a[`${kind}Otp`], { referenceId: res.referenceId || a[`${kind}Otp`].referenceId, sentAt: Date.now(), expiresIn: res.expiresIn, resendIn: res.resendIn });
      save();
      ui.render();
      setMessage("co-otp-error", "A new OTP has been sent.", "ok");
    }
    function accountPassword() {
      const a = C().account;
      const p = temp.coPassword || "";
      const c = temp.coConfirm || "";
      // Leaving both fields empty keeps a password that was already set.
      if (a.passwordSet && !p && !c) return go(pathOf("consent"));
      const error = p.length < 8 || !/\d/.test(p) || !/[A-Za-z]/.test(p) ? "Use at least 8 characters with a letter and a number." : p !== c ? "Passwords do not match." : "";
      setMessage("co-password-error", error);
      if (error) return document.getElementById(p !== c && p.length >= 8 ? "pw-coConfirm" : "pw-coPassword")?.focus();
      // In production the password goes to the account service; it is never stored in the browser.
      a.passwordSet = true;
      temp.coPassword = "";
      temp.coConfirm = "";
      audit("Account password set", "");
      save();
      go(pathOf("consent"));
    }
    function accountConsent() {
      if (!consentReady()) return setMessage("co-consent-error", "Terms & Conditions, Privacy Policy and identity verification consent are required.");
      audit("Consent recorded", ["terms", "privacy", "identity", "communication"].filter((key) => C().consent[key]).join(", "));
      save();
      go(pathOf("details"));
    }

    // ---------------------------------------------------------------- step 2: company details
    function stepDetails() {
      const d = C().details;
      const can = editable("details");
      const recField = (html) => (REC ? html : "");
      return `${stepTitle("details", "Tell us about your business. Fields marked * are required.")}
        <div class="pd">
          ${lockNotice("details")}
          ${lockWrap("details", `<section class="pd-section">
            <div class="pd-grid cols-2">
              ${pdField("Legal Company Name", "company.details.legalName", { required: true, autocomplete: "organization" })}
              ${pdField("Trade / Brand Name", "company.details.tradeName")}
            </div>
            <div class="pd-grid cols-3">
              ${pdSelect("Company Type", "company.details.type", ["", ...cfg.COMPANY_TYPES], true)}
              ${d.type === "Other" ? pdField("Specify Company Type", "company.details.typeOther", { required: true }) : ""}
              ${recField(pdSelect("Nature of Business", "company.details.nature", NATURES, true))}
              ${pdSelect("Industry", "company.details.industry", INDUSTRIES, true)}
              ${recField(pdField("Year of Establishment", "company.details.year", { inputmode: "numeric", maxlength: 4, recommended: true }))}
              ${pdField("Number of Vehicles / Fleet", "company.details.fleet", { inputmode: "numeric", maxlength: 6, required: REC && ["Transporter", "Both"].includes(d.nature) })}
              ${pdField("Number of Locations / Plants", "company.details.locations", { inputmode: "numeric", maxlength: 6 })}
            </div>
            ${d.type === "Proprietorship" ? '<p class="pd-hint co-note">For a proprietorship, enter the business name as it appears on your GST or Udyam registration.</p>' : ""}
          </section>
          <section class="pd-section">
            ${pdHead("pin", "Registered Address", "Address on your registration documents")}
            ${pdField("Registered Address", "company.details.regAddress", { required: true, type: "textarea", autocomplete: "street-address" })}
            ${recField(`<div class="pd-grid cols-3">
              ${pdCombo("State", "company.details.state", "states", { placeholder: "Search state" })}
              ${pdCombo("District / City", "company.details.city", "districts:company.details.state", { placeholder: d.state ? "Search district" : "Select state first" })}
              ${pdField("Pincode", "company.details.pincode", { inputmode: "numeric", maxlength: 6, autocomplete: "postal-code" })}
            </div>`)}
          </section>
          <section class="pd-section">
            ${pdHead("factory", "Operating / Factory Address", "Where your business operates")}
            <label class="pd-check"><input type="checkbox" data-field="company.details.opSame" ${d.opSame ? "checked" : ""}><span>Same as registered address</span></label>
            ${d.opSame ? "" : `${pdField("Operating / Factory Address", "company.details.opAddress", { type: "textarea" })}
            ${recField(`<div class="pd-grid cols-3">
              ${pdCombo("State", "company.details.opState", "states", { placeholder: "Search state" })}
              ${pdCombo("District / City", "company.details.opCity", "districts:company.details.opState", { placeholder: d.opState ? "Search district" : "Select state first" })}
              ${pdField("Pincode", "company.details.opPincode", { inputmode: "numeric", maxlength: 6 })}
            </div>`)}`}
          </section>
          <section class="pd-section">
            ${pdHead("phone", "Business Contact", "How Wheeltrack and drivers can reach you")}
            <div class="pd-grid cols-3">
              <div class="pd-field"><label for="pd-company-details-contact">Contact Number <span class="req">*</span></label><div class="ws-phone pd-phone"><span class="pd-code">+91</span><input id="pd-company-details-contact" type="tel" inputmode="numeric" maxlength="10" placeholder="Enter contact number" data-field="company.details.contact" value="${esc(d.contact)}"></div></div>
              ${pdField("Official Business Email", "company.details.email", { required: true, type: "email", autocomplete: "email" })}
              ${pdField("Website", "company.details.website", { autocomplete: "url" })}
            </div>
          </section>`)}
          ${actionsBar("details", { editable: can })}
        </div>`;
    }

    // ---------------------------------------------------------------- step 3: representatives
    function repStatus(r) {
      if (r.status === "deactivated") return badge("Deactivated", "red");
      if (r.status === "active") return badge("Active", "green");
      if (!r.saved) return badge("Incomplete", "yellow");
      return badge("Pending Verification", "yellow");
    }
    function identityBadge(r) {
      const id = r.identity;
      if (id.status === "verified") return badge("Aadhaar Verified", "green");
      if (id.manualStatus === "approved") return badge("Verified by Wheeltrack review", "green");
      if (id.manualStatus === "submitted") return badge("Pending Manual Review", "yellow");
      return badge("Identity Pending", "yellow");
    }
    function initials(name) {
      return String(name || "?").split(/\s+/).map((p) => p[0] || "").join("").slice(0, 2).toUpperCase() || "?";
    }
    function repList(ctx, canEdit) {
      return `<ul class="co-list">${reps().map((r) => `<li class="${C().repEditing === r.id ? "is-editing" : ""}">
          <span class="co-avatar" data-no-translate>${esc(initials(r.name))}</span>
          <span class="co-list-main"><strong data-no-translate>${esc(r.name || "New representative")}</strong><small><span data-no-translate>${esc(r.designation || "—")}</span> · <span>${esc(r.role || "Role not set")}</span>${r.primary ? " · <span>Primary</span>" : ""}</small></span>
          <span class="co-badges">${repStatus(r)}${r.saved ? identityBadge(r) : ""}</span>
          <span class="co-list-actions">${canEdit && C().repEditing !== r.id ? `<button class="btn ghost" type="button" data-co-action="edit-rep" data-id="${r.id}">Edit</button>` : ""}${canEdit && !r.primary && ctx === "registration" ? `<button class="link-btn" type="button" data-co-action="remove-rep" data-id="${r.id}">Remove</button>` : ""}</span>
        </li>`).join("")}</ul>`;
    }
    function repEditor(i, ctx) {
      const r = reps()[i];
      const base = `company.reps.${i}`;
      const roleField = r.primary
        ? `<div class="pd-field"><label>Role <span class="req">*</span></label><input type="text" value="Company Admin" readonly aria-readonly="true"><small class="co-hint">${approved() ? "Company Admin for this company." : "Becomes active after identity verification and Wheeltrack approval."}</small></div>`
        : pdSelect("Role", `${base}.role`, ["", ...ROLES.filter((role) => role !== "Company Admin" || ctx === "dashboard")], true);
      return `<div class="co-editor" id="co-rep-editor">
          <header class="co-editor-head"><strong>${r.saved ? "Edit Representative" : "Add Representative"}</strong>${r.primary ? badge("Primary representative", "green") : ""}</header>
          <div class="pd-grid cols-3">
            ${pdField("Representative Full Name", `${base}.name`, { required: true, autocomplete: "name" })}
            ${pdField("Designation", `${base}.designation`, { required: true })}
            ${pdSelect("Employee Type", `${base}.employeeType`, EMPLOYEE_TYPES, true)}
            ${pdField("Employee Code", `${base}.employeeCode`)}
            ${pdField("Department", `${base}.department`)}
            ${pdField("Joining Date", `${base}.joiningDate`, { type: "date" })}
          </div>
          <div class="pd-grid cols-2">
            ${contactBlock("mobile", base, r)}
            ${contactBlock("email", base, r)}
          </div>
          <div class="pd-grid cols-2">
            <div class="pd-field co-field"><span class="co-label" id="${base.replace(/\W/g, "-")}-sig">Authorized Signatory <span class="req">*</span></span><span id="pd-${`${base}.signatory`.replace(/\W/g, "-")}" tabindex="-1">${pills("Authorized Signatory", `${base}.signatory`, [["yes", "Yes"], ["no", "No"]], r.signatory)}</span></div>
            ${roleField}
          </div>
          <section class="co-subsection">
            <h3>Employee Documents</h3>
            <p class="co-hint">${REC ? "A joining, offer or appointment letter is needed for employees. An authorization letter is needed if this person is not an authorized signatory." : "Upload any applicable documents."}</p>
            <ul class="co-docs">${EMPLOYEE_DOCS.map(([key, label]) => docRow(`${base}.docs.${key}`, label, { need: "optional" })).join("")}</ul>
          </section>
          <div class="co-editor-actions">
            ${r.saved || !r.primary ? `<button class="pd-back kyc-alt" type="button" data-co-action="cancel-rep" data-id="${r.id}">Cancel</button>` : ""}
            <button class="ws-cta kyc-btn" type="button" data-co-action="save-rep" data-id="${r.id}" data-ctx="${ctx}">${icons.check}<span>Save Representative</span></button>
          </div>
        </div>`;
    }
    function stepRepresentative() {
      if (!reps().length && editable("representative")) {
        const rep = newRep(true);
        C().reps.push(rep);
        C().repEditing = rep.id;
        save();
      }
      const can = editable("representative");
      const editing = repIndex(C().repEditing);
      return `${stepTitle("representative", "Add the people who act for your company. The first representative becomes the Company Admin after approval.")}
        <div class="pd">
          ${lockNotice("representative")}
          ${lockWrap("representative", `<section class="pd-section">
            ${repList("registration", can)}
            ${editing >= 0 ? repEditor(editing, "registration") : can ? `<button class="pd-upload-btn co-add" type="button" data-co-action="add-rep">${icons.driver}<span>Add Another Representative</span></button>` : ""}
          </section>
          <section class="pd-section">
            ${pdHead("shield", "Roles & Access", "What each role can manage after approval")}
            <dl class="co-roles">${ROLES.map((role) => `<div><dt>${role}</dt><dd>${ROLE_PERMISSIONS[role].map((key) => MODULES.find(([m]) => m === key)[1]).join(" · ")}</dd></div>`).join("")}</dl>
            <p class="ws-secure co-left">${icons.lockSmall}<span>Company Admins can change roles and permissions later. Every sensitive action is checked again by Wheeltrack's servers.</span></p>
          </section>`)}
          ${actionsBar("representative", { editable: can })}
        </div>`;
    }

    // ---------------------------------------------------------------- step 4: identity
    function identityRep() {
      const id = params.get("rep") || C().identityRep;
      return reps().find((r) => r.id === id) || primaryRep();
    }
    function aadhaarCard(r, i, can) {
      const a = r.identity;
      const base = `company.reps.${i}.identity`;
      const masked = a.last4 ? svc.AadhaarVerificationService.maskAadhaar(a.last4) : "";
      if (a.status === "verified") {
        const p = a.profile || {};
        const nameMatch = p.name && r.name ? normalizeName(p.name) === normalizeName(r.name) : null;
        return `<div class="kyc-card verified">
            <span class="kyc-icon">${icons.shield}</span>
            <div class="kyc-text"><strong class="kyc-ok">Aadhaar Verified ✓</strong><span data-no-translate>${esc(masked)}</span><small>Only the details below were received from the verification provider.</small>${sourceTag(a.source)}</div>
            ${can ? `<button class="link-btn" type="button" data-co-action="id-reset" data-rep="${i}">Use a different Aadhaar</button>` : ""}
          </div>
          <dl class="api-grid">
            <div><dt>Full Name</dt><dd data-no-translate>${esc(p.name || "—")}</dd></div>
            <div><dt>Date of Birth</dt><dd data-no-translate>${esc(formatDate(p.dob))}</dd></div>
            <div><dt>Gender</dt><dd>${esc(p.gender || "—")}</dd></div>
            <div><dt>Verified On</dt><dd data-no-translate>${esc(dateTime(a.verifiedAt))}</dd></div>
            <div class="wide"><dt>Residential Address</dt><dd data-no-translate>${esc(p.address || "—")}</dd></div>
          </dl>
          ${nameMatch === false ? '<p class="notice warning">The name on Aadhaar differs from the representative name entered. Wheeltrack will review this.</p>' : ""}`;
      }
      if (a.status === "failed") {
        return `<div class="kyc-card failed">
            <span class="kyc-icon">${icons.idCard}</span>
            <div class="kyc-text"><strong>Aadhaar Verification Failed</strong><small>We couldn't verify this Aadhaar right now. Try again, or continue with manual verification.</small>${masked ? `<span data-no-translate>${esc(masked)}</span>` : ""}${sourceTag(a.source)}</div>
            <div class="kyc-actions">
              <button class="ws-cta kyc-btn" type="button" data-co-action="id-change" data-rep="${i}"><span>Try Again</span></button>
              <button class="pd-back kyc-alt" type="button" data-co-action="id-manual" data-rep="${i}">${icons.edit}<span>Continue with Manual Verification</span></button>
            </div>
          </div>`;
      }
      if (a.status === "otp_sent") {
        const left = Math.max(0, Math.ceil((a.sentAt + a.resendIn * 1000 - Date.now()) / 1000));
        return `<div class="kyc-card">
            <span class="kyc-icon">${icons.idCard}</span>
            <div class="kyc-text"><strong>Verify Aadhaar OTP</strong><span><span>OTP sent to the mobile number linked with Aadhaar</span> <strong data-no-translate>${esc(masked)}</strong></span><button class="link-btn" type="button" data-co-action="id-change" data-rep="${i}">Change Aadhaar number</button></div>
            <div class="kyc-form">
              <span class="kyc-label">Enter OTP <span class="req">*</span></span>
              <div class="kyc-row">${ui.otpTemp("coAadhaarOtp")}<button class="ws-cta kyc-btn" type="button" data-co-action="id-verify" data-rep="${i}"><span class="spinner" aria-hidden="true"></span><span class="ws-cta-label">Verify Identity</span>${icons.arrowRight}</button></div>
              <p class="field-error" id="co-aadhaar-error" aria-live="polite"></p>
              <div class="resend-row"><span>Didn't receive the OTP?</span><button class="link-btn" type="button" data-co-action="id-resend" data-rep="${i}" data-resend-at="${a.sentAt + a.resendIn * 1000}" ${left ? "disabled" : ""}>${left ? `Resend OTP in ${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}` : "Resend OTP"}</button></div>
            </div>
          </div>`;
      }
      const digits = temp.coAadhaar || "";
      return `<div class="kyc-card">
          <span class="kyc-icon">${icons.idCard}</span>
          <div class="kyc-text"><strong>Aadhaar Verification</strong><small>Verify with an OTP sent to the Aadhaar-linked mobile number.</small></div>
          <div class="kyc-form">
            <label class="kyc-label" for="co-aadhaar-number">Aadhaar Number <span class="req">*</span></label>
            <div class="kyc-row">
              <input id="co-aadhaar-number" class="kyc-input" type="text" inputmode="numeric" autocomplete="off" maxlength="14" placeholder="XXXX XXXX XXXX" value="${esc(digits.replace(/(\d{4})(?=\d)/g, "$1 "))}" data-no-translate>
              <button class="ws-cta kyc-btn" type="button" data-co-action="id-send" data-rep="${i}"><span class="spinner" aria-hidden="true"></span><span class="ws-cta-label">Send OTP</span>${icons.arrowRight}</button>
            </div>
            <div class="kyc-consent">
              <label class="pd-check"><input type="checkbox" data-field="${base}.consent" ${a.consent ? "checked" : ""}><span>I explicitly consent to authenticate my identity using Aadhaar OTP for this company registration.</span></label>
              <button class="link-btn" type="button" data-policy="coIdentity">Read identity consent</button>
            </div>
            <p class="field-error" id="co-aadhaar-error" aria-live="polite"></p>
            <p class="ws-secure">${icons.lockSmall}<span>The full Aadhaar number is never stored. Only the last 4 digits are kept.</span></p>
          </div>
        </div>`;
    }
    function manualBlock(r, i, can) {
      const a = r.identity;
      const base = `company.reps.${i}.identity`;
      const submittedManual = ["submitted", "approved"].includes(a.manualStatus);
      return `<div class="kyc-card unavailable">
          <span class="kyc-icon">${icons.edit}</span>
          <div class="kyc-text"><strong>${a.manualStatus === "approved" ? "Verified by Wheeltrack review" : submittedManual ? "Pending Manual Review" : "Manual Verification"}</strong><small>${submittedManual ? "Wheeltrack will review these details. Manual verification is never marked verified automatically." : "Enter the details exactly as on the identity document and upload a copy."}</small></div>
          ${can && !submittedManual ? `<button class="link-btn" type="button" data-co-action="id-aadhaar" data-rep="${i}">Verify with Aadhaar instead</button>` : ""}
        </div>
        ${lockWrap(can && !submittedManual, `<div class="pd-grid cols-3">
          ${pdField("Full Name", `${base}.manual.name`, { required: true })}
          ${pdField("Date of Birth", `${base}.manual.dob`, { required: true, type: "date" })}
          ${pdSelect("Gender", `${base}.manual.gender`, ["", "Male", "Female", "Other"])}
        </div>
        ${pdField("Residential Address", `${base}.manual.address`, { required: true, type: "textarea" })}
        <div class="pd-grid cols-2">
          ${pdSelect("Identity Document Type", `${base}.manual.docType`, ID_DOC_TYPES, true)}
          ${pdField("Identity Document Reference", `${base}.manual.docRef`)}
        </div>
        <ul class="co-docs">${docRow(`${base}.doc`, "Identity Supporting Document", { need: "required", editable: can && !submittedManual })}</ul>`)}
        ${can && !submittedManual ? `<div class="verify-row"><span class="ws-secure">${icons.lockSmall}<span>Manually entered details stay pending until Wheeltrack reviews them.</span></span><button class="ws-cta dl-verify" type="button" data-co-action="id-manual-submit" data-rep="${i}"><span>Submit for Manual Review</span>${icons.arrowRight}</button></div>` : ""}`;
    }
    function stepIdentity() {
      const r = identityRep();
      if (!r) return `${stepTitle("identity", "")}<div class="pd"><p class="notice warning">Add the business representative first.</p>${actionsBar("identity", { next: "" })}</div>`;
      const i = repIndex(r.id);
      // After approval, identities of newly added representatives can still be completed here.
      const can = editable("identity") || (approved() && !identityDone(r));
      const method = r.identity.status === "verified" ? "aadhaar" : r.identity.method;
      const tabs = reps().length > 1 ? `<div class="co-tabs" role="tablist" aria-label="Representative">${reps().map((rep) => `<a role="tab" class="${rep.id === r.id ? "active" : ""}" aria-selected="${rep.id === r.id}" href="${root(`${pathOf("identity")}?rep=${rep.id}`)}"><span data-no-translate>${esc(rep.name || "Representative")}</span>${rep.primary ? " <small>Required</small>" : ""}</a>`).join("")}</div>` : "";
      const who = `<span data-no-translate>${esc(r.name || "")}</span>${r.designation ? ` · <span data-no-translate>${esc(r.designation)}</span>` : ""}${r.primary ? " · <span>Primary representative</span>" : ""}`;
      return `${stepTitle("identity", `<span>Verify the identity of each representative. The primary representative must be verified before you continue.</span><br><strong class="co-who">${who}</strong>`)}
        <div class="pd">
          ${editable("identity") || approved() ? "" : lockNotice("identity")}
          <section class="pd-section">
            ${tabs}
            ${method === "manual" ? manualBlock(r, i, can) : `${aadhaarCard(r, i, can)}${can && r.identity.status !== "verified" && r.identity.status !== "failed" ? `<p class="co-fallback"><span>Unable to verify using Aadhaar?</span> <button class="link-btn" type="button" data-co-action="id-manual" data-rep="${i}">Continue with manual verification.</button></p>` : ""}`}
          </section>
          ${approved() ? `<div class="pd-actions"><a class="pd-back" href="${root("transporter/dashboard.php?tab=representatives")}">${icons.back}<span>Back to Representatives</span></a></div>` : actionsBar("identity", { editable: editable("identity") })}
        </div>`;
    }
    function normalizeName(name) {
      return String(name || "").toUpperCase().replace(/\bPVT\b/g, "PRIVATE").replace(/\bLTD\b/g, "LIMITED").replace(/[^A-Z0-9]/g, "");
    }

    // ---------------------------------------------------------------- step 5: business KYC
    function cinLabel(key) {
      if (key !== "cin") return KYC_TITLES[key];
      return C().details.type === "LLP" ? "LLPIN" : "CIN";
    }
    const KYC_DOC = { pan: "pan", gstin: "gst", cin: "incorporation" };
    const EXPECTED_PAN_HOLDER = { "Private Limited": "Company", "Public Limited": "Company", LLP: "Firm / LLP", Partnership: "Firm / LLP", Proprietorship: "Individual" };
    function kycCard(key, can) {
      const rule = kycRule(key);
      const k = C().kyc[key];
      const label = cinLabel(key);
      const legal = C().details.legalName;
      const docInfo = cfg.COMPANY_DOCUMENTS.find((doc) => doc.key === KYC_DOC[key]);
      const placeholders = { pan: "e.g. AAACW1234F", gstin: "e.g. 27AAACW1234F1Z5", cin: C().details.type === "LLP" ? "e.g. AAB-1234" : "e.g. U60231MH2019PTC123456" };
      if (rule === "na") return `<section class="co-kyc is-na"><header class="co-kyc-head"><strong>${label} Verification</strong>${vBadge("na")}</header><p class="co-hint"><span>Not required for</span> <span>${esc(C().details.type)}</span></p></section>`;
      const res = k.result || {};
      let result = "";
      if (k.status === "verified") {
        const rows = key === "pan"
          ? [["PAN", res.pan], ["Name on PAN", res.name], ["PAN Holder Type", res.holderType], ["PAN Status", res.panStatus]]
          : key === "gstin"
            ? [["GSTIN", res.gstin], ["Legal Business Name", res.legalName], ["GST Status", res.gstStatus], ["State", res.state], ["Registered Address", res.registeredAddress, true]]
            : [[label, res.number], ["Registered Company Name", res.companyName], ["Incorporation Status", res.incorporationStatus], ["Incorporated On", formatDate(res.incorporatedOn)], ["Registrar", res.registrar]];
        const returnedName = res.name || res.legalName || res.companyName;
        const nameOk = returnedName ? normalizeName(returnedName) === normalizeName(legal) : null;
        const expectedHolder = EXPECTED_PAN_HOLDER[C().details.type];
        result = `<dl class="api-grid">${rows.map(([dt, dd, wide]) => `<div class="${wide ? "wide" : ""}"><dt>${dt}</dt><dd data-no-translate>${esc(dd || "—")}</dd></div>`).join("")}</dl>
          <div class="co-checks">
            ${nameOk === null ? "" : nameOk ? badge("Name matches company details", "green") : badge("Name does not match company details", "red")}
            ${key === "pan" && expectedHolder && res.holderType && res.holderType !== expectedHolder ? badge(`PAN type is ${res.holderType}, expected ${expectedHolder}`, "yellow") : ""}
            ${key === "gstin" && res.panMatch ? (res.panMatch === "matched" ? badge("GSTIN matches company PAN", "green") : badge("GSTIN does not match company PAN", "red")) : ""}
          </div>
          ${sourceTag(k.source)}`;
      } else if (k.status === "failed") {
        result = `<div class="co-kyc-problem">
            <p>${k.failedReason === "PROVIDER_UNAVAILABLE" || k.failedReason === "NOT_CONFIGURED" ? "The verification service is unavailable right now. Try again later or submit this for manual review." : "We couldn't verify this number. Check it and try again, or submit it for manual review."}</p>
            ${can ? `<div class="kyc-actions"><button class="pd-back kyc-alt" type="button" data-co-action="kyc-manual" data-key="${key}">${icons.edit}<span>Submit for Manual Review</span></button></div>` : ""}
            ${can ? `<ul class="co-docs">${docRow(`company.docs.${KYC_DOC[key]}`, docInfo ? docInfo.label : `${label} Document`, { need: "required", editable: can })}</ul>` : ""}
          </div>${sourceTag(k.source)}`;
      } else if (k.status === "under_review") {
        result = '<p class="notice">Submitted for manual review. Wheeltrack will verify this number with the uploaded document. It is not marked verified until then.</p>';
      }
      return `<section class="co-kyc is-${k.status}">
          <header class="co-kyc-head"><strong>${label} Verification</strong>${rule === "required" ? badge("Required", "red") : badge("Optional")}${vBadge(k.status)}</header>
          <div class="pd-field co-field">
            <label for="co-kyc-${key}">${label} Number${rule === "required" ? ' <span class="req">*</span>' : ""}</label>
            <div class="co-inline"><input id="co-kyc-${key}" class="kyc-input" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="21" placeholder="${placeholders[key]}" data-field="company.kyc.${key}.number" value="${esc(k.number)}" ${can && k.status !== "under_review" ? "" : 'readonly aria-readonly="true"'} data-no-translate>
            ${can && k.status !== "verified" && k.status !== "under_review" ? `<button class="ws-cta kyc-btn" type="button" data-co-action="kyc-verify" data-key="${key}"><span class="spinner" aria-hidden="true"></span><span class="ws-cta-label">${k.status === "failed" ? "Try Again" : "Verify"}</span>${icons.shield}</button>` : ""}
            ${can && ["verified", "under_review"].includes(k.status) ? `<button class="link-btn" type="button" data-co-action="kyc-reset" data-key="${key}">Change</button>` : ""}</div>
          </div>
          ${result}
          ${historyList(k.history)}
        </section>`;
    }
    function stepKyc() {
      const can = editable("kyc");
      if (!C().details.type) return `${stepTitle("kyc", "")}<div class="pd"><p class="notice warning">Select the company type in Company Details first. <a href="${root(pathOf("details"))}">Go to Company Details</a></p>${actionsBar("kyc", { next: "" })}</div>`;
      const otherDocs = companyDocs().filter((doc) => !["pan", "gst"].includes(doc.key));
      return `${stepTitle("kyc", "Verify your business registration numbers. Only checks that apply to your company type are required.")}
        <div class="pd">
          ${lockNotice("kyc")}
          <section class="pd-section">
            ${["pan", "gstin", "cin"].map((key) => kycCard(key, can)).join("")}
          </section>
          <section class="pd-section">
            ${pdHead("upload", "Other Business KYC Documents", "Uploaded in the Documents step")}
            <ul class="review-list">${otherDocs.map((doc) => {
              const meta = C().docs[doc.key];
              return `<li><span>${doc.label}${docRule(doc) === "optional" ? ' <span class="tag-rec">Optional</span>' : ""}</span>${meta ? badge(...DOC_STATUS[meta.status]) : badge("Not Uploaded")}<a class="btn ghost" href="${root(pathOf("documents"))}">${meta ? "View" : "Upload"}</a></li>`;
            }).join("")}</ul>
          </section>
          ${actionsBar("kyc", { editable: can })}
        </div>`;
    }
    async function verifyKyc(button) {
      const key = button.dataset.key;
      const k = C().kyc[key];
      const KYC = svc.BusinessKycService;
      const number = KYC.normalize(k.number);
      const d = C().details;
      const valid = key === "pan" ? KYC.isValidPan(number) : key === "gstin" ? KYC.isValidGstin(number) : d.type === "LLP" ? KYC.isValidLlpin(number) : KYC.isValidCin(number);
      const path = `company.kyc.${key}.number`;
      if (!number) return showFieldError(path, `Enter the ${cinLabel(key)}.`);
      if (!valid) return showFieldError(path, { pan: "Enter a valid 10-character PAN, e.g. AAACW1234F.", gstin: "Enter a valid 15-character GSTIN, e.g. 27AAACW1234F1Z5.", cin: d.type === "LLP" ? "Enter a valid LLPIN, e.g. AAB-1234." : "Enter a valid 21-character CIN." }[key]);
      if (key === "gstin" && !C().kyc.pan.number) return showFieldError(path, "Enter and verify the company PAN first.");
      showFieldError(path, "");
      setLoading(button, true, "Verifying…");
      const address = [d.regAddress, d.city, d.state, d.pincode].filter(Boolean).join(", ");
      const res = key === "pan" ? await KYC.verifyPan({ pan: number, name: d.legalName })
        : key === "gstin" ? await KYC.verifyGstin({ gstin: number, pan: KYC.normalize(C().kyc.pan.number), name: d.legalName, address })
          : await KYC.verifyCin({ number, name: d.legalName });
      const status = res.ok ? res.status : "failed";
      Object.assign(k, { number, status, result: res.ok && res.status === "verified" ? res.result : null, failedReason: res.ok ? res.reason || "" : res.code, source: res.source, checkedAt: now() });
      k.history.push({ at: k.checkedAt, status, reason: res.ok ? res.reason || "" : res.code, source: res.source });
      audit(`${cinLabel(key)} verification`, `${V_STATUS[status][0]}${res.source === "sandbox" ? " (sandbox)" : ""}`, { type: "verification" });
      save();
      ui.render();
    }

    // ---------------------------------------------------------------- step 6: documents
    function stepDocuments() {
      const can = editable("documents");
      if (!C().details.type) return `${stepTitle("documents", "")}<div class="pd"><p class="notice warning">Select the company type in Company Details first. <a href="${root(pathOf("details"))}">Go to Company Details</a></p>${actionsBar("documents", { next: "" })}</div>`;
      const docs = companyDocs();
      const repDocs = reps().flatMap((r, i) => [
        ...EMPLOYEE_DOCS.filter(([key]) => r.docs[key]).map(([key, label]) => [r, `company.reps.${i}.docs.${key}`, label]),
        ...(r.identity.doc ? [[r, `company.reps.${i}.identity.doc`, "Identity Supporting Document"]] : [])
      ]);
      return `${stepTitle("documents", "Upload the documents for your company type. PDF, JPG or PNG files only.")}
        <div class="pd">
          ${lockNotice("documents")}
          <section class="pd-section">
            <ul class="co-docs">${docs.map((doc) => docRow(`company.docs.${doc.key}`, doc.label, { need: docRule(doc), recommended: doc.recommended, expiry: doc.expiry, editable: can })).join("")}</ul>
            <p class="ws-secure co-left">${icons.lockSmall}<span>Files are checked for type and size here and again by Wheeltrack's servers before review. Maximum ${cfg.UPLOAD.MAX_MB} MB per file.</span></p>
          </section>
          <section class="pd-section">
            ${pdHead("driver", "Representative Documents", "Managed in Business Representative and Identity Verification")}
            ${repDocs.length ? `<ul class="review-list">${repDocs.map(([r, path, label]) => {
              const meta = store.getByPath(S(), path);
              return `<li><span><span>${label}</span> · <span data-no-translate>${esc(r.name || "Representative")}</span></span>${badge(...DOC_STATUS[meta.status])}<a class="btn ghost" href="${root(path.includes("identity") ? `${pathOf("identity")}?rep=${r.id}` : pathOf("representative"))}">View</a></li>`;
            }).join("")}</ul>` : '<p class="co-hint">No representative documents uploaded yet.</p>'}
          </section>
          ${actionsBar("documents", { editable: can })}
        </div>`;
    }
    const previews = {};
    function validateFile(file) {
      if (!cfg.UPLOAD.TYPES.includes(file.type)) return "Upload a PDF, JPG or PNG file.";
      if (file.size > cfg.UPLOAD.MAX_MB * 1048576) return `The file is larger than ${cfg.UPLOAD.MAX_MB} MB.`;
      if (!file.size) return "The file is empty.";
      return "";
    }
    function allDocPaths() {
      const paths = Object.keys(C().docs).map((key) => `company.docs.${key}`);
      reps().forEach((r, i) => {
        Object.keys(r.docs).forEach((key) => paths.push(`company.reps.${i}.docs.${key}`));
        if (r.identity.doc) paths.push(`company.reps.${i}.identity.doc`);
      });
      C().vehicles.forEach((v, i) => Object.keys(v.docs).forEach((key) => paths.push(`company.vehicles.${i}.docs.${key}`)));
      return paths;
    }
    function setDocAt(path, value) {
      const parts = path.split(".");
      const parent = store.getByPath(S(), parts.slice(0, -1).join("."));
      if (value === null) delete parent[parts[parts.length - 1]];
      else parent[parts[parts.length - 1]] = value;
    }
    function handleFile(input) {
      const file = input.files && input.files[0];
      const path = input.dataset.coFile;
      if (!file) return;
      const error = validateFile(file);
      if (error) return showFieldError(path, error);
      const signature = `${file.name}|${file.size}|${file.lastModified}`;
      const duplicate = allDocPaths().find((p) => p !== path && (store.getByPath(S(), p) || {}).sig === signature);
      if (duplicate) return showFieldError(path, "This file is already uploaded for another document. Upload the correct document.");
      const old = store.getByPath(S(), path);
      const meta = {
        name: file.name, mime: file.type, size: file.size, sig: signature, uploadedAt: now(), version: old ? old.version + 1 : 1,
        status: "pending", comment: "", reviewer: "", expiry: old ? old.expiry || "" : "",
        history: old ? [...(old.history || []), { version: old.version, name: old.name, uploadedAt: old.uploadedAt, status: old.status === "rejected" ? "rejected" : "replaced", comment: old.comment }] : []
      };
      setDocAt(path, meta);
      if (previews[path]) URL.revokeObjectURL(previews[path]);
      previews[path] = URL.createObjectURL(file);
      audit(old ? "Document replaced" : "Document uploaded", `${file.name} (v${meta.version})`, { type: "document" });
      save();
      ui.render();
      fieldFor(path)?.focus();
    }
    function previewDialog(path) {
      const meta = store.getByPath(S(), path);
      const url = previews[path];
      const body = !url
        ? '<p class="notice">A preview is available only in the session the file was uploaded in, until secure server storage is connected.</p>'
        : meta.mime === "application/pdf" ? `<iframe class="co-preview" src="${url}" title="Document preview"></iframe>` : `<img class="co-preview" src="${url}" alt="Document preview">`;
      return `<div class="wt-modal" role="dialog" aria-modal="true" aria-labelledby="co-preview-title" data-modal="preview">
          <div class="wt-modal-card wt-policy">
            <header class="wt-modal-head"><div><h2 id="co-preview-title" data-no-translate>${esc(meta.name)}</h2><p><span data-no-translate>${fileSize(meta.size)}</span> · <span>Version</span> <span data-no-translate>${meta.version}</span></p></div><button class="wt-modal-close" type="button" data-modal-close aria-label="Close">×</button></header>
            <div class="wt-modal-body" tabindex="0">${body}</div>
            <footer class="wt-modal-foot"><button class="pd-back" type="button" data-modal-close>Close</button></footer>
          </div>
        </div>`;
    }

    // ---------------------------------------------------------------- step 7: review & consent
    // Review card: status icon, title + summary, one Edit action, compact field grid.
    function reviewCard({ icon, heading, summary, href, ok, editable, body }) {
      return `<section class="co-rv ${ok ? "is-ok" : "is-todo"}">
          <header class="co-rv-head">
            <span class="co-rv-icon" aria-hidden="true">${ok ? icons.check : icons[icon]}</span>
            <div><h3>${heading}</h3><p>${summary}</p></div>
            ${ok ? "" : badge("Needs attention", "yellow")}
            ${editable ? `<a class="co-rv-edit" href="${root(href)}" aria-label="Edit ${heading}">${icons.edit}<span>Edit</span></a>` : ""}
          </header>
          ${body}
        </section>`;
    }
    function reviewFields(rows) {
      return `<dl class="co-rv-grid">${rows.map(([dt, dd, raw, wide]) => `<div class="${wide ? "wide" : ""}"><dt>${dt}</dt><dd${raw ? " data-no-translate" : ""}>${dd}</dd></div>`).join("")}</dl>`;
    }
    function stepReview() {
      const a = C().account;
      const d = C().details;
      const k = C().kyc;
      const c = C().consent;
      const dash = (v) => esc(filled(v) ? v : "—");
      const reopen = ["info_required", "rejected"].includes(sub().status);
      const locked = submitted() && !reopen;
      const editable = !locked;
      const docs = companyDocs();
      const uploaded = docs.filter((doc) => C().docs[doc.key]).length;
      const missing = docs.filter((doc) => docRule(doc) === "required" && !C().docs[doc.key]);
      const repDocs = reps().reduce((n, r) => n + Object.keys(r.docs).length + (r.identity.doc ? 1 : 0), 0);
      const chip = (ok, label, optional) => `<li class="${ok ? "ok" : optional ? "" : "no"}">${ok ? icons.check : "–"}<span>${label}</span>${optional ? ' <small>Optional</small>' : ""}</li>`;
      const cards = [
        { icon: "phoneVerify", heading: "Account Information", summary: "Mobile, email and password", href: pathOf("mobile"), ok: accountReady(),
          body: reviewFields([["Mobile Number", dash(a.mobile && ui.maskMobile(a.mobile)), true], ["Official Email", dash(a.email), true], ["Password", a.passwordSet ? "Set" : "Not set"]]) },
        { icon: "shield", heading: "Consent", summary: "Terms, privacy and communication preferences", href: pathOf("consent"), ok: consentReady(),
          body: `<ul class="co-rv-chips">${chip(c.terms, "Terms & Conditions")}${chip(c.privacy, "Privacy Policy")}${chip(c.identity, "Identity Verification Consent")}${chip(c.communication, "Communication Consent", true)}</ul>` },
        { icon: "factory", heading: "Company Information", summary: "Legal, contact and address details", href: pathOf("details"), ok: detailsReady(),
          body: reviewFields([["Legal Company Name", dash(d.legalName), true], ["Trade / Brand Name", dash(d.tradeName), true], ["Company Type", dash(d.type === "Other" ? `Other – ${d.typeOther}` : d.type)], ["Industry", dash(d.industry)], ["Contact Number", dash(d.contact && `+91 ${d.contact}`), true], ["Business Email", dash(d.email), true], ["Registered Address", dash([d.regAddress, d.city, d.state, d.pincode].filter(Boolean).join(", ")), true, true]]) },
        { icon: "driver", heading: "Representatives & Identity", summary: "People who act for the company", href: pathOf("representative"), ok: repsReady() && identityReady(),
          body: `<ul class="co-list co-rv-people">${reps().map((r) => `<li>
              <span class="co-avatar" data-no-translate>${esc(initials(r.name))}</span>
              <span class="co-list-main"><strong data-no-translate>${dash(r.name)}</strong><small><span data-no-translate>${dash(r.designation)}</span> · <span>${esc(r.role || "Role not set")}</span></small></span>
              <span class="co-badges">${identityBadge(r)}</span>
              ${editable && !identityDone(r) ? `<a class="link-btn" href="${root(`${pathOf("identity")}?rep=${r.id}`)}">Verify identity</a>` : "<span></span>"}
            </li>`).join("")}</ul>` },
        { icon: "idCard", heading: "Business KYC", summary: "PAN, GSTIN & CIN", href: pathOf("kyc"), ok: kycReady(),
          body: reviewFields(["pan", "gstin", "cin"].filter((key) => kycRule(key) !== "na").map((key) => [cinLabel(key), `<span data-no-translate>${dash(k[key].number)}</span> ${vBadge(k[key].status)}`])) },
        { icon: "upload", heading: "Documents", summary: "Company and representative documents", href: pathOf("documents"), ok: docsReady(),
          body: `<div class="co-rv-docs">
              <div class="co-rv-docs-row"><span><strong data-no-translate>${uploaded} / ${docs.length}</strong> <span>company documents uploaded</span></span><span><strong data-no-translate>${repDocs}</strong> <span>representative documents</span></span></div>
              <div class="co-rv-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${docs.length}" aria-valuenow="${uploaded}"><span style="width:${docs.length ? Math.round((uploaded / docs.length) * 100) : 0}%"></span></div>
              ${missing.length ? `<ul class="co-rv-chips co-rv-missing">${missing.map((doc) => chip(false, doc.label)).join("")}</ul>` : ""}
            </div>` }
      ];
      const pending = cards.filter((x) => !x.ok);
      const banner = locked
        ? `<div class="co-rv-banner ok"><span class="co-rv-banner-icon">${icons.check}</span><div><strong>Your registration has been submitted.</strong><span><a href="${root(pathOf("status"))}">View approval status</a></span></div></div>`
        : pending.length
          ? `<div class="co-rv-banner warn"><span class="co-rv-banner-icon">${icons.shield}</span><div><strong>Complete these sections before you submit</strong><span>${pending.map((x) => `<a href="${root(x.href)}">${x.heading}</a>`).join(" · ")}</span></div><span class="co-rv-count" data-no-translate>${cards.length - pending.length}/${cards.length}</span></div>`
          : `<div class="co-rv-banner ok"><span class="co-rv-banner-icon">${icons.check}</span><div><strong>All sections are complete</strong><span>Confirm the declaration below and submit your registration.</span></div><span class="co-rv-count" data-no-translate>${cards.length}/${cards.length}</span></div>`;
      const declaration = ui.consentItem("coDeclaration", "I declare that the business information and documents provided are true and complete, and that I am authorized to register this company.");
      const submitLabel = reopen ? "Resubmit Registration" : "Submit Registration";
      return `${stepTitle("review", locked ? "Your registration has been submitted." : "Check each section, then confirm the declaration and submit.")}
        <div class="pd co-rv-page">
          ${reopen ? `<p class="notice warning"><span>Wheeltrack asked for changes.</span> <a href="${root(pathOf("status"))}">See what to update</a></p>` : ""}
          ${banner}
          <div class="co-rv-cards">${cards.map((x) => reviewCard({ ...x, editable })).join("")}</div>
          <div class="co-rv-declare consent-list">${locked ? declaration.replace(/<input type="checkbox"/g, '<input type="checkbox" disabled') : declaration}</div>
          ${locked
            ? actionsBar("review", { editable: false })
            : actionsBar("review", { next: `<button class="ws-cta pd-next" type="button" data-co-action="submit-registration"><span class="spinner" aria-hidden="true"></span><span class="ws-cta-label">${submitLabel}</span>${icons.arrowRight}</button>` })}
        </div>`;
    }
    function consentBadge(key, optional) {
      return C().consent[key] ? badge("Accepted", "green") : badge(optional ? "Not given" : "Not accepted", optional ? "" : "red");
    }
    function snapshot() {
      const c = JSON.parse(JSON.stringify(C()));
      return {
        account: { mobile: c.account.mobile, email: c.account.email.toLowerCase() },
        details: c.details,
        kyc: { pan: c.kyc.pan.number, gstin: c.kyc.gstin.number, cin: c.kyc.cin.number, statuses: { pan: c.kyc.pan.status, gstin: c.kyc.gstin.status, cin: c.kyc.cin.status } },
        reps: c.reps.map(({ mobileOtp, emailOtp, ...r }) => ({ ...r, identity: { method: r.identity.method, status: r.identity.status, last4: r.identity.last4, manualStatus: r.identity.manualStatus, verifiedAt: r.identity.verifiedAt } })),
        docs: c.docs,
        consent: c.consent,
        submittedAt: now()
      };
    }
    function forEachDoc(fn) {
      allDocPaths().filter((p) => !p.startsWith("company.vehicles")).forEach((p) => {
        const meta = store.getByPath(S(), p);
        if (meta) fn(meta, p);
      });
    }
    async function submitRegistration(button) {
      const errors = validateReview();
      attempted.review = true;
      if (Object.keys(errors).length) return showErrors(errors, true);
      if (button.disabled) return;
      setLoading(button, true, "Submitting…");
      const res = await svc.CompanyRegistrationService.submit({ transporterId: sub().transporterId, snapshot: snapshot() });
      if (!res.ok) {
        setLoading(button, false, sub().transporterId ? "Resubmit Registration" : "Submit Registration");
        const dup = { pan: "A company with this PAN is already registered.", gstin: "A company with this GSTIN is already registered.", accountMobile: "This mobile number is already registered with another company.", accountEmail: "This email is already registered with another company." }[res.field];
        return setMessage("co-step-error", res.code === "DUPLICATE" ? `${dup} Log in to that account or contact Wheeltrack support.` : ui.serviceError(res.code));
      }
      const resubmission = Boolean(sub().transporterId);
      Object.assign(C().submission, { status: res.status, transporterId: res.transporterId, requestId: res.requestId, submittedAt: res.submittedAt, version: res.version, snapshot: snapshot(), registration: null, lastCheckedAt: "" });
      forEachDoc((meta) => { if (meta.status === "pending") meta.status = "under_review"; });
      audit(resubmission ? "Registration resubmitted" : "Registration submitted", `${res.transporterId} · ${res.requestId}`);
      save();
      go(pathOf("status"));
    }

    // ---------------------------------------------------------------- step 8: approval status
    let statusRequested = false;
    async function refreshStatus(button) {
      if (!sub().transporterId) return;
      if (button) setLoading(button, true, "Checking…");
      const res = await svc.CompanyRegistrationService.getStatus({ transporterId: sub().transporterId });
      if (!res.ok) {
        if (button) setLoading(button, false, "Refresh Status");
        return setMessage("co-step-error", ui.serviceError(res.code));
      }
      applyRegistration(res.registration);
      ui.render();
    }
    // Mirrors the server decision into the local registration (documents, KYC and identity review outcomes).
    function applyRegistration(reg) {
      const s = sub();
      s.registration = reg;
      s.lastCheckedAt = now();
      if (s.appliedAt !== reg.updatedAt) {
        s.appliedAt = reg.updatedAt;
        if (reg.status === "approved") {
          forEachDoc((meta) => { if (meta.status !== "rejected") Object.assign(meta, { status: "verified", reviewer: "Wheeltrack" }); });
          ["pan", "gstin", "cin"].forEach((key) => {
            const k = C().kyc[key];
            if (k.status === "under_review") {
              k.status = "verified";
              k.history.push({ at: now(), status: "verified", reason: "MANUAL", source: "review" });
            }
          });
          reps().forEach((r) => {
            if (r.identity.manualStatus === "submitted") r.identity.manualStatus = "approved";
            if (identityDone(r)) r.status = "active";
          });
          if (!C().actingAs) C().actingAs = (primaryRep() || {}).id || "";
          audit("Registration approved", reg.remarks || "", { actor: "Wheeltrack Admin" });
        }
        if (["info_required", "rejected"].includes(reg.status)) {
          (reg.rejectedDocuments || []).forEach((path) => {
            const meta = store.getByPath(S(), path);
            if (meta) Object.assign(meta, { status: "rejected", comment: reg.remarks, reviewer: "Wheeltrack" });
          });
          audit(reg.status === "rejected" ? "Registration rejected" : "More information requested", reg.remarks, { actor: "Wheeltrack Admin" });
        }
      }
      s.status = reg.status;
      save();
    }
    const REVIEW_STAGES = [["company", "Company Details Review"], ["kyc", "Business KYC Review"], ["representative", "Representative Verification"], ["documents", "Document Review"], ["final", "Final Admin Approval"]];
    function statusLabel(status) {
      return { pending_review: "Pending Review", approved: "Approved", rejected: "Rejected", info_required: "More Information Required", draft: "Draft" }[status] || "Pending Review";
    }
    function stepStatus() {
      const s = sub();
      if (!statusRequested) {
        statusRequested = true;
        setTimeout(() => refreshStatus(null), 0);
      }
      const reg = s.registration || {};
      const status = reg.status || s.status;
      const stageIndex = status === "approved" ? REVIEW_STAGES.length : Math.max(0, REVIEW_STAGES.findIndex(([key]) => key === reg.stage));
      const decided = ["approved", "rejected", "info_required"].includes(status);
      const timeline = [
        ["Registration Submitted", "done"],
        ...REVIEW_STAGES.map(([, label], i) => [label, i < stageIndex ? "done" : i === stageIndex && !decided ? "active" : decided && status !== "approved" && i === stageIndex ? "stopped" : "wait"]),
        [status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : status === "info_required" ? "More Information Required" : "Decision", status === "approved" ? "done" : decided ? "stopped" : "wait"]
      ];
      const tone = status === "approved" ? "ok" : decided ? "bad" : "";
      const pendingSections = (reg.pendingRequirements || []).map((key) => SECTIONS.find(([k]) => k === key)).filter(Boolean);
      const rejectedDocs = (reg.rejectedDocuments || []).map((path) => store.getByPath(S(), path)).filter(Boolean);
      return `${stepTitle("status", "Track the Wheeltrack review of your company registration.")}
        <div class="pd">
          <div class="approved-card ${tone}">
            <span class="approved-icon">${status === "approved" ? icons.check : icons.shield}</span>
            <div><strong>${statusLabel(status)}</strong><span><span data-no-translate>${esc(C().details.legalName)}</span> · <span data-no-translate>${esc(s.transporterId)}</span></span>${decided && isSandbox("companyRegistration") ? TEST_DECISION : ""}</div>
          </div>
          ${decided && status !== "approved" ? `<section class="co-decision">
            <h3>${status === "rejected" ? "Reason for rejection" : "What Wheeltrack needs from you"}</h3>
            <p data-no-translate>${esc(reg.remarks || "")}</p>
            ${pendingSections.length ? `<ul class="review-list">${pendingSections.map(([key, label]) => `<li><span>${label}</span>${badge("Update required", "yellow")}<a class="btn ghost" href="${root(pathOf(key === "representative" ? "representative" : key))}">Edit</a></li>`).join("")}</ul>` : ""}
            ${rejectedDocs.length ? `<p class="co-hint"><span>Rejected documents:</span> <span data-no-translate>${rejectedDocs.map((m) => esc(m.name)).join(", ")}</span></p>` : ""}
            <a class="ws-cta kyc-btn" href="${root(pathOf("review"))}"><span>Review & Resubmit</span>${icons.arrowRight}</a>
          </section>` : ""}
          <section class="pd-section">
            ${pdHead("shield", "Status Timeline", "Updated as Wheeltrack reviews your registration")}
            <ol class="id-flow">${timeline.map(([label, st], i) => `<li class="id-stage ${st === "done" ? "is-done" : "is-pending"}"><span class="id-dot">${st === "done" ? icons.check : i + 1}</span><span class="id-label">${label}</span>${badge(st === "done" ? "Completed" : st === "active" ? "In Review" : st === "stopped" ? "Action Needed" : "Pending", st === "done" ? "green" : st === "stopped" ? "red" : st === "active" ? "yellow" : "")}</li>`).join("")}</ol>
          </section>
          <section class="pd-section">
            ${pdHead("idCard", "Registration Record", "Keep these IDs for support requests")}
            <dl class="api-grid">
              <div><dt>Transporter ID</dt><dd data-no-translate>${esc(s.transporterId)}</dd></div>
              <div><dt>Request ID</dt><dd data-no-translate>${esc(s.requestId)}</dd></div>
              <div><dt>Company Name</dt><dd data-no-translate>${esc(C().details.legalName)}</dd></div>
              <div><dt>Submission Date</dt><dd data-no-translate>${esc(formatDate(s.submittedAt))}</dd></div>
              <div><dt>Current Status</dt><dd>${badge(statusLabel(status), status === "approved" ? "green" : decided ? "red" : "yellow")}</dd></div>
              <div><dt>Last Updated</dt><dd data-no-translate>${esc(dateTime(reg.updatedAt || s.submittedAt))}</dd></div>
              <div class="wide"><dt>Pending Requirements</dt><dd>${pendingSections.length ? pendingSections.map(([, label]) => label).join(", ") : status === "approved" ? "None" : "Waiting for Wheeltrack review"}</dd></div>
              ${reg.remarks ? `<div class="wide"><dt>Reviewer Remarks</dt><dd data-no-translate>${esc(reg.remarks)}</dd></div>` : ""}
            </dl>
            ${sourceTag(isSandbox("companyRegistration") ? "sandbox" : "")}
          </section>
          ${status === "pending_review" && isSandbox("companyRegistration") ? adminPanel() : ""}
          <p class="field-error" id="co-step-error" aria-live="polite"></p>
          <div class="pd-actions"><a class="pd-back" href="${root(pathOf("review"))}">${icons.back}<span>Back</span></a>${status === "approved"
            ? `<a class="ws-cta pd-next" href="${root("transporter/dashboard.php")}"><span>Go to Company Dashboard</span>${icons.arrowRight}</a>`
            : `<button class="ws-cta pd-next" type="button" data-co-action="refresh-status"><span class="spinner" aria-hidden="true"></span><span class="ws-cta-label">Refresh Status</span>${icons.arrowRight}</button>`}</div>
        </div>`;
    }
    // Sandbox-only stand-in for the Wheeltrack admin console, so approval, rejection and information requests can be tested.
    function adminPanel() {
      const docs = [];
      forEachDoc((meta, path) => docs.push([path, meta.name]));
      return `<section class="co-sandbox" aria-labelledby="co-admin-title">
          <header><strong id="co-admin-title">Sandbox admin review</strong><span class="sandbox-tag">Test only · not part of the applicant's view in production</span></header>
          <p class="co-hint">In production, Wheeltrack reviewers decide in the admin console with server-side checks. Nothing is approved automatically.</p>
          <button class="pd-upload-btn" type="button" data-co-action="admin-advance">${icons.arrowRight}<span>Move to next review stage</span></button>
          <div class="pd-field"><label for="co-admin-remarks">Reviewer Remarks</label><textarea id="co-admin-remarks" rows="2" placeholder="Required for rejection or information requests"></textarea></div>
          <fieldset class="co-checks-group"><legend>Sections the applicant may change</legend>${SECTIONS.map(([key, label]) => `<label class="pd-check"><input type="checkbox" name="co-admin-section" value="${key}"><span>${label}</span></label>`).join("")}</fieldset>
          ${docs.length ? `<fieldset class="co-checks-group"><legend>Documents to reject</legend>${docs.map(([path, name]) => `<label class="pd-check"><input type="checkbox" name="co-admin-doc" value="${esc(path)}"><span data-no-translate>${esc(name)}</span></label>`).join("")}</fieldset>` : ""}
          <p class="field-error" id="co-admin-error" aria-live="polite"></p>
          <div class="co-admin-actions">
            <button class="ws-cta kyc-btn" type="button" data-co-action="admin-decide" data-decision="approved">${icons.check}<span>Approve</span></button>
            <button class="pd-back kyc-alt" type="button" data-co-action="admin-decide" data-decision="info_required"><span>Request More Information</span></button>
            <button class="pd-back kyc-alt co-danger" type="button" data-co-action="admin-decide" data-decision="rejected"><span>Reject</span></button>
          </div>
        </section>`;
    }
    async function adminDecide(button) {
      const decision = button.dataset.decision;
      const remarks = (document.getElementById("co-admin-remarks") || {}).value || "";
      let sections = [...document.querySelectorAll("[name=co-admin-section]:checked")].map((el) => el.value);
      const docs = [...document.querySelectorAll("[name=co-admin-doc]:checked")].map((el) => el.value);
      if (decision !== "approved" && !remarks.trim()) return setMessage("co-admin-error", "Enter reviewer remarks.");
      if (decision === "info_required" && !sections.length && !docs.length) return setMessage("co-admin-error", "Select at least one section or document to update.");
      if (docs.length && !sections.includes("documents")) sections = [...sections, "documents"];
      if (decision === "rejected" && !sections.length) sections = SECTIONS.map(([key]) => key);
      button.disabled = true;
      const res = await svc.CompanyRegistrationService.adminDecision({ transporterId: sub().transporterId, decision, remarks, pendingRequirements: sections, rejectedDocuments: docs });
      if (!res.ok) {
        button.disabled = false;
        return setMessage("co-admin-error", ui.serviceError(res.code));
      }
      applyRegistration(res.registration);
      ui.render();
    }
    async function adminAdvance() {
      const res = await svc.CompanyRegistrationService.adminAdvance({ transporterId: sub().transporterId });
      if (res.ok) applyRegistration(res.registration);
      ui.render();
    }

    // ---------------------------------------------------------------- dashboard
    const assoc = { loaded: false, loading: false, list: [], error: "" };
    async function loadAssociations(force) {
      if (assoc.loading || (assoc.loaded && !force)) return;
      assoc.loading = true;
      const res = await svc.TransporterService.listAssociations({ transporterId: sub().transporterId });
      assoc.loading = false;
      assoc.loaded = true;
      assoc.list = res.ok ? res.requests : [];
      assoc.error = res.ok ? "" : ui.serviceError(res.code);
      ui.render();
    }
    function actingRep() {
      return reps().find((r) => r.id === C().actingAs && r.status === "active") || primaryRep();
    }
    function permissionsOf(r) {
      if (!r || r.status === "deactivated") return [];
      return r.permissions || ROLE_PERMISSIONS[r.role] || ["overview"];
    }
    const can = (module) => permissionsOf(actingRep()).includes(module);
    const isAdmin = () => (actingRep() || {}).role === "Company Admin";
    function vehicleCompliance(v) {
      const st = (key) => (key === "fitness" && v.fitness.na ? "verified" : v[key].status);
      return { rc: st("rc"), insurance: st("insurance"), puc: st("puc"), fitness: st("fitness") };
    }
    function expiries() {
      const out = [];
      cfg.COMPANY_DOCUMENTS.filter((doc) => doc.expiry).forEach((doc) => {
        const meta = C().docs[doc.key];
        if (meta && meta.expiry) out.push([doc.label, meta.expiry, "Company"]);
      });
      C().vehicles.forEach((v) => {
        [["Insurance", v.insurance.upto], ["PUC", v.puc.upto], ["Fitness", v.fitness.na ? "" : v.fitness.upto], ["Permit", v.fitness.na ? "" : v.fitness.permitUpto]].forEach(([label, date]) => {
          if (date) out.push([label, date, v.registration || "Vehicle"]);
        });
      });
      const soon = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
      return out.map(([label, date, owner]) => ({ label, date, owner, state: date < today() ? "expired" : date <= soon ? "expiring" : "valid" }));
    }
    function dashCard(id, heading, head, body) {
      return `<section class="db-card co-card" id="${id}"><header class="db-card-head"><h2>${heading}</h2>${head || ""}</header>${body}</section>`;
    }
    function table(headers, rows, empty) {
      if (!rows.length) return `<p class="co-empty">${empty}</p>`;
      return `<div class="co-table-wrap"><table class="co-table"><thead><tr>${headers.map((h) => `<th scope="col">${h}</th>`).join("")}</tr></thead><tbody>${rows.map((cells) => `<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    }
    function tabOverview() {
      const list = assoc.list;
      const approvedDrivers = list.filter((r) => r.status === "approved");
      const pending = list.filter((r) => r.status === "pending");
      const vehicles = C().vehicles;
      const alerts = expiries().filter((x) => x.state !== "valid");
      const kycOk = ["pan", "gstin", "cin"].filter((key) => kycRule(key) !== "na").every((key) => C().kyc[key].status === "verified" || (kycRule(key) === "optional" && !filled(C().kyc[key].number)));
      const kpis = [
        ["KYC Status", kycOk ? "Verified" : "In Review", "shield", kycOk ? "green" : ""],
        ["Representatives", String(reps().filter((r) => r.status !== "deactivated").length), "driver", ""],
        ["Vehicles", `${vehicles.filter((v) => v.status === "approved").length} / ${vehicles.length}`, "truck", ""],
        ["Drivers", String(approvedDrivers.length), "handshake", ""],
        ["Pending Driver Requests", String(pending.length), "handshake", pending.length ? "yellow" : ""],
        ["Active Loads", "0", "box", ""],
        ["Trips", "0", "pin", ""],
        ["Expiry Alerts", String(alerts.length), "idCard", alerts.length ? "red" : ""]
      ];
      return `<div class="db-kpis co-kpis">${kpis.map(([label, value, icon, tone]) => `<div class="db-kpi"><span class="db-kpi-icon ${tone}">${icons[icon] || icons.grid}</span><span><small>${label}</small><strong data-no-translate>${esc(value)}</strong></span></div>`).join("")}</div>
        <p class="co-hint co-left">Loads and trips will appear here once those modules are available.</p>
        <div class="db-grid">
          ${dashCard("ov-company", "Company Profile", badge("Approved", "green"), `<dl class="db-specs">${[["Company", C().details.legalName, true], ["Transporter ID", sub().transporterId, true], ["Company Type", C().details.type], ["Industry", C().details.industry]].map(([dt, dd, raw]) => `<div><dt>${dt}</dt><dd${raw ? " data-no-translate" : ""}>${esc(dd || "—")}</dd></div>`).join("")}</dl>`)}
          ${dashCard("ov-alerts", "Documents and Expiry Alerts", alerts.length ? badge(`${alerts.length}`, "red") : badge("All valid", "green"), alerts.length ? `<ul class="db-docs">${alerts.map((x) => `<li><span class="db-doc-icon">${icons.idCard}</span><span class="db-doc-name"><strong>${x.label}</strong><small data-no-translate>${esc(x.owner)} · ${esc(formatDate(x.date))}</small></span>${badge(x.state === "expired" ? "Expired" : "Expiring Soon", x.state === "expired" ? "red" : "yellow")}</li>`).join("")}</ul>` : '<p class="co-empty">No documents are expired or expiring in the next 30 days.</p>')}
          ${dashCard("ov-requests", "Pending Driver Requests", "", pending.length ? `<ul class="db-docs">${pending.map((r) => `<li><span class="db-doc-icon">${icons.driver}</span><span class="db-doc-name"><strong data-no-translate>${esc((r.driver && r.driver.name) || r.driverId)}</strong><small data-no-translate>${esc(formatDate(r.createdAt))}</small></span>${can("drivers") ? `<a class="btn ghost" href="${root("transporter/dashboard.php?tab=drivers")}">Review</a>` : ""}</li>`).join("")}</ul>` : '<p class="co-empty">No pending requests.</p>')}
          ${dashCard("ov-vehicles", "Vehicles", "", vehicles.length ? `<ul class="db-docs">${vehicles.slice(0, 5).map((v) => `<li><span class="db-doc-icon">${icons.truck}</span><span class="db-doc-name"><strong data-no-translate>${esc(v.registration || "New vehicle")}</strong><small>${esc(v.type || "—")}</small></span>${vehicleBadge(v)}</li>`).join("")}</ul>` : '<p class="co-empty">No vehicles registered yet.</p>')}
        </div>`;
    }
    function tabProfile() {
      const d = C().details;
      const editing = temp.coProfileEdit && isAdmin();
      const spec = (rows) => `<dl class="db-specs">${rows.map(([dt, dd, raw]) => `<div><dt>${dt}</dt><dd${raw ? " data-no-translate" : ""}>${esc(filled(dd) ? dd : "—")}</dd></div>`).join("")}</dl>`;
      const kycRows = ["pan", "gstin", "cin"].filter((key) => kycRule(key) !== "na").map((key) => `<li><span class="db-doc-icon">${icons.idCard}</span><span class="db-doc-name"><strong>${cinLabel(key)}</strong><small data-no-translate>${esc(C().kyc[key].number || "—")}</small></span>${vBadge(C().kyc[key].status)}</li>`).join("");
      return `<div class="db-grid">
          ${dashCard("profile-company", "Company Profile", isAdmin() && !editing ? '<button class="btn ghost" type="button" data-co-action="profile-edit">Edit contact details</button>' : "", editing ? `<div class="pd-grid cols-2">
              <div class="pd-field"><label for="pd-company-details-contact">Contact Number <span class="req">*</span></label><div class="ws-phone pd-phone"><span class="pd-code">+91</span><input id="pd-company-details-contact" type="tel" inputmode="numeric" maxlength="10" data-field="company.details.contact" value="${esc(d.contact)}"></div></div>
              ${pdField("Website", "company.details.website")}
              ${pdField("Number of Vehicles / Fleet", "company.details.fleet", { inputmode: "numeric", maxlength: 6 })}
              ${pdField("Number of Locations / Plants", "company.details.locations", { inputmode: "numeric", maxlength: 6 })}
            </div>
            <p class="co-hint">Legal name, company type, addresses and KYC details can only be changed through a Wheeltrack review.</p>
            <div class="co-editor-actions"><button class="ws-cta kyc-btn" type="button" data-co-action="profile-save">${icons.check}<span>Save Changes</span></button></div>
            <p class="field-error" id="co-step-error" aria-live="polite"></p>` : spec([["Legal Company Name", d.legalName, true], ["Trade / Brand Name", d.tradeName, true], ["Company Type", d.type], ["Nature of Business", d.nature], ["Industry", d.industry], ["Year of Establishment", d.year, true], ["Contact Number", d.contact, true], ["Business Email", d.email, true], ["Website", d.website, true], ["Fleet Size", d.fleet, true], ["Locations / Plants", d.locations, true], ["Registered Address", [d.regAddress, d.city, d.state, d.pincode].filter(Boolean).join(", "), true]]))}
          ${dashCard("profile-kyc", "KYC Status", "", `<ul class="db-docs">${kycRows}</ul>`)}
        </div>`;
    }
    function tabRepresentatives() {
      const admin = isAdmin();
      const editing = repIndex(C().repEditing);
      const permEdit = reps().find((r) => r.id === temp.coPermEdit);
      const rows = reps().map((r) => [
        `<span class="co-cell-main"><strong data-no-translate>${esc(r.name || "—")}</strong><small data-no-translate>${esc(r.designation || "")}</small></span>`,
        admin && !r.primary && r.status !== "deactivated" ? `<select aria-label="Role" data-co-role="${r.id}">${ROLES.map((role) => `<option ${role === r.role ? "selected" : ""}>${role}</option>`).join("")}</select>` : esc(r.role),
        `${repStatus(r)} ${identityBadge(r)}`,
        admin ? `<span class="co-row-actions">${!r.primary ? `<button class="link-btn" type="button" data-co-action="perm-edit" data-id="${r.id}">Permissions</button>` : ""}${!identityDone(r) ? `<a class="link-btn" href="${root(`${pathOf("identity")}?rep=${r.id}`)}">Verify identity</a>` : ""}${!r.primary ? `<button class="link-btn" type="button" data-co-action="rep-toggle" data-id="${r.id}">${r.status === "deactivated" ? "Reactivate" : "Deactivate"}</button>` : ""}<button class="link-btn" type="button" data-co-action="rep-activity" data-id="${r.id}">Activity</button></span>` : ""
      ]);
      const activity = reps().find((r) => r.id === temp.coActivity);
      return `${dashCard("reps", "Representatives", admin && editing < 0 ? `<button class="pd-upload-btn" type="button" data-co-action="add-rep" data-ctx="dashboard">${icons.driver}<span>Add Representative</span></button>` : "", `
          ${admin ? "" : '<p class="notice">Only the Company Admin can add representatives or change roles and permissions.</p>'}
          ${table(["Representative", "Role", "Status", admin ? "Actions" : ""], rows, "No representatives yet.")}
          ${editing >= 0 && admin ? repEditor(editing, "dashboard") : ""}
          ${permEdit && admin ? `<div class="co-editor"><header class="co-editor-head"><strong><span>Permissions for</span> <span data-no-translate>${esc(permEdit.name)}</span></strong>${badge(permEdit.role)}</header>
            <div class="co-perm-grid">${MODULES.filter(([key]) => key !== "representatives").map(([key, label]) => `<label class="pd-check"><input type="checkbox" name="co-perm" value="${key}" ${permissionsOf(permEdit).includes(key) ? "checked" : ""}><span>${label}</span></label>`).join("")}</div>
            <div class="co-editor-actions"><button class="pd-back kyc-alt" type="button" data-co-action="perm-reset" data-id="${permEdit.id}">Reset to role defaults</button><button class="ws-cta kyc-btn" type="button" data-co-action="perm-save" data-id="${permEdit.id}">${icons.check}<span>Save Permissions</span></button></div></div>` : ""}
          ${activity ? `<div class="co-editor"><header class="co-editor-head"><strong><span>Activity history ·</span> <span data-no-translate>${esc(activity.name)}</span></strong><button class="link-btn" type="button" data-co-action="rep-activity" data-id="">Close</button></header>${auditTable(C().audit.filter((x) => x.actorId === activity.id || x.subjectId === activity.id))}</div>` : ""}
        `)}`;
    }
    function vehicleBadge(v) {
      return { draft: badge("Draft", ""), pending_approval: badge("Pending Approval", "yellow"), approved: badge("Approved", "green"), rejected: badge("Rejected", "red") }[v.status] || badge("Draft");
    }
    function gpsLabel(value) {
      return { yes: "Yes", no: "No", unknown: "Don't Know" }[value] || "Not answered";
    }
    function tabVehicles() {
      const rows = C().vehicles.map((v) => [
        `<span class="co-cell-main"><strong data-no-translate>${esc(v.registration || "New vehicle")}</strong><small>${esc(v.type || "—")}${v.body ? ` · ${esc(v.body)}` : ""}</small></span>`,
        esc(gpsLabel(v.gps)),
        Object.values(vehicleCompliance(v)).every((st) => st === "verified") ? badge("Compliant", "green") : badge("Pending", "yellow"),
        vehicleBadge(v),
        `<a class="link-btn" href="${root(`transporter/vehicle.php?id=${v.id}&step=${v.status === "draft" ? "details" : "status"}`)}">${v.status === "draft" ? "Continue" : "View"}</a>`
      ]);
      return dashCard("vehicles", "Vehicles", `<a class="pd-upload-btn" href="${root("transporter/vehicle.php?id=new")}">${icons.truck}<span>Register Vehicle</span></a>`, table(["Vehicle", "GPS Installed", "Documents", "Status", ""], rows, "No vehicles registered yet. Register each vehicle separately to verify its documents."));
    }
    function driverSummary(r) {
      const d = r.driver || {};
      const lic = { verified: badge("Licence Verified", "green"), manual_submitted: badge("Licence Under Review", "yellow") }[d.licence] || badge("Licence Pending", "yellow");
      const kyc = { verified: badge("KYC Verified", "green"), manual_review: badge("KYC Under Review", "yellow") }[d.kyc] || badge("KYC Pending", "yellow");
      return `<span class="co-cell-main"><strong data-no-translate>${esc(d.name || r.driverId)}</strong><small><span data-no-translate>${esc(r.driverId)}</span>${d.mobile ? ` · <span data-no-translate>${esc(d.mobile)}</span>` : ""}${d.city ? ` · <span data-no-translate>${esc(d.city)}</span>` : ""}</small></span><span class="co-badges">${kyc}${lic}</span>`;
    }
    function tabDrivers() {
      if (!assoc.loaded) loadAssociations();
      const pending = assoc.list.filter((r) => r.status === "pending");
      const active = assoc.list.filter((r) => r.status === "approved");
      const closed = assoc.list.filter((r) => ["rejected", "removed"].includes(r.status));
      return `${assoc.error ? `<p class="notice danger">${esc(assoc.error)}</p>` : ""}
        <p class="notice">Drivers register themselves and send you a request using your Transporter ID <strong data-no-translate>${esc(sub().transporterId)}</strong>. You can't edit a driver's personal or identity details.</p>
        ${dashCard("drivers-pending", "Association Requests", `<button class="link-btn" type="button" data-co-action="assoc-refresh">Refresh</button>`, table(["Driver", "Requested On", ""], pending.map((r) => [driverSummary(r), `<span data-no-translate>${esc(formatDate(r.createdAt))}</span>`, `<span class="co-row-actions"><button class="ws-cta co-small" type="button" data-co-action="assoc-approve" data-id="${r.requestId}">Approve</button><button class="pd-back co-small" type="button" data-co-action="assoc-reason" data-decision="rejected" data-id="${r.requestId}">Reject</button></span>`]), assoc.loading ? "Loading…" : "No pending requests."))}
        ${dashCard("drivers-approved", "Approved Drivers", "", table(["Driver", "Approved On", "Vehicle", ""], active.map((r) => [driverSummary(r), `<span data-no-translate>${esc(formatDate(r.decidedAt))}</span>`, r.vehicle ? `<span data-no-translate>${esc(r.vehicle.registration)}</span>` : badge("Not assigned"), `<button class="link-btn" type="button" data-co-action="assoc-reason" data-decision="removed" data-id="${r.requestId}">Remove</button>`]), "No approved drivers yet."))}
        ${closed.length ? dashCard("drivers-closed", "Declined & Removed", "", table(["Driver", "Status", "Reason"], closed.map((r) => [driverSummary(r), badge(r.status === "rejected" ? "Rejected" : "Removed", "red"), `<span data-no-translate>${esc(r.reason || "")}</span>`]), "")) : ""}`;
    }
    function eligibleVehicles(requestId) {
      const taken = assoc.list.filter((r) => r.status === "approved" && r.requestId !== requestId && r.vehicle).map((r) => r.vehicle.registration);
      return C().vehicles.filter((v) => v.status === "approved" && !taken.includes(v.registration));
    }
    function tabAssignments() {
      if (!assoc.loaded) loadAssociations();
      const active = assoc.list.filter((r) => r.status === "approved");
      const rows = active.map((r) => {
        const options = eligibleVehicles(r.requestId);
        return [
          driverSummary(r),
          r.vehicle ? `<strong data-no-translate>${esc(r.vehicle.registration)}</strong>` : badge("Not assigned"),
          options.length ? `<span class="co-row-actions"><select id="co-assign-${r.requestId}" aria-label="Vehicle">${options.map((v) => `<option value="${v.id}" ${r.vehicle && r.vehicle.registration === v.registration ? "selected" : ""}>${esc(v.registration)}</option>`).join("")}</select><button class="ws-cta co-small" type="button" data-co-action="assign" data-id="${r.requestId}">${r.vehicle ? "Reassign" : "Assign"}</button>${r.vehicle ? `<button class="link-btn" type="button" data-co-action="unassign" data-id="${r.requestId}">Remove</button>` : ""}</span>` : `<span class="co-hint">No approved vehicles available</span>${r.vehicle ? ` <button class="link-btn" type="button" data-co-action="unassign" data-id="${r.requestId}">Remove</button>` : ""}`
        ];
      });
      const history = C().assignments.map((x) => [`<span data-no-translate>${esc(x.registration)}</span>`, `<span data-no-translate>${esc(x.driverName)}</span>`, `<span data-no-translate>${esc(dateTime(x.assignedAt))}</span>`, x.removedAt ? `<span data-no-translate>${esc(dateTime(x.removedAt))}</span>` : badge("Current", "green"), `<span data-no-translate>${esc(x.by)}</span>`]);
      return `<p class="notice">Only approved drivers and approved vehicles can be assigned. Approving a driver never assigns a vehicle automatically.</p>
        <p class="field-error" id="co-step-error" aria-live="polite"></p>
        ${dashCard("assign-current", "Assign Vehicles", "", table(["Driver", "Current Vehicle", "Assign"], rows, assoc.loading ? "Loading…" : "No approved drivers yet."))}
        ${dashCard("assign-history", "Assignment History", "", table(["Vehicle", "Driver", "Assigned", "Removed", "By"], history, "No assignments yet."))}`;
    }
    function tabDocuments() {
      const all = [];
      cfg.COMPANY_DOCUMENTS.filter((doc) => docRule(doc) !== "na").forEach((doc) => all.push({ owner: "Company", label: doc.label, meta: C().docs[doc.key], required: docRule(doc) === "required", path: `company.docs.${doc.key}`, expiry: doc.expiry }));
      C().vehicles.forEach((v) => [["rc", "RC"], ["insurance", "Insurance"], ["puc", "PUC"], ["fitness", "Fitness Certificate"]].forEach(([key, label]) => {
        if (key === "fitness" && v.fitness.na) return;
        all.push({ owner: v.registration || "Vehicle", label, meta: v.docs[key], required: true, verification: v[key].status });
      }));
      const ex = expiries();
      const counts = [
        ["Missing documents", all.filter((x) => x.required && !x.meta).length, "red"],
        ["Pending verification", all.filter((x) => x.meta && ["pending", "under_review"].includes(x.meta.status)).length, "yellow"],
        ["Rejected documents", all.filter((x) => x.meta && x.meta.status === "rejected").length, "red"],
        ["Expiring documents", ex.filter((x) => x.state === "expiring").length, "yellow"],
        ["Expired documents", ex.filter((x) => x.state === "expired").length, "red"]
      ];
      const renewals = [];
      all.forEach((x) => (x.meta && x.meta.history || []).forEach((h) => renewals.push([x.owner, x.label, h.version, h.uploadedAt])));
      return `<div class="db-kpis co-kpis co-kpis-5">${counts.map(([label, n, tone]) => `<div class="db-kpi"><span class="db-kpi-icon ${n ? tone : "green"}">${icons.idCard}</span><span><small>${label}</small><strong data-no-translate>${n}</strong></span></div>`).join("")}</div>
        ${dashCard("docs-all", "All Documents", "", table(["Owner", "Document", "File", "Status"], all.map((x) => [`<span data-no-translate>${esc(x.owner)}</span>`, `${x.label}${x.required ? "" : ' <span class="tag-rec">Optional</span>'}`, x.meta ? `<span data-no-translate>${esc(x.meta.name)}</span> <small data-no-translate>v${x.meta.version}</small>` : "—", x.meta ? badge(...DOC_STATUS[x.meta.status]) : badge(x.required ? "Missing" : "Not Uploaded", x.required ? "red" : "")]), "No documents."))}
        ${dashCard("docs-expiry", "Expiry Tracking", "", table(["Owner", "Document", "Valid Until", "Status"], ex.map((x) => [`<span data-no-translate>${esc(x.owner)}</span>`, x.label, `<span data-no-translate>${esc(formatDate(x.date))}</span>`, badge(x.state === "expired" ? "Expired" : x.state === "expiring" ? "Expiring Soon" : "Valid", x.state === "expired" ? "red" : x.state === "expiring" ? "yellow" : "green")]), "No documents with validity dates yet."))}
        ${dashCard("docs-renewals", "Renewal History", "", table(["Owner", "Document", "Previous Version", "Uploaded"], renewals.map(([owner, label, version, at]) => [`<span data-no-translate>${esc(owner)}</span>`, label, `<span data-no-translate>v${version}</span>`, `<span data-no-translate>${esc(formatDate(at))}</span>`]), "No renewals yet."))}`;
    }
    function auditTable(entries) {
      return table(["Time", "User", "Action", "Details"], entries.map((x) => [`<span data-no-translate>${esc(dateTime(x.at))}</span>`, `<span data-no-translate>${esc(x.actor)}</span>`, esc(x.action), `<span data-no-translate>${esc(x.detail)}</span>`]), "No activity yet.");
    }
    function tabAudit() {
      const type = params.get("type") || "";
      const types = [["", "All"], ["registration", "Registration"], ["profile", "Profile"], ["representative", "Representatives"], ["document", "Documents"], ["verification", "Verification"], ["driver", "Driver Associations"], ["vehicle", "Vehicles"], ["assignment", "Assignments"]];
      const entries = C().audit.filter((x) => !type || x.type === type);
      return dashCard("audit", "Audit Log", `<nav class="co-filter" aria-label="Filter">${types.map(([key, label]) => `<a class="${key === type ? "active" : ""}" href="${root(`transporter/dashboard.php?tab=audit${key ? `&type=${key}` : ""}`)}">${label}</a>`).join("")}</nav>`, `${auditTable(entries)}<p class="co-hint">This log is kept in your browser for the prototype. The server keeps the authoritative, tamper-proof audit trail.</p>`);
    }
    // For text that mixes user data with a translatable label inside one node (e.g. <option>).
    const tr = (text) => (ui.hindiActive() && window.WheeltrackI18n ? window.WheeltrackI18n.translate(text) : text);
    function renderDashboard() {
      const tab = params.get("tab") || "overview";
      const me = actingRep();
      const allowed = MODULES.filter(([key]) => can(key));
      const active = can(tab) ? tab : "overview";
      const body = { overview: tabOverview, profile: tabProfile, representatives: tabRepresentatives, vehicles: tabVehicles, drivers: tabDrivers, assignments: tabAssignments, documents: tabDocuments, audit: tabAudit }[active]();
      if (["overview"].includes(active) && !assoc.loaded) loadAssociations();
      const name = C().details.tradeName || C().details.legalName;
      return `<main class="dashboard db co-dash">
          <aside class="dash-nav db-nav">
            ${ui.brand("sm")}
            <nav class="db-menu">${allowed.map(([key, label, icon]) => `<a class="${key === active ? "active" : ""}" href="${root(`transporter/dashboard.php?tab=${key}`)}" ${key === active ? 'aria-current="page"' : ""}>${icons[icon]}<span>${label}</span></a>`).join("")}</nav>
            <div class="db-user"><span class="db-avatar" data-no-translate>${esc(initials(me && me.name))}</span><span><strong data-no-translate>${esc((me && me.name) || "")}</strong><small>${esc((me && me.role) || "")}</small></span></div>
          </aside>
          <section class="dash-main db-main">
            <header class="db-top">
              <div><p class="db-kicker">Transporter / Shipper dashboard</p><h1 data-no-translate>${esc(name)}</h1>${PROTO_TAG}</div>
              <div class="db-actions">${ui.langSwitch()}${ui.callLink()}</div>
            </header>
            <div class="db-body">
              ${reps().length > 1 && isSandbox("companyRegistration") ? `<div class="co-acting"><label for="co-acting">Signed in as</label><select id="co-acting" data-co-acting data-no-translate>${reps().filter((r) => r.status === "active").map((r) => `<option value="${r.id}" ${me && r.id === me.id ? "selected" : ""}>${esc(r.name)} – ${esc(tr(r.role))}</option>`).join("")}</select><span class="sandbox-tag">Sandbox: preview another representative's access</span></div>` : ""}
              ${MODULES.find(([key]) => key === active) ? `<h2 class="co-tab-title">${MODULES.find(([key]) => key === active)[1]}</h2>` : ""}
              ${tab !== active ? '<p class="notice warning">You don\'t have permission to open that section.</p>' : ""}
              ${body}
            </div>
          </section>${ui.devbar()}</main>`;
    }
    function reasonDialog(requestId, decision) {
      return `<div class="wt-modal" role="dialog" aria-modal="true" aria-labelledby="co-reason-title" data-modal="reason">
          <div class="wt-modal-card">
            <header class="wt-modal-head"><div><h2 id="co-reason-title">${decision === "rejected" ? "Reject driver request" : "Remove driver association"}</h2><p>The driver will see this reason.</p></div><button class="wt-modal-close" type="button" data-modal-close aria-label="Close">×</button></header>
            <div class="wt-modal-body"><div class="pd-field"><label for="co-reason">Reason <span class="req">*</span></label><textarea id="co-reason" rows="3"></textarea></div><p class="field-error" id="co-reason-error" aria-live="polite"></p></div>
            <footer class="wt-modal-foot"><button class="pd-back" type="button" data-modal-close>Cancel</button><button class="ws-cta" type="button" data-co-action="assoc-decide" data-decision="${decision}" data-id="${requestId}"><span>${decision === "rejected" ? "Reject Request" : "Remove Driver"}</span></button></footer>
          </div>
        </div>`;
    }
    async function decideAssociation(requestId, decision, reason, button) {
      if (button) button.disabled = true;
      const res = await svc.TransporterService.decideAssociation({ transporterId: sub().transporterId, requestId, decision, reason });
      if (!res.ok) {
        if (button) button.disabled = false;
        return setMessage(decision === "approved" ? "co-step-error" : "co-reason-error", res.code === "INVALID_INPUT" ? "Enter a reason." : ui.serviceError(res.code));
      }
      const driverName = (res.request.driver && res.request.driver.name) || res.request.driverId;
      if (decision === "removed") closeAssignment(requestId);
      audit({ approved: "Driver association approved", rejected: "Driver association rejected", removed: "Driver association removed" }[decision], `${driverName}${reason ? ` · ${reason}` : ""}`, { type: "driver" });
      save();
      ui.closeModal();
      loadAssociations(true);
    }
    function closeAssignment(requestId) {
      const open = C().assignments.find((x) => x.requestId === requestId && !x.removedAt);
      if (open) open.removedAt = now();
    }
    async function assignVehicle(requestId, vehicleId) {
      const v = vehicleId ? C().vehicles.find((x) => x.id === vehicleId) : null;
      const r = assoc.list.find((x) => x.requestId === requestId);
      const payload = v ? { registration: v.registration, type: v.type, body: v.body, payload: v.payload, gps: v.gps, compliance: vehicleCompliance(v) } : null;
      const res = await svc.TransporterService.assignVehicle({ transporterId: sub().transporterId, requestId, vehicle: payload });
      if (!res.ok) return setMessage("co-step-error", res.code === "VEHICLE_IN_USE" ? "This vehicle is already assigned to another driver." : ui.serviceError(res.code));
      const driverName = (r && r.driver && r.driver.name) || (r && r.driverId) || "";
      closeAssignment(requestId);
      if (v) C().assignments.unshift({ id: uid("ASG"), requestId, driverName, vehicleId: v.id, registration: v.registration, assignedAt: now(), removedAt: "", by: actor().name });
      audit(v ? "Vehicle assigned" : "Vehicle assignment removed", `${v ? v.registration : (r && r.vehicle && r.vehicle.registration) || ""} · ${driverName}`, { type: "assignment" });
      save();
      loadAssociations(true);
    }

    // ---------------------------------------------------------------- vehicle registration workflow
    const V_STEPS = [
      ["details", "Vehicle Details", "Registration & specifications", "truck"],
      ["rc", "RC Verification", "Registration certificate", "idCard"],
      ["insurance", "Insurance", "Policy & document", "shield"],
      ["puc", "PUC", "Pollution certificate", "check"],
      ["fitness", "Fitness / Permit", "If applicable", "idCard"],
      ["compliance", "Compliance", "Automated checks", "shield"],
      ["review", "Review", "Check & submit", "idCard"],
      ["status", "Approval Status", "Wheeltrack review", "check"]
    ];
    const vehicleIndex = () => C().vehicles.findIndex((v) => v.id === params.get("id"));
    const vPath = (v, step) => `transporter/vehicle.php?id=${v.id}&step=${step}`;
    const REG_RE = /^[A-Z]{2}\d{1,2}[A-Z]{0,3}\d{1,4}$/;
    const okish = (st) => ["verified", "under_review"].includes(st);
    function vehicleRules(v) {
      return [
        () => REG_RE.test(v.registration) && !Object.keys(validateVehicleDetails(v)).length,
        () => okish(v.rc.status),
        () => okish(v.insurance.status),
        () => okish(v.puc.status),
        () => v.fitness.na || okish(v.fitness.status),
        () => !vehicleIssues(v).length,
        () => v.status !== "draft",
        () => v.status === "approved"
      ];
    }
    function validateVehicleDetails(v) {
      const i = C().vehicles.indexOf(v);
      const base = `company.vehicles.${i}.`;
      const e = {};
      if (!REG_RE.test(v.registration || "")) e[`${base}registration`] = filled(v.registration) ? "Enter a valid registration number, e.g. MH12AB1234." : "Enter the vehicle registration number.";
      else if (C().vehicles.some((x) => x !== v && x.registration === v.registration)) e[`${base}registration`] = "This vehicle is already registered.";
      if (!v.type) e[`${base}type`] = "Select the vehicle type.";
      ["payload", "bodyLength", "bedLength", "bedHeight", "bedWidth"].forEach((key) => {
        if (filled(v[key]) && !/^\d+(\.\d+)?( ?(ft|m|tons?))?$/i.test(String(v[key]).trim())) e[`${base}${key}`] = "Enter a number.";
      });
      return e;
    }
    function vehicleIssues(v) {
      const issues = [];
      const c = vehicleCompliance(v);
      Object.entries(c).forEach(([key, st]) => { if (!okish(st)) issues.push(`${{ rc: "RC", insurance: "Insurance", puc: "PUC", fitness: "Fitness / Permit" }[key]} is not verified.`); });
      [["Insurance", v.insurance.upto], ["PUC", v.puc.upto], ...(v.fitness.na ? [] : [["Fitness certificate", v.fitness.upto], ["Permit", v.fitness.permitUpto]])].forEach(([label, date]) => {
        if (date && date < today()) issues.push(`${label} has expired.`);
      });
      return issues;
    }
    function vehicleWorkspace(v, step, body) {
      const idx = V_STEPS.findIndex(([id]) => id === step);
      return ui.onboardWorkspace(`cov-${step}`, body, {
        key: `co-vehicle-${v.id}`,
        rules: vehicleRules(v),
        paths: V_STEPS.map(([id]) => vPath(v, id)),
        groups: V_STEPS.map(([id, label]) => [label, [`cov-${id}`]]),
        info: V_STEPS.map(([, label, note]) => [label, note]),
        label: "Vehicle registration progress",
        kicker: "Vehicle Registration",
        heading: idx >= 0 ? `<span data-no-translate>${esc(v.registration || "New vehicle")}</span>` : ""
      });
    }
    function vActions(v, step, opts = {}) {
      const idx = V_STEPS.findIndex(([id]) => id === step);
      const back = idx > 0 ? vPath(v, V_STEPS[idx - 1][0]) : "transporter/dashboard.php?tab=vehicles";
      const next = opts.next !== undefined ? opts.next : `<button class="ws-cta pd-next" type="button" data-co-action="v-continue" data-step="${step}"><span>Continue</span>${icons.arrowRight}</button>`;
      return `<div class="co-foot"><p class="field-error" id="co-step-error" aria-live="polite"></p><div class="pd-actions"><a class="pd-back" href="${root(back)}">${icons.back}<span>Back</span></a><div class="co-actions-right">${next}</div></div></div>`;
    }
    function vDocCard(v, i, kind, can) {
      const k = v[kind];
      const base = `company.vehicles.${i}`;
      const labels = { insurance: ["Insurance Policy Number", "Insurance Document"], puc: ["PUC Certificate Number", "PUC Certificate"], fitness: ["Fitness Certificate Number", "Fitness Certificate"] }[kind];
      const fields = kind === "insurance"
        ? `<div class="pd-grid cols-2">${pdField("Insurance Company", `${base}.insurance.company`, { required: true })}${pdField(labels[0], `${base}.insurance.number`, { required: true })}${pdField("Valid From", `${base}.insurance.from`, { type: "date" })}${pdField("Valid Upto", `${base}.insurance.upto`, { type: "date", required: true })}</div>`
        : kind === "puc"
          ? `<div class="pd-grid cols-3">${pdField(labels[0], `${base}.puc.number`, { required: true })}${pdField("Valid From", `${base}.puc.from`, { type: "date" })}${pdField("Valid Upto", `${base}.puc.upto`, { type: "date", required: true })}</div>`
          : `<div class="pd-grid cols-2">${pdField(labels[0], `${base}.fitness.number`, { required: true })}${pdField("Fitness Valid Upto", `${base}.fitness.upto`, { type: "date", required: true })}${pdField("Permit Number", `${base}.fitness.permit`)}${pdField("Permit Valid Upto", `${base}.fitness.permitUpto`, { type: "date" })}</div>`;
      const problem = k.status === "failed" ? `<div class="co-kyc-problem"><p>${["PROVIDER_UNAVAILABLE", "NOT_CONFIGURED"].includes(k.failedReason) ? "The verification service is unavailable right now. Try again later or submit for manual review." : "We couldn't verify this document. Check the number and try again, or submit it for manual review."}</p>${can ? `<button class="pd-back kyc-alt" type="button" data-co-action="v-manual" data-kind="${kind}">${icons.edit}<span>Submit for Manual Review</span></button>` : ""}</div>` : "";
      return `<section class="pd-section">
          ${kind === "fitness" ? `<label class="pd-check"><input type="checkbox" data-field="${base}.fitness.na" ${v.fitness.na ? "checked" : ""} ${can ? "" : "disabled"}><span>Fitness certificate and permit are not applicable to this vehicle</span></label>` : ""}
          ${kind === "fitness" && v.fitness.na ? '<p class="co-hint">Wheeltrack will confirm this during approval.</p>' : `${lockWrap(can, fields)}
          <ul class="co-docs">${docRow(`${base}.docs.${kind}`, labels[1], { need: "required", editable: can })}</ul>
          <div class="verify-row"><span><span>Status</span> ${vBadge(k.status)}</span>${can && !okish(k.status) ? `<button class="pd-upload-btn" type="button" data-co-action="v-verify" data-kind="${kind}"><span class="spinner dark" aria-hidden="true"></span>${icons.shield}<span class="ws-cta-label">Verify</span></button>` : ""}</div>
          ${problem}${sourceTag(k.source)}${historyList(k.history)}`}
        </section>`;
    }
    function vehicleGps(v, i, can) {
      const path = `company.vehicles.${i}.gps`;
      return `<div class="pd-field co-field"><span class="co-label">Does this vehicle have GPS installed?</span><span id="pd-${path.replace(/\W/g, "-")}" tabindex="-1">${can ? pills("Does this vehicle have GPS installed?", path, [["yes", "Yes"], ["no", "No"], ["unknown", "Don't Know"]], v.gps) : `<strong>${gpsLabel(v.gps)}</strong>`}</span></div>`;
    }
    function renderVehicle(stepParam) {
      const i = vehicleIndex();
      const v = C().vehicles[i];
      const step = V_STEPS.some(([id]) => id === stepParam) ? stepParam : "details";
      const can = v.status === "draft" || v.status === "rejected";
      const base = `company.vehicles.${i}`;
      const t = (s, note) => { const x = V_STEPS.find(([id]) => id === s); return title(x[3], x[1], note); };
      let body;
      if (step === "details") {
        body = `${t("details", "Each vehicle is registered and verified separately.")}
          <div class="pd">
            ${lockWrap(can, `<section class="pd-section">
              <div class="pd-grid cols-3">
                ${pdField("Vehicle Registration Number", `${base}.registration`, { required: true, maxlength: 13 })}
                ${pdSelect("Vehicle Type", `${base}.type`, ["", "LCV", "ICV", "MCV", "HCV", "Trailer", "Tanker", "Tipper", "Pickup", "Other"], true)}
                ${pdField("Body Type", `${base}.body`)}
                ${pdField("Body Length", `${base}.bodyLength`)}
                ${pdField("Payload Capacity (tons)", `${base}.payload`, { inputmode: "decimal" })}
                ${pdSelect("Availability", `${base}.availability`, ["Available", "Unavailable", "On Trip"])}
              </div>
            </section>
            <section class="pd-section">
              ${pdHead("box", "Operations", "Cargo, permit area and bed size")}
              <div class="pd-grid cols-3">
                ${pdField("Cargo Type Supported", `${base}.cargo`)}
                ${pdField("Operating Area / Permit", `${base}.area`)}
                ${pdField("Bed Length", `${base}.bedLength`)}
                ${pdField("Bed Height", `${base}.bedHeight`)}
                ${pdField("Bed Width", `${base}.bedWidth`)}
              </div>
              ${vehicleGps(v, i, can)}
            </section>`)}
            ${vActions(v, "details")}
          </div>`;
      } else if (step === "rc") {
        const rc = v.rc;
        const r = rc.result || {};
        body = `${t("rc", "Verify the registration certificate for this vehicle.")}
          <div class="pd">
            <section class="pd-section">
              <div class="verify-row"><span><span>Status</span> ${vBadge(rc.status)}</span>${can && !okish(rc.status) ? `<button class="pd-upload-btn" type="button" data-co-action="v-verify" data-kind="rc"><span class="spinner dark" aria-hidden="true"></span>${icons.shield}<span class="ws-cta-label">Verify RC</span></button>` : ""}</div>
              ${rc.status === "verified" ? `<dl class="api-grid"><div><dt>Registration Number</dt><dd data-no-translate>${esc(r.registration)}</dd></div><div><dt>Vehicle Type</dt><dd>${esc(r.type)}</dd></div><div><dt>Body Type</dt><dd>${esc(r.body)}</dd></div><div><dt>Body Length</dt><dd data-no-translate>${esc(r.bodyLength)}</dd></div><div><dt>Payload Capacity (tons)</dt><dd data-no-translate>${esc(r.payload)}</dd></div><div><dt>Fitness Valid Upto</dt><dd data-no-translate>${esc(formatDate(r.fitnessUpto))}</dd></div></dl>${can ? `<button class="link-btn" type="button" data-co-action="v-apply-rc">Use RC values for empty vehicle fields</button>` : ""}` : ""}
              ${rc.status === "failed" ? `<div class="co-kyc-problem"><p>${["PROVIDER_UNAVAILABLE", "NOT_CONFIGURED"].includes(rc.failedReason) ? "The RC service is unavailable right now. Try again later or submit the RC for manual review." : "No RC record matched this registration number. Check it in Vehicle Details, or submit the RC for manual review."}</p>${can ? `<button class="pd-back kyc-alt" type="button" data-co-action="v-manual" data-kind="rc">${icons.edit}<span>Submit for Manual Review</span></button>` : ""}</div>` : ""}
              ${rc.status === "under_review" ? '<p class="notice">Submitted for manual review. The RC is not marked verified until Wheeltrack checks it.</p>' : ""}
              <ul class="co-docs">${docRow(`${base}.docs.rc`, "RC Document", { need: rc.status === "verified" ? "optional" : "required", editable: can })}</ul>
              ${sourceTag(rc.source)}${historyList(rc.history)}
            </section>
            ${vActions(v, "rc")}
          </div>`;
      } else if (["insurance", "puc", "fitness"].includes(step)) {
        body = `${t(step, { insurance: "Your vehicle insurance policy.", puc: "Pollution Under Control certificate.", fitness: "Fitness certificate and permit, where applicable." }[step])}
          <div class="pd">${vDocCard(v, i, step, can)}${vActions(v, step)}</div>`;
      } else if (step === "compliance") {
        const c = vehicleCompliance(v);
        const issues = vehicleIssues(v);
        body = `${t("compliance", "Automated checks across this vehicle's documents.")}
          <div class="pd">
            <section class="pd-section">
              <ol class="id-flow">${[["RC", c.rc], ["Insurance", c.insurance], ["PUC", c.puc], ["Fitness / Permit", v.fitness.na ? "na" : c.fitness]].map(([label, st], n) => `<li class="id-stage ${okish(st) || st === "na" ? "is-done" : "is-pending"}"><span class="id-dot">${okish(st) || st === "na" ? icons.check : n + 1}</span><span class="id-label">${label}</span>${vBadge(st)}</li>`).join("")}</ol>
              ${issues.length ? `<ul class="co-issues">${issues.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : '<p class="notice success">All checks passed.</p>'}
            </section>
            ${vActions(v, "compliance")}
          </div>`;
      } else if (step === "review") {
        const rows = [["Registration Number", v.registration, true], ["Vehicle Type", v.type], ["Body Type", v.body], ["Body Length", v.bodyLength, true], ["Payload Capacity (tons)", v.payload, true], ["Cargo Type Supported", v.cargo], ["Operating Area / Permit", v.area], ["Availability", v.availability], ["Bed Length", v.bedLength, true], ["Bed Height", v.bedHeight, true], ["Bed Width", v.bedWidth, true], ["GPS Installed", gpsLabel(v.gps)]];
        body = `${t("review", "Check the vehicle before submitting it for approval.")}
          <div class="pd">
            <section class="pd-section"><dl class="api-grid">${rows.map(([dt, dd, raw]) => `<div><dt>${dt}</dt><dd${raw ? " data-no-translate" : ""}>${esc(filled(dd) ? dd : "—")}</dd></div>`).join("")}</dl>${can ? `<a class="btn ghost" href="${root(vPath(v, "details"))}">Edit</a>` : ""}</section>
            <section class="pd-section">${pdHead("idCard", "Documents", "")}<ul class="review-list">${[["RC", v.rc.status, "rc"], ["Insurance", v.insurance.status, "insurance"], ["PUC", v.puc.status, "puc"], ["Fitness / Permit", v.fitness.na ? "na" : v.fitness.status, "fitness"]].map(([label, st, s]) => `<li><span>${label}</span>${vBadge(st)}${can ? `<a class="btn ghost" href="${root(vPath(v, s))}">Edit</a>` : "<span></span>"}</li>`).join("")}</ul></section>
            ${vActions(v, "review", { next: can ? `<button class="ws-cta pd-next" type="button" data-co-action="v-submit"><span class="spinner" aria-hidden="true"></span><span class="ws-cta-label">${v.status === "rejected" ? "Resubmit for Approval" : "Submit for Approval"}</span>${icons.arrowRight}</button>` : `<a class="ws-cta pd-next" href="${root(vPath(v, "status"))}"><span>View Approval Status</span>${icons.arrowRight}</a>` })}
          </div>`;
      } else {
        const st = v.status;
        body = `${t("status", "Wheeltrack reviews each vehicle before it can be assigned to a driver.")}
          <div class="pd">
            <div class="approved-card ${st === "approved" ? "ok" : st === "rejected" ? "bad" : ""}"><span class="approved-icon">${st === "approved" ? icons.check : icons.shield}</span><div><strong>${{ approved: "Approved", rejected: "Rejected", pending_approval: "Pending Approval", draft: "Not Submitted" }[st]}</strong><span data-no-translate>${esc(v.registration)}</span>${["approved", "rejected"].includes(st) && isSandbox("vehicle") ? TEST_DECISION : ""}</div></div>
            ${v.remarks ? `<p class="notice ${st === "rejected" ? "danger" : ""}"><span>Reviewer remarks:</span> <span data-no-translate>${esc(v.remarks)}</span></p>` : ""}
            <dl class="api-grid"><div><dt>Submitted On</dt><dd data-no-translate>${esc(dateTime(v.submittedAt))}</dd></div><div><dt>Decided On</dt><dd data-no-translate>${esc(dateTime(v.decidedAt))}</dd></div></dl>
            ${st === "pending_approval" && isSandbox("vehicle") ? `<section class="co-sandbox"><header><strong>Sandbox admin review</strong><span class="sandbox-tag">Test only</span></header><div class="pd-field"><label for="co-v-remarks">Reviewer Remarks</label><textarea id="co-v-remarks" rows="2"></textarea></div><p class="field-error" id="co-admin-error" aria-live="polite"></p><div class="co-admin-actions"><button class="ws-cta kyc-btn" type="button" data-co-action="v-admin" data-decision="approved">${icons.check}<span>Approve</span></button><button class="pd-back kyc-alt co-danger" type="button" data-co-action="v-admin" data-decision="rejected"><span>Reject</span></button></div></section>` : ""}
            <div class="pd-actions"><a class="pd-back" href="${root(vPath(v, "review"))}">${icons.back}<span>Back</span></a><a class="ws-cta pd-next" href="${root("transporter/dashboard.php?tab=vehicles")}"><span>Go to Dashboard</span>${icons.arrowRight}</a></div>
          </div>`;
      }
      return ui.shell(vehicleWorkspace(v, step, body), { back: "transporter/dashboard.php?tab=vehicles", mainClass: "ws-shell", pageClass: "ws-page" });
    }
    async function verifyVehicleDoc(button) {
      const v = C().vehicles[vehicleIndex()];
      const kind = button.dataset.kind;
      const k = v[kind];
      const i = vehicleIndex();
      if (kind !== "rc") {
        const required = { insurance: ["company", "number", "upto"], puc: ["number", "upto"], fitness: ["number", "upto"] }[kind];
        const missing = required.filter((key) => !filled(k[key]));
        if (missing.length) {
          const e = {};
          missing.forEach((key) => { e[`company.vehicles.${i}.${kind}.${key}`] = "Required to verify."; });
          return showErrors(e, true);
        }
      }
      setLoading(button, true, "Verifying…");
      const res = kind === "rc" ? await svc.VehicleVerificationService.verifyRc({ registration: v.registration }) : await svc.VehicleVerificationService.verifyDocument({ kind, number: k.number });
      const status = res.ok ? res.status : "failed";
      Object.assign(k, { status, result: res.ok && res.status === "verified" ? res.result : null, failedReason: res.ok ? res.reason || "" : res.code, source: res.source, checkedAt: now() });
      k.history.push({ at: k.checkedAt, status, reason: k.failedReason, source: res.source });
      audit(`${kind === "rc" ? "RC" : V_STEPS.find(([id]) => id === kind)[1]} verification`, `${v.registration} · ${V_STATUS[status][0]}${res.source === "sandbox" ? " (sandbox)" : ""}`, { type: "verification" });
      save();
      ui.render();
    }

    // ---------------------------------------------------------------- routing
    function render(step) {
      if (step === "dashboard") return renderDashboard();
      if (step === "vehicle") return renderVehicle(params.get("step"));
      const body = { mobile: stepMobile, "mobile-otp": () => otpStep("mobile"), email: stepEmail, "email-otp": () => otpStep("email"), password: stepPassword, consent: stepConsent, details: stepDetails, representative: stepRepresentative, identity: stepIdentity, kyc: stepKyc, documents: stepDocuments, review: stepReview, status: stepStatus }[step]();
      const order = PAGE_ORDER.indexOf(step);
      if (attempted[step] && VALIDATORS[step]) setTimeout(() => showErrors(VALIDATORS[step](), false), 0);
      migrateProgress();
      return ui.shell(ui.onboardWorkspace(wsId(step), body, {
        key: "company11",
        rules: flowRules(),
        paths: STEPS.map(([, path]) => path),
        groups: STEPS.map(([id, , label, , , subs]) => [label, [id, ...(subs || [])].map(wsId)]),
        info: STEPS.map(([, , label, note]) => [label, note]),
        label: "Transporter / Shipper registration progress",
        kicker: "Transporter / Shipper",
        heading: 'Register your<br><span class="brand-red">business.</span>'
      }), { back: order > 0 ? pathOf(PAGE_ORDER[order - 1]) : "register/index.php", mainClass: "ws-shell", pageClass: "ws-page" });
    }
    // Saved progress from the earlier 8-step layout maps onto the 11-step layout (Account = steps 1-3, Consent = 4).
    function migrateProgress() {
      const progress = S().progress || (S().progress = {});
      const a = C().account;
      ["mobile", "email"].forEach((kind) => { if (a[`${kind}Verified`] && !a[`${kind}VerifiedValue`]) a[`${kind}VerifiedValue`] = a[kind]; });
      if (progress.company11 === undefined && progress.company !== undefined) {
        progress.company11 = [2, 4, 5, 6, 7, 8, 9, 10][progress.company] ?? 0;
        save();
      }
    }
    // Opening a later page directly sends the user to the first incomplete step.
    function redirect(step) {
      if (step === "dashboard" || step === "vehicle") {
        if (!approved()) return submitted() ? pathOf("status") : redirect("status") || pathOf("mobile");
        if (step === "vehicle") {
          const id = params.get("id");
          if (id === "new" || !C().vehicles.some((v) => v.id === id)) {
            // Reuse an untouched draft instead of piling up empty demo vehicles.
            let v = C().vehicles.find((x) => x.status === "draft" && !x.registration && !x.type);
            if (!v) {
              v = newVehicle();
              C().vehicles.push(v);
              audit("Vehicle registration started", "", { type: "vehicle" });
              save();
            }
            return vPath(v, "details");
          }
          // Later vehicle steps need the earlier ones.
          const v = C().vehicles[vehicleIndex()];
          const idx = V_STEPS.findIndex(([s]) => s === params.get("step"));
          const rules = vehicleRules(v);
          for (let n = 0; n < idx; n += 1) if (!rules[n]()) return vPath(v, V_STEPS[n][0]);
        }
        return "";
      }
      const idx = STEP_IDS.indexOf(stepOf(step));
      if (idx < 0) return "";
      if (submitted()) return "";
      const rules = flowRules();
      for (let n = 0; n < idx; n += 1) if (!rules[n]()) return STEPS[n][1];
      // An OTP page needs an OTP to have been sent (or the contact already verified).
      if (step === "mobile-otp" || step === "email-otp") {
        const kind = step.split("-")[0];
        if (!C().account[`${kind}Verified`] && !C().account[`${kind}Otp`].referenceId) return pathOf(kind);
      }
      return "";
    }

    // ---------------------------------------------------------------- events
    function continueStep(step) {
      const errors = VALIDATORS[step] ? VALIDATORS[step]() : {};
      attempted[step] = true;
      if (Object.keys(errors).length) return showErrors(errors, true);
      C().draftSavedAt = now();
      save();
      go(STEPS[STEP_IDS.indexOf(step) + 1][1]);
    }
    function saveRep(button) {
      const i = repIndex(button.dataset.id);
      const r = reps()[i];
      const errors = validateRep(i);
      if (Object.keys(errors).length) return showErrors(errors, true);
      const isNew = !r.saved;
      r.saved = true;
      if (r.status === "draft") r.status = approved() && identityDone(r) ? "active" : "pending_verification";
      C().repEditing = "";
      audit(isNew ? "Representative added" : "Representative updated", `${r.name} · ${r.role}`, { type: "representative", subject: r.id });
      save();
      ui.render();
      if (button.dataset.ctx === "dashboard" && isNew && !identityDone(r)) go(`${pathOf("identity")}?rep=${r.id}`);
    }
    async function sendAadhaar(button) {
      const i = Number(button.dataset.rep);
      const a = reps()[i].identity;
      const digits = temp.coAadhaar || "";
      const error = !digits ? "Enter the Aadhaar number." : digits.length !== 12 ? "Aadhaar number must have 12 digits." : !svc.AadhaarVerificationService.isValidAadhaar(digits) ? "This is not a valid Aadhaar number. Please check the digits and try again." : !a.consent ? "Please give your consent to continue." : "";
      setMessage("co-aadhaar-error", error);
      if (error) return;
      setLoading(button, true, "Sending OTP…");
      const res = await svc.AadhaarVerificationService.sendOtp({ aadhaar: digits, consent: true });
      if (!res.ok && ["NOT_CONFIGURED", "PROVIDER_UNAVAILABLE", "TOO_MANY_ATTEMPTS"].includes(res.code)) {
        temp.coAadhaar = "";
        Object.assign(a, { status: "failed", failedReason: res.code, last4: digits.slice(-4), source: res.source });
        audit("Aadhaar verification failed", reasonText(res.code), { type: "verification", subject: reps()[i].id });
        save();
        return ui.render();
      }
      if (!res.ok) {
        setLoading(button, false, "Send OTP");
        return setMessage("co-aadhaar-error", ui.serviceError(res.code));
      }
      temp.coAadhaar = "";
      temp.coAadhaarOtp = "";
      Object.assign(a, { status: "otp_sent", referenceId: res.referenceId, last4: res.last4, sentAt: Date.now(), expiresIn: res.expiresIn, resendIn: res.resendIn, source: res.source });
      save();
      ui.render();
      document.querySelector('[data-otp-temp="coAadhaarOtp"] .otp')?.focus();
    }
    async function verifyAadhaar(button) {
      const i = Number(button.dataset.rep);
      const r = reps()[i];
      const a = r.identity;
      if (!/^\d{6}$/.test(temp.coAadhaarOtp || "")) return setMessage("co-aadhaar-error", "Enter the 6-digit OTP.");
      setLoading(button, true, "Verifying…");
      const res = await svc.AadhaarVerificationService.verifyOtp({ referenceId: a.referenceId, otp: temp.coAadhaarOtp });
      temp.coAadhaarOtp = "";
      if (!res.ok && ["NOT_CONFIGURED", "PROVIDER_UNAVAILABLE", "TOO_MANY_ATTEMPTS"].includes(res.code)) {
        Object.assign(a, { status: "failed", failedReason: res.code, referenceId: "", source: res.source });
        save();
        return ui.render();
      }
      if (!res.ok) {
        setLoading(button, false, "Verify Identity");
        document.querySelectorAll('[data-otp-temp="coAadhaarOtp"] .otp').forEach((el) => { el.value = ""; });
        return setMessage("co-aadhaar-error", ui.serviceError(res.code));
      }
      // Keep only the fields needed for representative verification.
      const p = res.profile || {};
      const addr = p.address ? [p.address.line, p.address.district, p.address.state, p.address.pincode].filter(Boolean).join(", ") : "";
      Object.assign(a, { method: "aadhaar", status: "verified", failedReason: "", referenceId: "", last4: res.last4 || a.last4, verifiedAt: res.verifiedAt || now(), source: res.source, profile: { name: p.name || "", dob: p.dob || "", gender: p.gender || "", address: addr } });
      if (approved() && r.saved && r.status !== "deactivated") r.status = "active";
      audit("Representative identity verified", `${r.name} · Aadhaar${res.source === "sandbox" ? " (sandbox)" : ""}`, { type: "verification", subject: r.id });
      save();
      ui.render();
    }

    document.addEventListener("click", (event) => {
      const el = event.target.closest("[data-co-action]");
      if (!el) return;
      const name = el.dataset.coAction;
      const c = C();
      if (name === "continue") return continueStep(el.dataset.step);
      if (name === "acct-send-email") return accountSend("email", el);
      if (name === "acct-verify") return accountVerify(el.dataset.kind, el);
      if (name === "acct-resend") return accountResend(el.dataset.kind);
      if (name === "acct-password") return accountPassword();
      if (name === "acct-consent") return accountConsent();
      if (name === "send-otp") return sendContactOtp(el);
      if (name === "verify-otp") return verifyContactOtp(el);
      if (name === "resend-otp") return resendContactOtp(el);
      if (name === "change-contact") {
        const obj = store.getByPath(S(), el.dataset.scope);
        obj[`${el.dataset.kind}Verified`] = false;
        obj[`${el.dataset.kind}Otp`] = otpSession();
        save();
        ui.render();
        return document.getElementById(`pd-${el.dataset.scope.replace(/\W/g, "-")}-${el.dataset.kind}`)?.focus();
      }
      if (name === "change-password") {
        temp.coPasswordEdit = true;
        c.account.passwordSet = false;
        save();
        ui.render();
        return document.getElementById("co-password")?.focus();
      }
      if (name === "pick-file") return document.getElementById(el.dataset.target)?.click();
      if (name === "preview-doc") return ui.openModal(previewDialog(el.dataset.path));
      if (name === "delete-doc") {
        if (!confirm("Delete this document?")) return;
        const meta = store.getByPath(S(), el.dataset.path);
        setDocAt(el.dataset.path, null);
        audit("Document deleted", meta ? meta.name : "", { type: "document" });
        save();
        return ui.render();
      }
      // Representatives
      if (name === "add-rep") {
        const rep = newRep(false);
        c.reps.push(rep);
        c.repEditing = rep.id;
        save();
        ui.render();
        return document.getElementById(`pd-company-reps-${c.reps.length - 1}-name`)?.focus();
      }
      if (name === "edit-rep") {
        c.repEditing = el.dataset.id;
        save();
        ui.render();
        return document.getElementById("co-rep-editor")?.scrollIntoView({ block: "start", behavior: "smooth" });
      }
      if (name === "cancel-rep") {
        const r = reps()[repIndex(el.dataset.id)];
        if (r && !r.saved && !r.primary) c.reps.splice(repIndex(el.dataset.id), 1);
        c.repEditing = "";
        save();
        return ui.render();
      }
      if (name === "remove-rep") {
        const i = repIndex(el.dataset.id);
        if (i < 0 || !confirm("Remove this representative?")) return;
        audit("Representative removed", c.reps[i].name, { type: "representative" });
        c.reps.splice(i, 1);
        if (c.repEditing === el.dataset.id) c.repEditing = "";
        save();
        return ui.render();
      }
      if (name === "save-rep") return saveRep(el);
      // Identity
      if (name === "id-send") return sendAadhaar(el);
      if (name === "id-verify") return verifyAadhaar(el);
      if (name === "id-resend") {
        const a = reps()[Number(el.dataset.rep)].identity;
        svc.AadhaarVerificationService.resendOtp({ referenceId: a.referenceId }).then((res) => {
          if (!res.ok) return setMessage("co-aadhaar-error", ui.serviceError(res.code));
          Object.assign(a, { referenceId: res.referenceId || a.referenceId, sentAt: Date.now(), expiresIn: res.expiresIn, resendIn: res.resendIn });
          save();
          ui.render();
          setMessage("co-aadhaar-error", "A new OTP has been sent.", "ok");
        });
        return;
      }
      if (["id-change", "id-reset", "id-aadhaar"].includes(name)) {
        const a = reps()[Number(el.dataset.rep)].identity;
        if (name === "id-reset" && !confirm("This removes the verified Aadhaar status for this representative. Continue?")) return;
        Object.assign(a, { method: "aadhaar", status: name === "id-aadhaar" && a.status === "verified" ? "verified" : "idle", referenceId: "", sentAt: 0, ...(name === "id-aadhaar" ? {} : { last4: "", profile: null, verifiedAt: "" }) });
        temp.coAadhaarOtp = "";
        save();
        ui.render();
        return document.getElementById("co-aadhaar-number")?.focus();
      }
      if (name === "id-manual") {
        const r = reps()[Number(el.dataset.rep)];
        Object.assign(r.identity, { method: "manual", referenceId: "", sentAt: 0, status: r.identity.status === "otp_sent" ? "idle" : r.identity.status });
        if (!r.identity.manual.name) r.identity.manual.name = r.name;
        save();
        ui.render();
        return document.getElementById(`pd-company-reps-${el.dataset.rep}-identity-manual-name`)?.focus();
      }
      if (name === "id-manual-submit") {
        const i = Number(el.dataset.rep);
        const r = reps()[i];
        const m = r.identity.manual;
        const base = `company.reps.${i}.identity`;
        const e = {};
        if (!filled(m.name)) e[`${base}.manual.name`] = "Enter the full name.";
        if (!filled(m.dob)) e[`${base}.manual.dob`] = "Enter the date of birth.";
        else if (m.dob > new Date(Date.now() - 18 * 365.25 * 86400000).toISOString().slice(0, 10)) e[`${base}.manual.dob`] = "The representative must be at least 18 years old.";
        if ((m.address || "").trim().length < 10) e[`${base}.manual.address`] = "Enter the full residential address.";
        if (!m.docType) e[`${base}.manual.docType`] = "Select the identity document type.";
        if (m.docType && m.docType !== "Other Government ID" && !filled(m.docRef)) e[`${base}.manual.docRef`] = "Enter the document number.";
        if (!r.identity.doc) e[`${base}.doc`] = "Upload the identity document.";
        if (Object.keys(e).length) return showErrors(e, true);
        Object.assign(r.identity, { manualStatus: "submitted", manualSubmittedAt: now() });
        audit("Identity submitted for manual review", r.name, { type: "verification", subject: r.id });
        save();
        return ui.render();
      }
      // Business KYC
      if (name === "kyc-verify") return verifyKyc(el);
      if (name === "kyc-reset") {
        const k = c.kyc[el.dataset.key];
        Object.assign(k, { status: "not_started", result: null, failedReason: "" });
        save();
        ui.render();
        return document.getElementById(`co-kyc-${el.dataset.key}`)?.focus();
      }
      if (name === "kyc-manual") {
        const key = el.dataset.key;
        if (!c.docs[KYC_DOC[key]]) return showFieldError(`company.docs.${KYC_DOC[key]}`, "Upload the supporting document first.");
        const k = c.kyc[key];
        k.status = "under_review";
        k.history.push({ at: now(), status: "under_review", reason: "MANUAL", source: "" });
        audit(`${cinLabel(key)} submitted for manual review`, k.number, { type: "verification" });
        save();
        return ui.render();
      }
      // Registration
      if (name === "submit-registration") return submitRegistration(el);
      if (name === "refresh-status") return refreshStatus(el);
      if (name === "admin-decide") return adminDecide(el);
      if (name === "admin-advance") return adminAdvance();
      // Dashboard
      if (name === "profile-edit") {
        temp.coProfileEdit = true;
        return ui.render();
      }
      if (name === "profile-save") {
        const errors = validateDetails();
        const allowed = ["contact", "website", "fleet", "locations"].map((k) => `company.details.${k}`);
        const relevant = Object.fromEntries(Object.entries(errors).filter(([p]) => allowed.includes(p)));
        if (Object.keys(relevant).length) return showErrors(relevant, true);
        temp.coProfileEdit = false;
        audit("Company profile updated", "Contact details", { type: "profile" });
        save();
        return ui.render();
      }
      if (name === "perm-edit") {
        temp.coPermEdit = el.dataset.id;
        return ui.render();
      }
      if (name === "perm-save" || name === "perm-reset") {
        const r = reps()[repIndex(el.dataset.id)];
        r.permissions = name === "perm-reset" ? null : ["overview", ...[...document.querySelectorAll("[name=co-perm]:checked")].map((x) => x.value).filter((x) => x !== "overview")];
        audit("Permissions changed", `${r.name} · ${permissionsOf(r).map((key) => MODULES.find(([m]) => m === key)[1]).join(", ")}`, { type: "representative", subject: r.id });
        temp.coPermEdit = "";
        save();
        return ui.render();
      }
      if (name === "rep-toggle") {
        const r = reps()[repIndex(el.dataset.id)];
        if (r.status !== "deactivated" && !confirm(`Deactivate access for ${r.name}?`)) return;
        r.status = r.status === "deactivated" ? (identityDone(r) ? "active" : "pending_verification") : "deactivated";
        if (c.actingAs === r.id && r.status === "deactivated") c.actingAs = primaryRep().id;
        audit(r.status === "deactivated" ? "Representative deactivated" : "Representative reactivated", r.name, { type: "representative", subject: r.id });
        save();
        return ui.render();
      }
      if (name === "rep-activity") {
        temp.coActivity = el.dataset.id;
        return ui.render();
      }
      if (name === "assoc-refresh") return loadAssociations(true);
      if (name === "assoc-approve") return decideAssociation(el.dataset.id, "approved", "", el);
      if (name === "assoc-reason") {
        ui.openModal(reasonDialog(el.dataset.id, el.dataset.decision));
        return document.getElementById("co-reason")?.focus();
      }
      if (name === "assoc-decide") return decideAssociation(el.dataset.id, el.dataset.decision, (document.getElementById("co-reason") || {}).value || "", el);
      if (name === "assign") return assignVehicle(el.dataset.id, (document.getElementById(`co-assign-${el.dataset.id}`) || {}).value);
      if (name === "unassign") {
        if (!confirm("Remove the vehicle assignment for this driver?")) return;
        return assignVehicle(el.dataset.id, null);
      }
      // Vehicles
      const v = c.vehicles[vehicleIndex()];
      if (name === "v-continue") {
        const step = el.dataset.step;
        const idx = V_STEPS.findIndex(([id]) => id === step);
        if (step === "details") {
          const errors = validateVehicleDetails(v);
          if (Object.keys(errors).length) return showErrors(errors, true);
        } else if (!vehicleRules(v)[idx]()) {
          return setMessage("co-step-error", step === "compliance" ? "Resolve the compliance issues above to continue." : step === "fitness" ? "Verify the fitness certificate, submit it for manual review, or mark it not applicable." : "Verify this document or submit it for manual review to continue.");
        }
        save();
        return go(vPath(v, V_STEPS[idx + 1][0]));
      }
      if (name === "v-verify") return verifyVehicleDoc(el);
      if (name === "v-manual") {
        const kind = el.dataset.kind;
        const path = `company.vehicles.${vehicleIndex()}.docs.${kind}`;
        if (!v.docs[kind]) return showFieldError(path, "Upload the document first.");
        v[kind].status = "under_review";
        v[kind].history.push({ at: now(), status: "under_review", reason: "MANUAL", source: "" });
        audit("Vehicle document submitted for manual review", `${v.registration} · ${kind.toUpperCase()}`, { type: "vehicle" });
        save();
        return ui.render();
      }
      if (name === "v-apply-rc") {
        const r = v.rc.result || {};
        const map = { HCV: "HCV" };
        ["body", "bodyLength", "payload"].forEach((key) => { if (!filled(v[key]) && r[key]) v[key] = r[key]; });
        if (!v.type && r.type) v.type = map[r.type] || r.type;
        save();
        return ui.render();
      }
      if (name === "v-submit") {
        const rules = vehicleRules(v);
        const gap = rules.slice(0, 6).findIndex((fn) => !fn());
        if (gap >= 0) return setMessage("co-step-error", `Complete ${V_STEPS[gap][1]} first.`);
        Object.assign(v, { status: "pending_approval", submittedAt: now(), remarks: "" });
        Object.values(v.docs).forEach((meta) => { if (meta.status === "pending") meta.status = "under_review"; });
        audit("Vehicle submitted for approval", `${v.registration} · GPS: ${gpsLabel(v.gps)}`, { type: "vehicle" });
        save();
        return go(vPath(v, "status"));
      }
      if (name === "v-admin") {
        const remarks = (document.getElementById("co-v-remarks") || {}).value || "";
        if (el.dataset.decision === "rejected" && !remarks.trim()) return setMessage("co-admin-error", "Enter reviewer remarks.");
        Object.assign(v, { status: el.dataset.decision, decidedAt: now(), remarks: remarks.trim() });
        if (el.dataset.decision === "approved") {
          Object.values(v.docs).forEach((meta) => { if (meta.status !== "rejected") meta.status = "verified"; });
          ["rc", "insurance", "puc", "fitness"].forEach((key) => { if (v[key].status === "under_review") v[key].status = "verified"; });
        }
        audit(el.dataset.decision === "approved" ? "Vehicle approved" : "Vehicle rejected", `${v.registration}${remarks ? ` · ${remarks}` : ""}`, { actor: "Wheeltrack Admin", type: "vehicle" });
        save();
        return ui.render();
      }
    });

    document.addEventListener("submit", (event) => {
      const form = event.target.closest("[data-form=co-mobile]");
      if (!form) return;
      event.preventDefault();
      accountSend("mobile", form.querySelector(".ws-cta"));
    });

    document.addEventListener("change", (event) => {
      const t = event.target;
      if (t.matches("[data-co-file]")) return handleFile(t);
      if (t.matches("[data-co-radio]")) {
        store.setByPath(S(), t.dataset.coRadio, t.value);
        if (/^company\.vehicles\.\d+\.gps$/.test(t.dataset.coRadio)) audit("Vehicle GPS status recorded", gpsLabel(t.value), { type: "vehicle" });
        save();
        t.closest(".co-pills").querySelectorAll("label").forEach((label) => label.classList.toggle("selected", label.contains(t)));
        return clearFieldError(t);
      }
      if (t.matches("[data-co-expiry]")) {
        const meta = store.getByPath(S(), t.dataset.coExpiry);
        if (meta) meta.expiry = t.value;
        save();
        return clearFieldError(t);
      }
      if (t.matches("[data-co-acting]")) {
        C().actingAs = t.value;
        save();
        return ui.render();
      }
      if (t.matches("[data-co-role]")) {
        const r = reps()[repIndex(t.dataset.coRole)];
        const before = r.role;
        r.role = t.value;
        r.permissions = null;
        audit("Role changed", `${r.name} · ${before} → ${r.role}`, { type: "representative", subject: r.id });
        save();
        return ui.render();
      }
      // A changed registration number invalidates the previous KYC / RC result.
      const kycMatch = (t.dataset.field || "").match(/^company\.kyc\.(pan|gstin|cin)\.number$/);
      if (kycMatch) {
        const k = C().kyc[kycMatch[1]];
        k.number = svc.BusinessKycService.normalize(t.value);
        if (k.status !== "not_started") Object.assign(k, { status: "not_started", result: null });
        save();
        return ui.render();
      }
      const regMatch = (t.dataset.field || "").match(/^company\.vehicles\.(\d+)\.registration$/);
      if (regMatch) {
        const v = C().vehicles[Number(regMatch[1])];
        v.registration = t.value.toUpperCase().replace(/[\s-]/g, "");
        if (v.rc.status !== "not_started") Object.assign(v.rc, { status: "not_started", result: null });
        save();
        return ui.render();
      }
    });

    document.addEventListener("input", (event) => {
      const t = event.target;
      if ((t.id === "mobile-number" || t.id === "co-email") && ui.page.screen.startsWith("company:")) {
        const kind = t.id === "co-email" ? "email" : "mobile";
        const a = C().account;
        const typed = kind === "mobile" ? t.value.replace(/\D/g, "") : t.value.trim().toLowerCase();
        if (a[`${kind}Verified`] && typed !== verifiedValue(kind)) {
          a[`${kind}Verified`] = false;
          save();
          const label = t.closest("form, .card")?.querySelector(".ws-cta-label");
          if (label) label.textContent = "Send OTP";
          t.closest("form, .card")?.querySelector(".notice.success")?.remove();
        }
      }
      if (t.id === "co-aadhaar-number") {
        temp.coAadhaar = t.value.replace(/\D/g, "").slice(0, 12);
        t.value = temp.coAadhaar.replace(/(\d{4})(?=\d)/g, "$1 ");
        setMessage("co-aadhaar-error", "");
      }
      if (/^company\.(account\.mobile|reps\.\d+\.mobile|details\.(contact|pincode|opPincode|fleet|locations|year))$/.test(t.dataset.field || "")) {
        const digits = t.value.replace(/\D/g, "");
        if (digits !== t.value) {
          t.value = digits;
          store.setByPath(S(), t.dataset.field, digits);
        }
      }
      if (t.closest(".invalid")) clearFieldError(t);
    });

    // Inline validation when leaving a field on a registration step.
    document.addEventListener("focusout", (event) => {
      const t = event.target;
      const path = t.dataset && t.dataset.field;
      const step = (ui.page.screen.match(/^company:(\w+)$/) || [])[1];
      if (!path || !path.startsWith("company.") || !step || !VALIDATORS[step] || !filled(t.value)) return;
      const errors = VALIDATORS[step]();
      if (errors[path] && !/OTP/.test(errors[path])) showFieldError(path, errors[path]);
    });

    return { render, redirect };
  };
})();
