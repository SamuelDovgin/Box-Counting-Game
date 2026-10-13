import {clone,correctAnswer,mirrorLevel,soloSummary,scoreMatch,levelSignature} from './core.js';
import {generateLevel,familyForLevel} from './generator.js';
export class GameEngine {
  constructor(config,rules){
    this.config=clone(config);this.rules=rules;this.levels=clone(config.levels??[]);this.roundIndex=0;this.rounds=[];this.voided=0;
    this.phase='idle';this.paused=false;this.phaseStartedAt=0;this.deadline=Infinity;this.answerOpenedAt=0;
    this.guesses=[0,0];this.submissions=[null,null];this.current=null;this.effects=[];this.assisted=!!config.assisted;this.recorded=false;
  }
  phaseTo(phase,duration=Infinity,now=0){this.phase=phase;this.phaseStartedAt=now;this.deadline=Number.isFinite(duration)?now+duration:Infinity;}
  start(now){this.phaseTo('matchCountdown',3000,now);}
  resetRound(now){
    this.guesses=[0,0];this.submissions=[null,null];
    if(!this.current){this.current=this.config.endless?generateLevel(this.config.seed,this.roundIndex,this.config.difficulty,this.config.family):clone(this.levels[this.roundIndex]);}
    if(this.config.previewMs)this.current.presentation.durationMs=this.config.previewMs;
    if(this.config.reducedMotion&&this.current.presentation.kind==='travel'){this.current.presentation={kind:'static',durationMs:Math.max(1000,this.current.presentation.durationMs)};this.assisted=true;}
    this.phaseTo('puzzleCountdown',this.roundIndex===0?3000:2000,now);
  }
  update(now){
    if(this.paused||now<this.deadline)return;
    switch(this.phase){
      case 'matchCountdown':this.resetRound(now);break;
      case 'puzzleCountdown':this.phaseTo('watch',this.current.presentation.durationMs,now);break;
      case 'watch':this.answerOpenedAt=now;this.phaseTo('answer',this.config.answerLimitMs||Infinity,now);break;
      case 'answer':
        for(let i=0;i<(this.config.solo?1:2);i++)if(!this.submissions[i])this.submissions[i]={guess:null,elapsedMs:this.config.answerLimitMs,timeout:true};
        this.settle(now);break;
      case 'preReveal':this.phaseTo('revealCounting',correctAnswer(this.current)*this.rules.revealStepMs,now);break;
      case 'revealCounting':this.phaseTo('resultHold',900,now);this.effects.push(this.submissions[0]?.guess===correctAnswer(this.current)?'correct':'wrong');break;
      case 'resultHold':
        if(this.config.endless||this.roundIndex+1<this.levels.length){this.roundIndex++;this.current=null;this.resetRound(now);}
        else this.phaseTo('matchEnd',this.rules.endOverlayMs,now);break;
      case 'matchEnd':this.phaseTo('results',Infinity,now);this.effects.push('finish');break;
    }
  }
  count(player,now){this.update(now);if(this.paused||this.phase!=='answer'||this.submissions[player]||(this.config.solo&&player===1))return false;this.guesses[player]=Math.min(99,this.guesses[player]+1);this.effects.push('count');return true;}
  submit(player,now){
    this.update(now);if(this.paused||this.phase!=='answer'||this.submissions[player]||(this.config.solo&&player===1))return false;
    this.submissions[player]={guess:this.guesses[player],elapsedMs:Math.max(0,now-this.answerOpenedAt),timeout:false};this.effects.push('submit');
    if(this.config.solo||this.submissions.every(Boolean))this.settle(now);return true;
  }
  settle(now){
    if(this.phase!=='answer')return;
    this.rounds.push({round:this.roundIndex+1,levelId:this.current.id,level:clone(this.current),answer:correctAnswer(this.current),players:[this.submissions[0],this.submissions[1]??{guess:null,elapsedMs:0,timeout:false}]});
    this.phaseTo('preReveal',this.rules.preRevealMs,now);
  }
  pause(now){if(this.paused||['idle','results'].includes(this.phase))return;this.paused=true;this.pauseInfo={phase:this.phase,elapsed:now-this.phaseStartedAt,remaining:this.deadline-now};}
  resume(now){
    if(!this.paused)return;this.paused=false;
    if(['puzzleCountdown','watch','answer'].includes(this.pauseInfo.phase)){
      this.voided++;
      if(this.config.source==='authored'){this.current=mirrorLevel(this.current);this.assisted=true;}
      else{
        const old=levelSignature(this.current),family=familyForLevel(this.current);let fresh;
        for(let a=0;a<100;a++){fresh=generateLevel(`${this.config.seed}|reserve|${this.voided}|${a}`,this.roundIndex,this.config.difficulty??'standard',family);if(levelSignature(fresh)!==old)break;}
        this.current=fresh;
      }
      this.resetRound(now);
    }else{this.phase=this.pauseInfo.phase;this.phaseStartedAt=now-this.pauseInfo.elapsed;this.deadline=Number.isFinite(this.pauseInfo.remaining)?now+Math.max(0,this.pauseInfo.remaining):Infinity;}
  }
  finishPractice(now){if(!this.config.endless)return;this.paused=false;this.phaseTo('matchEnd',600,now);}
  result(){return this.config.solo?soloSummary(this.rounds):scoreMatch(this.rounds,this.rules.mistakePenaltyMs);}
  drainEffects(){return this.effects.splice(0);}
}
