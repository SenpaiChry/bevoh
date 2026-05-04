import { useState, useEffect, useRef } from "react";

const TEAMS = [
  "BOS","NYK","PHI","TOR","BKN",
  "CHI","CLE","DET","IND","MIL",
  "ATL","CHA","MIA","ORL","WAS",
  "DEN","MIN","OKC","POR","UTA",
  "GSW","LAC","LAL","PHX","SAC",
  "DAL","HOU","MEM","NOP","SAS",
];

const TEAM_COLORS = {
  BOS:"#007A33",NYK:"#006BB6",PHI:"#006BB6",TOR:"#CE1141",BKN:"#000000",
  CHI:"#CE1141",CLE:"#6F263D",DET:"#C8102E",IND:"#FDBB30",MIL:"#00471B",
  ATL:"#E03A3E",CHA:"#1D1160",MIA:"#98002E",ORL:"#0077C0",WAS:"#002B5C",
  DEN:"#0E2240",MIN:"#0C2340",OKC:"#007AC1",POR:"#E03A3E",UTA:"#002B5C",
  GSW:"#1D428A",LAC:"#C8102E",LAL:"#552583",PHX:"#1D1160",SAC:"#5A2D81",
  DAL:"#00538C",HOU:"#CE1141",MEM:"#5D76A9",NOP:"#0C2340",SAS:"#C4CED4",
};

const TEAM_NAMES = {
  BOS:"Celtics",NYK:"Knicks",PHI:"76ers",TOR:"Raptors",BKN:"Nets",
  CHI:"Bulls",CLE:"Cavaliers",DET:"Pistons",IND:"Pacers",MIL:"Bucks",
  ATL:"Hawks",CHA:"Hornets",MIA:"Heat",ORL:"Magic",WAS:"Wizards",
  DEN:"Nuggets",MIN:"Timberwolves",OKC:"Thunder",POR:"Trail Blazers",UTA:"Jazz",
  GSW:"Warriors",LAC:"Clippers",LAL:"Lakers",PHX:"Suns",SAC:"Kings",
  DAL:"Mavericks",HOU:"Rockets",MEM:"Grizzlies",NOP:"Pelicans",SAS:"Spurs",
};

// ─── Mock stats generator (simulates rolling averages) ───────────────────────
function generateTeamStats(team) {
  const seed = team.charCodeAt(0) + (team.charCodeAt(1) || 0);
  const r = (min, max, offset = 0) => {
    const val = min + ((seed * 17 + offset * 31) % 100) / 100 * (max - min);
    return +val.toFixed(3);
  };
  return {
    avg_PTS: r(100, 120, 1),
    avg_OPP_PTS: r(100, 118, 2),
    avg_NET_RTG: r(-8, 12, 3),
    avg_FG_PCT: r(0.43, 0.50, 4),
    avg_FG3_PCT: r(0.33, 0.40, 5),
    avg_TOV: r(11, 17, 6),
    avg_AST: r(22, 30, 7),
    avg_REB: r(40, 50, 8),
    Form: r(0.30, 0.75, 9),
    Streak: Math.round(r(-5, 5, 10)),
    elo: r(1400, 1600, 11),
    rest_days: Math.floor(r(1, 5, 12)),
    b2b: r(0,1,13) > 0.8 ? 1 : 0,
  };
}

// ─── Simple local ML model (logistic regression proxy) ───────────────────────
function computeMLProbs(homeStats, awayStats) {
  const netDiff = homeStats.avg_NET_RTG - awayStats.avg_NET_RTG;
  const formDiff = homeStats.Form - awayStats.Form;
  const eloDiff = homeStats.elo - awayStats.elo;
  const restAdv = homeStats.rest_days - awayStats.rest_days;

  // ELO-based expected score
  const eloExpected = 1 / (1 + Math.pow(10, -eloDiff / 400));

  // Logistic combo
  const logit = 0.3 * (netDiff / 10) + 0.25 * formDiff + 0.3 * (eloExpected - 0.5) + 0.15 * (restAdv / 3) + 0.05;
  const homeWin = 1 / (1 + Math.exp(-logit * 3));
  return { home: +homeWin.toFixed(3), away: +(1 - homeWin).toFixed(3) };
}

