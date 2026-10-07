(function () {
  const KEY = "wheeltrack_registration";
  const defaults = {
    selectedProfile: "",
    businessPartnerExpanded: false,
    mobile: { code: "+91", number: "", language: "English", otp: "", verified: false },
    email: { address: "", otp: "", verified: false },
    password: { value: "", confirm: "" },
    consent: { terms: false, privacy: false, communication: false },
    personal: { first: "", middle: "", last: "", photo: "", photoCapturedAt: "", dob: "", gender: "", father: "", current: "", permanent: "", sameAddress: false, permanentSame: false, state: "", city: "", pincode: "", currentState: "", currentCity: "", currentPincode: "", emergencyName: "", emergencyNumber: "", language: "English" },
    // Only the last 4 Aadhaar digits are ever persisted.
    aadhaar: { method: "aadhaar", status: "idle", failedReason: "", consent: false, referenceId: "", last4: "", sentAt: 0, expiresIn: 0, resendIn: 0, verifiedAt: "", source: "", profile: null },
    kyc: { document: "", selfie: "", status: "pending", checkedAt: "", source: "" },
    dl: { number: "", dob: "", state: "", document: "", front: "", back: "", status: "unverified", result: null, checkedAt: "", source: "", method: "online", manualStatus: "draft", manualSubmittedAt: "", manual: { name: "", type: "", issueDate: "", validTransport: "", validNonTransport: "", expiry: "", state: "", authority: "", classes: "" } },
    operatingModel: "",
    vehicle: { registration: "", type: "Pickup", body: "", bodyLength: "", bedLength: "", bedHeight: "", bedWidth: "", payload: "", cargo: "", area: "", availability: "Available" },
    documents: { rc: "pending", insurance: "pending", puc: "pending", fitness: "pending" },
    insurance: { company: "", policy: "", from: "", upto: "", upload: "" },
    puc: { number: "", from: "", upto: "", upload: "" },
    fitness: { certificate: "", valid: "", permit: "", permitValid: "", upload: "" },
    driverId: "",
    // Driver ↔ transporter relationship. One record per driver; a new transporter withdraws the previous request.
    transporter: { query: "", id: "", match: null, confirmed: false, requestId: "", association: "none", submission: "draft", submittedAt: "", decidedAt: "", lastCheckedAt: "", vehicle: null, source: "" },
    approvalState: "Draft",
    finalApproved: false,
    uploads: {},
    progress: {},
    login: { user: "", password: "", method: "otp", mobile: "", referenceId: "", sentAt: 0, expiresIn: 0, resendIn: 0 },
    forgot: { user: "", otp: "", password: "", confirm: "" },
    devLoading: false
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function merge(base, patch) {
    const out = Array.isArray(base) ? base.slice() : { ...base };
    Object.keys(patch || {}).forEach((key) => {
      if (patch[key] && typeof patch[key] === "object" && !Array.isArray(patch[key]) && base[key] && typeof base[key] === "object") {
        out[key] = merge(base[key], patch[key]);
      } else {
        out[key] = patch[key];
      }
    });
    return out;
  }

  function load() {
    try {
      return merge(defaults, JSON.parse(localStorage.getItem(KEY) || "{}"));
    } catch {
      return clone(defaults);
    }
  }

  function save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function getByPath(state, path) {
    return path.split(".").reduce((target, key) => target && target[key], state);
  }

  function setByPath(state, path, value) {
    const parts = path.split(".");
    let target = state;
    for (let i = 0; i < parts.length - 1; i += 1) target = target[parts[i]];
    target[parts[parts.length - 1]] = value;
    // Permanent address comes from Aadhaar; current address mirrors it while the driver lives there.
    if (path === "personal.sameAddress") state.personal.current = value ? state.personal.permanent : "";
    // Manual entry: permanent address can mirror the typed current address.
    if (path === "personal.permanentSame" && value) state.personal.permanent = state.personal.current;
    if (path === "personal.current" && state.personal.permanentSame) state.personal.permanent = value;
    save(state);
  }

  window.WheeltrackState = { KEY, defaults, clone, merge, load, save, getByPath, setByPath };
})();
