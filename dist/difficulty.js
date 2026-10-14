// A transparent design estimate, not a measured player-performance rating.
export const DIFFICULTY_VERSION=2;
export const TIER_NAMES=['Warm-up','Easy','Tricky','Moderate','Challenging','Hard','Expert','Extreme','Master','Maximum'];
const clamp=(v,min=0,max=1)=>Math.max(min,Math.min(max,v));
export function rateLevel(level){
  const boxes=level.boxes,p=level.presentation,n=boxes.length;
  const ground=new Set(),occupied=new Set();
  for(const b of boxes)for(let x=b.x;x<b.x+b.w;x++)for(let y=b.y;y<b.y+b.d;y++){
    ground.add(`${x},${y}`);for(let z=b.z;z<b.z+b.h;z++)occupied.add(`${x},${y},${z}`);
  }
  const remaining=new Set(ground);let groups=0;
  while(remaining.size){groups++;const queue=[remaining.values().next().value];remaining.delete(queue[0]);while(queue.length){const [x,y]=queue.pop().split(',').map(Number);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=`${x+dx},${y+dy}`;if(remaining.delete(k))queue.push(k);}}}
  const heights=boxes.map(b=>b.z+b.h),maxHeight=Math.max(0,...heights),raised=boxes.filter(b=>b.z>0).length;
  const large=boxes.filter(b=>b.w*b.d*b.h>1).length,sizes=new Set(boxes.map(b=>`${b.w},${b.d},${b.h}`)).size;
  const centers=boxes.map(b=>[b.x+b.w/2,b.y+b.d/2]),spread=n?Math.hypot(Math.max(...centers.map(c=>c[0]))-Math.min(...centers.map(c=>c[0])),Math.max(...centers.map(c=>c[1]))-Math.min(...centers.map(c=>c[1]))):0;
  const moving=p.kind==='travel',speed=moving?Math.hypot(p.to.x-p.from.x,p.to.y-p.from.y)/(p.durationMs/1000):0;
  const parts={
    count:30*clamp((n-1)/18),
    stacking:12*clamp((maxHeight-1)/6+(n?raised/n:0)*.5),
    shapes:8*clamp((large? .5:0)+Math.max(0,sizes-1)*.25),
    spread:n>1?10*clamp(spread/Math.sqrt(32)*.4+Math.min(4,Math.max(0,groups-1))/4*.3+ground.size/25*.3):0,
    exposure:25*clamp(Math.log(5000/Math.max(100,p.durationMs))/Math.log(5000/(moving?300:100))),
    motion:15*clamp(speed/2200),
  };
  const score=Math.round(clamp(Object.values(parts).reduce((a,b)=>a+b,0),0,100));
  const tier=Math.min(10,Math.floor(score/10)+1);
  return {version:DIFFICULTY_VERSION,score,tier,label:TIER_NAMES[tier-1],parts:Object.fromEntries(Object.entries(parts).map(([k,v])=>[k,Math.round(v*10)/10])),facts:{boxes:n,raised,large,groups,occupiedCells:occupied.size,durationMs:p.durationMs,speed:Math.round(speed)}};
}
export function validateClimb(c){
  if(!c||!['startTier','maxTier','step','every'].every(k=>Number.isInteger(c[k]))||c.startTier<1||c.maxTier>10||c.maxTier<c.startTier||c.step<1||c.step>9||c.every<1||c.every>20)throw new Error('Choose tiers 1–10, a maximum at least as high as the start, a rise of 1–9, and 1–20 rounds per rise.');
  return c;
}
export function climbTier(c,ordinal){validateClimb(c);return Math.min(c.maxTier,c.startTier+Math.floor(ordinal/c.every)*c.step);}
