import {clone,DEFAULT_BINDINGS,validBindings,normalizePack,makePack,validateLevel,soloSummary,scoreMatch,duelSummary} from './core.js';
const KEY='box-counting-game-v1';
function readHistory(h){
  if(!h||typeof h.id!=='string'||h.id.length>80||!Array.isArray(h.rounds)||!h.rounds.length||h.rounds.length>50)return null;
  const rounds=[];
  for(const r of h.rounds){
    if(!r||!Number.isInteger(r.answer)||validateLevel(r.level,{geometryOnly:true}).length||r.answer!==r.level.boxes.length||!Array.isArray(r.players)||r.players.length!==2)return null;
    if(!r.players.every(p=>p&&Number.isFinite(p.elapsedMs)&&p.elapsedMs>=0&&(p.guess===null||Number.isInteger(p.guess)&&p.guess>=0&&p.guess<=99)))return null;
    rounds.push({round:Number.isInteger(r.round)&&r.round>0?r.round:rounds.length+1,levelId:r.level.id,level:normalizePack(makePack([r.level]),{allowOcclusion:true}).levels[0],answer:r.answer,players:r.players.map(p=>({guess:p.guess,elapsedMs:p.elapsedMs,timeout:p.timeout===true}))});
  }
  const solo=h.solo===true,totalRounds=Number.isSafeInteger(h.totalRounds)&&h.totalRounds>=rounds.length?h.totalRounds:rounds.length;
  let summary=solo?soloSummary(rounds):scoreMatch(rounds);
  let duel=null;
  const d=h.duel;
  if(!solo&&d&&['time','points'].includes(d.rule)&&Number.isFinite(d.timeLeadMs)&&d.timeLeadMs>=1000&&d.timeLeadMs<=120000&&Number.isInteger(d.pointsLead)&&d.pointsLead>=1&&d.pointsLead<=20&&Number.isInteger(d.minRounds)&&d.minRounds>=1&&d.minRounds<=50&&Number.isInteger(d.maxRounds)&&d.maxRounds>=0&&d.maxRounds<=500&&(d.maxRounds===0||d.maxRounds>=d.minRounds)){
    duel={rule:d.rule,timeLeadMs:d.timeLeadMs,pointsLead:d.pointsLead,minRounds:d.minRounds,maxRounds:d.maxRounds};summary=duelSummary(rounds,duel);
    if(totalRounds>rounds.length){
      const saved=h.summary;
      if(!saved||!Array.isArray(saved.players)||saved.players.length!==2||!saved.players.every(p=>p&&Number.isFinite(p.rawMs)&&p.rawMs>=0&&Number.isInteger(p.mistakes)&&p.mistakes>=0&&p.mistakes<=totalRounds)||!Array.isArray(saved.points)||saved.points.length!==2||!saved.points.every(p=>Number.isInteger(p)&&p>=0&&p<=totalRounds)||saved.points[0]+saved.points[1]>totalRounds)return null;
      const players=saved.players.map(p=>{const adjustedMs=p.rawMs+p.mistakes*5000;return {rawMs:p.rawMs,mistakes:p.mistakes,penaltyMs:p.mistakes*5000,adjustedMs,displayMs:Math.round(adjustedMs/10)*10,correct:totalRounds-p.mistakes};});
      const values=duel.rule==='points'?saved.points:players.map(p=>p.displayMs),lead=Math.abs(values[0]-values[1]),target=duel.rule==='points'?duel.pointsLead:duel.timeLeadMs,winner=values[0]===values[1]?null:duel.rule==='points'?(values[0]>values[1]?0:1):(values[0]<values[1]?0:1),reached=totalRounds>=duel.minRounds&&lead>=target,cap=duel.maxRounds>0&&totalRounds>=duel.maxRounds;
      summary={players,points:[...saved.points],rule:duel.rule,lead,target,winner,finished:reached||cap,reason:reached?'lead':cap?'round-cap':null};
    }
  }
  if(solo&&totalRounds>rounds.length&&h.summary&&h.summary.total===totalRounds&&Number.isSafeInteger(h.summary.correct)&&h.summary.correct>=0&&h.summary.correct<=totalRounds&&Number.isFinite(h.summary.rawMs)&&h.summary.rawMs>=0)summary={total:totalRounds,correct:h.summary.correct,rawMs:h.summary.rawMs,accuracy:Math.round(100*h.summary.correct/totalRounds)};
  return {id:h.id,label:String(h.label??'Saved session').slice(0,80),date:Number.isFinite(Date.parse(h.date))?new Date(h.date).toISOString():new Date(0).toISOString(),mode:String(h.mode??'practice').slice(0,20),seed:String(h.seed??'').slice(0,80),solo,assisted:h.assisted===true,totalRounds,voided:Number.isSafeInteger(h.voided)&&h.voided>=0?h.voided:0,duel,summary,rounds};
}
export function defaultStore(){return {version:1,settings:{bindings:{...DEFAULT_BINDINGS},inputMode:'auto',sound:true,volume:0.25,highContrast:false,reducedMotion:false},levels:[],packs:[],history:[],draft:null};}
export function loadStore(storage=globalThis.localStorage){
  const defaults=defaultStore();
  try{
    const raw=storage.getItem(KEY);if(!raw)return {data:defaults,error:null,newUser:true};
    if(raw.length>4_000_000)throw new Error('Saved data is too large.');
    const parsed=JSON.parse(raw);if(parsed.version!==1)throw new Error('Saved data version is unsupported.');
    const s=parsed.settings??{};
    defaults.settings={bindings:validBindings(s.bindings)?s.bindings:{...DEFAULT_BINDINGS},inputMode:['auto','touch','keyboard'].includes(s.inputMode)?s.inputMode:'auto',sound:typeof s.sound==='boolean'?s.sound:true,volume:Number.isFinite(s.volume)?Math.max(0,Math.min(1,s.volume)):0.25,highContrast:s.highContrast===true,reducedMotion:s.reducedMotion===true};
    defaults.levels=Array.isArray(parsed.levels)?parsed.levels.filter(l=>!validateLevel(l,{geometryOnly:true}).length).slice(0,100).map(l=>normalizePack(makePack([l]),{allowOcclusion:true}).levels[0]):[];
    defaults.packs=Array.isArray(parsed.packs)?parsed.packs.slice(0,50).flatMap(p=>{try{return [normalizePack(p,{allowOcclusion:true})];}catch{return [];}}):[];
    defaults.history=Array.isArray(parsed.history)?parsed.history.slice(0,100).map(readHistory).filter(Boolean):[];
    defaults.draft=parsed.draft&&!validateLevel(parsed.draft,{allowEmpty:true,geometryOnly:true}).length?clone(parsed.draft):null;
    return {data:defaults,error:null};
  }catch(error){return {data:defaults,error:`Could not read saved data: ${error.message}`};}
}
export function saveStore(data,storage=globalThis.localStorage){
  const text=JSON.stringify(data);if(text.length>4_000_000)throw new Error('Your saved library is full. Export packs and remove unused copies.');
  storage.setItem(KEY,text);
}
export function addHistory(data,record){
  const copy=clone(data);copy.history=[record,...copy.history.filter(h=>h.id!==record.id)].slice(0,100);
  while(JSON.stringify(copy.history).length>1_000_000&&copy.history.length>1)copy.history.pop();
  return copy;
}
