import {clone,DEFAULT_BINDINGS,ALTERNATE_BINDINGS,correctAnswer,keyName,validBinding,validBindings,validateLevel,normalizePack,makePack,rotateLevel,mirrorLevel} from './core.js';
import {generateLevel,generateLevels,seededRandom} from './generator.js';
import {GameEngine} from './engine.js';
import {loadStore,saveStore,addHistory} from './storage.js';
import {GameAudio} from './audio.js';
import {esc,boardSvg,gameSvg} from './renderer.js';
import {renderUI,availableLevels} from './ui.js';

const stage=document.querySelector('#stage'),scene=document.querySelector('#scene'),overlay=document.querySelector('#overlay'),header=document.querySelector('#header-detail'),nav=document.querySelector('#main-nav'),playControls=document.querySelector('#play-controls'),toastElement=document.querySelector('#toast');
const audio=new GameAudio(),held=new Set();
let screen='loading',pack,rules,engine=null,store,lastScene='',lastOverlay='',lastControls='',toastTimer,draftTimer,lastCue='',settingsBack='menu';
let storageWarning='';
try{const saved=loadStore();store=saved.data;storageWarning=saved.error??'';if(saved.newUser)store.settings.reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;}catch{store=loadStore({getItem:()=>null}).data;storageWarning='Browser storage is unavailable. You can play and export your work, but it will not survive a reload.';}
const ui={checked:[false,false,false,false],config:null,setup:null,editor:null,captureKey:null,returnTo:null,detailRecord:null,detailsBack:'results',packDraft:null,packAddKey:'reference:0'};
const id=prefix=>`${prefix}-${crypto.randomUUID().slice(0,12)}`;
const seed=()=>crypto.randomUUID().slice(0,8);
const now=()=>performance.now();
const context=()=>({screen,store,ui,engine,pack});
function toast(message){clearTimeout(toastTimer);toastElement.textContent=message;toastElement.hidden=false;toastTimer=setTimeout(()=>{toastElement.hidden=true;},6000);}
function persist(message=''){try{saveStore(store);if(message)toast(message);return true;}catch(error){toast(`Could not save: ${error.message} Your current work is still available to export.`);return false;}}
function go(next){screen=next;held.clear();ui.captureKey=null;render();}
function menu(){engine=null;ui.returnTo=null;go('menu');}
function settings(){settingsBack=screen;go('settings');}
function checkControls(config){ui.config=config;ui.checked=[false,false,false,false];audio.unlock();go('checks');}
function baseConfig(label,mode){return {label,mode,solo:false,endless:false,levels:[],source:'generated',difficulty:'standard',family:'mixed',seed:seed(),previewMs:0,answerLimitMs:0,reducedMotion:store.settings.reducedMotion,assisted:false};}
function mode(modeName){
  ui.returnTo=null;
  if(modeName==='classic'){const config=baseConfig('Classic','classic');config.source='classic';config.levels=clone(pack.levels);checkControls(config);return;}
  ui.setup={mode:modeName,players:'2',rounds:modeName==='full'?20:modeName==='quick'?5:10,source:'generated',difficulty:'standard',family:'mixed',seed:seed(),previewMs:modeName==='practice'?2500:0,answerLimitMs:0,shuffle:false,practiceLevel:'reference:0'};
  go('setup');
}
function buildSetup(form){
  const values=Object.fromEntries(new FormData(form));
  const c={...ui.setup,...values,shuffle:!!form.elements.shuffle?.checked};ui.setup=c;
  const label={quick:'Quick match',full:'Full match',endless:'Endless practice',practice:'Puzzle practice',custom:'Custom match'}[c.mode];
  const config=baseConfig(label,c.mode);config.solo=c.mode==='endless'||c.mode==='practice'||c.players==='1';config.endless=c.mode==='endless';config.seed=String(c.seed||seed()).slice(0,80);config.difficulty=c.difficulty;config.family=c.family??'mixed';config.previewMs=Number(c.previewMs);config.answerLimitMs=c.mode==='custom'?Number(c.answerLimitMs):0;
  if(config.previewMs)config.assisted=true;
  if(c.mode==='practice'){
    const item=availableLevels(context()).find(l=>l.key===c.practiceLevel);if(!item)throw new Error('Choose an available puzzle.');config.levels=[clone(item.level)];config.source='authored';
  }else if(c.mode==='custom'&&c.source!=='generated'){
    const selected=c.source==='reference'?pack:store.packs.find(p=>`pack:${p.id}`===c.source);if(!selected)throw new Error('Choose an available pack.');
    config.levels=clone(selected.levels);config.source='authored';config.label=selected.title;
    if(c.shuffle){const rng=seededRandom(config.seed);for(let i=config.levels.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[config.levels[i],config.levels[j]]=[config.levels[j],config.levels[i]];}}
  }else if(!config.endless){const count=c.mode==='quick'?5:c.mode==='full'?20:Number(c.rounds);if(!Number.isInteger(count)||count<1||count>50)throw new Error('Choose 1–50 rounds.');config.levels=generateLevels(config.seed,count,config.difficulty);}
  checkControls(config);
}
function start(){
  if(!(ui.checked[0]&&ui.checked[1]&&(ui.config.solo||ui.checked[2]&&ui.checked[3])))return;
  engine=new GameEngine(ui.config,rules);audio.configure(store.settings);audio.unlock();engine.start(now());lastCue='';go('game');
}
function finishHistory(){
  if(!engine||engine.recorded||!engine.rounds.length)return;engine.recorded=true;
  const record={id:id('session'),date:new Date().toISOString(),label:engine.config.label,mode:engine.config.mode,solo:engine.config.solo,assisted:engine.assisted,seed:engine.config.seed,totalRounds:engine.rounds.length,voided:engine.voided,summary:engine.result(),rounds:clone(engine.rounds.slice(-50))};
  store=addHistory(store,record);persist();
}
function input(player,submit=false){if(screen!=='game')return;audio.unlock();submit?engine.submit(player,now()):engine.count(player,now());render();}
function pause(){if(screen==='game'){engine.pause(now());go('paused');}}
function resume(){if(screen==='paused'){engine.resume(now());go('game');}}
function blankLevel(){return {id:id('level'),name:'My box puzzle',boardSize:5,provenance:'Created in the Box Counting editor',boxes:[],presentation:{kind:'static',durationMs:2500},revealOrder:[]};}
function openEditor(level=null,{fresh=false}={}){
  if(!level&&ui.editor){go('editor');return;}
  const savedDraft=store.draft;
  const useDraft=!level&&savedDraft&&Array.isArray(savedDraft.revealOrder)&&savedDraft.presentation&&typeof savedDraft.id==='string';
  const draft=clone(level??(useDraft?savedDraft:blankLevel()));
  if(fresh||level&&!store.levels.some(l=>l.id===level.id))draft.id=id('level');
  ui.editor={level:draft,selected:null,tool:'add',undo:[],redo:[],dirty:!store.levels.some(l=>l.id===draft.id)};go('editor');
}
function saveDraft(){clearTimeout(draftTimer);draftTimer=setTimeout(()=>{if(!validateLevel(ui.editor.level,{allowEmpty:true}).length){store.draft=clone(ui.editor.level);persist();}},350);}
function mutateEditor(fn){
  const e=ui.editor;e.undo.push(clone(e.level));if(e.undo.length>100)e.undo.shift();e.redo=[];fn(e.level);e.level.revealOrder=e.level.revealOrder.filter(b=>e.level.boxes.some(x=>x.id===b));for(const b of e.level.boxes)if(!e.level.revealOrder.includes(b.id))e.level.revealOrder.push(b.id);
  if(!e.level.boxes.some(b=>b.id===e.selected))e.selected=null;e.dirty=true;saveDraft();render();
}
function boxFields(){return Object.fromEntries(['x','y','z','w','d','h'].map(k=>[k,Number(document.querySelector(`#box-${k}`)?.value??(['w','d','h'].includes(k)?1:0))]));}
function addBox(x,y,z=0,unit=false){
  const dims=boxFields();const b={id:id('b'),x,y,z,w:unit?1:dims.w,d:unit?1:dims.d,h:unit?1:dims.h};
  const candidate=clone(ui.editor.level);candidate.boxes.push(b);candidate.revealOrder.push(b.id);const errors=validateLevel(candidate);
  if(errors.length){toast(errors[0]);return;}
  mutateEditor(l=>l.boxes.push(b));ui.editor.selected=b.id;render();
}
function saveLevel(copy=false){
  const e=ui.editor,errors=validateLevel(e.level);if(errors.length){toast(errors[0]);return;}
  const l=clone(e.level);if(copy)l.id=id('level');
  if(!store.levels.some(s=>s.id===l.id)&&store.levels.length>=100){toast('Your library already has 100 levels. Export or remove an unused level first.');return;}
  const old=store.levels.findIndex(s=>s.id===l.id);if(old>=0)store.levels[old]=l;else store.levels.push(l);
  store.draft=clone(l);
  if(persist('Level saved.')){e.level=l;e.dirty=false;}render();
}
function testLevels(levels,solo=true,label='Editor test',returnTo='editor'){
  const errors=levels.flatMap(validateLevel);if(errors.length){toast(errors[0]);return;}
  ui.returnTo=returnTo;const config=baseConfig(label,'practice');config.source='authored';config.solo=solo;config.levels=clone(levels);config.assisted=true;checkControls(config);
}
function exportJSON(data,name){
  const blob=new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`${name.replace(/[^a-z0-9_-]/gi,'-').slice(0,80)||'box-counting'}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function newPack(existing=null){ui.packDraft=clone(existing??makePack([],'My level pack',id('pack')));ui.packAddKey='reference:0';go('pack-builder');}
function savePack(){
  let normalized;try{normalized=normalizePack(ui.packDraft);}catch(e){toast(e.message);return;}
  const found=store.packs.findIndex(p=>p.id===normalized.id);if(found>=0)store.packs[found]=normalized;else if(store.packs.length<50)store.packs.push(normalized);else{toast('You already have 50 packs. Export or remove an unused pack first.');return;}
  persist('Pack saved.');render();
}
async function importJSON(file){
  if(!file)return;if(file.size>1_000_000){toast('Import files must be smaller than 1 MB.');return;}
  try{let parsed=JSON.parse(await file.text());if(parsed.boxes)parsed=makePack([parsed],parsed.name||'Imported level',id('pack'));const imported=normalizePack(parsed);imported.id=id('pack');if(store.packs.length>=50)throw new Error('You already have 50 saved packs.');store.packs.push(imported);persist('Imported as a new pack. Existing packs were preserved.');go('library');}
  catch(error){toast(`Import failed: ${error.message}`);}
}
function action(target){
  const a=target.dataset.action;if(!a)return;
  if(a==='mode')mode(target.dataset.mode);
  else if(a==='menu')menu();
  else if(a==='start')start();
  else if(a==='pause')pause();
  else if(a==='resume')resume();
  else if(a==='finish-practice'){engine.finishPractice(now());go('game');}
  else if(a==='again'){const config=clone(engine.config);if(config.source==='generated'){config.seed=seed();if(!config.endless)config.levels=generateLevels(config.seed,config.levels.length,config.difficulty,config.family);}checkControls(config);}
  else if(a==='settings')settings();
  else if(a==='settings-back'){ui.captureKey=null;go(settingsBack);}
  else if(a==='bind'){ui.captureKey=target.dataset.key;render();}
  else if(a==='default-keys'||a==='alternate-keys'){store.settings.bindings={...(a==='default-keys'?DEFAULT_BINDINGS:ALTERNATE_BINDINGS)};ui.captureKey=null;persist('Keyboard layout saved.');render();}
  else if(a==='editor')openEditor();
  else if(a==='library')go('library');
  else if(a==='history')go('history');
  else if(a==='help')go('help');
  else if(a==='details'){ui.detailRecord=null;ui.detailsBack='results';go('details');}
  else if(a==='details-back')go(ui.detailsBack);
  else if(a==='return-editor')go('editor');
  else if(a==='return-library')go('library');
  else if(a==='return-history')go('history');
  else if(a==='editor-tool'){ui.editor.tool=target.dataset.tool;render();}
  else if(a==='blank-level'){openEditor(blankLevel(),{fresh:true});saveDraft();}
  else if(a==='random-level'){const l=generateLevel(seed(),0,'standard');l.id=id('level');openEditor(l);saveDraft();}
  else if(a==='undo'||a==='redo'){
    const e=ui.editor,source=a==='undo'?e.undo:e.redo,dest=a==='undo'?e.redo:e.undo;if(source.length){dest.push(clone(e.level));e.level=source.pop();e.selected=null;e.dirty=true;saveDraft();render();}
  }else if(a==='clear')mutateEditor(l=>{l.boxes=[];l.revealOrder=[];});
  else if(a==='mirror'||a==='rotate')mutateEditor(l=>Object.assign(l,a==='mirror'?mirrorLevel(l):rotateLevel(l)));
  else if(a==='delete-box'){const id=ui.editor.selected;mutateEditor(l=>l.boxes=l.boxes.filter(b=>b.id!==id));}
  else if(a==='apply-box'){
    const fields=boxFields();if(Object.values(fields).some(v=>!Number.isInteger(v)||v<0||v>5)||fields.z>3||fields.h>4||fields.w<1||fields.d<1||fields.h<1){toast('Use whole-number coordinates and valid box sizes.');return;}
    mutateEditor(l=>Object.assign(l.boxes.find(b=>b.id===ui.editor.selected),fields));
  }else if(a==='stack'){const b=ui.editor.level.boxes.find(b=>b.id===ui.editor.selected);if(b)addBox(b.x,b.y,b.z+b.h,true);}
  else if(a==='duplicate-box'){
    const source=ui.editor.level.boxes.find(b=>b.id===ui.editor.selected);if(!source)return;let candidate;
    for(let y=0;y<5&&!candidate;y++)for(let x=0;x<5&&!candidate;x++){const b={...source,id:id('b'),x,y,z:0};const l=clone(ui.editor.level);l.boxes.push(b);l.revealOrder.push(b.id);if(!validateLevel(l).length)candidate=b;}
    if(candidate){mutateEditor(l=>l.boxes.push(candidate));ui.editor.selected=candidate.id;render();}else toast('No free ground position fits that box.');
  }else if(a==='reveal-up'||a==='reveal-down'){const i=Number(target.dataset.index),j=i+(a==='reveal-up'?-1:1);mutateEditor(l=>{if(j>=0&&j<l.revealOrder.length)[l.revealOrder[i],l.revealOrder[j]]=[l.revealOrder[j],l.revealOrder[i]];});}
  else if(a==='save-level'||a==='save-copy')saveLevel(a==='save-copy');
  else if(a==='test-level'||a==='test-duel')testLevels([ui.editor.level],a==='test-level');
  else if(a==='export-level')exportJSON(makePack([ui.editor.level],ui.editor.level.name),ui.editor.level.name);
  else if(a==='edit-saved')openEditor(store.levels.find(l=>l.id===target.dataset.id));
  else if(a==='play-saved')testLevels([store.levels.find(l=>l.id===target.dataset.id)],true,'Saved puzzle','library');
  else if(a==='export-saved'){const l=store.levels.find(l=>l.id===target.dataset.id);exportJSON(makePack([l],l.name),l.name);}
  else if(a==='delete-saved'){store.levels=store.levels.filter(l=>l.id!==target.dataset.id);persist('Level removed from the library.');render();}
  else if(a==='new-pack')newPack();
  else if(a==='edit-pack')newPack(store.packs.find(p=>p.id===target.dataset.id));
  else if(a==='play-pack'){const p=store.packs.find(p=>p.id===target.dataset.id);ui.returnTo='library';const config=baseConfig(p.title,'custom');config.source='authored';config.levels=clone(p.levels);checkControls(config);}
  else if(a==='export-pack'){const p=store.packs.find(p=>p.id===target.dataset.id);exportJSON(p,p.title);}
  else if(a==='delete-pack'){store.packs=store.packs.filter(p=>p.id!==target.dataset.id);persist('Pack removed from the library.');render();}
  else if(a==='pack-add'){
    if(ui.packDraft.levels.length>=50){toast('A pack can hold up to 50 levels.');return;}
    ui.packAddKey=document.querySelector('#pack-add-level').value;const selected=availableLevels(context()).find(l=>l.key===ui.packAddKey);if(selected){const l=clone(selected.level);l.id=id('pack-level');ui.packDraft.levels.push(l);render();}
  }else if(a==='pack-up'||a==='pack-down'){const i=Number(target.dataset.index),j=i+(a==='pack-up'?-1:1),l=ui.packDraft.levels;if(j>=0&&j<l.length)[l[i],l[j]]=[l[j],l[i]];render();}
  else if(a==='pack-remove'){ui.packDraft.levels.splice(Number(target.dataset.index),1);render();}
  else if(a==='pack-edit-level')openEditor(ui.packDraft.levels[Number(target.dataset.index)],{fresh:true});
  else if(a==='save-pack')savePack();
  else if(a==='export-draft-pack')exportJSON(ui.packDraft,ui.packDraft.title);
  else if(a==='test-pack')testLevels(ui.packDraft.levels,false,ui.packDraft.title,'library');
  else if(a==='history-detail'){ui.detailRecord=store.history.find(h=>h.id===target.dataset.id);ui.detailsBack='history';go('details');}
  else if(a==='replay'){
    const h=store.history.find(h=>h.id===target.dataset.id),levels=h.rounds.map(r=>r.level);if(levels.some(l=>validateLevel(l).length)){toast('This saved session cannot be replayed.');return;}
    const config=baseConfig(`Replay practice · ${h.label}`,'practice');config.source='authored';config.solo=h.solo;config.assisted=true;config.levels=clone(levels);ui.returnTo='history';checkControls(config);
  }else if(a==='count'||a==='submit')input(Number(target.dataset.player),a==='submit');
}
document.addEventListener('click',event=>{const target=event.target.closest('[data-action]');if(target){if(target.type==='submit'&&target.closest('form'))return;action(target);}});
document.addEventListener('submit',event=>{
  event.preventDefault();audio.unlock();
  try{if(event.target.id==='setup-form')buildSetup(event.target);else if(event.target.id==='settings-form'){
    const f=event.target.elements;store.settings.sound=f.sound.checked;store.settings.volume=Number(f.volume.value);store.settings.highContrast=f.highContrast.checked;store.settings.reducedMotion=f.reducedMotion.checked;audio.configure(store.settings);persist('Settings saved.');
    if(ui.config)ui.config.reducedMotion=store.settings.reducedMotion;go(settingsBack);
  }}catch(error){toast(error.message);}
});
document.addEventListener('input',event=>{
  if(screen==='editor'&&event.target.id==='level-name'){ui.editor.level.name=event.target.value;ui.editor.dirty=true;saveDraft();}
  if(screen==='pack-builder'&&event.target.id==='pack-title')ui.packDraft.title=event.target.value;
});
document.addEventListener('change',event=>{
  if(event.target.id==='pack-import'){importJSON(event.target.files[0]);event.target.value='';}
  if(screen==='editor'){
    const e=ui.editor,l=e.level;
    if(event.target.id==='level-name')render();
    if(event.target.id==='presentation')mutateEditor(l=>{l.presentation=event.target.value==='static'?{kind:'static',durationMs:Math.max(100,l.presentation.durationMs)}:{kind:'travel',durationMs:Math.max(300,l.presentation.durationMs),from:{x:1000,y:-450},to:{x:-1000,y:450}};});
    if(event.target.id==='view-duration'){const duration=Number(event.target.value);if(!Number.isInteger(duration)||duration<(l.presentation.kind==='travel'?300:100)||duration>10000){toast('Choose a viewing duration in the allowed range.');render();}else mutateEditor(l=>l.presentation.durationMs=duration);}
    if(event.target.id==='travel-direction')mutateEditor(l=>{const sign=event.target.value==='left'?1:-1;l.presentation.from={x:1000*sign,y:-450};l.presentation.to={x:-1000*sign,y:450};});
  }
});
overlay.addEventListener('click',event=>{
  if(screen!=='editor')return;const svg=event.target.closest('#editor-board');if(!svg)return;
  const boxTarget=event.target.closest('[data-box-id]'),cellTarget=event.target.closest('[data-cell]');
  if(boxTarget){const box=ui.editor.level.boxes.find(b=>b.id===boxTarget.dataset.boxId);if(ui.editor.tool==='delete')mutateEditor(l=>l.boxes=l.boxes.filter(b=>b.id!==box.id));else if(ui.editor.tool==='add')addBox(box.x,box.y,box.z+box.h,true);else{ui.editor.selected=box.id;render();}}
  else if(cellTarget&&ui.editor.tool==='add'){const[x,y]=cellTarget.dataset.cell.split(',').map(Number);addBox(x,y);}
});
document.addEventListener('keydown',event=>{
  if(event.isComposing)return;
  if(screen==='settings'&&ui.captureKey){event.preventDefault();const key=ui.captureKey;const candidate={...store.settings.bindings,[key]:event.code};
    if(!validBinding(event.code)){toast('Use a letter, number, arrow, space or numeric-pad key.');return;}
    if(!validBindings(candidate)){toast('That key is already used by another action.');return;}
    store.settings.bindings=candidate;ui.captureKey=null;persist('Control saved.');render();return;
  }
  if(event.code==='Escape'&&screen==='game'){event.preventDefault();pause();return;}
  if(!['game','checks'].includes(screen)||event.target.closest('input,select,textarea'))return;
  const bindings=store.settings.bindings,actions=[bindings.p1Count,bindings.p1Submit,bindings.p2Count,bindings.p2Submit],index=actions.indexOf(event.code);
  if(index<0||(ui.config.solo&&index>=2))return;event.preventDefault();if(event.repeat||held.has(event.code))return;held.add(event.code);audio.unlock();
  if(screen==='checks'){ui.checked[index]=true;render();}else input(index>=2?1:0,index%2===1);
});
document.addEventListener('keyup',event=>held.delete(event.code));
window.addEventListener('blur',()=>{held.clear();pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){held.clear();pause();}});

function render(){
  stage.dataset.screen=screen;stage.dataset.phase=engine?.phase??'';document.body.classList.toggle('is-playing',['game','paused'].includes(screen));
  nav.hidden=['game','paused','checks'].includes(screen);header.textContent=screen==='game'||screen==='paused'?`${engine.config.label.toUpperCase()} · ROUND ${engine.roundIndex+1}${engine.config.endless?'':` / ${engine.levels.length}`}${engine.assisted?' · ASSISTED':''}`:'TWO PLAYERS · ONE KEYBOARD';
  const uiResult=renderUI(context());const overlayKey=uiResult.cls+uiResult.html;if(overlayKey!==lastOverlay){overlay.className=`overlay ${uiResult.cls}`;overlay.innerHTML=uiResult.html;lastOverlay=overlayKey;}
  let svg;
  if(screen==='game'||screen==='paused')svg=gameSvg(engine,now(),store.settings.bindings,store.settings);
  else svg=`<rect width="1280" height="720" fill="#f7f7f7"/>${['menu','checks'].includes(screen)?`<g opacity=".17" transform="translate(310,20)">${boardSvg(pack?.levels[1]??{boxes:[],revealOrder:[]})}</g>`:''}`;
  if(svg!==lastScene){scene.innerHTML=svg;lastScene=svg;}
  const controls=screen==='game'?`${engine.phase==='answer'?`<div class="touch-player"><span>P1</span><button data-action="count" data-player="0" ${engine.submissions[0]?'disabled':''}>+1 <kbd>${esc(keyName(store.settings.bindings.p1Count))}</kbd></button><button data-action="submit" data-player="0" ${engine.submissions[0]?'disabled':''}>Done <kbd>${esc(keyName(store.settings.bindings.p1Submit))}</kbd></button></div>${engine.config.solo?'':`<div class="touch-player p2"><span>P2</span><button data-action="count" data-player="1" ${engine.submissions[1]?'disabled':''}>+1 <kbd>${esc(keyName(store.settings.bindings.p2Count))}</kbd></button><button data-action="submit" data-player="1" ${engine.submissions[1]?'disabled':''}>Done <kbd>${esc(keyName(store.settings.bindings.p2Submit))}</kbd></button></div>`}`:''}<div class="game-options"><button data-action="pause">Pause · Esc</button>${engine.config.endless?'<button data-action="finish-practice">Finish practice</button>':''}</div>`:'';
  if(controls!==lastControls){playControls.innerHTML=controls;lastControls=controls;}
}
function frame(time){
  if(screen==='game'){
    engine.update(time);
    for(const effect of engine.drainEffects())audio.cue(effect);
    let cue='';if(['matchCountdown','puzzleCountdown'].includes(engine.phase))cue=`${engine.roundIndex}|${engine.phase}|${Math.ceil((engine.deadline-time)/(engine.phase==='matchCountdown'||engine.roundIndex===0?1000:2000/3))}`;
    else if(engine.phase==='revealCounting')cue=`reveal|${engine.roundIndex}|${Math.floor((time-engine.phaseStartedAt)/rules.revealStepMs)}`;
    if(cue&&cue!==lastCue){audio.cue(cue.startsWith('reveal')?'reveal':'countdown');lastCue=cue;}
    if(engine.phase==='results'){finishHistory();go('results');}else render();
  }
  requestAnimationFrame(frame);
}
async function init(){
  try{const [p,r]=await Promise.all([fetch('./data/reference-pack.json'),fetch('./data/rules-profile.json')]);if(!p.ok||!r.ok)throw new Error('The level or rules file is unavailable.');pack=normalizePack(await p.json());rules=await r.json();audio.configure(store.settings);go('menu');if(storageWarning)toast(storageWarning);}
  catch(error){ui.error=error.message;go('error');}
  requestAnimationFrame(frame);
}
init();
