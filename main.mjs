import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {createSirByte} from './sir-byte.mjs';
import {EXPRESSIONS} from './behavior.mjs';

const viewport=document.querySelector('#viewport');
function showError(message){document.querySelector('#loading').hidden=true;const el=document.querySelector('#error');el.hidden=false;el.textContent=message;}
try{await boot();}catch(error){console.error(error);showError('Die 3D-Vorschau konnte nicht starten. Bitte WebGL aktivieren und die Seite über den lokalen Server öffnen. '+error.message);}
async function boot(){
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'default',preserveDrawingBuffer:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;viewport.appendChild(renderer.domElement);
 renderer.domElement.setAttribute('aria-label','Animierter Sir Byte: zum Drehen ziehen, zum Zoomen scrollen');
 const scene=new THREE.Scene();
 const camera=new THREE.PerspectiveCamera(34,1,.1,50);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=4.5;controls.maxDistance=11;controls.minPolarAngle=.95;controls.maxPolarAngle=1.85;
 const pmrem=new THREE.PMREMGenerator(renderer);const env=new RoomEnvironment();const envRT=pmrem.fromScene(env,.04);scene.environment=envRT.texture;scene.environmentIntensity=.75;env.dispose();pmrem.dispose();
 scene.add(new THREE.HemisphereLight(0xe9faff,0x537282,2));
 function light(color,intensity,x,y,z){const l=new THREE.DirectionalLight(color,intensity);l.position.set(x,y,z);scene.add(l);}
 light(0xffffff,3,-3,6,5);light(0xb6e9ff,2.8,4,3,-3);light(0xffe3d1,.8,3,2,4);
 const byte=createSirByte();scene.add(byte.root);
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=128;const ctx=shadowCanvas.getContext('2d');const gradient=ctx.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'rgba(35,69,83,.25)');gradient.addColorStop(.4,'rgba(35,69,83,.13)');gradient.addColorStop(1,'rgba(35,69,83,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
 const shadow=new THREE.Mesh(new THREE.PlaneGeometry(3.2,1.7),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.set(0,-.16,0);scene.add(shadow);
 let compact=false,compactScale=1,gazeMode='player',last=performance.now(),lastState='',running=true;
 const reduceQuery=matchMedia('(prefers-reduced-motion: reduce)');const motion=document.querySelector('#motion');motion.checked=reduceQuery.matches;reduceQuery.addEventListener('change',e=>motion.checked=e.matches);
 function resetCamera(){camera.position.set(3.15,2.6,8.6);controls.target.set(0,1.6,0);controls.update();}
 resetCamera();
 function resize(){const {width,height}=viewport.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/height;camera.zoom=Math.min(window.innerWidth<=720?.78:1,width/height/.82);camera.updateProjectionMatrix();}
 new ResizeObserver(resize).observe(viewport);resize();
 function speak(text){if(!document.querySelector('#voice').checked||!('speechSynthesis' in window))return;try{speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang='en-GB';utterance.rate=.96;const voice=speechSynthesis.getVoices().find(v=>v.lang==='en-GB');if(voice)utterance.voice=voice;speechSynthesis.speak(utterance);}catch(error){document.querySelector('#export-note').textContent='Sprachausgabe auf diesem Gerät nicht verfügbar.';}}
 if(!('speechSynthesis' in window)){document.querySelector('#voice').disabled=true;}
 const recording=document.querySelector('#recorded-voice');
 const replayButton=document.querySelector('#replay-voice');
 const recordingStatus=document.querySelector('#recording-status');
 let audioContext,analyser,audioSamples,audioInit,voiceEnergy=0;
 async function enableAudioAnalysis(){
  if(analyser||audioInit)return;
  const AudioContextClass=window.AudioContext||window.webkitAudioContext;if(!AudioContextClass)return;
  audioInit=true;
  try{
   audioContext=new AudioContextClass();await audioContext.resume();
   if(audioContext.state!=='running'){await audioContext.close();audioInit=false;return;}
   const source=audioContext.createMediaElementSource(recording);
   analyser=audioContext.createAnalyser();analyser.fftSize=512;
   source.connect(analyser);analyser.connect(audioContext.destination);
   audioSamples=new Float32Array(analyser.fftSize);
  }catch(error){audioInit=false;recordingStatus.textContent='Sprechbewegung aktiv; Audiomessung auf diesem Gerät nicht verfügbar.';}
 }
 function stopRecording(){if(!recording.paused){recording.pause();recordingStatus.textContent='Aufnahme angehalten. Erneut abspielen?';}}
 async function playRecording(){
  void enableAudioAnalysis();
  if('speechSynthesis' in window)speechSynthesis.cancel();
  recording.pause();recording.currentTime=0;
  byte.behavior.react('idle');
  try{await recording.play();replayButton.textContent='↻ Noch einmal abspielen';recordingStatus.textContent='Sir Byte spricht …';}
  catch(error){recordingStatus.textContent='Audio konnte nicht starten. Bitte erneut auf Abspielen tippen.';byte.behavior.react('idle');}
 }
 replayButton.addEventListener('click',playRecording);
 recording.addEventListener('ended',()=>{recordingStatus.textContent='Noch einmal? Mit Vergnügen.';if(byte.behavior.state==='celebrate')byte.behavior.react('idle');});
 recording.addEventListener('error',()=>{recordingStatus.textContent='Aufnahme konnte nicht geladen werden. Bitte Seite neu laden.';});
 function react(state){stopRecording();if(state==='celebrate'){void playRecording();return;}const e=byte.behavior.react(state);speak(e.line);}
 document.querySelectorAll('[data-state]').forEach(button=>button.addEventListener('click',()=>react(button.dataset.state)));
 document.querySelectorAll('[data-answer]').forEach(button=>button.addEventListener('click',()=>{stopRecording();const correct=button.dataset.answer==='true';const e=byte.behavior.feedback(correct);if(correct)void playRecording();else speak(e.line);document.querySelector('#quiz-feedback').textContent=correct?'Richtig: „went“ ist die Vergangenheitsform von „go“.':byte.behavior.mistakes===1?'Fast! „Yesterday“ verrät dir die Zeitform.':'Kein Stress: Die Vergangenheit von „go“ lautet „went“.';}));
 document.querySelectorAll('[data-look]').forEach(button=>button.addEventListener('click',()=>{gazeMode=button.dataset.look;document.querySelectorAll('[data-look]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button));});if(gazeMode==='player')byte.behavior.lookAt(0,0);else if(gazeMode==='task')lookAtElement(document.querySelector('.quiz'));}));
 const worldTarget=new THREE.Vector3();const projected=new THREE.Vector3();
 function gazeToPoint(x,y){const rect=viewport.getBoundingClientRect();byte.head.getWorldPosition(worldTarget);projected.copy(worldTarget).project(camera);const hx=rect.left+(projected.x*.5+.5)*rect.width;const hy=rect.top+(-projected.y*.5+.5)*rect.height;byte.behavior.lookAt((x-hx)/240,(hy-y)/240);}
 function lookAtElement(el){const rect=el.getBoundingClientRect();gazeToPoint(rect.left+rect.width/2,rect.top+rect.height/2);}
 window.addEventListener('pointermove',event=>{if(gazeMode==='pointer')gazeToPoint(event.clientX,event.clientY);},{passive:true});
 document.querySelector('#size').addEventListener('click',event=>{compact=!compact;event.currentTarget.textContent=compact?'↗ Große Ansicht':'↙ Kleine Ansicht';event.currentTarget.setAttribute('aria-pressed',String(compact));});
 document.querySelector('#reset-camera').addEventListener('click',resetCamera);
 async function exportGLB(){const object=byte.makeExportModel();try{return await new GLTFExporter().parseAsync(object,{binary:true,onlyVisible:true});}finally{object.clear();}}
 document.querySelector('#export').addEventListener('click',async()=>{const button=document.querySelector('#export');button.disabled=true;try{const buffer=await exportGLB();const url=URL.createObjectURL(new Blob([buffer],{type:'model/gltf-binary'}));const a=document.createElement('a');a.href=url;a.download='sir-byte.glb';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);document.querySelector('#export-note').textContent='GLB mit statischen Augen. Live-Animation: sir-byte.mjs + behavior.mjs.';}catch(e){document.querySelector('#export-note').textContent='Export fehlgeschlagen: '+e.message;}finally{button.disabled=false;}});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();running=false;showError('Die Grafikverbindung wurde unterbrochen. Bitte Seite neu laden.');});
 function frame(now){if(!running)return;const dt=Math.min((now-last)/1000,.08);last=now;if(!document.hidden){
  const speaking=!recording.paused&&!recording.ended;
  let energy=0;if(speaking&&analyser){analyser.getFloatTimeDomainData(audioSamples);for(const sample of audioSamples)energy+=sample*sample;energy=Math.min(1,Math.sqrt(energy/audioSamples.length)*6);}
  voiceEnergy=THREE.MathUtils.lerp(voiceEnergy,energy,1-Math.exp(-dt*(energy>voiceEnergy?18:7)));
  byte.update(dt,{reducedMotion:motion.checked,speaking,speechTime:recording.currentTime,speechDuration:recording.duration,speechLevel:voiceEnergy});
  compactScale=THREE.MathUtils.lerp(compactScale,compact?.42:1,1-Math.exp(-dt*7));byte.root.scale.setScalar(compactScale);byte.root.position.y=(1-compactScale)*.32;
  shadow.scale.setScalar(compactScale);controls.update();if(gazeMode==='task')lookAtElement(document.querySelector('.quiz'));
  const state=speaking?'speaking':byte.behavior.state;if(state!==lastState){lastState=state;const e=speaking?{line:'Sir Byte spricht …',label:'Am Erzählen.'}:EXPRESSIONS[state];document.querySelector('#speech').textContent=e.line;document.querySelector('#state-label').textContent=e.label;document.querySelectorAll('[data-state]').forEach(b=>{b.classList.toggle('active',b.dataset.state===state);b.setAttribute('aria-pressed',String(b.dataset.state===state));});}
  renderer.render(scene,camera);
 }requestAnimationFrame(frame);}
 document.addEventListener('visibilitychange',()=>{last=performance.now();});
 document.querySelector('#loading').hidden=true;
 // Small integration surface, also used for the browser acceptance checks.
 window.sirByte={...byte,renderer,scene,camera,controls,react,exportGLB,get compact(){return compact;}};
 requestAnimationFrame(frame);
}
