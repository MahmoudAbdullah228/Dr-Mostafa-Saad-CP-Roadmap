# -*- coding: utf-8 -*-
"""
Fetch the main Google Sheet tab (~900+ problems), dedupe by problem code,
assign each problem to exactly ONE roadmap topic (01–15).
"""
from __future__ import annotations

import csv
import io
import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_PATH = ROOT / "assets" / "topics-data.js"

SHEET_ID = "1iJZWP2nS_OB3kCTjq8L6TrJJ4o-5lhxDOyTaocSYc-k"
# Main CF-A..D3 blind-order tab (largest)
PRIMARY_GID = "855203541"
# Optional extra tabs to merge only NEW codes (no duplicate across site)
EXTRA_GIDS: list[str] = ["111761178"]

TOPIC_TAG = {
    "01": "roadmap",
    "02": "cpp",
    "03": "intro",
    "04": "complexity",
    "05": "math",
    "06": "thinking",
    "07": "data-structures",
    "08": "search",
    "09": "strings",
    "10": "dp",
    "11": "greedy",
    "12": "graphs",
    "13": "div2-a",
    "14": "div2-b",
    "15": "contest",
}


def fetch_csv(gid: str) -> str:
    url = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/export?format=csv&gid={gid}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 MSCP-build"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return r.read().decode("utf-8", errors="replace")


def cf_url(code: str) -> str | None:
    code = code.strip()
    m = re.match(r"CF(\d+)-D\d+-([A-Z]\d?)", code, re.I)
    if m:
        return f"https://codeforces.com/contest/{m.group(1)}/problem/{m.group(2)}"
    return None


def timus_url(code: str) -> str | None:
    m = re.search(r"(\d+)", code.replace("TIMUS", "").strip())
    if m:
        return f"https://acm.timus.ru/problem.aspx?num={m.group(1)}"
    return None


def spoj_url(code: str) -> str | None:
    m = re.match(r"SPOJ\s+(\w+)", code.strip(), re.I)
    if m:
        return f"https://www.spoj.com/problems/{m.group(1)}/"
    return None


def uva_search_url(num: str) -> str:
    return f"https://www.google.com/search?q=UVa+Online+Judge+problem+{num}"


def problem_url(code: str) -> tuple[str, str]:
    c = code.strip()
    if not c or ("Video Solution" in c and "CF" not in c.upper()):
        return "", "?"
    if cf_url(c):
        return cf_url(c), "CF"
    if re.search(r"UVA\s*\d+", c, re.I):
        num = re.search(r"(\d+)", c).group(1)
        return uva_search_url(num), "UVA"
    if "TIMUS" in c.upper():
        u = timus_url(c)
        return (u or "#", "TIMUS")
    if "SPOJ" in c.upper():
        u = spoj_url(c)
        return (u or "#", "SPOJ")
    if "LIVEARCHIVE" in c.upper():
        return uva_search_url(c), "LA"
    return "#", "?"


def letter_difficulty(code: str) -> str:
    m = re.search(r"-([A-Z])(\d?)$", code.upper())
    if not m:
        return "medium"
    letter = m.group(1)
    if letter == "A":
        return "easy"
    if letter == "B":
        return "medium"
    if letter == "C":
        return "hard"
    return "hard"


def cf_letter(code: str) -> str:
    m = re.search(r"-([A-Z])(\d?)$", code.upper())
    return m.group(1) if m else "B"


def stable_id(name: str, code: str) -> str:
    s = re.sub(r"[^\w\-]+", "-", f"{name}-{code}".lower())
    return re.sub(r"-+", "-", s).strip("-")[:96] or "p"


def normalize_code_key(code: str) -> str:
    return re.sub(r"\s+", "", code.strip().upper())


def pick_column(header: list[str], needles_ordered: list[str]) -> int | None:
    """First matching needle wins (needles must be ordered most specific → generic)."""
    low = [re.sub(r"\s+", " ", (h or "").replace("\n", " ").strip().lower()) for h in header]
    for needle in needles_ordered:
        for i, h in enumerate(low):
            if needle in h:
                return i
    return None


