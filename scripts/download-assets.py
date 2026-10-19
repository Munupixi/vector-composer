"""Download the fixed, CC0 Open Doodles collection. Not needed to run the app."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import urllib.request

DEST = Path(__file__).resolve().parents[1] / "public/assets/originals"
NAMES = ["clumsy", "levitate", "coffee", "reading", "roller-skating", "plant",
         "sitting-reading", "running", "groovy", "moshing", "ballet", "rolling",
         "meditating", "sitting", "dog-jump", "unboxing", "jumping", "selfie",
         "dancing", "strolling"]

def download(name):
    path = DEST / f"{name}.svg"
    if not path.exists():
        path.write_bytes(urllib.request.urlopen(
            f"https://opendoodles.s3-us-west-1.amazonaws.com/{name}.svg", timeout=30).read())
    return f"{name}: {path.stat().st_size} bytes"

if __name__ == "__main__":
    DEST.mkdir(parents=True, exist_ok=True)
    print("\n".join(ThreadPoolExecutor(max_workers=4).map(download, NAMES)))
