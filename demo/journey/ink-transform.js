/* 人物层毛笔过场。复用宿主时钟，不读写存档，不持有额外 RAF。 */
window.WusanInkTransform=class {
  constructor(P,stage,options={}){this.P=P;this.stage=stage;this.options=options;this.active=false;this.elapsed=0;this.switched=false;}
  smooth(a,b,t){const x=Math.max(0,Math.min(1,(t-a)/(b-a)));return x*x*(3-2*x);}
  start(){
    if(this.active)return false;
    this.dispose();this.active=true;this.elapsed=0;this.switched=false;
    const P=this.P,from=this.options.from,to=this.options.to,c=this.options.brush;
    // 共用一套原山水。只临时借用目标人物，避免第二套背景盖住原人物。
    this.actorParent=to.actor.parent;this.actorIndex=this.actorParent.getChildIndex(to.actor);
    from.show();to.hide();from.root.addChildAt(to.actor,from.root.getChildIndex(from.actor)+1);
    const bounds=[from.actor,to.actor].map(s=>{const b=s.getLocalBounds(),k=Math.abs(s.scale.x);return {left:s.x+(s.scale.x<0?-b.maxX:b.minX)*k,top:s.y+b.minY*k,right:s.x+(s.scale.x<0?-b.minX:b.maxX)*k,bottom:s.y+b.maxY*k};});
    this.box={left:Math.min(...bounds.map(b=>b.left))-12,top:Math.min(...bounds.map(b=>b.top))-12,right:Math.max(...bounds.map(b=>b.right))+18,bottom:Math.max(...bounds.map(b=>b.bottom))+12};
    this.box.width=this.box.right-this.box.left;this.box.height=this.box.bottom-this.box.top;
    this.root=new P.Container();this.root.eventMode='none';from.root.addChild(this.root);
    this.masks=[0,1].map(()=>{
      const canvas=document.createElement('canvas');canvas.width=384;canvas.height=320;
      const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(canvas.width,canvas.height);
      const texture=P.Texture.from(canvas),sprite=new P.Sprite(texture);
      sprite.position.set(this.box.left,this.box.top);sprite.width=this.box.width;sprite.height=this.box.height;this.root.addChild(sprite);
      return {canvas,ctx,pixels,texture,sprite};
    });
    this.prepareMaskData();
    from.actor.mask=this.masks[0].sprite;to.actor.mask=this.masks[1].sprite;
    this.trace=new P.Graphics();this.root.addChild(this.trace);
    this.brush=new P.Sprite(this.options.brushTexture);this.brush.anchor.set(c.tip.x,c.tip.y);this.brush.scale.set(c.scale);this.root.addChild(this.brush);
    if(this.options.host){this.caption=document.createElement('p');this.caption.className='ink-transform-caption';this.caption.textContent=this.options.text||'';this.options.host.appendChild(this.caption);}
    this.draw();return true;
  }
  prepareMaskData(){
    const W=this.masks[0].canvas.width,H=this.masks[0].canvas.height,b=this.box;
    // Float64 preserves the original arithmetic; never cache a time-dependent distance.
    const worldY=new Float64Array(H),jitter=new Float64Array(W),fiber=new Float64Array(W*H);
    for(let x=0;x<W;x++){
      const worldX=b.left+x/W*b.width;
      jitter[x]=Math.abs(3.6*Math.sin(worldX*.11)+2.2*Math.sin(worldX*.29+1)+1.3*Math.sin(worldX*.83));
    }
    for(let y=0;y<H;y++){
      worldY[y]=b.top+y/H*b.height;
      for(let x=0;x<W;x++)fiber[y*W+x]=Math.pow(Math.max(0,Math.sin(y*1.71+x*.23)),14);
    }
    for(const m of this.masks)m.pixels.data.fill(255);
    this.maskStatic={worldY,jitter,fiber};
  }
  draw(){
    if(!this.root)return;
    const t=this.elapsed/(this.options.duration||1.5),c=this.options.brush,b=this.box,s=this.smooth.bind(this);
    const sweep=s(c.enterEnd,c.sweepEnd,t),bottom=b.bottom+c.feather+8,top=b.top-c.feather*2-8;
    this.boundary=bottom+(top-bottom)*sweep;
    this.tipY=t<c.enterEnd?bottom+c.enterDistance*(1-s(0,c.enterEnd,t)):t>c.sweepEnd?top-c.exitDistance*s(c.sweepEnd,c.exitEnd,t):this.boundary;
    this.tipX=b.left+b.width*.5+7*Math.sin(sweep*Math.PI);
    // 羽化与飞白仅在笔尖后方出现：未扫过的像素始终完全不可见。
    const [a,z]=this.masks,W=a.canvas.width,H=a.canvas.height;
    const {worldY,jitter,fiber}=this.maskStatic;
    let total=0;
    for(let y=0;y<H;y++){
      for(let x=0;x<W;x++){
        const d=worldY[y]-this.boundary-jitter[x];
        let v=s(0,c.feather,d);
        if(d>0&&d<c.feather*1.8)v*=1-.18*fiber[y*W+x]*(1-s(c.feather,c.feather*1.8,d));
        const i=(y*W+x)*4,alpha=Math.round(v*255);total+=v;
        a.pixels.data[i+3]=255-alpha;z.pixels.data[i+3]=alpha;
      }
    }
    this.revealed=total/(W*H);
    for(const m of this.masks){m.ctx.putImageData(m.pixels,0,0);m.texture.source.update();}
    this.brush.position.set(this.tipX,this.tipY);
    this.brush.rotation=-.055+.11*sweep;
    this.brush.alpha=s(0,.04,t)*(1-s(c.exitEnd-.06,c.exitEnd,t));
    // 克制的干笔痕只落在人物覆盖范围内，不生成大面积雾幕。
    this.trace.clear();
    if(t>c.enterEnd&&t<c.sweepEnd){
      for(let i=0;i<22;i++){
        const x=b.left+b.width*(i+.5)/22,y=this.boundary+4+3*Math.sin(x*.19);
        if(y>b.top&&y<b.bottom)this.trace.moveTo(x,y+5).lineTo(x+2,y).stroke({width:1.6,color:0x71877b,alpha:.12*Math.sin(Math.PI*sweep)});
      }
    }
    if(this.caption)this.caption.style.opacity=String(s(c.sweepEnd,c.exitEnd,t)*(1-s(.93,1,t)));
    if(t>=c.sweepEnd&&!this.switched){this.switched=true;this.options.onSwitch?.();}
  }
  finish(skipped){this.active=false;this.dispose();this.options.from.hide();this.options.to.show();this.options.onComplete?.({skipped});}
  update(dt){if(!this.active)return;this.elapsed=Math.min(this.options.duration||1.5,this.elapsed+Math.max(0,dt));this.draw();if(this.elapsed>=(this.options.duration||1.5))this.finish(false);}
  skip(){if(!this.active)return;this.switched=true;this.finish(true);}
  cancel(){if(!this.active&&!this.root)return;this.active=false;this.dispose();this.options.from.show();this.options.to.hide();this.options.onCancel?.();}
  dispose(){
    if(this.actorParent){this.options.from.actor.mask=null;this.options.to.actor.mask=null;this.actorParent.addChildAt(this.options.to.actor,Math.min(this.actorIndex,this.actorParent.children.length));this.actorParent=null;}
    this.caption?.remove();this.caption=null;this.root?.destroy({children:true});this.root=null;
    for(const m of this.masks||[])m.texture.destroy(true);this.masks=null;this.maskStatic=null;this.brush=null;this.trace=null;
  }
  destroy(){this.cancel();this.dispose();}
};
