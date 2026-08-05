// ============================================================
// Arithmetic item bank
// ============================================================
// Original, non-proprietary mental-arithmetic item models.
// Each model creates deterministic variants so every administered
// question has a stable ID that can be calibrated later.
// ============================================================

(function (root, factory) {
    root.ArithmeticBank = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    const BANK_VERSION = '2.0.0';
    const VARIANTS_PER_MODEL = 12;

    const TIER_CONFIG = [
        { id: 'very_easy', label: 'Very Easy', shortCode: 'VE', selectCount: 4 },
        { id: 'easy', label: 'Easy', shortCode: 'E', selectCount: 6 },
        { id: 'medium', label: 'Medium', shortCode: 'M', selectCount: 8 },
        { id: 'semi_hard', label: 'Semi-Hard', shortCode: 'SH', selectCount: 4 },
    ];

    const NAMES = ['Alex', 'Blair', 'Casey', 'Devon', 'Jordan', 'Morgan', 'Riley', 'Sam', 'Taylor'];
    const OBJECTS = ['books', 'cards', 'pencils', 'marbles', 'stickers', 'tickets', 'notebooks'];
    const FOODS = ['apples', 'oranges', 'muffins', 'sandwiches', 'cookies', 'bagels'];

    function hashString(value) {
        let hash = 2166136261;
        for (let i = 0; i < value.length; i++) {
            hash ^= value.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return hash >>> 0;
    }

    function mulberry32(seed) {
        return function () {
            let value = seed += 0x6D2B79F5;
            value = Math.imul(value ^ (value >>> 15), value | 1);
            value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
            return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
        };
    }

    function randomInt(rng, min, max) {
        return Math.floor(rng() * (max - min + 1)) + min;
    }

    function pick(rng, values) {
        return values[Math.floor(rng() * values.length)];
    }

    function shuffled(values, rng) {
        const out = [...values];
        for (let i = out.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [out[i], out[j]] = [out[j], out[i]];
        }
        return out;
    }

    function roundMoney(value) {
        return Math.round(value * 100) / 100;
    }

    function moneyAnswer(value) {
        const answer = roundMoney(value);
        return {
            answer,
            answerText: answer.toFixed(2),
            tolerance: 0.01,
        };
    }

    function percentOf(base, percent) {
        return base * percent / 100;
    }

    function clockText(totalMinutes) {
        const normalized = ((totalMinutes % 1440) + 1440) % 1440;
        const hour24 = Math.floor(normalized / 60);
        const minute = normalized % 60;
        const suffix = hour24 >= 12 ? 'PM' : 'AM';
        const hour12 = hour24 % 12 || 12;
        return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`;
    }

    function model(id, tier, concept, difficultyOrder, operationCount, workingMemoryLoad, generate) {
        return { id, tier, concept, difficultyOrder, operationCount, workingMemoryLoad, generate };
    }

    const ITEM_MODELS = [
        // Very easy: primarily one operation with small whole numbers.
        model('VE01', 'very_easy', 'Simple addition', 1, 1, 1, (rng) => {
            const a = randomInt(rng, 2, 12);
            const b = randomInt(rng, 2, 9);
            return { prompt: `${pick(rng, NAMES)} has ${a} ${pick(rng, OBJECTS)} and gets ${b} more. How many are there altogether?`, answer: a + b };
        }),
        model('VE02', 'very_easy', 'Simple subtraction', 2, 1, 1, (rng) => {
            const total = randomInt(rng, 12, 30);
            const removed = randomInt(rng, 2, Math.min(10, total - 2));
            return { prompt: `A box contains ${total} ${pick(rng, OBJECTS)}. If ${removed} are taken out, how many remain?`, answer: total - removed };
        }),
        model('VE03', 'very_easy', 'Small multiplication', 3, 1, 1, (rng) => {
            const count = randomInt(rng, 2, 5);
            const price = randomInt(rng, 2, 9);
            return { prompt: `Each ticket costs ${price} dollars. How much do ${count} tickets cost?`, answer: count * price };
        }),
        model('VE04', 'very_easy', 'Equal grouping', 4, 1, 1, (rng) => {
            const groups = randomInt(rng, 2, 6);
            const size = randomInt(rng, 2, 6);
            return { prompt: `${groups * size} students are placed in groups of ${size}. How many groups are there?`, answer: groups };
        }),
        model('VE05', 'very_easy', 'Making change', 5, 1, 1, (rng) => {
            const paid = pick(rng, [10, 20, 25, 30]);
            const price = randomInt(rng, 3, paid - 2);
            return { prompt: `An item costs ${price} dollars. If you pay with ${paid} dollars, how much change should you receive?`, answer: paid - price };
        }),
        model('VE06', 'very_easy', 'Three-value addition', 6, 2, 2, (rng) => {
            const a = randomInt(rng, 1, 7);
            const b = randomInt(rng, 1, 7);
            const c = randomInt(rng, 1, 7);
            return { prompt: `A basket has ${a} apples, ${b} oranges, and ${c} pears. How many pieces of fruit are in the basket?`, answer: a + b + c };
        }),
        model('VE07', 'very_easy', 'Quantity difference', 7, 1, 1, (rng) => {
            const smaller = randomInt(rng, 3, 14);
            const difference = randomInt(rng, 2, 10);
            return { prompt: `${pick(rng, NAMES)} has ${smaller + difference} points and a friend has ${smaller} points. How many more points does ${pick(rng, ['the first person', 'that person'])} have?`, answer: difference };
        }),
        model('VE08', 'very_easy', 'Doubling', 8, 1, 1, (rng) => {
            const amount = randomInt(rng, 3, 14);
            return { prompt: `One shelf holds ${amount} books. Another shelf holds the same number. How many books are on both shelves?`, answer: amount * 2 };
        }),
        model('VE09', 'very_easy', 'Halving', 9, 1, 1, (rng) => {
            const half = randomInt(rng, 4, 15);
            return { prompt: `${pick(rng, NAMES)} has ${half * 2} cards and gives half away. How many cards are left?`, answer: half };
        }),
        model('VE10', 'very_easy', 'Increasing a quantity', 10, 1, 1, (rng) => {
            const start = randomInt(rng, 5, 18);
            const added = randomInt(rng, 3, 10);
            return { prompt: `A jar starts with ${start} coins. ${added} more coins are added. How many coins are in the jar now?`, answer: start + added };
        }),
        model('VE11', 'very_easy', 'Decreasing a quantity', 11, 1, 1, (rng) => {
            const start = randomInt(rng, 14, 30);
            const used = randomInt(rng, 3, 11);
            return { prompt: `A baker makes ${start} muffins and sells ${used}. How many muffins are left?`, answer: start - used };
        }),
        model('VE12', 'very_easy', 'Daily accumulation', 12, 1, 1, (rng) => {
            const perDay = randomInt(rng, 2, 6);
            const days = randomInt(rng, 2, 7);
            return { prompt: `A person saves ${perDay} dollars each day for ${days} days. How many dollars are saved?`, answer: perDay * days };
        }),
        model('VE13', 'very_easy', 'Hourly accumulation', 13, 1, 1, (rng) => {
            const perHour = randomInt(rng, 5, 12);
            const hours = randomInt(rng, 2, 5);
            return { prompt: `A machine makes ${perHour} parts each hour. How many parts does it make in ${hours} hours?`, answer: perHour * hours };
        }),
        model('VE14', 'very_easy', 'Minutes to the hour', 14, 1, 1, (rng) => {
            const minute = pick(rng, [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
            return { prompt: `It is ${randomInt(rng, 1, 11)}:${String(minute).padStart(2, '0')}. How many minutes are left until the next hour?`, answer: 60 - minute };
        }),
        model('VE15', 'very_easy', 'Cost of a pair', 15, 1, 1, (rng) => {
            const price = randomInt(rng, 4, 16);
            return { prompt: `One notebook costs ${price} dollars. How much do two notebooks cost?`, answer: price * 2 };
        }),
        model('VE16', 'very_easy', 'Items in containers', 16, 1, 1, (rng) => {
            const containers = randomInt(rng, 3, 7);
            const perContainer = randomInt(rng, 4, 9);
            return { prompt: `There are ${containers} bags with ${perContainer} pieces in each bag. How many pieces are there in all?`, answer: containers * perContainer };
        }),
        model('VE17', 'very_easy', 'Square perimeter', 17, 1, 1, (rng) => {
            const side = randomInt(rng, 2, 16);
            return { prompt: `A square has sides that are ${side} feet long. What is its perimeter?`, answer: side * 4 };
        }),
        model('VE18', 'very_easy', 'Two-step passenger tracking', 18, 2, 2, (rng) => {
            const start = randomInt(rng, 15, 30);
            const off = randomInt(rng, 2, 8);
            const on = randomInt(rng, 1, 6);
            return { prompt: `A bus has ${start} passengers. ${off} get off and ${on} get on. How many passengers are on the bus now?`, answer: start - off + on };
        }),
        model('VE19', 'very_easy', 'Savings total', 19, 2, 2, (rng) => {
            const start = randomInt(rng, 5, 25);
            const weekly = randomInt(rng, 2, 7);
            const weeks = randomInt(rng, 2, 4);
            return { prompt: `${pick(rng, NAMES)} already has ${start} dollars and saves ${weekly} dollars a week for ${weeks} weeks. How many dollars are there then?`, answer: start + weekly * weeks };
        }),
        model('VE20', 'very_easy', 'Points gained', 20, 2, 2, (rng) => {
            const start = randomInt(rng, 5, 20);
            const scores = randomInt(rng, 2, 5);
            const points = randomInt(rng, 2, 4);
            return { prompt: `A team starts with ${start} points and then scores ${scores} times for ${points} points each. What is its new total?`, answer: start + scores * points };
        }),

        // Easy: two-step problems, common fractions, rates, and time.
        model('E01', 'easy', 'Two-item purchase', 1, 2, 2, (rng) => {
            const count = randomInt(rng, 2, 5);
            const unit = randomInt(rng, 2, 7);
            const extra = randomInt(rng, 2, 8);
            return { prompt: `You buy ${count} drinks for ${unit} dollars each and a snack for ${extra} dollars. What is the total cost?`, answer: count * unit + extra };
        }),
        model('E02', 'easy', 'Rate and distance', 2, 1, 2, (rng) => {
            const speed = pick(rng, [25, 30, 35, 40, 45, 50, 55, 60]);
            const hours = randomInt(rng, 2, 4);
            return { prompt: `A car travels ${speed} miles per hour for ${hours} hours. How far does it travel?`, answer: speed * hours };
        }),
        model('E03', 'easy', 'Unit price', 3, 1, 2, (rng) => {
            const count = randomInt(rng, 3, 8);
            const unitPrice = randomInt(rng, 4, 15);
            return { prompt: `${count} identical shirts cost ${count * unitPrice} dollars altogether. How much does one shirt cost?`, answer: unitPrice };
        }),
        model('E04', 'easy', 'Fraction remaining', 4, 2, 2, (rng) => {
            const denominator = pick(rng, [2, 3, 4]);
            const unit = randomInt(rng, 3, 9);
            const total = denominator * unit;
            const word = { 2: 'half', 3: 'one third', 4: 'one quarter' }[denominator];
            return { prompt: `${pick(rng, NAMES)} has ${total} cards and gives ${word} of them away. How many cards remain?`, answer: total - unit };
        }),
        model('E05', 'easy', 'Grouped subtraction', 5, 2, 2, (rng) => {
            const people = randomInt(rng, 2, 4);
            const each = randomInt(rng, 1, 3);
            const eaten = people * each;
            const total = eaten + randomInt(rng, 2, 10);
            const sliceWord = each === 1 ? 'slice' : 'slices';
            return { prompt: `A pizza has ${total} slices. ${people} people eat ${each} ${sliceWord} each. How many slices are left?`, answer: total - eaten };
        }),
        model('E06', 'easy', 'Change after two purchases', 6, 2, 2, (rng) => {
            const paid = pick(rng, [30, 40, 50]);
            const first = randomInt(rng, 6, 15);
            const second = randomInt(rng, 4, Math.min(14, paid - first - 2));
            return { prompt: `You pay ${paid} dollars for items costing ${first} dollars and ${second} dollars. How much change do you receive?`, answer: paid - first - second };
        }),
        model('E07', 'easy', 'Repeated time interval', 7, 1, 2, (rng) => {
            const laps = randomInt(rng, 3, 6);
            const seconds = pick(rng, [45, 60, 75, 90]);
            return { prompt: `A runner completes ${laps} laps. Each lap takes ${seconds} seconds. How many seconds does the run take?`, answer: laps * seconds };
        }),
        model('E08', 'easy', 'Sequential quantity tracking', 8, 2, 2, (rng) => {
            const start = randomInt(rng, 35, 80);
            const lost = randomInt(rng, 10, 24);
            const added = randomInt(rng, 5, 16);
            return { prompt: `A tank contains ${start} gallons. ${lost} gallons drain out, and then ${added} gallons are added. How many gallons are in the tank?`, answer: start - lost + added };
        }),
        model('E09', 'easy', 'Three-category total', 9, 2, 2, (rng) => {
            const a = randomInt(rng, 5, 18);
            const b = randomInt(rng, 5, 18);
            const c = randomInt(rng, 5, 18);
            return { prompt: `A box has ${a} red balls, ${b} blue balls, and ${c} green balls. How many balls are in the box?`, answer: a + b + c };
        }),
        model('E10', 'easy', 'Earnings minus expense', 10, 2, 2, (rng) => {
            const hours = randomInt(rng, 3, 6);
            const rate = randomInt(rng, 8, 15);
            const expense = randomInt(rng, 5, Math.min(20, hours * rate - 5));
            return { prompt: `You work ${hours} hours at ${rate} dollars per hour and then spend ${expense} dollars. How much money remains?`, answer: hours * rate - expense };
        }),
        model('E11', 'easy', 'Inventory after use', 11, 2, 2, (rng) => {
            const boxes = randomInt(rng, 3, 7);
            const perBox = randomInt(rng, 8, 15);
            const total = boxes * perBox;
            const used = randomInt(rng, 6, Math.min(25, total - 4));
            return { prompt: `An office has ${boxes} boxes with ${perBox} pens in each. After ${used} pens are used, how many remain?`, answer: total - used };
        }),
        model('E12', 'easy', 'Round-trip distance', 12, 1, 2, (rng) => {
            const oneWay = randomInt(rng, 8, 35);
            return { prompt: `A trip is ${oneWay} miles each way. How many miles are traveled going there and back?`, answer: oneWay * 2 };
        }),
        model('E13', 'easy', 'Equal split plus tip', 13, 2, 2, (rng) => {
            const people = randomInt(rng, 3, 6);
            const share = randomInt(rng, 8, 18);
            const tip = randomInt(rng, 1, 4);
            return { prompt: `${people} friends split a ${people * share} dollar bill equally. Each adds a ${tip} dollar tip. How much does each person pay?`, answer: share + tip };
        }),
        model('E14', 'easy', 'Elapsed minutes', 14, 2, 2, (rng) => {
            const start = randomInt(rng, 8 * 60, 16 * 60);
            const roundedStart = Math.floor(start / 15) * 15;
            const duration = pick(rng, [45, 60, 75, 90, 105]);
            return { prompt: `How many minutes pass from ${clockText(roundedStart)} until ${clockText(roundedStart + duration)}?`, answer: duration };
        }),
        model('E15', 'easy', 'Dozens and remainder', 15, 2, 2, (rng) => {
            const dozens = randomInt(rng, 2, 5);
            const used = randomInt(rng, 5, Math.min(20, dozens * 12 - 4));
            return { prompt: `A bakery makes ${dozens} dozen rolls and sells ${used}. How many rolls remain?`, answer: dozens * 12 - used };
        }),
        model('E16', 'easy', 'Simple percentage discount', 16, 2, 2, (rng) => {
            const percent = pick(rng, [10, 20, 25, 50]);
            const baseUnit = percent === 25 ? 4 : 10;
            const price = baseUnit * randomInt(rng, 5, 15);
            return { prompt: `An item costs ${price} dollars and is discounted by ${percent} percent. What is the sale price?`, answer: price - percentOf(price, percent) };
        }),
        model('E17', 'easy', 'Rectangle perimeter', 17, 2, 2, (rng) => {
            const length = randomInt(rng, 6, 16);
            const width = randomInt(rng, 3, length - 1);
            return { prompt: `A rectangle is ${length} feet long and ${width} feet wide. What is its perimeter?`, answer: 2 * (length + width) };
        }),
        model('E18', 'easy', 'Direct ratio scaling', 18, 2, 2, (rng) => {
            const baseQuantity = randomInt(rng, 2, 4);
            const unitPrice = randomInt(rng, 2, 6);
            const targetQuantity = randomInt(rng, 5, 9);
            return { prompt: `If ${baseQuantity} pounds of fruit cost ${baseQuantity * unitPrice} dollars, how much do ${targetQuantity} pounds cost at the same rate?`, answer: targetQuantity * unitPrice };
        }),
        model('E19', 'easy', 'Passenger flow', 19, 2, 2, (rng) => {
            const start = randomInt(rng, 45, 100);
            const off = randomInt(rng, 10, 25);
            const on = randomInt(rng, 5, 20);
            return { prompt: `A train has ${start} passengers. At a stop, ${off} get off and ${on} get on. How many passengers are aboard now?`, answer: start - off + on };
        }),
        model('E20', 'easy', 'Simple average', 20, 2, 2, (rng) => {
            const average = randomInt(rng, 10, 30);
            const spread = randomInt(rng, 2, 8);
            return { prompt: `Three scores are ${average - spread}, ${average}, and ${average + spread}. What is their average?`, answer: average };
        }),

        // Medium: several held values, percentages, ratios, and backward tracking.
        model('M01', 'medium', 'Percentage discount', 1, 2, 3, (rng) => {
            const percent = pick(rng, [10, 15, 20, 25, 30]);
            const price = (percent === 15 ? 20 : percent === 25 ? 4 : 10) * randomInt(rng, 5, 15);
            return { prompt: `A jacket costs ${price} dollars and is on sale for ${percent} percent off. What is the sale price?`, answer: price - percentOf(price, percent) };
        }),
        model('M02', 'medium', 'Wages and expense', 2, 2, 3, (rng) => {
            const hours = randomInt(rng, 4, 8);
            const rate = randomInt(rng, 11, 18);
            const expense = randomInt(rng, 12, 35);
            return { prompt: `You earn ${rate} dollars per hour for ${hours} hours, then spend ${expense} dollars. How much money is left?`, answer: hours * rate - expense };
        }),
        model('M03', 'medium', 'Bulk inventory', 3, 2, 3, (rng) => {
            const boxes = randomInt(rng, 5, 9);
            const each = randomInt(rng, 10, 18);
            const used = randomInt(rng, 20, 45);
            return { prompt: `A supply room receives ${boxes} boxes with ${each} markers in each box. If ${used} markers are used, how many remain?`, answer: boxes * each - used };
        }),
        model('M04', 'medium', 'Multiple-stop tracking', 4, 4, 3, (rng) => {
            const start = randomInt(rng, 80, 140);
            const off1 = randomInt(rng, 10, 25);
            const on1 = randomInt(rng, 5, 20);
            const off2 = randomInt(rng, 8, 20);
            const on2 = randomInt(rng, 4, 15);
            return { prompt: `A train starts with ${start} passengers. At one stop ${off1} get off and ${on1} get on. At the next, ${off2} get off and ${on2} get on. How many passengers are aboard?`, answer: start - off1 + on1 - off2 + on2 };
        }),
        model('M05', 'medium', 'Unit-rate scaling', 5, 2, 3, (rng) => {
            const baseQuantity = randomInt(rng, 2, 5);
            const unitCost = randomInt(rng, 3, 8);
            const targetQuantity = randomInt(rng, 6, 12);
            return { prompt: `If ${baseQuantity} pounds of coffee cost ${baseQuantity * unitCost} dollars, what do ${targetQuantity} pounds cost at the same rate?`, answer: targetQuantity * unitCost };
        }),
        model('M06', 'medium', 'Decimal change', 6, 3, 3, (rng) => {
            const dailyFine = pick(rng, [0.25, 0.5, 0.75]);
            const days = randomInt(rng, 4, 10);
            const fine = roundMoney(dailyFine * days);
            const paid = pick(rng, [5, 10, 20].filter((value) => value > fine));
            return { prompt: `A fine is ${Math.round(dailyFine * 100)} cents per day for ${days} days. If you pay with ${paid} dollars, how much change do you receive?`, ...moneyAnswer(paid - fine) };
        }),
        model('M07', 'medium', 'Remaining work', 7, 2, 3, (rng) => {
            const perDay = randomInt(rng, 12, 25);
            const days = randomInt(rng, 3, 6);
            const read = perDay * days;
            const total = read + randomInt(rng, 35, 100);
            return { prompt: `A book has ${total} pages. You read ${perDay} pages a day for ${days} days. How many pages are left?`, answer: total - read };
        }),
        model('M08', 'medium', 'Shared bill with fee', 8, 3, 3, (rng) => {
            const people = randomInt(rng, 3, 6);
            const mealShare = randomInt(rng, 12, 25);
            const feeShare = randomInt(rng, 2, 5);
            return { prompt: `${people} people split a ${people * mealShare} dollar meal and a ${people * feeShare} dollar service charge equally. How much does each person pay?`, answer: mealShare + feeShare };
        }),
        model('M09', 'medium', 'Clock-time tracking', 9, 2, 3, (rng) => {
            const start = Math.floor(randomInt(rng, 8 * 60, 17 * 60) / 5) * 5;
            const duration = pick(rng, [70, 85, 95, 110, 125, 140]);
            return { prompt: `How many minutes pass from ${clockText(start)} until ${clockText(start + duration)}?`, answer: duration };
        }),
        model('M10', 'medium', 'Percentage markup', 10, 2, 3, (rng) => {
            const percent = pick(rng, [20, 25, 40, 50]);
            const cost = (percent === 25 ? 4 : 10) * randomInt(rng, 8, 20);
            return { prompt: `A store pays ${cost} dollars for an item and adds a ${percent} percent markup. What is the selling price?`, answer: cost + percentOf(cost, percent) };
        }),
        model('M11', 'medium', 'Net rate', 11, 2, 3, (rng) => {
            const fillRate = randomInt(rng, 12, 24);
            const leakRate = randomInt(rng, 2, 7);
            const minutes = randomInt(rng, 5, 12);
            return { prompt: `A tank fills at ${fillRate} gallons per minute while leaking ${leakRate} gallons per minute. How many gallons are gained in ${minutes} minutes?`, answer: (fillRate - leakRate) * minutes };
        }),
        model('M12', 'medium', 'Compound purchase', 12, 3, 3, (rng) => {
            const count1 = randomInt(rng, 2, 4);
            const price1 = randomInt(rng, 8, 18);
            const count2 = randomInt(rng, 2, 5);
            const price2 = randomInt(rng, 3, 7);
            const fee = randomInt(rng, 2, 6);
            return { prompt: `You buy ${count1} books for ${price1} dollars each and ${count2} folders for ${price2} dollars each. A ${fee} dollar fee is added. What is the total?`, answer: count1 * price1 + count2 * price2 + fee };
        }),
        model('M13', 'medium', 'Target average', 13, 3, 3, (rng) => {
            let target;
            let scores;
            let needed;
            do {
                target = randomInt(rng, 75, 92);
                scores = [target - randomInt(rng, 4, 10), target + randomInt(rng, 1, 6), target - randomInt(rng, 1, 5)];
                needed = target * 4 - scores.reduce((sum, value) => sum + value, 0);
            } while (needed > 100);
            return { prompt: `A student scores ${scores[0]}, ${scores[1]}, and ${scores[2]} on three tests. What score is needed on a fourth test to average ${target}?`, answer: needed };
        }),
        model('M14', 'medium', 'Fraction then adjustment', 14, 3, 3, (rng) => {
            const denominator = pick(rng, [2, 3, 4]);
            const unit = randomInt(rng, 8, 18);
            const total = denominator * unit;
            const extra = randomInt(rng, 4, 12);
            const word = { 2: 'half', 3: 'one third', 4: 'one quarter' }[denominator];
            return { prompt: `A warehouse has ${total} packages. It ships ${word} of them, then receives ${extra} more. How many packages are there now?`, answer: total - unit + extra };
        }),
        model('M15', 'medium', 'Recipe scaling', 15, 2, 3, (rng) => {
            const baseServings = pick(rng, [2, 3, 4, 5]);
            const amountPerServing = randomInt(rng, 2, 6);
            const baseAmount = baseServings * amountPerServing;
            const multiplier = randomInt(rng, 2, 3);
            return { prompt: `A recipe uses ${baseAmount} ounces of an ingredient for ${baseServings} servings. How many ounces are needed for ${baseServings * multiplier} servings?`, answer: baseAmount * multiplier };
        }),
        model('M16', 'medium', 'Simple annual interest', 16, 2, 3, (rng) => {
            const percent = pick(rng, [5, 10, 12, 20]);
            const principal = (percent === 12 ? 25 : 20) * randomInt(rng, 10, 30);
            return { prompt: `${principal} dollars earns ${percent} percent simple interest in one year. How many dollars of interest are earned?`, answer: percentOf(principal, percent) };
        }),
        model('M17', 'medium', 'Percentage count', 17, 3, 3, (rng) => {
            const percent = pick(rng, [20, 25, 40, 50]);
            const total = (percent === 25 ? 4 : 10) * randomInt(rng, 5, 12);
            const selected = percentOf(total, percent);
            const absent = randomInt(rng, 2, Math.min(8, total - selected - 1));
            return { prompt: `A class has ${total} students. ${percent} percent are in one group, and ${absent} other students are absent. How many students are neither in that group nor absent?`, answer: total - selected - absent };
        }),
        model('M18', 'medium', 'Currency conversion', 18, 2, 3, (rng) => {
            const rate = pick(rng, [2, 3, 4, 5]);
            const dollars = randomInt(rng, 8, 25);
            const spent = rate * randomInt(rng, 2, Math.max(2, dollars - 2));
            return { prompt: `One dollar exchanges for ${rate} tokens. You exchange ${dollars} dollars and spend ${spent} tokens. How many tokens remain?`, answer: dollars * rate - spent };
        }),
        model('M19', 'medium', 'Direct production ratio', 19, 2, 3, (rng) => {
            const machines = randomInt(rng, 2, 5);
            const perMachine = randomInt(rng, 8, 18);
            const targetMachines = randomInt(rng, 6, 10);
            return { prompt: `${machines} identical machines make ${machines * perMachine} parts in an hour. How many parts do ${targetMachines} machines make in an hour?`, answer: targetMachines * perMachine };
        }),
        model('M20', 'medium', 'Area remaining', 20, 2, 3, (rng) => {
            const length = randomInt(rng, 8, 15);
            const width = randomInt(rng, 5, 10);
            const coveredLength = randomInt(rng, 2, Math.min(5, length - 1));
            const coveredWidth = randomInt(rng, 2, Math.min(4, width - 1));
            return { prompt: `A floor is ${length} feet by ${width} feet. A rug covers ${coveredLength} feet by ${coveredWidth} feet. How many square feet of floor remain uncovered?`, answer: length * width - coveredLength * coveredWidth };
        }),

        // Semi-hard: three or more operations, inverse reasoning, and multiple variables.
        model('SH01', 'semi_hard', 'Markup calculation', 1, 2, 3, (rng) => {
            const percent = pick(rng, [25, 40, 50, 75]);
            const cost = (percent === 25 || percent === 75 ? 4 : 10) * randomInt(rng, 15, 40);
            return { prompt: `A store buys an item for ${cost} dollars and sells it for a ${percent} percent profit. What is the selling price?`, answer: cost + percentOf(cost, percent) };
        }),
        model('SH02', 'semi_hard', 'Linear fare equation', 2, 2, 3, (rng) => {
            const base = randomInt(rng, 3, 7);
            const perMile = randomInt(rng, 2, 5);
            const miles = randomInt(rng, 6, 16);
            const fare = base + perMile * miles;
            return { prompt: `A taxi charges ${base} dollars plus ${perMile} dollars per mile. If the fare is ${fare} dollars, how many miles were traveled?`, answer: miles };
        }),
        model('SH03', 'semi_hard', 'Three-part ratio split', 3, 3, 4, (rng) => {
            const ratio = shuffled([1, 2, randomInt(rng, 3, 5)], rng);
            const unit = pick(rng, [100, 200, 250, 500]);
            const total = ratio.reduce((sum, value) => sum + value, 0) * unit;
            return { prompt: `Three people divide ${total} dollars in a ratio of ${ratio[0]} to ${ratio[1]} to ${ratio[2]}. How much does the second person receive?`, answer: ratio[1] * unit };
        }),
        model('SH04', 'semi_hard', 'Net accumulation rate', 4, 2, 3, (rng) => {
            const inRate = randomInt(rng, 16, 30);
            const outRate = randomInt(rng, 3, 10);
            const minutes = randomInt(rng, 8, 15);
            return { prompt: `A pool gains ${inRate} gallons per minute from a hose and loses ${outRate} gallons per minute through a leak. What is the net gain after ${minutes} minutes?`, answer: (inRate - outRate) * minutes };
        }),
        model('SH05', 'semi_hard', 'Multi-item transaction', 5, 4, 4, (rng) => {
            const count1 = randomInt(rng, 2, 4);
            const price1 = randomInt(rng, 12, 24);
            const count2 = randomInt(rng, 3, 6);
            const price2 = randomInt(rng, 4, 9);
            const fee = randomInt(rng, 3, 8);
            return { prompt: `You buy ${count1} books for ${price1} dollars each and ${count2} notebooks for ${price2} dollars each. A ${fee} dollar fee is added. What is the total cost?`, answer: count1 * price1 + count2 * price2 + fee };
        }),
        model('SH06', 'semi_hard', 'Inverse work rate', 6, 2, 4, (rng) => {
            const workers = pick(rng, [4, 6, 8, 10]);
            const hours = randomInt(rng, 4, 9);
            const newWorkers = pick(rng, [2, workers / 2]);
            return { prompt: `If ${workers} workers finish a job in ${hours} hours, how many hours would ${newWorkers} workers need at the same rate?`, answer: workers * hours / newWorkers };
        }),
        model('SH07', 'semi_hard', 'Required score for an average', 7, 3, 4, (rng) => {
            let target;
            let scores;
            let needed;
            do {
                target = randomInt(rng, 82, 92);
                scores = [target - randomInt(rng, 5, 12), target + randomInt(rng, 1, 5), target - randomInt(rng, 1, 7)];
                needed = target * 4 - scores.reduce((sum, value) => sum + value, 0);
            } while (needed > 100);
            return { prompt: `A student has scores of ${scores[0]}, ${scores[1]}, and ${scores[2]}. What fourth score is needed for an average of ${target}?`, answer: needed };
        }),
        model('SH08', 'semi_hard', 'Successive percentages', 8, 3, 4, (rng) => {
            const first = pick(rng, [10, 20, 25, 50]);
            const second = pick(rng, [10, 20, 25]);
            const base = 40 * randomInt(rng, 3, 10);
            const finalPrice = base * (1 - first / 100) * (1 - second / 100);
            return { prompt: `An item costs ${base} dollars. It is discounted ${first} percent and then discounted another ${second} percent. What is the final price?`, ...moneyAnswer(finalPrice) };
        }),
        model('SH09', 'semi_hard', 'Mixture dilution', 9, 3, 4, (rng) => {
            const liters = pick(rng, [4, 6, 8, 10]);
            const dilution = pick(rng, [
                { percent: 20, waterRatio: 1 },
                { percent: 25, waterRatio: 1 },
                { percent: 30, waterRatio: 0.5 },
                { percent: 40, waterRatio: 1 },
                { percent: 45, waterRatio: 0.5 },
                { percent: 50, waterRatio: 1 },
            ]);
            const percent = dilution.percent;
            const water = liters * dilution.waterRatio;
            const newPercent = liters * percent / (liters + water);
            return { prompt: `A container holds ${liters} liters of a mixture that is ${percent} percent concentrate. If ${water} liters of water are added, what percent of the new mixture is concentrate?`, ...moneyAnswer(newPercent) };
        }),
        model('SH10', 'semi_hard', 'Age relationship', 10, 3, 4, (rng) => {
            const multiplier = pick(rng, [2, 3]);
            const younger = randomInt(rng, 5, 14);
            const years = randomInt(rng, 3, 7);
            const sumLater = younger + multiplier * younger + 2 * years;
            return { prompt: `One person is ${multiplier} times as old as another. In ${years} years, the sum of their ages will be ${sumLater}. How old is the older person now?`, answer: multiplier * younger };
        }),
        model('SH11', 'semi_hard', 'Weighted unit cost', 11, 3, 4, (rng) => {
            let count1;
            let count2;
            let price1;
            let price2;
            let average;
            do {
                count1 = randomInt(rng, 2, 4);
                count2 = randomInt(rng, 2, 5);
                price1 = randomInt(rng, 4, 10);
                price2 = randomInt(rng, 8, 16);
                average = (count1 * price1 + count2 * price2) / (count1 + count2);
            } while (!Number.isInteger(average));
            return { prompt: `You buy ${count1} items at ${price1} dollars each and ${count2} items at ${price2} dollars each. What is the average cost per item?`, answer: average };
        }),
        model('SH12', 'semi_hard', 'Backward percentage', 12, 2, 4, (rng) => {
            const discount = pick(rng, [20, 25, 40, 50]);
            const original = (discount === 25 ? 4 : 10) * randomInt(rng, 10, 30);
            const salePrice = original * (1 - discount / 100);
            return { prompt: `After a ${discount} percent discount, an item sells for ${salePrice} dollars. What was its original price?`, answer: original };
        }),
        model('SH13', 'semi_hard', 'Fractional remainder', 13, 4, 4, (rng) => {
            const options = [
                { a: 'one third', an: 1, ad: 3, b: 'one quarter', bn: 1, bd: 4 },
                { a: 'one quarter', an: 1, ad: 4, b: 'two fifths', bn: 2, bd: 5 },
                { a: 'two fifths', an: 2, ad: 5, b: 'one third', bn: 1, bd: 3 },
            ];
            const split = pick(rng, options);
            const denominator = split.ad * split.bd;
            const total = denominator * pick(rng, [200, 300, 400, 500]);
            const remainder = Math.round(total * (1 - split.an / split.ad - split.bn / split.bd));
            return { prompt: `A profit is divided so one partner gets ${split.a}, another gets ${split.b}, and the remaining ${remainder} dollars goes to a third partner. What was the total profit?`, answer: total };
        }),
        model('SH14', 'semi_hard', 'Changing production rate', 14, 4, 4, (rng) => {
            const rate = pick(rng, [60, 80, 100, 120, 160]);
            const firstHours = randomInt(rng, 2, 4);
            const reduction = pick(rng, [20, 25, 50]);
            const laterHours = randomInt(rng, 2, 5);
            const laterRate = rate * (1 - reduction / 100);
            return { prompt: `A line makes ${rate} units per hour for ${firstHours} hours. Its rate then falls by ${reduction} percent for ${laterHours} more hours. How many units are made altogether?`, answer: rate * firstHours + laterRate * laterHours };
        }),
        model('SH15', 'semi_hard', 'Overtime pay', 15, 4, 4, (rng) => {
            const regularHours = pick(rng, [35, 40]);
            const overtimeHours = randomInt(rng, 4, 10);
            const rate = pick(rng, [12, 14, 16, 18, 20]);
            const total = regularHours * rate + overtimeHours * rate * 1.5;
            return { prompt: `A worker earns ${rate} dollars an hour for ${regularHours} regular hours and time-and-a-half for ${overtimeHours} overtime hours. What is the total pay?`, answer: total };
        }),
        model('SH16', 'semi_hard', 'Balancing two quantities', 16, 2, 4, (rng) => {
            const smaller = randomInt(rng, 12, 30);
            const transfer = randomInt(rng, 4, 12);
            const larger = smaller + transfer * 2;
            return { prompt: `One box has ${larger} files and another has ${smaller}. How many files must be moved from the fuller box to the other so both have the same number?`, answer: transfer };
        }),
        model('SH17', 'semi_hard', 'Budget after percentage', 17, 3, 4, (rng) => {
            const percent = pick(rng, [20, 25, 30, 40]);
            const income = (percent === 25 ? 4 : 10) * randomInt(rng, 20, 50);
            const saved = percentOf(income, percent);
            const expense = randomInt(rng, 40, Math.max(41, Math.floor(income - saved - 20)));
            return { prompt: `From ${income} dollars, a person saves ${percent} percent and then spends ${expense} dollars from the rest. How many dollars remain?`, answer: income - saved - expense };
        }),
        model('SH18', 'semi_hard', 'Average rate over two legs', 18, 4, 4, (rng) => {
            let time1;
            let time2;
            let speed1;
            let speed2;
            let average;
            do {
                time1 = randomInt(rng, 1, 3);
                time2 = randomInt(rng, 1, 3);
                speed1 = pick(rng, [30, 40, 50, 60]);
                speed2 = pick(rng, [40, 50, 60, 70]);
                average = (time1 * speed1 + time2 * speed2) / (time1 + time2);
            } while (!Number.isInteger(average));
            const firstHourWord = time1 === 1 ? 'hour' : 'hours';
            const secondHourWord = time2 === 1 ? 'hour' : 'hours';
            return { prompt: `A vehicle travels ${time1} ${firstHourWord} at ${speed1} miles per hour and then ${time2} ${secondHourWord} at ${speed2} miles per hour. What is its average speed for the whole trip?`, answer: average };
        }),
        model('SH19', 'semi_hard', 'Partial work with staffing change', 19, 4, 4, (rng) => {
            const workers = pick(rng, [4, 6, 8]);
            const totalHours = pick(rng, [4, 6, 8]);
            const firstHours = randomInt(rng, 1, Math.min(3, totalHours - 1));
            let remainingWorkers = workers / 2;
            let remainingHours = workers * (totalHours - firstHours) / remainingWorkers;
            if (!Number.isInteger(remainingHours)) {
                remainingWorkers = workers;
                remainingHours = totalHours - firstHours;
            }
            const firstHourWord = firstHours === 1 ? 'hour' : 'hours';
            return { prompt: `${workers} workers can finish a job in ${totalHours} hours. After they work for ${firstHours} ${firstHourWord}, only ${remainingWorkers} workers remain. At the same individual rate, how many more hours are needed?`, answer: remainingHours };
        }),
        model('SH20', 'semi_hard', 'Consecutive-number reasoning', 20, 2, 4, (rng) => {
            const middle = randomInt(rng, 12, 45);
            return { prompt: `Three consecutive whole numbers have a total of ${middle * 3}. What is the largest of the three numbers?`, answer: middle + 1 };
        }),
    ];

    function materializeModel(itemModel) {
        const tier = TIER_CONFIG.find((entry) => entry.id === itemModel.tier);
        const seenPrompts = new Set();
        const items = [];

        for (let variantIndex = 1; variantIndex <= VARIANTS_PER_MODEL; variantIndex++) {
            let generated = null;
            for (let attempt = 0; attempt < 100; attempt++) {
                const seed = hashString(`${BANK_VERSION}:${itemModel.id}:${variantIndex}:${attempt}`);
                const candidate = itemModel.generate(mulberry32(seed));
                if (!seenPrompts.has(candidate.prompt)) {
                    generated = candidate;
                    seenPrompts.add(candidate.prompt);
                    break;
                }
            }
            if (!generated) {
                throw new Error(`Could not create a unique variant for ${itemModel.id} #${variantIndex}`);
            }

            const familyId = `AR2-${itemModel.id}`;
            items.push({
                id: `${familyId}-V${String(variantIndex).padStart(2, '0')}`,
                bankVersion: BANK_VERSION,
                familyId,
                variantIndex,
                tier: itemModel.tier,
                tierLabel: tier.label,
                concept: itemModel.concept,
                prompt: generated.prompt,
                answer: generated.answer,
                answerText: generated.answerText,
                acceptedAnswers: generated.acceptedAnswers,
                tolerance: generated.tolerance,
                difficultyOrder: itemModel.difficultyOrder,
                operationCount: itemModel.operationCount,
                workingMemoryLoad: itemModel.workingMemoryLoad,
                calibrationStatus: 'uncalibrated',
                source: 'Original non-proprietary WAIS-inspired item model',
            });
        }

        return items;
    }

    let cachedBank = null;

    function createItemBank() {
        if (!cachedBank) {
            cachedBank = ITEM_MODELS.flatMap(materializeModel);
        }
        return cachedBank.map((item) => ({ ...item }));
    }

    function createExposureState() {
        return {
            bankVersion: BANK_VERSION,
            sessions: 0,
            familyCounts: {},
            itemCounts: {},
        };
    }

    function normalizeExposureState(value) {
        if (!value || value.bankVersion !== BANK_VERSION) return createExposureState();
        return {
            bankVersion: BANK_VERSION,
            sessions: Number.isFinite(value.sessions) ? value.sessions : 0,
            familyCounts: value.familyCounts && typeof value.familyCounts === 'object' ? { ...value.familyCounts } : {},
            itemCounts: value.itemCounts && typeof value.itemCounts === 'object' ? { ...value.itemCounts } : {},
        };
    }

    function selectSessionItems(exposureValue, randomFn) {
        const exposure = normalizeExposureState(exposureValue);
        const rng = typeof randomFn === 'function' ? randomFn : Math.random;
        const bank = createItemBank();
        const selected = [];

        TIER_CONFIG.forEach((tier) => {
            const tierItems = bank.filter((item) => item.tier === tier.id);
            const byFamily = new Map();
            tierItems.forEach((item) => {
                if (!byFamily.has(item.familyId)) byFamily.set(item.familyId, []);
                byFamily.get(item.familyId).push(item);
            });

            const familyCandidates = shuffled([...byFamily.keys()], rng)
                .sort((a, b) => (exposure.familyCounts[a] || 0) - (exposure.familyCounts[b] || 0))
                .slice(0, tier.selectCount);

            const tierSelection = familyCandidates.map((familyId) => {
                const itemCandidates = shuffled(byFamily.get(familyId), rng)
                    .sort((a, b) => (exposure.itemCounts[a.id] || 0) - (exposure.itemCounts[b.id] || 0));
                return itemCandidates[0];
            });

            tierSelection.sort((a, b) => a.difficultyOrder - b.difficultyOrder || a.id.localeCompare(b.id));
            selected.push(...tierSelection);
        });

        return selected.map((item, index) => ({ ...item, position: index + 1 }));
    }

    function recordExposure(exposureValue, items) {
        const exposure = normalizeExposureState(exposureValue);
        exposure.sessions += 1;
        items.forEach((item) => {
            exposure.familyCounts[item.familyId] = (exposure.familyCounts[item.familyId] || 0) + 1;
            exposure.itemCounts[item.id] = (exposure.itemCounts[item.id] || 0) + 1;
        });
        return exposure;
    }

    function getBankSummary() {
        const bank = createItemBank();
        return {
            bankVersion: BANK_VERSION,
            itemCount: bank.length,
            modelCount: ITEM_MODELS.length,
            variantsPerModel: VARIANTS_PER_MODEL,
            tiers: TIER_CONFIG.map((tier) => ({
                ...tier,
                itemCount: bank.filter((item) => item.tier === tier.id).length,
                modelCount: ITEM_MODELS.filter((itemModel) => itemModel.tier === tier.id).length,
            })),
        };
    }

    return {
        BANK_VERSION,
        VARIANTS_PER_MODEL,
        TIER_CONFIG,
        ITEM_MODELS,
        createItemBank,
        createExposureState,
        normalizeExposureState,
        selectSessionItems,
        recordExposure,
        getBankSummary,
    };
});
