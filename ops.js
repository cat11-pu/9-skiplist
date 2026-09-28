// ops.js：插入、查找、删除（纯函数：返回新状态，不改输入）
import { levelOf, insertedInto, removedOut } from "./skiplist.js";

function isPositiveInteger(key) {
  return Number.isInteger(key) && key > 0;
}

function fail(code) {
  throw Object.assign(new Error(code), { code: code });
}

function cloneState(state) {
  return {
    levels: (state.levels || []).map(function (row) { return row.slice(); }),
    finds: (state.finds || []).map(function (row) { return row.slice(); }),
    paths: (state.paths || []).map(function (row) {
      return row.map(function (point) { return point.slice(); });
    }),
    inserted: state.inserted || 0,
    removed: state.removed || 0,
    compares: state.compares || 0
  };
}

function hasKey(state, key) {
  return state.levels.length > 0 && state.levels[0].indexOf(key) >= 0;
}

export function insert(state, key) {
  if (!isPositiveInteger(key)) {
    fail("E_BAD_KEY");
  }
  const next = cloneState(state);
  if (hasKey(next, key)) {
    fail("E_DUP");
  }
  const height = levelOf(key);
  while (next.levels.length < height) {
    next.levels.push([]);
  }
  for (let level = 0; level < height; level += 1) {
    next.levels[level] = insertedInto(next.levels[level], key);
  }
  next.inserted += 1;
  return next;
}

export function find(state, key) {
  const next = cloneState(state);
  const path = [];
  let compares = 0;
  let current = null;
  for (let spot = next.levels.length - 1; spot >= 0; spot -= 1) {
    const row = next.levels[spot];
    let pos = current === null ? -1 : row.indexOf(current);
    while (pos + 1 < row.length && row[pos + 1] <= key) {
      pos += 1;
      current = row[pos];
      compares += 1;
    }
    path.push([spot + 1, current === null ? 0 : current]);
  }
  const found = current !== null && current === key;
  next.finds.push([key, found, compares]);
  next.paths.push(path);
  next.compares += compares;
  return next;
}

export function remove(state, key) {
  if (!isPositiveInteger(key)) {
    fail("E_BAD_KEY");
  }
  const next = cloneState(state);
  if (!hasKey(next, key)) {
    fail("E_NO_KEY");
  }
  next.levels = next.levels.map(function (row) { return removedOut(row, key); });
  while (next.levels.length > 0 && next.levels[next.levels.length - 1].length === 0) {
    next.levels.pop();
  }
  next.removed += 1;
  return next;
}
