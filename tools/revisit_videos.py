"""Re-extract the full-resolution frames used to trace the playable video pack."""
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[1]
folder = root / 'references/frames/revisit'
folder.mkdir(parents=True, exist_ok=True)
frames = [(324, 'round-01-watch'), (329, 'round-02-watch'), (336.1, 'round-03-watch'),
          (342.5, 'round-04-watch'), (349.25, 'round-04-reveal'), (351.95, 'round-05-watch'),
          (358.5, 'round-06-watch'), (366.7, 'round-07-watch'), (375.5, 'round-08-reveal'),
          (381.9, 'round-09-reveal'), (384.2, 'round-10-watch')]
for video, timestamp, name in [('2SR6dQM1BDc', t, name) for t, name in frames] + [
    ('JfkkS7yH4Co', 2.3, 'official1-watch'), ('9PZazcFJEvk', 2.3, 'official2-watch')]:
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-ss', str(timestamp),
                    '-i', str(root / f'references/videos/{video}.mp4'), '-frames:v', '1',
                    '-y', str(folder / f'{name}.png')], check=True)
print('Recreated 13 video-tracing evidence frames.')