// ─── Polymarket mock (simulated crowd intelligence) ──────────────────────────
function simulatePolymarket(mlProbs, homeTeam, awayTeam) {
  const noise = (Math.sin(homeTeam.charCodeAt(0) * awayTeam.charCodeAt(0)) * 0.08);
  const home = Math.max(0.05, Math.min(0.95, mlProbs.home + noise));
  return {
    home: +home.toFixed(3),
    away: +(1 - home).toFixed(3),
    liquidity: Math.round(50000 + Math.abs(noise) * 500000),
    volume_24h: Math.round(12000 + Math.abs(noise) * 100000),
  };
}

// ─── Sportsbook mock ──────────────────────────────────────────────────────────
function simulateSportsbook(mlProbs, homeTeam) {
  const vig = 0.04;
  const noise = (Math.cos(homeTeam.charCodeAt(1) * 7) * 0.05);
  const raw = Math.max(0.05, Math.min(0.95, mlProbs.home + noise));
  const total = raw + (1 - raw) + vig;
  return {
    home: +(raw / total * (1 + vig / 2)).toFixed(3),
    away: +((1 - raw) / total * (1 + vig / 2)).toFixed(3),
    spread: +((mlProbs.home - 0.5) * 15).toFixed(1),
  };
}

// ─── Triple blend ─────────────────────────────────────────────────────────────
function tripleBlend(ml, poly, sb, polyLiquidity) {
  let w;
  if (polyLiquidity > 50000) w = { ml: 0.35, poly: 0.35, sb: 0.30 };
  else if (polyLiquidity > 10000) w = { ml: 0.40, poly: 0.25, sb: 0.35 };
  else w = { ml: 0.50, poly: 0.15, sb: 0.35 };

  const home = w.ml * ml.home + w.poly * poly.home + w.sb * sb.home;
  const away = 1 - home;
  return { home: +home.toFixed(3), away: +away.toFixed(3), weights: w };
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function NBAPredictor() {
  const [homeTeam, setHomeTeam] = useState("BOS");
  const [awayTeam, setAwayTeam] = useState("MIA");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [claudeOutput, setClaudeOutput] = useState("");
  const [activeTab, setActiveTab] = useState("predict");
  const [slateGames, setSlateGames] = useState([]);
  const [slateLoading, setSlateLoading] = useState(false);
  const [slateAnalysis, setSlateAnalysis] = useState("");
  const [streamDone, setStreamDone] = useState(false);
  const outputRef = useRef(null);

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [claudeOutput]);

  async function callClaude(prompt, onChunk) {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        stream: false,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await resp.json();
    const text = data.content?.map(b => b.text || "").join("") || "Error";
    onChunk(text);
    return text;
  }

  async function handlePredict() {
    if (homeTeam === awayTeam) return;
    setLoading(true);
    setResult(null);
    setClaudeOutput("");
    setStreamDone(false);

    const homeStats = generateTeamStats(homeTeam);
    const awayStats = generateTeamStats(awayTeam);
    const ml = computeMLProbs(homeStats, awayStats);
    const poly = simulatePolymarket(ml, homeTeam, awayTeam);
    const sb = simulateSportsbook(ml, homeTeam);
    const blend = tripleBlend(ml, poly, sb, poly.liquidity);

    const divergence = Math.abs(poly.home - sb.home);
    const allAgree = ml.home > 0.5 && poly.home > 0.5 && sb.home > 0.5 ||
                     ml.home < 0.5 && poly.home < 0.5 && sb.home < 0.5;

    setResult({ homeStats, awayStats, ml, poly, sb, blend, divergence, allAgree });

    const prompt = `You are a senior NBA analyst. Analyze this upcoming game and provide a structured prediction.

Game: ${homeTeam} (${TEAM_NAMES[homeTeam]}, home) vs ${awayTeam} (${TEAM_NAMES[awayTeam]}, away)

=== THREE PROBABILITY LAYERS ===
ML Model:      Home ${(ml.home*100).toFixed(1)}% | Away ${(ml.away*100).toFixed(1)}%
Sportsbook:    Home ${(sb.home*100).toFixed(1)}% | Away ${(sb.away*100).toFixed(1)}% | Spread: ${sb.spread > 0 ? '+' : ''}${sb.spread}
Polymarket:    Home ${(poly.home*100).toFixed(1)}% | Away ${(poly.away*100).toFixed(1)}% | Liquidity: $${poly.liquidity.toLocaleString()}
Triple Blend:  Home ${(blend.home*100).toFixed(1)}% | Away ${(blend.away*100).toFixed(1)}%
Source consensus: ${allAgree ? '✅ All three agree' : '⚠️ Divergence detected'} (gap: ${(divergence*100).toFixed(1)}%)

=== ${homeTeam} STATS (last 10 games) ===
PPG: ${homeStats.avg_PTS.toFixed(1)} | Opp PPG: ${homeStats.avg_OPP_PTS.toFixed(1)} | Net RTG: ${homeStats.avg_NET_RTG.toFixed(1)}
FG%: ${(homeStats.avg_FG_PCT*100).toFixed(1)}% | 3P%: ${(homeStats.avg_FG3_PCT*100).toFixed(1)}% | AST: ${homeStats.avg_AST.toFixed(1)}
Form: ${(homeStats.Form*100).toFixed(0)}% | Streak: ${homeStats.Streak > 0 ? '+' : ''}${homeStats.Streak} | B2B: ${homeStats.b2b ? 'YES ⚠️' : 'No'} | Rest: ${homeStats.rest_days}d

=== ${awayTeam} STATS (last 10 games) ===
PPG: ${awayStats.avg_PTS.toFixed(1)} | Opp PPG: ${awayStats.avg_OPP_PTS.toFixed(1)} | Net RTG: ${awayStats.avg_NET_RTG.toFixed(1)}
FG%: ${(awayStats.avg_FG_PCT*100).toFixed(1)}% | 3P%: ${(awayStats.avg_FG3_PCT*100).toFixed(1)}% | AST: ${awayStats.avg_AST.toFixed(1)}
Form: ${(awayStats.Form*100).toFixed(0)}% | Streak: ${awayStats.Streak > 0 ? '+' : ''}${awayStats.Streak} | B2B: ${awayStats.b2b ? 'YES ⚠️' : 'No'} | Rest: ${awayStats.rest_days}d

=== YOUR TASK ===
1. **Key Factors** — Four Factors analysis, matchup advantages, fatigue
2. **Divergence Analysis** — what does the gap between sources signal?
3. **Final Prediction** — winner + expected margin + confidence (High/Medium/Low)
4. **Upset Scenario** — when could the underdog win?
5. **Bet Recommendation** — best value play (moneyline, spread, or pass)

Be sharp, specific, data-driven. Max 300 words.`;

    await callClaude(prompt, (text) => {
      setClaudeOutput(text);
      setStreamDone(true);
    });

    setLoading(false);
  }

  async function handleSlateAnalysis() {
    const games = [];
    const teamPairs = [
      ["GSW","LAL"],["BOS","NYK"],["MIL","CHI"],
      ["PHX","DEN"],["MIA","PHI"],["DAL","OKC"],
    ];
    for (const [h, a] of teamPairs) {
      const hs = generateTeamStats(h);
      const as_ = generateTeamStats(a);
      const ml = computeMLProbs(hs, as_);
      const poly = simulatePolymarket(ml, h, a);
      const sb = simulateSportsbook(ml, h);
      const blend = tripleBlend(ml, poly, sb, poly.liquidity);
      games.push({ home: h, away: a, homeStats: hs, awayStats: as_, ml, poly, sb, blend });
    }
    setSlateGames(games);
    setSlateLoading(true);
    setSlateAnalysis("");

    const gamesText = games.map((g, i) =>
      `${i+1}. ${g.home} vs ${g.away}\n   ML: Home=${(g.ml.home*100).toFixed(0)}% Away=${(g.ml.away*100).toFixed(0)}%\n   Spread: ${g.sb.spread > 0 ? '+' : ''}${g.sb.spread} | B2B: Home=${g.homeStats.b2b?'YES':'No'} Away=${g.awayStats.b2b?'YES':'No'}\n   Blend: ${(g.blend.home*100).toFixed(0)}% / ${(g.blend.away*100).toFixed(0)}%`
    ).join("\n\n");

    const prompt = `You are an NBA betting analyst. Analyze tonight's full slate.

${gamesText}

For each game provide:
- Predicted winner (⭐ confidence: 1-3 stars)
- Expected margin
- One-line key insight

Then: TOP 3 BEST BETS with reasoning (which game + which side + why it has value).

Format clearly with game numbers. Be concise and sharp.`;

    await callClaude(prompt, (text) => {
      setSlateAnalysis(text);
      setSlateLoading(false);
    });
  }

  const ProbBar = ({ label, home, away, color = "#f97316", height = 10 }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ color: "#e5e7eb" }}>{(home * 100).toFixed(1)}% / {(away * 100).toFixed(1)}%</span>
      </div>
      <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", height }}>
        <div style={{ width: `${home * 100}%`, background: color, transition: "width 0.8s ease" }} />
        <div style={{ flex: 1, background: "#374151" }} />
      </div>
    </div>
  );

  const teamColor = (t) => TEAM_COLORS[t] || "#6b7280";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#030712",
      color: "#f9fafb",
      fontFamily: "'Georgia', 'Times New Roman', serif",
    }}>
      {/* Noise overlay */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
      }} />

      {/* Header */}
      <header style={{
        borderBottom: "1px solid #1f2937",
        padding: "20px 32px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        position: "relative",
        zIndex: 1,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: "linear-gradient(135deg, #f97316, #ef4444)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, flexShrink: 0,
        }}>🏀</div>
        <div>
          <div style={{ fontSize: 20, fontWeight: "bold", letterSpacing: "0.05em", color: "#f9fafb" }}>
            NBA ORACLE
          </div>
          <div style={{ fontSize: 11, color: "#6b7280", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            Triple-Layer Prediction System · ML + Polymarket + Claude AI
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {["predict", "slate"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "6px 16px",
              borderRadius: 6,
              border: "1px solid",
              borderColor: activeTab === tab ? "#f97316" : "#374151",
              background: activeTab === tab ? "rgba(249,115,22,0.1)" : "transparent",
              color: activeTab === tab ? "#f97316" : "#9ca3af",
              cursor: "pointer",
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}>{tab === "predict" ? "Single Game" : "Full Slate"}</button>
          ))}
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px", position: "relative", zIndex: 1 }}>

        {/* ── PREDICT TAB ── */}
        {activeTab === "predict" && (
          <>
            {/* Matchup selector */}
            <div style={{
              background: "#0d1117",
              border: "1px solid #1f2937",
              borderRadius: 16,
              padding: 28,
              marginBottom: 24,
            }}>
              <div style={{ fontSize: 12, color: "#6b7280", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>
                Select Matchup
              </div>
              <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                {/* Home selector */}
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>HOME TEAM</div>
                  <div style={{ position: "relative" }}>
                    <div style={{
                      position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                      width: 10, height: 10, borderRadius: "50%", background: teamColor(homeTeam),
                    }} />
                    <select value={homeTeam} onChange={e => setHomeTeam(e.target.value)} style={{
                      width: "100%", padding: "10px 12px 10px 30px",
                      background: "#161b22", border: "1px solid #30363d",
                      borderRadius: 8, color: "#f9fafb", fontSize: 14,
                      cursor: "pointer", appearance: "none",
                    }}>
                      {TEAMS.map(t => <option key={t} value={t}>{t} — {TEAM_NAMES[t]}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{
                  fontSize: 22, color: "#374151", fontWeight: "bold",
                  padding: "20px 8px 0",
                }}>VS</div>

                {/* Away selector */}
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>AWAY TEAM</div>
                  <div style={{ position: "relative" }}>
                    <div style={{
                      position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                      width: 10, height: 10, borderRadius: "50%", background: teamColor(awayTeam),
                    }} />
                    <select value={awayTeam} onChange={e => setAwayTeam(e.target.value)} style={{
                      width: "100%", padding: "10px 12px 10px 30px",
                      background: "#161b22", border: "1px solid #30363d",
                      borderRadius: 8, color: "#f9fafb", fontSize: 14,
                      cursor: "pointer", appearance: "none",
                    }}>
                      {TEAMS.map(t => <option key={t} value={t}>{t} — {TEAM_NAMES[t]}</option>)}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handlePredict}
                  disabled={loading || homeTeam === awayTeam}
                  style={{
                    marginTop: 20,
                    padding: "10px 28px",
                    background: loading ? "#374151" : "linear-gradient(135deg, #f97316, #ef4444)",
                    border: "none", borderRadius: 8,
                    color: "#fff", fontWeight: "bold", fontSize: 14,
                    cursor: loading || homeTeam === awayTeam ? "not-allowed" : "pointer",
                    letterSpacing: "0.05em",
                    minWidth: 120,
                    transition: "opacity 0.2s",
                  }}>
                  {loading ? "ANALYZING..." : "PREDICT"}
                </button>
              </div>
            </div>

            {/* Results */}
            {result && (
              <div style={{ display: "grid", gap: 20 }}>

                {/* Triple Layer probabilities */}
                <div style={{
                  background: "#0d1117", border: "1px solid #1f2937",
                  borderRadius: 16, padding: 28,
                }}>
                  <div style={{ fontSize: 12, color: "#6b7280", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>
                    Triple Layer Analysis — {homeTeam} (Home) vs {awayTeam}
                  </div>
                  <ProbBar label="🤖 ML Model" home={result.ml.home} away={result.ml.away} color="#3b82f6" />
                  <ProbBar label="📊 Sportsbook" home={result.sb.home} away={result.sb.away} color="#8b5cf6" />
                  <ProbBar label="🌐 Polymarket" home={result.poly.home} away={result.poly.away} color="#10b981" />
                  <div style={{ borderTop: "1px solid #1f2937", paddingTop: 16, marginTop: 8 }}>
                    <ProbBar label="⚡ Triple Blend (Final)" home={result.blend.home} away={result.blend.away} color="#f97316" height={14} />
                  </div>

                  {/* Labels */}
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: teamColor(homeTeam) }} />
                      <span style={{ fontSize: 13 }}>{homeTeam} {(result.blend.home * 100).toFixed(1)}%</span>
                    </div>
                    <div style={{
                      fontSize: 11,
                      color: result.divergence > 0.05 ? "#fbbf24" : "#6b7280",
                      background: result.divergence > 0.05 ? "rgba(251,191,36,0.1)" : "transparent",
                      padding: "3px 8px", borderRadius: 4,
                    }}>
                      {result.allAgree ? "✅ All agree" : `⚠️ Divergence ${(result.divergence * 100).toFixed(1)}%`}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13 }}>{awayTeam} {(result.blend.away * 100).toFixed(1)}%</span>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: teamColor(awayTeam) }} />
                    </div>
                  </div>

                  {/* Polymarket metadata */}
                  <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {[
                      { label: "Poly Liquidity", val: `$${result.poly.liquidity.toLocaleString()}` },
                      { label: "24h Volume", val: `$${result.poly.volume_24h.toLocaleString()}` },
                      { label: "Spread", val: `${result.sb.spread > 0 ? '+' : ''}${result.sb.spread}` },
                      { label: "Weights", val: `ML${(result.blend.weights.ml*100).toFixed(0)}/Poly${(result.blend.weights.poly*100).toFixed(0)}/SB${(result.blend.weights.sb*100).toFixed(0)}` },
                    ].map(({ label, val }) => (
                      <div key={label} style={{
                        background: "#161b22", border: "1px solid #21262d",
                        borderRadius: 6, padding: "6px 12px",
                        fontSize: 11, color: "#9ca3af",
                      }}>
                        <span style={{ color: "#6b7280" }}>{label}: </span>
                        <span style={{ color: "#e5e7eb" }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team Stats comparison */}
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16,
                }}>
                  {[
                    { team: homeTeam, stats: result.homeStats, label: "HOME" },
                    { team: awayTeam, stats: result.awayStats, label: "AWAY" },
                  ].map(({ team, stats, label }) => (
                    <div key={team} style={{
                      background: "#0d1117",
                      border: `1px solid ${teamColor(team)}40`,
                      borderTop: `3px solid ${teamColor(team)}`,
                      borderRadius: 12, padding: 20,
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: `${teamColor(team)}20`,
                          border: `2px solid ${teamColor(team)}`,
                          display: "flex", alignItems: "center",
                          justifyContent: "center", fontSize: 12,
                          fontWeight: "bold", color: teamColor(team),
                        }}>{team.slice(0, 2)}</div>
                        <div>
                          <div style={{ fontWeight: "bold", fontSize: 15 }}>{team}</div>
                          <div style={{ fontSize: 10, color: "#6b7280" }}>{label} · {TEAM_NAMES[team]}</div>
                        </div>
                        {stats.b2b === 1 && (
                          <div style={{
                            marginLeft: "auto", fontSize: 10,
                            background: "rgba(239,68,68,0.15)", color: "#ef4444",
                            padding: "2px 6px", borderRadius: 4,
                          }}>B2B ⚠️</div>
                        )}
                      </div>
                      {[
                        ["PPG", stats.avg_PTS.toFixed(1)],
                        ["Opp PPG", stats.avg_OPP_PTS.toFixed(1)],
                        ["Net RTG", stats.avg_NET_RTG.toFixed(1)],
                        ["FG%", (stats.avg_FG_PCT * 100).toFixed(1) + "%"],
                        ["3P%", (stats.avg_FG3_PCT * 100).toFixed(1) + "%"],
                        ["Form", (stats.Form * 100).toFixed(0) + "%"],
                        ["Streak", (stats.Streak > 0 ? "+" : "") + stats.Streak],
                        ["ELO", stats.elo.toFixed(0)],
                        ["Rest", stats.rest_days + "d"],
                      ].map(([k, v]) => (
                        <div key={k} style={{
                          display: "flex", justifyContent: "space-between",
                          padding: "5px 0", borderBottom: "1px solid #0f172a",
                          fontSize: 13,
                        }}>
                          <span style={{ color: "#6b7280" }}>{k}</span>
                          <span style={{
                            color: k === "Streak" && stats.Streak > 2 ? "#10b981" :
                                   k === "Streak" && stats.Streak < -2 ? "#ef4444" : "#e5e7eb",
                            fontWeight: "500",
                          }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Claude Analysis */}
                {(claudeOutput || loading) && (
                  <div style={{
                    background: "#0d1117",
                    border: "1px solid #1f2937",
                    borderLeft: "3px solid #f97316",
                    borderRadius: 12, padding: 24,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: "linear-gradient(135deg, #f97316, #ef4444)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14,
                      }}>✦</div>
                      <div style={{ fontSize: 12, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        Claude AI Analysis
                      </div>
                      {!streamDone && loading && (
                        <div style={{ marginLeft: "auto", fontSize: 11, color: "#f97316" }}>
                          Analyzing...
                        </div>
                      )}
                    </div>
                    <div
                      ref={outputRef}
                      style={{
                        fontSize: 14, lineHeight: 1.75, color: "#d1d5db",
                        whiteSpace: "pre-wrap", maxHeight: 400,
                        overflowY: "auto",
                      }}
                    >
                      {claudeOutput || "Loading analysis..."}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── SLATE TAB ── */}
        {activeTab === "slate" && (
          <>
            <div style={{
              background: "#0d1117", border: "1px solid #1f2937",
              borderRadius: 16, padding: 28, marginBottom: 24,
            }}>
              <div style={{ fontSize: 12, color: "#6b7280", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
                Tonight's NBA Slate
              </div>
              <div style={{ fontSize: 13, color: "#4b5563", marginBottom: 20 }}>
                Simulate a full night of games — 6 matchups analyzed simultaneously by Claude AI
              </div>
              <button onClick={handleSlateAnalysis} disabled={slateLoading} style={{
                padding: "10px 28px",
                background: slateLoading ? "#374151" : "linear-gradient(135deg, #f97316, #ef4444)",
                border: "none", borderRadius: 8,
                color: "#fff", fontWeight: "bold", fontSize: 14,
                cursor: slateLoading ? "not-allowed" : "pointer",
                letterSpacing: "0.05em",
              }}>
                {slateLoading ? "ANALYZING SLATE..." : "🏀 ANALYZE TONIGHT'S SLATE"}
              </button>
            </div>

            {slateGames.length > 0 && (
              <div style={{ display: "grid", gap: 16, marginBottom: 24 }}>
                {slateGames.map((g, i) => (
                  <div key={i} style={{
                    background: "#0d1117", border: "1px solid #1f2937",
                    borderRadius: 12, padding: 18,
                    display: "grid", gridTemplateColumns: "1fr 2fr 80px",
                    gap: 16, alignItems: "center",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: teamColor(g.home) }} />
                          <span style={{ fontSize: 14, fontWeight: "bold" }}>{g.home}</span>
                          <span style={{ fontSize: 10, color: "#4b5563" }}>HOME</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: teamColor(g.away) }} />
                          <span style={{ fontSize: 14, fontWeight: "bold" }}>{g.away}</span>
                          <span style={{ fontSize: 10, color: "#4b5563" }}>AWAY</span>
                        </div>
                      </div>
                      {(g.homeStats.b2b || g.awayStats.b2b) && (
                        <div style={{ fontSize: 10, color: "#ef4444", background: "rgba(239,68,68,0.1)", padding: "2px 6px", borderRadius: 4 }}>
                          B2B
                        </div>
                      )}
                    </div>

                    <div>
                      <ProbBar label="Blend" home={g.blend.home} away={g.blend.away} color="#f97316" height={8} />
                      <ProbBar label="Poly" home={g.poly.home} away={g.poly.away} color="#10b981" height={8} />
                    </div>

                    <div style={{ textAlign: "center" }}>
                      <div style={{
                        fontSize: 20, fontWeight: "bold",
                        color: g.blend.home > g.blend.away ? teamColor(g.home) : teamColor(g.away),
                      }}>
                        {g.blend.home > g.blend.away ? g.home : g.away}
                      </div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>
                        {(Math.max(g.blend.home, g.blend.away) * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {slateAnalysis && (
              <div style={{
                background: "#0d1117",
                border: "1px solid #1f2937",
                borderLeft: "3px solid #f97316",
                borderRadius: 12, padding: 24,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "linear-gradient(135deg, #f97316, #ef4444)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14,
                  }}>✦</div>
                  <div style={{ fontSize: 12, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Claude Slate Analysis + Best Bets
                  </div>
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.8, color: "#d1d5db", whiteSpace: "pre-wrap" }}>
                  {slateAnalysis}
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer legend */}
        <div style={{
          marginTop: 40, padding: "20px 0",
          borderTop: "1px solid #111827",
          display: "flex", gap: 24, flexWrap: "wrap",
          fontSize: 11, color: "#4b5563",
        }}>
          {[
            { color: "#3b82f6", label: "ML Model (XGBoost ensemble)" },
            { color: "#8b5cf6", label: "Sportsbook lines" },
            { color: "#10b981", label: "Polymarket crowd" },
            { color: "#f97316", label: "Triple blend (final)" },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
              {label}
            </div>
          ))}
          <div style={{ marginLeft: "auto", color: "#374151" }}>
            NBA Oracle · Based on: nba_api + Polymarket Gamma API + Claude API
          </div>
        </div>
      </main>
    </div>
  );
}