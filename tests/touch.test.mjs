import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {phoneControls,TouchContacts,phoneButtonState} from '../dist/touch.js';
import {GameEngine} from '../dist/engine.js';
import {defaultStore,loadStore} from '../dist/storage.js';
import {renderUI} from '../dist/ui.js';
const pack=JSON.parse(readFileSync(new URL('../data/reference-pack.json',import.meta.url))),rules=JSON.parse(readFileSync(new URL('../data/rules-profile.json',import.meta.url)));
test('phones switch to touch controls in portrait and landscape, with an explicit override',()=>{
 assert.equal(phoneControls({width:390,height:844,coarse:true,touchPoints:5}),true);
 assert.equal(phoneControls({width:844,height:390,coarse:true,touchPoints:5}),true);
 assert.equal(phoneControls({width:1440,height:900,coarse:false,touchPoints:0}),false);
 assert.equal(phoneControls({width:390,height:844,coarse:false}),true);
 assert.equal(phoneControls({width:1024,height:768,coarse:true},'touch'),true);
 assert.equal(phoneControls({width:390,height:844,coarse:true},'keyboard'),false);
});
test('holding one contact never repeats, while a second finger can count and submit independently',()=>{
 const contacts=new TouchContacts();assert.equal(contacts.begin(7),true);assert.equal(contacts.begin(7),false);assert.equal(contacts.begin(8),true);
 contacts.end(7);assert.equal(contacts.begin(7),true);contacts.clear();assert.equal(contacts.begin(8),true);
});
test('phone buttons ignore previews, lock one player, and reveal correct/incorrect feedback',()=>{
 const e=new GameEngine({levels:[pack.levels[0]],solo:false,source:'authored'},rules);e.start(0);e.update(3000);e.update(6000);
 assert.equal(phoneButtonState(e,0).disabled,true);assert.equal(e.count(0,6200),false);e.update(6750);assert.equal(phoneButtonState(e,0).disabled,false);
 for(let i=0;i<3;i++)e.count(0,6800+i);e.submit(0,7000);assert.equal(phoneButtonState(e,0).count,'03');assert.equal(phoneButtonState(e,0).disabled,true);assert.equal(phoneButtonState(e,1).disabled,false);assert.equal(phoneButtonState(e,0).feedback,'');
 e.submit(1,7200);e.update(e.deadline);e.update(e.deadline);assert.equal(phoneButtonState(e,0).feedback,'correct');assert.equal(phoneButtonState(e,1).feedback,'wrong');
});
test('touch-only control checks can reach Start without any keyboard actions',()=>{
 const store=defaultStore(),ui={touch:true,config:{solo:false,label:'Touch test'},checked:[false,false,false,false]},context={screen:'checks',store,ui,pack};
 const before=renderUI(context).html;assert.match(before,/Check your buttons/);assert.equal((before.match(/data-touch-action=/g)||[]).length,4);assert.match(before,/data-action="start" disabled/);
 ui.checked=[true,true,true,true];assert.doesNotMatch(renderUI(context).html,/data-action="start" disabled/);
 ui.config.solo=true;assert.equal((renderUI(context).html.match(/data-touch-action=/g)||[]).length,2);
});
test('phone settings survive reload and existing saved settings default to automatic detection',()=>{
 const data=defaultStore();data.settings.inputMode='touch';assert.equal(loadStore({getItem:()=>JSON.stringify(data)}).data.settings.inputMode,'touch');delete data.settings.inputMode;assert.equal(loadStore({getItem:()=>JSON.stringify(data)}).data.settings.inputMode,'auto');
});
