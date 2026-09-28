import assert from "node:assert";
import { levelOf, insertedInto, removedOut } from "../skiplist.js";
import { insert, find, remove } from "../ops.js";
import { render } from "../app.js";

const base = {
  state: { levels: [], finds: [], paths: [], inserted: 0, removed: 0, compares: 0 },
  events: [{ kind: "insert", key: 3 }]
};

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

check("levelOf returns a number", () => {
  assert.strictEqual(typeof levelOf(5), "number");
});

check("insertedInto returns a list", () => {
  assert.ok(Array.isArray(insertedInto([1, 3], 2)));
});

check("removedOut returns a list", () => {
  assert.ok(Array.isArray(removedOut([1, 2], 1)));
});

check("insert returns a state", () => {
  assert.strictEqual(typeof insert(base.state, 3).levels, "object");
});

check("render counts events", () => {
  assert.strictEqual(typeof render(base).count_events, "number");
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
