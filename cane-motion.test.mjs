import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createSirByte,TASK_DIRECTIONS} from './sir-byte.mjs';

function advance(byte,seconds,options){for(let t=0;t<seconds;t+=.02)byte.update(.02,options);}

test('all 15 task presets point in character-local 3D space, independent of the camera',()=>{
 for(const yaw of [0,1.2,-2.1]){
  const byte=createSirByte(),cane=byte.root.getObjectByName('IdleCane');
  byte.root.rotation.y=yaw;
  const viewerQuaternion=new THREE.Quaternion().setFromEuler(new THREE.Euler(-.15,.65,0));
  for(const [name,direction] of Object.entries(TASK_DIRECTIONS)){
   byte.pointAtTask(name);advance(byte,2,{viewerQuaternion});byte.root.updateMatrixWorld(true);
   const knob=cane.getObjectByName('CaneKnob').getWorldPosition(new THREE.Vector3());
   const tip=cane.getObjectByName('CaneTip').getWorldPosition(new THREE.Vector3());
   const actualDirection=knob.sub(tip).normalize();
   const expectedDirection=new THREE.Vector3(direction.x,direction.y,direction.z).normalize().applyQuaternion(byte.root.quaternion);
   assert.ok(actualDirection.dot(expectedDirection)>.99999,`${name}: wrong 3D direction after rotating the character`);
   const side=direction.x<0?'Left':'Right',arm=byte.root.getObjectByName(`Flipper${side}Rig`);
   const flipper=byte.root.getObjectByName(`Flipper${side}`);
   const flipperTip=flipper.localToWorld(new THREE.Vector3(0,-1,0));
   const armAxis=flipperTip.clone().sub(arm.getWorldPosition(new THREE.Vector3())).normalize();
   const caneAxis=new THREE.Vector3(0,1,0).transformDirection(cane.getObjectByName('CaneSpin').matrixWorld);
   assert.ok(armAxis.dot(caneAxis)>.99999,`${name}: cane must extend the arm along the same axis`);
   const caneEnd=cane.getObjectByName('CaneTip').localToWorld(new THREE.Vector3(0,-.0325,0));
   const gap=caneEnd.sub(flipperTip);
   assert.ok(Math.abs(gap.length()-.055)<1e-6,`${name}: keep a small consistent hover gap`);
   assert.ok(gap.normalize().dot(armAxis)>.99999,`${name}: cane must start beyond the flipper, not beside it`);
   const uniforms=byte.root.getObjectByName('LiveDisplayEyes').material.uniforms;
   assert.ok(uniforms.wink.value>.99);assert.equal(uniforms.blink.value,0);
   const held=cane.matrixWorld.clone();advance(byte,15,{viewerPosition:new THREE.Vector3(-8,4,-6),viewerQuaternion:new THREE.Quaternion()});byte.root.updateMatrixWorld(true);
   assert.equal(byte.behavior.state,'point');assert.equal(cane.visible,true);
   assert.ok(cane.matrixWorld.elements.every((value,i)=>Math.abs(value-held.elements[i])<1e-9),'Held cane must remain static');
  }
 }
});

test('world targets stay on the arm-and-cane ray through parent transforms and character movement',()=>{
 const parent=new THREE.Group(),byte=createSirByte();parent.add(byte.root);
 parent.position.set(2,.4,-3);parent.rotation.y=.7;
 byte.root.position.set(.3,.2,.8);byte.root.rotation.y=1.1;byte.root.scale.setScalar(.7);
 const cane=byte.root.getObjectByName('IdleCane'),floatRig=byte.root.getObjectByName('FloatRig');
 byte.update(.02,{reducedMotion:true});parent.updateMatrixWorld(true);
 for(const localTarget of [new THREE.Vector3(-3,3,6),new THREE.Vector3(0,1.2,7),new THREE.Vector3(3,-1,5)]){
  const target=floatRig.localToWorld(localTarget.clone());byte.pointAtTask(target);
  for(let step=0;step<2;step++){
   if(step){byte.root.rotation.y+=.25;byte.root.position.x+=.1;}
   advance(byte,.1,{reducedMotion:true});parent.updateMatrixWorld(true);
   const caneEnd=cane.getObjectByName('CaneTip').localToWorld(new THREE.Vector3(0,-.0325,0));
   const side=['Left','Right'].sort((a,b)=>{
    const end=name=>byte.root.getObjectByName(`Flipper${name}`).localToWorld(new THREE.Vector3(0,-1,0));
    return end(a).distanceTo(caneEnd)-end(b).distanceTo(caneEnd);
   })[0];
   const shoulder=byte.root.getObjectByName(`Flipper${side}Rig`).getWorldPosition(new THREE.Vector3());
   const axis=new THREE.Vector3(0,1,0).transformDirection(cane.getObjectByName('CaneSpin').matrixWorld);
   const towardTarget=target.clone().sub(shoulder).normalize();
   assert.ok(axis.dot(towardTarget)>.99999,'Arm and cane must aim at the world target');
   assert.ok(new THREE.Vector3().crossVectors(target.clone().sub(caneEnd),axis).length()<1e-5,'Target must lie on the cane ray');
  }
 }
 assert.throws(()=>byte.pointAtTask({x:0,y:NaN,z:1}),/finite world position/);
});

