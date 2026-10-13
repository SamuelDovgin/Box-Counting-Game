export function phoneControls({width,height,coarse=false,touchPoints=0},mode='auto'){
  if(mode==='touch')return true;
  if(mode==='keyboard')return false;
  return width<=600||(Math.min(width,height)<=700&&(coarse||touchPoints>0));
}

// One action per contact, including when several fingers are down together.
export class TouchContacts {
  constructor(){this.active=new Set();}
  begin(pointerId){if(this.active.has(pointerId))return false;this.active.add(pointerId);return true;}
  end(pointerId){this.active.delete(pointerId);}
  clear(){this.active.clear();}
}

export function phoneButtonState(engine,player){
  const submitted=engine.submissions[player];
  const revealed=['resultHold','matchEnd'].includes(engine.phase)&&!!submitted;
  const feedback=revealed?(submitted.guess===engine.current.boxes.length?'correct':'wrong'):'';
  return {disabled:engine.paused||engine.phase!=='answer'||!!submitted,count:submitted?.timeout?'—':String(submitted?.guess??engine.guesses[player]).padStart(2,'0'),feedback,status:revealed?(feedback==='correct'?'Correct ✓':submitted.timeout?'No answer ✕':'Wrong ✕'):submitted?'Answer locked':engine.phase==='answer'?'Tap once per box':['matchCountdown','puzzleCountdown','watch'].includes(engine.phase)?'Watch first':'See the result'};
}
