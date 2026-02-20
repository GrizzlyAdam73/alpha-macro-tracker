"use client"
import { useEffect, useMemo, useState } from "react"

const RULE_85 = 85
const STORAGE_KEY = "alpha-macro-entries-v2"

const CATEGORIES = [
  {
    title: "🥩 Nutrition",
    items: [
      "Hit calorie target",
      "Hit protein target",
      "Stayed within carb target",
      "Logged all food",
      "Ate mostly whole foods",
      "Salted meals",
      "Drank 100 oz water",
    ],
  },
  {
    title: "🏋️ Training",
    items: [
      "Strength trained",
      "Stopped 1–2 reps before failure",
      "Focused on good form",
      "Added weight or reps",
    ],
  },
  { title: "🚶 Movement", items: ["7,000+ steps", "20–30 min walking"] },
  { title: "😴 Recovery", items: ["7+ hours sleep", "No binge eating", "Managed stress"] },
  {
    title: "🧠 Discipline",
    items: ["No liquid calories", "No unplanned snacks", "No emotional eating", "Followed the plan"],
  },
]

type Checks = boolean[][]
type Entries = Record<string, Checks>

function isoToday() {
  const d = new Date()
  return d.toISOString().split("T")[0]
}
function fromISO(iso: string) {
  const [y, m, d] = iso.split("-").map((x) => parseInt(x, 10))
  return new Date(y, (m || 1) - 1, d || 1)
}
function addDays(iso: string, delta: number) {
  const d = fromISO(iso)
  d.setDate(d.getDate() + delta)
  return d.toISOString().split("T")[0]
}
function formatShort(iso: string) {
  const d = fromISO(iso)
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })
}
function blankChecks(): Checks {
  return CATEGORIES.map((cat) => cat.items.map(() => false))
}
function calcPercent(checks: Checks) {
  const all = checks.flat()
  const total = all.length
  const done = all.filter(Boolean).length
  const percent = total ? Math.round((done / total) * 100) : 0
  return { total, done, percent }
}

function getPercent(entries: Entries, iso: string): { hasEntry: boolean; percent: number } {
  const e = entries[iso]
  if (!e) return { hasEntry: false, percent: 0 }
  return { hasEntry: true, percent: calcPercent(e).percent }
}

