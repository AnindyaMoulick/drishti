import { TestResult, EyeResult } from '@/types';
import { DEFICIENCY_NAME } from '@/lib/colorScoring';

const STORAGE_KEY = 'drishti_results';

export function saveTestResult(result: TestResult): void {
  try {
    const existing = getTestResults();
    existing.push(result);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (error) {
    console.error('Failed to save test result:', error);
  }
}

export function getTestResults(): TestResult[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as TestResult[];
  } catch (error) {
    console.error('Failed to load test results:', error);
    return [];
  }
}

export function getTestResultById(id: string): TestResult | null {
  const results = getTestResults();
  return results.find(r => r.id === id) || null;
}

export function deleteTestResult(id: string): void {
  try {
    const results = getTestResults().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
  } catch (error) {
    console.error('Failed to delete test result:', error);
  }
}

export function clearAllResults(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear results:', error);
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Export results as JSON download
export function exportResults(): void {
  const results = getTestResults();
  downloadFile(
    JSON.stringify(results, null, 2),
    `drishti-results-${new Date().toISOString().split('T')[0]}.json`,
    'application/json'
  );
}

// Export results as CSV (opens in Excel / Google Sheets) for school records
export function exportResultsCSV(): void {
  const results = getTestResults();
  const header = [
    'Date', 'Name', 'Age', 'Language', 'Test',
    'Right Eye (Snellen)', 'Right Eye (LogMAR)', 'Right Eye Result',
    'Left Eye (Snellen)', 'Left Eye (LogMAR)', 'Left Eye Result',
    'Color Plates Correct', 'Color Vision Result', 'Overall', 'Screen PPI', 'Distance (cm)',
  ];
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // Each test leaves the other test's columns blank.
  const eye = (e?: EyeResult) => e ? [e.bestSnellen, e.bestLogMAR, e.passed ? 'Pass' : 'Refer'] : ['', '', ''];
  const rows = results.map(r => {
    const cv = r.colorVision;
    const hasEyes = !!(r.rightEye || r.leftEye);
    const test = hasEyes && cv ? 'Eyesight + Colour' : cv ? 'Colour blindness' : 'Eyesight';
    return [
      new Date(r.timestamp).toLocaleString('en-IN'),
      r.childName || '',
      r.age,
      r.language,
      test,
      ...eye(r.rightEye),
      ...eye(r.leftEye),
      cv ? `${cv.responses.filter(x => x.correct).length}/${cv.responses.length}` : '',
      cv ? (cv.passed ? 'Normal' : DEFICIENCY_NAME[cv.possibleDeficiency] ?? cv.possibleDeficiency) : '',
      r.overallPassed ? 'Pass' : 'Refer to eye doctor',
      hasEyes ? Math.round(r.screenPPI) : '',
      hasEyes ? r.armLengthCM : '',
    ].map(escape).join(',');
  });
  // BOM so Excel reads Indian-script names correctly
  downloadFile('\uFEFF' + [header.join(','), ...rows].join('\n'),
    `drishti-results-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8');
}

function downloadFile(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
