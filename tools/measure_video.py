import subprocess,numpy as np,json
from pathlib import Path
p='references/videos/2SR6dQM1BDc.mp4'
raw=subprocess.check_output(['ffmpeg','-hide_banner','-loglevel','error','-ss','320','-i',p,'-t','79','-vf','scale=320:180','-pix_fmt','rgb24','-f','rawvideo','-'])
a=np.frombuffer(raw,dtype=np.uint8).reshape(-1,180,320,3)
# Gray counter backgrounds, excluding white numerals where possible
left=a[:,141:143,24:26].mean((1,2,3))<200
right=a[:,141:143,267:269].mean((1,2,3))<200
for name,arr in [('p1 counter active',left),('p2 counter active',right)]:
 starts=np.flatnonzero(arr & ~np.r_[False,arr[:-1]])
 ends=np.flatnonzero(arr & ~np.r_[arr[1:],False])+1
 print(name, [(round(320+s/60,3),round(320+e/60,3)) for s,e in zip(starts,ends) if e-s>8])
# board gray side faces only: RGB nearly equal and darker than 210
roi=a[:,40:139,7:313]
gray=(roi.max(3)-roi.min(3)<12)&(roi.mean(3)<215)
counts=gray.sum((1,2)); np.savetxt('references/frames/board-dark-pixels.csv',np.c_[320+np.arange(len(a))/60,counts],delimiter=',',header='seconds,dark_pixels',comments='')
