import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {rateLevel,climbTier,validateClimb} from '../dist/difficulty.js';
import {generateRatedLevel,generateRatedLevels} from '../dist/rated-generator.js';
import {FAMILIES} from '../dist/generator.js';
import {validateLevel,makePack,normalizePack,clone,levelSignature} from '../dist/core.js';
import {GameEngine} from '../dist/engine.js';
import {defaultStore,loadStore} from '../dist/storage.js';
const rules=JSON.parse(readFileSync(new URL('../data/rules-profile.json',import.meta.url)));
const climb={startTier:1,maxTier:10,step:1,every:2};
const box=(id,x,y,z=0,w=1,d=1,h=1)=>({id,x,y,z,w,d,h});
const level=boxes=>({id:'score-test',name:'Score test',boardSize:5,boxes,presentation:{kind:'static',durationMs:2500},revealOrder:boxes.map(b=>b.id)});

test('difficulty score responds to box count, supported stacking, shape variety, timing and travel speed',()=>{
 const single=level([box('a',0,0)]),many=level([box('a',0,0),box('b',1,0),box('c',2,0),box('d',3,0)]);
 assert.ok(rateLevel(many).parts.count>rateLevel(single).parts.count);
 const broad=level([box('a',0,0,0,2,2)]);assert.equal(rateLevel(broad).parts.count,rateLevel(single).parts.count);assert.ok(rateLevel(broad).parts.shapes>0);
 const tower=level([box('a',0,0),box('b',0,0,1)]);assert.deepEqual(validateLevel(tower),[]);assert.ok(rateLevel(tower).parts.stacking>0);
 const flash=clone(many);flash.presentation.durationMs=150;assert.ok(rateLevel(flash).score>rateLevel(many).score);
 const slow=clone(many);slow.presentation={kind:'travel',durationMs:2500,from:{x:600,y:0},to:{x:-600,y:0}};const fast=clone(slow);fast.presentation.to.x=-1600;
 assert.ok(rateLevel(fast).parts.motion>rateLevel(slow).parts.motion);
 const quick=clone(slow);quick.presentation.durationMs=600;assert.ok(rateLevel(quick).score>rateLevel(slow).score);
 for(const l of [single,many,broad,tower,flash,slow,fast,quick]){const r=rateLevel(l);assert.ok(r.score>=0&&r.score<=100);assert.equal(r.tier,Math.min(10,Math.floor(r.score/10)+1));}
});
test('rated generation reproduces levels and spans all ten actual tiers across seeds',()=>{
 for(let seed=0;seed<8;seed++){
  const scores=[];
  for(let tier=1;tier<=10;tier++){const l=generateRatedLevel(`span-${seed}`,tier,tier);assert.deepEqual(validateLevel(l),[]);assert.equal(rateLevel(l).tier,tier);scores.push(rateLevel(l).score);}
  assert.ok(scores.every((v,i)=>i===0||v>scores[i-1]));
 }
 assert.deepEqual(generateRatedLevels('reproduce',6,6),generateRatedLevels('reproduce',6,6));
});
test('every style and presentation remains valid at low and extreme tiers, including honest restricted scores',()=>{
 for(const family of FAMILIES)for(const tier of [1,5,10])for(const presentation of ['static','travel']){const l=generateRatedLevel('style-check',0,tier,family,presentation);assert.deepEqual(validateLevel(l),[]);assert.equal(l.presentation.kind,presentation);assert.ok(l.presentation.durationMs>=(presentation==='travel'?300:100));}
 const restricted=generateRatedLevel('restriction',0,10,'cluster','static');assert.ok(rateLevel(restricted).tier<10);
 assert.throws(()=>generateRatedLevel('bad',0,11));assert.throws(()=>generateRatedLevels('bad',51));assert.throws(()=>generateRatedLevel('bad',0,5,'unknown'));
});
test('climb reaches its cap on schedule, validates settings, and generates distinct progressive layouts',()=>{
 assert.deepEqual(Array.from({length:20},(_,i)=>climbTier(climb,i)),[1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10]);
 assert.equal(climbTier({...climb,startTier:3,step:3,every:1},4),10);
 for(const bad of [{...climb,maxTier:0},{...climb,step:0},{...climb,every:0},{...climb,startTier:11},{...climb,every:1.5}])assert.throws(()=>validateClimb(bad));
 const levels=generateRatedLevels('ramp-test',20,1,'mixed','auto',climb);assert.equal(new Set(levels.map(levelSignature)).size,20);
 assert.deepEqual(levels.map(l=>rateLevel(l).tier),Array.from({length:20},(_,i)=>climbTier(climb,i)));
 const scores=levels.map(l=>rateLevel(l).score);assert.ok(scores.every((v,i)=>i===0||v>=scores[i-1]));
});
test('saved levels and imported batches recalculate the same difficulty without trusting imported scores',()=>{
 const levels=generateRatedLevels('storage-score',3,7);const pack=makePack(levels,'Rated batch','rated-batch');pack.levels[0].difficulty={score:1,tier:1};
 const imported=normalizePack(pack);assert.equal(imported.levels[0].difficulty,undefined);assert.deepEqual(imported.levels.map(rateLevel),levels.map(rateLevel));
 const store=defaultStore();store.levels=levels;store.packs=[pack];const loaded=loadStore({getItem:()=>JSON.stringify(store)});assert.equal(loaded.error,null);assert.deepEqual(loaded.data.levels.map(rateLevel),levels.map(rateLevel));
});
test('Difficulty Climb completes two-player rounds, retains ratings in history, and regenerates paused tiers',()=>{
 const levels=generateRatedLevels('engine-climb',3,1,'mixed','auto',{...climb,every:1,maxTier:3});
 const config={mode:'climb',label:'Difficulty climb',seed:'engine-climb',family:'mixed',ratedPresentation:'auto',climb:{...climb,every:1,maxTier:3},source:'generated',solo:false,endless:false,previewMs:0,levels};
 const e=new GameEngine(config,rules);e.start(0);e.update(e.deadline);e.update(e.deadline);
 const old=levelSignature(e.current);e.pause(e.phaseStartedAt+10);e.resume(e.phaseStartedAt+100);assert.notEqual(levelSignature(e.current),old);assert.equal(rateLevel(e.current).tier,1);assert.equal(e.voided,1);
 while(e.phase!=='results'){
  if(e.phase==='answer'){for(let p=0;p<2;p++){for(let i=0;i<e.current.boxes.length;i++)e.count(p,e.answerOpenedAt+10+i);e.submit(p,e.answerOpenedAt+200+p*100);}}
  else e.update(e.deadline);
 }
 assert.equal(e.rounds.length,3);assert.equal(e.result().winner,0);assert.deepEqual(e.rounds.map(r=>rateLevel(r.level).tier),[1,2,3]);
 const store=defaultStore();store.history=[{id:'climb-history',solo:false,mode:'climb',label:'Difficulty climb',rounds:e.rounds}];const loaded=loadStore({getItem:()=>JSON.stringify(store)});assert.equal(loaded.data.history.length,1);assert.deepEqual(loaded.data.history[0].rounds.map(r=>rateLevel(r.level)),e.rounds.map(r=>rateLevel(r.level)));
 const reduced=new GameEngine({...config,reducedMotion:true,levels:[generateRatedLevel('motion',0,7,'mixed','travel')]},rules);reduced.start(0);reduced.update(reduced.deadline);assert.equal(reduced.current.presentation.kind,'static');assert.equal(rateLevel(reduced.current).parts.motion,0);assert.equal(reduced.assisted,true);
});
