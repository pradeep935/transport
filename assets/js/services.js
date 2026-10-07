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
 *              NOT_FOUND, NOT_CONFIGURED, PROVIDER_UNAVAILABLE.
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
        return match ? { ok: true, transporter: { ...match, contact: maskPhone(match.contact) } } : fail("NOT_FOUND");
      });
    },
    // Idempotent: the same driver + transporter pair always maps to one request.
    requestAssociation({ driverId, transporterId }) {
      return call("transporter", "requestAssociation", { driverId, transporterId }, () => {
        const all = associations();
        const existing = Object.values(all).find((r) => r.driverId === driverId && r.transporterId === transporterId && r.status !== "withdrawn");
        if (existing) return { ok: true, requestId: existing.requestId, status: existing.status, createdAt: existing.createdAt };
        const record = { requestId: uid("REQ"), driverId, transporterId, status: "pending", createdAt: new Date().toISOString() };
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
        const due = Date.parse(record.createdAt) + (sandboxCfg.TRANSPORTER_APPROVAL_SECONDS ?? 20) * 1000;
        if (record.status === "pending" && Date.now() >= due) {
          record.status = "approved";
          record.decidedAt = new Date(due).toISOString();
          record.vehicle = SANDBOX_VEHICLE;
          saveAssociations(all);
        }
        return { ok: true, requestId, status: record.status, decidedAt: record.decidedAt || "", vehicle: record.vehicle || null };
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

  window.WheeltrackServices = {
    providerFor,
    AuthService,
    AadhaarVerificationService,
    DrivingLicenceVerificationService,
    IdentityVerificationService,
    TransporterService
  };
})();
