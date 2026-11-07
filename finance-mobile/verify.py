from pathlib import Path
from html.parser import HTMLParser
import zipfile
import re

BASE = Path(__file__).resolve().parent
FILE = BASE / 'dist' / '知账手机版.html'

class Check(HTMLParser):
    def __init__(self):
        super().__init__()
        self.scripts = 0
        self.styles = 0
        self.ids = set()
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if 'id' in a:
            assert a['id'] not in self.ids, f'Duplicate element ID: {a["id"]}'
            self.ids.add(a['id'])
        if tag == 'script':
            self.scripts += 1
            assert 'src' not in a, 'External script dependency'
        if tag == 'style':
            self.styles += 1
        assert tag not in {'iframe','object','embed'}, f'Embedded external content: {tag}'
        assert not (tag == 'link' and a.get('rel') in {'stylesheet','preload','modulepreload','manifest'}), 'External resource dependency'

html = FILE.read_text(encoding='utf-8')
check = Check()
check.feed(html)
assert check.scripts == check.styles == 1
assert not re.search(r'@import|url\(\s*[\'"]?https?://', html, re.I)
assert "connect-src &#39;none&#39;" in html
assert {'businessForm','importCases','backupFile','manualCopy','quiz','cases'} <= check.ids
with zipfile.ZipFile(BASE / 'dist' / '知账手机版-安卓离线包.zip') as archive:
    assert set(archive.namelist()) == {'知账手机版.html','使用说明.txt'}
    assert archive.read('知账手机版.html') == FILE.read_bytes()
print(f'PASS: single inline script and stylesheet; no runtime remote resources; {len(check.ids)} unique IDs; ZIP matches HTML')
