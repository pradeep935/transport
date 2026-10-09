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
    transporter: "sandbox",
    companyAccount: "sandbox",
    businessKyc: "sandbox",
    companyRegistration: "sandbox",
    vehicle: "sandbox"
  },
  API_ENDPOINT: "api/verification.php",

  /*
   * Sandbox behaviour (test data only):
   *   OTP for login and Aadhaar: SANDBOX.OTP
   *   Aadhaar 2345 6789 0124 → verified profile; any valid Aadhaar starting 9999 → service unavailable (manual entry)
   *   Driving licence number ending in 0000 → failed, ending in 9999 → source unavailable (pending), otherwise verified
   *   Transporter IDs: WTT-10021, WTT-10045 (any other ID → not found)
   *   Transporter approves an association request TRANSPORTER_APPROVAL_SECONDS after it is sent
   *     (built-in sandbox transporters only; registered companies approve from their dashboard)
   *   Company mobile / email OTP: SANDBOX.OTP
   *   PAN / GSTIN / CIN / vehicle numbers containing 0000 → not found (failed), 9999 → provider unavailable
   *   Company registrations are decided with the sandbox admin panel on the Approval page (no auto-approval)
   */
  SANDBOX: {
    OTP: "123456",
    OTP_TTL_SECONDS: 300,
    RESEND_SECONDS: 30,
    MAX_OTP_ATTEMPTS: 5,
    LATENCY_MS: 700,
    TRANSPORTER_APPROVAL_SECONDS: 20
  },

  /*
   * Transporter / Shipper registration rules. Client-confirmed items are mandatory.
   * Entries marked recommended: true are Wheeltrack recommendations awaiting client approval;
   * switch COMPANY_RECOMMENDATIONS off to hide every one of them.
   */
  COMPANY_RECOMMENDATIONS: true,
  COMPANY_TYPES: ["Private Limited", "Public Limited", "LLP", "Partnership", "Proprietorship", "Other"],
  // Which Business KYC checks each company type needs: required | optional | na.
  COMPANY_KYC_RULES: {
    "Private Limited": { pan: "required", gstin: "required", cin: "required" },
    "Public Limited": { pan: "required", gstin: "required", cin: "required" },
    LLP: { pan: "required", gstin: "required", cin: "required" },
    Partnership: { pan: "required", gstin: "required", cin: "na" },
    Proprietorship: { pan: "required", gstin: "optional", cin: "na" },
    Other: { pan: "required", gstin: "optional", cin: "optional" }
  },
  /*
   * Company document checklist. need: "required" for every type, an array of company types that require it,
   * or "optional". expiry: the document carries a validity date.
   */
  COMPANY_DOCUMENTS: [
    { key: "pan", label: "Company PAN Card", need: "required" },
    { key: "gst", label: "GST Registration Certificate", need: ["Private Limited", "Public Limited", "LLP", "Partnership"] },
    { key: "incorporation", label: "Incorporation Certificate", need: ["Private Limited", "Public Limited", "LLP"] },
    { key: "udyam", label: "Udyam Registration", need: "optional" },
    { key: "addressProof", label: "Business Address Proof", need: "required", expiry: true },
    { key: "authorizedProof", label: "Authorized Person Proof", need: "required" },
    { key: "bankProof", label: "Company Bank Statement / Business Proof", need: ["Partnership", "Proprietorship", "Other"] },
    { key: "partnershipDeed", label: "Partnership Deed", need: ["Partnership"], recommended: true },
    { key: "boardResolution", label: "Board Resolution / LLP Authorization", need: "optional", recommended: true }
  ],
  // Client-side checks only; the server must enforce its own file type, size and malware rules.
  UPLOAD: { TYPES: ["application/pdf", "image/jpeg", "image/png"], MAX_MB: 5 }
};
