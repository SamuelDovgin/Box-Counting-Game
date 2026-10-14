import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {visibilityReport,paintOrder,boxFaces,intersectionArea,motionExposure} from '../dist/geometry.js';
import {validateLevel,normalizePack,makePack,clone,rotateLevel,mirrorLevel,DEFAULT_BINDINGS} from '../dist/core.js';
import {generateRatedLevel} from '../dist/rated-generator.js';
import {generateLevel,FAMILIES} from '../dist/generator.js';
import {GameEngine} from '../dist/engine.js';
import {gameSvg} from '../dist/renderer.js';
import {GameScene} from '../dist/scene.js';
import {defaultStore,loadStore} from '../dist/storage.js';
const rules=JSON.parse(readFileSync(new URL('../data/rules-profile.json',import.meta.url)));
const box=(id,x,y,z=0,w=1,d=1,h=1)=>({id,x,y,z,w,d,h});
const level=boxes=>({id:'fairness-test',name:'Fairness test',boardSize:5,boxes,presentation:{kind:'static',durationMs:2500},revealOrder:boxes.map(b=>b.id)});
const unfair=()=>level([box('back',0,0),box('blocking-tower',1,1,0,2,2,4)]);

test('a fully hidden box is rejected at validation, import and the game boundary',()=>{
 const l=unfair();assert.deepEqual(validateLevel(l,{geometryOnly:true}),[]);assert.deepEqual(visibilityReport(l).hidden,['back']);
 assert.match(validateLevel(l).join(' '),/fully unobstructed face/);assert.throws(()=>normalizePack(makePack([l])),/unobstructed/);
 assert.throws(()=>new GameEngine({levels:[l],source:'authored'},rules),/unobstructed/);
 const front=level([box('back',1,1),box('front',2,2,0,1,1,4)]);assert.equal(visibilityReport(front).valid,false);
});
test('touching edges do not count as occlusion, while an area overlap does',()=>{
 const square=[[0,0],[1,0],[1,1],[0,1]],neighbor=[[1,0],[2,0],[2,1],[1,1]];
 assert.equal(intersectionArea(square,neighbor),0);assert.equal(intersectionArea(square,[[.5,0],[1.5,0],[1.5,1],[.5,1]]),.5);
 const wall=level(Array.from({length:5},(_,x)=>box(`b${x}`,x,4)));assert.equal(visibilityReport(wall).valid,true);
});
test('supported towers expose individual faces and paint their bases before tops regardless of ID',()=>{
 const l=level([box('aaa-top',0,4,1),box('zzz-bottom',0,4)]);assert.deepEqual(validateLevel(l),[]);
 assert.deepEqual(paintOrder(l.boxes).items.map(i=>i.box.id),['zzz-bottom','aaa-top']);assert.ok(visibilityReport(l).boxes.every(b=>b.clearFaces>0));
 assert.equal(visibilityReport(mirrorLevel(l)).valid,true);assert.equal(visibilityReport(rotateLevel(l)).valid,true);
});
test('all authored reference levels, generated styles and difficulty tiers satisfy visibility and travel exposure',()=>{
 for(const name of ['reference-pack','video-pack'])for(const l of JSON.parse(readFileSync(new URL(`../data/${name}.json`,import.meta.url))).levels){assert.equal(visibilityReport(l).valid,true,l.id);assert.equal(motionExposure(l).valid,true,l.id);}
 for(const family of FAMILIES)for(const difficulty of ['gentle','standard','intense']){const l=generateLevel('fairness-family',3,difficulty,family);assert.equal(visibilityReport(l).valid,true,`${family} ${difficulty}`);}
 for(let tier=1;tier<=10;tier++){const l=generateRatedLevel('fairness-rated',tier,tier);assert.deepEqual(validateLevel(l),[]);assert.ok(visibilityReport(l).boxes.every(b=>b.clearFaces>0));assert.equal(motionExposure(l).valid,true);}
});
test('travel must expose every complete box and cannot skim the edge or cross too quickly',()=>{
 const l=level([box('a',0,4),box('b',2,2)]);l.presentation={kind:'travel',durationMs:2500,from:{x:1000,y:0},to:{x:-1000,y:0}};assert.deepEqual(validateLevel(l),[]);
 const miss=clone(l);miss.presentation.to={x:1000,y:0};assert.match(validateLevel(miss).join(' '),/visible canvas/);
 const huge=level([box('large',0,0,0,5,5)]);huge.presentation={...l.presentation,durationMs:300};assert.ok(validateLevel(huge).length);huge.presentation.durationMs=1200;assert.deepEqual(validateLevel(huge),[]);
});
test('old obscured libraries and history are preserved for repair without becoming playable',()=>{
 const l=unfair(),s=defaultStore();s.levels=[l];s.packs=[makePack([l],'Old pack','old-pack')];s.draft=l;s.history=[{id:'old-result',solo:false,rounds:[{level:l,answer:2,players:[{guess:2,elapsedMs:100},{guess:1,elapsedMs:200}]}]}];
 const loaded=loadStore({getItem:()=>JSON.stringify(s)});assert.equal(loaded.error,null);assert.deepEqual(loaded.data.levels[0].boxes,l.boxes);assert.equal(loaded.data.packs.length,1);assert.equal(loaded.data.history.length,1);assert.deepEqual(loaded.data.draft,l);
 assert.ok(validateLevel(loaded.data.levels[0]).length);assert.throws(()=>new GameEngine({levels:loaded.data.packs[0].levels},rules));
});
test('moving geometry keeps its nodes and animation across dropped frames and preference redraws stay aligned',()=>{
 const l=generateLevel('smooth-test',0,'gentle','travel-towers'),e={phase:'watch',current:l,phaseStartedAt:1000,deadline:6000,roundIndex:0,levels:[l],config:{solo:false},rules};
 let writes=0,animations=0;const layers=[],createLayer=()=>({style:{},animate(frames,opts){assert.ok(frames.every(f=>f.transform.startsWith('translate3d')));assert.equal(opts.easing,'linear');animations++;return {currentTime:0,playState:'running',pause(){this.playState='paused';},play(){this.playState='running';},cancel(){}};}});
 const el={set innerHTML(v){writes++;layers.push(createLayer());},querySelector:()=>layers.at(-1)},view=new GameScene(el);
 for(const t of [1000,1016,1033,1220,1240,1700])view.draw(e,t,DEFAULT_BINDINGS);assert.equal(writes,1);assert.equal(animations,1);
 view.draw(e,1800,DEFAULT_BINDINGS,{highContrast:true});assert.equal(view.animation.currentTime,800);assert.equal(animations,2);
 const svg=gameSvg(e,1800,DEFAULT_BINDINGS);assert.ok(!svg.includes('data-player='),'Preview controls must not cover boxes');assert.equal(boxFaces(l.boxes[0]).length,3);
});

test('a short viewing override cannot bypass minimum travel exposure',()=>{
 const l=level([box('large',0,0,0,5,5)]);l.presentation={kind:'travel',durationMs:2000,from:{x:1600,y:1000},to:{x:-1600,y:-1000}};assert.deepEqual(validateLevel(l),[]);
 const e=new GameEngine({levels:[l],source:'authored',previewMs:750},rules);e.start(0);e.update(e.deadline);assert.ok(e.current.presentation.durationMs>750);assert.equal(motionExposure(e.current).valid,true);assert.equal(e.assisted,true);
});
