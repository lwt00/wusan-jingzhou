import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const base=new URL('../../',import.meta.url);
export function travelFixture({old=false,plan=()=>({delay:100}),configure}={}){
 let now=0,seq=0,created=0;const timers=new Map(),requests=[],attempts=new Map();
 const point=owner=>({x:1,y:1,set(x,y=x){this.x=x;this.y=y;if(owner){owner.x=x;owner.y=y;}}});
 class Container{
  constructor(){this.children=[];this.x=0;this.y=0;this.alpha=1;this.visible=true;this.width=0;this.height=0;this.scale=point();this.position=point(this);this.anchor=point();this.destroyed=false;}
  addChild(child){this.children.push(child);child.parent=this;return child;}
  removeChildren(){const old=this.children;this.children=[];return old;}
  destroy(){this.destroyed=true;this.children=[];}
  getLocalBounds(){return {minY:-256,y:-256,width:128,height:256};}
 }
 class Sprite extends Container{constructor(texture){super();this.texture=texture;this.width=texture.width;this.height=texture.height;}}
 class Graphics extends Container{rect(){return this}poly(){return this}ellipse(){return this}fill(){return this}circle(){return this}moveTo(){return this}lineTo(){return this}stroke(){return this}clear(){return this}}
 class Texture{constructor(o){Object.assign(this,o);}destroy(){this.destroyed=true;}static from(image){created++;return {src:image.path,width:image.width,height:image.height,source:{},destroy(){}};}}
 const P={Container,Sprite,Graphics,Texture,Rectangle:class{constructor(x,y,width,height){Object.assign(this,{x,y,width,height});}}};
 const schedule=(fn,ms)=>{const id=++seq;timers.set(id,{at:now+ms,fn});return id;};
 class Image{
  set src(url){this.path=new URL(url).pathname.split('/demo/journey/')[1];const attempt=(attempts.get(this.path)||0)+1;attempts.set(this.path,attempt);this.plan=plan(this.path,attempt);requests.push({path:this.path,at:now,attempt,bytes:readFileSync(new URL(this.path,base)).length});
   const b=readFileSync(new URL(this.path,base));if(b.toString('ascii',1,4)==='PNG'){this.width=b.readUInt32BE(16);this.height=b.readUInt32BE(20);}else{this.width=1600;this.height=900;}}
  decode(){return new Promise((resolve,reject)=>schedule(()=>this.plan.fail?reject(Error('simulated decode failure')):resolve(),this.plan.delay));}
 }
 const c={window:{matchMedia:()=>({matches:false})},URL,URLSearchParams,location:{search:''},document:{baseURI:'http://local/demo/journey/journey-demo.html'},Image,setTimeout:schedule,clearTimeout:id=>timers.delete(id)};
 vm.createContext(c);for(const name of ['travel-scenery-config.js','travel-config.js'])vm.runInContext(readFileSync(new URL(name,base),'utf8'),c);
 configure?.(c.window.WusanTravelConfig);
 const source=readFileSync(old?new URL('./travel-scene-before-round2.js',import.meta.url):new URL('travel-scene.js',base),'utf8');vm.runInContext(source,c);
 const app={stage:new Container(),screen:{width:390,height:844}},scene=new c.window.WusanTravelScene(P,app,c.window.WusanTravelConfig);
 const flush=async()=>{for(let i=0;i<40;i++)await Promise.resolve();};
 async function advance(ms){await flush();const end=now+ms;for(;;){const next=[...timers].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at||a[0]-b[0])[0];if(!next)break;now=next[1].at;timers.delete(next[0]);next[1].fn();await flush();}now=end;await flush();}
 async function finish(p){let settled=false,value,error;p.then(v=>{settled=true;value=v;},e=>{settled=true;error=e;});await flush();for(let i=0;!settled&&i<2000;i++){const next=Math.min(...[...timers.values()].map(t=>t.at));if(!Number.isFinite(next))throw Error('unsettled without timers');await advance(next-now);}if(!settled)throw Error('timer limit');if(error)throw error;return value;}
 return {scene,app,config:c.window.WusanTravelConfig,requests,timers,advance,finish,flush,now:()=>now,created:()=>created,newScene(){return new c.window.WusanTravelScene(P,app,c.window.WusanTravelConfig);}};
}
export function visibleState(scene){
 return structuredClone({direction:scene.direction,frames:scene.actorFrames?.map(t=>t.src)||null,actor:{x:scene.actor.x,y:scene.actor.y,scale:[scene.actor.scale.x,scene.actor.scale.y],texture:scene.actorSprite?.texture.src||null},groups:scene.groups.filter(g=>g.group.alpha!==0).map(g=>({name:g.name,alpha:g.group.alpha,pieces:g.pieces.map(({image})=>({src:image.texture?.src,x:image.x,y:image.y,width:image.width,height:image.height,alpha:image.alpha}))})),scenery:scene.scenery.map(({item,image})=>({id:item.id,src:image.texture.src,x:image.x,y:image.y,width:image.width,height:image.height,alpha:image.alpha,rotation:image.rotation,visible:image.visible}))});
}
