export class GameAudio {
  constructor(){this.context=null;this.settings={sound:true,volume:.25};}
  configure(settings){this.settings=settings;}
  unlock(){try{this.context??=new (window.AudioContext||window.webkitAudioContext)();if(this.context.state==='suspended')this.context.resume().catch(()=>{});}catch{}}
  cue(kind){
    if(!this.settings.sound||this.settings.volume<=0||!this.context||this.context.state!=='running')return;
    const tones={count:[880,.035],submit:[440,.09],countdown:[540,.07],reveal:[700,.035],correct:[1050,.16],wrong:[180,.16],finish:[660,.23]};
    const [freq,length]=tones[kind]??tones.count;
    const osc=this.context.createOscillator(),gain=this.context.createGain(),start=this.context.currentTime;
    osc.type=kind==='count'?'sine':'triangle';osc.frequency.setValueAtTime(freq,start);gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(Math.max(.0001,this.settings.volume*.15),start+.008);gain.gain.exponentialRampToValueAtTime(.0001,start+length);
    osc.connect(gain);gain.connect(this.context.destination);osc.start(start);osc.stop(start+length+.01);
  }
}
