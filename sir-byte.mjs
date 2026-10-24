import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {ByteBehavior} from './behavior.mjs';
import {sampleSpeech} from './speech-motion.mjs';

const eyeVertex=`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const eyeFragment=`
varying vec2 vUv;
uniform vec2 gaze;
uniform vec4 lids;
uniform float blink;
uniform float surprise;
float eye(vec2 p, vec2 center, float upper, float lower, float angle){
 vec2 q=p-center-gaze*vec2(.075,.045);
 q=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*q;
 float open=max(.025,1.-blink);
 q.y/=open;
 vec2 radius=vec2(.102,.175)*(1.+surprise*.16);
 float d=(length(q/radius)-1.)*.10;
 float top=.175-upper*.235;
 float bottom=-.175+lower*(.235-2.*q.x*q.x);
 d=max(d,q.y-top);
 d=max(d,bottom-q.y);
 float core=1.-smoothstep(-.003,.004,d);
 float halo=exp(-max(d,0.)*100.)*.22;
 return core+halo;
}
void main(){
 vec2 p=vUv-.5;
 float a=eye(p,vec2(-.205,0.),lids.x,lids.z,-lids.x*.22);
 float b=eye(p,vec2(.205,0.),lids.y,lids.w,lids.y*.22);
 float v=max(a,b);
 gl_FragColor=vec4(vec3(.27,.97,1.)*(.9+v*.15),clamp(v,0.,1.));
}`;

export function createSirByte(){
 const root=new THREE.Group();root.name='SirByte';
 const floatRig=new THREE.Group();floatRig.name='FloatRig';root.add(floatRig);
 const bodyRig=new THREE.Group();bodyRig.name='BodyRig';floatRig.add(bodyRig);
 const head=new THREE.Group();head.name='HeadRig';head.position.y=1.92;floatRig.add(head);
 const shell=new THREE.MeshPhysicalMaterial({color:0x52848d,metalness:.12,roughness:.37,clearcoat:.5,clearcoatRoughness:.3});
 const dark=new THREE.MeshStandardMaterial({color:0x102b36,metalness:.3,roughness:.35});
 const rim=new THREE.MeshStandardMaterial({color:0x2c5965,metalness:.55,roughness:.25});
 const hatMat=new THREE.MeshStandardMaterial({color:0x172936,roughness:.67,metalness:.08});
 const red=new THREE.MeshStandardMaterial({color:0x4b1028,roughness:.67,metalness:.02});
 const glow=new THREE.MeshStandardMaterial({color:0x68dadd,emissive:0x38bfc9,emissiveIntensity:.7,roughness:.26});
 function mesh(name,g,m,parent,x=0,y=0,z=0){g.normalizeNormals();const o=new THREE.Mesh(g,m);o.name=name;o.position.set(x,y,z);parent.add(o);return o;}
 function ball(name,m,parent,pos,scale,segments=32){const o=mesh(name,new THREE.SphereGeometry(1,segments,20),m,parent,...pos);o.scale.set(...scale);return o;}
 mesh('HeadShell',new RoundedBoxGeometry(2.13,1.57,1.29,5,.45),shell,head);
 function panel(w,h,r,depth){
  const x=-w/2,y=-h/2,s=new THREE.Shape();
  s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);
  s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);
  s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
  return new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelThickness:.025,bevelSize:.025,bevelSegments:3,steps:1,curveSegments:10});
 }
 mesh('VisorGasket',panel(1.82,1.17,.29,.04),rim,head,0,-.025,.63);
 const visor=mesh('ObsidianDisplay',panel(1.73,1.08,.26,.035),new THREE.MeshPhysicalMaterial({color:0x06191f,metalness:.1,roughness:.24,clearcoat:1,clearcoatRoughness:.2}),head,0,-.025,.69);
 const uniforms={gaze:{value:new THREE.Vector2()},lids:{value:new THREE.Vector4()},blink:{value:0},surprise:{value:0}};
 const eyeMaterial=new THREE.ShaderMaterial({vertexShader:eyeVertex,fragmentShader:eyeFragment,uniforms,transparent:true,depthWrite:false,toneMapped:false});
 const eyes=mesh('LiveDisplayEyes',new THREE.PlaneGeometry(1.63,1.05),eyeMaterial,head,0,-.025,.754);
 // Egg profile narrows toward the underside, matching the supplied floating-body reference.
 const profile=[new THREE.Vector2(0,-.67),new THREE.Vector2(.18,-.64),new THREE.Vector2(.38,-.52),new THREE.Vector2(.55,-.30),new THREE.Vector2(.66,.02),new THREE.Vector2(.69,.29),new THREE.Vector2(.65,.46),new THREE.Vector2(.49,.56),new THREE.Vector2(0,.57)];
 const curve=new THREE.SplineCurve(profile);const bodyGeo=new THREE.LatheGeometry(curve.getPoints(32),40);
 const body=mesh('EggBody',bodyGeo,shell,bodyRig,0,.59,0);body.scale.z=.76;
 const neck=mesh('NeckJoint',new THREE.CylinderGeometry(.25,.3,.18,24),dark,floatRig,0,1.22,0);
 const arms=[];
 for(const s of [-1,1]){
  const pivot=new THREE.Group();pivot.name=s<0?'FlipperLeftRig':'FlipperRightRig';pivot.position.set(s*.68,.95,0);bodyRig.add(pivot);
  ball('ShoulderJoint',rim,pivot,[0,0,0],[.13,.15,.14],20);
  const flipper=ball(s<0?'FlipperLeft':'FlipperRight',shell,pivot,[s*.11,-.34,.03],[.16,.48,.18]);flipper.rotation.z=s*.19;
  arms.push(pivot);
 }
 const bow=new THREE.Group();bow.name='BowTie';bow.position.set(0,1.04,.43);bodyRig.add(bow);
 for(const s of [-1,1]){const lobe=ball('BowWing',red,bow,[s*.17,0,.02],[.19,.125,.075],24);lobe.rotation.z=s*.23;}
 mesh('BowKnot',new RoundedBoxGeometry(.14,.16,.13,3,.045),red,bow,0,0,.055);
 const badge=mesh('ChestBadgeRim',new THREE.CylinderGeometry(.105,.105,.035,24),rim,bodyRig,0,.58,.51);badge.rotation.x=Math.PI/2;
 const light=mesh('ChestLight',new THREE.CircleGeometry(.073,24),glow,bodyRig,0,.58,.532);
 // Short mounting seat: its lower 0.025 is intentionally socketed into the shell.
 // The broad brim itself remains outside the head instead of cutting through it.
 const hatSeat=mesh('HatSeat',new THREE.CylinderGeometry(.50,.50,.10,40),hatMat,head,.03,.81,-.03);hatSeat.scale.z=.66;
 // Seated against the rounded shell with ~0.003 clearance at the lowest contact.
 const hat=new THREE.Group();hat.name='BowlerHat';hat.position.set(.03,.830,-.03);hat.rotation.z=-.045;head.add(hat);
 const brim=ball('HatBrim',hatMat,hat,[0,.04,0],[.94,.07,.68],40);
 // Closed lathed crown, dome silhouette rather than a top hat.
 const crownCurve=new THREE.SplineCurve([new THREE.Vector2(0,0),new THREE.Vector2(.64,0),new THREE.Vector2(.66,.13),new THREE.Vector2(.62,.40),new THREE.Vector2(.48,.61),new THREE.Vector2(.23,.72),new THREE.Vector2(0,.74)]);
 const crown=mesh('HatCrown',new THREE.LatheGeometry(crownCurve.getPoints(28),40),hatMat,hat,0,.07,0);crown.scale.z=.82;
 const band=mesh('HatRibbon',new THREE.CylinderGeometry(.658,.66,.12,40,1,true),red,hat,0,.22,0);band.scale.z=.82;
 const behavior=new ByteBehavior();
 let time=0,nextBlink=2.7,blinkStart=-10,smoothedTilt=0,smoothedLift=0;
 const smoothLids=new THREE.Vector4();const targetLids=new THREE.Vector4();
 const smoothGaze=new THREE.Vector2();
 const speechPose={weight:0,pitch:0,roll:0,yaw:0,lift:0,leftArm:0,rightArm:0,upperLeft:0,upperRight:0,smile:0,eyeScale:1};
 function update(dt,{reducedMotion=false,speaking=false,speechTime=0,speechDuration=14.16,speechLevel=0}={}){
  dt=Math.min(Math.max(dt,0),.08);time+=dt;const e=behavior.update(dt);const k=1-Math.exp(-dt*9);
  const speech=sampleSpeech(speechTime,speechDuration,speechLevel);if(!speaking)speech.weight=0;
  for(const key of Object.keys(speechPose))speechPose[key]=THREE.MathUtils.lerp(speechPose[key],speech[key],k);
  const sw=speechPose.weight;
  if(time>nextBlink&&(!speaking||speechLevel<.12)){blinkStart=time;nextBlink=time+3.5+Math.random()*2.8;}
  const bt=time-blinkStart;uniforms.blink.value=bt<.19?Math.sin(Math.PI*bt/.19)**2:0;
  targetLids.fromArray(e.eyes);targetLids.lerp(new THREE.Vector4(speechPose.upperLeft,speechPose.upperRight,speechPose.smile,speechPose.smile),sw);smoothLids.lerp(targetLids,k);uniforms.lids.value.copy(smoothLids);
  eyes.scale.setScalar(THREE.MathUtils.lerp(1,speechPose.eyeScale,sw));
  let gx=behavior.gaze.x,gy=behavior.gaze.y;
  if(behavior.state==='think'){gx=-.65;gy=.65;}
  gx*=1-sw;gy*=1-sw;
  smoothGaze.lerp(new THREE.Vector2(gx,gy),k);uniforms.gaze.value.copy(smoothGaze);
  uniforms.surprise.value=THREE.MathUtils.lerp(uniforms.surprise.value,behavior.state==='surprise'?1:0,k);
  smoothedTilt=THREE.MathUtils.lerp(smoothedTilt,e.tilt,k);smoothedLift=THREE.MathUtils.lerp(smoothedLift,e.lift,k);
  const motion=reducedMotion?0:1;
  const t=behavior.elapsed;
  const joy=behavior.state==='celebrate'?Math.sin(Math.min(t,2.6)*9)*Math.exp(-t*.6)*(1-sw):0;
  floatRig.position.y=.17+motion*(Math.sin(time*1.55)*.025+smoothedLift*(1-sw)+joy*.045+speechPose.lift*sw);
  bodyRig.rotation.z=motion*(Math.sin(time*.65)*.018+joy*.07);
  head.rotation.set((-smoothGaze.y*.075+speechPose.pitch*sw)*motion,(smoothGaze.x*.12+speechPose.yaw*sw)*motion,(smoothedTilt*(1-sw)+speechPose.roll*sw)*motion);
  arms.forEach((arm,i)=>{
   const s=i===0?-1:1;let angle=s*.09;
   if(behavior.state==='celebrate')angle=s*(1.5+joy*.18);
   if(behavior.state==='cheeky'&&i===1)angle=1.12;
   if(behavior.state==='think'&&i===0)angle=-1.85;
   if(behavior.state==='support')angle=s*.6;
   if(behavior.state==='surprise')angle=s*.9;
   angle=THREE.MathUtils.lerp(angle,i===0?speechPose.leftArm:speechPose.rightArm,sw);
   arm.rotation.z=THREE.MathUtils.lerp(arm.rotation.z,angle*motion,k);
   arm.rotation.x=THREE.MathUtils.lerp(arm.rotation.x,behavior.state==='think'&&i===0?-.5*motion:0,k);
  });
 }
 function makeExportModel(){
  const copy=root.clone(true);copy.position.set(0,0,0);copy.scale.setScalar(1);copy.rotation.set(0,0,0);
  copy.getObjectByName('FloatRig').position.y=.17;
  for(const name of ['HeadRig','BodyRig','FlipperLeftRig','FlipperRightRig'])copy.getObjectByName(name).rotation.set(0,0,0);
  const live=copy.getObjectByName('LiveDisplayEyes');live.removeFromParent();
  // Shader materials are not glTF portable. Static emissive eyes travel in the GLB;
  // the included JS factory is the authoritative live model and controller.
  const exportHead=copy.getObjectByName('HeadRig');
  for(const s of [-1,1]){ball(s<0?'EyeLeftStatic':'EyeRightStatic',glow,exportHead,[s*.334,-.025,.775],[.167,.184,.014],32);}
  return copy;
 }
 let triangles=0;root.traverse(o=>{if(o.isMesh)triangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;});
 return {root,head,behavior,update,makeExportModel,triangles:Math.round(triangles)};
}
