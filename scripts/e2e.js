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
  // Fake microphone (headless Chrome has no real one), behaving like Chrome's continuous mode:
  // each phrase pushed to window.__fakeQueue arrives word by word as interim results, then
  // as a final result, then (like Android) the final result once more. After 4 s of
  // silence the session ends with "no-speech" and the app must restart it.
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.__fakeQueue = []; window.__fakeStarts = 0;
    class FakeRecognition {
      start() {
        window.__fakeStarts++;
        this.results = []; this.steps = []; let quiet = Date.now();
        const emit = (text, isFinal) => {
          const res = [{ transcript: text }]; res.isFinal = isFinal;
          if (isFinal || !this.results.length || this.results[this.results.length - 1].isFinal) this.results.push(res);
          else this.results[this.results.length - 1] = res;
          this.onresult && this.onresult({ results: this.results.slice() });
        };
        this.timer = setInterval(() => {
          if (this.steps.length) { this.steps.shift()(); quiet = Date.now(); return; }
          if (window.__fakeQueue.length) {
            const said = window.__fakeQueue.shift(); const words = said.split(' ');
            words.forEach((w, i) => this.steps.push(() => emit(words.slice(0, i + 1).join(' '), false)));
            this.steps.push(() => emit(said, true));
            this.steps.push(() => emit(said, true));
            return;
          }
          if (Date.now() - quiet > 4000) {
            clearInterval(this.timer);
            this.onerror && this.onerror({ error: 'no-speech' });
            this.onend && this.onend();
          }
        }, 100);
      }
      abort() { clearInterval(this.timer); this.onerror && this.onerror({ error: 'aborted' }); this.onend && this.onend(); }
    }
    window.SpeechRecognition = FakeRecognition; window.webkitSpeechRecognition = FakeRecognition;` });
  await send('Emulation.setDeviceMetricsOverride', { width: 412, height: 915, deviceScaleFactor: 2, mobile: true });

  // ---------- Home ----------
  await send('Page.navigate', { url: BASE + '/' });
  await waitFor(`document.body.innerText.includes('Eyesight Test')`, 'home');
  await evaluate(`localStorage.clear(); sessionStorage.clear(); true`);
  await screenshot('home');
  await clickText('Eyesight Test');

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
  await waitFor(`document.body.innerText.includes('Level 1/7')`, 'acuity level 1');
  // A refresh must keep calibration (sessionStorage) instead of bouncing to /language
  await send('Page.reload');
  await sleep(2500);
  if ((await evaluate('location.pathname')) !== '/test/acuity') problems.push('Refresh on acuity page lost state');
  await waitFor(`document.body.innerText.includes('Level 1/7')`, 'acuity level 1 after reload');
  const displayed = `document.querySelector('div.rounded-3xl svg')?.getAttribute('aria-label')`;
  const levelNo = async () => {
    const m = (await bodyText()).match(/Level (\d+)\/7/);
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
      if (lvl === 4 && eyeName === 'right' && answers === 6) await screenshot('acuity-right-level4');
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
  const leftAnswers = await runEye('left', 4);   // left eye fails from level 4 (6/18), so best is 6/24
  log('Left eye answers:', leftAnswers);

  // ---------- Eyesight results (no colour test in this flow) ----------
  await waitPath('/results');
  await waitFor(`document.body.innerText.includes('Your Results')`, 'results');
  await screenshot('results-eyesight');
  let resText = await bodyText();
  log('Eyesight results:\n' + resText.split('\n').filter(Boolean).map(l => '    ' + l).join('\n'));
  if (resText.includes('Color Vision')) problems.push('Eyesight results should not show a colour card');

  // ---------- Colour blindness test, chosen separately on the home screen ----------
  await send('Page.navigate', { url: BASE + '/' });
  await waitFor(`document.body.innerText.includes('Color Blindness Test')`, 'home (colour)'); await sleep(2500);
  await screenshot('home-choice');
  await clickText('Color Blindness Test');
  await waitPath('/language');
  await clickText('English');
  await waitPath('/name');
  await clickText('Skip');
  await waitPath('/age');
  await evaluate(`[...document.querySelectorAll('button')].find(b => b.innerText.trim() === '9').click(), true`);
  await sleep(150);
  await clickText('Next');
  await waitPath('/test/color');  // no calibration or acuity screens
  // Voice answers: the child speaks, the app shows the number and moves on by itself.
  const say = (phrase) => evaluate(`window.__fakeQueue.push(${JSON.stringify(phrase)}), true`);
  const atPlate = (n) => waitFor(`document.body.innerText.includes('${n} of 12')`, 'plate ' + n);
  await atPlate(1); await sleep(300); await screenshot('color-plate-1');
  await clickText('Say the number');
  await say('twelve');
  await waitFor(`document.body.innerText.includes('You said 12.')`, 'shows heard 12');
  await screenshot('color-voice-heard');
  await atPlate(2);                       // moved on without any tap
  let t0 = Date.now();
  await say('it is 8');
  await atPlate(3);
  const quick = Date.now() - t0;
  log('  voice answer to next plate: ' + quick + ' ms');
  if (quick > 2000) problems.push('Voice answer too slow: ' + quick + ' ms');
  await sleep(300); await screenshot('color-plate-3');
  await say('hello');                     // speech without a number: hint, keeps listening
  await waitFor(`document.body.innerText.includes("didn't hear a number")`, 'voice not heard');
  await say('twenty nine');               // interim "twenty" must not be taken as 20
  await atPlate(4);
  // Long silence: the browser ends the session; the app restarts it and still hears the answer
  const startsBefore = await evaluate('window.__fakeStarts');
  await sleep(5500);
  const startsAfter = await evaluate('window.__fakeStarts');
  if (!(startsAfter > startsBefore)) problems.push('Mic was not restarted after silence');
  await say('five');
  await atPlate(5);
  await clickText('Type the number instead');
  await evaluate(`[...document.querySelectorAll('button')].find(b => b.innerText.trim() === '3').click(), true`);
  await clickText('OK');
  await atPlate(6);                       // keypad mode now; turn voice back on
  await clickText('Say the number');
  await say('fifteen');
  await atPlate(7);
  await say("I can't see anything");      // one miss: no number seen
  await atPlate(8);
  await say('six');
  await atPlate(9); await sleep(300); await screenshot('color-plate-9-classify');
  await say('26');
  await atPlate(10); await sleep(300); await screenshot('color-plate-10-classify');
  await say('42');
  await atPlate(11); await sleep(300); await screenshot('color-plate-11-tritan');
  await say('seven');
  await atPlate(12); await sleep(300); await screenshot('color-plate-12-tritan');
  await say('forty five');

  // ---------- Colour results ----------
  await waitPath('/results');
  await waitFor(`document.body.innerText.includes('Your Results')`, 'colour results');
  await screenshot('results-color');
  resText = await bodyText();
  log('Colour results:\n' + resText.split('\n').filter(Boolean).map(l => '    ' + l).join('\n'));
  if (resText.includes('Right Eye')) problems.push('Colour results should not show eye cards');

  const stored = await evaluate(`localStorage.getItem('drishti_results')`);
  const parsed = JSON.parse(stored || '[]');
  log('Saved results in localStorage:', parsed.length);
  if (parsed.length !== 2) problems.push('Expected 2 saved results, got ' + parsed.length);
  const [v, c] = parsed;
  if (v) {
    log(`  eyesight: name=${v.childName} age=${v.age} PPI=${v.screenPPI.toFixed(1)} dist=${v.armLengthCM}cm mode=${v.testMode}`);
    log(`  right=${v.rightEye?.bestSnellen} (${v.rightEye?.passed}) left=${v.leftEye?.bestSnellen} (${v.leftEye?.passed}) overall=${v.overallPassed}`);
    if (v.rightEye?.bestSnellen !== '6/6') problems.push('Right eye expected 6/6, got ' + v.rightEye?.bestSnellen);
    if (v.leftEye?.bestSnellen !== '6/24') problems.push('Left eye expected 6/24, got ' + v.leftEye?.bestSnellen);
    if (v.colorVision) problems.push('Eyesight result should not contain a colour result');
  }
  if (c) {
    log(`  colour: age=${c.age} mode=${c.testMode} correct=${c.colorVision?.responses.filter(x => x.correct).length}/12 type=${c.colorVision?.possibleDeficiency} passed=${c.colorVision?.passed} overall=${c.overallPassed}`);
    if (!c.colorVision?.passed) problems.push('Color vision expected pass (6/7)');
    if (c.colorVision?.possibleDeficiency !== 'none') problems.push('Expected no colour deficiency, got ' + c.colorVision?.possibleDeficiency);
    if (c.rightEye || c.leftEye) problems.push('Colour result should not contain eye results');
  }

  // ---------- History ----------
  await clickText('View Past Results');
  await waitPath('/history');
  await sleep(400);
  await screenshot('history');

  // ---------- Hindi smoke test ----------
  await send('Page.navigate', { url: BASE + '/' });
  await waitFor(`document.body.innerText.includes('Eyesight Test')`, 'home again'); await sleep(2500);
  await clickText('Eyesight Test');
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

  // ---------- Right-to-left (Urdu) and Ol Chiki (Santali) smoke tests ----------
  for (const [label, expected, rtl] of [['اردو', 'آپ کا نام', true], ['ᱥᱟᱱᱛᱟᱲᱤ', 'ᱧᱩᱛᱩᱢ', false]]) {
    await send('Page.navigate', { url: BASE + '/' });
    await waitFor(`document.body.innerText.length > 0`, 'home'); await sleep(2500);
    // Home is shown in the previously chosen language; the start button is the first button.
    await evaluate(`document.querySelector('button').click(), true`);
    await waitPath('/language');
    await clickText(label);
    await waitPath('/name');
    await sleep(300);
    await screenshot('name-' + (rtl ? 'urdu' : 'santali'));
    if (!(await bodyText()).includes(expected)) problems.push(`${label}: name page not translated`);
    const dir = await evaluate('document.documentElement.dir');
    if (dir !== (rtl ? 'rtl' : 'ltr')) problems.push(`${label}: expected dir=${rtl ? 'rtl' : 'ltr'}, got ${dir}`);
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
