"""Builds felix/index.html and everett/index.html from APPS below.
To add an app to a launcher: add a row, run `python3 launcher/build_launchers.py`, commit.
Each row: (folder, name, one-line blurb for Felix's page, who: 'felix'|'everett', icon file in that folder)."""
import json, html, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
APPS = [
 ("",                    "Word Lab",     "Homophones, palindromes, word origins and alphabets", "felix", "icon-180.png"),
 ("build-lab",           "Build Lab",    "Blueprints, rooms, maps and a whole city",            "felix", "icon-180.png"),
 ("orbit-lab",           "Orbit Lab",    "Space-station math and the Solar System Tour",        "felix", "apple-touch-icon.png"),
 ("logic-lab",           "Logic Lab",    "Clue grids, riddles and dragon games",                "felix", "apple-touch-icon.png"),
 ("gizmo-lab",           "Gizmo Lab",    "How machines work, room by room",                     "felix", "apple-touch-icon.png"),
 ("culture-lab",         "Culture Lab",  "Letters from nine pen pals around the world",         "felix", "apple-touch-icon.png"),
 ("history-lab",         "History Lab",  "The museum after dark and its Night Cases",           "felix", "apple-touch-icon.png"),
 ("data-lab",            "Data Lab",     "Count it, chart it, catch the sneaky graphs",         "felix", "apple-touch-icon.png"),
 ("time-lab",            "Time Lab",     "Clocks, sundials, the Moon and deep time",            "felix", "apple-touch-icon.png"),
 ("wild-lab",            "Wild Lab",     "The tree of life in the Seven Domes",                 "felix", "apple-touch-icon.png"),
 ("science-exploration", "Science Lab",  "Rocks and minerals at Base Camp Ridge",               "felix", "apple-touch-icon.png"),
 ("body-lab",            "Body Lab",     "A road trip through the human body",                  "felix", "apple-touch-icon.png"),
 ("chess-lab",           "Chess Lab",    "Chess ideas to play with Dad",                        "felix", "apple-touch-icon.png"),
 ("vroom-garage",        "Vroom Garage", "", "everett", "apple-touch-icon.png"),
 ("dino-world",          "Dino World",   "", "everett", "apple-touch-icon.png"),
 ("everetts-observatory","Observatory",  "", "everett", "apple-touch-icon.png"),
 ("vehicle-lot",         "Vehicle Lot",  "", "everett", "apple-touch-icon.png"),
]
for f, n, b, w, i in APPS:
    assert (ROOT / f / i).exists(), f"missing icon {f}/{i}"
    assert (ROOT / f / "index.html").exists(), f"missing app {f}"
apps = [dict(id=f or "word-lab", href=f"../{f}/" if f else "../", icon=f"../{f}/{i}" if f else f"../{i}", name=n, blurb=b, who=w) for f, n, b, w, i in APPS]
TPL = (ROOT / "launcher" / "template.html").read_text()
for who, title, short in [("felix", "Felix's Apps", "Felix"), ("everett", "Everett's Apps", "Everett")]:
    out = TPL.replace("__WHO__", who).replace("__TITLE__", html.escape(title)).replace("__SHORT__", short)
    out = out.replace("__APPS__", json.dumps(apps, ensure_ascii=False))
    d = ROOT / who; d.mkdir(exist_ok=True)
    (d / "index.html").write_text(out)
    print("wrote", d / "index.html", sum(a["who"] == who for a in apps), "apps")
