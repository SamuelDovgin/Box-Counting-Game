import {clone,validateLevel,levelSignature} from './core.js';
import {generateLevel,seededRandom,FAMILIES,FAMILY_NAMES} from './generator.js';
import {motionExposure} from './geometry.js';
import {rateLevel,climbTier,validateClimb} from './difficulty.js';
export const RATED_GENERATOR_VERSION=2;
export function generateRatedLevel(seed,ordinal=0,tier=5,family='mixed',presentation='auto'){
  if(!Number.isInteger(tier)||tier<1||tier>10||!['mixed',...FAMILIES].includes(family)||!['auto','static','travel'].includes(presentation))throw new Error('Choose a difficulty tier 1–10, a supported style, and a presentation.');
  const rng=seededRandom(`rated-v${RATED_GENERATOR_VERSION}|${seed}|${ordinal}|${tier}|${family}|${presentation}`),target=tier*10-5;
  const familyOffset=Math.floor(rng()*FAMILIES.length);
  let best=null,bestDistance=Infinity;
  for(let attempt=0;attempt<18;attempt++){
    const chosen=family==='mixed'?FAMILIES[(familyOffset+attempt)%FAMILIES.length]:family;
    const level=generateLevel(`${seed}|rated|${attempt}`,ordinal,tier<4?'gentle':tier<7?'standard':'intense',chosen);
    if(tier>=7&&['large','travel-large'].includes(chosen)){
      // A visible front row of tall columns gives high difficulty without hidden interiors.
      const row=3+Math.floor(rng()*2),merged=Math.floor(rng()*5),mirrored=rng()>.5;level.boxes=[];
      for(let column=0;column<5;column++)for(let z=0;z<4;z++){
        if(column===merged&&z===1)continue;
        level.boxes.push({id:`column-${column}-${z}`,x:mirrored?row:column,y:mirrored?column:row,z,w:1,d:1,h:column===merged&&z===0?2:1});
      }
      level.revealOrder=level.boxes.map(b=>b.id);
    }
    const desired=Math.max(2,Math.min(32,Math.round(2+(tier-1)*3.3+(rng()-.5)*6)));
    // Remove uppermost boxes first, so supported boxes never become floating.
    while(level.boxes.length>desired){level.boxes.sort((a,b)=>(a.z+a.h)-(b.z+b.h));level.boxes.pop();}
    // Extend the chosen formation with legal cells and supported tower segments.
    const cells=Array.from({length:25},(_,i)=>[i%5,Math.floor(i/5)]);
    for(let i=cells.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[cells[i],cells[j]]=[cells[j],cells[i]];}
    const height=tier<5?1:tier<7?2:4;
    const locations=[];if(tier>=5&&attempt%2===0)for(const [x,y] of cells)for(let z=0;z<height;z++)locations.push([x,y,z]);else for(let z=0;z<height;z++)for(const [x,y] of cells)locations.push([x,y,z]);
    for(const [x,y,z] of locations){
      if(level.boxes.length>=desired)break;
      const b={id:`extra-${z}-${x}-${y}`,x,y,z,w:1,d:1,h:1},candidate={...level,boxes:[...level.boxes,b],revealOrder:[...level.boxes.map(b=>b.id),b.id]};
      const check={...candidate,presentation:{kind:'static',durationMs:2500}};if(!validateLevel(check).length)level.boxes.push(b);
    }
    level.revealOrder=level.boxes.map(b=>b.id);
    const moving=presentation==='travel'||presentation==='auto'&&(chosen.startsWith('travel')||tier>=8);
    level.presentation=moving?{kind:'travel',durationMs:2000,from:{x:1000,y:0},to:{x:-1000,y:0}}:{kind:'static',durationMs:2500};
    // Fit exposure to the target while keeping the actual measured score honest.
    let low=moving?Math.max(300,motionExposure(level).minimumDurationMs):100,high=10000;
    for(let i=0;i<16;i++){
      const ms=i===0?low:i===1?high:Math.round((low+high)/2);level.presentation.durationMs=ms;
      const score=rateLevel(level).score,distance=Math.abs(score-target);
      if(distance<bestDistance){best=clone(level);bestDistance=distance;}
      if(distance===0)break;
      if(i>1){if(score>target)low=ms+1;else high=ms-1;}
      if(i>1&&low>high)break;
    }
    if(bestDistance===0)break;
  }
  best.id=`rated-${ordinal}-${Math.floor(rng()*0xffffff).toString(36)}`;
  best.name=`${FAMILY_NAMES[family==='mixed'?best.provenance.split('; ').at(-1):family]}`;
  best.provenance=`Rated generator v${RATED_GENERATOR_VERSION}; seed ${String(seed).slice(0,80)}; round ${ordinal+1}; target tier ${tier}; ${best.provenance.split('; ').at(-1)}`;
  if(validateLevel(best).length)throw new Error('Generated level failed validation.');
  return best;
}
export function generateRatedLevels(seed,count=10,tier=5,family='mixed',presentation='auto',climb=null){
  if(!Number.isInteger(count)||count<1||count>50)throw new Error('Generate 1–50 levels at a time.');
  if(climb)validateClimb(climb);
  const levels=[],seen=new Set();
  for(let i=0;i<count;i++){
    let level;for(let retry=0;retry<12;retry++){level=generateRatedLevel(`${seed}|${retry}`,i,climb?climbTier(climb,i):tier,family,presentation);if(!seen.has(levelSignature(level)))break;}
    seen.add(levelSignature(level));levels.push(level);
  }
  return levels;
}
