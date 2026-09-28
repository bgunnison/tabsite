"""Build the upload folder from the original tabs. Python standard library only."""
from pathlib import Path, PurePosixPath
from zipfile import ZipFile, ZIP_DEFLATED
from xml.etree import ElementTree as ET
import hashlib
import json
import re
import shutil
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'upload' / 'tabsite'
W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
A = '{http://schemas.openxmlformats.org/drawingml/2006/main}'
R = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}'
WP = '{http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing}'


def slug(text):
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')


def read_docx(path, media):
    blocks = []
    with ZipFile(path) as archive:
        root = ET.fromstring(archive.read('word/document.xml'))
        rels = ET.fromstring(archive.read('word/_rels/document.xml.rels'))
        targets = {r.attrib['Id']: r.attrib['Target'] for r in rels if r.get('TargetMode') != 'External'}
        for para in root.findall('.//' + W + 'body//' + W + 'p'):
            # Word's columns are layout tables: XML order is left cell, then right cell.
            text = ''
            images = []
            for node in para.iter():
                if node.tag == W + 't':
                    text += node.text or ''
                elif node.tag == W + 'tab':
                    text += '\t'
                elif node.tag in (W + 'br', W + 'cr'):
                    text += '\n'
                elif node.tag == W + 'drawing':
                    for blip in node.iter(A + 'blip'):
                        target = targets.get(blip.get(R + 'embed'))
                        if not target:
                            raise ValueError(f'Unresolved image in {path.name}')
                        target = str(PurePosixPath('word') / target) if not target.startswith('/') else target.lstrip('/')
                        data = archive.read(target)
                        ext = Path(target).suffix.lower()
                        if ext not in ('.png', '.jpg', '.jpeg', '.gif', '.svg'):
                            raise ValueError(f'Unsupported image {target}')
                        name = hashlib.sha256(data).hexdigest()[:16] + ext
                        (media / name).write_bytes(data)
                        extent = node.find('.//' + WP + 'extent')
                        props = node.find('.//' + WP + 'docPr')
                        width = round(int(extent.get('cx')) / 9525) if extent is not None else 600
                        height = round(int(extent.get('cy')) / 9525) if extent is not None else 0
                        images.append({'src': 'media/' + name, 'width': width, 'height': height,
                                       'alt': (props.get('descr') if props is not None else None) or 'Chord or tablature diagram from ' + path.stem})
            if text or not images:
                blocks.append({'type': 'text', 'text': text})
            if images:
                blocks.append({'type': 'images', 'images': images})
    return blocks


def normalize(blocks):
    """Preserve musical content and alignment; collapse excess blank layout paragraphs."""
    out = []
    blank_count = 0
    for block in blocks:
        if block['type'] == 'images':
            out.append(block)
            blank_count = 0
            continue
        for line in block['text'].replace('\r\n', '\n').replace('\r', '\n').split('\n'):
            line = line.expandtabs(8).rstrip()
            blank_count = blank_count + 1 if not line else 0
            if blank_count <= 2:
                out.append({'type': 'line', 'text': line})
    while out and out[0].get('text') == '':
        out.pop(0)
    while out and out[-1].get('text') == '':
        out.pop()
    return out


def build():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    media = OUTPUT / 'media'
    media.mkdir(exist_ok=True)
    metadata = json.loads((ROOT / 'metadata.json').read_text(encoding='utf-8'))
    songs = []
    ids = set()
    for path in sorted((ROOT / 'tabs').iterdir()):
        if path.suffix.lower() not in ('.docx', '.txt') or path.name.startswith('~$'):
            continue
        entry = metadata.get(path.name, [path.stem.replace('_', ' '), ''])
        title, artist = entry[:2]
        options = entry[2] if len(entry) > 2 else {}
        song_id = slug(title)
        if song_id in ids:
            song_id += '-' + hashlib.sha256(path.name.encode()).hexdigest()[:6]
        ids.add(song_id)
        if path.suffix.lower() == '.docx':
            blocks = read_docx(path, media)
        else:
            raw = path.read_bytes()
            try:
                text = raw.decode('utf-8-sig')
            except UnicodeDecodeError:
                text = raw.decode('cp1252')
            blocks = [{'type': 'text', 'text': text}]
        blocks = normalize(blocks)
        if not blocks:
            raise ValueError(f'Empty tab: {path.name}')
        # Only remove a reviewed, exact source heading. Never guess from lyric text.
        first_text = next((i for i, b in enumerate(blocks) if b['type'] == 'line' and b['text'].strip()), None)
        if first_text is not None and blocks[first_text]['text'] == options.get('sourceHeading'):
            blocks.pop(first_text)
            blocks = normalize(blocks)
        songs.append({'id': song_id, 'title': title, 'artist': artist, 'note': options.get('note', ''), 'source': path.name, 'blocks': blocks})
    songs.sort(key=lambda s: (s['title'].casefold(), s['artist'].casefold()))
    data = json.dumps(songs, ensure_ascii=False, separators=(',', ':'))
    (OUTPUT / 'library.js').write_text('window.TAB_LIBRARY = ' + data + ';\n', encoding='utf-8')
    for path in (ROOT / 'src').iterdir():
        if path.is_file():
            shutil.copyfile(path, OUTPUT / path.name)
    # Remove only stale generated media; preserve source documents and unrelated files.
    used = {image['src'].split('/')[-1] for s in songs for b in s['blocks'] if b['type'] == 'images' for image in b['images']}
    for path in media.iterdir():
        if path.name not in used and re.fullmatch(r'[a-f0-9]{16}\.(png|jpg|jpeg|gif|svg)', path.name):
            path.unlink()
    package = ROOT / 'tabsite-upload.zip'
    with ZipFile(package, 'w', ZIP_DEFLATED) as archive:
        for path in sorted(OUTPUT.rglob('*')):
            if path.is_file():
                archive.write(path, path.relative_to(OUTPUT.parent))
    print(f'Built {len(songs)} tabs with {len(used)} images in {OUTPUT}')
    print(f'Upload archive: {package}')


if __name__ == '__main__':
    build()
