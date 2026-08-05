import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const repoRoot = process.cwd();
const source = await fs.readFile(path.join(repoRoot, 'arithmetic_bank.js'), 'utf8');
const context = {};
vm.createContext(context);
vm.runInContext(source, context, { filename: 'arithmetic_bank.js' });

const bankApi = context.ArithmeticBank;
assert.ok(bankApi, 'ArithmeticBank must load');

const bank = bankApi.createItemBank();
assert.equal(bank.length, 960, 'bank must contain 960 stable items');
assert.equal(bankApi.ITEM_MODELS.length, 80, 'bank must contain 80 item models');
assert.equal(new Set(bank.map((item) => item.id)).size, bank.length, 'item IDs must be unique');
assert.equal(new Set(bank.map((item) => item.prompt)).size, bank.length, 'prompts must be unique');

for (const tier of bankApi.TIER_CONFIG) {
  assert.equal(bank.filter((item) => item.tier === tier.id).length, 240, `${tier.id} must contain 240 items`);
  assert.equal(bankApi.ITEM_MODELS.filter((model) => model.tier === tier.id).length, 20, `${tier.id} must contain 20 models`);
}

for (const item of bank) {
  assert.match(item.id, /^AR2-(VE|E|M|SH)\d{2}-V\d{2}$/);
  assert.ok(Number.isFinite(item.answer), `${item.id} answer must be finite`);
  assert.ok(item.answer >= 0, `${item.id} answer must be nonnegative`);
  assert.ok(item.prompt.split(/\s+/).length <= 35, `${item.id} prompt is too long for oral presentation`);
  assert.doesNotMatch(item.prompt, /\d+\.\d{3,}/, `${item.id} exposes floating-point noise`);
  assert.doesNotMatch(item.prompt, /\b1 (hours|slices|items|miles|dollars)\b/i, `${item.id} has singular grammar`);
  if (item.familyId === 'AR2-M13' || item.familyId === 'AR2-SH07') {
    assert.ok(item.answer <= 100, `${item.id} requires an impossible test score`);
  }
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

let exposure = bankApi.createExposureState();
const priorItemIds = new Set();
const rng = seededRandom(20260804);

for (let sessionNumber = 1; sessionNumber <= 30; sessionNumber++) {
  const items = bankApi.selectSessionItems(exposure, rng);
  assert.equal(items.length, 22, `session ${sessionNumber} must contain 22 items`);
  assert.equal(new Set(items.map((item) => item.id)).size, 22, `session ${sessionNumber} must not duplicate items`);

  for (const tier of bankApi.TIER_CONFIG) {
    assert.equal(
      items.filter((item) => item.tier === tier.id).length,
      tier.selectCount,
      `session ${sessionNumber} has the wrong ${tier.id} quota`,
    );
  }

  const exactRepeats = items.filter((item) => priorItemIds.has(item.id));
  assert.equal(exactRepeats.length, 0, `session ${sessionNumber} repeats previously seen exact items`);
  items.forEach((item) => priorItemIds.add(item.id));
  exposure = bankApi.recordExposure(exposure, items);
}

console.log('Arithmetic bank checks passed: 960 items, 80 models, 30 retakes without exact-item overlap.');
