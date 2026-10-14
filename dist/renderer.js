import {project,boxFaces,paintOrder,boardLayout} from './geometry.js';
export {project,boardLayout} from './geometry.js';
import {correctAnswer,keyName} from './core.js';
export const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const label=(x,y,t,size=42,anchor='middle',color='#111',weight=400)=>`<text x="${x}" y="${y}" font-family="Arial,Helvetica,sans-serif" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" fill="${color}">${esc(t)}</text>`;
function poly(points,fill,stroke='#222',width=2,attrs=''){return `<polygon ${attrs} points="${points.map(([x,y])=>`${x.toFixed(2)},${y.toFixed(2)}`).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`;}
function grid(options){
  let out='';
  if(options.editor)for(let y=0;y<5;y++)for(let x=0;x<5;x++)out+=poly([project(x,y),project(x+1,y),project(x+1,y+1),project(x,y+1)],'#ffffff01','none',0,`data-cell="${x},${y}" class="editor-cell"`);
  for(let i=0;i<=5;i++)for(const[a,b]of[[project(i,0),project(i,5)],[project(0,i),project(5,i)]])out+=`<path d="M ${a.join(' ')} L ${b.join(' ')}" fill="none" stroke="${options.highContrast?'#444':'#858585'}" stroke-width="${options.highContrast?1.8:1.15}" stroke-dasharray="1 3" stroke-linecap="round" pointer-events="none"/>`;
  return out;
}
function cube(b,green,options){
  const faces=boxFaces(b);
  const colors=green?['#25f34b','#0bcb38','#009a24']:options.highContrast?['#fff','#bbb','#666']:['#fff','#d9d9d9','#999'];
  const selected=options.selected===b.id,stroke=selected?'#2078b8':'#222',width=selected?4:2;
  return `<g data-box-id="${esc(b.id)}">`+
    poly(faces[0],colors[1],stroke,width)+
    poly(faces[1],colors[2],stroke,width)+
    poly(faces[2],colors[0],stroke,width)+`</g>`;
}
export function boardSvg(level,{boxes=true,greenCount=0,motion=null,...options}={}){
  const layout=boardLayout(level),offset=motion??{x:0,y:0};
  const green=new Set(level.revealOrder.slice(0,greenCount));
  const sorted=boxes?paintOrder(level.boxes).items.map(item=>item.box):[];
  return `<g data-board transform="translate(${layout.x+offset.x},${layout.y+offset.y}) scale(${layout.scale})">${grid(options)}${boxes?sorted.map(b=>cube(b,green.has(b.id),options)).join(''):''}</g>`;
}
function hud(engine,player,bindings,phase){
  const submitted=engine.submissions[player],guess=submitted?.guess??engine.guesses[player],badgeX=player?1212:16,tileX=player?1002:86;
  let html=`<g data-player="${player}"><rect x="${badgeX}" y="596" width="52" height="80" rx="10" fill="${player?'#f17869':'#28cadd'}" stroke="#333" stroke-width="2"/>${label(badgeX+26,645,`P${player+1}`,24,'middle','#111',700)}`;
  if((phase==='answer'&&!submitted)||['watch','puzzleCountdown'].includes(phase)){
    html+=[...String(guess).padStart(2,'0')].map((n,i)=>`<rect x="${tileX+i*99}" y="552" width="94" height="132" fill="#929292"/>${label(tileX+i*99+47,663,n,110,'middle','#fff')}`).join('');
    const anchor=player?'end':'start',x=player?980:300;
    html+=label(x,604,`${keyName(bindings[player?'p2Count':'p1Count'])}  +1`,24,anchor)+label(x,652,`${keyName(bindings[player?'p2Submit':'p1Submit'])}  Done`,24,anchor);
  }else html+=label(player?1128:144,668,submitted?.timeout?'—':String(guess),105,'middle','#111',500);
  if(phase==='resultHold'){
    const c=player?1128:145,correct=submitted?.guess===correctAnswer(engine.current);
    html+=correct?`<path d="M ${c-46} 641 L ${c-9} 679 L ${c+70} 599" fill="none" stroke="#65d34d" stroke-width="20"/>`:`<path d="M ${c-43} 609 L ${c+42} 687 M ${c+42} 609 L ${c-43} 687" fill="none" stroke="#ec5a56" stroke-width="20"/>`;
  }
  return html+'</g>';
}
export function gameSvg(engine,now,bindings,options={}){
  let svg='<rect width="1280" height="720" fill="#f7f7f7"/>';const phase=engine.phase;
  if(phase==='matchCountdown')return svg+label(640,95,'Count as quickly as you can.')+`<circle cx="640" cy="380" r="128" fill="none" stroke="#111" stroke-width="11"/>`+label(640,425,String(Math.max(1,Math.ceil((engine.deadline-now)/1000))),150,'middle','#111',600);
  if(phase==='matchEnd')return `<rect width="1280" height="720" fill="#232625"/>${label(640,380,'End',100,'middle','#fff')}`;
  if(!engine.current)return svg;
  const l=engine.current,answerPhase=['answer','preReveal','revealCounting','resultHold'].includes(phase);
  svg+=label(640,95,answerPhase?'How many boxes were there?':'Try to count the boxes.');
  if(!options.touch)svg+=label(1230,38,`ROUND ${engine.roundIndex+1}${engine.config.endless?'':` / ${engine.levels.length}`}`,17,'end','#737979',700);
  if(phase==='puzzleCountdown')svg+=label(640,185,String(Math.max(1,Math.ceil((engine.deadline-now)/(engine.roundIndex===0?1000:2000/3)))),100);
  let greenCount=phase==='resultHold'?correctAnswer(l):phase==='revealCounting'?Math.min(correctAnswer(l),Math.floor((now-engine.phaseStartedAt)/engine.rules.revealStepMs)+1):0;
  if(phase!=='answer'||l.presentation.kind==='static'){
    const travelling=phase==='watch'&&l.presentation.kind==='travel';
    const board=boardSvg(l,{...options,boxes:['watch','revealCounting','resultHold'].includes(phase),greenCount});
    svg+=travelling?`<g data-motion-layer style="transform:translate3d(${l.presentation.from.x}px,${l.presentation.from.y}px,0)">${board}</g>`:board;
  }
  if(['revealCounting','resultHold'].includes(phase))svg+=label(640,185,String(greenCount),100,'middle','#111',600);
  if(!options.touch&&answerPhase)svg+=`<g>${hud(engine,0,bindings,phase)}${engine.config.solo?'':hud(engine,1,bindings,phase)}</g>`;
  if(!options.touch&&phase==='answer'&&engine.config.answerLimitMs)svg+=label(640,680,`${Math.max(0,Math.ceil((engine.deadline-now)/1000))} seconds left`,20,'middle','#616969');
  return svg;
}
export function editorSvg(level,selected,options={}){return `<rect width="1280" height="720" fill="#f7f7f7"/>${label(640,100,'Build your box arrangement',34)}${boardSvg(level,{...options,editor:true,selected})}`;}
