import fs from "node:fs";
import { levelOf, insertedInto, removedOut } from "./skiplist.js";
import { insert, find, remove } from "./ops.js";

const __lines = [];
function emit(label, value) {
  __lines.push([String(label).replace(/ =$/, ""), value]);
}

const spec = JSON.parse(fs.readFileSync(process.argv[2] || "sample/keys.json", "utf8"));
const copy = function (s) {
  return { levels: (s.levels || []).map(function (r) { return r.slice(); }),
           finds: (s.finds || []).map(function (r) { return r.slice(); }),
           paths: (s.paths || []).map(function (r) { return r.map(function (p) { return p.slice(); }); }),
           inserted: s.inserted || 0, removed: s.removed || 0, compares: s.compares || 0 };
};
let state = copy(spec.state);
let failed = 0;
for (const event of spec.events || []) {
  try {
    if (event.kind === "insert") { state = insert(state, event.key); }
    else if (event.kind === "find") { state = find(state, event.key); }
    else { state = remove(state, event.key); }
  } catch (error) { failed += 1; }
}
const top = state.levels.length;
const fingerprint = function (s) {
  return JSON.stringify({ levels: s.levels, finds: s.finds, paths: s.paths,
                          inserted: s.inserted, removed: s.removed, compares: s.compares });
};
let once = copy(spec.state);
for (const event of spec.events || []) {
  try {
    once = event.kind === "insert" ? insert(once, event.key)
      : event.kind === "find" ? find(once, event.key) : remove(once, event.key);
  } catch (error) { /* 跳过非法事件 */ }
}
const half = Math.ceil((spec.events || []).length / 2);
let left = copy(spec.state);
for (const event of (spec.events || []).slice(0, half)) {
  try {
    left = event.kind === "insert" ? insert(left, event.key)
      : event.kind === "find" ? find(left, event.key) : remove(left, event.key);
  } catch (error) { /* 跳过 */ }
}
const midFingerprint = fingerprint(left);
let right = left;
for (const event of (spec.events || []).slice(half)) {
  try {
    right = event.kind === "insert" ? insert(right, event.key)
      : event.kind === "find" ? find(right, event.key) : remove(right, event.key);
  } catch (error) { /* 跳过 */ }
}
let replay = copy(spec.state);
let replayFailed = 0;
for (const event of spec.events || []) {
  try {
    replay = event.kind === "insert" ? insert(replay, event.key)
      : event.kind === "find" ? find(replay, event.key) : remove(replay, event.key);
  } catch (error) { replayFailed += 1; }
}
let boundOk = true;
for (const row of state.finds) {
  if (row[2] > 2 * top) { boundOk = false; }
}
let ordered = true;
let covering = true;
state.levels.forEach(function (row, spot) {
  for (let at = 1; at < row.length; at += 1) {
    if (row[at - 1] >= row[at]) { ordered = false; }
  }
  if (spot > 0) {
    for (const key of row) {
      if (state.levels[spot - 1].indexOf(key) < 0) { covering = false; }
    }
  }
});

emit("收尾后各层", JSON.stringify(state.levels));
emit("收尾后最高层", top);
emit("收尾后键数", state.levels.length > 0 ? state.levels[0].length : 0);
emit("收尾后查找记录", JSON.stringify(state.finds));
emit("收尾后路径记录", JSON.stringify(state.paths));
emit("插入成功数", state.inserted);
emit("删除成功数", state.removed);
emit("比较总次数", state.compares);
emit("每次查找未超上界", boundOk);
emit("各层有序无重复", ordered);
emit("层包含成立", covering);
emit("重放不新增", fingerprint(replay) === fingerprint(state) ? 0 : 1);
emit("重放报错条数", replayFailed);
emit("拆两轮中间态不同", midFingerprint !== fingerprint(state));
emit("拆两轮收尾态一致", fingerprint(right) === fingerprint(once));
emit("异常事件数", failed);

// ---- 异常路径探针：真调用实现，看它报出什么码 ----
try {
  insert(copy(spec.state), 0);
  emit("键不合法报码", "没有报错");
} catch (error) {
  emit("键不合法报码", error && error.code ? error.code : String(error.message));
}
try {
  let s = copy(spec.state);
  s = insert(s, 3);
  insert(s, 3);
  emit("重复插入报码", "没有报错");
} catch (error) {
  emit("重复插入报码", error && error.code ? error.code : String(error.message));
}
try {
  remove(copy(spec.state), 3);
  emit("删除缺失报码", "没有报错");
} catch (error) {
  emit("删除缺失报码", error && error.code ? error.code : String(error.message));
}

// ---- 期望值（参考模型算出）----
const EXPECTED = {
  "收尾后各层": [
    [
      5,
      6,
      7
    ],
    [
      5,
      7
    ],
    [
      7
    ],
    [
      7
    ]
  ],
  "收尾后最高层": 4,
  "收尾后键数": 3,
  "收尾后查找记录": [
    [
      6,
      true,
      3
    ],
    [
      4,
      false,
      1
    ],
    [
      7,
      true,
      1
    ]
  ],
  "收尾后路径记录": [
    [
      [
        3,
        3
      ],
      [
        2,
        5
      ],
      [
        1,
        6
      ]
    ],
    [
      [
        4,
        0
      ],
      [
        3,
        3
      ],
      [
        2,
        3
      ],
      [
        1,
        3
      ]
    ],
    [
      [
        4,
        7
      ],
      [
        3,
        7
      ],
      [
        2,
        7
      ],
      [
        1,
        7
      ]
    ]
  ],
  "插入成功数": 4,
  "删除成功数": 1,
  "比较总次数": 5,
  "每次查找未超上界": true,
  "各层有序无重复": true,
  "层包含成立": true,
  "重放不新增": 0,
  "重放报错条数": 0,
  "拆两轮中间态不同": true,
  "拆两轮收尾态一致": true,
  "异常事件数": 0,
  "键不合法报码": "E_BAD_KEY",
  "重复插入报码": "E_DUP",
  "删除缺失报码": "E_NO_KEY"
};
function __same(got, want) {
  if (typeof got === "string") {
    try { const parsed = JSON.parse(got); if (JSON.stringify(parsed) === JSON.stringify(want)) return true; } catch (error) { }
  }
  return JSON.stringify(got) === JSON.stringify(want);
}
let __bad = 0;
for (const [label, want] of Object.entries(EXPECTED)) {
  const found = __lines.find((pair) => pair[0] === label);
  if (!found) { __bad += 1; console.log("缺失验收项 " + label); continue; }
  if (__same(found[1], want)) { console.log("一致 " + label + " = " + JSON.stringify(found[1])); }
  else { __bad += 1; console.log("不一致 " + label + " 期望 " + JSON.stringify(want) + " 实际 " + JSON.stringify(found[1])); }
}
console.log("验收项 " + (Object.keys(EXPECTED).length - __bad) + "/" + Object.keys(EXPECTED).length + " 通过");
process.exit(__bad === 0 ? 0 : 1);
