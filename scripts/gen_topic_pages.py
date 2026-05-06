from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOPICS = [
    ("01", "training-roadmaps"),
    ("02", "cpp-4-competitions"),
    ("03", "newcomers"),
    ("04", "measuring-algorithms-performance"),
    ("05", "math"),
    ("06", "thinking-techniques"),
    ("07", "data-structures"),
    ("08", "search-techniques"),
    ("09", "string-processing"),
    ("10", "dynamic-programming"),
    ("11", "greedy-algorithms"),
    ("12", "graph-theory"),
    ("13", "practice-div2-a"),
    ("14", "practice-div2-b"),
    ("15", "contest-strategies"),
]
TEMPLATE = """<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>MSCP Topic</title>
<link rel="icon" type="image/png" href="../images/favicon.png">
<link rel="stylesheet" href="../assets/topic-page.css">
</head>
<body>
<div id="topic-root"></div>
<script>window.MSCP_TOPIC_ID="{tid}";</script>
<script src="../assets/topics-data.js"></script>
<script src="../assets/topic-page.js"></script>
</body>
</html>
"""

def main():
    pages_dir = ROOT / "pages"
    pages_dir.mkdir(parents=True, exist_ok=True)
    for tid, folder in TOPICS:
        (pages_dir / f"{folder}.html").write_text(TEMPLATE.format(tid=tid), encoding="utf-8")
        print(folder)

if __name__ == "__main__":
    main()
