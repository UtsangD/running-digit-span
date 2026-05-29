// ============================================================
// Arithmetic Test - WAIS-inspired mental calculation task
// ============================================================
// Public sources confirm WAIS-IV Arithmetic is a 22-item,
// timed, orally administered Working Memory subtest. Official
// WAIS item text and age norms are proprietary, so this file uses
// original practice items and records item-level data for local
// norm building.
// ============================================================

(function () {
    'use strict';

    const ITEM_COUNT = 22;
    const TIME_LIMIT_MS = 30000;
    const MAX_REPEATS = 1;

    const TIER_CONFIG = [
        { id: 'very_easy', label: 'Very Easy', selectCount: 4, seedAccuracy: 0.95, seedMedianSeconds: 7 },
        { id: 'easy', label: 'Easy', selectCount: 6, seedAccuracy: 0.86, seedMedianSeconds: 11 },
        { id: 'medium', label: 'Medium', selectCount: 8, seedAccuracy: 0.72, seedMedianSeconds: 17 },
        { id: 'semi_hard', label: 'Semi-Hard', selectCount: 4, seedAccuracy: 0.58, seedMedianSeconds: 24 },
    ];

    const QUESTION_BANK = [
        {
            id: 'AR-VE-01',
            tier: 'very_easy',
            prompt: 'If you have 3 apples and buy 4 more, how many apples do you have in total?',
            answer: 7,
            concept: 'Simple addition',
        },
        {
            id: 'AR-VE-02',
            tier: 'very_easy',
            prompt: 'A box holds 10 pencils. If you take out 3, how many pencils are left in the box?',
            answer: 7,
            concept: 'Simple subtraction',
        },
        {
            id: 'AR-VE-03',
            tier: 'very_easy',
            prompt: 'Tom has 5 books and Susan has 6 books. How many books do they have together?',
            answer: 11,
            concept: 'Simple addition',
        },
        {
            id: 'AR-VE-04',
            tier: 'very_easy',
            prompt: 'A movie ticket costs 8 dollars. How much do 2 tickets cost?',
            answer: 16,
            concept: 'Simple multiplication',
        },
        {
            id: 'AR-VE-05',
            tier: 'very_easy',
            prompt: 'You start with 15 marbles and lose 5 of them. How many marbles do you have left?',
            answer: 10,
            concept: 'Simple subtraction',
        },
        {
            id: 'AR-VE-06',
            tier: 'very_easy',
            prompt: 'A baker makes 12 cupcakes and sells 4 of them. How many cupcakes are left?',
            answer: 8,
            concept: 'Simple subtraction',
        },
        {
            id: 'AR-VE-07',
            tier: 'very_easy',
            prompt: 'If a plant grows 2 inches every week, how many inches will it grow in 4 weeks?',
            answer: 8,
            concept: 'Linear scaling',
        },
        {
            id: 'AR-VE-08',
            tier: 'very_easy',
            prompt: 'A pack of gum has 8 pieces. If you share 3 pieces with friends, how many pieces do you keep?',
            answer: 5,
            concept: 'Simple subtraction',
        },
        {
            id: 'AR-VE-09',
            tier: 'very_easy',
            prompt: 'You have 20 dollars and spend 6 dollars on lunch. How much money do you have left?',
            answer: 14,
            concept: 'Currency subtraction',
        },
        {
            id: 'AR-VE-10',
            tier: 'very_easy',
            prompt: 'A bus has 14 passengers. At the first stop, 3 passengers get off. How many passengers remain?',
            answer: 11,
            concept: 'Tracking quantities',
        },
        {
            id: 'AR-E-01',
            tier: 'easy',
            prompt: 'If you buy 3 sodas for 2 dollars each and a bag of chips for 3 dollars, what is the total cost?',
            answer: 9,
            concept: 'Order of operations',
        },
        {
            id: 'AR-E-02',
            tier: 'easy',
            prompt: 'A car travels at a steady speed of 40 miles per hour. How far will it travel in 3 hours?',
            answer: 120,
            concept: 'Rate and distance',
        },
        {
            id: 'AR-E-03',
            tier: 'easy',
            prompt: 'A teacher divides 24 students into equal groups of 4. How many groups are there?',
            answer: 6,
            concept: 'Simple division',
        },
        {
            id: 'AR-E-04',
            tier: 'easy',
            prompt: 'Mark has 18 baseball cards. He gives half of them to his brother. How many cards does Mark have left?',
            answer: 9,
            concept: 'Basic fractions',
        },
        {
            id: 'AR-E-05',
            tier: 'easy',
            prompt: 'A pizza is cut into 8 slices. If 3 people eat 2 slices each, how many slices are left?',
            answer: 2,
            concept: 'Multi-step tracking',
        },
        {
            id: 'AR-E-06',
            tier: 'easy',
            prompt: 'You buy a book for 13 dollars and pay with a 20 dollar bill. How much change do you receive?',
            answer: 7,
            concept: 'Change making',
        },
        {
            id: 'AR-E-07',
            tier: 'easy',
            prompt: 'A runner completes 4 laps of a track. Each lap takes 90 seconds. How many total seconds did it take?',
            answer: 360,
            concept: 'Double-digit product',
        },
        {
            id: 'AR-E-08',
            tier: 'easy',
            prompt: 'If 5 identical shirts cost a total of 50 dollars, how much does one shirt cost?',
            answer: 10,
            concept: 'Unit pricing',
        },
        {
            id: 'AR-E-09',
            tier: 'easy',
            prompt: 'A water tank holds 50 gallons. If 15 gallons leak out and you then add 5 gallons, how much is left?',
            answer: 40,
            concept: 'Sequential tracking',
        },
        {
            id: 'AR-E-10',
            tier: 'easy',
            prompt: 'A box contains 3 red balls, 4 blue balls, and 5 green balls. How many balls are in the box in total?',
            answer: 12,
            concept: 'Three-value summation',
        },
        {
            id: 'AR-M-01',
            tier: 'medium',
            prompt: 'A shirt regularly costs 40 dollars but is on sale for 25 percent off. What is the sale price of the shirt?',
            answer: 30,
            concept: 'Percentage discount',
        },
        {
            id: 'AR-M-02',
            tier: 'medium',
            prompt: 'You work for 5 hours at a rate of 12 dollars per hour. If you spend 15 dollars on dinner, how much remains?',
            answer: 45,
            concept: 'Earnings minus expense',
        },
        {
            id: 'AR-M-03',
            tier: 'medium',
            prompt: 'An office orders 6 boxes of pens. Each box contains 12 pens. If they use 20 pens, how many are left?',
            answer: 52,
            concept: 'Multiplication and subtraction',
        },
        {
            id: 'AR-M-04',
            tier: 'medium',
            prompt: 'A train leaves with 100 passengers. At the first stop, 20 get off and 10 get on. How many are on it now?',
            answer: 90,
            concept: 'Flow tracking',
        },
        {
            id: 'AR-M-05',
            tier: 'medium',
            prompt: 'If 3 pounds of apples cost 6 dollars, how much would 7 pounds of apples cost?',
            answer: 14,
            concept: 'Ratio scaling',
        },
        {
            id: 'AR-M-06',
            tier: 'medium',
            prompt: 'A library book is overdue by 5 days. The fine is 50 cents per day. If you pay with a 5 dollar bill, what is your change?',
            answer: 2.5,
            answerText: '2.50',
            tolerance: 0.01,
            concept: 'Decimal manipulation',
        },
        {
            id: 'AR-M-07',
            tier: 'medium',
            prompt: 'A rectangular garden is 6 feet wide and 8 feet long. What is the total perimeter of the garden?',
            answer: 28,
            concept: 'Geometric logic',
        },
        {
            id: 'AR-M-08',
            tier: 'medium',
            prompt: 'You are reading a 120 page book. If you read 15 pages a day for 4 days, how many pages are left?',
            answer: 60,
            concept: 'Remaining work',
        },
        {
            id: 'AR-M-09',
            tier: 'medium',
            prompt: 'A group of 4 friends splits a 48 dollar bill equally. If each friend leaves a 2 dollar tip, how much does each pay?',
            answer: 14,
            concept: 'Split-cost analysis',
        },
        {
            id: 'AR-M-10',
            tier: 'medium',
            prompt: 'If a clock reads 2:45 PM, how many minutes must pass before it reaches 4:15 PM?',
            answer: 90,
            concept: 'Time-based tracking',
        },
        {
            id: 'AR-SH-01',
            tier: 'semi_hard',
            prompt: 'A store buys a bicycle for 120 dollars and sells it for a 50 percent profit. What is the selling price?',
            answer: 180,
            concept: 'Markup calculation',
        },
        {
            id: 'AR-SH-02',
            tier: 'semi_hard',
            prompt: 'A taxi charges a base fee of 4 dollars plus 2 dollars per mile. If the total fare is 24 dollars, how many miles were driven?',
            answer: 10,
            concept: 'Linear equation tracking',
        },
        {
            id: 'AR-SH-03',
            tier: 'semi_hard',
            prompt: 'Three people invest money in a 3 to 2 to 1 ratio. If the total investment is 6000 dollars, how much did the middle person invest?',
            answer: 2000,
            concept: 'Proportional ratio split',
        },
        {
            id: 'AR-SH-04',
            tier: 'semi_hard',
            prompt: 'A pool fills at 15 gallons per minute and leaks at 3 gallons per minute. What is the net volume gain in 10 minutes?',
            answer: 120,
            concept: 'Net rate accumulation',
        },
        {
            id: 'AR-SH-05',
            tier: 'semi_hard',
            prompt: 'You buy 2 books for 15 dollars each and 3 notebooks for 4 dollars each. If tax adds 3 dollars, what is the total?',
            answer: 45,
            concept: 'Compound purchases',
        },
        {
            id: 'AR-SH-06',
            tier: 'semi_hard',
            prompt: 'If 4 workers can complete a project in 6 hours, how many hours would it take 2 workers at the same pace?',
            answer: 12,
            concept: 'Inverse proportions',
        },
        {
            id: 'AR-SH-07',
            tier: 'semi_hard',
            prompt: 'A student scores 80, 85, and 95 on three exams. What must they score on the fourth to average exactly 88?',
            answer: 92,
            concept: 'Mean averaging target',
        },
        {
            id: 'AR-SH-08',
            tier: 'semi_hard',
            prompt: 'An item costing 100 dollars is discounted by 20 percent, and then the new price is discounted by 10 percent. What is the final price?',
            answer: 72,
            concept: 'Successive percentages',
        },
        {
            id: 'AR-SH-09',
            tier: 'semi_hard',
            prompt: 'A container holds 4 liters of a mixture that is 25 percent acid. If you add 1 liter of pure water, what is the new acid percentage?',
            answer: 20,
            concept: 'Solution dilution',
        },
        {
            id: 'AR-SH-10',
            tier: 'semi_hard',
            prompt: 'John is twice as old as Mary. In 5 years, the sum of their ages will be 31. How old is John right now?',
            answer: 14,
            concept: 'Systems of equations',
        },
    ];

    let allItems = [];
    let currentItemIdx = 0;
    let currentItem = null;
    let results = [];
    let sessionId = null;
    let selectedVoice = null;
    let speechRate = 0.95;
    let voiceList = [];
    let showAnswerFeedback = true;
    let timerInterval = null;
    let responseStartMs = 0;
    let responseDeadlineMs = 0;
    let submitted = false;
    let repeatsUsed = 0;

    const $ = (id) => document.getElementById(id);

    const screens = {
        welcome: $('arith-screen-welcome'),
        ready: $('arith-screen-ready'),
        stimulus: $('arith-screen-stimulus'),
        response: $('arith-screen-response'),
        results: $('arith-screen-results'),
    };

    const synth = window.speechSynthesis || null;
    const voiceSelect = $('arith-voice-select');
    const voiceRateInput = $('arith-voice-rate');
    const voiceRateLabel = $('arith-voice-rate-label');

    function generateSessionId() {
        return 'arith-xxxx-xxxx-xxxx'.replace(/x/g, () =>
            Math.floor(Math.random() * 16).toString(16)
        ) + '-' + Date.now().toString(36);
    }

    function showScreen(name) {
        Object.values(screens).forEach((screen) => screen.classList.remove('active'));
        screens[name].classList.add('active');
    }

    function getTierConfig(tierId) {
        return TIER_CONFIG.find((tier) => tier.id === tierId);
    }

    function shuffle(items) {
        const out = [...items];
        for (let i = out.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [out[i], out[j]] = [out[j], out[i]];
        }
        return out;
    }

    function buildSessionItems() {
        const selected = [];
        TIER_CONFIG.forEach((tier) => {
            const tierItems = QUESTION_BANK.filter((item) => item.tier === tier.id);
            selected.push(...shuffle(tierItems).slice(0, tier.selectCount));
        });
        return selected.slice(0, ITEM_COUNT).map((item, idx) => ({
            ...item,
            position: idx + 1,
            seedAccuracy: getTierConfig(item.tier).seedAccuracy,
            seedMedianSeconds: getTierConfig(item.tier).seedMedianSeconds,
        }));
    }

    function populateVoices() {
        if (!synth) {
            voiceSelect.disabled = true;
            return;
        }

        const voices = synth.getVoices();
        if (!voices || voices.length === 0) return;

        voiceSelect.innerHTML = '';

        const english = voices.filter((voice) => voice.lang.startsWith('en'));
        const sorted = english.sort((a, b) => {
            const score = (voice) => {
                let value = 0;
                const name = voice.name.toLowerCase();
                if (name.includes('natural') || name.includes('neural')) value += 3;
                if (name.includes('online')) value += 2;
                if (voice.localService === false) value += 1;
                return value;
            };
            return score(b) - score(a);
        });

        voiceList = sorted.length > 0 ? sorted : voices;
        voiceList.forEach((voice, i) => {
            const opt = document.createElement('option');
            opt.value = String(i);
            opt.textContent = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(opt);
        });

        selectedVoice = voiceList[0] || null;
    }

    try {
        if (synth && synth.onvoiceschanged !== undefined) {
            synth.onvoiceschanged = populateVoices;
        }
        populateVoices();
    } catch (err) {
        console.warn('Speech synthesis not available:', err);
    }

    voiceSelect.addEventListener('change', () => {
        selectedVoice = voiceList[voiceSelect.selectedIndex] || null;
    });

    voiceRateInput.addEventListener('input', () => {
        speechRate = parseFloat(voiceRateInput.value);
        voiceRateLabel.textContent = speechRate.toFixed(2) + 'x';
    });

    function prewarmTTS() {
        if (!synth) return;
        try {
            const warm = new SpeechSynthesisUtterance('');
            warm.volume = 0;
            if (selectedVoice) warm.voice = selectedVoice;
            synth.speak(warm);
        } catch (_) {
            // Ignore browser-specific TTS failures.
        }
    }

    function speakText(text) {
        return new Promise((resolve) => {
            if (!synth) {
                resolve(false);
                return;
            }

            try {
                synth.cancel();
                const utter = new SpeechSynthesisUtterance(text);
                if (selectedVoice) utter.voice = selectedVoice;
                utter.rate = speechRate;
                utter.pitch = 1;
                utter.volume = 1;
                utter.onend = () => resolve(true);
                utter.onerror = () => resolve(false);
                synth.speak(utter);
            } catch (err) {
                resolve(false);
            }
        });
    }

    function formatAnswer(item) {
        if (item.answerText) return item.answerText;
        if (Number.isInteger(item.answer)) return String(item.answer);
        return String(item.answer);
    }

    function parseNumericAnswer(raw) {
        const text = raw.trim().toLowerCase().replace(/,/g, '').replace(/\$/g, '');
        if (!text) return null;

        const fraction = text.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)/);
        if (fraction) {
            const numerator = Number(fraction[1]);
            const denominator = Number(fraction[2]);
            if (denominator !== 0) return numerator / denominator;
        }

        const match = text.match(/-?\d+(?:\.\d+)?/);
        return match ? Number(match[0]) : null;
    }

    function isCorrectAnswer(item, raw) {
        const parsed = parseNumericAnswer(raw);
        if (parsed === null || Number.isNaN(parsed)) return false;

        const tolerance = item.tolerance !== undefined ? item.tolerance : 0.001;
        const accepted = item.acceptedAnswers || [item.answer];
        return accepted.some((answer) => Math.abs(parsed - answer) <= tolerance);
    }

    function escapeHTML(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function cdfApprox(z) {
        if (z < -6) return 0;
        if (z > 6) return 1;
        const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
        const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
        const sign = z < 0 ? -1 : 1;
        const x = Math.abs(z) / Math.sqrt(2);
        const t = 1 / (1 + p * x);
        const erf = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        return 0.5 * (1 + sign * erf);
    }

    function ordinal(n) {
        const suffixes = ['th', 'st', 'nd', 'rd'];
        const value = n % 100;
        return n + (suffixes[(value - 20) % 10] || suffixes[value] || suffixes[0]) + ' percentile';
    }

    function estimateScaledScore(rawScore) {
        const draftMeanRaw = 15;
        const draftRawSd = 3.5;
        const scaled = Math.round(10 + ((rawScore - draftMeanRaw) / draftRawSd) * 3);
        return Math.max(1, Math.min(19, scaled));
    }

    function classifyScaledScore(scaled) {
        if (scaled >= 16) return 'Very High';
        if (scaled >= 14) return 'High';
        if (scaled >= 12) return 'High Average';
        if (scaled >= 8) return 'Average';
        if (scaled >= 6) return 'Low Average';
        if (scaled >= 4) return 'Low';
        return 'Very Low';
    }

    $('arith-btn-start').addEventListener('click', () => {
        const feedbackCb = $('arith-chk-feedback');
        showAnswerFeedback = feedbackCb ? feedbackCb.checked : true;

        prewarmTTS();
        sessionId = generateSessionId();
        allItems = buildSessionItems();
        currentItemIdx = 0;
        currentItem = null;
        results = [];
        showReadyScreen();
    });

    $('arith-btn-go').addEventListener('click', startTrial);

    $('arith-btn-repeat').addEventListener('click', async () => {
        if (submitted || repeatsUsed >= MAX_REPEATS) return;
        repeatsUsed++;
        updateRepeatButton();
        setItemFeedback('Repeating question...', 'info');
        const spoke = await speakText(currentItem.prompt);
        if (!spoke) {
            $('arith-question-fallback').hidden = false;
        }
        if (!submitted) {
            setItemFeedback('', '');
            updateRepeatButton();
            $('arith-answer').focus();
        }
    });

    $('arith-btn-submit').addEventListener('click', () => submitCurrentItem());
    $('arith-btn-skip').addEventListener('click', () => submitCurrentItem({ skipped: true }));

    $('arith-answer').addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            submitCurrentItem();
        }
    });

    $('arith-btn-restart').addEventListener('click', () => {
        clearTimer();
        if (synth) synth.cancel();
        showScreen('welcome');
    });

    $('arith-btn-export').addEventListener('click', exportResults);

    const btnSubmitNorms = $('arith-btn-submit-norms');
    if (btnSubmitNorms) {
        btnSubmitNorms.addEventListener('click', submitNorms);
    }

    function showReadyScreen() {
        const item = allItems[currentItemIdx];
        const tier = getTierConfig(item.tier);

        $('arith-ready-item-num').textContent = String(currentItemIdx + 1);
        $('arith-ready-item-total').textContent = String(allItems.length);
        $('arith-ready-tier-info').textContent = `${tier.label} - ${item.concept}`;
        $('arith-btn-go').disabled = false;
        showScreen('ready');
    }

    function startTrial() {
        currentItem = allItems[currentItemIdx];
        submitted = false;
        repeatsUsed = 0;

        $('arith-btn-go').disabled = true;
        $('arith-listening-label').textContent = 'Listen...';
        showScreen('stimulus');

        setTimeout(async () => {
            const spoke = await speakText(currentItem.prompt);
            $('arith-listening-label').textContent = 'Done';
            setTimeout(() => showResponseScreen(spoke), 250);
        }, 250);
    }

    function showResponseScreen(spoke) {
        $('arith-response-item-num').textContent = String(currentItemIdx + 1);
        $('arith-response-item-total').textContent = String(allItems.length);
        $('arith-answer').value = '';
        $('arith-answer').disabled = false;
        $('arith-btn-submit').disabled = false;
        $('arith-btn-skip').disabled = false;
        setItemFeedback('', '');

        const fallback = $('arith-question-fallback');
        fallback.textContent = currentItem.prompt;
        fallback.hidden = spoke;

        updateRepeatButton();
        showScreen('response');
        startTimer();

        setTimeout(() => $('arith-answer').focus(), 0);
    }

    function updateRepeatButton() {
        const repeatBtn = $('arith-btn-repeat');
        if (!synth) {
            repeatBtn.disabled = true;
            repeatBtn.textContent = 'Audio Unavailable';
            return;
        }
        repeatBtn.disabled = submitted || repeatsUsed >= MAX_REPEATS;
        repeatBtn.textContent = repeatsUsed >= MAX_REPEATS ? 'Repeat Used' : 'Repeat Question';
    }

    function startTimer() {
        clearTimer();
        responseStartMs = performance.now();
        responseDeadlineMs = responseStartMs + TIME_LIMIT_MS;
        updateTimerDisplay();
        timerInterval = setInterval(updateTimerDisplay, 100);
    }

    function clearTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function updateTimerDisplay() {
        const remainingMs = Math.max(0, responseDeadlineMs - performance.now());
        const remainingSeconds = Math.ceil(remainingMs / 1000);
        const pct = Math.max(0, Math.min(100, (remainingMs / TIME_LIMIT_MS) * 100));

        $('arith-time-left').textContent = String(remainingSeconds);
        const fill = $('arith-timer-fill');
        fill.style.width = pct + '%';
        fill.classList.toggle('timer-low', remainingMs <= 5000);

        if (remainingMs <= 0) {
            submitCurrentItem({ timedOut: true });
        }
    }

    function submitCurrentItem(options = {}) {
        if (submitted || !currentItem) return;

        submitted = true;
        clearTimer();
        if (synth) synth.cancel();

        const rawAnswer = $('arith-answer').value.trim();
        const responseTimeMs = Math.min(TIME_LIMIT_MS, Math.max(0, performance.now() - responseStartMs));
        const skipped = options.skipped === true;
        const timedOut = options.timedOut === true;
        const answered = rawAnswer.length > 0 && !skipped;
        const correct = answered && isCorrectAnswer(currentItem, rawAnswer);

        const result = {
            itemPosition: currentItemIdx + 1,
            itemId: currentItem.id,
            tier: currentItem.tier,
            tierLabel: getTierConfig(currentItem.tier).label,
            concept: currentItem.concept,
            prompt: currentItem.prompt,
            correctAnswer: formatAnswer(currentItem),
            rawAnswer: rawAnswer,
            correct: correct,
            score: correct ? 1 : 0,
            responseTimeMs: Math.round(responseTimeMs),
            timedOut: timedOut,
            skipped: skipped,
            repeatCount: repeatsUsed,
            seedAccuracy: currentItem.seedAccuracy,
            seedMedianSeconds: currentItem.seedMedianSeconds,
        };
        results.push(result);

        $('arith-answer').disabled = true;
        $('arith-btn-submit').disabled = true;
        $('arith-btn-skip').disabled = true;
        updateRepeatButton();

        if (showAnswerFeedback) {
            if (correct) {
                setItemFeedback('Correct', 'success');
                setTimeout(advanceToNext, 700);
            } else {
                const prefix = timedOut ? 'Time expired. ' : '';
                setItemFeedback(`${prefix}Correct answer: ${formatAnswer(currentItem)}`, 'error');
                setTimeout(advanceToNext, 1700);
            }
        } else {
            advanceToNext();
        }
    }

    function setItemFeedback(message, type) {
        const el = $('arith-feedback');
        el.textContent = message;
        el.className = type ? 'item-feedback ' + type : 'item-feedback';
    }

    function advanceToNext() {
        currentItemIdx++;
        if (currentItemIdx < allItems.length) {
            showReadyScreen();
        } else {
            showResults();
        }
    }

    function getSummary() {
        const totalScore = results.reduce((sum, result) => sum + result.score, 0);
        const responseTimes = results.map((result) => result.responseTimeMs).filter((ms) => Number.isFinite(ms));
        const meanResponseTimeMs = responseTimes.length > 0
            ? Math.round(responseTimes.reduce((sum, ms) => sum + ms, 0) / responseTimes.length)
            : 0;
        const repeats = results.reduce((sum, result) => sum + result.repeatCount, 0);
        const timedOutCount = results.filter((result) => result.timedOut).length;
        const skippedCount = results.filter((result) => result.skipped).length;
        const scaledEstimate = estimateScaledScore(totalScore);
        const z = (scaledEstimate - 10) / 3;
        const percentile = Math.round(cdfApprox(z) * 100);

        return {
            totalScore,
            maxScore: allItems.length,
            accuracy: allItems.length > 0 ? totalScore / allItems.length : 0,
            meanResponseTimeMs,
            repeatCount: repeats,
            timedOutCount,
            skippedCount,
            scaledEstimate,
            classification: classifyScaledScore(scaledEstimate),
            percentile,
        };
    }

    function showResults() {
        const summary = getSummary();

        $('arith-result-scaled').textContent = String(summary.scaledEstimate);
        $('arith-result-classification').textContent = summary.classification;
        $('arith-result-percentile').textContent = ordinal(summary.percentile);
        $('arith-result-total').textContent = `${summary.totalScore} / ${summary.maxScore}`;
        $('arith-result-accuracy').textContent = Math.round(summary.accuracy * 100) + '%';
        $('arith-result-avg-time').textContent = (summary.meanResponseTimeMs / 1000).toFixed(1) + 's';
        $('arith-result-repeats').textContent = String(summary.repeatCount);

        renderTierResults();
        renderItemDetail();
        showScreen('results');
    }

    function renderTierResults() {
        const container = $('arith-results-by-tier');
        container.innerHTML = '';

        TIER_CONFIG.forEach((tier) => {
            const tierResults = results.filter((result) => result.tier === tier.id);
            if (tierResults.length === 0) return;

            const correct = tierResults.reduce((sum, result) => sum + result.score, 0);
            const pct = Math.round((correct / tierResults.length) * 100);
            const div = document.createElement('div');
            div.className = 'block-result';
            div.innerHTML = `
                <span class="block-result-label">${escapeHTML(tier.label)}</span>
                <div class="block-result-bar">
                    <div class="block-result-fill" style="width: ${pct}%"></div>
                </div>
                <span class="block-result-value">${pct}% (${correct}/${tierResults.length})</span>
            `;
            container.appendChild(div);
        });
    }

    function renderItemDetail() {
        const detailContainer = $('arith-results-item-detail');
        let tableHTML = `<table class="trial-table arithmetic-detail-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Tier</th>
                    <th>Question</th>
                    <th>Your Answer</th>
                    <th>Correct</th>
                    <th>Score</th>
                    <th>Time</th>
                    <th>Repeat</th>
                </tr>
            </thead><tbody>`;

        results.forEach((result) => {
            const answer = result.rawAnswer ? escapeHTML(result.rawAnswer) : '<span class="digit-blank">_</span>';
            const correctClass = result.correct ? 'digit-correct' : 'digit-wrong';
            tableHTML += `<tr>
                <td>${result.itemPosition}</td>
                <td>${escapeHTML(result.tierLabel)}</td>
                <td class="question-cell">${escapeHTML(result.prompt)}</td>
                <td class="mono">${answer}</td>
                <td class="mono">${escapeHTML(result.correctAnswer)}</td>
                <td><span class="${correctClass}">${result.score}/1</span></td>
                <td>${(result.responseTimeMs / 1000).toFixed(1)}s</td>
                <td>${result.repeatCount}</td>
            </tr>`;
        });

        tableHTML += '</tbody></table>';
        detailContainer.innerHTML = tableHTML;
    }

    function buildExportPayload() {
        const summary = getSummary();
        return {
            testType: 'arithmetic_wais_style',
            testName: 'Arithmetic (WAIS-inspired)',
            schemaVersion: 1,
            sessionId: sessionId,
            timestamp: new Date().toISOString(),
            completed: results.length === allItems.length,
            settings: {
                itemCount: ITEM_COUNT,
                timeLimitMs: TIME_LIMIT_MS,
                maxRepeatsPerItem: MAX_REPEATS,
                speechRate: speechRate,
                voice: selectedVoice ? selectedVoice.name : 'default',
                itemSelection: TIER_CONFIG.map((tier) => `${tier.label}: ${tier.selectCount}`).join(', '),
            },
            survey: {
                age: getOptionalAge('arith-input-age'),
                caitWmi: getOptionalStandardScore('arith-input-cait-wmi'),
                coreWmi: getOptionalStandardScore('arith-input-core-wmi'),
            },
            summary: {
                totalScore: summary.totalScore,
                maxScore: summary.maxScore,
                accuracy: Math.round(summary.accuracy * 100),
                meanResponseTimeMs: summary.meanResponseTimeMs,
                repeatCount: summary.repeatCount,
                timedOutCount: summary.timedOutCount,
                skippedCount: summary.skippedCount,
                scaledEstimate: summary.scaledEstimate,
                classification: summary.classification,
                percentile: summary.percentile,
            },
            items: results.map((result) => ({
                itemPosition: result.itemPosition,
                itemId: result.itemId,
                tier: result.tier,
                tierLabel: result.tierLabel,
                concept: result.concept,
                prompt: result.prompt,
                correctAnswer: result.correctAnswer,
                rawAnswer: result.rawAnswer,
                score: result.score,
                correct: result.correct,
                responseTimeMs: result.responseTimeMs,
                timedOut: result.timedOut,
                skipped: result.skipped,
                repeatCount: result.repeatCount,
                seedAccuracy: result.seedAccuracy,
                seedMedianSeconds: result.seedMedianSeconds,
            })),
        };
    }

    function exportResults() {
        const data = buildExportPayload();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `arithmetic-wais-style-${new Date().toISOString().slice(0, 10)}.json`;
        anchor.click();
        URL.revokeObjectURL(url);
    }

    const SHEETS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxHtLcha-czj_ShaqhmyH5O4CEetldDm2fv3w7RjHJjjfdVB9xE89g9bOaoX5-X6fHnEg/exec';

    function submitNorms() {
        if (!SHEETS_ENDPOINT) {
            setSubmitStatus('Norm collection is not configured yet.', 'warning');
            return;
        }

        const age = getOptionalAge('arith-input-age');
        const caitWmi = getOptionalStandardScore('arith-input-cait-wmi');
        const coreWmi = getOptionalStandardScore('arith-input-core-wmi');
        const summary = getSummary();

        const tierSummary = {};
        TIER_CONFIG.forEach((tier) => {
            const tierResults = results.filter((result) => result.tier === tier.id);
            const correct = tierResults.reduce((sum, result) => sum + result.score, 0);
            tierSummary[`${tier.id}_correct`] = correct;
            tierSummary[`${tier.id}_max`] = tierResults.length;
            tierSummary[`${tier.id}_pct`] = tierResults.length > 0
                ? Math.round((correct / tierResults.length) * 100)
                : 0;
        });

        const payload = {
            testType: 'arithmetic_wais_style',
            schemaVersion: 1,
            sessionId: sessionId,
            timestamp: new Date().toISOString(),
            age: age,
            caitWmi: caitWmi,
            coreWmi: coreWmi,
            completed: results.length === allItems.length,
            totalItemsExpected: allItems.length,
            totalScore: summary.totalScore,
            maxScore: summary.maxScore,
            accuracy: Math.round(summary.accuracy * 100),
            itemsCompleted: results.length,
            meanResponseTimeMs: summary.meanResponseTimeMs,
            timedOutCount: summary.timedOutCount,
            skippedCount: summary.skippedCount,
            repeatCount: summary.repeatCount,
            scaledEstimate: summary.scaledEstimate,
            speechRate: speechRate,
            ...tierSummary,
            items: results,
        };

        setSubmitStatus('Submitting...', 'info');
        btnSubmitNorms.disabled = true;

        fetch(SHEETS_ENDPOINT, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
            .then(() => {
                setSubmitStatus('Results submitted anonymously. Thank you.', 'success');
            })
            .catch((err) => {
                console.error('Submit error:', err);
                setSubmitStatus('Failed to submit. You can still export as JSON.', 'error');
                btnSubmitNorms.disabled = false;
            });
    }

    function setSubmitStatus(message, type) {
        const el = $('arith-submit-status');
        if (!el) return;
        el.textContent = message;
        el.className = 'submit-status ' + type;
        el.style.display = 'block';
    }

    function getOptionalAge(inputId) {
        const input = $(inputId);
        const value = input ? parseInt(input.value, 10) : null;
        return Number.isFinite(value) && value >= 10 && value <= 100 ? value : '';
    }

    function getOptionalStandardScore(inputId) {
        const input = $(inputId);
        const value = input ? parseInt(input.value, 10) : null;
        return Number.isFinite(value) && value >= 1 && value <= 200 ? value : '';
    }
})();
