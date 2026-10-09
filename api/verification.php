<?php
/*
 * Wheeltrack verification gateway (used when WHEELTRACK_CONFIG.PROVIDERS.<service> is "http").
 *
 * The browser only ever calls this endpoint. Provider endpoints and credentials must be read here from
 * server-side environment variables (e.g. AADHAAR_PROVIDER_URL / AADHAAR_PROVIDER_KEY) and never shipped
 * to frontend JavaScript or HTML.
 *
 * No Aadhaar / Driving Licence / OTP / PAN / GSTIN / CIN / RC provider has been selected yet, so every action answers
 * 501 NOT_CONFIGURED. Once the client approves a provider, implement each action below against it and
 * return the response shapes documented in assets/js/services.js.
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'code' => 'METHOD_NOT_ALLOWED']);
    exit;
}

$actions = [
    'auth.sendLoginOtp',
    'auth.resendLoginOtp',
    'auth.verifyLoginOtp',
    'aadhaar.sendOtp',
    'aadhaar.resendOtp',
    'aadhaar.verifyOtp',
    'drivingLicence.verify',
    'identity.runChecks',
    'transporter.lookup',
    'transporter.requestAssociation',
    'transporter.getAssociationStatus',
    'transporter.withdrawAssociation',
    // Transporter side of driver associations (must check the caller's company + "drivers"/"assignments" permission).
    'transporter.listAssociations',
    'transporter.decideAssociation',
    'transporter.assignVehicle',
    // Transporter / Shipper company registration.
    'companyAccount.checkAvailability',
    'companyAccount.sendOtp',
    'companyAccount.resendOtp',
    'companyAccount.verifyOtp',
    'businessKyc.verifyPan',
    'businessKyc.verifyGstin',
    'businessKyc.verifyCin',
    'companyRegistration.submit',
    'companyRegistration.getStatus',
    // Admin-console only: must require a Wheeltrack reviewer session, never an applicant session.
    'companyRegistration.adminDecision',
    'companyRegistration.adminAdvance',
    'vehicle.verifyRc',
    'vehicle.verifyDocument',
];

$action = $_GET['action'] ?? '';
if (!in_array($action, $actions, true)) {
    http_response_code(404);
    echo json_encode(['ok' => false, 'code' => 'UNKNOWN_ACTION']);
    exit;
}

http_response_code(501);
echo json_encode(['ok' => false, 'code' => 'NOT_CONFIGURED', 'action' => $action]);
