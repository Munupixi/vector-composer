"""Split provided Figma exports; preserve paths, paints and internal transforms verbatim.

Inputs are original SVG exports (Include id; Ignore overlapping layers OFF).
The optional bounds JSON is measured with scripts/measure-figma.html in a browser.
"""
from pathlib import Path
import copy, json, xml.etree.ElementTree as E

ROOT = Path(__file__).resolve().parents[1]
NS = 'http://www.w3.org/2000/svg'
E.register_namespace('', NS)
OBJECTS = {
    'book': ('Книга', 'Книга', 'Group 2136136335'),
    'phone': ('Телефон', 'Телефон', 'Телефон'),
    'puzzle': ('Пазлы', 'Пазлы', 'Пазлы'),
    'coin': ('Монета', 'Монета', 'Монета'),
    'headphones': ('Наушники', 'Наушники', 'Наушники'),
    'lamp': ('Лампа', 'Лампа', 'Лампа'),
    'folder': ('Папка', 'Папка', 'Group 2136136337'),
    'pen': ('Ручка', 'Ручка', 'Group 2136136336'),
    'wallet': ('Кошелёк', 'Кошелек', 'Кошелек'),
    'flowers': ('Цветы', 'Group 2136136344', 'Group 2136136345'),
}
BACKGROUND_S = {'book':'Group 2136136341', 'folder':'Group 2136136342', 'pen':'Group 2136136343', 'flowers':'Group 2136136346'}

def decoded(s):
    try: return s.encode('latin1').decode('utf8')
    except (UnicodeError, ValueError): return s

out = ROOT / 'public/assets/figma'; out.mkdir(exist_ok=True)
boundfile = out / 'bounds.json'
bounds = json.loads(boundfile.read_text()) if boundfile.exists() else {}
for size in ['L','S']:
    original = E.parse(ROOT / f'public/assets/figma-originals/{size}.svg').getroot()
    section = list(original)[1]
    groups = {decoded(n.get('id','')): n for n in section if n.tag == f'{{{NS}}}g'}
    for key, (title, large, small) in OBJECTS.items():
        name = large if size == 'L' else small
        for role in ['main','background']:
            groupname = name if role == 'main' else (
                ('Group 2136136347' if key == 'flowers' else name+'_2') if size == 'L'
                else BACKGROUND_S.get(key, name+'_2'))
            group = copy.deepcopy(groups[groupname])
            group.set('data-component','object')
            root = E.Element(f'{{{NS}}}svg', {'viewBox':original.get('viewBox'), 'fill':'none'})
            filekey = f'{key}-{size.lower()}-{role}'
            if filekey in bounds:
                x,y,w,h = bounds[filekey]
                root.set('viewBox',f'{x-4} {y-4} {w+8} {h+8}')
                root.set('width',str(w+8)); root.set('height',str(h+8))
            root.append(group)
            for defs in original.findall(f'{{{NS}}}defs'):root.append(copy.deepcopy(defs))
            E.ElementTree(root).write(out / (filekey+'.svg'),encoding='utf-8',xml_declaration=True)
print('Prepared',len(OBJECTS)*4,'original vector variants')
