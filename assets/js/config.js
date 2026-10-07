window.WHEELTRACK_CONFIG = {
  BUSINESS_PHONE: "+18005550199",
  DEMO_MOBILE_OTP: "123456",
  DEMO_EMAIL_OTP: "654321",
  // Prototype only: enables the sandbox RC / owner-document checks that are not integrated yet. Set to false for production.
  PROTOTYPE_MODE: true,
  // Driving Licence step: Continue unlocks only after online verification or a completed manual-verification submission.
  ENFORCE_DL_GATE: true,
  // Personal Details step: when true, Continue unlocks only after Aadhaar verification, live profile photo and required fields.
  ENFORCE_PERSONAL_GATE: true,

  /*
   * Verification providers (see assets/js/services.js).
   *   "sandbox" – in-browser test adapter. Results are clearly labelled as sandbox data in the UI.
   *   "http"    – calls the server gateway (api/verification.php), which holds provider credentials.
   *   "none"    – provider not configured; the UI shows a "service not connected" state.
   * No real Aadhaar / Driving Licence provider has been selected yet. Never put provider keys in this file.
   */
  PROVIDERS: {
    auth: "sandbox",
    aadhaar: "sandbox",
    drivingLicence: "sandbox",
    identity: "sandbox",
    transporter: "sandbox"
  },
  API_ENDPOINT: "api/verification.php",

  /*
   * Sandbox behaviour (test data only):
   *   OTP for login and Aadhaar: SANDBOX.OTP
   *   Aadhaar 2345 6789 0124 → verified profile; any valid Aadhaar starting 9999 → service unavailable (manual entry)
   *   Driving licence number ending in 0000 → failed, ending in 9999 → source unavailable (pending), otherwise verified
   *   Transporter IDs: WTT-10021, WTT-10045 (any other ID → not found)
   *   Transporter approves an association request TRANSPORTER_APPROVAL_SECONDS after it is sent
   */
  SANDBOX: {
    OTP: "123456",
    OTP_TTL_SECONDS: 300,
    RESEND_SECONDS: 30,
    MAX_OTP_ATTEMPTS: 5,
    LATENCY_MS: 700,
    TRANSPORTER_APPROVAL_SECONDS: 20
  }
};
