// English: the source text. Every key used in the app must exist here.
const en = {
  // Home
  'home.title': 'Drishti',
  'home.subtitle': 'Vision Screening for Children',
  'home.startTest': 'Start Eye Test',
  'home.viewHistory': 'View Past Results',
  'home.description': 'A simple eye test to check if you need glasses or have color vision issues.',
  
  // Language selection
  'language.title': 'Choose Your Language',
  
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
  'instructions.ready': 'I\'m Ready!',
  
  // Acuity Test
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
  'color.progress': '{current} of {total}',
  
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
  'history.clear': 'Clear All',
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
  'common.cancel': 'Cancel',
  'common.ok': 'OK',
  'common.loading': 'Loading...',
};

export default en;
export type TranslationKey = keyof typeof en;
