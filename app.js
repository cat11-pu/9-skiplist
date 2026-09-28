// app.js：渲染分层链路图的结果
import { levelOf, insertedInto, removedOut } from "./skiplist.js";
import { insert, find, remove } from "./ops.js";

function copyState(state) {
  return {
    levels: (state.levels || []).map(function (row) { return row.slice(); }),
    finds: (state.finds || []).map(function (row) { return row.slice(); }),
    paths: (state.paths || []).map(function (row) { return row.map(function (p) { return p.slice(); }); }),
    inserted: state.inserted || 0,
    removed: state.removed || 0,
    compares: state.compares || 0
  };
}

export function render(spec) {
  let state = copyState(spec.state);
  const failed = [];
  for (const event of spec.events || []) {
    try {
      if (event.kind === "insert") {
        state = insert(state, event.key);
      } else if (event.kind === "find") {
        state = find(state, event.key);
      } else if (event.kind === "remove") {
        state = remove(state, event.key);
      } else {
        throw Object.assign(new Error("E_BAD_EVENT"), { code: "E_BAD_EVENT" });
      }
    } catch (error) {
      failed.push([event.kind, error && error.code ? error.code : "E_BAD_EVENT"]);
    }
  }
  const top = state.levels.length;
  let ordered = true;
  let covering = true;
  state.levels.forEach(function (row, spot) {
    for (let at = 1; at < row.length; at += 1) {
      if (row[at - 1] >= row[at]) {
        ordered = false;
      }
    }
    if (spot > 0) {
      for (const key of row) {
        if (state.levels[spot - 1].indexOf(key) < 0) {
          covering = false;
        }
      }
    }
  });
  let boundOk = true;
  for (const row of state.finds) {
    if (row[2] > 2 * top) {
      boundOk = false;
    }
  }
  const half = Math.ceil((spec.events || []).length / 2);
  const firstHalf = (spec.events || []).slice(0, half);
  const secondHalf = (spec.events || []).slice(half);
  const fingerprint = function (s) {
    return JSON.stringify({ levels: s.levels, finds: s.finds, paths: s.paths,
                            inserted: s.inserted, removed: s.removed, compares: s.compares });
  };
  let once = copyState(spec.state);
  let oneFailed = 0;
  for (const event of spec.events || []) {
    try {
      once = event.kind === "insert" ? insert(once, event.key)
        : event.kind === "find" ? find(once, event.key) : remove(once, event.key);
    } catch (error) {
      oneFailed += 1;
    }
  }
  let left = copyState(spec.state);
  for (const event of firstHalf) {
    try {
      left = event.kind === "insert" ? insert(left, event.key)
        : event.kind === "find" ? find(left, event.key) : remove(left, event.key);
    } catch (error) { /* 前一半出错就跳过 */ }
  }
  const midFingerprint = fingerprint(left);
  let right = left;
  for (const event of secondHalf) {
    try {
      right = event.kind === "insert" ? insert(right, event.key)
        : event.kind === "find" ? find(right, event.key) : remove(right, event.key);
    } catch (error) { /* 后一半出错就跳过 */ }
  }
  const replay = copyState(spec.state);
  let replayFailed = 0;
  for (const event of spec.events || []) {
    try {
      replay = event.kind === "insert" ? insert(replay, event.key)
        : event.kind === "find" ? find(replay, event.key) : remove(replay, event.key);
    } catch (error) {
      replayFailed += 1;
    }
  }
  return { levels: state.levels.map(function (row) { return row.slice(); }),
           top: top, keys: state.levels.length > 0 ? state.levels[0].length : 0,
           finds: state.finds.map(function (row) { return row.slice(); }),
           paths: state.paths.map(function (row) { return row.map(function (p) { return p.slice(); }); }),
           inserted: state.inserted, removed: state.removed, compares: state.compares,
           bound_ok: boundOk, ordered: ordered, covering: covering,
           replay_new: fingerprint(replay) === fingerprint(state) ? 0 : 1,
           replay_failed: replayFailed,
           mid_differs: midFingerprint !== fingerprint(state),
           split_equal: fingerprint(right) === fingerprint(once) && oneFailed === 0,
           failed_events: failed.length, failed_marks: failed,
           count_events: (spec.events || []).length,
           tail: levelOf(7) + insertedInto([1, 3], 2).length + removedOut([1, 2, 3], 2).length };
}
