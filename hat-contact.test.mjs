import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createSirByte} from './sir-byte.mjs';

test('tilted bowler brim clears the head shell and still rests on it',()=>{
 const byte=createSirByte();byte.root.updateMatrixWorld(true);
 const shell=byte.root.getObjectByName('HeadShell');
 const brim=byte.root.getObjectByName('HatBrim');
 const ray=new THREE.Raycaster();const p=new THREE.Vector3();
 let minClearance=Infinity,samples=0;
 // Sample the underside of the actual ellipsoidal brim, including its interior.
 for(let i=-40;i<=40;i++)for(let j=-40;j<=40;j++){
  const x=i/40,z=j/40;if(x*x+z*z>1)continue;
  p.set(x,-Math.sqrt(Math.max(0,1-x*x-z*z)),z).applyMatrix4(brim.matrixWorld);
  ray.set(new THREE.Vector3(p.x,10,p.z),new THREE.Vector3(0,-1,0));
  const hit=ray.intersectObject(shell,false)[0];if(!hit)continue;
  minClearance=Math.min(minClearance,p.y-hit.point.y);samples++;
 }
 console.log(JSON.stringify({samples,minClearance}));
 assert.ok(minClearance>=-.001,`Brim penetrates head by ${-minClearance}`);
 assert.ok(minClearance<.015,`Hat floats above head by ${minClearance}`);
});
