import {mkdir,copyFile,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {VOICE_CLIPS} from './voice-clips.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const out=path.join(root,'dist');
async function copy(source,target=source){const destination=path.join(out,target);await mkdir(path.dirname(destination),{recursive:true});await copyFile(path.join(root,source),destination);}
await mkdir(out,{recursive:true});
const appFiles=['style.css','main.mjs','sir-byte.mjs','behavior.mjs','speech-motion.mjs','voice-clips.mjs','sir-byte.glb',...Object.values(VOICE_CLIPS)];
const hash=createHash('sha256');
for(const file of ['index.html',...appFiles])hash.update(await readFile(path.join(root,file)));
const version=hash.digest('hex').slice(0,12);
for(const file of appFiles){
 if(file.endsWith('.mjs')){
  const source=await readFile(path.join(root,file),'utf8');
  await writeFile(path.join(out,file),source.replace(/(['"])(\.\/[^'"]+\.mjs)\1/g,(_,quote,url)=>`${quote}${url}?v=${version}${quote}`));
 }else await copy(file);
}
for(const file of ['build/three.module.js','build/three.core.js','examples/jsm/controls/OrbitControls.js','examples/jsm/environments/RoomEnvironment.js','examples/jsm/exporters/GLTFExporter.js','examples/jsm/geometries/RoundedBoxGeometry.js','LICENSE'])await copy('node_modules/three/'+file,'vendor/three/'+file);
const html=await readFile(path.join(root,'index.html'),'utf8');
await writeFile(path.join(out,'index.html'),html.replaceAll('./node_modules/three/','./vendor/three/').replace('src="main.mjs"',`src="main.mjs?v=${version}"`).replace('href="style.css"',`href="style.css?v=${version}"`));
await writeFile(path.join(out,'.nojekyll'),'');
console.log('Built static GitHub Pages site in dist/');
