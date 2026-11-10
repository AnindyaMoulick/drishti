// Translation dictionaries - start with English and Hindi
// Other languages will be added progressively

type TranslationKey = string;
type Translations = Record<TranslationKey, string>;

const translations: Record<string, Translations> = {
  en: {
    // Home
    'home.title': 'Drishti',
    'home.subtitle': 'Vision Screening for Children',
    'home.startTest': 'Start Eye Test',
    'home.viewHistory': 'View Past Results',
    'home.description': 'A simple eye test to check if you need glasses or have color vision issues.',
    
    // Language selection
    'language.title': 'Choose Your Language',
    'language.subtitle': 'Select the language you understand best',
    
    // Age
    'age.title': 'How Old Are You?',
    'age.subtitle': 'Select your age',
    'age.years': 'years old',
    'age.next': 'Next',
    
    // Name (optional)
    'name.title': 'What is Your Name?',
    'name.subtitle': 'This is optional',
    'name.placeholder': 'Enter your name',
    'name.skip': 'Skip',
    'name.next': 'Next',
    
    // Calibration
    'calibrate.title': 'Calibrate Your Screen',
    'calibrate.instruction': 'Place your Aadhaar card on the screen and resize the box to match it exactly.',
    'calibrate.noCard': 'Don\'t have an Aadhaar card? Use any standard ID card.',
    'calibrate.done': 'Card Matches',
    'calibrate.tip': 'This helps us show the correct size of images for your test.',
    
    // Instructions
    'instructions.title': 'How This Test Works',
    'instructions.step1': 'Hold your phone at arm\'s length',
    'instructions.step2': 'Cover one eye with your hand',
    'instructions.step3': 'Match the symbol shown on screen',
    'instructions.step4': 'Confirm your choice',
    'instructions.startRight': 'Start with Right Eye',
    'instructions.ready': 'I\'m Ready!',
    
    // Acuity Test
    'acuity.title': 'Eye Test',
    'acuity.rightEye': 'Right Eye',
    'acuity.leftEye': 'Left Eye',
    'acuity.coverLeft': 'Cover your LEFT eye with your hand',
    'acuity.coverRight': 'Cover your RIGHT eye with your hand',
    'acuity.matchSymbol': 'Tap the matching symbol below',
    'acuity.confirm': 'You selected this symbol. Is this correct?',
    'acuity.yes': 'Yes ✓',
    'acuity.no': 'No, let me try again',
    'acuity.switchEye': 'Great! Now let\'s test your other eye.',
    'acuity.switchInstruction': 'Cover your RIGHT eye with your hand.',
    'acuity.continue': 'Continue',
    'acuity.level': 'Level',
    
    // Color Test
    'color.title': 'Color Vision Test',
    'color.instruction': 'What number do you see in the circle?',
    'color.cantSee': 'I can\'t see a number',
    'color.clear': 'Clear',
    'color.next': 'Next',
    'color.plateOf': 'of',
    
    // Results
    'results.title': 'Your Results',
    'results.rightEye': 'Right Eye',
    'results.leftEye': 'Left Eye',
    'results.colorVision': 'Color Vision',
    'results.passed': 'Your vision appears healthy!',
    'results.failed': 'We recommend visiting an eye doctor for a checkup.',
    'results.colorPassed': 'Your color vision appears normal!',
    'results.colorFailed': 'You may have difficulty seeing some colors. Please visit an eye doctor.',
    'results.newTest': 'Take Another Test',
    'results.home': 'Go Home',
    'results.normal': 'Normal',
    'results.needsCheck': 'Needs Checkup',
    'results.dateSaved': 'Result saved on',
    
    // History
    'history.title': 'Past Results',
    'history.noResults': 'No past results found.',
    'history.export': 'Export All Results',
    'history.clear': 'Clear All',
    'history.clearConfirm': 'Are you sure you want to delete all results?',
    'history.back': 'Back',
    'history.delete': 'Delete',
    'history.takeTest': 'Take a Test',
    'history.deleteOne': 'Delete this result',
    'history.clearTitle': 'Clear All Results?',
    'history.cannotUndo': 'This action cannot be undone.',
    'history.summary': '{saved} saved · {checkup} need checkup',
    'history.age': 'Age: {age} years',
    'history.color': 'Color',
    'history.check': 'Check',
    'history.exportCSV': 'Excel (CSV)',
    'history.exportJSON': 'JSON',

    // Disclaimers / tips
    'disclaimer.home': 'This is a screening tool, not a diagnostic device. Please consult an eye care professional for proper diagnosis.',
    'disclaimer.results': 'This is a screening tool, not a medical diagnosis. Please visit a qualified eye care professional for a comprehensive examination.',
    'instructions.armTip': "Hold phone at arm's length (~{cm} cm)",
    'calibrate.cardLabel': 'AADHAAR CARD',
    'calibrate.smaller': 'Smaller',
    'calibrate.bigger': 'Bigger',
    
    // Common
    'common.back': 'Back',
    'common.next': 'Next',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.ok': 'OK',
    'common.loading': 'Loading...',
  },
  
  hi: {
    'home.title': 'दृष्टि',
    'home.subtitle': 'बच्चों के लिए दृष्टि जांच',
    'home.startTest': 'आंखों की जांच शुरू करें',
    'home.viewHistory': 'पिछले परिणाम देखें',
    'home.description': 'यह जानने के लिए एक सरल आंख परीक्षण कि क्या आपको चश्मे की आवश्यकता है।',
    
    'language.title': 'अपनी भाषा चुनें',
    'language.subtitle': 'वह भाषा चुनें जो आप सबसे अच्छे समझते हैं',
    
    'age.title': 'आपकी उम्र क्या है?',
    'age.subtitle': 'अपनी उम्र चुनें',
    'age.years': 'साल',
    'age.next': 'आगे',
    
    'name.title': 'आपका नाम क्या है?',
    'name.subtitle': 'यह वैकल्पिक है',
    'name.placeholder': 'अपना नाम लिखें',
    'name.skip': 'छोड़ें',
    'name.next': 'आगे',
    
    'calibrate.title': 'स्क्रीन को कैलिब्रेट करें',
    'calibrate.instruction': 'अपना आधार कार्ड स्क्रीन पर रखें और बॉक्स का आकार कार्ड से मिलाएं।',
    'calibrate.noCard': 'आधार कार्ड नहीं है? कोई भी मानक पहचान पत्र उपयोग करें।',
    'calibrate.done': 'कार्ड मिल गया',
    'calibrate.tip': 'इससे हमें आपके परीक्षण के लिए सही आकार की छवियां दिखाने में मदद मिलती है।',
    
    'instructions.title': 'यह परीक्षण कैसे काम करता है',
    'instructions.step1': 'अपना फोन हाथ की दूरी पर रखें',
    'instructions.step2': 'एक आंख अपने हाथ से ढकें',
    'instructions.step3': 'स्क्रीन पर दिखाए गए चिन्ह को मिलाएं',
    'instructions.step4': 'अपने चुनाव की पुष्टि करें',
    'instructions.ready': 'मैं तैयार हूं!',
    
    'acuity.title': 'आंखों की जांच',
    'acuity.rightEye': 'दाईं आंख',
    'acuity.leftEye': 'बाईं आंख',
    'acuity.coverLeft': 'अपनी बाईं आंख को हाथ से ढकें',
    'acuity.coverRight': 'अपनी दाईं आंख को हाथ से ढकें',
    'acuity.matchSymbol': 'नीचे मिलता हुआ चिन्ह दबाएं',
    'acuity.confirm': 'आपने यह चिन्ह चुना। क्या यह सही है?',
    'acuity.yes': 'हां ✓',
    'acuity.no': 'नहीं, फिर से कोशिश करें',
    'acuity.switchEye': 'बहुत अच्छा! अब दूसरी आंख की जांच करते हैं।',
    'acuity.switchInstruction': 'अपनी दाईं आंख को हाथ से ढकें।',
    'acuity.continue': 'जारी रखें',
    'acuity.level': 'स्तर',
    
    'color.title': 'रंग दृष्टि परीक्षण',
    'color.instruction': 'गोले में आपको कौन सी संख्या दिखाई दे रही है?',
    'color.cantSee': 'मुझे कोई संख्या नहीं दिखाई दे रही',
    'color.clear': 'मिटाएं',
    'color.next': 'आगे',
    'color.plateOf': 'में से',
    
    'results.title': 'आपके परिणाम',
    'results.rightEye': 'दाईं आंख',
    'results.leftEye': 'बाईं आंख',
    'results.colorVision': 'रंग दृष्टि',
    'results.passed': 'आपकी दृष्टि स्वस्थ लग रही है!',
    'results.failed': 'हम आंखों के डॉक्टर से जांच कराने की सलाह देते हैं।',
    'results.colorPassed': 'आपकी रंग दृष्टि सामान्य लग रही है!',
    'results.colorFailed': 'आपको कुछ रंग देखने में कठिनाई हो सकती है। कृपया आंखों के डॉक्टर से मिलें।',
    'results.newTest': 'एक और परीक्षण करें',
    'results.home': 'घर जाएं',
    'results.normal': 'सामान्य',
    'results.needsCheck': 'जांच जरूरी',
    'results.dateSaved': 'परिणाम सहेजा गया',
    
    'history.title': 'पिछले परिणाम',
    'history.noResults': 'कोई पिछले परिणाम नहीं मिले।',
    'history.export': 'सभी परिणाम निर्यात करें',
    'history.clear': 'सब हटाएं',
    'history.clearConfirm': 'क्या आप वाकई सभी परिणाम हटाना चाहते हैं?',
    'history.back': 'वापस',
    'history.delete': 'हटाएं',
    'history.takeTest': 'परीक्षण करें',
    'history.deleteOne': 'यह परिणाम हटाएं',
    'history.clearTitle': 'सभी परिणाम हटाएं?',
    'history.cannotUndo': 'इसे वापस नहीं किया जा सकता।',
    'history.summary': '{saved} सहेजे गए · {checkup} को जांच की जरूरत',
    'history.age': 'उम्र: {age} साल',
    'history.color': 'रंग',
    'history.check': 'जांच',
    'history.exportCSV': 'एक्सेल (CSV)',
    'history.exportJSON': 'JSON',

    'disclaimer.home': 'यह केवल एक जांच उपकरण है, निदान उपकरण नहीं। सही निदान के लिए आंखों के विशेषज्ञ से सलाह लें।',
    'disclaimer.results': 'यह केवल एक जांच है, चिकित्सा निदान नहीं। पूरी जांच के लिए किसी योग्य नेत्र विशेषज्ञ के पास जाएं।',
    'instructions.armTip': 'फोन को हाथ की दूरी पर रखें (~{cm} सेमी)',
    'calibrate.cardLabel': 'आधार कार्ड',
    'calibrate.smaller': 'छोटा',
    'calibrate.bigger': 'बड़ा',
    
    'common.back': 'वापस',
    'common.next': 'आगे',
    'common.cancel': 'रद्द करें',
    'common.confirm': 'पुष्टि करें',
    'common.yes': 'हां',
    'common.no': 'नहीं',
    'common.ok': 'ठीक है',
    'common.loading': 'लोड हो रहा है...',
  },
};

// For languages we haven't translated yet, fall back to English.
// `vars` fills {placeholders}, e.g. t('history.age', lang, { age: 10 }).
export function t(key: string, lang: string = 'en', vars?: Record<string, string | number>): string {
  let text = translations[lang]?.[key] ?? translations.en[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}

export default translations;
