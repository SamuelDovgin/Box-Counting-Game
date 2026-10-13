import {levelSignature,mirrorLevel,validateLevel} from './core.js';
export const GENERATOR_VERSION=2;
export const FAMILY_NAMES={cluster:'Grouped boxes',scattered:'Scattered boxes',towers:'Separate towers',large:'Large and small',travel:'Travelling boxes',flash:'Quick glance',dense:'Full board',rows:'Separated rows',gapped:'Gaps and branches',stairs:'Staircase towers',hollow:'Hollow frame',checker:'Checkerboard', 'travel-towers':'Travelling towers','travel-large':'Travelling large boxes','travel-rows':'Travelling rows','travel-gaps':'Travelling gaps'};
export const FAMILIES=Object.keys(FAMILY_NAMES);
const BASE=FAMILIES.slice(0,7),ADVANCED=FAMILIES.slice(7),MOTION=['travel','travel-towers','travel-large','travel-rows','travel-gaps'];
export function seededRandom(seed){let h=2166136261;for(const c of String(seed)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return ()=>{h=(h+0x6D2B79F5)|0;let t=h;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
const PROFILES={gentle:{min:3,max:8,preview:2200,height:2},standard:{min:3,max:12,preview:950,height:3},intense:{min:4,max:18,preview:650,height:4}};
export function difficultyAt(start,ordinal){const names=['gentle','standard','intense'];return names[Math.min(2,Math.max(0,names.indexOf(start))+Math.floor(ordinal/5))];}
export function generateLevel(seed,ordinal=0,difficulty='standard',family='mixed'){
  const rng=seededRandom(`${GENERATOR_VERSION}|${seed}|${ordinal}|${difficulty}|${family}`),pick=n=>Math.floor(rng()*n),profile=PROFILES[difficulty]??PROFILES.standard;
  if(family==='mixed'){const pool=ordinal<5?BASE:[...BASE,...ADVANCED];family=pool[pick(pool.length)];}
  if(!FAMILIES.includes(family))family='cluster';
  const moving=family==='travel'||family.startsWith('travel-'),shape=family==='travel'?'scattered':family.replace('travel-','');
  const boxes=[];let serial=0;const add=(x,y,z=0,w=1,d=1,h=1)=>boxes.push({id:`b${++serial}`,x,y,z,w,d,h});
  const target=profile.min+pick(profile.max-profile.min+1),cells=[];
  if(shape==='towers'||shape==='stairs'){
    [[0,4],[2,2],[4,0]].forEach(([x,y],i)=>{const height=shape==='stairs'?Math.min(i+1+(difficulty==='intense'&&i===2?1:0),profile.height):1+pick(profile.height);for(let z=0;z<height;z++)add(x,y,z);});
  }else if(shape==='large'){
    add(1,0,0,2+pick(2),1+pick(2));const candidates=[[0,3],[1,3],[3,3],[4,3],[0,0],[4,4]],count=2+pick(3);for(let i=0;i<count;i++)add(...candidates[i]);
  }else if(shape==='rows'){
    const length=3+pick(2),start=pick(2);for(const y of [pick(2),3+pick(2)])for(let x=start;x<start+length;x++)add(x,y);
  }else if(shape==='gapped'){
    const shift=pick(2);[[1,0],[1,1],[1,2],[1,4],[2,3]].forEach(([x,y])=>add(x+shift,y));
  }else if(shape==='hollow'){
    const size=difficulty==='gentle'?3:4+pick(2),offset=Math.floor((5-size)/2);for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(x===0||y===0||x===size-1||y===size-1)add(x+offset,y+offset);
  }else if(shape==='checker'){
    const parity=pick(2);for(let y=0;y<5;y++)for(let x=0;x<5;x++)if((x+y)%2===parity)add(x,y);
  }else if(shape==='dense'){
    for(let y=0;y<5;y++)for(let x=0;x<5;x++)cells.push([x,y]);for(let i=cells.length-1;i>0;i--){const j=pick(i+1);[cells[i],cells[j]]=[cells[j],cells[i]];}
    cells.slice(0,difficulty==='intense'?20+pick(5):target).forEach(([x,y])=>add(x,y));
  }else{
    const used=new Set();let cell=[1+pick(3),1+pick(3)];
    for(let i=0;i<target;i++){
      if(shape==='cluster'||shape==='flash'){
        if(i){const base=cells[pick(cells.length)],dirs=[[1,0],[-1,0],[0,1],[0,-1]],options=dirs.map(([dx,dy])=>[base[0]+dx,base[1]+dy]).filter(([x,y])=>x>=0&&y>=0&&x<5&&y<5&&!used.has(`${x},${y}`));cell=options.length?options[pick(options.length)]:[pick(5),pick(5)];}
      }else cell=[pick(5),pick(5)];
      let tries=0;while(used.has(cell.join(','))&&tries++<100)cell=[pick(5),pick(5)];if(used.has(cell.join(',')))continue;used.add(cell.join(','));cells.push(cell);add(...cell);
    }
  }
  let presentation={kind:'static',durationMs:profile.preview};
  if(moving){const sx=pick(2)?1:-1,sy=pick(2)?1:-1;presentation={kind:'travel',durationMs:difficulty==='gentle'?2800:difficulty==='intense'?1500:2100,from:{x:1000*sx,y:450*sy},to:{x:-1000*sx,y:-450*sy}};}
  if(shape==='flash')presentation.durationMs=difficulty==='gentle'?900:difficulty==='intense'?150:400;
  let level={id:`generated-${ordinal}-${Math.floor(rng()*0xffffff).toString(36)}`,name:FAMILY_NAMES[family],boardSize:5,provenance:`Generator v${GENERATOR_VERSION}; seed ${String(seed).slice(0,80)}; round ${ordinal+1}; ${family}`,boxes,presentation,revealOrder:boxes.map(b=>b.id)};
  if(rng()>.5)level=mirrorLevel(level);if(validateLevel(level).length)throw new Error('Generated level failed validation.');return level;
}
export function generateLevels(seed,count=10,difficulty='standard',family='mixed'){
  const levels=[],seen=new Set();for(let i=0;i<count;i++){let next;for(let a=0;a<100;a++){next=generateLevel(`${seed}|${a}`,i,difficulty,family);if(!seen.has(levelSignature(next)))break;}next.id=`generated-${i}-${next.id.split('-').at(-1)}`;seen.add(levelSignature(next));levels.push(next);}return levels;
}
export function generateChallenge(seed,count,kind,startDifficulty='gentle'){
  const levels=[],seen=new Set(),rng=seededRandom(`${seed}|${kind}|campaign-v2`);
  for(let i=0;i<count;i++){
    const difficulty=difficultyAt(startDifficulty,i),pool=kind==='motion'?MOTION:i<5?['cluster','rows','scattered']:i<10?['gapped','large','towers']:['stairs','hollow','checker','dense','flash'],family=pool[Math.floor(rng()*pool.length)];
    let l;for(let a=0;a<100;a++){l=generateLevel(`${seed}|${kind}|${a}`,i,difficulty,family);if(!seen.has(levelSignature(l)))break;}
    seen.add(levelSignature(l));levels.push(l);
  }return levels;
}
export function familyForLevel(level){
  const named=FAMILIES.find(f=>level.provenance?.endsWith(`; ${f}`));if(named)return named;
  const ref=['scattered','cluster','towers','travel-gaps','large','travel-towers','rows','flash','travel','dense'];if(/^ref-\d+$/.test(level.id))return ref[Number(level.id.slice(4))-1]??'cluster';
  if(level.presentation.kind==='travel')return level.boxes.some(b=>b.z>0)?'travel-towers':level.boxes.some(b=>b.w>1||b.d>1||b.h>1)?'travel-large':'travel';
  if(level.boxes.some(b=>b.w>1||b.d>1||b.h>1))return 'large';if(level.boxes.some(b=>b.z>0))return 'towers';return level.boxes.length>16?'dense':'cluster';
}
