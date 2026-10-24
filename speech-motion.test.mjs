import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleSpeech} from './speech-motion.mjs';
test('speech starts and ends softly instead of snapping into a pose',()=>{
 assert.equal(sampleSpeech(0,14,.5).weight,0);
 assert.ok(sampleSpeech(1,14,.5).weight>.9);
 assert.equal(sampleSpeech(14,14,.5).weight,0);
});
test('audio energy adds a small accent, while silent passages remain calm',()=>{
 const quiet=sampleSpeech(5,14,0),loud=sampleSpeech(5,14,1);
 assert.ok(Math.abs(loud.pitch-quiet.pitch)>0);
 assert.ok(Math.abs(loud.pitch-quiet.pitch)<.08);
 assert.ok(Math.abs(quiet.rightArm)<1.2);
});
test('replay is repeatable and invalid media metadata yields a safe pose',()=>{
 assert.deepEqual(sampleSpeech(2,14,.3),sampleSpeech(2,14,.3));
 for(const value of Object.values(sampleSpeech(NaN,Infinity,NaN)))assert.ok(Number.isFinite(value));
});
