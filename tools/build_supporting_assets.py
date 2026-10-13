from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
def box(i,x,y,z=0,w=1,d=1,h=1): return dict(id=f'b{i}',x=x,y=y,z=z,w=w,d=d,h=h)
def units(coords): return [box(i+1,*p) for i,p in enumerate(coords)]
sets=[
 units([(1,2),(2,2),(3,0)]),
 units([(1,1),(2,1),(1,2),(2,2),(1,3),(4,1)]),
 units([(0,3,0),(0,3,1),(3,0,0),(3,0,1),(0,0,0)]),
 units([(0,1),(1,1),(2,1),(3,1),(1,2)]),
 [box(1,1,1,0,2,2,1),box(2,3,1),box(3,3,2),box(4,0,3)],
 units([(0,3,z) for z in range(4)]+[(3,0,z) for z in range(2)]+[(0,0)]),
 units([(x,y) for y in [0,3] for x in range(4)]),
 units([(1,1),(1,2),(2,1)]),
 units([(1,2),(2,2),(3,0),(3,1)]),
 units([(x,y) for y in range(5) for x in range(5) if (x,y)!=(2,2)])]
names=['Pair and singleton','Five and one','Short towers','Travelling branch','One broad box','Travelling towers','Two rows','Corner flash','Fast travelling groups','Missing center']
levels=[]
for i,(boxes,name) in enumerate(zip(sets,names),1):
 p={'kind':'static','durationMs':100 if i==8 else 250 if i==10 else 750}
 if i in [4,6,9]:
  p={'kind':'travel','durationMs':700 if i==9 else 1200,'from':{'x':-1050 if i==9 else 1050,'y':-520},'to':{'x':1050 if i==9 else -1050,'y':520}}
 levels.append({'id':f'ref-{i:02d}','name':name,'boardSize':5,'provenance':'Authored reconstruction of V3 category and count; coordinates and path are approximate.','boxes':boxes,'presentation':p,'revealOrder':[b['id'] for b in boxes]})
pack={'schemaVersion':1,'id':'reference-style-ten','title':'Reference style ten round pack','provenance':'Based on Hadski Gaming 2SR6dQM1BDc; not extracted original game data.','rulesProfile':'classic-observed-v1','levels':levels}
(root/'data/reference-pack.json').write_text(json.dumps(pack,indent=2)+'\n')
rules={'id':'classic-observed-v1','rounds':10,'mistakePenaltyMs':5000,'answerLimitMs':None,'counterMax':99,'initialCountdownStepMs':1000,'firstPuzzleCountdownStepMs':1000,'laterPuzzleCountdownStepMs':667,'preRevealMs':500,'revealStepMs':83.333333,'resultHoldMs':500,'endOverlayMs':2000,'tiePolicy':'equal rounded centisecond adjusted totals','countMetric':'box-entities','notes':'Penalty confirmed; durations are recording-based approximation defaults; tie, overflow, indefinite wait and pause policy are browser decisions.'}
(root/'data/rules-profile.json').write_text(json.dumps(rules,indent=2)+'\n')
# Editable SVG geometry targets, newly drawn rather than screenshots.
def screen(mode):
 s=['<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">','<rect width="1280" height="720" fill="#f7f7f7"/>']
 def text(x,y,t,size=42,anchor='middle',fill='#111',weight=400): s.append(f'<text x="{x}" y="{y}" font-family="Arial, sans-serif" font-size="{size}" font-weight="{weight}" text-anchor="{anchor}" fill="{fill}">{t}</text>')
 def proj(x,y,z=0):return (640+54*(x-y),310+31.18*(x+y)-62.35*z)
 def polygon(points,fill,stroke='#222',width=2):s.append('<polygon points="'+' '.join(f'{x:.2f},{y:.2f}' for x,y in points)+f'" fill="{fill}" stroke="{stroke}" stroke-width="{width}" stroke-linejoin="round"/>')
 text(640,95,'Try to count the boxes.' if mode=='watch' else 'How many boxes were there?')
 for i in range(6):
  for pts in [[proj(i,0),proj(i,5)],[proj(0,i),proj(5,i)]]:
   s.append('<path d="M '+' L '.join(f'{x:.2f} {y:.2f}' for x,y in pts)+'" stroke="#797979" fill="none" stroke-width="1" stroke-dasharray="1 3" stroke-linecap="round"/>')
 if mode!='answer':
  for b in sorted(sets[1],key=lambda b:(b['x']+b['y'],b['x'])):
   x,y,z,w,d,h=(b[k] for k in ['x','y','z','w','d','h']);top=z+h
   colors=['#25f34b','#0bcb38','#009a24'] if mode=='reveal' else ['#fff','#d9d9d9','#999']
   polygon([proj(x,y+d,z),proj(x+w,y+d,z),proj(x+w,y+d,top),proj(x,y+d,top)],colors[1])
   polygon([proj(x+w,y,z),proj(x+w,y+d,z),proj(x+w,y+d,top),proj(x+w,y,top)],colors[2])
   polygon([proj(x,y,top),proj(x+w,y,top),proj(x+w,y+d,top),proj(x,y+d,top)],colors[0])
 if mode=='reveal':text(640,200,'6',96,weight=600)
 opacity='0.08' if mode=='watch' else '1'
 s.append(f'<g opacity="{opacity}">')
 for side,accent in [('left','#28cadd'),('right','#f17869')]:
  x=18 if side=='left' else 1210
  s.append(f'<rect x="{x}" y="598" width="52" height="76" rx="10" fill="{accent}" stroke="#333" stroke-width="2"/>')
  text(x+26,645,'P1' if side=='left' else 'P2',24,weight=600)
  if mode=='reveal':
   tx=145 if side=='left' else 1130;text(tx,678,'6' if side=='left' else '7',112,weight=600)
  else:
   start=86 if side=='left' else 1002
   for j,ch in enumerate('05' if mode=='answer' and side=='left' else '00'):
    s.append(f'<rect x="{start+j*99}" y="552" width="94" height="132" fill="#929292"/>')
    text(start+j*99+47,664,ch,114,fill='#fff')
   lx=300 if side=='left' else 844
   text(lx,605,'Z  +1' if side=='left' else 'N  +1',25,'start')
   text(lx,656,'X  Done' if side=='left' else 'M  Done',25,'start')
 s.append('</g>')
 if mode=='reveal':
  s.append('<path d="M 98 642 L 135 679 L 209 601" fill="none" stroke="#65d34d" stroke-width="20"/>')
  s.append('<path d="M 1083 607 L 1168 686 M 1168 607 L 1083 686" fill="none" stroke="#ec5a56" stroke-width="20"/>')
 s.append('</svg>');return ''.join(s)
for mode in ['watch','answer','reveal']:(root/f'assets/visual-targets/{mode}.svg').write_text(screen(mode))
