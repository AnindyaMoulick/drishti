import { TestResult } from '@/types';

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
    'Date', 'Name', 'Age', 'Language',
    'Right Eye (Snellen)', 'Right Eye (LogMAR)', 'Right Eye Result',
    'Left Eye (Snellen)', 'Left Eye (LogMAR)', 'Left Eye Result',
    'Color Plates Correct', 'Color Vision Result', 'Overall', 'Screen PPI', 'Distance (cm)',
  ];
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = results.map(r => {
    const colorCorrect = r.colorVision.responses.filter(x => x.correct).length;
    return [
      new Date(r.timestamp).toLocaleString('en-IN'),
      r.childName || '',
      r.age,
      r.language,
      r.rightEye.bestSnellen, r.rightEye.bestLogMAR, r.rightEye.passed ? 'Pass' : 'Refer',
      r.leftEye.bestSnellen, r.leftEye.bestLogMAR, r.leftEye.passed ? 'Pass' : 'Refer',
      `${colorCorrect}/${r.colorVision.responses.length}`,
      r.colorVision.passed ? 'Normal' : r.colorVision.possibleDeficiency,
      r.overallPassed ? 'Pass' : 'Refer to eye doctor',
      Math.round(r.screenPPI),
      r.armLengthCM,
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
