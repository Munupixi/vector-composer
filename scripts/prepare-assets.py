"""Mark existing Open Doodles paths as objects, without changing geometry."""
from pathlib import Path
import xml.etree.ElementTree as ET

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
