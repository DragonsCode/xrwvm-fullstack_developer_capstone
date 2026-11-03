const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('concurrent review requests keep their own submitted fields', async () => {
  let insertReview;
  const pending = [];
  const app = {use() {}, get() {}, post(route, middleware, handler) { insertReview = handler; }};
  const express = () => app;
  express.raw = () => () => {};
  class Reviews {
    constructor(fields) { this.fields = fields; }
    async save() { return this.fields; }
    static find() { return {sort: () => new Promise(resolve => pending.push(resolve))}; }
  }
  const requireMock = name => {
    if (name === 'express') return express;
    if (name === 'mongoose') return {};
    if (name === 'cors') return () => () => {};
    if (name === 'body-parser') return {urlencoded: () => () => {}};
    if (name === './review') return Reviews;
    if (name === './dealership') return {};
    throw new Error('Unexpected dependency');
  };
  const context = {require: requireMock, module: {exports: {}}, console};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8'), context);
  const saved = [];
  const response = index => ({json: value => { saved[index] = value; }});
  const first = insertReview({body: JSON.stringify({name: 'first', review: 'synthetic A'})}, response(0));
  const second = insertReview({body: JSON.stringify({name: 'second', review: 'synthetic B'})}, response(1));
  pending[0]([{id: 5}]);
  pending[1]([{id: 5}]);
  await Promise.all([first, second]);
  assert.equal(saved[0].name, 'first');
  assert.equal(saved[1].name, 'second');
  assert.equal(Object.hasOwn(context, 'data'), false);
});
