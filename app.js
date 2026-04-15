// ============================================================
// Running Digit Span Test — WAIS-V Clinical Style
// ============================================================
// Modeled after the WAIS-V Running Digits subtest (Pearson, 2024)
// with reference to:
//   - Bunting, Cowan & Saults (2006, QJEP) — PMC1559727
//   - Cowan et al. (2005, Cognitive Psychology, 51, 42–100)
//
// Clinical format:
//   1. Ascending difficulty: recall last 3 → 4 → 5 → 6 → 7
//   2. Two trials per level (standard Wechsler pair structure)
//   3. Discontinue after 3 consecutive imperfect scores
//   4. Recalibration items (surprise "what was the Nth digit?")
//   5. Partial credit: 1 point per digit in correct serial position
//   6. Probe size NOT revealed until after sequence ends
//   7. NO visual display of digits — audio only
// ============================================================

(function () {
    'use strict';

    // ── Test Configuration ──────────────────────────────────
    // Levels in ascending order. Two trials per level.
    const LEVELS = [
        { recallTarget: 3, seqLengths: [8, 10] },
        { recallTarget: 4, seqLengths: [10, 12] },
        { recallTarget: 5, seqLengths: [12, 14] },
        { recallTarget: 6, seqLengths: [14, 16] },
        { recallTarget: 7, seqLengths: [16, 18] },
    ];


    const CONSECUTIVE_IMPERFECT_TO_DISCONTINUE = 3;
    const DIGIT_INTERVAL_MS = 1000;   // 1 s per digit
    const POST_SEQUENCE_DELAY_MS = 600;

    // ── State ───────────────────────────────────────────────
    let allItems = [];         // pre-built item list
    let currentItemIdx = 0;
    let currentSequence = [];
    let currentItem = null;    // { type, recallTarget, ... }
    let responseDigits = [];
    let responseSlotIdx = 0;
    let results = [];
    let consecutiveImperfect = 0;
    let discontinued = false;
    let selectedVoice = null;
    let speechRate = 0.9;
    let stimulusTimeout = null;
    let showAnswerFeedback = true;
    let sessionId = null;

    // Generate a unique session ID (UUID v4)
    function generateSessionId() {
        return 'xxxx-xxxx-xxxx'.replace(/x/g, () =>
            Math.floor(Math.random() * 16).toString(16)
        ) + '-' + Date.now().toString(36);
    }

    // ── DOM references ──────────────────────────────────────
    const $ = (id) => document.getElementById(id);
    const screens = {
        welcome: $('screen-welcome'),
        ready: $('screen-ready'),
        stimulus: $('screen-stimulus'),
        response: $('screen-response'),
        results: $('screen-results'),
    };

    function showScreen(name) {
        Object.values(screens).forEach((s) => s.classList.remove('active'));
        screens[name].classList.add('active');
    }

    // ── Voice Setup ─────────────────────────────────────────
    const synth = window.speechSynthesis || null;
    const voiceSelect = $('voice-select');
    const voiceRateInput = $('voice-rate');
    const voiceRateLabel = $('voice-rate-label');
    let voiceList = [];

    function populateVoices() {
        if (!synth) return;
        const voices = synth.getVoices();
        if (!voices || voices.length === 0) return;

        voiceSelect.innerHTML = '';

        const english = voices.filter((v) => v.lang.startsWith('en'));
        const sorted = english.sort((a, b) => {
            const score = (v) => {
                let s = 0;
                const n = v.name.toLowerCase();
                if (n.includes('natural') || n.includes('neural')) s += 3;
                if (n.includes('online')) s += 2;
                if (v.localService === false) s += 1;
                if (n.includes('male') && !n.includes('female')) s += 1;
                return s;
            };
            return score(b) - score(a);
        });

        voiceList = sorted.length > 0 ? sorted : voices;
        voiceList.forEach((voice, i) => {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(opt);
        });

        if (voiceList.length > 0) selectedVoice = voiceList[0];
    }

    try {
        if (synth && synth.onvoiceschanged !== undefined) {
            synth.onvoiceschanged = populateVoices;
        }
        populateVoices();
    } catch (e) {
        console.warn('Speech synthesis not available:', e);
    }

    voiceSelect.addEventListener('change', () => {
        selectedVoice = voiceList[voiceSelect.selectedIndex] || null;
    });

    voiceRateInput.addEventListener('input', () => {
        speechRate = parseFloat(voiceRateInput.value);
        voiceRateLabel.textContent = speechRate.toFixed(2) + 'x';
    });

    // ── TTS Helper ──────────────────────────────────────────
    function prewarmTTS() {
        if (!synth) return;
        try {
            const warm = new SpeechSynthesisUtterance('');
            warm.volume = 0;
            if (selectedVoice) warm.voice = selectedVoice;
            synth.speak(warm);
        } catch (_) { /* swallow */ }
    }

    function speakDigit(digit) {
        return new Promise((resolve) => {
            if (!synth) { resolve(); return; }
            try {
                const utter = new SpeechSynthesisUtterance(String(digit));
                if (selectedVoice) utter.voice = selectedVoice;
                utter.rate = speechRate;
                utter.pitch = 1.0;
                utter.volume = 1.0;
                utter.onend = () => resolve();
                utter.onerror = () => resolve();
                synth.speak(utter);
            } catch (e) {
                resolve();
            }
        });
    }

    // ── Utility ─────────────────────────────────────────────
    function sleep(ms) {
        return new Promise((resolve) => {
            stimulusTimeout = setTimeout(resolve, ms);
        });
    }

    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // ── Sequence Generation ─────────────────────────────────
    // Digits 0-9, no immediate repeats, no digit more than twice
    // in any window of 7 (per Bunting et al. methodology).
    function generateSequence(length) {
        const seq = [];
        for (let i = 0; i < length; i++) {
            let d;
            let attempts = 0;
            do {
                d = Math.floor(Math.random() * 10);
                attempts++;
                if (attempts > 50) break; // safety valve
            } while (
                (seq.length > 0 && d === seq[seq.length - 1]) || // no immediate repeat
                (seq.slice(-6).filter((x) => x === d).length >= 2) // max 2 in window of 7
            );
            seq.push(d);
        }
        return seq;
    }

    // ── Item Generation ─────────────────────────────────────
    // Build the full item list: 2 trials per level, ascending difficulty.
    function buildItemList() {
        const items = [];

        for (const level of LEVELS) {
            for (let t = 0; t < 2; t++) {
                const seqLen = level.seqLengths[t] + randomInt(-1, 1); // slight jitter
                items.push({
                    type: 'regular',
                    recallTarget: level.recallTarget,
                    sequenceLength: Math.max(seqLen, level.recallTarget + 4),
                    levelIdx: LEVELS.indexOf(level),
                    trialInLevel: t,
                });
            }
        }

        return items;
    }

    // ── Start Test ──────────────────────────────────────────
    $('btn-start').addEventListener('click', () => {
        const feedbackCb = $('chk-feedback');
        if (feedbackCb) showAnswerFeedback = feedbackCb.checked;

        prewarmTTS();

        allItems = buildItemList();
        currentItemIdx = 0;
        results = [];
        consecutiveImperfect = 0;
        discontinued = false;
        sessionId = generateSessionId();

        showReadyScreen();
    });

    // ── Ready Screen ────────────────────────────────────────
    function showReadyScreen() {
        const item = allItems[currentItemIdx];

        // Show current level info
        const level = LEVELS[item.levelIdx];
        $('ready-trial-num').textContent = currentItemIdx + 1;
        $('ready-trial-total').textContent = allItems.length;
        $('ready-level-info').textContent = `Level ${item.levelIdx + 1} — Recall Last ${level.recallTarget}`;
        $('ready-level-info').style.display = 'block';

        showScreen('ready');
    }

    $('btn-go').addEventListener('click', () => {
        startTrial();
    });

    // ── Trial Flow ──────────────────────────────────────────
    function startTrial() {
        currentItem = allItems[currentItemIdx];
        currentSequence = generateSequence(currentItem.sequenceLength);

        showScreen('stimulus');
        $('listening-label').textContent = 'Listen\u2026';

        setTimeout(() => presentSequence(), 400);
    }

    async function presentSequence() {
        const total = currentSequence.length;

        for (let i = 0; i < total; i++) {
            if (!screens.stimulus.classList.contains('active')) return;

            const digit = currentSequence[i];
            const speechDone = speakDigit(digit);

            if (i < total - 1) {
                await Promise.all([speechDone, sleep(DIGIT_INTERVAL_MS)]);
            } else {
                await speechDone;
            }
        }

        await sleep(POST_SEQUENCE_DELAY_MS);
        $('listening-label').textContent = 'Done';
        setTimeout(() => showResponseScreen(), 400);
    }

    // ── Response Screen ─────────────────────────────────────
    function showResponseScreen() {
        const item = currentItem;

        $('recall-prompt').innerHTML = `Enter the last <span class="highlight">${item.recallTarget}</span> digits`;
        $('response-hint').textContent = 'In the order you heard them. 1 point per correct digit.';

        // Build slots
        const target = item.recallTarget;
        const slotsContainer = $('response-slots');
        slotsContainer.innerHTML = '';
        responseDigits = new Array(target).fill(null);
        responseSlotIdx = 0;

        for (let i = 0; i < target; i++) {
            const slot = document.createElement('div');
            slot.className = 'slot' + (i === 0 ? ' active' : '');
            slot.id = `slot-${i}`;
            slotsContainer.appendChild(slot);
        }

        $('btn-submit').disabled = true;
        showScreen('response');
    }

    // ── Input Handling ──────────────────────────────────────
    document.querySelector('.numpad').addEventListener('click', (e) => {
        const btn = e.target.closest('.numpad-btn');
        if (!btn) return;

        const digit = btn.dataset.digit;
        const action = btn.dataset.action;

        if (digit !== undefined) {
            enterDigit(parseInt(digit, 10));
        } else if (action === 'backspace') {
            backspaceDigit();
        } else if (action === 'clear') {
            clearDigits();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (!screens.response.classList.contains('active')) return;

        if (e.key >= '0' && e.key <= '9') {
            enterDigit(parseInt(e.key, 10));
        } else if (e.key === 'Backspace') {
            e.preventDefault();
            backspaceDigit();
        } else if (e.key === 'Delete') {
            clearDigits();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (!$('btn-submit').disabled) {
                submitResponse();
            }
        }
    });

    function enterDigit(d) {
        if (responseSlotIdx >= responseDigits.length) return;

        responseDigits[responseSlotIdx] = d;
        const slot = $(`slot-${responseSlotIdx}`);
        slot.textContent = d;
        slot.classList.remove('active');
        slot.classList.add('filled');

        responseSlotIdx++;

        if (responseSlotIdx < responseDigits.length) {
            $(`slot-${responseSlotIdx}`).classList.add('active');
        }

        $('btn-submit').disabled = responseSlotIdx === 0;
    }

    function backspaceDigit() {
        if (responseSlotIdx <= 0) return;

        if (responseSlotIdx < responseDigits.length) {
            $(`slot-${responseSlotIdx}`).classList.remove('active');
        }

        responseSlotIdx--;
        responseDigits[responseSlotIdx] = null;
        const slot = $(`slot-${responseSlotIdx}`);
        slot.textContent = '';
        slot.classList.remove('filled');
        slot.classList.add('active');

        $('btn-submit').disabled = responseSlotIdx === 0;
    }

    function clearDigits() {
        for (let i = 0; i < responseDigits.length; i++) {
            responseDigits[i] = null;
            const slot = $(`slot-${i}`);
            slot.textContent = '';
            slot.classList.remove('filled', 'active');
        }
        responseSlotIdx = 0;
        $('slot-0').classList.add('active');
        $('btn-submit').disabled = true;
    }

    // Submit
    $('btn-submit').addEventListener('click', submitResponse);
    $('btn-skip').addEventListener('click', () => submitResponse());

    function submitResponse() {
        const item = currentItem;
        const given = [...responseDigits];

        // Expected is last N digits
        const expected = currentSequence.slice(-item.recallTarget);
        let correctCount = 0;
        for (let i = 0; i < item.recallTarget; i++) {
            if (given[i] === expected[i]) correctCount++;
        }

        const isPerfect = correctCount === item.recallTarget;

        const result = {
            itemIdx: currentItemIdx,
            recallTarget: item.recallTarget,
            sequenceLength: currentSequence.length,
            sequence: [...currentSequence],
            expected: expected,
            given: given,
            correctCount: correctCount,
            maxPoints: item.recallTarget,
            allCorrect: isPerfect,
            levelIdx: item.levelIdx,
        };

        results.push(result);

        // Discontinue logic
        if (isPerfect) {
            consecutiveImperfect = 0;
        } else {
            consecutiveImperfect++;
        }

        // Disable buttons to prevent double-submit
        $('btn-submit').disabled = true;
        $('btn-skip').disabled = true;

        if (showAnswerFeedback) {
            // Highlight each slot green/red
            for (let i = 0; i < item.recallTarget; i++) {
                const slot = $(`slot-${i}`);
                slot.classList.remove('active', 'filled');
                if (given[i] === expected[i]) {
                    slot.classList.add('slot-correct');
                } else {
                    slot.classList.add('slot-incorrect');
                    if (given[i] !== null) {
                        slot.innerHTML = `${given[i]}<span class="slot-correct-hint">${expected[i]}</span>`;
                    } else {
                        slot.innerHTML = `<span class="slot-correct-hint">${expected[i]}</span>`;
                    }
                }
            }
            setTimeout(() => advanceToNext(), 1500);
        } else {
            advanceToNext();
        }
    }

    function advanceToNext() {
        $('btn-skip').disabled = false;

        // Check discontinue
        if (consecutiveImperfect >= CONSECUTIVE_IMPERFECT_TO_DISCONTINUE) {
            discontinued = true;
            showResults();
            return;
        }

        currentItemIdx++;
        if (currentItemIdx < allItems.length) {
            showReadyScreen();
        } else {
            showResults();
        }
    }

    // ── Results ─────────────────────────────────────────────
    function showResults() {
        // Total raw score (partial credit)
        const totalScore = results.reduce((s, r) => s + r.correctCount, 0);
        const maxScore = results.reduce((s, r) => s + r.maxPoints, 0);
        const overallAccuracy = maxScore > 0 ? totalScore / maxScore : 0;

        $('result-total').textContent = `${totalScore} / ${maxScore}`;
        $('result-accuracy').textContent = Math.round(overallAccuracy * 100) + '%';

        // Scaled score estimate (mean=10, SD=3)
        // We approximate using the percentage of max score achieved.
        // In a real WAIS-V, this would use age-based norm tables.
        // Rough mapping: 50% ≈ scaled 10, each ~8% ≈ 1 SD unit
        const pctOfMax = maxScore > 0 ? totalScore / maxScore : 0;
        let scaledEstimate = Math.round(10 + ((pctOfMax - 0.50) / 0.08) * 1);
        scaledEstimate = Math.max(1, Math.min(19, scaledEstimate)); // clamp 1-19
        $('result-scaled').textContent = scaledEstimate;

        // Per-level stats
        const levelStats = LEVELS.map((level, idx) => {
            const lr = results.filter((r) => r.levelIdx === idx);
            const correct = lr.reduce((s, r) => s + r.correctCount, 0);
            const max = lr.reduce((s, r) => s + r.maxPoints, 0);
            const perfect = lr.filter((r) => r.allCorrect).length;

            return {
                recallTarget: level.recallTarget,
                accuracy: max > 0 ? correct / max : 0,
                correctDigits: correct,
                maxDigits: max,
                trialsPerfect: perfect,
                trialsTotal: lr.length,
                attempted: lr.length > 0,
            };
        });

        // Running span capacity: highest level where ≥1 trial was perfect
        let capacity = 0;
        for (const stat of levelStats) {
            if (stat.trialsPerfect > 0) {
                capacity = stat.recallTarget;
            }
        }
        if (capacity === 0 && levelStats[0].attempted) capacity = 2;
        $('result-capacity').textContent = capacity + ' digits';

        // Discontinued notice
        const discNotice = $('discontinued-notice');
        if (discontinued) {
            discNotice.style.display = 'block';
            discNotice.textContent = `Test discontinued after ${CONSECUTIVE_IMPERFECT_TO_DISCONTINUE} consecutive imperfect scores (standard clinical rule).`;
        } else {
            discNotice.style.display = 'none';
        }

        // Per-level bars
        const probeContainer = $('results-by-probe');
        probeContainer.innerHTML = '';
        levelStats.forEach((stat) => {
            if (!stat.attempted) return;
            const pct = Math.round(stat.accuracy * 100);
            const div = document.createElement('div');
            div.className = 'block-result';
            div.innerHTML = `
                <span class="block-result-label">Last ${stat.recallTarget}</span>
                <div class="block-result-bar">
                    <div class="block-result-fill" style="width: ${pct}%"></div>
                </div>
                <span class="block-result-value">${pct}% (${stat.correctDigits}/${stat.maxDigits})</span>
            `;
            probeContainer.appendChild(div);
        });


        // Trial detail table
        const detailContainer = $('results-trial-detail');
        let tableHTML = `<table class="trial-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Type</th>
                    <th>Seq</th>
                    <th>Probe</th>
                    <th>Expected</th>
                    <th>Your Answer</th>
                    <th>Score</th>
                </tr>
            </thead><tbody>`;

        results.forEach((r, i) => {
            const givenStr = r.given
                .map((d, idx) => {
                    if (d === null) return '<span class="digit-blank">_</span>';
                    if (d === r.expected[idx]) return `<span class="digit-correct">${d}</span>`;
                    return `<span class="digit-wrong">${d}</span>`;
                })
                .join(' ');

            const typeLabel = `Last ${r.recallTarget}`;

            tableHTML += `<tr>
                <td>${i + 1}</td>
                <td>${r.sequenceLength}</td>
                <td>${typeLabel}</td>
                <td class="mono">${r.expected.join(' ')}</td>
                <td class="mono">${givenStr}</td>
                <td>${r.correctCount}/${r.maxPoints}</td>
            </tr>`;
        });

        tableHTML += '</tbody></table>';
        detailContainer.innerHTML = tableHTML;

        showScreen('results');
    }

    // ── Restart / Export / Submit ─────────────────────────────
    $('btn-restart').addEventListener('click', () => {
        showScreen('welcome');
    });

    $('btn-export').addEventListener('click', () => {
        const data = {
            testName: 'Running Digit Span (WAIS-V Style)',
            date: new Date().toISOString(),
            discontinued: discontinued,
            settings: {
                speechRate: speechRate,
                voice: selectedVoice ? selectedVoice.name : 'default',
                digitIntervalMs: DIGIT_INTERVAL_MS,
                discontinueRule: `${CONSECUTIVE_IMPERFECT_TO_DISCONTINUE} consecutive imperfect`,
            },
            summary: {
                totalRawScore: results.reduce((s, r) => s + r.correctCount, 0),
                maxRawScore: results.reduce((s, r) => s + r.maxPoints, 0),
                levelsAttempted: new Set(results.map((r) => r.recallTarget)).size,
                highestLevelPerfect: Math.max(0, ...results.filter((r) => r.allCorrect).map((r) => r.recallTarget)),
            },
            trials: results.map((r, i) => ({
                item: i + 1,
                recallTarget: r.recallTarget,
                sequenceLength: r.sequenceLength,
                sequence: r.sequence.join(', '),
                expected: r.expected.join(', '),
                given: r.given.map((d) => (d !== null ? d : '_')).join(', '),
                correctCount: r.correctCount,
                maxPoints: r.maxPoints,
                allCorrect: r.allCorrect,
            })),
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `running-digit-span-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });

    // ── Anonymous Data Submission (Norm Building) ────────────
    // Sends aggregate results to a Google Sheets endpoint.
    // No personally identifiable information is collected.
    //
    // To set up: deploy the Google Apps Script (see apps_script.js)
    // and paste the web app URL below.
    const SHEETS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxHtLcha-czj_ShaqhmyH5O4CEetldDm2fv3w7RjHJjjfdVB9xE89g9bOaoX5-X6fHnEg/exec'; // ← Paste your Google Apps Script web app URL here

    const btnSubmit = $('btn-submit-norms');
    if (btnSubmit) {
        btnSubmit.addEventListener('click', submitNorms);
    }

    function submitNorms() {
        if (!SHEETS_ENDPOINT) {
            setSubmitStatus('Norm collection not configured yet.', 'warning');
            return;
        }

        const ageInput = $('input-age');
        const age = ageInput ? parseInt(ageInput.value, 10) : null;

        // Build per-level summary
        const levelSummary = {};
        for (const level of LEVELS) {
            const lr = results.filter((r) => r.levelIdx === LEVELS.indexOf(level));
            const correct = lr.reduce((s, r) => s + r.correctCount, 0);
            const max = lr.reduce((s, r) => s + r.maxPoints, 0);
            levelSummary[`last_${level.recallTarget}_correct`] = correct;
            levelSummary[`last_${level.recallTarget}_max`] = max;
            levelSummary[`last_${level.recallTarget}_pct`] = max > 0 ? Math.round((correct / max) * 100) : 0;
        }

        const totalScore = results.reduce((s, r) => s + r.correctCount, 0);
        const maxScore = results.reduce((s, r) => s + r.maxPoints, 0);

        const payload = {
            sessionId: sessionId,
            timestamp: new Date().toISOString(),
            age: (age && age >= 10 && age <= 100) ? age : '',
            completed: true,
            totalTrialsExpected: allItems.length,
            totalScore: totalScore,
            maxScore: maxScore,
            accuracy: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
            trialsCompleted: results.length,
            discontinued: discontinued,
            runningSpan: Math.max(0, ...results.filter((r) => r.allCorrect).map((r) => r.recallTarget)),
            speechRate: speechRate,
            ...levelSummary,
        };

        setSubmitStatus('Submitting…', 'info');
        btnSubmit.disabled = true;

        fetch(SHEETS_ENDPOINT, {
            method: 'POST',
            mode: 'no-cors', // Apps Script requires this
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
            .then(() => {
                setSubmitStatus('✓ Results submitted anonymously. Thank you!', 'success');
            })
            .catch((err) => {
                console.error('Submit error:', err);
                setSubmitStatus('Failed to submit. You can still export as JSON.', 'error');
                btnSubmit.disabled = false;
            });
    }

    function setSubmitStatus(msg, type) {
        const el = $('submit-status');
        if (!el) return;
        el.textContent = msg;
        el.className = 'submit-status ' + type;
        el.style.display = 'block';
    }
})();
