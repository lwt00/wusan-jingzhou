// Frozen pre-optimization draw oracle; independent of the production cache implementation.
export function referenceDraw(){
    if(!this.root)return;
    const t=this.elapsed/(this.options.duration||1.5),c=this.options.brush,b=this.box,s=this.smooth.bind(this);
    const sweep=s(c.enterEnd,c.sweepEnd,t),bottom=b.bottom+c.feather+8,top=b.top-c.feather*2-8;
    this.boundary=bottom+(top-bottom)*sweep;
    this.tipY=t<c.enterEnd?bottom+c.enterDistance*(1-s(0,c.enterEnd,t)):t>c.sweepEnd?top-c.exitDistance*s(c.sweepEnd,c.exitEnd,t):this.boundary;
    this.tipX=b.left+b.width*.5+7*Math.sin(sweep*Math.PI);
    // 羽化与飞白仅在笔尖后方出现：未扫过的像素始终完全不可见。
    const [a,z]=this.masks,W=a.canvas.width,H=a.canvas.height;
    let total=0;
    for(let y=0;y<H;y++){
      const worldY=b.top+y/H*b.height;
      for(let x=0;x<W;x++){
        const worldX=b.left+x/W*b.width;
        const jitter=3.6*Math.sin(worldX*.11)+2.2*Math.sin(worldX*.29+1)+1.3*Math.sin(worldX*.83);
        const d=worldY-this.boundary-Math.abs(jitter);
        let v=s(0,c.feather,d);
        if(d>0&&d<c.feather*1.8){const fiber=Math.pow(Math.max(0,Math.sin(y*1.71+x*.23)),14);v*=1-.18*fiber*(1-s(c.feather,c.feather*1.8,d));}
        const i=(y*W+x)*4,alpha=Math.round(v*255);total+=v;
        a.pixels.data[i]=a.pixels.data[i+1]=a.pixels.data[i+2]=255;
        z.pixels.data[i]=z.pixels.data[i+1]=z.pixels.data[i+2]=255;
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

// Preserve logical fog evolution and rendering for comparison on return.
export function updateFog(dt=0){
    maskClock+=dt;
    fogPuffs.forEach((f,i)=>{
      const arriving=i===stationIndex&&['focusing','awaiting-explore','exploring-demo','revealing'].includes(mode);
      const target=completed[i]?1:arriving?(mode==='exploring-demo'?.76:.62):0;
      if(mode==='revealing'&&i===stationIndex)f.wave=revealProgress;
      else if(reduced.matches)f.wave=0;
      else f.wave*=Math.exp(-dt*4);
      if(f.wave<.001)f.wave=0;
      if(reduced.matches)f.openness=target;
      else f.openness+=(target-f.openness)*(1-Math.exp(-dt*4));
      if(Math.abs(target-f.openness)<.001)f.openness=target;
      const color=completed[i]?1:mode==='revealing'&&i===stationIndex?Math.min(1,.55+.45*revealProgress):f.openness*.85;
      if(f.colorAmount!==color){colorFilters[i].saturate(-.85*(1-color),false);buildingSprites[i].filters=color===1?[]:[colorFilters[i]];f.colorAmount=color;}
    });
    paintFogMask(dt===0||reduced.matches);
    const allClear=completed.every(Boolean);fogLayer.visible=!allClear;
    fogPieces.forEach(f=>{f.g.x=f.base+(reduced.matches?0:Math.sin(ambient*f.speed+f.seed)*28);f.g.y=f.baseY+(reduced.matches?0:Math.sin(ambient*f.speed*.7+f.seed)*12);});
    clouds.forEach(({g,base},i)=>{g.alpha=allClear?0:.2;g.x=base+(reduced.matches?0:Math.sin(ambient*.09+i)*32);g.y=270+(i%3)*130;});
    glow.alpha=.8+(reduced.matches?0:Math.sin(ambient*.1)*.12);
  }