def assign_topic(
    code: str, category: str, sheet_level: float, train_level: float | None
) -> str:
    """Exactly one topic id per problem — deterministic rules."""
    cat = (category or "").lower()
    letter = cf_letter(code)
    tl = train_level if train_level is not None and train_level > 0 else None

    # ── Roadmap / contest / intro (keywords) ────────────────────────
    if re.search(r"contest strategy|time management|psychology|icpc meta", cat):
        return "15"
    if re.search(r"big[- ]?o|complexity analysis|asymptotic", cat):
        return "04"
    if re.search(r"\bstl\b|std::|iterator|template metaprogram", cat):
        return "02"
    if (
        letter == "A"
        and tl is not None
        and tl <= 0.7
        and re.search(r"adhoc|implementation|simulation|constructive|greedy, na", cat)
    ):
        return "03"
    if re.search(r"roadmap|overview|training plan|how to study", cat):
        return "01"

    # ── Keyword buckets (order matters) ─────────────────────────────
    if re.search(r"\bdp\b|dynamic\s*prog", cat):
        return "10"
    if "segment tree" in cat or "fenwick" in cat or "fenwik" in cat:
        return "07"
    if "sparse table" in cat or "sqrt decomposition" in cat:
        return "07"
    if re.search(r"\bdsu\b|disjoint\s*set|union[- ]find", cat):
        return "07"
    if "lazy propagation" in cat:
        return "07"

    if re.search(
        r"\bgraph\b|shortest path|\bbfs\b|\bdfs\b|topological|bridge|cut\b|flow\b|\bmst\b|dijkstra|bellman",
        cat,
    ):
        return "12"

    if re.search(r"\bstring\b|\bkmp\b|hashing|\bz[- ]?algo|suffix\s*array|\btrie\b", cat):
        return "09"

    if "greedy" in cat:
        return "11"

    if re.search(r"number theory|combinator|\bgcd\b|\blcm\b|prime|modular|fft\b", cat):
        return "05"

    if re.search(r"binary search|ternary search|two pointers|meet in the middle", cat):
        return "08"

    if re.search(r"geometry|coordinate|convex hull", cat):
        return "08"

    if re.search(r"stack\b|queue\b|heap\b|priority queue|monotonic stack", cat):
        return "07"

    # ── Intro / complexity cues ──
    if re.search(r"complexity|time limit|time complexity", cat):
        return "04"

    # ── Thinking vs massive practice pool ──
    if re.search(r"adhoc|constructive|implementation|simulation|brute", cat):
        if letter == "A":
            return "13"
        if letter == "B":
            return "06"
        return "14"

    # ── Letter fallback (CF ladder) ──
    if letter == "A":
        return "13"
    if letter == "B":
        return "14"
    if letter == "C":
        if sheet_level >= 7:
            return "11"
        return "14"
    # D / E / ...
    return "14"


def build_tags(tid: str, cat: str, code: str) -> list[str]:
    tags: list[str] = []
    tt = TOPIC_TAG.get(tid)
    if tt:
        tags.append(tt)
    cu = (code or "").upper()
    if "CF" in cu:
        tags.append("Codeforces")
        if "D2-A" in cu or cu.endswith("A"):
            tags.append("Div2 A")
        elif "D2-B" in cu or cu.endswith("B"):
            tags.append("Div2 B")
        elif "D2-C" in cu or cu.endswith("C"):
            tags.append("Div2 C")
        elif re.search(r"-D\d?$", cu):
            tags.append("Div2 D+")
    for piece in re.split(r"[,;/]", cat or ""):
        p = piece.strip()
        if p and len(p) < 40 and p.lower() not in ("na", "n/a"):
            tags.append(p)
    seen: set[str] = set()
    out: list[str] = []
    for t in tags:
        low = t.lower()
        if low not in seen:
            seen.add(low)
            out.append(t)
    return out[:8]


