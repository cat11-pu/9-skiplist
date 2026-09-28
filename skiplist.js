// skiplist.js：确定性层高（二进制末尾连续一的个数加一）、升序插入、按值移除
export function levelOf(key) {
  let probe = key;
  let height = 1;
  while ((probe & 1) === 1) {
    height += 1;
    probe = Math.floor(probe / 2);
  }
  return height;
}

export function insertedInto(list, key) {
  const next = list.slice();
  let at = 0;
  while (at < next.length && next[at] < key) {
    at += 1;
  }
  next.splice(at, 0, key);
  return next;
}

export function removedOut(list, key) {
  return list.filter(function (item) { return item !== key; });
}
