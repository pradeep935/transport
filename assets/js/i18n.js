/*
 * Wheeltrack prototype – central UI translations (English → Hindi).
 * Only application UI strings are listed here. User data (names, numbers, addresses,
 * registration/licence numbers, IDs, API values) is never translated because it is
 * never an exact match for these keys.
 */
(function () {
  const HI = {
    // Common actions
    "Back": "वापस",
    "Continue": "जारी रखें",
    "Call Us": "कॉल करें",
    "Upload": "अपलोड करें",
    "Replace": "बदलें",
    "Edit": "संपादित करें",
    "Verify": "सत्यापित करें",
    "Send OTP": "OTP भेजें",
    "Sending OTP…": "OTP भेजा जा रहा है…",
    "Verify & Continue": "सत्यापित करें और जारी रखें",
    "Verifying…": "सत्यापित किया जा रहा है…",
    "Go to Dashboard": "डैशबोर्ड पर जाएँ",
    "Go to Review": "समीक्षा पर जाएँ",
    "Submit for Review": "समीक्षा के लिए जमा करें",
    "Submit for Approval": "स्वीकृति के लिए जमा करें",
    "Submit Registration": "रजिस्ट्रेशन जमा करें",
    "Select": "चुनें",
    "Show password": "पासवर्ड दिखाएँ",
    "Hide password": "पासवर्ड छिपाएँ",
    "Wheeltrack home": "Wheeltrack होम",
    "Smarter tracking. Safer roads.": "स्मार्ट ट्रैकिंग। सुरक्षित सड़कें।",

    // Statuses
    "Pending": "लंबित",
    "Completed": "पूर्ण",
    "Completed / current": "पूर्ण / वर्तमान",
    "Verified": "सत्यापित",
    "Passed": "पास",
    "Ready": "तैयार",
    "Valid": "मान्य",
    "Active": "सक्रिय",
    "Uploaded": "अपलोड हो गया",
    "Pending verification": "सत्यापन लंबित",
    "Pending Verification": "सत्यापन लंबित",
    "DL Verified": "DL सत्यापित",
    "Draft": "ड्राफ़्ट",
    "Submitted": "जमा किया गया",
    "Under Review": "समीक्षा में",
    "Document Rejected / Re-upload Required": "दस्तावेज़ अस्वीकृत / दोबारा अपलोड आवश्यक",
    "Inactive/Suspended": "निष्क्रिय / निलंबित",
    "Approved": "स्वीकृत",
    "APPROVED": "स्वीकृत",
    "Read Only": "केवल पढ़ने योग्य",
    "Read-only": "केवल पढ़ने योग्य",
    "Recommended": "अनुशंसित",
    "Optional if API verified": "API सत्यापन होने पर वैकल्पिक",
    "From RC": "RC से",
    "Fetched after verification": "सत्यापन के बाद प्राप्त होगा",
    "Prototype only": "केवल प्रोटोटाइप",
    "Getting started": "शुरुआत",
    "Exception Review": "अपवाद समीक्षा",

    // Sidebar / layout
    "Driver Onboarding": "ड्राइवर ऑनबोर्डिंग",
    "Owner Driver": "मालिक ड्राइवर",
    "Let's get you": "आइए आपको तैयार करें",
    "road-ready.": "सड़क के लिए तैयार।",
    "Get your vehicle": "अपने वाहन को करें",
    "Driver registration progress": "ड्राइवर रजिस्ट्रेशन की प्रगति",
    "Owner driver onboarding progress": "मालिक ड्राइवर ऑनबोर्डिंग की प्रगति",
    "Preferred language (required)": "पसंदीदा भाषा (आवश्यक)",
    "Mobile": "मोबाइल",
    "Verify phone number": "फ़ोन नंबर सत्यापित करें",
    "Email": "ईमेल",
    "Verify email address": "ईमेल पता सत्यापित करें",
    "Password": "पासवर्ड",
    "Secure your account": "अपना खाता सुरक्षित करें",
    "Consent": "सहमति",
    "Terms & preferences": "नियम और प्राथमिकताएँ",
    "Personal Details": "व्यक्तिगत विवरण",
    "Your basic information": "आपकी बुनियादी जानकारी",
    "Identity Verification": "पहचान सत्यापन",
    "KYC & selfie checks": "KYC और सेल्फ़ी जाँच",
    "Driving Licence": "ड्राइविंग लाइसेंस",
    "Licence verification": "लाइसेंस सत्यापन",
    "Operating Model": "संचालन मॉडल",
    "Operating model": "संचालन मॉडल",
    "How you operate": "आप कैसे काम करते हैं",
    "Vehicle Registration": "वाहन रजिस्ट्रेशन",
    "Enter registration number": "रजिस्ट्रेशन नंबर दर्ज करें",
    "RC Verification": "RC सत्यापन",
    "Vehicle details from RC": "RC से वाहन विवरण",
    "Insurance Verification": "बीमा सत्यापन",
    "Policy & document": "पॉलिसी और दस्तावेज़",
    "PUC Verification": "PUC सत्यापन",
    "Pollution certificate": "प्रदूषण प्रमाणपत्र",
    "Fitness / Permit": "फ़िटनेस / परमिट",
    "Where applicable": "जहाँ लागू हो",
    "Compliance Check": "अनुपालन जाँच",
    "Automated checks": "स्वचालित जाँच",
    "Wheeltrack review": "Wheeltrack समीक्षा",
    "Ready to start": "शुरू करने के लिए तैयार",

    // Mobile
    "Verify your mobile number": "अपना मोबाइल नंबर सत्यापित करें",
    "We'll send a one-time password to verify your number.": "हम आपके नंबर को सत्यापित करने के लिए एक OTP भेजेंगे।",
    "Mobile Number": "मोबाइल नंबर",
    "Country code": "देश कोड",
    "Enter 10-digit mobile number": "10 अंकों का मोबाइल नंबर दर्ज करें",
    "Your mobile number is used only for account verification.": "आपका मोबाइल नंबर केवल खाते के सत्यापन के लिए उपयोग किया जाता है।",
    "Enter your mobile number.": "अपना मोबाइल नंबर दर्ज करें।",
    "Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9.": "6, 7, 8 या 9 से शुरू होने वाला मान्य 10 अंकों का नंबर दर्ज करें।",

    // OTP / Email
    "Enter Mobile OTP": "मोबाइल OTP दर्ज करें",
    "Mobile OTP verified.": "मोबाइल OTP सत्यापित हो गया।",
    "Verify Email Address": "ईमेल पता सत्यापित करें",
    "We will send an OTP to verify your email address.": "हम आपका ईमेल पता सत्यापित करने के लिए OTP भेजेंगे।",
    "Email Address": "ईमेल पता",
    "Enter Email OTP": "ईमेल OTP दर्ज करें",
    "Email OTP verified.": "ईमेल OTP सत्यापित हो गया।",
    "your mobile number": "आपका मोबाइल नंबर",
    "your email": "आपका ईमेल",

    // Password / Consent
    "Set Your Password": "अपना पासवर्ड सेट करें",
    "Use at least 8 characters with a number.": "कम से कम 8 अक्षर और एक अंक का उपयोग करें।",
    "Confirm Password": "पासवर्ड की पुष्टि करें",
    "Password must be 8+ characters, include a number, and match confirmation.": "पासवर्ड कम से कम 8 अक्षरों का हो, उसमें एक अंक हो, और पुष्टि वाले पासवर्ड से मेल खाए।",
    "Terms & Consent": "नियम और सहमति",
    "Review the required terms before moving ahead.": "आगे बढ़ने से पहले आवश्यक नियम पढ़ें।",
    "I agree to Terms & Conditions": "मैं नियम और शर्तों से सहमत हूँ",
    "I agree to Privacy Policy": "मैं गोपनीयता नीति से सहमत हूँ",
    "I agree to receive relevant communication via SMS, Email or WhatsApp. (Optional)": "मैं SMS, ईमेल या WhatsApp के माध्यम से संबंधित सूचनाएँ प्राप्त करने के लिए सहमत हूँ। (वैकल्पिक)",
    "Terms and Privacy Policy are required.": "नियम और गोपनीयता नीति से सहमति आवश्यक है।",

    // Personal details
    "Tell us a little about yourself so we can complete your driver profile.": "अपने बारे में थोड़ा बताएँ ताकि हम आपकी ड्राइवर प्रोफ़ाइल पूरी कर सकें।",
    "Basic Information": "बुनियादी जानकारी",
    "Your personal and contact information": "आपकी व्यक्तिगत और संपर्क जानकारी",
    "First Name": "पहला नाम",
    "Middle Name": "मध्य नाम",
    "Last Name": "अंतिम नाम",
    "Date of Birth": "जन्म तिथि",
    "Gender": "लिंग",
    "Male": "पुरुष",
    "Female": "महिला",
    "Other": "अन्य",
    "Father's / Guardian's Name": "पिता / अभिभावक का नाम",
    "Emergency Contact Name": "आपातकालीन संपर्क का नाम",
    "Emergency Contact Number": "आपातकालीन संपर्क नंबर",
    "Enter contact number": "संपर्क नंबर दर्ज करें",
    "Address": "पता",
    "Where you currently live": "आप वर्तमान में कहाँ रहते हैं",
    "Current Address": "वर्तमान पता",
    "Permanent address is the same as current address": "स्थायी पता वर्तमान पते के समान है",
    "Permanent Address": "स्थायी पता",
    "State": "राज्य",
    "District / City": "ज़िला / शहर",
    "Pincode": "पिनकोड",
    "Profile Photo": "प्रोफ़ाइल फ़ोटो",
    "Add a clear photo for your driver profile": "अपनी ड्राइवर प्रोफ़ाइल के लिए एक साफ़ फ़ोटो जोड़ें",
    "Upload a clear recent photo": "हाल की एक साफ़ फ़ोटो अपलोड करें",
    "Photo uploaded": "फ़ोटो अपलोड हो गई",
    "Upload Photo": "फ़ोटो अपलोड करें",
    "Replace Photo": "फ़ोटो बदलें",
    "JPG or PNG • Max 2 MB": "JPG या PNG • अधिकतम 2 MB",
    "JPG/PNG • Max 2 MB": "JPG/PNG • अधिकतम 2 MB",
    "JPG/PNG/PDF • Max 2 MB": "JPG/PNG/PDF • अधिकतम 2 MB",
    "Face / liveness verification:": "चेहरा / लाइवनेस सत्यापन:",

    // Identity
    "Complete KYC status checks for the driver profile.": "ड्राइवर प्रोफ़ाइल के लिए KYC स्थिति जाँच पूरी करें।",
    "Verification Progress": "सत्यापन की प्रगति",
    "Each check completes in this order": "हर जाँच इसी क्रम में पूरी होती है",
    "KYC / DigiLocker": "KYC / DigiLocker",
    "Identity Confirmation": "पहचान की पुष्टि",
    "Selfie Capture": "सेल्फ़ी कैप्चर",
    "Liveness Check": "लाइवनेस जाँच",
    "Identity Verified": "पहचान सत्यापित",
    "Complete all identity checks to continue.": "जारी रखने के लिए सभी पहचान जाँच पूरी करें।",
    "Simulate KYC verification": "KYC सत्यापन सिम्युलेट करें",
    "Runs all identity checks in order so you can continue to Step 07.": "सभी पहचान जाँच क्रम से चलाता है ताकि आप चरण 07 पर जा सकें।",

    // Driving licence
    "Enter and verify licence information.": "अपने ड्राइविंग लाइसेंस की जानकारी दर्ज करें और सत्यापित करें।",
    "Licence Details": "लाइसेंस विवरण",
    "As printed on your driving licence": "जैसा आपके ड्राइविंग लाइसेंस पर छपा है",
    "Driving Licence Number": "ड्राइविंग लाइसेंस नंबर",
    "Issuing State": "जारी करने वाला राज्य",
    "Maharashtra": "महाराष्ट्र",
    "Delhi": "दिल्ली",
    "Karnataka": "कर्नाटक",
    "Tamil Nadu": "तमिलनाडु",
    "Gujarat": "गुजरात",
    "Licence Documents": "लाइसेंस दस्तावेज़",
    "Front and back images are optional once the licence is verified via API": "API से लाइसेंस सत्यापित होने के बाद आगे और पीछे की फ़ोटो वैकल्पिक हैं",
    "DL Document": "DL दस्तावेज़",
    "DL Front Image": "DL आगे की फ़ोटो",
    "DL Back Image": "DL पीछे की फ़ोटो",
    "Licence Verification": "लाइसेंस सत्यापन",
    "These details are returned by the licence verification API": "ये विवरण लाइसेंस सत्यापन API से प्राप्त होते हैं",
    "DL Status": "DL स्थिति",
    "Licence Type / Class": "लाइसेंस का प्रकार / श्रेणी",
    "Issue Date": "जारी होने की तिथि",
    "Expiry Date": "समाप्ति तिथि",
    "Authorised Vehicle Classes": "अधिकृत वाहन श्रेणियाँ",
    "Complete the required licence details and verification to continue.": "जारी रखने के लिए आवश्यक लाइसेंस विवरण और सत्यापन पूरा करें।",
    "Simulate licence API verification": "लाइसेंस API सत्यापन सिम्युलेट करें",
    "Marks the licence as verified and fills the API fields.": "लाइसेंस को सत्यापित चिह्नित करता है और API फ़ील्ड भरता है।",

    // Operating model
    "Select the option that best describes how you drive.": "वह विकल्प चुनें जो बताता है कि आप कैसे ड्राइव करते हैं।",
    "I own/manage": "मेरे पास अपना वाहन है / मैं उसे संभालता हूँ",
    "a vehicle and drive.": "और खुद चलाता हूँ।",
    "Transporter Driver": "ट्रांसपोर्टर ड्राइवर",
    "I drive for a transporter.": "मैं एक ट्रांसपोर्टर के लिए ड्राइव करता हूँ।",
    "I will enter my Transporter ID.": "मैं अपना ट्रांसपोर्टर ID दर्ज करूँगा।",
    "Select Owner Driver or Transporter Driver.": "मालिक ड्राइवर या ट्रांसपोर्टर ड्राइवर चुनें।",

    // Owner flow
    "Enter your vehicle registration number to verify the RC.": "RC सत्यापित करने के लिए अपना वाहन रजिस्ट्रेशन नंबर दर्ज करें।",
    "Vehicle Registration Number": "वाहन रजिस्ट्रेशन नंबर",
    "e.g. MH12AB1234": "उदाहरण: MH12AB1234",
    "Verify RC": "RC सत्यापित करें",
    "Re-verify RC": "RC दोबारा सत्यापित करें",
    "Verifying RC…": "RC सत्यापित किया जा रहा है…",
    "View RC details": "RC विवरण देखें",
    "RC verified for": "RC सत्यापित:",
    ". Vehicle details have been fetched.": "। वाहन विवरण प्राप्त हो गए हैं।",
    "Vehicle details are fetched from your Registration Certificate after verification.": "सत्यापन के बाद वाहन विवरण आपके रजिस्ट्रेशन सर्टिफ़िकेट से प्राप्त किए जाते हैं।",
    "Enter your vehicle registration number.": "अपना वाहन रजिस्ट्रेशन नंबर दर्ज करें।",
    "Enter a valid registration number, e.g. MH12AB1234.": "मान्य रजिस्ट्रेशन नंबर दर्ज करें, उदाहरण: MH12AB1234।",
    "RC verification service is not connected yet.": "RC सत्यापन सेवा अभी जुड़ी नहीं है।",
    "Verification service is not connected yet.": "सत्यापन सेवा अभी जुड़ी नहीं है।",
    "Vehicle details are fetched from your Registration Certificate.": "वाहन विवरण आपके रजिस्ट्रेशन सर्टिफ़िकेट से प्राप्त किए जाते हैं।",
    "Vehicle details fetched from your Registration Certificate.": "आपके रजिस्ट्रेशन सर्टिफ़िकेट से प्राप्त वाहन विवरण।",
    "Verify your vehicle registration number first.": "पहले अपना वाहन रजिस्ट्रेशन नंबर सत्यापित करें।",
    "RC verification is pending.": "RC सत्यापन लंबित है।",
    "Verified from RC": "RC से सत्यापित",
    "Auto-filled from RC verification": "RC सत्यापन से अपने आप भरा गया",
    "Vehicle Type": "वाहन का प्रकार",
    "Body Type": "बॉडी का प्रकार",
    "Body Length": "बॉडी की लंबाई",
    "Payload Capacity (tons)": "भार क्षमता (टन)",
    "Payload Capacity": "भार क्षमता",
    "Vehicle Operations": "वाहन संचालन",
    "Details not available on the RC": "ऐसे विवरण जो RC में उपलब्ध नहीं हैं",
    "Cargo Type Supported (Can Carry)": "समर्थित माल का प्रकार (ले जा सकता है)",
    "Operating Area (Permit)": "संचालन क्षेत्र (परमिट)",
    "Availability": "उपलब्धता",
    "Available": "उपलब्ध",
    "Unavailable": "अनुपलब्ध",
    "On Trip": "यात्रा पर",
    "Bed Length": "बेड की लंबाई",
    "Bed Height": "बेड की ऊँचाई",
    "Bed Width": "बेड की चौड़ाई",
    "RC Document": "RC दस्तावेज़",
    "Registration Certificate": "रजिस्ट्रेशन सर्टिफ़िकेट",
    "RC Upload": "RC अपलोड",
    "Your vehicle insurance policy.": "आपके वाहन की बीमा पॉलिसी।",
    "Insurance Details": "बीमा विवरण",
    "As printed on the certificate": "जैसा प्रमाणपत्र पर छपा है",
    "Insurance Company": "बीमा कंपनी",
    "Policy Number": "पॉलिसी नंबर",
    "Valid From": "से मान्य",
    "Valid Upto": "तक मान्य",
    "Document": "दस्तावेज़",
    "Required for verification": "सत्यापन के लिए आवश्यक",
    "Insurance Upload": "बीमा अपलोड",
    "Status": "स्थिति",
    "Verify Insurance": "बीमा सत्यापित करें",
    "Pollution Under Control certificate.": "प्रदूषण नियंत्रण (PUC) प्रमाणपत्र।",
    "PUC Details": "PUC विवरण",
    "PUC Number": "PUC नंबर",
    "PUC Upload": "PUC अपलोड",
    "Verify PUC": "PUC सत्यापित करें",
    "Fitness certificate and permit, where applicable.": "फ़िटनेस प्रमाणपत्र और परमिट, जहाँ लागू हो।",
    "Fitness / Permit Details": "फ़िटनेस / परमिट विवरण",
    "Fitness Certificate Number": "फ़िटनेस प्रमाणपत्र नंबर",
    "Fitness Valid Upto": "फ़िटनेस तक मान्य",
    "Permit Number": "परमिट नंबर",
    "Permit Valid Upto": "परमिट तक मान्य",
    "Fitness Certificate Upload": "फ़िटनेस प्रमाणपत्र अपलोड",
    "Verify Fitness / Permit": "फ़िटनेस / परमिट सत्यापित करें",
    "Automated checks across your vehicle documents.": "आपके वाहन दस्तावेज़ों की स्वचालित जाँच।",
    "Automated Compliance Check": "स्वचालित अनुपालन जाँच",
    "Each document is checked for validity": "हर दस्तावेज़ की वैधता जाँची जाती है",
    "Wheeltrack Exception Review": "Wheeltrack अपवाद समीक्षा",
    "Submit your application. Wheeltrack reviews any exceptions before approval.": "अपना आवेदन जमा करें। स्वीकृति से पहले Wheeltrack किसी भी अपवाद की समीक्षा करता है।",
    "Application Summary": "आवेदन सारांश",
    "Check each section before submitting": "जमा करने से पहले हर भाग जाँच लें",
    "Identity/KYC": "पहचान / KYC",
    "Vehicle": "वाहन",
    "Insurance": "बीमा",
    "Fitness/Permit": "फ़िटनेस / परमिट",
    "Terms/Consent": "नियम / सहमति",
    "Application not submitted": "आवेदन जमा नहीं किया गया",
    "Submit your application for Wheeltrack review to get approved.": "स्वीकृति पाने के लिए अपना आवेदन Wheeltrack समीक्षा हेतु जमा करें।",
    "Under Wheeltrack Review": "Wheeltrack समीक्षा में",
    "We'll notify you once the review is complete.": "समीक्षा पूरी होते ही हम आपको सूचित करेंगे।",
    "Your owner driver profile and vehicle are approved.": "आपकी मालिक ड्राइवर प्रोफ़ाइल और वाहन स्वीकृत हैं।",

    // Transporter flow
    "Transporter": "ट्रांसपोर्टर",
    "Details": "विवरण",
    "Approval": "स्वीकृति",
    "Compliance": "अनुपालन",
    "Review": "समीक्षा",
    "Dashboard": "डैशबोर्ड",
    "Transporter ID": "ट्रांसपोर्टर ID",
    "Enter Transporter ID": "ट्रांसपोर्टर ID दर्ज करें",
    "After verification, transporter details will be displayed.": "सत्यापन के बाद ट्रांसपोर्टर विवरण दिखाई देंगे।",
    "Transporter Details": "ट्रांसपोर्टर विवरण",
    "Confirm the transporter and request to join.": "ट्रांसपोर्टर की पुष्टि करें और जुड़ने का अनुरोध भेजें।",
    "Transporter found. The transporter cannot create, add or edit your driver profile.": "ट्रांसपोर्टर मिल गया। ट्रांसपोर्टर आपकी ड्राइवर प्रोफ़ाइल बना, जोड़ या संपादित नहीं कर सकता।",
    "Company Name": "कंपनी का नाम",
    "Contact Number": "संपर्क नंबर",
    "Request to Join": "जुड़ने का अनुरोध",
    "Pending Transporter Approval": "ट्रांसपोर्टर की स्वीकृति लंबित",
    "Transporter Approves": "ट्रांसपोर्टर ने स्वीकृति दी",
    "Your request has been sent and is waiting for transporter approval.": "आपका अनुरोध भेज दिया गया है और ट्रांसपोर्टर की स्वीकृति की प्रतीक्षा है।",
    "Driver registers himself first. Transporters do not create or edit driver profiles.": "ड्राइवर पहले स्वयं रजिस्टर करता है। ट्रांसपोर्टर ड्राइवर प्रोफ़ाइल न बनाते हैं, न संपादित करते हैं।",
    "Driver Identity / DL Verification": "ड्राइवर पहचान / DL सत्यापन",
    "Transporter Found": "ट्रांसपोर्टर मिला",
    "Vehicle Assigned": "वाहन सौंपा गया",
    "Assigned Vehicle": "सौंपा गया वाहन",
    "Assigned Vehicle RC": "सौंपे गए वाहन की RC",
    "Vehicle information is read only for the driver.": "ड्राइवर के लिए वाहन की जानकारी केवल पढ़ने योग्य है।",
    "Compliance is checked at the assigned vehicle level.": "अनुपालन सौंपे गए वाहन के स्तर पर जाँचा जाता है।",
    "Review the transporter-driver relationship and assigned vehicle.": "ट्रांसपोर्टर-ड्राइवर संबंध और सौंपे गए वाहन की समीक्षा करें।",
    "Transporter Driver Approved": "ट्रांसपोर्टर ड्राइवर स्वीकृत",
    "Track review state and continue once approved.": "समीक्षा की स्थिति देखें और स्वीकृति के बाद आगे बढ़ें।",
    "Your profile can move through submitted, review, rejected, exception, approved and suspended states.": "आपकी प्रोफ़ाइल जमा, समीक्षा, अस्वीकृत, अपवाद, स्वीकृत और निलंबित स्थितियों से गुज़र सकती है।",
    "Vehicle Compliance": "वाहन अनुपालन",

    // Dashboard
    "My Profile": "मेरी प्रोफ़ाइल",
    "My Vehicle": "मेरा वाहन",
    "Documents": "दस्तावेज़",
    "Vehicle Status": "वाहन की स्थिति",
    "Trips This Month": "इस महीने की यात्राएँ",
    "Earnings": "कमाई",
    "Owner Driver Vehicle": "मालिक ड्राइवर का वाहन",
    "Transporter Assigned Vehicle": "ट्रांसपोर्टर द्वारा सौंपा गया वाहन",
    "Document Status": "दस्तावेज़ की स्थिति",
    "Owner driver dashboard": "मालिक ड्राइवर डैशबोर्ड",
    "Transporter driver dashboard": "ट्रांसपोर्टर ड्राइवर डैशबोर्ड",
    "Registration": "रजिस्ट्रेशन",
    "Registration Number": "रजिस्ट्रेशन नंबर",
    "Type": "प्रकार",
    "Body": "बॉडी",
    "Payload": "भार",
    "Mode": "मोड",
    "Editable owner vehicle": "मालिक का वाहन (संपादन योग्य)",
    "Read-only transporter vehicle": "ट्रांसपोर्टर का वाहन (केवल पढ़ने योग्य)",
    "Edit Access": "संपादन अनुमति",
    "Insurance Status": "बीमा की स्थिति",
    "PUC Status": "PUC की स्थिति",
    "Fitness / Permit Status": "फ़िटनेस / परमिट की स्थिति"
  };

  // Patterns for UI strings that embed numbers or user data (the data part is kept as-is).
  const PATTERNS = [
    [/^Step (\d+) of (\d+)$/, (m) => `चरण ${m[1]} / ${m[2]}`],
    [/^Step (\d+) \/ (\d+)$/, (m) => `चरण ${m[1]} / ${m[2]}`],
    [/^Go to (.+)$/, (m) => `${translate(m[1])} पर जाएँ`],
    [/^Welcome, (.+)$/, (m) => `स्वागत है, ${m[1]}`],
    [/^(\d+(?:\.\d+)?) tons$/, (m) => `${m[1]} टन`],
    [/^Use demo OTP (\d+) to verify (.+)\.$/, (m) => `${translateData(m[2])} सत्यापित करने के लिए डेमो OTP ${m[1]} का उपयोग करें।`],
    [/^Use demo OTP (\d+)\.$/, (m) => `डेमो OTP ${m[1]} का उपयोग करें।`]
  ];

  function translateData(text) {
    return text.replace(/your mobile number|your email/g, (match) => HI[match] || match);
  }

  function translate(text) {
    if (!text) return text;
    const trimmed = text.trim();
    if (!trimmed) return text;
    const lead = text.slice(0, text.indexOf(trimmed));
    const tail = text.slice(text.indexOf(trimmed) + trimmed.length);
    let out = null;
    if (Object.prototype.hasOwnProperty.call(HI, trimmed)) out = HI[trimmed];
    else if (/ \*$/.test(trimmed) && HI[trimmed.slice(0, -2)]) out = `${HI[trimmed.slice(0, -2)]} *`;
    else if (trimmed.includes(" · ")) out = trimmed.split(" · ").map((part) => translate(part)).join(" · ");
    else {
      for (const [pattern, fn] of PATTERNS) {
        const match = trimmed.match(pattern);
        if (match) { out = fn(match); break; }
      }
    }
    return out === null ? text : lead + out + tail;
  }

  const ATTRS = ["placeholder", "aria-label", "title"];
  const SKIP = "script, style, textarea, input, [data-no-translate]";

  function translateTree(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    nodes.forEach((textNode) => {
      const parent = textNode.parentElement;
      if (!parent || parent.closest(SKIP)) return;
      const next = translate(textNode.nodeValue);
      if (next !== textNode.nodeValue) textNode.nodeValue = next;
    });
    const elements = root.nodeType === 1 ? [root, ...root.querySelectorAll("*")] : [];
    elements.forEach((el) => ATTRS.forEach((attr) => {
      const value = el.getAttribute && el.getAttribute(attr);
      if (value) {
        const next = translate(value);
        if (next !== value) el.setAttribute(attr, next);
      }
    }));
  }

  window.WheeltrackI18n = { HI, translate, translateTree };
})();