test('task pointing works with reduced motion, rejects bad names, and exits on a new reaction',()=>{
 const byte=createSirByte(),cane=byte.root.getObjectByName('IdleCane');
 byte.pointAtTask('bottom-right');advance(byte,1,{reducedMotion:true});
 assert.equal(cane.visible,true);assert.equal(byte.behavior.state,'point');
 assert.throws(()=>byte.pointAtTask('upside-down'),/Unknown task direction/);
 byte.behavior.react('think');byte.update(.02);assert.equal(cane.visible,false);
 advance(byte,1);assert.ok(byte.root.getObjectByName('LiveDisplayEyes').material.uniforms.wink.value<.01);
});

test('idle cane appears, makes two full turns, and rests before repeating',()=>{
 const byte=createSirByte(),cane=byte.root.getObjectByName('IdleCane');
 assert.equal(cane.visible,false);
 advance(byte,8);assert.equal(cane.visible,false);
 advance(byte,2.7);assert.equal(cane.visible,true);
 assert.ok(cane.getObjectByName('CaneSpin').rotation.x>0);
 advance(byte,1.4);assert.ok(Math.abs(cane.getObjectByName('CaneSpin').rotation.x-Math.PI*4)<1e-6);
 assert.equal(byte.makeExportModel().getObjectByName('IdleCane'),undefined);
 advance(byte,2);assert.equal(cane.visible,false);
 advance(byte,12);assert.equal(cane.visible,false);
});

test('preview floats outside the body and above ground, with appearance and disappearance pops',()=>{
 const byte=createSirByte(),cane=byte.root.getObjectByName('IdleCane');let pops=0;
 byte.root.addEventListener('cane-pop',()=>pops++);
 assert.equal(cane.parent.name,'FloatRig');
 byte.playCane();
 for(let i=0;i<250;i++){
  byte.update(.02);byte.root.updateMatrixWorld(true);
  if(!cane.visible)continue;
  const bounds=new THREE.Box3().setFromObject(cane.getObjectByName('CaneSpin'));
  assert.ok(bounds.min.y>.2,`Cane is too low: ${bounds.min.y}`);
  assert.ok(bounds.min.x>1.08,`Cane intersects character: ${bounds.min.x}`);
 }
 assert.equal(pops,2);assert.equal(cane.visible,false);
 byte.playCane();advance(byte,.5);assert.equal(pops,3);
 byte.update(.02,{reducedMotion:true});byte.playCane();advance(byte,1,{reducedMotion:true});
 assert.equal(cane.visible,false);assert.equal(pops,3);
});

test('celebration raises the knob in a victory salute for 1.5 seconds, then twirls and pops away',()=>{
 const byte=createSirByte(),cane=byte.root.getObjectByName('IdleCane'),spin=cane.getObjectByName('CaneSpin');
 const viewerPosition=new THREE.Vector3(3.15,2.6,8.6),events=[];
 byte.root.addEventListener('cane-pop',event=>events.push(event.phase));
 byte.behavior.react('celebrate');
 const options={speaking:true,speechTime:1,speechDuration:4,viewerPosition};
 advance(byte,.7,options);
 for(let i=0;i<70;i++){
  byte.update(.02,options);byte.root.updateMatrixWorld(true);
  assert.equal(cane.visible,true);
  const direction=new THREE.Vector3(0,1,0).transformDirection(spin.matrixWorld);
  assert.ok(direction.y>.88,'Gold knob must point steeply upward in the victory pose');
  const knob=cane.getObjectByName('CaneKnob').getWorldPosition(new THREE.Vector3());
  const tip=cane.getObjectByName('CaneTip').getWorldPosition(new THREE.Vector3());
  assert.ok(knob.y>tip.y+.8,'Knob must be above the shaft, rather than the tip pointing up');
  assert.ok(cane.getWorldPosition(new THREE.Vector3()).y>1.8,'Raise the cane beside the head');
  assert.equal(spin.scale.x,1.15,'The entire cane is 15% larger');
 }
 advance(byte,1,options);assert.ok(spin.rotation.x>1,'Twirl follows the pointing hold');
 // Finishing the voice returns the behavior to idle without cutting off the flourish.
 byte.behavior.react('idle');advance(byte,.4);assert.equal(cane.visible,true);
 advance(byte,1.6);assert.equal(cane.visible,false);
 assert.deepEqual(events,['appear','disappear']);
});

test('other reactions and reduced motion interrupt celebration without a disappearance sound',()=>{
 for(const mode of ['reaction','reduced']){
  const byte=createSirByte(),events=[];
  byte.root.addEventListener('cane-pop',event=>events.push(event.phase));
  byte.behavior.react('celebrate');advance(byte,1);
  if(mode==='reaction')byte.behavior.react('think');
  advance(byte,1,{reducedMotion:mode==='reduced'});
  assert.equal(byte.root.getObjectByName('IdleCane').visible,false);
  assert.deepEqual(events,['appear']);
 }
});

test('speech, reactions and reduced motion cancel the cane and require a fresh idle wait',()=>{
 for(const mode of ['speech','reaction','reduced']){
  const byte=createSirByte(),cane=byte.root.getObjectByName('IdleCane');
  advance(byte,10);assert.equal(cane.visible,true);
  if(mode==='reaction')byte.behavior.react('think');
  const options={speaking:mode==='speech',reducedMotion:mode==='reduced'};
  byte.update(.02,options);assert.equal(cane.visible,false);
  for(let i=0;i<1750;i++){
   if(mode==='reaction')byte.behavior.react('think');
   byte.update(.02,options);
   assert.equal(cane.visible,false);
  }
  byte.behavior.react('idle');
  advance(byte,5);assert.equal(cane.visible,false);
 }
});
