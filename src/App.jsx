import { useState, useEffect, useMemo } from "react";
import Papa from "papaparse";

// ─── Inline CSV data (embedded for portability) ────────────────────────────
// In a real app, fetch("/data.csv") or import via bundler.
// Here we load it via FileReader / fetch from public folder.

const THEME_LABELS = {
  process: "Süreç",
  communication: "İletişim",
  tools_systems: "Araçlar & Sistemler",
  culture: "Kültür",
  team_dynamics: "Takım Dinamiği",
  learning_development: "Öğrenme & Gelişim",
  leadership: "Liderlik",
  wellbeing: "İyi Oluş",
};

const SENTIMENT_CONFIG = {
  positive: { label: "Olumlu", color: "#4ade80", bg: "#052e16" },
  negative: { label: "Olumsuz", color: "#f87171", bg: "#2d0b0b" },
  neutral: { label: "Nötr", color: "#94a3b8", bg: "#1e293b" },
};

const ACTION_CONFIG = {
  watch: { label: "İzle", color: "#fbbf24" },
  escalate: { label: "Aksiyon Al", color: "#f87171" },
  ignore: { label: "Yoksay", color: "#475569" },
};

function parseCSV(text) {
  const result = Papa.parse(text, { header: true, skipEmptyLines: true });
  return result.data.map((row) => ({
    ...row,
    score: parseFloat(row.score) || 0,
    severity: parseFloat(row.severity) || 0,
    confidence: parseFloat(row.confidence) || 0,
    should_display: row.should_display === "t",
    risk_flag: row.risk_flag === "t",
    tags: (() => {
      try {
        return JSON.parse(row.tags || "[]");
      } catch {
        return [];
      }
    })(),
    themes: (() => {
      try {
        return JSON.parse(row.themes || "[]");
      } catch {
        return [];
      }
    })(),
  }));
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <span style={{ fontSize: 11, letterSpacing: "0.12em", color: "#64748b", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
        {label}
      </span>
      <span style={{ fontSize: 36, fontWeight: 700, color: accent || "#f8fafc", fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>
        {value}
      </span>
      {sub && <span style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>{sub}</span>}
    </div>
  );
}

function SentimentBar({ positive, negative, neutral }) {
  const total = positive + negative + neutral || 1;
  const pPct = Math.round((positive / total) * 100);
  const nPct = Math.round((negative / total) * 100);
  const neuPct = 100 - pPct - nPct;

  return (
    <div>
      <div style={{ display: "flex", gap: 4, borderRadius: 8, overflow: "hidden", height: 10 }}>
        <div style={{ width: `${pPct}%`, background: "#4ade80", transition: "width 0.6s ease" }} />
        <div style={{ width: `${neuPct}%`, background: "#475569", transition: "width 0.6s ease" }} />
        <div style={{ width: `${nPct}%`, background: "#f87171", transition: "width 0.6s ease" }} />
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
        {[["#4ade80", "Olumlu", pPct], ["#475569", "Nötr", neuPct], ["#f87171", "Olumsuz", nPct]].map(([c, l, p]) => (
          <span key={l} style={{ fontSize: 11, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: c, display: "inline-block" }} />
            {l} <strong style={{ color: "#94a3b8" }}>{p}%</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

function InsightCard({ item }) {
  const sentCfg = SENTIMENT_CONFIG[item.sentiment] || SENTIMENT_CONFIG.neutral;
  const actCfg = ACTION_CONFIG[item.action] || ACTION_CONFIG.ignore;

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.025)",
        border: `1px solid rgba(255,255,255,0.07)`,
        borderLeft: `3px solid ${actCfg.color}`,
        borderRadius: 12,
        padding: "14px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        transition: "background 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", lineHeight: 1.4, flex: 1 }}>
          {item.display_label}
        </span>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <span style={{
            fontSize: 10, padding: "2px 8px", borderRadius: 20,
            background: sentCfg.bg, color: sentCfg.color,
            border: `1px solid ${sentCfg.color}40`,
            fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em"
          }}>
            {sentCfg.label}
          </span>
          <span style={{
            fontSize: 10, padding: "2px 8px", borderRadius: 20,
            background: "rgba(255,255,255,0.05)", color: actCfg.color,
            border: `1px solid ${actCfg.color}40`,
            fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em"
          }}>
            {actCfg.label}
          </span>
        </div>
      </div>
      <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.5 }}>
        {item.display_note}
      </p>
      {item.themes.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {item.themes.map((t) => (
            <span key={t} style={{
              fontSize: 10, padding: "2px 8px", borderRadius: 6,
              background: "rgba(99,102,241,0.15)", color: "#818cf8",
              border: "1px solid rgba(99,102,241,0.2)"
            }}>
              {THEME_LABELS[t] || t}
            </span>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 16, marginTop: 2 }}>
        <span style={{ fontSize: 10, color: "#334155", fontFamily: "'DM Mono', monospace" }}>
          Skor: <span style={{ color: "#94a3b8" }}>{Math.round(item.score * 100)}%</span>
        </span>
        <span style={{ fontSize: 10, color: "#334155", fontFamily: "'DM Mono', monospace" }}>
          Güven: <span style={{ color: "#94a3b8" }}>{Math.round(item.confidence * 100)}%</span>
        </span>
        {item.severity > 0 && (
          <span style={{ fontSize: 10, color: "#334155", fontFamily: "'DM Mono', monospace" }}>
            Önem: <span style={{ color: item.severity >= 0.7 ? "#f87171" : "#fbbf24" }}>{Math.round(item.severity * 100)}%</span>
          </span>
        )}
      </div>
    </div>
  );
}

function ThemeChart({ themeData }) {
  const max = Math.max(...themeData.map((t) => t.count), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {themeData.map(({ theme, count, avgScore }) => (
        <div key={theme} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, color: "#64748b", width: 140, flexShrink: 0, fontFamily: "'DM Mono', monospace", fontSize: 10 }}>
            {THEME_LABELS[theme] || theme}
          </span>
          <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              width: `${(count / max) * 100}%`,
              height: "100%",
              background: `hsl(${Math.round(avgScore * 120)}, 70%, 55%)`,
              borderRadius: 3,
              transition: "width 0.7s ease",
            }} />
          </div>
          <span style={{ fontSize: 10, color: "#475569", width: 28, textAlign: "right", fontFamily: "'DM Mono', monospace" }}>
            {count}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────

export default function App() {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSurvey, setSelectedSurvey] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [filterSentiment, setFilterSentiment] = useState("all");

  useEffect(() => {
    // Try to load from public/data.csv (Vite / CRA convention)
    fetch("/data.csv")
      .then((r) => {
        if (!r.ok) throw new Error("CSV yüklenemedi");
        return r.text();
      })
      .then((text) => {
        setRawData(parseCSV(text));
        setLoading(false);
      })
      .catch(() => {
        // Fallback: ask user to upload
        setError("CSV dosyası bulunamadı. Lütfen data.csv dosyasını public/ klasörüne koyun.");
        setLoading(false);
      });
  }, []);

  const surveyIds = useMemo(() => {
    const ids = [...new Set(rawData.map((r) => r.survey_id))].sort();
    return ids;
  }, [rawData]);

  const filtered = useMemo(() => {
    return rawData.filter((r) => {
      if (selectedSurvey !== "all" && r.survey_id !== selectedSurvey) return false;
      if (!r.should_display) return false;
      if (filterAction !== "all" && r.action !== filterAction) return false;
      if (filterSentiment !== "all" && r.sentiment !== filterSentiment) return false;
      return true;
    });
  }, [rawData, selectedSurvey, filterAction, filterSentiment]);

  const surveyData = useMemo(() => {
    const scope = selectedSurvey === "all" ? rawData : rawData.filter((r) => r.survey_id === selectedSurvey);
    const displayed = scope.filter((r) => r.should_display);
    const positive = scope.filter((r) => r.sentiment === "positive").length;
    const negative = scope.filter((r) => r.sentiment === "negative").length;
    const neutral = scope.filter((r) => r.sentiment === "neutral").length;
    const avgScore = scope.length ? scope.reduce((a, b) => a + b.score, 0) / scope.length : 0;
    const watchCount = displayed.filter((r) => r.action === "watch").length;
    const escalateCount = displayed.filter((r) => r.action === "escalate").length;

    // Theme frequency
    const themeCounts = {};
    const themeScores = {};
    scope.forEach((r) => {
      r.themes.forEach((t) => {
        themeCounts[t] = (themeCounts[t] || 0) + 1;
        themeScores[t] = (themeScores[t] || []);
        themeScores[t].push(r.score);
      });
    });
    const themeData = Object.entries(themeCounts)
      .map(([theme, count]) => ({
        theme,
        count,
        avgScore: themeScores[theme].reduce((a, b) => a + b, 0) / themeScores[theme].length,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return { total: scope.length, displayed: displayed.length, positive, negative, neutral, avgScore, watchCount, escalateCount, themeData };
  }, [rawData, selectedSurvey]);

  const scoreColor = surveyData.avgScore >= 0.7 ? "#4ade80" : surveyData.avgScore >= 0.4 ? "#fbbf24" : "#f87171";

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#080c14", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 16, animation: "spin 1s linear infinite" }}>◌</div>
          <p style={{ color: "#475569", fontFamily: "'DM Mono', monospace", fontSize: 13 }}>Veriler yükleniyor…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080c14; }
        ::-webkit-scrollbar { width: 4px; } 
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
        select { appearance: none; cursor: pointer; }
        select option { background: #0f172a; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.4s ease forwards; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "#080c14",
        color: "#f8fafc",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        paddingBottom: 60,
      }}>
        {/* Ambient bg */}
        <div style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
          background: "radial-gradient(ellipse 60% 40% at 70% 0%, rgba(99,102,241,0.08) 0%, transparent 60%), radial-gradient(ellipse 40% 50% at 10% 80%, rgba(16,185,129,0.05) 0%, transparent 50%)",
        }} />

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 1 }}>

          {/* Header */}
          <div style={{ padding: "40px 0 32px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
              <div>
                {/* Wordmark */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  {/* Icon mark */}
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="36" height="36" rx="10" fill="url(#iconGrad)"/>
                    <circle cx="18" cy="18" r="7" stroke="white" strokeWidth="2" fill="none" opacity="0.9"/>
                    <circle cx="18" cy="18" r="3" fill="white" opacity="0.95"/>
                    <path d="M18 5 L18 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
                    <path d="M18 28 L18 31" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
                    <path d="M5 18 L8 18" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
                    <path d="M28 18 L31 18" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
                    <defs>
                      <linearGradient id="iconGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#6366f1"/>
                        <stop offset="100%" stopColor="#4f46e5"/>
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Wordmark text */}
                  <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
                    <span style={{
                      fontSize: 9, letterSpacing: "0.25em", color: "#6366f1",
                      textTransform: "uppercase", fontFamily: "'DM Mono', monospace",
                      marginBottom: 3, opacity: 0.8,
                    }}>
                      dendy.ai
                    </span>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 0 }}>
                      <span style={{
                        fontSize: 30, fontWeight: 800, fontFamily: "'Syne', sans-serif",
                        letterSpacing: "-0.03em", color: "#f1f5f9", lineHeight: 1,
                      }}>
                        Ne
                      </span>
                      <span style={{
                        fontSize: 30, fontWeight: 800, fontFamily: "'Syne', sans-serif",
                        letterSpacing: "-0.03em",
                        background: "linear-gradient(135deg, #818cf8 0%, #6366f1 50%, #4f46e5 100%)",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                        lineHeight: 1, margin: "0 4px",
                      }}>
                        Dendy
                      </span>
                      <span style={{
                        fontSize: 30, fontWeight: 800, fontFamily: "'Syne', sans-serif",
                        letterSpacing: "-0.03em", color: "#6366f1", lineHeight: 1,
                      }}>
                        ?
                      </span>
                    </div>
                  </div>
                </div>

                <p style={{ color: "#475569", fontSize: 12, marginTop: 2, fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em" }}>
                  Anket içgörüleri · Yönetici görünümü
                </p>
              </div>

              {/* Survey selector */}
              <div style={{ position: "relative" }}>
                <select
                  value={selectedSurvey}
                  onChange={(e) => { setSelectedSurvey(e.target.value); setFilterAction("all"); setFilterSentiment("all"); }}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#e2e8f0",
                    padding: "10px 40px 10px 16px",
                    borderRadius: 10,
                    fontSize: 13,
                    fontFamily: "'DM Mono', monospace",
                    outline: "none",
                    minWidth: 200,
                  }}
                >
                  <option value="all">Tüm Anketler ({surveyIds.length})</option>
                  {surveyIds.map((id) => (
                    <option key={id} value={id}>
                      Survey #{String(id).slice(-6)}
                    </option>
                  ))}
                </select>
                <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "#475569", pointerEvents: "none", fontSize: 10 }}>▼</span>
              </div>
            </div>
          </div>

          {error && (
            <div style={{
              background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)",
              borderRadius: 12, padding: "16px 20px", marginBottom: 24, color: "#fca5a5", fontSize: 13
            }}>
              ⚠ {error}
            </div>
          )}

          {/* Stats row */}
          <div className="fade-up" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 32 }}>
            <StatCard label="Ortalama Skor" value={`${Math.round(surveyData.avgScore * 100)}%`} sub="Genel duygu skoru" accent={scoreColor} />
            <StatCard label="Toplam Yanıt" value={surveyData.total} sub={`${surveyData.displayed} içgörü gösteriliyor`} />
            <StatCard label="İzleme Listesi" value={surveyData.watchCount} sub="Aksiyon gerektiriyor" accent="#fbbf24" />
            <StatCard label="Risk Bayrağı" value={rawData.filter((r) => r.risk_flag && (selectedSurvey === "all" || r.survey_id === selectedSurvey)).length} sub="Kritik uyarı" accent="#f87171" />
          </div>

          {/* Sentiment bar */}
          <div className="fade-up" style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: "20px 24px", marginBottom: 24
          }}>
            <h3 style={{ fontSize: 11, letterSpacing: "0.1em", color: "#64748b", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>
              Duygu Dağılımı
            </h3>
            <SentimentBar positive={surveyData.positive} negative={surveyData.negative} neutral={surveyData.neutral} />
          </div>

          {/* Two-col: themes + insights */}
          <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, alignItems: "start" }}>

            {/* Themes */}
            <div className="fade-up" style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16, padding: "20px 24px",
            }}>
              <h3 style={{ fontSize: 11, letterSpacing: "0.1em", color: "#64748b", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>
                Tema Analizi
              </h3>
              {surveyData.themeData.length > 0
                ? <ThemeChart themeData={surveyData.themeData} />
                : <p style={{ fontSize: 12, color: "#334155" }}>Bu anket için tema verisi yok.</p>
              }
            </div>

            {/* Insights feed */}
            <div className="fade-up">
              {/* Filters */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                {[["all", "Tümü"], ["watch", "İzle"], ["escalate", "Aksiyon"]].map(([v, l]) => (
                  <button key={v} onClick={() => setFilterAction(v)} style={{
                    padding: "6px 14px", borderRadius: 8, fontSize: 11,
                    background: filterAction === v ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                    border: filterAction === v ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.07)",
                    color: filterAction === v ? "#818cf8" : "#64748b",
                    cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em",
                    transition: "all 0.2s",
                  }}>
                    {l}
                  </button>
                ))}
                <div style={{ width: 1, background: "rgba(255,255,255,0.07)", margin: "0 4px" }} />
                {[["all", "Tüm Duygu"], ["positive", "Olumlu"], ["negative", "Olumsuz"], ["neutral", "Nötr"]].map(([v, l]) => (
                  <button key={v} onClick={() => setFilterSentiment(v)} style={{
                    padding: "6px 14px", borderRadius: 8, fontSize: 11,
                    background: filterSentiment === v ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                    border: filterSentiment === v ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.07)",
                    color: filterSentiment === v ? "#818cf8" : "#64748b",
                    cursor: "pointer", fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em",
                    transition: "all 0.2s",
                  }}>
                    {l}
                  </button>
                ))}
                <span style={{ marginLeft: "auto", fontSize: 11, color: "#334155", fontFamily: "'DM Mono', monospace", alignSelf: "center" }}>
                  {filtered.length} içgörü
                </span>
              </div>

              {/* Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 680, overflowY: "auto", paddingRight: 4 }}>
                {filtered.length === 0 ? (
                  <div style={{
                    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 12, padding: 32, textAlign: "center", color: "#334155", fontSize: 13
                  }}>
                    Bu filtrelerle eşleşen içgörü bulunamadı.
                  </div>
                ) : (
                  filtered.map((item) => <InsightCard key={item.label_id} item={item} />)
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
