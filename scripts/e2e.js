// End-to-end check of the Drishti flow using headless Chrome over CDP (no deps; Node 22+).
// Usage: start the dev server (npx next dev -p 3000), then `node scripts/e2e.js`.
// Screenshots go to scripts/e2e-output/ (git-ignored).
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:3000';
const OUT = path.join(__dirname, 'e2e-output');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9333;
fs.mkdirSync(OUT, { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log('•', ...a);
const problems = [];

async function main() {
  const profile = path.join(OUT, 'profile');
  const chrome = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu', 'about:blank',
  ], { stdio: 'ignore' });

  let targets;
  for (let i = 0; i < 40; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); break; } catch { await sleep(250); }
  }
  const page = targets.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r));

  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', ev => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); return; }
    if (msg.method === 'Runtime.exceptionThrown') {
      problems.push('EXCEPTION: ' + (msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text));
    }
    if (msg.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(msg.params.type)) {
      problems.push(`console.${msg.params.type}: ` + msg.params.args.map(a => a.value ?? a.description).join(' '));
    }
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
      problems.push('LOG: ' + msg.params.entry.text + ' ' + (msg.params.entry.url || ''));
    }
  });
  const send = (method, params = {}) => new Promise(res => {
    const mid = ++id; pending.set(mid, res); ws.send(JSON.stringify({ id: mid, method, params }));
  });
  const evaluate = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result?.exceptionDetails) throw new Error('eval failed: ' + expr + ' → ' + JSON.stringify(r.result.exceptionDetails));
    return r.result?.result?.value;
  };
  let shot = 0;
  const screenshot = async name => {
    await sleep(350);
    const r = await send('Page.captureScreenshot', { format: 'png' });
    const file = path.join(OUT, `${String(++shot).padStart(2, '0')}-${name}.png`);
    fs.writeFileSync(file, Buffer.from(r.result.data, 'base64'));
  };
  const waitFor = async (expr, label, timeout = 15000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) {
      try { if (await evaluate(expr)) return; } catch {}
      await sleep(150);
    }
    throw new Error('Timeout waiting for ' + label);
  };
  const waitPath = p => waitFor(`location.pathname === ${JSON.stringify(p)}`, 'path ' + p);
  const clickText = async text => {
    const ok = await evaluate(`(() => {
      const b = [...document.querySelectorAll('button')].find(b => b.innerText.trim().includes(${JSON.stringify(text)}));
      if (!b || b.disabled) return false; b.click(); return true; })()`);
    if (!ok) throw new Error('Button not found/disabled: ' + text);
    await sleep(120);
  };
  const bodyText = () => evaluate('document.body.innerText');

  await send('Runtime.enable'); await send('Log.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 412, height: 915, deviceScaleFactor: 2, mobile: true });

  // ---------- Home ----------
  await send('Page.navigate', { url: BASE + '/' });
  await waitFor(`document.body.innerText.includes('Start Eye Test')`, 'home');
  await evaluate(`localStorage.clear(); sessionStorage.clear(); true`);
  await screenshot('home');
  await clickText('Start Eye Test');

  // ---------- Language ----------
  await waitPath('/language');
  await screenshot('language');
  const langCount = await evaluate(`document.querySelectorAll('button').length`);
  log('Language buttons:', langCount);
  if (langCount < 22) problems.push('Expected 22+ language buttons, got ' + langCount);
  await clickText('English');

  // ---------- Name ----------
  await waitPath('/name');
  await evaluate(`(() => { const i = document.querySelector('input');
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    set.call(i, 'Aarav Test'); i.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
  await screenshot('name');
  await clickText('Next');

  // ---------- Age ----------
  await waitPath('/age');
  await evaluate(`[...document.querySelectorAll('button')].find(b => b.innerText.trim() === '10').click(), true`);
  await sleep(150);
  await screenshot('age');
  await clickText('Next');

  // ---------- Calibrate ----------
  await waitPath('/calibrate');
  await clickText('+'); await clickText('+'); await clickText('−');
  await screenshot('calibrate');
  await clickText('Card Matches');

  // ---------- Instructions ----------
  await waitPath('/instructions');
  await screenshot('instructions');
  await clickText("I'm Ready");

  // ---------- Acuity ----------
  await waitPath('/test/acuity');
  await waitFor(`document.body.innerText.includes('Level 1/11')`, 'acuity level 1');
  // A refresh must keep calibration (sessionStorage) instead of bouncing to /language
  await send('Page.reload');
  await sleep(2500);
  if ((await evaluate('location.pathname')) !== '/test/acuity') problems.push('Refresh on acuity page lost state');
  await waitFor(`document.body.innerText.includes('Level 1/11')`, 'acuity level 1 after reload');
  const displayed = `document.querySelector('div.rounded-3xl svg')?.getAttribute('aria-label')`;
  const levelNo = async () => {
    const m = (await bodyText()).match(/Level (\d+)\/11/);
    return m ? +m[1] : null;
  };
  async function runEye(eyeName, failFromLevel) {
    let answers = 0, cancelled = false;
    for (let guard = 0; guard < 60; guard++) {
      const txt = await bodyText();
      if (txt.includes('Now let')) return answers;
      const lvl = await levelNo();
      if (lvl === null) return answers; // left the page
      const sym = await evaluate(displayed);
      const size = await evaluate(`document.querySelector('div.rounded-3xl svg')?.getAttribute('width')`);
      if (guard === 0 || answers % 3 === 0) log(`${eyeName} eye level ${lvl}: shown=${sym} box=${(+size).toFixed(1)}px`);
      if (lvl === 4 && eyeName === 'right' && answers === 9) await screenshot('acuity-right-level4');
      const wrong = lvl >= failFromLevel;
      const choice = wrong ? ['house', 'circle', 'square', 'apple'].find(s => s !== sym) : sym;
      await evaluate(`document.querySelector('button[aria-label="${choice}"]').click(), true`);
      await waitFor(`document.body.innerText.includes('Is this correct?')`, 'confirm dialog');
      if (!cancelled) {
        // test the "No, let me try again" path once
        await screenshot(`acuity-${eyeName}-confirm`);
        await clickText('No, let me try again');
        await waitFor(`!document.body.innerText.includes('Is this correct?')`, 'dialog closed');
        cancelled = true;
        continue;
      }
      await clickText('Yes');
      answers++;
      await sleep(100);
      const p = await evaluate('location.pathname');
      if (p !== '/test/acuity') return answers;
      if ((await bodyText()).includes('Now let')) return answers;
    }
    throw new Error('acuity loop did not terminate');
  }
  await screenshot('acuity-right-start');
  const rightAnswers = await runEye('right', 99);  // perfect right eye
  log('Right eye answers:', rightAnswers);
  await waitFor(`document.body.innerText.includes('Now let')`, 'switch eye screen');
  await screenshot('switch-eye');
  await clickText('Continue');
  await waitFor(`document.body.innerText.includes('Left Eye')`, 'left eye');
  const leftAnswers = await runEye('left', 6);   // left eye fails from level 6 (6/19)
  log('Left eye answers:', leftAnswers);

  // ---------- Color ----------
  await waitPath('/test/color');
  const plateAnswers = [12, 8, 5, 29, 74, 6, 45, 3];
  for (let i = 0; i < plateAnswers.length; i++) {
    await waitFor(`document.body.innerText.includes('${i + 1} of 8')`, 'plate ' + (i + 1));
    await sleep(300);
    await screenshot(`color-plate-${i + 1}`);
    if (i === 6) { await clickText("can't see"); continue; } // one miss
    for (const d of String(plateAnswers[i])) {
      await evaluate(`[...document.querySelectorAll('button')].find(b => b.innerText.trim() === '${d}').click(), true`);
      await sleep(60);
    }
    await clickText('OK');
  }

  // ---------- Results ----------
  await waitPath('/results');
  await waitFor(`document.body.innerText.includes('Your Results')`, 'results');
  await screenshot('results');
  const resText = await bodyText();
  log('Results text:\n' + resText.split('\n').filter(Boolean).map(l => '    ' + l).join('\n'));

  const stored = await evaluate(`localStorage.getItem('drishti_results')`);
  const parsed = JSON.parse(stored || '[]');
  log('Saved results in localStorage:', parsed.length);
  if (parsed[0]) {
    const r = parsed[0];
    log(`  name=${r.childName} age=${r.age} PPI=${r.screenPPI.toFixed(1)} dist=${r.armLengthCM}cm`);
    log(`  right=${r.rightEye.bestSnellen} (${r.rightEye.passed}) left=${r.leftEye.bestSnellen} (${r.leftEye.passed})`);
    log(`  color correct=${r.colorVision.responses.filter(x => x.correct).length}/8 passed=${r.colorVision.passed} overall=${r.overallPassed}`);
    if (r.rightEye.bestSnellen !== '6/6') problems.push('Right eye expected 6/6, got ' + r.rightEye.bestSnellen);
    if (r.leftEye.bestSnellen !== '6/24') problems.push('Left eye expected 6/24, got ' + r.leftEye.bestSnellen);
    if (!r.colorVision.passed) problems.push('Color vision expected pass (6/7)');
  } else problems.push('No result saved to localStorage!');

  // ---------- History ----------
  await clickText('View Past Results');
  await waitPath('/history');
  await sleep(400);
  await screenshot('history');

  // ---------- Hindi smoke test ----------
  await send('Page.navigate', { url: BASE + '/' });
  await waitFor(`document.body.innerText.includes('Start Eye Test')`, 'home again'); await sleep(2500);
  await clickText('Start Eye Test');
  await waitPath('/language');
  await clickText('हिन्दी');
  await waitPath('/name');
  await screenshot('hindi-name');
  if (!(await bodyText()).includes('आपका नाम')) problems.push('Hindi translation not shown on name page');
  await send('Page.navigate', { url: BASE + '/history' });
  await waitFor(`document.body.innerText.includes('पिछले परिणाम')`, 'Hindi history');
  await screenshot('hindi-history');
  const histText = await bodyText();
  for (const s of ['Delete this result', 'need checkup', 'Right Eye']) {
    if (histText.includes(s)) problems.push('English left on Hindi history page: ' + s);
  }

  ws.close();
  chrome.kill();
}

main()
  .catch(e => problems.push('FATAL: ' + e.message))
  .finally(() => {
    console.log('\n==== PROBLEMS (' + problems.length + ') ====');
    problems.forEach(p => console.log('  ✗ ' + p));
    console.log('Screenshots in', OUT);
    process.exit(0);
  });
