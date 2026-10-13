export const DEFAULT_BINDINGS = Object.freeze({p1Count:'KeyZ',p1Submit:'KeyX',p2Count:'KeyN',p2Submit:'KeyM'});
export const ALTERNATE_BINDINGS = Object.freeze({p1Count:'KeyA',p1Submit:'KeyS',p2Count:'KeyK',p2Submit:'KeyL'});
export const clone = (value) => JSON.parse(JSON.stringify(value));
export const correctAnswer = (level) => level.boxes.length;
export const formatSeconds = (ms) => (Math.round(ms / 10) / 100).toFixed(2);
export const keyName = (code) => code.startsWith('Key') ? code.slice(3) : code.startsWith('Digit') ? code.slice(5) : code.replace('Numpad','Num ').replace('Arrow','');
export function validBinding(code) { return /^(Key[A-Z]|Digit[0-9]|Numpad[0-9]|NumpadAdd|NumpadSubtract|Space|ArrowUp|ArrowDown|ArrowLeft|ArrowRight)$/.test(code); }
export function validBindings(bindings) { const values = Object.keys(DEFAULT_BINDINGS).map(k=>bindings?.[k]); return values.every(validBinding) && new Set(values).size === 4; }

export function validateLevel(level, {allowEmpty=false}={}) {
  const errors=[];
  if (!level || typeof level!=='object' || level.boardSize!==5 || !Array.isArray(level.boxes)) return ['Use a five by five board and a box array.'];
  if (typeof level.id!=='string' || !level.id.length || level.id.length>80) errors.push('Level ID must contain 1–80 characters.');
  if (typeof level.name!=='string' || !level.name.trim() || level.name.length>80) errors.push('Level name must contain 1–80 characters.');
  if (level.boxes.length>99 || (!allowEmpty && !level.boxes.length)) errors.push('Use 1–99 separate boxes.');
  if (level.boxes.length>99) return errors;
  const ids=new Set(), voxels=new Map(), valid=[];
  for(const b of level.boxes){
    if(!b || typeof b.id!=='string' || !b.id || b.id.length>80 || ids.has(b.id)){errors.push('Every box needs a unique ID.');continue;}
    ids.add(b.id);
    if(['x','y','z','w','d','h'].some(k=>!Number.isInteger(b[k]))){errors.push(`${b.id}: coordinates and sizes must be whole numbers.`);continue;}
    if(b.x<0||b.y<0||b.z<0||b.w<1||b.d<1||b.h<1||b.x+b.w>5||b.y+b.d>5||b.z+b.h>4){errors.push(`${b.id}: box extends outside the board or above four units.`);continue;}
    valid.push(b);
    for(let x=b.x;x<b.x+b.w;x++)for(let y=b.y;y<b.y+b.d;y++)for(let z=b.z;z<b.z+b.h;z++){
      const key=`${x},${y},${z}`;
      if(voxels.has(key))errors.push(`${b.id}: overlaps ${voxels.get(key)}.`);else voxels.set(key,b.id);
    }
  }
  for(const b of valid)if(b.z>0){
    let supported=true;
    for(let x=b.x;x<b.x+b.w;x++)for(let y=b.y;y<b.y+b.d;y++)if(!voxels.has(`${x},${y},${b.z-1}`))supported=false;
    if(!supported)errors.push(`${b.id}: every part of its base must be supported.`);
  }
  const order=level.revealOrder;
  if(!Array.isArray(order)||order.length!==ids.size||new Set(order).size!==ids.size||order.some(id=>!ids.has(id)))errors.push('Reveal order must list every box once.');
  const p=level.presentation;
  if(!p || !['static','travel'].includes(p.kind) || !Number.isInteger(p.durationMs)||p.durationMs<(p.kind==='travel'?300:100)||p.durationMs>10000)errors.push('Choose a valid viewing duration from 100–10000 ms (travel starts at 300 ms).');
  else if(p.kind==='travel')for(const k of ['from','to'])if(!p[k]||!Number.isFinite(p[k].x)||!Number.isFinite(p[k].y)||Math.abs(p[k].x)>1600||Math.abs(p[k].y)>1000)errors.push('Travel coordinates are outside the supported range.');
  return [...new Set(errors)];
}

