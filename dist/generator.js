import {levelSignature,mirrorLevel,validateLevel} from './core.js';
export const GENERATOR_VERSION=1;
export const FAMILIES=['cluster','scattered','towers','large','travel','flash','dense'];
export function seededRandom(seed){let h=2166136261;for(const c of String(seed)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return ()=>{h=(h+0x6D2B79F5)|0;let t=h;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
const PROFILES={gentle:{min:3,max:8,preview:2200,height:2},standard:{min:3,max:12,preview:950,height:3},intense:{min:4,max:18,preview:650,height:4}};
export function generateLevel(seed,ordinal=0,difficulty='standard',family='mixed'){
  const rng=seededRandom(`${GENERATOR_VERSION}|${seed}|${ordinal}|${difficulty}|${family}`), pick=n=>Math.floor(rng()*n), profile=PROFILES[difficulty]??PROFILES.standard;
  if(family==='mixed')family=FAMILIES[pick(FAMILIES.length)];
  if(!FAMILIES.includes(family))family='cluster';
  const boxes=[];let serial=0;
  const add=(x,y,z=0,w=1,d=1,h=1)=>boxes.push({id:`b${++serial}`,x,y,z,w,d,h});
  const target=profile.min+pick(profile.max-profile.min+1);
  const cells=[];
  if(family==='towers'){
    const positions=[[0,4],[4,0],[2,2]];
    positions.forEach(([x,y],i)=>{const height=i===2?1+pick(Math.min(2,profile.height)):1+pick(profile.height);for(let z=0;z<height;z++)add(x,y,z);});
  }else if(family==='large'){
    const w=2+pick(2),d=1+pick(2);add(1,0,0,w,d);
    const candidates=[[0,3],[1,3],[3,3],[4,3],[0,0],[4,4]];
    const smallCount=2+pick(3);
    for(let i=0;i<smallCount;i++)add(...candidates[i]);
  }else if(family==='dense'){
    for(let y=0;y<5;y++)for(let x=0;x<5;x++)cells.push([x,y]);
    for(let i=cells.length-1;i>0;i--){const j=pick(i+1);[cells[i],cells[j]]=[cells[j],cells[i]];}
    const count=difficulty==='intense'?20+pick(5):target;
    cells.slice(0,count).forEach(([x,y])=>add(x,y));
  }else{
    const used=new Set();let cell=[1+pick(3),1+pick(3)];
    for(let i=0;i<target;i++){
      if(family==='cluster'||family==='flash'){
        if(i){const base=cells[pick(cells.length)],dirs=[[1,0],[-1,0],[0,1],[0,-1]];let options=dirs.map(([dx,dy])=>[base[0]+dx,base[1]+dy]).filter(([x,y])=>x>=0&&y>=0&&x<5&&y<5&&!used.has(`${x},${y}`));if(options.length)cell=options[pick(options.length)];else cell=[pick(5),pick(5)];}
      }else cell=[pick(5),pick(5)];
      let tries=0;while(used.has(cell.join(','))&&tries++<100)cell=[pick(5),pick(5)];
      if(used.has(cell.join(',')))continue;used.add(cell.join(','));cells.push(cell);add(...cell);
    }
  }
  let presentation={kind:'static',durationMs:profile.preview};
  if(family==='travel')presentation={kind:'travel',durationMs:difficulty==='gentle'?2600:difficulty==='intense'?1300:1900,from:{x:1000,y:-450},to:{x:-1000,y:450}};
  if(family==='flash')presentation.durationMs=difficulty==='gentle'?900:difficulty==='intense'?150:400;
  const names={cluster:'Grouped boxes',scattered:'Scattered boxes',towers:'Separate towers',large:'Large and small',travel:'Travelling boxes',flash:'Quick glance',dense:'Full board'};
  let level={id:`generated-${ordinal}-${Math.floor(rng()*0xffffff).toString(36)}`,name:names[family],boardSize:5,provenance:`Generator v${GENERATOR_VERSION}; seed ${String(seed).slice(0,80)}; round ${ordinal+1}; ${family}`,boxes,presentation,revealOrder:boxes.map(b=>b.id)};
  if(rng()>.5)level=mirrorLevel(level);
  if(validateLevel(level).length)throw new Error('Generated level failed validation.');
  return level;
}
export function generateLevels(seed,count=10,difficulty='standard',family='mixed'){
  const levels=[],seen=new Set();
  for(let i=0;i<count;i++){
    let next;
    for(let attempt=0;attempt<100;attempt++){next=generateLevel(`${seed}|${attempt}`,i,difficulty,family);if(!seen.has(levelSignature(next)))break;}
    next.id=`generated-${i}-${next.id.split('-').at(-1)}`;seen.add(levelSignature(next));levels.push(next);
  }
  return levels;
}
export function familyForLevel(level){
  const ref=['scattered','cluster','towers','travel','large','towers','cluster','flash','travel','dense'];
  if(/^ref-\d+$/.test(level.id))return ref[Number(level.id.slice(4))-1]??'cluster';
  if(level.presentation.kind==='travel')return 'travel';
  if(level.boxes.some(b=>b.w>1||b.d>1||b.h>1))return 'large';
  if(level.boxes.some(b=>b.z>0))return 'towers';
  return level.boxes.length>16?'dense':'cluster';
}
