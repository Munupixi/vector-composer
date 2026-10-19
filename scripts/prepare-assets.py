"""Mark existing Open Doodles paths as objects, without changing geometry."""
from pathlib import Path
import xml.etree.ElementTree as ET
import re

ROOT = Path(__file__).resolve().parents[1]
SVG_NS = "http://www.w3.org/2000/svg"
ET.register_namespace("", SVG_NS)
ET.register_namespace("xlink", "http://www.w3.org/1999/xlink")
tree = ET.parse(ROOT / "public/assets/originals/clumsy.svg")
paths = list(tree.getroot().iter(f"{{{SVG_NS}}}path"))
if len(paths) != 53:
    raise ValueError("Original asset changed; review the manual path mapping first.")
# Indices refer to the unchanged original, including the motion marks.
left_papers = {30, 31, 32, 33, 36, 38, 39, 41}
right_papers = {28, 29, 35, 40, 43}
for index, path in enumerate(paths):
    path.set("data-component", "papers-left" if index in left_papers else
             "papers-right" if index in right_papers else "character")
    path.set("id", f"clumsy-path-{index}")
destination = ROOT / "public/assets/prepared/clumsy.svg"
destination.parent.mkdir(parents=True, exist_ok=True)
tree.write(destination, encoding="utf-8", xml_declaration=True)
print(f"Prepared {len(paths)} original paths into 3 logical components.")

tree = ET.parse(ROOT / 'public/assets/originals/dog-jump.svg')
paths = list(tree.getroot().iter(f'{{{SVG_NS}}}path'))
if len(paths) != 74:
    raise ValueError('Dog source changed; review mapping.')
dog = {2, 3, 7, 8, 12, 13, 15, 20, 21, 22, 24, 32, 36, 40, 43, 61, 62, 63, 64, 65, 73}
for index, path in enumerate(paths):
    path.set('data-component', 'dog' if index in dog else 'motion' if index in {4, 5, 6} else 'runner')
    path.set('id', f'dog-jump-path-{index}')
# The original accent path contains four independent, closed M...Z contours.
# The last contour is the dog's tongue. Preserve its exact path commands.
accent = paths[0]
subpaths = [s for s in re.split(r'(?=M)', accent.get('d')) if s]
if len(subpaths) != 4 or not subpaths[-1].startswith('M473.952841'):
    raise ValueError('Accent subpaths changed; review tongue extraction.')
accent.set('d', ''.join(subpaths[:3]))
tongue = ET.Element(f'{{{SVG_NS}}}path', dict(accent.attrib))
tongue.set('d', subpaths[3])
tongue.set('id', 'dog-jump-tongue')
tongue.set('data-component', 'dog')
parent = next(n for n in tree.getroot().iter() if accent in list(n))
parent.insert(list(parent).index(accent) + 1, tongue)
tree.write(ROOT / 'public/assets/prepared/dog-jump.svg', encoding='utf-8', xml_declaration=True)
print('Prepared dog, runner and motion lines; original accent subpaths preserved.')

tree = ET.parse(ROOT / 'public/assets/originals/sitting-reading.svg')
paths = list(tree.getroot().iter(f'{{{SVG_NS}}}path'))
if len(paths) != 154:
    raise ValueError('Reading source changed; review mapping.')
single_book = {4, 31, 107, 115, 125, 151, 152, 153}
book_stack = {2, 3, 5, 7, 8, 9, 14, 19, 21, 25, 28, 32, 33, 35, 36, 37, 38, 41,
              44, 48, 51, 52, 108, 109, 110, 111, 112, 113, 114, 116, 117, 118,
              119, 120, 121, 122, 123, 124, 126, 127, 128, 129, 130, 131, 132,
              133, 134, 135, 136, 137, 138, 139}
for index, path in enumerate(paths):
    path.set('data-component', 'book' if index in single_book else 'books' if index in book_stack else 'reader')
    path.set('id', f'sitting-reading-path-{index}')
tree.write(ROOT / 'public/assets/prepared/sitting-reading.svg', encoding='utf-8', xml_declaration=True)
print('Prepared reader, book stack and single book.')
