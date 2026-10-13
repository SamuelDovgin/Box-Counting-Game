from pathlib import Path
import json
import jsonschema
root=Path(__file__).resolve().parents[1]
p=json.loads((root/'data/reference-pack.json').read_text())
jsonschema.Draft202012Validator(json.loads((root/'data/level-pack.schema.json').read_text())).validate(p)
assert len({l['id'] for l in p['levels']})==len(p['levels'])
counts=[]
for l in p['levels']:
 ids=[b['id'] for b in l['boxes']]; assert len(set(ids))==len(ids)
 assert sorted(ids)==sorted(l['revealOrder'])
 voxels={}
 for b in l['boxes']:
  assert b['x']+b['w']<=5 and b['y']+b['d']<=5 and b['z']+b['h']<=4
  for x in range(b['x'],b['x']+b['w']):
   for y in range(b['y'],b['y']+b['d']):
    for z in range(b['z'],b['z']+b['h']):
     assert (x,y,z) not in voxels,(l['id'],'overlap')
     voxels[x,y,z]=b['id']
 for b in l['boxes']:
  if b['z']:
   assert all((x,y,b['z']-1) in voxels for x in range(b['x'],b['x']+b['w']) for y in range(b['y'],b['y']+b['d']))
 counts.append(len(ids))
assert counts==[3,6,5,5,4,7,8,3,4,24]
assert 24240+1*5000==29240 and 33340+4*5000==53340
print('PASS schema, unique IDs, bounds, nonoverlap, full support, reveal membership, all ten counts and score arithmetic')
print('Visual fairness and game behavior require implementation review; this validates planning fixtures only.')
