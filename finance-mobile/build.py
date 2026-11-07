"""Produce the Android single-file release; Python is only needed to rebuild."""
from pathlib import Path
import re
import zipfile

BASE = Path(__file__).resolve().parent
SOURCE = BASE / 'src'
OUTPUT = BASE / 'dist'
OUTPUT.mkdir(exist_ok=True)
html = (SOURCE / 'index.html').read_text(encoding='utf-8')
css = (SOURCE / 'styles.css').read_text(encoding='utf-8')
html = re.sub(r'<link rel="stylesheet"[^>]+>', lambda _: '<style>\n' + css + '\n</style>', html)
html = re.sub(r'<script src="[^"]+" defer></script>', '', html)
scripts = [(SOURCE / name).read_text(encoding='utf-8') for name in ['engine.js', 'portable.js', 'app.js']]
bundle = '\n'.join(scripts)
bundle = re.sub(r'</script', r'<\\/script', bundle, flags=re.I)
html = html.replace('</body>', '<script>\n' + bundle + '\n</script></body>')
output = OUTPUT / '知账手机版.html'
output.write_text(html, encoding='utf-8')
guide = (BASE / '使用说明.txt').read_text(encoding='utf-8')
(OUTPUT / '使用说明.txt').write_text(guide, encoding='utf-8')
with zipfile.ZipFile(OUTPUT / '知账手机版-安卓离线包.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    archive.write(output, output.name)
    archive.writestr('使用说明.txt', guide.encode('utf-8'))
print(f'Built {output.name}: {output.stat().st_size:,} bytes, no runtime dependencies')
