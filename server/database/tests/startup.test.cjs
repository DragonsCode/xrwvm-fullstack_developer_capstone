const assert = require('node:assert/strict');
const {test} = require('node:test');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function load(isMain = false, connectFails = false) {
  const writes = [];
  let connected = 0;
  let listening = 0;
  const app = {use() {}, get() {}, post() {}, listen() { listening++; }};
  const express = () => app;
  express.raw = () => () => {};
  const model = {deleteMany: async () => writes.push('delete'), insertMany: async () => writes.push('insert')};
  const module = {exports: {}};
  const requireMock = name => {
    if (name === 'express') return express;
    if (name === 'mongoose') return {connect: async () => { connected++; if (connectFails) throw new Error('synthetic-private-detail'); }};
    if (name === 'cors') return () => () => {};
    if (name === 'body-parser') return {urlencoded: () => () => {}};
    if (name === 'fs') return {readFileSync: () => '{"reviews": [], "dealerships": []}'};
    if (name === './review' || name === './dealership') return model;
    return require(name);
  };
  requireMock.main = isMain ? module : {};
  const errors = [];
  const processMock = {env: {}, exitCode: 0};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8'), {
    require: requireMock, module, __dirname: path.join(__dirname, '..'),
    process: processMock, console: {log() {}, error: message => errors.push(message)},
  });
  return {writes, app, module, processMock, errors, counts: () => ({connected, listening})};
}
test('import has no database writes, connections or listeners', async () => {
  const state = load();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(state.writes, []);
  assert.deepEqual(state.counts(), {connected: 0, listening: 0});
});
test('start connects before listening without deleting or seeding data', async () => {
  const state = load();
  await state.module.exports.start();
  assert.deepEqual(state.writes, []);
  assert.deepEqual(state.counts(), {connected: 1, listening: 1});
});
test('a failed connection prevents listening', async () => {
  const state = load(false, true);
  await assert.rejects(state.module.exports.start());
  assert.equal(state.counts().listening, 0);
  assert.deepEqual(state.writes, []);
});
