(function () {
  var STORAGE_SOLVED = "mscp-solved";
  var STORAGE_STREAK = "mscp-streak-global";

  function normalizeData(d) {
    if (!d || d.__normalized || !d.topicProblemIds || !d.problemById) return d;
    d.__normalized = true;

    var topicIds = Object.keys(d.topicProblemIds).sort();
    var globalSeen = {};
    topicIds.forEach(function (tid) {
      var arr = d.topicProblemIds[tid] || [];
      var localSeen = {};
      d.topicProblemIds[tid] = arr.filter(function (pid) {
        if (!d.problemById[pid] || localSeen[pid] || globalSeen[pid])
          return false;
        localSeen[pid] = true;
        globalSeen[pid] = true;
        return true;
      });
    });

    function takeFrom(target, donors, need, predicate) {
      var t = d.topicProblemIds[target] || [];
      while (t.length < need) {
        var moved = false;
        for (var i = 0; i < donors.length && t.length < need; i++) {
          var src = d.topicProblemIds[donors[i]] || [];
          for (var j = 0; j < src.length; j++) {
            var pid = src[j];
            var p = d.problemById[pid];
            if (!p || !predicate(p)) continue;
            src.splice(j, 1);
            t.push(pid);
            moved = true;
            break;
          }
        }
        if (!moved) break;
      }
      d.topicProblemIds[target] = t;
    }

    takeFrom("01", ["03", "13"], 10, function (p) {
      return p.difficulty === "easy" || (p.level || 0) <= 4;
    });
    takeFrom("02", ["06", "13", "14", "05"], 18, function (p) {
      var tags = (p.tags || []).join(" ").toLowerCase();
      return (
        tags.indexOf("implementation") !== -1 ||
        tags.indexOf("stl") !== -1 ||
        tags.indexOf("intro") !== -1 ||
        (p.level || 0) <= 7
      );
    });
    takeFrom("03", ["13", "06", "02"], 18, function (p) {
      return p.difficulty === "easy" || (p.level || 0) <= 5;
    });
    takeFrom("04", ["06", "08", "13"], 14, function (p) {
      return (p.level || 0) <= 6;
    });
    takeFrom("15", ["14", "12", "11"], 12, function (p) {
      return p.difficulty !== "easy";
    });

    return d;
  }

  var id = window.MSCP_TOPIC_ID;
  var data = normalizeData(window.MSCP_TOPICS_DATA);
  var root = document.getElementById("topic-root");
  if (!id || !data || !root || !data.topics[id]) {
    if (root)
      root.innerHTML =
        '<p style="padding:2rem;text-align:center;color:#94a3b8">Data not available.</p>';
    return;
  }

  function getProblems() {
    var seen = {};
    if (data.topicProblemIds && data.problemById) {
      return (data.topicProblemIds[id] || [])
        .map(function (pid) {
          return data.problemById[pid];
        })
        .filter(Boolean)
        .filter(function (p) {
          if (seen[p.id]) return false;
          seen[p.id] = true;
          return true;
        });
    }
    return ((data.problems && data.problems[id]) || []).filter(function (p) {
      if (!p || !p.id || seen[p.id]) return false;
      seen[p.id] = true;
      return true;
    });
  }

  var meta = data.topics[id];
  var problems = getProblems();

  var TAG_FOR_TOPIC = {
    "01": "roadmap",
    "02": "cpp",
    "03": "intro",
    "04": "complexity",
    "05": "math",
    "06": "thinking",
    "07": "data-structures",
    "08": "search",
    "09": "strings",
    10: "dp",
    11: "greedy",
    12: "graphs",
    13: "div2-a",
    14: "div2-b",
    15: "contest",
  };

  var diffOrder = { easy: 0, medium: 1, hard: 2 };
  var diffClass = { easy: "diff-easy", medium: "diff-med", hard: "diff-hard" };

  function migrateSolved() {
    var raw = localStorage.getItem(STORAGE_SOLVED);
    if (raw) {
      try {
        var arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length) return new Set(arr);
      } catch (e) {}
    }
    var set = new Set();
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf("mscp-solved-") === 0 && k !== STORAGE_SOLVED) {
        try {
          var a = JSON.parse(localStorage.getItem(k) || "[]");
          if (Array.isArray(a))
            a.forEach(function (x) {
              set.add(x);
            });
        } catch (e) {}
      }
    }
    if (set.size)
      localStorage.setItem(STORAGE_SOLVED, JSON.stringify(Array.from(set)));
    return set;
  }

  var solvedSet = migrateSolved();

  function saveSolved() {
    localStorage.setItem(STORAGE_SOLVED, JSON.stringify(Array.from(solvedSet)));
    try {
      window.dispatchEvent(new Event("mscp-solved-changed"));
    } catch (e) {}
  }

  function todayISO() {
    var d = new Date();
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0")
    );
  }

  function yesterdayISO() {
    var d = new Date();
    d.setDate(d.getDate() - 1);
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0")
    );
  }

  function getStreakGlobal() {
    try {
      return JSON.parse(
        localStorage.getItem(STORAGE_STREAK) ||
          '{"lastCountedDay":"","value":0}',
      );
    } catch (e) {
      return { lastCountedDay: "", value: 0 };
    }
  }

  function saveStreakGlobal(s) {
    localStorage.setItem(STORAGE_STREAK, JSON.stringify(s));
  }

  function bumpGlobalStreak() {
    var today = todayISO();
    var yest = yesterdayISO();
    var st = getStreakGlobal();
    if (st.lastCountedDay === today) return;
    if (!st.lastCountedDay || st.lastCountedDay === yest) {
      st.value = st.lastCountedDay === yest ? st.value + 1 : 1;
    } else {
      st.value = 1;
    }
    st.lastCountedDay = today;
    saveStreakGlobal(st);
  }

  problems.sort(function (a, b) {
    var da =
      diffOrder[a.difficulty] !== undefined ? diffOrder[a.difficulty] : 1;
    var db =
      diffOrder[b.difficulty] !== undefined ? diffOrder[b.difficulty] : 1;
    if (da !== db) return da - db;
    return (a.level || 0) - (b.level || 0);
  });

  document.documentElement.lang = "en";
  document.documentElement.dir = "ltr";
  document.title = meta.title + " — MSCP";

  var phaseNum = String(meta.phase || "Phase 1").replace(/[^\d]/g, "") || "1";
  document.body.setAttribute("data-phase", phaseNum);
  document.documentElement.setAttribute("data-phase", phaseNum);

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatDifficulty(p) {
    var d = (p.difficulty || "medium").toLowerCase();
    var label = d.charAt(0).toUpperCase() + d.slice(1);
    if (p.sheetLevel != null && p.sheetLevel > 0) {
      return label + " · sheet L" + p.sheetLevel + "/10";
    }
    return label;
  }

  function displayTags(p) {
    var tt = TAG_FOR_TOPIC[id];
    var list = (p.tags || []).slice();
    if (tt && list.indexOf(tt) === -1) list.unshift(tt);
    var seen = {};
    var out = [];
    list.forEach(function (t) {
      var low = String(t).toLowerCase();
      if (!seen[low] && low !== (p.difficulty || "").toLowerCase()) {
        seen[low] = true;
        out.push(t);
      }
    });
    if (!out.length) return "—";
    return out
      .slice(0, 8)
      .map(function (t) {
        return '<span class="mini-tag">' + escapeHtml(t) + "</span>";
      })
      .join("");
  }

  function solvedCount() {
    var n = 0;
    problems.forEach(function (p) {
      if (solvedSet.has(p.id)) n++;
    });
    return n;
  }

  function progressPct() {
    if (!problems.length) return 0;
    return Math.round((solvedCount() / problems.length) * 100);
  }

  var easyC = problems.filter(function (p) {
    return p.difficulty === "easy";
  }).length;
  var medC = problems.filter(function (p) {
    return p.difficulty === "medium";
  }).length;
  var hardC = problems.filter(function (p) {
    return p.difficulty === "hard";
  }).length;

  function phaseBadgeStyle(phase) {
    var p = (phase || "").toLowerCase();
    if (p.indexOf("phase 1") !== -1)
      return "background:rgba(91,141,246,.12);color:#5b8df6;border:1px solid rgba(91,141,246,.35)";
    if (p.indexOf("phase 2") !== -1)
      return "background:rgba(62,207,142,.12);color:#3ecf8e;border:1px solid rgba(62,207,142,.35)";
    if (p.indexOf("phase 3") !== -1)
      return "background:rgba(245,166,35,.12);color:#f5a623;border:1px solid rgba(245,166,35,.35)";
    if (p.indexOf("phase 4") !== -1)
      return "background:rgba(224,92,122,.12);color:#e05c7a;border:1px solid rgba(224,92,122,.35)";
    return "background:rgba(91,141,246,.12);color:#5b8df6;border:1px solid rgba(91,141,246,.35)";
  }

  var phaseStyle = phaseBadgeStyle(meta.phase);

  function buildTableRows() {
    return problems
      .map(function (p, i) {
        var checked = solvedSet.has(p.id) ? " checked" : "";
        var url = p.url && p.url !== "#" ? p.url : "#";
        var diff = (p.difficulty || "medium").toLowerCase();
        var link =
          url === "#"
            ? '<span class="prob-link" style="opacity:.75">' +
              escapeHtml(p.name) +
              "</span>"
            : '<a class="prob-link" href="' +
              escapeHtml(url) +
              '" target="_blank" rel="noopener">' +
              escapeHtml(p.name) +
              "</a>";
        return (
          '<tr data-diff="' +
          escapeHtml(diff) +
          '" data-pid="' +
          escapeHtml(p.id) +
          '">' +
          '<td class="chk"><input type="checkbox" class="mscp-chk" data-id="' +
          escapeHtml(p.id) +
          '"' +
          checked +
          "/></td>" +
          '<td class="td-idx">' +
          String(i + 1).padStart(2, "0") +
          "</td>" +
          '<td class="prob-name-cell">' +
          link +
          "</td>" +
          '<td><span class="oj-badge">' +
          escapeHtml(p.oj || "") +
          "</span></td>" +
          '<td><code style="font-family:var(--mono);font-size:.65rem;color:var(--sub);word-break:break-all">' +
          escapeHtml(p.code || "") +
          "</code></td>" +
          '<td><span class="level-pill">Lv ' +
          escapeHtml(String(p.level != null ? p.level : "—")) +
          "</span></td>" +
          '<td><span class="diff ' +
          (diffClass[diff] || "diff-med") +
          '">' +
          escapeHtml(formatDifficulty(p)) +
          "</span></td>" +
          '<td class="tag-cell"><div class="mini-tags">' +
          displayTags(p) +
          "</div></td>" +
          "</tr>"
        );
      })
      .join("");
  }

  var pct = progressPct();
  var sc = solvedCount();

  var filterBar =
    '<div class="filter-bar">' +
    '<span class="filter-label">Filter:</span>' +
    '<button type="button" class="filter-btn active" data-filter="all">All</button>' +
    '<button type="button" class="filter-btn" data-filter="easy">Easy</button>' +
    '<button type="button" class="filter-btn" data-filter="medium">Medium</button>' +
    '<button type="button" class="filter-btn" data-filter="hard">Hard</button>' +
    "</div>";

  var html =
    '<nav class="nav">' +
    '<a class="nav-home" href="../index.html">← Back to Home</a>' +
    '<span class="nav-badge" style="' +
    phaseStyle +
    '">' +
    escapeHtml(meta.phase || "") +
    "</span></nav>" +
    '<div class="hero">' +
    '<h1><span class="hero-num">' +
    id +
    '.</span> <span class="font-topic">' +
    escapeHtml(meta.title) +
    "</span></h1>" +
    '<p class="hero-lead">Practice set for this roadmap topic with progress tracking by difficulty and solved status.</p>' +
    '<div class="hero-actions">' +
    '<a class="playlist-btn" href="' +
    escapeHtml(meta.playlist) +
    '" target="_blank" rel="noopener">▶ YouTube playlist</a>' +
    "</div>" +
    '<div class="hero-stats">' +
    '<span style="color:var(--easy)">Easy: ' +
    easyC +
    "</span>" +
    '<span style="color:var(--medium)">Medium: ' +
    medC +
    "</span>" +
    '<span style="color:var(--hard)">Hard: ' +
    hardC +
    "</span>" +
    '<span style="color:var(--sub)">Total: ' +
    problems.length +
    "</span>" +
    '<span style="color:var(--accent2)">Solved: <span id="mscp-solved-count">' +
    sc +
    "</span> / " +
    problems.length +
    "</span>" +
    '<span class="progress-pill">Progress: <span id="mscp-progress-pct">' +
    pct +
    "</span>%</span>" +
    "</div>" +
    '<div class="progress-bar-hero"><span id="mscp-progress-fill" style="width:' +
    pct +
    '%"></span></div>' +
    "</div>" +
    '<div class="wrap">';

  if (!problems.length) {
    html +=
      '<div class="callout"><span class="callout-icon">ℹ</span><div>No problems mapped to this topic from the sheet classifier yet — check another phase or the playlist.</div></div>';
  } else {
    html +=
      '<div class="callout"><span class="callout-icon">💡</span><div>Check a problem when you solve it. Progress syncs in your browser across topics. Streak is on the home page.</div></div>' +
      filterBar +
      '<table class="prob-table" id="mscp-table"><thead><tr>' +
      '<th class="chk">✓</th><th>#</th><th>Problem</th><th>Judge</th><th>Code</th><th>Level</th><th>Difficulty</th><th>Tags</th>' +
      '</tr></thead><tbody id="mscp-tbody">' +
      buildTableRows() +
      "</tbody></table>";
  }

  html +=
    '</div><div class="footer">' +
    '<div style="margin-top:0.35rem"><span style="color:#ffffff;font-weight:700;display:inline-block;font-size:1rem">All intellectual property rights belong to <span style="color:var(--page-accent);font-weight:700">Dr. Mostafa Saad</span></span></div>' +
    '<div style="margin-top:0.25rem"><span style="color:#7c8fa6;display:inline-block;font-size:1.05rem">Developed by <a href="https://www.linkedin.com/in/eng-mahmoud-m-abdullah-a04792295/" target="_blank" rel="noopener" style="color:var(--page-accent);font-weight:700;text-decoration:none">Mahmoud Abdullah</a></span></div></div>';

  root.innerHTML = html;

  var confettiLoaded = false;
  function loadConfetti(cb) {
    if (window.confetti) {
      cb();
      return;
    }
    if (confettiLoaded) {
      setTimeout(function () {
        if (window.confetti) cb();
      }, 100);
      return;
    }
    confettiLoaded = true;
    var s = document.createElement("script");
    s.src =
      "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js";
    s.onload = cb;
    document.head.appendChild(s);
  }

  function playVictorySound() {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var t0 = ctx.currentTime;
      var notes = [
        { f: 523.25, d: 0.11 },
        { f: 659.25, d: 0.11 },
        { f: 783.99, d: 0.11 },
        { f: 1046.5, d: 0.14 },
        { f: 1318.51, d: 0.18 },
        { f: 1567.98, d: 0.22 },
      ];
      var delay = 0;
      notes.forEach(function (n, idx) {
        var o = ctx.createOscillator();
        var g = ctx.createGain();
        o.type = idx % 2 === 0 ? "triangle" : "sine";
        o.frequency.setValueAtTime(n.f, t0 + delay);
        var peak = 0.09 + idx * 0.008;
        g.gain.setValueAtTime(0, t0 + delay);
        g.gain.linearRampToValueAtTime(peak, t0 + delay + 0.02);
        g.gain.exponentialRampToValueAtTime(0.008, t0 + delay + n.d);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(t0 + delay);
        o.stop(t0 + delay + n.d + 0.02);
        delay += n.d * 0.72;
      });
      setTimeout(function () {
        try {
          ctx.close();
        } catch (e2) {}
      }, 900);
    } catch (e) {}
  }

  function celebrate() {
    loadConfetti(function () {
      if (!window.confetti) return;
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.65 },
        colors: ["#4f8ef7", "#2ed4a0", "#f5a623", "#e05c7a", "#a78bfa"],
      });
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#4f8ef7", "#2ed4a0"],
      });
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#f5a623", "#e05c7a"],
      });
    });
    playVictorySound();
  }

  function updateProgressUI() {
    var sc2 = solvedCount();
    var pct2 = problems.length ? Math.round((sc2 / problems.length) * 100) : 0;
    var el = document.getElementById("mscp-solved-count");
    if (el) el.textContent = String(sc2);
    var ep = document.getElementById("mscp-progress-pct");
    if (ep) ep.textContent = String(pct2);
    var bar = document.getElementById("mscp-progress-fill");
    if (bar) bar.style.width = pct2 + "%";
  }

  function applyFilter(f) {
    var rows = root.querySelectorAll("#mscp-tbody tr");
    rows.forEach(function (tr) {
      var d = tr.getAttribute("data-diff");
      tr.style.display = f === "all" || f === d ? "" : "none";
    });
    root.querySelectorAll(".filter-btn").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-filter") === f);
    });
  }

  root.addEventListener("click", function (ev) {
    var t = ev.target;
    if (t && t.classList && t.classList.contains("filter-btn")) {
      applyFilter(t.getAttribute("data-filter") || "all");
    }
  });

  root.addEventListener("change", function (ev) {
    var t = ev.target;
    if (!t || !t.classList || !t.classList.contains("mscp-chk")) return;
    var pid = t.getAttribute("data-id");
    if (!pid) return;
    if (t.checked) {
      var wasNew = !solvedSet.has(pid);
      solvedSet.add(pid);
      if (wasNew) {
        bumpGlobalStreak();
        celebrate();
      }
    } else {
      solvedSet.delete(pid);
    }
    saveSolved();
    updateProgressUI();
  });

  updateProgressUI();
})();
