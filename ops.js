// ops.js：跳表的插入、查找、删除，均为纯函数（返回新状态）
import { levelOf, insertedInto, removedOut } from "./skiplist.js";

function fail(code) {
  throw Object.assign(new Error(code), { code: code });
}

// 键必须是正整数（安全整数，排除布尔、NaN、Infinity、字符串、小数）。
function isPositiveInteger(key) {
  return typeof key === "number" &&
    Number.isSafeInteger(key) &&
    key >= 1;
}

function cloneState(state) {
  return {
    levels: (state.levels || []).map(function (row) { return row.slice(); }),
    finds: (state.finds || []).map(function (row) { return row.slice(); }),
    paths: (state.paths || []).map(function (row) {
      return row.map(function (step) { return step.slice(); });
    }),
    inserted: state.inserted || 0,
    removed: state.removed || 0,
    compares: state.compares || 0
  };
}

export function insert(state, key) {
  if (!isPositiveInteger(key)) {
    fail("E_BAD_KEY");
  }
  const next = cloneState(state);
  const top = next.levels.length;
  if (top > 0 && next.levels[0].indexOf(key) >= 0) {
    fail("E_DUP");
  }
  const level = levelOf(key);
  while (next.levels.length < level) {
    next.levels.push([]);
  }
  for (let layer = 0; layer < level; layer += 1) {
    next.levels[layer] = insertedInto(next.levels[layer], key);
  }
  next.inserted += 1;
  return next;
}

export function remove(state, key) {
  if (!isPositiveInteger(key)) {
    fail("E_BAD_KEY");
  }
  const next = cloneState(state);
  if (next.levels.length === 0 || next.levels[0].indexOf(key) < 0) {
    fail("E_NO_KEY");
  }
  for (let layer = 0; layer < next.levels.length; layer += 1) {
    next.levels[layer] = removedOut(next.levels[layer], key);
  }
  while (next.levels.length > 0 && next.levels[next.levels.length - 1].length === 0) {
    next.levels.pop();
  }
  next.removed += 1;
  return next;
}

export function find(state, key) {
  if (!isPositiveInteger(key)) {
    fail("E_BAD_KEY");
  }
  const next = cloneState(state);
  const levels = next.levels;
  let compares = 0;
  const path = [];
  let current = 0;
  for (let layer = levels.length - 1; layer >= 0; layer -= 1) {
    const row = levels[layer];
    let idx = current === 0 ? -1 : row.indexOf(current);
    while (idx + 1 < row.length) {
      const successor = row[idx + 1];
      if (successor <= key) {
        compares += 1;
        idx += 1;
        current = successor;
      } else {
        break;
      }
    }
    path.push([layer + 1, current]);
  }
  const found = current === key;
  next.finds.push([key, found, compares]);
  next.paths.push(path);
  next.compares += compares;
  return next;
}
