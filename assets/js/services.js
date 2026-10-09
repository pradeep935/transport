/*
 * Wheeltrack verification service layer.
 *
 * Pages never talk to a verification provider directly. They call these services, and each service
 * delegates to the adapter configured in WHEELTRACK_CONFIG.PROVIDERS:
 *   sandbox – in-browser test adapter (results carry source: "sandbox" and are labelled in the UI)
 *   http    – POSTs to the server gateway (api/verification.php); provider credentials stay server-side
 *   none    – resolves NOT_CONFIGURED so the UI can show a "service not connected" state
 *
 * Every method resolves (never rejects) to { ok: true, source, ... } or { ok: false, code, source }.
 * Error codes: INVALID_INPUT, CONSENT_REQUIRED, INVALID_OTP, OTP_EXPIRED, TOO_MANY_ATTEMPTS, RESEND_TOO_SOON,
 *              NOT_FOUND, NOT_CONFIGURED, PROVIDER_UNAVAILABLE, DUPLICATE, INVALID_STATE, VEHICLE_IN_USE.
 */
(function () {
  const cfg = window.WHEELTRACK_CONFIG || {};
  const sandboxCfg = cfg.SANDBOX || {};
  const page = window.WHEELTRACK_PAGE || { root: "" };

  function providerFor(service) {
    return (cfg.PROVIDERS && cfg.PROVIDERS[service]) || "none";
  }
  function wait(value) {
    return new Promise((resolve) => setTimeout(() => resolve(value), sandboxCfg.LATENCY_MS ?? 600));
  }
  function fail(code, source) {
    return { ok: false, code, source };
  }
  function uid(prefix) {
    return `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }

  async function httpCall(action, payload) {
    try {
      const response = await fetch(`${page.root || ""}${cfg.API_ENDPOINT}?action=${encodeURIComponent(action)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload || {})
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) return fail(data.code || (response.status === 501 ? "NOT_CONFIGURED" : "PROVIDER_UNAVAILABLE"), "http");
      return { ...data, source: "http" };
    } catch {
      return fail("PROVIDER_UNAVAILABLE", "http");
    }
  }

  // Routes a call to the configured adapter for the given service.
  function call(service, action, payload, sandboxImpl) {
    const provider = providerFor(service);
    if (provider === "http") return httpCall(`${service}.${action}`, payload);
    if (provider === "sandbox") return wait(sandboxImpl(payload)).then((result) => ({ ...result, source: "sandbox" }));
    return Promise.resolve(fail("NOT_CONFIGURED", "none"));
  }

  // ---- Sandbox OTP sessions (stand-in for the provider's server-side OTP store) ----
  const OTP_KEY = "wheeltrack_sandbox_otp";
  function otpSessions() {
    try { return JSON.parse(sessionStorage.getItem(OTP_KEY) || "{}"); } catch { return {}; }
  }
  function saveOtpSessions(sessions) {
    try { sessionStorage.setItem(OTP_KEY, JSON.stringify(sessions)); } catch { /* sandbox only */ }
  }
  function otpTimers() {
    return { expiresIn: sandboxCfg.OTP_TTL_SECONDS ?? 300, resendIn: sandboxCfg.RESEND_SECONDS ?? 30 };
  }
  function startOtp(meta) {
    const sessions = otpSessions();
    const referenceId = uid("OTP");
    sessions[referenceId] = { ...meta, sentAt: Date.now(), attempts: 0 };
    saveOtpSessions(sessions);
    return { ok: true, referenceId, ...otpTimers() };
  }
  function resendOtp(referenceId) {
    const sessions = otpSessions();
    const session = sessions[referenceId];
    if (!session) return fail("OTP_EXPIRED");
    if (Date.now() - session.sentAt < (sandboxCfg.RESEND_SECONDS ?? 30) * 1000) return fail("RESEND_TOO_SOON");
    session.sentAt = Date.now();
    session.attempts = 0;
    saveOtpSessions(sessions);
    return { ok: true, referenceId, ...otpTimers() };
  }
  function checkOtp(referenceId, otp) {
    const sessions = otpSessions();
    const session = sessions[referenceId];
    if (!session || Date.now() - session.sentAt > (sandboxCfg.OTP_TTL_SECONDS ?? 300) * 1000) return fail("OTP_EXPIRED");
    if (session.attempts >= (sandboxCfg.MAX_OTP_ATTEMPTS ?? 5)) return fail("TOO_MANY_ATTEMPTS");
    if (!/^\d{6}$/.test(String(otp || ""))) return fail("INVALID_INPUT");
    if (otp !== sandboxCfg.OTP) {
      session.attempts += 1;
      saveOtpSessions(sessions);
      return fail(session.attempts >= (sandboxCfg.MAX_OTP_ATTEMPTS ?? 5) ? "TOO_MANY_ATTEMPTS" : "INVALID_OTP");
    }
    delete sessions[referenceId];
    saveOtpSessions(sessions);
    return { ok: true, session };
  }

  // ---- Validation helpers shared by UI and adapters ----
  // Aadhaar numbers carry a Verhoeff check digit.
  const VD = [[0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],[3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],[6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],[9,8,7,6,5,4,3,2,1,0]];
  const VP = [[0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],[8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],[2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]];
  function isValidAadhaar(value) {
    const digits = String(value || "");
    if (!/^[2-9]\d{11}$/.test(digits)) return false;
    let c = 0;
    digits.split("").reverse().forEach((d, i) => { c = VD[c][VP[i % 8][Number(d)]]; });
    return c === 0;
  }
  function maskAadhaar(last4) {
    return `XXXX XXXX ${last4}`;
  }
  function normalizeDl(value) {
    return String(value || "").toUpperCase().replace(/[\s-]/g, "");
  }
  function isValidDl(value) {
    return /^[A-Z]{2}\d{2}[0-9A-Z]{9,12}$/.test(normalizeDl(value));
  }
  function normalizeTransporterId(value) {
    return String(value || "").toUpperCase().replace(/\s+/g, "");
  }
  function isValidTransporterId(value) {
    return /^[A-Z0-9-]{4,20}$/.test(normalizeTransporterId(value));
  }

  // ---- AuthService ----
  const AuthService = {
    sendLoginOtp({ mobile }) {
      return call("auth", "sendLoginOtp", { mobile }, () => (/^[6-9]\d{9}$/.test(mobile) ? startOtp({ mobile }) : fail("INVALID_INPUT")));
    },
    resendLoginOtp({ referenceId }) {
      return call("auth", "resendLoginOtp", { referenceId }, () => resendOtp(referenceId));
    },
    verifyLoginOtp({ referenceId, otp }) {
      return call("auth", "verifyLoginOtp", { referenceId, otp }, () => {
        const result = checkOtp(referenceId, otp);
        return result.ok ? { ok: true, mobile: result.session.mobile } : result;
      });
    }
  };

  // ---- AadhaarVerificationService ----
  // The full Aadhaar number is only sent to the provider; callers keep the last 4 digits.
  const SANDBOX_AADHAAR_PROFILE = {
    name: "Rajesh Kumar Sharma",
    dob: "1990-05-14",
    gender: "Male",
    careOf: "Suresh Sharma",
    address: { line: "Flat 12, Shivaji Nagar, Near Bus Stand", district: "Pune", state: "Maharashtra", pincode: "411005" }
  };
  const AadhaarVerificationService = {
    isValidAadhaar,
    maskAadhaar,
    sendOtp({ aadhaar, consent }) {
      return call("aadhaar", "sendOtp", { aadhaar, consent }, () => {
        if (!consent) return fail("CONSENT_REQUIRED");
        if (!isValidAadhaar(aadhaar)) return fail("INVALID_INPUT");
        if (aadhaar.startsWith("9999")) return fail("PROVIDER_UNAVAILABLE");
        return { ...startOtp({ last4: aadhaar.slice(-4) }), last4: aadhaar.slice(-4) };
      });
    },
    resendOtp({ referenceId }) {
      return call("aadhaar", "resendOtp", { referenceId }, () => resendOtp(referenceId));
    },
    verifyOtp({ referenceId, otp }) {
      return call("aadhaar", "verifyOtp", { referenceId, otp }, () => {
        const result = checkOtp(referenceId, otp);
        if (!result.ok) return result;
        return { ok: true, last4: result.session.last4, verifiedAt: new Date().toISOString(), profile: SANDBOX_AADHAAR_PROFILE };
      });
    }
  };

  // ---- DrivingLicenceVerificationService ----
  const STATE_CODES = { MH: "Maharashtra", DL: "Delhi", KA: "Karnataka", TN: "Tamil Nadu", GJ: "Gujarat", RJ: "Rajasthan", UP: "Uttar Pradesh", MP: "Madhya Pradesh", HR: "Haryana", PB: "Punjab", WB: "West Bengal", TS: "Telangana", AP: "Andhra Pradesh", KL: "Kerala", BR: "Bihar" };
  const DrivingLicenceVerificationService = {
    normalize: normalizeDl,
    isValid: isValidDl,
    // Returns status: "verified" | "pending" (source unavailable) | "failed".
    verify({ number, dob, expectedName }) {
      return call("drivingLicence", "verify", { number, dob }, () => {
        const dl = normalizeDl(number);
        if (!isValidDl(dl) || !dob) return fail("INVALID_INPUT");
        if (dl.endsWith("0000")) return { ok: true, status: "failed", reason: "NOT_FOUND" };
        if (dl.endsWith("9999")) return { ok: true, status: "pending", reason: "SOURCE_UNAVAILABLE" };
        const year = Number(dl.slice(4, 8)) || 2018;
        const issued = `${year >= 1980 && year <= 2025 ? year : 2018}-03-12`;
        const expiry = `${Number(issued.slice(0, 4)) + 20}-03-11`;
        return {
          ok: true,
          status: "verified",
          licence: {
            number: dl,
            name: expectedName || "Rajesh Kumar Sharma",
            nameMatch: expectedName ? "matched" : "not_checked",
            dob,
            type: "Transport",
            classes: ["LMV", "HGMV", "HPMV"],
            issueDate: issued,
            validTransport: `${Number(issued.slice(0, 4)) + 5}-03-11`,
            validNonTransport: expiry,
            state: STATE_CODES[dl.slice(0, 2)] || dl.slice(0, 2),
            authority: `RTO ${dl.slice(0, 2)}-${dl.slice(2, 4)}`
          }
        };
      });
    }
  };

  // ---- IdentityVerificationService (face match / liveness against the Aadhaar record) ----
  const IdentityVerificationService = {
    runChecks({ aadhaarReference, photoCaptured }) {
      return call("identity", "runChecks", { aadhaarReference, photoCaptured }, () => {
        if (!aadhaarReference || !photoCaptured) return fail("INVALID_INPUT");
        return { ok: true, checks: { identityConfirmation: "passed", liveness: "passed", faceMatch: "passed" }, checkedAt: new Date().toISOString() };
      });
    }
  };

  // ---- TransporterService (Wheeltrack transporter records + driver association requests) ----
  const SANDBOX_TRANSPORTERS = {
    "WTT-10021": { id: "WTT-10021", company: "ABC Logistics Pvt Ltd", contact: "+91 98765 43210", email: "info@abclogistics.com", city: "Mumbai", state: "Maharashtra", fleetSize: 48, since: "2021", verified: true },
    "WTT-10045": { id: "WTT-10045", company: "Shree Ganesh Roadways", contact: "+91 99220 18845", email: "ops@shreeganeshroadways.in", city: "Pune", state: "Maharashtra", fleetSize: 17, since: "2023", verified: true }
  };
  const SANDBOX_VEHICLE = {
    registration: "MH12AB1234", type: "HCV", body: "Container", payload: "16",
    compliance: { rc: "verified", insurance: "verified", puc: "verified", fitness: "verified" }
  };
  const ASSOC_KEY = "wheeltrack_sandbox_associations";
  function associations() {
    try { return JSON.parse(localStorage.getItem(ASSOC_KEY) || "{}"); } catch { return {}; }
  }
  function saveAssociations(all) {
    try { localStorage.setItem(ASSOC_KEY, JSON.stringify(all)); } catch { /* sandbox only */ }
  }
  function maskPhone(phone) {
    const digits = phone.replace(/\D/g, "").slice(-10);
    return `+91 ${digits.slice(0, 2)}XXX XX${digits.slice(-3)}`;
  }
  const TransporterService = {
    normalizeId: normalizeTransporterId,
    isValidId: isValidTransporterId,
    lookup({ transporterId }) {
      return call("transporter", "lookup", { transporterId }, () => {
        const id = normalizeTransporterId(transporterId);
        if (!isValidTransporterId(id)) return fail("INVALID_INPUT");
        const match = SANDBOX_TRANSPORTERS[id];
        if (match) return { ok: true, transporter: { ...match, contact: maskPhone(match.contact) } };
        // Companies registered through Transporter / Shipper Registration can be linked once Wheeltrack approves them.
        const company = companies()[id];
        if (!company || company.status !== "approved") return fail("NOT_FOUND");
        return { ok: true, transporter: { id, company: company.legalName, contact: maskPhone(company.contact), email: company.email, city: company.city, state: company.state, fleetSize: company.fleet || 0, since: company.approvedAt.slice(0, 4), verified: true } };
      });
    },
    // Idempotent: the same driver + transporter pair always maps to one request.
    // driver: read-only summary shown to the transporter (they can never edit driver identity data).
    requestAssociation({ driverId, transporterId, driver }) {
      return call("transporter", "requestAssociation", { driverId, transporterId, driver }, () => {
        const all = associations();
        const existing = Object.values(all).find((r) => r.driverId === driverId && r.transporterId === transporterId && !["withdrawn", "rejected", "removed"].includes(r.status));
        if (existing) return { ok: true, requestId: existing.requestId, status: existing.status, createdAt: existing.createdAt };
        const record = { requestId: uid("REQ"), driverId, transporterId, driver: driver || null, status: "pending", createdAt: new Date().toISOString() };
        all[record.requestId] = record;
        saveAssociations(all);
        return { ok: true, requestId: record.requestId, status: record.status, createdAt: record.createdAt };
      });
    },
    getAssociationStatus({ requestId }) {
      return call("transporter", "getAssociationStatus", { requestId }, () => {
        const all = associations();
        const record = all[requestId];
        if (!record) return fail("NOT_FOUND");
        // Only the built-in sandbox transporters answer on a timer. Registered companies decide from their dashboard.
        const due = Date.parse(record.createdAt) + (sandboxCfg.TRANSPORTER_APPROVAL_SECONDS ?? 20) * 1000;
        if (SANDBOX_TRANSPORTERS[record.transporterId] && record.status === "pending" && Date.now() >= due) {
          record.status = "approved";
          record.decidedAt = new Date(due).toISOString();
          record.vehicle = SANDBOX_VEHICLE;
          saveAssociations(all);
        }
        return { ok: true, requestId, status: record.status, decidedAt: record.decidedAt || "", reason: record.reason || "", vehicle: record.vehicle || null };
      });
    },
    // ---- Transporter side ----
    listAssociations({ transporterId }) {
      return call("transporter", "listAssociations", { transporterId }, () => ({
        ok: true,
        requests: Object.values(associations()).filter((r) => r.transporterId === transporterId && r.status !== "withdrawn").sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      }));
    },
    // decision: "approved" | "rejected" (reason required) | "removed" (approved association deactivated, reason required).
    decideAssociation({ transporterId, requestId, decision, reason }) {
      return call("transporter", "decideAssociation", { transporterId, requestId, decision, reason }, () => {
        const all = associations();
        const record = all[requestId];
        if (!record || record.transporterId !== transporterId) return fail("NOT_FOUND");
        const allowed = { pending: ["approved", "rejected"], approved: ["removed"] }[record.status] || [];
        if (!allowed.includes(decision)) return fail("INVALID_STATE");
        if (decision !== "approved" && !String(reason || "").trim()) return fail("INVALID_INPUT");
        Object.assign(record, { status: decision, reason: decision === "approved" ? "" : reason.trim(), decidedAt: new Date().toISOString() });
        // Approval never assigns a vehicle; removal also ends any assignment.
        if (decision === "removed") record.vehicle = null;
        saveAssociations(all);
        return { ok: true, request: record };
      });
    },
    // Assigning is a separate operation after approval. vehicle: null removes the assignment.
    assignVehicle({ transporterId, requestId, vehicle }) {
      return call("transporter", "assignVehicle", { transporterId, requestId, vehicle }, () => {
        const all = associations();
        const record = all[requestId];
        if (!record || record.transporterId !== transporterId) return fail("NOT_FOUND");
        if (record.status !== "approved") return fail("INVALID_STATE");
        if (vehicle && Object.values(all).some((r) => r.requestId !== requestId && r.transporterId === transporterId && r.status === "approved" && r.vehicle && r.vehicle.registration === vehicle.registration)) return fail("VEHICLE_IN_USE");
        record.vehicle = vehicle || null;
        saveAssociations(all);
        return { ok: true, request: record };
      });
    },
    withdrawAssociation({ requestId }) {
      return call("transporter", "withdrawAssociation", { requestId }, () => {
        const all = associations();
        if (all[requestId]) all[requestId].status = "withdrawn";
        saveAssociations(all);
        return { ok: true };
      });
    }
  };

  // ---- Transporter / Shipper company registration ----
  // Sandbox registry of submitted companies (stand-in for the companies + registration_requests tables).
  const COMPANY_KEY = "wheeltrack_sandbox_companies";
  function companies() {
    try { return JSON.parse(localStorage.getItem(COMPANY_KEY) || "{}"); } catch { return {}; }
  }
  function saveCompanies(all) {
    try { localStorage.setItem(COMPANY_KEY, JSON.stringify(all)); } catch { /* sandbox only */ }
  }
  const PAN_RE = /^[A-Z]{5}\d{4}[A-Z]$/;
  const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
  const CIN_RE = /^[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/;
  const LLPIN_RE = /^[A-Z]{3}-\d{4}$/;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function normalizeCode(value) {
    return String(value || "").toUpperCase().replace(/\s+/g, "");
  }
  // PAN 4th character → holder type (Income Tax Department convention).
  const PAN_HOLDER = { C: "Company", F: "Firm / LLP", P: "Individual", H: "HUF", A: "Association of Persons", T: "Trust", B: "Body of Individuals", G: "Government", L: "Local Authority", J: "Artificial Juridical Person" };
  const GST_STATES = { "27": "Maharashtra", "07": "Delhi", "29": "Karnataka", "33": "Tamil Nadu", "24": "Gujarat", "08": "Rajasthan", "09": "Uttar Pradesh", "23": "Madhya Pradesh", "06": "Haryana", "03": "Punjab", "19": "West Bengal", "36": "Telangana", "37": "Andhra Pradesh", "32": "Kerala", "10": "Bihar" };
  // Sandbox outcomes are driven by the number: digits 0000 → not found, 9999 → provider unavailable.
  function sandboxOutcome(code) {
    if (/0000/.test(code)) return { ok: true, status: "failed", reason: "NOT_FOUND" };
    if (/9999/.test(code)) return fail("PROVIDER_UNAVAILABLE");
    return null;
  }

  const CompanyAccountService = {
    isValidEmail: (value) => EMAIL_RE.test(String(value || "").trim()),
    // Duplicate mobile / email check against registered companies. ownId excludes the caller's own record.
    checkAvailability({ mobile, email, ownId }) {
      return call("companyAccount", "checkAvailability", { mobile, email }, () => {
        const others = Object.values(companies()).filter((c) => c.transporterId !== ownId);
        return { ok: true, mobileTaken: Boolean(mobile) && others.some((c) => c.accountMobile === mobile), emailTaken: Boolean(email) && others.some((c) => c.accountEmail === String(email).toLowerCase()) };
      });
    },
    // channel: "mobile" | "email". A verified contact never proves the business itself is verified.
    sendOtp({ channel, target }) {
      return call("companyAccount", "sendOtp", { channel, target }, () => {
        if (channel === "mobile" && !/^[6-9]\d{9}$/.test(target)) return fail("INVALID_INPUT");
        if (channel === "email" && !EMAIL_RE.test(target)) return fail("INVALID_INPUT");
        return startOtp({ channel, target });
      });
    },
    resendOtp({ referenceId }) {
      return call("companyAccount", "resendOtp", { referenceId }, () => resendOtp(referenceId));
    },
    verifyOtp({ referenceId, otp }) {
      return call("companyAccount", "verifyOtp", { referenceId, otp }, () => {
        const result = checkOtp(referenceId, otp);
        return result.ok ? { ok: true, channel: result.session.channel, target: result.session.target } : result;
      });
    }
  };

  // Every result returns status: "verified" | "failed"; PROVIDER_UNAVAILABLE comes back as { ok: false }.
  const BusinessKycService = {
    normalize: normalizeCode,
    isValidPan: (v) => PAN_RE.test(normalizeCode(v)),
    isValidGstin: (v) => GSTIN_RE.test(normalizeCode(v)),
    isValidCin: (v) => CIN_RE.test(normalizeCode(v)),
    isValidLlpin: (v) => LLPIN_RE.test(normalizeCode(v)),
    panHolderType: (v) => PAN_HOLDER[normalizeCode(v)[3]] || "",
    verifyPan({ pan, name }) {
      return call("businessKyc", "verifyPan", { pan, name }, () => {
        const value = normalizeCode(pan);
        if (!PAN_RE.test(value)) return fail("INVALID_INPUT");
        const outcome = sandboxOutcome(value);
        if (outcome) return outcome;
        return { ok: true, status: "verified", result: { pan: value, name: String(name || "").toUpperCase(), holderType: PAN_HOLDER[value[3]] || "Other", panStatus: "Active", nameMatch: "matched" } };
      });
    },
    verifyGstin({ gstin, pan, name, address }) {
      return call("businessKyc", "verifyGstin", { gstin, pan }, () => {
        const value = normalizeCode(gstin);
        if (!GSTIN_RE.test(value)) return fail("INVALID_INPUT");
        const outcome = sandboxOutcome(value);
        if (outcome) return outcome;
        return { ok: true, status: "verified", result: { gstin: value, legalName: String(name || "").toUpperCase(), gstStatus: "Active", registeredAddress: address || "", state: GST_STATES[value.slice(0, 2)] || `State code ${value.slice(0, 2)}`, panMatch: value.slice(2, 12) === normalizeCode(pan) ? "matched" : "mismatch", registrationDate: "2019-07-01" } };
      });
    },
    // number: CIN (companies) or LLPIN (LLPs).
    verifyCin({ number, name }) {
      return call("businessKyc", "verifyCin", { number, name }, () => {
        const value = normalizeCode(number);
        const isLlp = LLPIN_RE.test(value);
        if (!CIN_RE.test(value) && !isLlp) return fail("INVALID_INPUT");
        const outcome = sandboxOutcome(value);
        if (outcome) return outcome;
        return { ok: true, status: "verified", result: { number: value, companyName: String(name || "").toUpperCase(), incorporationStatus: "Active", incorporatedOn: isLlp ? "2016-04-01" : `${value.slice(8, 12)}-04-01`, registrar: isLlp ? "Registrar of Companies" : `RoC-${value.slice(6, 8)}` } };
      });
    }
  };

  function companyIdFor(all) {
    let id;
    do { id = `WTT-${String(Math.floor(20000 + Math.random() * 79999))}`; } while (all[id] || SANDBOX_TRANSPORTERS[id]);
    return id;
  }
  const CompanyRegistrationService = {
    // Creates the registration once; a resubmission keeps the same Transporter ID and Request ID.
    submit({ transporterId, snapshot }) {
      return call("companyRegistration", "submit", { transporterId, snapshot }, () => {
        const all = companies();
        const own = transporterId && all[transporterId];
        const others = Object.values(all).filter((c) => c.transporterId !== transporterId && c.status !== "rejected");
        const s = snapshot;
        const dup = [["pan", s.kyc.pan], ["gstin", s.kyc.gstin], ["accountMobile", s.account.mobile], ["accountEmail", s.account.email]]
          .find(([key, value]) => value && others.some((c) => c[key] === value));
        if (dup) return { ok: false, code: "DUPLICATE", field: dup[0] };
        if (own && !["info_required", "rejected"].includes(own.status)) return { ok: true, transporterId: own.transporterId, requestId: own.requestId, status: own.status, submittedAt: own.submittedAt, version: own.version, duplicate: true };
        const now = new Date().toISOString();
        const id = own ? own.transporterId : companyIdFor(all);
        const record = {
          ...(own || {}),
          transporterId: id,
          requestId: own ? own.requestId : uid("REG"),
          version: own ? own.version + 1 : 1,
          legalName: s.details.legalName, contact: s.details.contact, email: s.details.email, city: s.details.city, state: s.details.state, fleet: s.details.fleet,
          accountMobile: s.account.mobile, accountEmail: s.account.email, pan: s.kyc.pan, gstin: s.kyc.gstin,
          status: "pending_review", stage: "company", remarks: "", pendingRequirements: [], rejectedDocuments: [],
          submittedAt: own ? own.submittedAt : now, resubmittedAt: own ? now : "", updatedAt: now,
          history: [...((own && own.history) || []), { at: now, event: own ? "resubmitted" : "submitted", by: "applicant" }],
          snapshot: s
        };
        all[id] = record;
        saveCompanies(all);
        return { ok: true, transporterId: id, requestId: record.requestId, status: record.status, submittedAt: record.submittedAt, version: record.version };
      });
    },
    getStatus({ transporterId }) {
      return call("companyRegistration", "getStatus", { transporterId }, () => {
        const record = companies()[transporterId];
        if (!record) return fail("NOT_FOUND");
        const { snapshot, ...status } = record;
        return { ok: true, registration: status };
      });
    },
    // Wheeltrack admin review. In production this happens in the admin console with server-side checks;
    // the sandbox exposes it so the full flow can be tested. decision: "approved" | "rejected" | "info_required".
    adminDecision({ transporterId, decision, remarks, pendingRequirements, rejectedDocuments }) {
      return call("companyRegistration", "adminDecision", { transporterId, decision }, () => {
        const all = companies();
        const record = all[transporterId];
        if (!record) return fail("NOT_FOUND");
        if (record.status !== "pending_review") return fail("INVALID_STATE");
        if (decision !== "approved" && !String(remarks || "").trim()) return fail("INVALID_INPUT");
        const now = new Date().toISOString();
        Object.assign(record, {
          status: decision, remarks: (remarks || "").trim(), updatedAt: now,
          stage: decision === "approved" ? "done" : record.stage,
          pendingRequirements: decision === "info_required" ? pendingRequirements || [] : [],
          rejectedDocuments: decision === "info_required" ? rejectedDocuments || [] : [],
          approvedAt: decision === "approved" ? now : record.approvedAt || ""
        });
        record.history.push({ at: now, event: decision, by: "Wheeltrack Admin", remarks: record.remarks });
        saveCompanies(all);
        const { snapshot, ...status } = record;
        return { ok: true, registration: status };
      });
    },
    // Sandbox: lets the admin review move through the stages one at a time.
    adminAdvance({ transporterId }) {
      return call("companyRegistration", "adminAdvance", { transporterId }, () => {
        const all = companies();
        const record = all[transporterId];
        if (!record || record.status !== "pending_review") return fail("INVALID_STATE");
        const order = ["company", "kyc", "representative", "documents", "final"];
        const next = order[Math.min(order.indexOf(record.stage) + 1, order.length - 1)];
        Object.assign(record, { stage: next, updatedAt: new Date().toISOString() });
        saveCompanies(all);
        const { snapshot, ...status } = record;
        return { ok: true, registration: status };
      });
    }
  };

  // ---- Vehicle verification (RC / insurance / PUC / fitness) ----
  const VehicleVerificationService = {
    verifyRc({ registration }) {
      return call("vehicle", "verifyRc", { registration }, () => {
        const reg = normalizeCode(registration);
        if (!/^[A-Z]{2}\d{1,2}[A-Z]{0,3}\d{1,4}$/.test(reg)) return fail("INVALID_INPUT");
        if (reg.endsWith("0000")) return { ok: true, status: "failed", reason: "NOT_FOUND" };
        if (reg.endsWith("9999")) return fail("PROVIDER_UNAVAILABLE");
        return { ok: true, status: "verified", result: { registration: reg, type: "HCV", body: "Container", bodyLength: "32 ft", payload: "16", owner: "Registered owner on RC", fitnessUpto: "2028-03-31" } };
      });
    },
    // kind: insurance | puc | fitness. Numbers ending 0000 fail, 9999 → provider unavailable.
    verifyDocument({ kind, number }) {
      return call("vehicle", "verifyDocument", { kind, number }, () => {
        const value = normalizeCode(number);
        if (!value) return fail("INVALID_INPUT");
        if (value.endsWith("0000")) return { ok: true, status: "failed", reason: "NOT_FOUND" };
        if (value.endsWith("9999")) return fail("PROVIDER_UNAVAILABLE");
        return { ok: true, status: "verified", result: { kind, number: value } };
      });
    }
  };

  window.WheeltrackServices = {
    providerFor,
    AuthService,
    AadhaarVerificationService,
    DrivingLicenceVerificationService,
    IdentityVerificationService,
    TransporterService,
    CompanyAccountService,
    BusinessKycService,
    CompanyRegistrationService,
    VehicleVerificationService
  };
})();
