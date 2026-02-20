"use client"
import { useEffect, useMemo, useState } from "react"

const RULE_85 = 85

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
    items: [
      "No liquid calories",
      "No unplanned snacks",
      "No emotional eating",
      "Followed the plan",
    ],
  },
]

export default function Home() {
  const [checks, setChecks] = useState<boolean[][]>(() =>
    CATEGORIES.map((cat) => cat.items.map(() => false))
  )

  useEffect(() => {
    const saved = localStorage.getItem("alpha-data")
    if (saved) {
      try {
        setChecks(JSON.parse(saved))
      } catch {
        // ignore bad data
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("alpha-data", JSON.stringify(checks))
  }, [checks])

  const { total, done, percent } = useMemo(() => {
    const all = checks.flat()
    const doneCount = all.filter(Boolean).length
    return {
      total: all.length,
      done: doneCount,
      percent: Math.round((doneCount / all.length) * 100),
    }
  }, [checks])

  const toggle = (catIndex: number, itemIndex: number) => {
    setChecks((prev) => {
      const next = prev.map((row) => [...row])
      next[catIndex][itemIndex] = !next[catIndex][itemIndex]
      return next
    })
  }

  return (
    <div style={{ padding: 24, maxWidth: 820, margin: "0 auto", fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>🔥 Alpha Macro Daily Tracker</h1>
      <p style={{ marginTop: 0, color: "#666" }}>
        Consistency beats intensity • Protein is non-negotiable • Increase movement first
      </p>

      <div style={{ margin: "18px 0", padding: 14, border: "1px solid #ddd", borderRadius: 12 }}>
        <strong>
          {done}/{total} completed ({percent}%)
        </strong>
        <div
          style={{
            padding: 10,
            marginTop: 10,
            borderRadius: 10,
            background: percent >= RULE_85 ? "#d1fae5" : "#fef3c7",
          }}
        >
          {percent >= RULE_85 ? "✅ On Track (85%+)" : "⚠️ Push to 85%"}
        </div>
      </div>

      {CATEGORIES.map((cat, cIndex) => (
        <div
          key={cat.title}
          style={{ marginBottom: 16, padding: 14, border: "1px solid #eee", borderRadius: 12 }}
        >
          <h3 style={{ margin: "0 0 10px 0" }}>{cat.title}</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {cat.items.map((item, iIndex) => (
              <label key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <input
                  type="checkbox"
                  checked={checks[cIndex][iIndex]}
                  onChange={() => toggle(cIndex, iIndex)}
                  style={{ marginTop: 3 }}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
