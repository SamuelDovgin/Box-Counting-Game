import {gameSvg} from './renderer.js';
// Keep travelling geometry mounted; the browser animates only its parent transform.
export const travelOffset=(presentation,progress)=>{
  const t=Math.max(0,Math.min(1,progress));
  return {x:presentation.from.x+(presentation.to.x-presentation.from.x)*t,y:presentation.from.y+(presentation.to.y-presentation.from.y)*t};
};
const transform=p=>`translate(${p.x}px,${p.y}px)`;
export class GameScene {
  constructor(element,draw=gameSvg){this.element=element;this.html='';this.key='';this.animation=null;this.layer=null;this.drawSvg=draw;this.watch=null;}
  draw(engine,time,bindings,options={}){
    let html;
    if(engine.phase==='watch'){
      const prefs=JSON.stringify([bindings,options.highContrast,options.touch]);
      if(this.watch?.level!==engine.current||this.watch.started!==engine.phaseStartedAt||this.watch.prefs!==prefs)this.watch={level:engine.current,started:engine.phaseStartedAt,prefs,html:this.drawSvg(engine,time,bindings,options)};
      html=this.watch.html;
    }else html=this.drawSvg(engine,time,bindings,options);
    this.update(html,engine,time);
  }
  update(html,engine,time){
    if(html!==this.html){this.animation?.cancel();this.animation=null;this.key='';this.layer=null;this.element.innerHTML=html;this.html=html;}
    const moving=engine?.phase==='watch'&&engine.current?.presentation.kind==='travel';
    if(!moving){this.animation?.cancel();this.animation=null;this.key='';this.layer=null;return;}
    const p=engine.current.presentation,key=`${engine.current.id}|${engine.phaseStartedAt}`;
    if(key!==this.key){
      this.key=key;this.layer=this.element.querySelector('[data-motion-layer]');
      if(this.layer?.animate){
        try{this.animation=this.layer.animate([{transform:transform(p.from)},{transform:transform(p.to)}],{duration:p.durationMs,easing:'linear',fill:'both'});this.animation.currentTime=Math.max(0,Math.min(p.durationMs,time-engine.phaseStartedAt));}catch{this.animation=null;}
      }
    }
    if(this.animation){if(engine.paused&&this.animation.playState==='running')this.animation.pause();else if(!engine.paused&&this.animation.playState==='paused')this.animation.play();}
    else if(this.layer&&!engine.paused)this.layer.style.transform=transform(travelOffset(p,(time-engine.phaseStartedAt)/p.durationMs));
  }
}
