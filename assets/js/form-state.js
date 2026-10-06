(function () {
  const KEY = "wheeltrack_registration";
  const defaults = {
    selectedProfile: "",
    businessPartnerExpanded: false,
    mobile: { code: "+91", number: "", language: "English", otp: "", verified: false },
    email: { address: "", otp: "", verified: false },
    password: { value: "", confirm: "" },
    consent: { terms: false, privacy: false, communication: false },
    personal: { first: "", middle: "", last: "", photo: "", dob: "", gender: "", father: "", current: "", permanent: "", sameAddress: false, state: "", city: "", pincode: "", emergencyName: "", emergencyNumber: "", language: "English" },
    kyc: { document: "", selfie: "", status: "pending" },
    dl: { number: "", dob: "", state: "", document: "", front: "", back: "", status: "pending" },
    operatingModel: "",
    vehicle: { registration: "", type: "Pickup", body: "", bodyLength: "", bedLength: "", bedHeight: "", bedWidth: "", payload: "", cargo: "", area: "", availability: "Available" },
    documents: { rc: "pending", insurance: "pending", puc: "pending", fitness: "pending" },
    insurance: { company: "", policy: "", from: "", upto: "", upload: "" },
    puc: { number: "", from: "", upto: "", upload: "" },
    fitness: { certificate: "", valid: "", permit: "", permitValid: "", upload: "" },
    transporter: { id: "", found: false, requested: false, approval: "Pending Transporter Approval", vehicleAssigned: false },
    approvalState: "Draft",
    finalApproved: false,
    uploads: {},
    progress: {},
    login: { user: "", password: "" },
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
    if (path === "personal.sameAddress" && value) state.personal.permanent = state.personal.current;
    if (path === "personal.current" && state.personal.sameAddress) state.personal.permanent = value;
    save(state);
  }

  window.WheeltrackState = { KEY, defaults, clone, merge, load, save, getByPath, setByPath };
})();
