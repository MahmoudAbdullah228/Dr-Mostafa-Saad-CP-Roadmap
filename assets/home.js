(function () {
  function normalizeData(d) {
    if (!d || d.__normalized || !d.topicProblemIds || !d.problemById) return d;
    d.__normalized = true;

    var topicIds = Object.keys(d.topicProblemIds).sort();
    var globalSeen = {};
    topicIds.forEach(function (tid) {
      var arr = d.topicProblemIds[tid] || [];
      var localSeen = {};
      d.topicProblemIds[tid] = arr.filter(function (pid) {
        if (!d.problemById[pid] || localSeen[pid] || globalSeen[pid]) return false;
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
          var srcId = donors[i];
          var src = d.topicProblemIds[srcId] || [];
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

    takeFrom('01', ['03', '13'], 10, function (p) {
      return (p.difficulty === 'easy') || ((p.level || 0) <= 4);
    });
    takeFrom('02', ['06', '13', '14', '05'], 18, function (p) {
      var tags = (p.tags || []).join(' ').toLowerCase();
      return tags.indexOf('implementation') !== -1 || tags.indexOf('stl') !== -1 || tags.indexOf('intro') !== -1 || (p.level || 0) <= 7;
    });
    takeFrom('03', ['13', '06', '02'], 18, function (p) {
      return p.difficulty === 'easy' || (p.level || 0) <= 5;
    });
    takeFrom('04', ['06', '08', '13'], 14, function (p) {
      return (p.level || 0) <= 6;
    });
    takeFrom('15', ['14', '12', '11'], 12, function (p) {
      return p.difficulty !== 'easy';
    });

    return d;
  }

  function getData() {
    return normalizeData(window.MSCP_TOPICS_DATA);
  }

  function getSolvedSet() {
    try {
      var arr = JSON.parse(localStorage.getItem('mscp-solved') || '[]');
      return Array.isArray(arr) ? new Set(arr) : new Set();
    } catch (e) {
      return new Set();
    }
  }

  function topicProblemIds(tid) {
    var d = getData();
    if (!d) return [];
    if (d.topicProblemIds) return d.topicProblemIds[tid] || [];
    var list = d.problems && d.problems[tid];
    if (!list) return [];
    return list.map(function (p) {
      return p.id;
    });
  }

  function totalUniqueProblems() {
    var d = getData();
    if (!d) return 0;
    if (d.problemById) return Object.keys(d.problemById).length;
    var n = 0;
    if (d.problems) {
      for (var k in d.problems) {
        n += (d.problems[k] || []).length;
      }
    }
    return n;
  }

  function countSolvedGlobally() {
    var d = getData();
    var solved = getSolvedSet();
    if (!d || !d.problemById) return solved.size;
    var c = 0;
    solved.forEach(function (id) {
      if (d.problemById[id]) c++;
    });
    return c;
  }

  function streakValue() {
    try {
      var o = JSON.parse(localStorage.getItem('mscp-streak-global') || '{}');
      return typeof o.value === 'number' ? o.value : 0;
    } catch (e) {
      return 0;
    }
  }

  function updateCards() {
    var solved = getSolvedSet();
    var cards = document.querySelectorAll('a.card[data-tid]');
    cards.forEach(function (card) {
      var tid = card.getAttribute('data-tid');
      var ids = topicProblemIds(tid);
      var tot = ids.length;
      var done = 0;
      ids.forEach(function (id) {
        if (solved.has(id)) done++;
      });
      var pct = tot ? Math.round((done / tot) * 100) : 0;
      var fill = card.querySelector('.card-progress-fill');
      if (fill) fill.style.width = pct + '%';
    });
  }

  function refresh() {
    var d = getData();
    if (!d) return;

    var elTotal = document.getElementById('mscp-home-total');
    var elSolved = document.getElementById('mscp-home-solved');
    var elPct = document.getElementById('mscp-home-pct');
    var elStreak = document.getElementById('mscp-home-streak');
    var total = totalUniqueProblems();
    var solved = countSolvedGlobally();
    var pct = total ? Math.round((solved / total) * 100) : 0;
    if (elTotal) elTotal.textContent = String(total);
    if (elSolved) elSolved.textContent = String(solved);
    if (elPct) elPct.textContent = String(pct);
    if (elStreak) elStreak.textContent = String(streakValue());

    updateCards();
  }

  function migrateLegacySolved() {
    if (localStorage.getItem('mscp-solved')) return;
    var set = new Set();
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf('mscp-solved-') === 0 && k !== 'mscp-solved') {
        try {
          var a = JSON.parse(localStorage.getItem(k) || '[]');
          if (Array.isArray(a)) a.forEach(function (x) { set.add(x); });
        } catch (e) {}
      }
    }
    if (set.size) localStorage.setItem('mscp-solved', JSON.stringify(Array.from(set)));
  }

  function init() {
    migrateLegacySolved();
    refresh();
    window.addEventListener('mscp-solved-changed', refresh);
    window.addEventListener('pageshow', refresh);
    window.addEventListener('storage', function (e) {
      if (!e.key || e.key === 'mscp-solved' || e.key === 'mscp-streak-global') refresh();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
