#!/usr/bin/env python3
"""Package the unmodified Firefox source and validate userscript update metadata."""
from pathlib import Path
import json
import zipfile

ROOT = Path(__file__).resolve().parent.parent
source = (ROOT / 'BiliEditionSwitch.user.js').read_text(encoding='utf-8')
expected = source.split('// ==/UserScript==', 1)[0] + '// ==/UserScript==\n'
assert (ROOT / 'BiliEditionSwitch.meta.js').read_text(encoding='utf-8') == expected, 'Userscript metadata differs'
extension = ROOT / 'firefox'
manifest = json.loads((extension / 'manifest.json').read_text(encoding='utf-8'))
resources = manifest['background']['scripts'] + [manifest['options_ui']['page']] + list(manifest['icons'].values())
for name in resources:
    assert (extension / name).is_file(), name
dist = ROOT / 'dist'
dist.mkdir(exist_ok=True)
for suffix in ('AMO.zip', 'unsigned.xpi'):
    output = dist / f"BiliEditionSwitch-Firefox-v{manifest['version']}-{suffix}"
    with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(extension.rglob('*')):
            if path.is_file():
                info = zipfile.ZipInfo(path.relative_to(extension).as_posix(), date_time=(2026, 1, 1, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                info.external_attr = 0o100644 << 16
                archive.writestr(info, path.read_bytes())
    with zipfile.ZipFile(output) as archive:
        assert 'manifest.json' in archive.namelist()
        assert archive.testzip() is None
    print(output.relative_to(ROOT))
print('Userscript update metadata and Firefox package structure verified')
