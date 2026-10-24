import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createSirByte} from './sir-byte.mjs';
// Node provides Blob but not FileReader. This adapter only supports exporter reads.
globalThis.FileReader=class{
 readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}
 readAsDataURL(blob){blob.arrayBuffer().then(result=>{this.result=`data:${blob.type};base64,${Buffer.from(result).toString('base64')}`;this.onloadend?.();});}
};
const byte=createSirByte();
const model=byte.makeExportModel();
const buffer=await new GLTFExporter().parseAsync(model,{binary:true});
assert.equal(new DataView(buffer).getUint32(0,true),0x46546c67);
const loaded=await new GLTFLoader().parseAsync(buffer,'');
let meshes=0;loaded.scene.traverse(o=>{if(o.isMesh){meshes++;for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));}});
assert.ok(loaded.scene.getObjectByName('EyeLeftStatic'));assert.ok(loaded.scene.getObjectByName('BowlerHat'));
const before=new THREE.Box3().setFromObject(model),after=new THREE.Box3().setFromObject(loaded.scene);
assert.ok(before.min.distanceTo(after.min)<1e-5);assert.ok(before.max.distanceTo(after.max)<1e-5);
await writeFile(new URL('./sir-byte.glb',import.meta.url),new Uint8Array(buffer));
console.log(JSON.stringify({file:'sir-byte.glb',bytes:buffer.byteLength,meshes,triangles:byte.triangles,dimensions:after.getSize(new THREE.Vector3()).toArray(),reimport:'PASS'}));
