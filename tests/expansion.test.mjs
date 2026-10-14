import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GameEngine} from '../dist/engine.js';
import {duelSummary,validateLevel,normalizePack,DEFAULT_BINDINGS} from '../dist/core.js';
import {generateChallenge,difficultyAt,generateLevel} from '../dist/generator.js';
import {gameSvg} from '../dist/renderer.js';
import {GameScene,travelOffset} from '../dist/scene.js';
import {defaultStore,loadStore} from '../dist/storage.js';
const read=name=>JSON.parse(readFileSync(new URL(`../data/${name}`,import.meta.url)));
const video=read('video-pack.json'),rules=read('rules-profile.json');
const duel={rule:'time',timeLeadMs:1000,pointsLead:2,minRounds:3,maxRounds:0};
const round=(p0,p1,t0=100,t1=200)=>({answer:3,players:[{guess:p0,elapsedMs:t0},{guess:p1,elapsedMs:t1}]});

test('video pack preserves all twelve traced object counts, gaps, broad box and tower positions',()=>{
 assert.deepEqual(normalizePack(video).levels.map(l=>l.boxes.length),[6,5,3,6,5,5,4,7,8,3,4,24]);
 const gap=video.levels.find(l=>l.id==='ref-04');assert.ok(gap.boxes.some(b=>b.x===1&&b.y===4));assert.ok(!gap.boxes.some(b=>b.x===1&&b.y===3));
 const towers=video.levels.find(l=>l.id==='ref-03');assert.equal(towers.boxes.filter(b=>b.x===0&&b.y===4).length,2);
 const broad=video.levels.find(l=>l.id==='ref-05');assert.equal(broad.boxes.filter(b=>b.w===2&&b.d===2).length,1);
});
test('progressive and motion campaigns are deterministic, valid, and introduce later patterns',()=>{
 for(const kind of ['ladder','motion']){
  const levels=generateChallenge('campaign',20,kind);assert.deepEqual(levels,generateChallenge('campaign',20,kind));levels.forEach(l=>assert.deepEqual(validateLevel(l),[]));
  if(kind==='motion'){assert.ok(levels.every(l=>l.presentation.kind==='travel'));assert.ok(levels.some(l=>l.boxes.some(b=>b.z>0)));assert.ok(levels.some(l=>l.boxes.some(b=>b.w>1)));}
  else{assert.ok(levels.slice(10).some(l=>/stairs|hollow|checker|dense/.test(l.provenance)));assert.ok(levels.slice(0,5).every(l=>l.presentation.durationMs===2200));}
 }
 assert.equal(difficultyAt('gentle',0),'gentle');assert.equal(difficultyAt('gentle',5),'standard');assert.equal(difficultyAt('gentle',10),'intense');assert.equal(difficultyAt('standard',5),'intense');
});
test('endless time lead waits for minimum rounds and uses adjusted rather than raw time',()=>{
 const r=round(3,0,1000,100);assert.equal(duelSummary([r],duel).finished,false);
 const score=duelSummary([r,r,r],duel);assert.equal(score.finished,true);assert.equal(score.winner,0);assert.equal(score.lead,12300);assert.equal(score.reason,'lead');
});
test('round points require correctness, reward the faster correct answer, and respect centisecond ties',()=>{
 const score=duelSummary([round(0,0),round(3,0,900,100),round(3,3,100,200),round(3,3,101,104)],{...duel,rule:'points',minRounds:1});
 assert.deepEqual(score.points,[2,0]);assert.equal(score.winner,0);assert.equal(score.finished,true);
 const wrong=duelSummary([round(0,0,100,900)],{...duel,rule:'points',minRounds:1});assert.deepEqual(wrong.points,[0,0]);assert.equal(wrong.winner,null);assert.equal(wrong.finished,false);
});
test('duel cap can end a tied game, while invalid cap settings are rejected',()=>{
 const score=duelSummary([round(0,0),round(0,0)],{...duel,rule:'points',minRounds:2,maxRounds:2});assert.equal(score.reason,'round-cap');assert.equal(score.winner,null);
 assert.throws(()=>new GameEngine({endless:true,solo:false,duel:{...duel,minRounds:5,maxRounds:2}},rules),/round cap/);
});
test('duel finishes automatically after a settled reveal, never after one player submits',()=>{
 const e=new GameEngine({endless:true,solo:false,source:'generated',seed:'duel',family:'large',difficulty:'gentle',previewMs:750,levels:[],duel:{...duel,minRounds:1}},rules);
 e.start(0);e.update(3000);e.update(6000);e.update(6750);for(let i=0;i<e.current.boxes.length;i++)e.count(0,6800+i);e.submit(0,7000);
 assert.equal(e.phase,'answer');assert.equal(e.rounds.length,0);e.submit(1,7100);assert.equal(e.phase,'preReveal');assert.equal(e.result().winner,0);
 e.finishPractice(7200);assert.equal(e.phase,'preReveal');e.update(e.deadline);e.update(e.deadline);e.update(e.deadline);assert.equal(e.phase,'matchEnd');assert.equal(e.rounds.length,1);e.update(e.deadline);assert.equal(e.phase,'results');
});
test('timeouts can finish a duel and pause cannot award phantom points',()=>{
 const e=new GameEngine({endless:true,solo:false,source:'generated',seed:'timeout',family:'large',difficulty:'gentle',previewMs:750,answerLimitMs:5000,levels:[],duel:{...duel,rule:'points',pointsLead:1,minRounds:1}},rules);
 e.start(0);e.update(3000);e.update(6000);e.update(6750);for(let i=0;i<e.current.boxes.length;i++)e.count(0,6800+i);e.submit(0,7000);e.pause(7100);assert.equal(e.duelStatus().points[0],0);e.resume(9000);
 e.update(e.deadline);e.update(e.deadline);for(let i=0;i<e.current.boxes.length;i++)e.count(0,e.answerOpenedAt+100+i);e.submit(0,e.answerOpenedAt+200);e.update(e.deadline);
 assert.equal(e.rounds.length,1);assert.equal(e.result().points[0],1);assert.equal(e.rounds[0].players[1].timeout,true);
});
test('long duel history preserves cumulative totals and round points after retaining only fifty details',()=>{
 const level=video.levels[2],rounds=Array.from({length:60},(_,i)=>({...round(3,i<8?0:3,100,200),round:i+1,level,levelId:level.id}));
 const d={...duel,rule:'points',pointsLead:20,minRounds:50,maxRounds:60},summary=duelSummary(rounds,d),store=defaultStore();store.history=[{id:'long-duel',solo:false,duel:d,totalRounds:60,summary,rounds:rounds.slice(-50)}];
 const loaded=loadStore({getItem:()=>JSON.stringify(store)});assert.equal(loaded.error,null);assert.deepEqual(loaded.data.history[0].summary,summary);assert.equal(loaded.data.history[0].rounds.length,50);
});
test('travelling geometry is mounted once across frames and animation freezes on pause',()=>{
 const level=generateLevel('motion',0,'gentle','travel-towers'),e={phase:'watch',current:level,phaseStartedAt:1000,deadline:1000+level.presentation.durationMs,roundIndex:0,levels:[level],guesses:[0,0],submissions:[null,null],config:{solo:false},rules};
 let writes=0,starts=0,cancels=0;const animation={currentTime:0,playState:'running',cancel(){cancels++;},pause(){this.playState='paused';},play(){this.playState='running';}},layer={style:{},animate(frames,options){starts++;assert.equal(options.easing,'linear');assert.equal(frames.length,2);return animation;}};
 const element={set innerHTML(value){writes++;},querySelector:()=>layer},view=new GameScene(element);
 for(let i=0;i<120;i++){const t=1000+i*10;view.update(gameSvg(e,t,DEFAULT_BINDINGS),e,t);}assert.equal(writes,1);assert.equal(starts,1);assert.equal(cancels,0);
 e.paused=true;view.update(gameSvg(e,2200,DEFAULT_BINDINGS),e,2200);assert.equal(animation.playState,'paused');assert.equal(writes,1);
 e.phase='answer';view.update(gameSvg(e,4000,DEFAULT_BINDINGS),e,4000);assert.equal(writes,2);assert.equal(cancels,1);
});
test('motion fallback remains linear, bounded and only moves the parent layer',()=>{
 const p={from:{x:1000,y:-450},to:{x:-1000,y:450}};assert.deepEqual(travelOffset(p,.5),{x:0,y:0});assert.deepEqual(travelOffset(p,-1),p.from);assert.deepEqual(travelOffset(p,2),p.to);
 for(let i=1;i<100;i++)assert.ok(travelOffset(p,i/100).x<travelOffset(p,(i-1)/100).x);
 const layer={style:{}},el={innerHTML:'',querySelector:()=>layer},view=new GameScene(el),e={phase:'watch',phaseStartedAt:100,current:{id:'test',presentation:{...p,kind:'travel',durationMs:1000}}};view.update('geometry',e,600);assert.equal(layer.style.transform,'translate3d(0px,0px,0)');view.update('geometry',e,850);assert.equal(layer.style.transform,'translate3d(-500px,225px,0)');
});
test('watch frames reuse generated scene markup and invalidate it for new puzzle or changed contrast',()=>{
 let draws=0;const el={innerHTML:'',querySelector:()=>({style:{}})},view=new GameScene(el,()=>`scene-${++draws}`),e={phase:'watch',phaseStartedAt:0,current:generateLevel('cached',0,'gentle','travel')};
 for(let i=0;i<120;i++)view.draw(e,i*10,DEFAULT_BINDINGS,{highContrast:false});assert.equal(draws,1);
 view.draw(e,1200,DEFAULT_BINDINGS,{highContrast:true});assert.equal(draws,2);e.current=generateLevel('new',1,'gentle','travel');view.draw(e,1300,DEFAULT_BINDINGS,{highContrast:true});assert.equal(draws,3);
});