function computeTrueStreak(entries: Entries, endISO: string): number {
  // True streak = consecutive 85%+ days ending on endISO
  let streak = 0
  let cursor = endISO
  while (true) {
    const { hasEntry, percent } = getPercent(entries, cursor)
    if (!hasEntry) break
    if (percent < RULE_85) break
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

function ProgressChart({ points }: { points: { label: string; percent: number; iso: string }[] }) {
  const n = points.length
  const width = 100
  const height = 40

  const polyPoints = points
    .map((p, i) => {
      const x = n === 1 ? 0 : (i * width) / (n - 1)
      const y = height - (p.percent / 100) * height
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(" ")

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12, background: "#fff", color: "#111827" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Progress (last {n} days)</div>
          <div style={{ fontSize: 16, fontWeight: 800 }}>Daily Adherence %</div>
        </div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>
          Rule: <strong>{RULE_85}%+</strong>
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="120" role="img" aria-label="Progress chart">
          {/* grid */}
          <line x1="0" y1="0" x2={width} y2="0" stroke="#eee" strokeWidth="0.6" />
          <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#eee" strokeWidth="0.6" />
          <line x1="0" y1={height} x2={width} y2={height} stroke="#eee" strokeWidth="0.6" />
          {/* 85% reference */}
          <line
            x1="0"
            y1={height - (RULE_85 / 100) * height}
            x2={width}
            y2={height - (RULE_85 / 100) * height}
            stroke="#10b981"
            strokeWidth="0.8"
            strokeDasharray="2 2"
          />
          {/* line */}
          <polyline points={polyPoints} fill="none" stroke="#111827" strokeWidth="1.6" />
          {/* dots */}
          {points.map((p, i) => {
            const x = n === 1 ? 0 : (i * width) / (n - 1)
            const y = height - (p.percent / 100) * height
            const fill = p.percent >= RULE_85 ? "#10b981" : "#f59e0b"
            return <circle key={p.iso} cx={x} cy={y} r="1.7" fill={fill} />
          })}
        </svg>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280" }}>
          <span>{points[0]?.label}</span>
          <span>{points[Math.floor((n - 1) / 2)]?.label}</span>
          <span>{points[n - 1]?.label}</span>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12, minWidth: 160, background: "#fff", color: "#111827" }}>
      <div style={{ fontSize: 12, color: "#6b7280" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800 }}>{value}</div>
    </div>
  )
}

function btn(active = false, danger = false): React.CSSProperties {
  return {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #ddd",
    background: danger ? "#fee2e2" : active ? "#111827" : "#fff",
    color: danger ? "#991b1b" : active ? "#fff" : "#111827",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  }
}

export default function Home() {
  const today = useMemo(() => isoToday(), [])
  const [entries, setEntries] = useState<Entries>({})
  const [selectedDate, setSelectedDate] = useState(today)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setEntries(JSON.parse(saved))
      } catch {}
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  }, [entries])

  const checks = entries[selectedDate] ?? blankChecks()
  const stats = useMemo(() => calcPercent(checks), [checks])
  const onTrack = stats.percent >= RULE_85

  function toggle(catIndex: number, itemIndex: number) {
    const updated = checks.map((row, r) =>
      row.map((val, c) => (r === catIndex && c === itemIndex ? !val : val))
    )
    setEntries((prev) => ({ ...prev, [selectedDate]: updated }))
  }

  function resetDay() {
    setEntries((prev) => ({ ...prev, [selectedDate]: blankChecks() }))
  }

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const iso = addDays(selectedDate, -((6 - i) as number))
      const { hasEntry, percent } = getPercent(entries, iso)
      return { iso, hasEntry, percent }
    })
  }, [entries, selectedDate])

  const weekly = useMemo(() => {
    const logged = weekDays.filter((d) => d.hasEntry)
    const avg = logged.length ? Math.round(logged.reduce((s, d) => s + d.percent, 0) / logged.length) : 0
    const days85 = weekDays.filter((d) => d.hasEntry && d.percent >= RULE_85).length
    return { avg, days85 }
  }, [weekDays])

  const trueStreak = useMemo(() => computeTrueStreak(entries, today), [entries, today])

  const chartPoints = useMemo(() => {
    const pts = []
    for (let i = 13; i >= 0; i--) {
      const iso = addDays(today, -i)
      const d = fromISO(iso)
      const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
      pts.push({ iso, label, percent: getPercent(entries, iso).percent })
    }
    return pts
  }, [entries, today])

  return (
    <div style={{ padding: 18, maxWidth: 920, margin: "0 auto", fontFamily: "system-ui", color: "#111827" }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>🔥 Alpha Macro Tracker</h1>
      <p style={{ marginTop: 0, color: "#6b7280" }}>
        Consistency beats intensity • Protein is non-negotiable • Increase movement first
      </p>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 12,
          marginTop: 12,
          background: "#fff",
          color: "#111827",
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Selected date</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{selectedDate}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>{formatShort(selectedDate)}</div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => setSelectedDate(addDays(selectedDate, -1))} style={btn()}>
            ◀
          </button>
          <button onClick={() => setSelectedDate(today)} style={btn(selectedDate === today)} title="Jump to today">
            Today
          </button>
          <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} style={btn()}>
            ▶
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
              fontSize: 14,
              color: "#111827",
              background: "#fff",
            }}
          />

          <button onClick={resetDay} style={btn(false, true)} title="Reset this day's checkboxes">
            Reset day
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
        <Stat label="Today completion" value={`${stats.percent}%`} />
        <Stat label="True streak (85%+)" value={`${trueStreak} day${trueStreak === 1 ? "" : "s"}`} />
        <Stat label="This week avg" value={`${weekly.avg}%`} />
        <Stat label="85%+ days (week)" value={`${weekly.days85}/7`} />
      </div>

      <div style={{ margin: "14px 0", padding: 14, border: "1px solid #ddd", borderRadius: 12, background: "#fff", color: "#111827" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <strong>
            Daily completion: {stats.done}/{stats.total} ({stats.percent}%)
          </strong>
          <span
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              fontSize: 12,
              background: onTrack ? "#d1fae5" : "#fef3c7",
              color: "#111827",
            }}
            title="85% rule"
          >
            {onTrack ? "✅ On track (85%+)" : "⚠️ Push to 85%"}
          </span>
        </div>

        <div style={{ marginTop: 10, height: 10, background: "#eee", borderRadius: 999 }}>
          <div
            style={{
              width: `${stats.percent}%`,
              height: "100%",
              borderRadius: 999,
              background: onTrack ? "#10b981" : "#f59e0b",
            }}
          />
        </div>
      </div>

      <ProgressChart points={chartPoints} />

      <div style={{ marginTop: 14 }}>
        {CATEGORIES.map((cat, cIndex) => (
          <div
            key={cat.title}
            style={{
              marginBottom: 12,
              padding: 14,
              border: "1px solid #eee",
              borderRadius: 12,
              background: "#fff",
              color: "#111827",
            }}
          >
            <h3 style={{ margin: "0 0 10px 0" }}>{cat.title}</h3>
            <div style={{ display: "grid", gap: 8 }}>
              {cat.items.map((item, iIndex) => (
                <label key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <input
                    type="checkbox"
                    checked={checks[cIndex]?.[iIndex] ?? false}
                    onChange={() => toggle(cIndex, iIndex)}
                    style={{ marginTop: 3 }}
                  />
                  <span style={{ color: "#111827" }}>{item}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 18, padding: 14, border: "1px solid #ddd", borderRadius: 12, background: "#fff", color: "#111827" }}>
        <h2 style={{ margin: "0 0 10px 0" }}>📊 Weekly Dashboard (last 7 days)</h2>
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>Tap a day to view it</div>

        <div style={{ display: "grid", gap: 8 }}>
          {weekDays.map((d) => (
            <div
              key={d.iso}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: "1px solid #eee",
                borderRadius: 10,
                padding: "10px 12px",
                background: d.iso === selectedDate ? "#f8fafc" : "#fff",
                cursor: "pointer",
              }}
              onClick={() => setSelectedDate(d.iso)}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <strong style={{ minWidth: 110 }}>{formatShort(d.iso)}</strong>
                <span style={{ fontSize: 12, color: "#6b7280" }}>{d.iso}</span>
              </div>
              <span
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  fontSize: 12,
                  background: !d.hasEntry ? "#f1f5f9" : d.percent >= RULE_85 ? "#d1fae5" : "#fef3c7",
                  color: "#111827",
                }}
              >
                {!d.hasEntry ? "Not logged" : `${d.percent}%`}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16, fontSize: 12, color: "#6b7280" }}>
        Data is saved on this device/browser only (localStorage). Clearing Safari data will erase it.
      </div>
    </div>
  )
}