def parse_tab(csv_text: str, default_cols: dict[str, int] | None) -> tuple[list[list[str]], dict[str, int]]:
    rows = list(csv.reader(io.StringIO(csv_text)))
    header_idx = None
    for i, r in enumerate(rows[:25]):
        if not r:
            continue
        joined = " ".join(r).lower()
        if "problem code" in joined:
            header_idx = i
            break
    if header_idx is None:
        return rows, default_cols or {}

    header = rows[header_idx]
    idx_name = pick_column(header, ["ff", "problem name"]) or 0
    idx_code = pick_column(header, ["problem code"]) or 1
    idx_level = pick_column(header, ["problem level"]) or 9
    idx_cat = pick_column(header, ["mostafa category", "category"]) or 13

    idx_train: int | None = None
    for i, h in enumerate(header):
        t = re.sub(r"\s+", " ", (h or "").replace("\n", " ")).strip().lower()
        if t == "level":
            idx_train = i
            break

    cols = {"name": idx_name, "code": idx_code, "level": idx_level, "category": idx_cat, "train": idx_train}
    return rows[header_idx + 1 :], cols


def ingest_rows(
    data_rows: list[list[str]],
    cols: dict[str, int],
    problem_by_id: dict[str, dict],
    topic_problem_ids: dict[str, list[str]],
    seen_codes: set[str],
    sheet_level_default: float = 0.0,
):
    iname, icode, ilevel, icat = cols["name"], cols["code"], cols["level"], cols["category"]
    ic_train = cols.get("train")

    for raw in data_rows:
        max_idx = max(iname, icode, ilevel, icat, ic_train or 0)
        row = list(raw) + [""] * (max_idx + 1 - len(raw))
        name = (row[iname] or "").strip()
        code = (row[icode] or "").strip()
        if not code or code.lower() == "problem code":
            continue
        if code == "Optional Problems":
            continue
        if "Video Solution" in code and "CF" not in code.upper():
            continue

        ckey = normalize_code_key(code)
        if not ckey or ckey in seen_codes:
            continue

        try:
            lv = float((row[ilevel] or "").strip() or 0)
        except ValueError:
            lv = sheet_level_default

        cat = (row[icat] or "").strip() if icat < len(row) else ""

        train_lv: float | None = None
        if ic_train is not None and ic_train < len(row):
            try:
                train_lv = float((row[ic_train] or "").strip() or 0) or None
            except ValueError:
                train_lv = None

        url, oj = problem_url(code)
        if url == "#" and not name:
            continue

        display_name = name if name else code
        tid = assign_topic(code, cat, lv, train_lv)

        diff = letter_difficulty(code) if "CF" in code.upper() else (
            "easy" if lv and lv <= 3 else "medium" if lv <= 6 else "hard"
        )

        pid = stable_id(display_name, code)
        base = pid
        n = 0
        while pid in problem_by_id:
            n += 1
            pid = f"{base}-{n}"

        prob = {
            "id": pid,
            "name": display_name,
            "code": code,
            "url": url or "#",
            "oj": oj,
            "difficulty": diff,
            "level": min(
                10,
                max(1, int(lv) or (4 if diff == "easy" else 6 if diff == "medium" else 8)),
            ),
            "sheetLevel": int(lv) if lv else None,
            "tags": build_tags(tid, cat, code),
        }
        problem_by_id[pid] = prob
        topic_problem_ids[tid].append(pid)
        seen_codes.add(ckey)