export function validatePack(pack){
  if(!pack||pack.schemaVersion!==1||!Array.isArray(pack.levels))return ['Use a version 1 level pack.'];
  const errors=[];
  if(typeof pack.title!=='string'||!pack.title.trim()||pack.title.length>80)errors.push('Pack title must contain 1–80 characters.');
  if(typeof pack.id!=='string'||!pack.id||pack.id.length>80)errors.push('Pack ID must contain 1–80 characters.');
  if(pack.levels.length<1||pack.levels.length>50)return [...errors,'A pack needs 1–50 levels.'];
  const ids=new Set();
  pack.levels.forEach((level,index)=>{if(ids.has(level?.id))errors.push(`Level ${index+1}: duplicate ID.`);ids.add(level?.id);validateLevel(level).forEach(error=>errors.push(`Level ${index+1}: ${error}`));});
  return errors;
}
export function normalizePack(input){
  const errors=validatePack(input);
  if(errors.length)throw new Error(errors.slice(0,6).join('\n'));
  return {schemaVersion:1,id:input.id,title:input.title,provenance:String(input.provenance??'Imported custom pack').slice(0,500),rulesProfile:'classic-observed-v1',levels:input.levels.map(l=>({
    id:l.id,name:l.name,boardSize:5,provenance:String(l.provenance??'Custom level').slice(0,500),
    boxes:l.boxes.map(b=>Object.fromEntries(['id','x','y','z','w','d','h'].map(k=>[k,b[k]]))),
    presentation:l.presentation.kind==='static'?{kind:'static',durationMs:l.presentation.durationMs}:{kind:'travel',durationMs:l.presentation.durationMs,from:{x:l.presentation.from.x,y:l.presentation.from.y},to:{x:l.presentation.to.x,y:l.presentation.to.y}},revealOrder:[...l.revealOrder],
  }))};
}
export function makePack(levels,title='My box puzzles',id='custom-pack'){return {schemaVersion:1,id,title,provenance:'Created in the Box Counting level editor',rulesProfile:'classic-observed-v1',levels:clone(levels)};}
export function rotateLevel(level,turns=1){let boxes=level.boxes.map(b=>({...b}));for(let t=0;t<((turns%4)+4)%4;t++)boxes=boxes.map(b=>({...b,x:5-b.y-b.d,y:b.x,w:b.d,d:b.w}));return {...level,boxes};}
export function mirrorLevel(level){return {...level,boxes:level.boxes.map(b=>({...b,x:b.y,y:b.x,w:b.d,d:b.w}))};}
export function levelSignature(level){return JSON.stringify(level.boxes.map(b=>[b.x,b.y,b.z,b.w,b.d,b.h]).sort((a,b)=>a.join(',').localeCompare(b.join(','))));}
export function scoreMatch(rounds,penaltyMs=5000){
  const players=[0,1].map(index=>{
    const rawMs=rounds.reduce((sum,r)=>sum+(r.players[index]?.elapsedMs??0),0);
    const mistakes=rounds.filter(r=>r.players[index]?.guess!==r.answer).length;
    const adjustedMs=rawMs+mistakes*penaltyMs;
    return {rawMs,mistakes,penaltyMs:mistakes*penaltyMs,adjustedMs,displayMs:Math.round(adjustedMs/10)*10,correct:rounds.length-mistakes};
  });
  return {players,winner:players[0].displayMs===players[1].displayMs?null:players[0].displayMs<players[1].displayMs?0:1};
}
export function soloSummary(rounds){const correct=rounds.filter(r=>r.players[0].guess===r.answer).length;return {correct,total:rounds.length,rawMs:rounds.reduce((n,r)=>n+r.players[0].elapsedMs,0),accuracy:rounds.length?Math.round(100*correct/rounds.length):0};}
export function duelSummary(rounds,duel,penaltyMs=5000){
  const result=scoreMatch(rounds,penaltyMs),points=[0,0];
  for(const r of rounds){const correct=r.players.map(p=>p.guess===r.answer);if(correct[0]!==correct[1])points[correct[0]?0:1]++;else if(correct[0]){const times=r.players.map(p=>Math.round(p.elapsedMs/10));if(times[0]!==times[1])points[times[0]<times[1]?0:1]++;}}
  const rule=duel.rule==='points'?'points':'time',values=rule==='points'?points:result.players.map(p=>p.displayMs),lead=Math.abs(values[0]-values[1]),target=rule==='points'?duel.pointsLead:duel.timeLeadMs;
  const leader=values[0]===values[1]?null:rule==='points'?(values[0]>values[1]?0:1):result.winner;
  const reached=rounds.length>=duel.minRounds&&lead>=target,cap=duel.maxRounds>0&&rounds.length>=duel.maxRounds;
  return {...result,winner:leader,points,rule,lead,target,finished:reached||cap,reason:reached?'lead':cap?'round-cap':null};
}
