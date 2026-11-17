const assert = require("node:assert/strict");
const pillars = require("../src/data/pillars.json");

assert.deepEqual(
  pillars.map(({ title }) => title),
  [
    "Airtime Stock Exchange",
    "Shared API and Vending Infrastructure",
    "Personalised Dealer Digital Channels",
  ],
);

const numbers = pillars.map(({ number }) => number);

assert.equal(new Set(numbers).size, pillars.length);
for (const pillar of pillars) {
  assert.match(pillar.number, /^\d{2}$/);
  assert.ok(pillar.text.trim().length > 20);
  assert.ok(pillar.label.trim().length > 0);
}

process.stdout.write("AirX pillar checks passed (2 checks).\n");
