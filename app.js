(() => {
  "use strict";

  const KEY = "habit-tracker:v1";
  const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

  // State: [{ id, name, created, done: { "YYYY-MM-DD": true } }]
  let habits = load();

  const $ = (id) => document.getElementById(id);
  const listEl = $("list");
  const emptyEl = $("empty");

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(habits));
    } catch {
      /* storage unavailable; keep in memory */
    }
  }

  // Local-time date key, avoiding UTC off-by-one from toISOString().
  function key(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
  }

  function streak(habit) {
    const today = new Date();
    let cursor = habit.done[key(today)] ? today : addDays(today, -1);
    let count = 0;
    while (habit.done[key(cursor)]) {
      count++;
      cursor = addDays(cursor, -1);
    }
    return count;
  }

  function bestStreak(habit) {
    const days = Object.keys(habit.done).filter((k) => habit.done[k]).sort();
    let best = 0, run = 0, prev = null;
    for (const k of days) {
      const [y, m, d] = k.split("-").map(Number);
      const cur = new Date(y, m - 1, d);
      run = prev && key(addDays(prev, 1)) === k ? run + 1 : 1;
      best = Math.max(best, run);
      prev = cur;
    }
    return best;
  }

  function toggle(id, dateKey) {
    const h = habits.find((x) => x.id === id);
    if (!h) return;
    if (h.done[dateKey]) delete h.done[dateKey];
    else h.done[dateKey] = true;
    save();
    render();
  }

  function render() {
    const today = new Date();
    const todayKey = key(today);

    $("today-label").textContent = today.toLocaleDateString(undefined, {
      weekday: "long", month: "long", day: "numeric",
    });

    const doneToday = habits.filter((h) => h.done[todayKey]).length;
    $("summary-done").textContent = `${doneToday}/${habits.length}`;

    emptyEl.hidden = habits.length > 0;
    listEl.replaceChildren();

    for (const h of habits) {
      const card = document.createElement("article");
      card.className = "habit";

      const row = document.createElement("div");
      row.className = "row";

      const check = document.createElement("button");
      check.type = "button";
      check.className = "check" + (h.done[todayKey] ? " on" : "");
      check.textContent = "✓";
      check.setAttribute("aria-label", `Mark "${h.name}" done for today`);
      check.setAttribute("aria-pressed", String(!!h.done[todayKey]));
      check.addEventListener("click", () => toggle(h.id, todayKey));

      const name = document.createElement("div");
      name.className = "name";
      name.textContent = h.name;

      const s = document.createElement("div");
      s.className = "streak";
      const cur = streak(h);
      s.innerHTML = `<b>${cur}</b> day streak · best ${Math.max(bestStreak(h), cur)}`;

      const del = document.createElement("button");
      del.type = "button";
      del.className = "del";
      del.textContent = "×";
      del.setAttribute("aria-label", `Delete "${h.name}"`);
      del.addEventListener("click", () => {
        if (confirm(`Delete "${h.name}" and its history?`)) {
          habits = habits.filter((x) => x.id !== h.id);
          save();
          render();
        }
      });

      row.append(check, name, s, del);

      const week = document.createElement("div");
      week.className = "week";
      for (let i = 6; i >= 0; i--) {
        const d = addDays(today, -i);
        const k = key(d);
        const b = document.createElement("button");
        b.type = "button";
        b.className = "day" + (h.done[k] ? " on" : "") + (i === 0 ? " today" : "");
        b.innerHTML = `<span>${DAY_LABELS[d.getDay()]}</span><span class="n">${d.getDate()}</span>`;
        b.setAttribute("aria-label", `${h.name}, ${d.toDateString()}, ${h.done[k] ? "done" : "not done"}`);
        b.addEventListener("click", () => toggle(h.id, k));
        week.append(b);
      }

      card.append(row, week);
      listEl.append(card);
    }
  }

  $("add-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("habit-name");
    const name = input.value.trim();
    if (!name) return;
    habits.push({
      id: (crypto.randomUUID && crypto.randomUUID()) || String(Date.now() + Math.random()),
      name,
      created: key(new Date()),
      done: {},
    });
    input.value = "";
    save();
    render();
  });

  $("export").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(habits, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "habits.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  $("reset").addEventListener("click", () => {
    if (confirm("Delete all habits and history? This cannot be undone.")) {
      habits = [];
      save();
      render();
    }
  });

  // Re-render when the tab regains focus so "today" rolls over after midnight.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) render();
  });

  render();
})();
