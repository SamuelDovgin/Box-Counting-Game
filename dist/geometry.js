// The renderer and fairness validator use exactly the same camera and polygons.
export const project=(x,y,z=0)=>[54*(x-y),31.18*(x+y)-62.35*z];
export function boxFaces(b){
  const {x,y,z,w,d,h}=b,t=z+h;
  return [
    [project(x,y+d,z),project(x+w,y+d,z),project(x+w,y+d,t),project(x,y+d,t)],
    [project(x+w,y,z),project(x+w,y+d,z),project(x+w,y+d,t),project(x+w,y,t)],
    [project(x,y,t),project(x+w,y,t),project(x+w,y+d,t),project(x,y+d,t)],
  ];
}
const cross=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
const signedArea=p=>p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0)/2;
const bounds=p=>({left:Math.min(...p.map(v=>v[0])),right:Math.max(...p.map(v=>v[0])),top:Math.min(...p.map(v=>v[1])),bottom:Math.max(...p.map(v=>v[1]))});
function overlappingBounds(a,b){return a.left<b.right-.001&&a.right>b.left+.001&&a.top<b.bottom-.001&&a.bottom>b.top+.001;}
export function intersectionArea(subject,clip){
  if(!overlappingBounds(bounds(subject),bounds(clip)))return 0;
  let out=subject;const sign=Math.sign(signedArea(clip));
  for(let i=0;i<clip.length&&out.length;i++){
    const a=clip[i],b=clip[(i+1)%clip.length],input=out;out=[];
    for(let j=0;j<input.length;j++){
      const p=input[j],q=input[(j+1)%input.length],cp=cross(a,b,p)*sign,cq=cross(a,b,q)*sign;
      if(cp>=-1e-7)out.push(p);
      if((cp>=0)!==(cq>=0)){const t=cp/(cp-cq);out.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t]);}
    }
  }
  return out.length>2?Math.abs(signedArea(out)):0;
}
function projectedBoxes(boxes){return boxes.map(box=>{const faces=boxFaces(box);return {box,faces,bounds:bounds(faces.flat())};});}
export function paintOrder(boxes){
  const items=projectedBoxes(boxes),edges=items.map(()=>[]),incoming=items.map(()=>0);
  for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
    const a=items[i],b=items[j];if(!overlappingBounds(a.bounds,b.bounds)||!a.faces.some(f=>b.faces.some(g=>intersectionArea(f,g)>.01)))continue;
    const behind=(a,b)=>a.x+a.w<=b.x||a.y+a.d<=b.y||a.z+a.h<=b.z;
    const ab=behind(a.box,b.box),ba=behind(b.box,a.box);
    if(ab===ba)continue;const from=ab?i:j,to=ab?j:i;edges[from].push(to);incoming[to]++;
  }
  const ready=items.map((_,i)=>i).filter(i=>!incoming[i]),ordered=[];
  const depth=b=>b.x+b.y+b.z;
  while(ready.length){ready.sort((a,b)=>depth(items[a].box)-depth(items[b].box)||items[a].box.id.localeCompare(items[b].box.id));const i=ready.shift();ordered.push(items[i]);for(const j of edges[i])if(!--incoming[j])ready.push(j);}
  const cyclic=ordered.length!==items.length;
  if(cyclic)for(const item of items)if(!ordered.includes(item))ordered.push(item);
  return {items:ordered,cyclic};
}
export function visibilityReport(level){
  const {items,cyclic}=paintOrder(level.boxes);
  const reports=items.map((item,i)=>{
    const occluders=items.slice(i+1).filter(other=>overlappingBounds(item.bounds,other.bounds));
    const clearFaces=item.faces.filter(face=>!occluders.some(other=>other.faces.some(f=>intersectionArea(face,f)>.01))).length;
    return {id:item.box.id,clearFaces,visible:clearFaces>0};
  });
  return {valid:!cyclic&&reports.every(r=>r.visible),cyclic,boxes:reports,hidden:reports.filter(r=>!r.visible).map(r=>r.id)};
}
export function boardLayout(level){
  const points=[project(0,0),project(5,0),project(0,5),project(5,5)];
  for(const b of level.boxes)points.push(...boxFaces(b).flat());
  const bb=bounds(points),minY=bb.top,maxY=bb.bottom;
  if(/^(ref-\d{2}|video-official-[12])$/.test(level.id))return {scale:1,x:640,y:312,minY,maxY};
  const scale=Math.min(1,740/(bb.right-bb.left||1),400/(maxY-minY||1));
  return {scale,x:640-(bb.left+bb.right)/2*scale,y:420-(minY+maxY)/2*scale,minY,maxY};
}
// Common visible canvas area on desktop and the cropped phone canvas.
const VIEW={left:240,right:1040,top:145,bottom:645};
export const MIN_VISIBLE_MS=80;
export function motionExposure(level){
  const layout=boardLayout(level),p=level.presentation;
  const boxes=level.boxes.map(b=>{
    const bb=bounds(boxFaces(b).flat());let low=0,high=1;
    for(const [axis,min,max,origin,rectMin,rectMax] of [['x','left','right',layout.x,VIEW.left,VIEW.right],['y','top','bottom',layout.y,VIEW.top,VIEW.bottom]]){
      const a=bb[min]*layout.scale+origin,b=bb[max]*layout.scale+origin;
      const from=p.kind==='travel'?p.from[axis]:0,to=p.kind==='travel'?p.to[axis]:0,delta=to-from;
      if(Math.abs(delta)<1e-9){if(a+from<rectMin-.01||b+from>rectMax+.01)high=-1;}
      else {let lo=(rectMin-a-from)/delta,hi=(rectMax-b-from)/delta;if(delta<0)[lo,hi]=[hi,lo];low=Math.max(low,lo);high=Math.min(high,hi);}
    }
    const fraction=Math.max(0,high-low);return {id:b.id,fraction,visibleMs:fraction*p.durationMs};
  });
  return {valid:boxes.every(b=>b.fraction>0&&(p.kind!=='travel'||b.visibleMs>=MIN_VISIBLE_MS-.01)),minimumDurationMs:boxes.length?Math.ceil(MIN_VISIBLE_MS/Math.min(...boxes.map(b=>b.fraction))):300,boxes};
}
