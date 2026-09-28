// skiplist.js：确定性层高（二进制末尾连续一的个数加一）、升序插入、按值移除

// 层高：key 二进制末尾连续 1 的个数加一。
// 调用方保证 key 为正整数；正整数不断折半必然收敛。
export function levelOf(key) {
  let ones = 0;
  let probe = Number(key);
  while (probe > 0 && (probe & 1) === 1) {
    ones += 1;
    probe = Math.floor(probe / 2);
  }
  return ones + 1;
}

// 把 key 按升序插进 list，返回新列表；已存在则不重复放置。
export function insertedInto(list, key) {
  const next = [];
  let placed = false;
  for (const item of list) {
    if (!placed && item >= key) {
      if (item !== key) {
        next.push(key);
      }
      placed = true;
    }
    next.push(item);
  }
  if (!placed) {
    next.push(key);
  }
  return next;
}

// 从 list 中移除等于 key 的元素，返回新列表。
export function removedOut(list, key) {
  return list.filter(function (item) { return item !== key; });
}
