import test from 'node:test';
import assert from 'node:assert/strict';
import { ByteBehavior } from './behavior.mjs';

test('a first mistake is cheeky; consecutive mistakes receive support; success resets this', () => {
  const b = new ByteBehavior();
  b.feedback(false); assert.equal(b.state, 'cheeky');
  b.feedback(false); assert.equal(b.state, 'support');
  b.feedback(true); assert.equal(b.state, 'celebrate');
  b.feedback(false); assert.equal(b.state, 'cheeky');
});
test('a new reaction interrupts the old one and returns to calm after its duration', () => {
  const b = new ByteBehavior();
  b.react('celebrate'); b.update(1);
  b.react('think'); b.update(1); assert.equal(b.state, 'think');
  b.update(8); assert.equal(b.state, 'idle');
});
test('gaze remains within safe limits and invalid reactions are rejected', () => {
  const b = new ByteBehavior(); b.lookAt(9, -9);
  assert.equal(b.gaze.x, 1); assert.equal(b.gaze.y, -1);
  assert.throws(() => b.react('bad-state'), /Unknown/);
});
