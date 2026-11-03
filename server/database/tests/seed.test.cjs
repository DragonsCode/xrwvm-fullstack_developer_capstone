const assert = require('node:assert/strict');
const {test} = require('node:test');
const {seedModel} = require('../seed');
test('seeding twice preserves existing records and inserts each missing ID once', async () => {
  const records = new Map([[1, {id: 1, review: 'existing user content'}]]);
  const model = {async updateOne(filter, update, options) {
    assert.deepEqual(Object.keys(update), ['$setOnInsert']);
    assert.equal(options.upsert, true);
    if (!records.has(filter.id)) records.set(filter.id, {...update.$setOnInsert});
  }};
  const fixtures = [{id: 1, review: 'fixture'}, {id: 2, review: 'new fixture'}];
  await seedModel(model, fixtures);
  await seedModel(model, fixtures);
  assert.equal(records.size, 2);
  assert.equal(records.get(1).review, 'existing user content');
  assert.equal(records.get(2).review, 'new fixture');
});
test('invalid fixture IDs fail before the write', async () => {
  let writes = 0;
  await assert.rejects(seedModel({updateOne() {writes++;}}, [{id: undefined}]));
  assert.equal(writes, 0);
});
test('a database write failure is propagated', async () => {
  await assert.rejects(seedModel({async updateOne() {throw new Error('synthetic failure');}}, [{id: 2}]));
});
