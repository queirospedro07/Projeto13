async function asyncMap(items, callback) {
  const result = [];
  for (let index = 0; index < items.length; index++)
    result.push(await callback(items[index], index, items));
  return result;
}
async function asyncFilter(items, callback) {
  const result = [];
  for (let index = 0; index < items.length; index++)
    if (await callback(items[index], index, items)) result.push(items[index]);
  return result;
}
async function asyncSome(items, callback) {
  for (let index = 0; index < items.length; index++)
    if (await callback(items[index], index, items)) return true;
  return false;
}
async function asyncEvery(items, callback) {
  for (let index = 0; index < items.length; index++)
    if (!(await callback(items[index], index, items))) return false;
  return true;
}
async function asyncForEach(items, callback) {
  await asyncMap(items, callback);
}
exports.asyncMap = asyncMap;
exports.asyncFilter = asyncFilter;
exports.asyncSome = asyncSome;
exports.asyncEvery = asyncEvery;
exports.asyncForEach = asyncForEach;