def main():
    problem_by_id: dict[str, dict] = {}
    topic_problem_ids: dict[str, list[str]] = {f"{i:02d}": [] for i in range(1, 16)}
    seen_codes: set[str] = set()

    # Primary huge tab
    big = fetch_csv(PRIMARY_GID)
    rows, cols = parse_tab(big, None)
    if not cols:
        cols = {"name": 0, "code": 1, "level": 9, "category": 13, "train": 15}
    ingest_rows(rows, cols, problem_by_id, topic_problem_ids, seen_codes)

    # Secondary tabs: only add codes not seen
    for gid in EXTRA_GIDS:
        try:
            txt = fetch_csv(gid)
            r2, c2 = parse_tab(txt, cols)
            ingest_rows(r2, c2, problem_by_id, topic_problem_ids, seen_codes)
        except Exception as e:
            print("WARN extra gid", gid, e)

    meta = {
        "01": {"playlist": "https://www.youtube.com/@ArabicCompetitiveProgramming/search?query=training+road+map", "title": "Training Road Maps", "phase": "Phase 1"},
        "02": {"playlist": "https://www.youtube.com/@ArabicCompetitiveProgramming/search?query=cpp+programming+competitions", "title": "C++ 4 Competitions", "phase": "Phase 1"},
        "03": {"playlist": "https://www.youtube.com/@ArabicCompetitiveProgramming/search?query=newcomers", "title": "Newcomers", "phase": "Phase 1"},
        "04": {"playlist": "https://www.youtube.com/@ArabicCompetitiveProgramming/search?query=measuring+algorithms+performance", "title": "Measuring Algorithms Performance", "phase": "Phase 1"},
        "05": {"playlist": "https://www.youtube.com/@ArabicCompetitiveProgramming/search?query=math", "title": "Math", "phase": "Phase 2"},
        "06": {"playlist": "https://www.youtube.com/@ArabicCompetitiveProgramming/search?query=thinking+techniques", "title": "Thinking Techniques", "phase": "Phase 2"},
        "07": {"playlist": "https://www.youtube.com/@ArabicCompetitiveProgramming/search?query=data+structures", "title": "Data Structures", "phase": "Phase 2"},
        "08": {"playlist": "https://www.youtube.com/@ArabicCompetitiveProgramming/search?query=search+techniques", "title": "Search Techniques", "phase": "Phase 2"},
        "09": {"playlist": "https://www.youtube.com/@ArabicCompetitiveProgramming/search?query=string+processing", "title": "String Processing", "phase": "Phase 3"},
        "10": {"playlist": "https://www.youtube.com/@ArabicCompetitiveProgramming/search?query=dynamic+programming", "title": "Dynamic Programming", "phase": "Phase 3"},
        "11": {"playlist": "https://www.youtube.com/@ArabicCompetitiveProgramming/search?query=greedy", "title": "Greedy Algorithms", "phase": "Phase 3"},
        "12": {"playlist": "https://www.youtube.com/@ArabicCompetitiveProgramming/search?query=graph+theory", "title": "Graph Theory", "phase": "Phase 3"},
        "13": {"playlist": "https://www.youtube.com/@ArabicCompetitiveProgramming/search?query=codeforces+div2+A", "title": "Practice — Div2 A", "phase": "Phase 4"},
        "14": {"playlist": "https://www.youtube.com/@ArabicCompetitiveProgramming/search?query=codeforces+div2+B", "title": "Practice — Div2 B", "phase": "Phase 4"},
        "15": {"playlist": "https://www.youtube.com/@ArabicCompetitiveProgramming/search?query=contest+strategies", "title": "Contest Strategies", "phase": "Phase 4"},
    }

    payload = {
        "sheetUrl": f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit",
        "topics": meta,
        "problemById": problem_by_id,
        "topicProblemIds": topic_problem_ids,
        "sheetPrimaryGid": PRIMARY_GID,
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(
        "// Auto-generated by scripts/build_topics_from_sheet.py\nwindow.MSCP_TOPICS_DATA = "
        + json.dumps(payload, ensure_ascii=False, indent=2)
        + ";\n",
        encoding="utf-8",
    )
    print("Wrote", OUT_PATH)
    print("unique problems (by code)", len(problem_by_id))
    for k in sorted(topic_problem_ids.keys()):
        print(k, len(topic_problem_ids[k]))


if __name__ == "__main__":
    main()