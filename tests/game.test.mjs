import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {GameEngine} from '../dist/engine.js';
import {FAMILIES,generateLevel,generateLevels} from '../dist/generator.js';
import {validateLevel,normalizePack,makePack,levelSignature,validBindings,DEFAULT_BINDINGS} from '../dist/core.js';
import {boardLayout,project} from '../dist/renderer.js';
import {defaultStore,loadStore,saveStore,addHistory} from '../dist/storage.js';
const pack=JSON.parse(readFileSync(new URL('../data/reference-pack.json',import.meta.url)));
const rules=JSON.parse(readFileSync(new URL('../data/rules-profile.json',import.meta.url)));
const config=(extra={})=>({levels:[pack.levels[0]],source:'generated',seed:'test',solo:false,endless:false,difficulty:'standard',previewMs:0,answerLimitMs:0,...extra});
function answerEngine(extra={}){const e=new GameEngine(config(extra),rules);e.start(0);e.update(3000);e.update(6000);e.update(6750);assert.equal(e.phase,'answer');return e;}

test('seed and generator version reproduce complete packs',()=>{
 assert.equal(createHash('sha256').update(JSON.stringify(generateLevels('repeatable',20))).digest('hex'),'03886202e9fa7ee659ff511c00fc2443e75309f23e4933ad6382dd3d352d3446','Generator v2 fixture changed; explicitly version future algorithms.');
 assert.deepEqual(generateLevels('repeatable',20),generateLevels('repeatable',20));
 assert.notDeepEqual(generateLevels('repeatable',20),generateLevels('another',20));
 assert.equal(new Set(generateLevels('repeatable',20).map(levelSignature)).size,20);
});
test('all generator families remain supported and collision-free over many seeds',()=>{
 for(const difficulty of ['gentle','standard','intense'])for(const family of FAMILIES)for(let i=0;i<30;i++){
  const l=generateLevel(`seed-${i}`,i,difficulty,family);assert.deepEqual(validateLevel(l),[],`${difficulty} ${family} ${i}`);
 }
});
test('input opens after the preview, locks independently, and settles once',()=>{
 const e=answerEngine();assert.equal(e.count(0,6800),true);e.count(0,6900);e.count(0,7000);e.submit(0,7100);
 assert.equal(e.count(0,7200),false);assert.equal(e.rounds.length,0);assert.equal(e.submissions[0].elapsedMs,350);
 for(let i=0;i<3;i++)e.count(1,7300+i);e.submit(1,7400);assert.equal(e.phase,'preReveal');assert.equal(e.rounds.length,1);
 e.submit(1,7500);assert.equal(e.rounds.length,1);assert.equal(e.result().players[0].correct,1);
});
test('countdown actions cannot become queued answers',()=>{
 const e=new GameEngine(config(),rules);e.start(0);assert.equal(e.count(0,1000),false);assert.equal(e.submit(0,2000),false);
 e.update(3000);e.update(6000);assert.equal(e.count(0,6200),false);e.update(6750);assert.deepEqual(e.guesses,[0,0]);
});
test('a timeout preserves locked time and marks an unsubmitted correct counter wrong',()=>{
 const e=answerEngine({answerLimitMs:5000});for(let i=0;i<3;i++){e.count(0,6800+i);e.count(1,6900+i);}e.submit(0,7000);
 e.update(11750);assert.equal(e.phase,'preReveal');assert.equal(e.rounds[0].players[0].elapsedMs,250);
 assert.equal(e.rounds[0].players[1].guess,null);assert.equal(e.rounds[0].players[1].elapsedMs,5000);assert.equal(e.result().players[1].adjustedMs,10000);
 assert.equal(e.submit(1,11750),false);
});
test('pause voids an unfinished generated round without changing settled scores',()=>{
 const e=answerEngine();const before=levelSignature(e.current);e.count(0,7000);e.pause(7100);assert.equal(e.count(1,7200),false);
 e.resume(9000);assert.equal(e.phase,'puzzleCountdown');assert.deepEqual(e.guesses,[0,0]);assert.equal(e.rounds.length,0);assert.equal(e.voided,1);assert.notEqual(levelSignature(e.current),before);
});
test('pausing a settled reveal keeps exactly one recorded round',()=>{
 const e=answerEngine({solo:true});e.submit(0,7000);e.pause(7100);e.resume(20000);assert.equal(e.rounds.length,1);assert.equal(e.phase,'preReveal');e.update(20400);assert.equal(e.phase,'revealCounting');
});
test('endless practice generates the next round and can finish without grading the unfinished one',()=>{
 const e=new GameEngine(config({endless:true,solo:true,levels:[]}),rules);e.start(0);e.update(3000);e.update(6000);e.update(6000+e.current.presentation.durationMs);
 e.submit(0,e.answerOpenedAt+100);e.update(e.deadline);e.update(e.deadline);e.update(e.deadline);assert.equal(e.roundIndex,1);assert.equal(e.phase,'puzzleCountdown');
 e.finishPractice(12000);e.update(12600);assert.equal(e.phase,'results');assert.equal(e.rounds.length,1);
});
test('imports reject unsupported boxes, duplicates and extreme values before rendering',()=>{
 const level=structuredClone(pack.levels[0]);level.boxes[0].z=3;assert.throws(()=>normalizePack(makePack([level])));
 const repeated=makePack([pack.levels[0],pack.levels[0]]);assert.throws(()=>normalizePack(repeated),/duplicate/);
 level.boxes[0].w=1e12;assert.throws(()=>normalizePack(makePack([level])));
});
test('custom JSON round trips preserve boxes and reveal identity while stripping unknown fields',()=>{
 const input=makePack([pack.levels[4]],'Broad box');input.levels[0].html='<script>alert(1)</script>';
 const output=normalizePack(JSON.parse(JSON.stringify(input)));assert.equal(output.levels[0].boxes.length,4);assert.equal('html' in output.levels[0],false);
 assert.deepEqual(normalizePack(JSON.parse(JSON.stringify(output))),output);
});
test('renderer preserves the footage camera and fits tall custom levels inside the canvas',()=>{
 for(const l of pack.levels){const fit=boardLayout(l);assert.equal(fit.y,312);assert.equal(fit.scale,1);assert.ok(fit.y+fit.minY>=150);assert.ok(fit.y+fit.maxY<625);}
 const tall={...pack.levels[0],id:'custom-tall',boxes:[{id:'tall',x:0,y:0,z:0,w:1,d:1,h:4}],revealOrder:['tall']},fit=boardLayout(tall);assert.ok(fit.y+fit.minY*fit.scale>=219.99);assert.ok(fit.y+fit.maxY*fit.scale<=620.01);
});
test('saved packs and controls survive reloading, with honest storage failure',()=>{
 let raw=null;const storage={setItem:(key,value)=>{raw=value;},getItem:()=>raw};const data=defaultStore();data.packs=[makePack([pack.levels[4]],'Saved pack')];saveStore(data,storage);assert.deepEqual(loadStore(storage).data.packs,data.packs);
 assert.throws(()=>saveStore(data,{setItem:()=>{throw new Error('quota');}}),/quota/);
 assert.equal(validBindings({...DEFAULT_BINDINGS,p2Count:'KeyZ'}),false);assert.equal(validBindings(DEFAULT_BINDINGS),true);
});
test('a full twenty-round match reaches results with independent totals',()=>{
 const levels=generateLevels('full-match',20,'intense');const e=new GameEngine(config({levels}),rules);e.start(0);let time=0;
 for(let guard=0;e.phase!=='results'&&guard<200;guard++){
  if(e.phase==='answer'){
   const answer=e.current.boxes.length;
   for(let i=0;i<answer;i++)e.count(0,time+100+i);
   e.submit(0,time+300);e.submit(1,time+500);time+=500;
  }else{time=e.deadline;e.update(time);}
 }
 assert.equal(e.phase,'results');assert.equal(e.rounds.length,20);assert.equal(e.result().winner,0);
 assert.equal(e.result().players[0].mistakes,0);assert.equal(e.result().players[1].mistakes,20);
 assert.equal(e.result().players[0].rawMs,6000);assert.equal(e.result().players[1].adjustedMs,110000);
});
test('corrupt history and drafts cannot erase a valid saved library',()=>{
 const data=defaultStore();data.levels=[pack.levels[0]];data.history=[null,{id:'bad',rounds:[{answer:3,level:pack.levels[0],players:[null,null]}]}];data.draft={id:'broken',boxes:[{x:Infinity}]};
 const loaded=loadStore({getItem:()=>JSON.stringify(data)});assert.equal(loaded.error,null);assert.equal(loaded.data.levels.length,1);assert.deepEqual(loaded.data.history,[]);assert.equal(loaded.data.draft,null);
});
test('completed sessions reload with replayable geometry and recomputed results',()=>{
 const e=answerEngine({solo:true});e.submit(0,7000);const data=defaultStore();data.history=[{id:'session',date:'2026-10-13T00:00:00Z',label:'Solo test',solo:true,rounds:e.rounds,summary:{accuracy:'invalid'}}];
 const loaded=loadStore({getItem:()=>JSON.stringify(data)});assert.equal(loaded.error,null);assert.equal(loaded.data.history[0].summary.accuracy,0);
 assert.deepEqual(validateLevel(loaded.data.history[0].rounds[0].level),[]);
});
