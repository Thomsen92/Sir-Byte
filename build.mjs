import {mkdir,copyFile,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const out=path.join(root,'dist');
async function copy(source,target=source){const destination=path.join(out,target);await mkdir(path.dirname(destination),{recursive:true});await copyFile(path.join(root,source),destination);}
await mkdir(out,{recursive:true});
for(const file of ['style.css','main.mjs','sir-byte.mjs','behavior.mjs','speech-motion.mjs','sir-byte.glb','audio/sir-byte-splendid.mp3'])await copy(file);
for(const file of ['build/three.module.js','build/three.core.js','examples/jsm/controls/OrbitControls.js','examples/jsm/environments/RoomEnvironment.js','examples/jsm/exporters/GLTFExporter.js','examples/jsm/geometries/RoundedBoxGeometry.js','LICENSE'])await copy('node_modules/three/'+file,'vendor/three/'+file);
const html=await readFile(path.join(root,'index.html'),'utf8');
await writeFile(path.join(out,'index.html'),html.replaceAll('./node_modules/three/','./vendor/three/'));
await writeFile(path.join(out,'.nojekyll'),'');
console.log('Built static GitHub Pages site in dist/');
