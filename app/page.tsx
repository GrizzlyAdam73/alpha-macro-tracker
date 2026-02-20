"use client"
import { useEffect, useMemo, useState } from "react"

const RULE_85 = 85
const STORAGE_KEY = "alpha-macro-entries-v1"

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

function todayISO() {
  const d = new Date()
  return d.toISOString().split("T")[0]
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

export default function Home() {
  const [entries, setEntries] = useState<Entries>({})
  const [selectedDate, setSelectedDate] = useState(todayISO())

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
  const stats = calcPercent(checks)
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

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() - (6 - i))
    const iso = d.toISOString().split("T")[0]
    const entry = entries[iso]
    const percent = entry ? calcPercent(entry).percent : 0
    return { iso, percent }
  })

  const logged = weekDays.filter((d) => entries[d.iso])
  const avg =
    logged.length > 0
      ? Math.round(logged.reduce((sum, d) => sum + d.percent, 0) / logged.length)
      : 0
  const days85 = weekDays.filter((d) => d.percent >= RULE_85).length

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto", fontFamily: "system-ui" }}>
      <h1>🔥 Alpha Macro Tracker</h1>

      <div style={{ margin: "10px 0" }}>
        <strong>
          {stats.done}/{stats.total} completed ({stats.percent}%)
        </strong>
        <div style={{ background: onTrack ? "#d1fae5" : "#fef3c7", padding: 8, marginTop: 6 }}>
          {onTrack ? "On Track (85%+)" : "Push to 85%"}
        </div>
      </div>

      <button onClick={resetDay} style={{ marginBottom: 10 }}>
        Reset Day
      </button>

      {CATEGORIES.map((cat, cIndex) => (
        <div key={cat.title} style={{ marginBottom: 15 }}>
          <h3>{cat.title}</h3>
          {cat.items.map((item, iIndex) => (
            <label key={item} style={{ display: "block" }}>
              <input
                type="checkbox"
                checked={checks[cIndex][iIndex]}
                onChange={() => toggle(cIndex, iIndex)}
              />
              {item}
            </label>
          ))}
        </div>
      ))}

      <hr style={{ margin: "30px 0" }} />

      <h2>📊 Weekly Dashboard</h2>
      <p>Average adherence: {avg}%</p>
      <p>85%+ days: {days85}/7</p>

      {weekDays.map((d) => (
        <div key={d.iso} style={{ padding: 6 }}>
          {d.iso} — {d.percent}%
        </div>
      ))}
    </div>
  )
}
