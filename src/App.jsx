import { useState, useEffect } from "react";

const SUPABASE_URL = "https://xsgdvhfhibstymoriocw.supabase.co";
const SUPABASE_KEY = "sb_publishable_iJaYFSGQcNbEGdBr8sQC-A_rft4jxhS";
const USER_ID = "drew_kayes";

const api = async (path, method = "GET", body = null) => {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Prefer": method === "POST" ? "resolution=merge-duplicates" : "",
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, opts);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

const DAYS = [
  {
    id: "day1", label: "Day 1", title: "Chest / Shoulders / Tris", color: "#2563eb",
    note: "Bench is the anchor. Log weight every session.",
    exercises: [
      { id: "bench", name: "Flat Barbell Bench Press", sets: 4, reps: "6", note: "Add 5 lbs when all 4 sets hit clean" },
      { id: "incline_db", name: "Incline Dumbbell Press", sets: 3, reps: "10", note: "" },
      { id: "cable_lat", name: "Cable Lateral Raises", sets: 4, reps: "15", note: "Light. Lead with elbow. Pause at top." },
      { id: "ohp", name: "Overhead Dumbbell Press", sets: 3, reps: "10", note: "" },
      { id: "tri_push", name: "Tricep Rope Pushdown", sets: 3, reps: "15", note: "" },
      { id: "calf_d1", name: "Calf Raises (standing)", sets: 4, reps: "15", note: "Full stretch at bottom. Slow negative." },
    ],
  },
  {
    id: "day2", label: "Day 2", title: "Back / Biceps", color: "#7c3aed",
    note: "Incline curl and hammer curl are the arm thickness drivers.",
    exercises: [
      { id: "pullup", name: "Weighted Pull-ups / Lat Pulldown", sets: 4, reps: "10", note: "Full hang at bottom." },
      { id: "cable_row", name: "Seated Cable Row", sets: 4, reps: "12", note: "Elbows tight. Squeeze at peak." },
      { id: "incline_curl", name: "Incline Dumbbell Curl", sets: 3, reps: "12", note: "Long head stretch. Builds peak." },
      { id: "hammer", name: "Hammer Curl", sets: 3, reps: "12", note: "" },
      { id: "reverse_curl", name: "Reverse Curl", sets: 3, reps: "15", note: "Forearm size." },
      { id: "calf_d2", name: "Calf Raises (standing)", sets: 4, reps: "15", note: "Full stretch. Slow negative." },
    ],
  },
  {
    id: "day3", label: "Day 3", title: "Legs", color: "#059669",
    note: "Start light. Form first. Weeks 1-4: hack squat + RDL + calves only.",
    exercises: [
      { id: "hack", name: "Hack Squat", sets: 3, reps: "10", note: "Feet low and close. Full depth.", phase1: true },
      { id: "rdl", name: "Romanian Deadlift", sets: 3, reps: "12", note: "Hips back. Bar drags down legs.", phase1: true },
      { id: "stand_calf", name: "Standing Calf Raise", sets: 5, reps: "15", note: "Heavy. 3-sec negative. Full stretch.", phase1: true },
      { id: "seat_calf", name: "Seated Calf Raise", sets: 3, reps: "20", note: "Hits soleus. Different angle.", phase1: true },
      { id: "leg_press", name: "Leg Press (add wk 5)", sets: 3, reps: "12", note: "Same foot position as hack squat.", phase1: false },
      { id: "lunges", name: "Walking Lunges (add wk 5)", sets: 3, reps: "20", note: "Full stride.", phase1: false },
      { id: "leg_ext", name: "Leg Extension (add wk 6)", sets: 3, reps: "15", note: "Full contraction at top.", phase1: false },
    ],
  },
  {
    id: "day4", label: "Day 4", title: "Swim", color: "#0284c7",
    note: "Keep it. 1-2x per week. Do not trade for a lifting session.",
    swim: true, exercises: [],
  },
  {
    id: "day5", label: "Day 5", title: "Chest / Shoulders / Tris", color: "#2563eb",
    note: "Same bench progression. Arnold press hits all three delt heads.",
    exercises: [
      { id: "bench_d5", name: "Flat Barbell Bench Press", sets: 4, reps: "6", note: "Same progressive overload as Day 1." },
      { id: "cable_fly", name: "Cable Fly / Pec Deck", sets: 3, reps: "12", note: "Full stretch at open position." },
      { id: "arnold", name: "Arnold Press", sets: 3, reps: "10", note: "Full rotation. All three delt heads." },
      { id: "lat_drop", name: "Lateral Raise Dropset", sets: 3, reps: "Failure", note: "Start heavy, drop 3x." },
      { id: "skull", name: "Skull Crushers", sets: 3, reps: "12", note: "Elbows in. Full extension." },
      { id: "calf_d5", name: "Calf Raises (standing)", sets: 4, reps: "15", note: "Full stretch. Slow negative." },
    ],
  },
  {
    id: "day6", label: "Day 6", title: "Back / Biceps", color: "#7c3aed",
    note: "Heaviest row of the week. Face pulls are shoulder health insurance.",
    exercises: [
      { id: "tbar", name: "Barbell / T-Bar Row", sets: 4, reps: "10", note: "Heaviest row of the week." },
      { id: "single_row", name: "Single Arm Dumbbell Row", sets: 3, reps: "12", note: "Full range. Lat stretch at bottom." },
      { id: "face_pull", name: "Face Pulls", sets: 3, reps: "20", note: "Rear delt + rotator cuff. Do not skip." },
      { id: "incline_curl2", name: "Incline Dumbbell Curl", sets: 3, reps: "12", note: "Frequency builds size." },
      { id: "farmer", name: "Farmer Carry (40 yds)", sets: 3, reps: "40 yds", note: "Grip, forearms, traps. Go heavy." },
      { id: "calf_d6", name: "Calf Raises (standing)", sets: 4, reps: "15", note: "Full stretch. Slow negative." },
    ],
  },
  {
    id: "day7", label: "Day 7", title: "Active Recovery", color: "#d97706",
    note: "10-15 min. Directly impacts squat depth and calf flexibility.",
    mobility: true,
    exercises: [
      { id: "couch", name: "Couch Stretch", sets: 1, reps: "2 min/side", note: "Hip flexors. Critical for quad depth." },
      { id: "hip90", name: "90/90 Hip Stretch", sets: 1, reps: "2 min/side", note: "" },
      { id: "ankle", name: "Ankle Circles + Calf Stretch", sets: 1, reps: "2 min", note: "" },
      { id: "band", name: "Band Pull-Aparts", sets: 3, reps: "20", note: "Shoulder joint health." },
    ],
  },
];

function today() { return new Date().toISOString().slice(0, 10); }
function formatDate(d) {
  if (!d) return "";
  const [, m, day] = d.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m)-1]} ${parseInt(day)}`;
}

const G = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    html, body, #root { height: 100%; background: #0f0f13; }
    body { font-family: 'DM Sans', sans-serif; color: #f0f0f0; overflow-x: hidden; }
    input, button { font-family: 'DM Sans', sans-serif; }
    input { outline: none; }
    button { cursor: pointer; }
    button:active { opacity: 0.75; }
    ::-webkit-scrollbar { width: 3px; height: 3px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #2a2a38; border-radius: 2px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    .fadein { animation: fadeIn 0.2s ease both; }
  `}</style>
);

export default function App() {
  const [screen, setScreen] = useState("home");
  const [activeDay, setActiveDay] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [benchLog, setBenchLog] = useState([]);
  const [session, setSession] = useState(null);
  const [activeExercise, setActiveExercise] = useState(0);
  const [swimLog, setSwimLog] = useState({ duration: "", distance: "", notes: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, b] = await Promise.all([
        api(`/workout_sessions?user_id=eq.${USER_ID}&order=date.desc`),
        api(`/bench_log?user_id=eq.${USER_ID}&order=date.asc`),
      ]);
      setSessions(s || []);
      setBenchLog(b || []);
    } catch {
      setError("Could not connect. Check your connection and try again.");
    }
    setLoading(false);
  };

  const startDay = (day) => {
    setActiveDay(day);
    const existing = sessions.find(s => s.day_id === day.id && s.date === today());
    setSession(existing
      ? { ...existing }
      : { id: `${USER_ID}_${day.id}_${today()}`, user_id: USER_ID, day_id: day.id, date: today(), sets: {}, swim_log: null, complete: false }
    );
    setActiveExercise(0);
    setSwimLog({ duration: "", distance: "", notes: "" });
    setScreen("day");
  };

  const updateSet = (exId, setIdx, field, value) => {
    setSession(prev => {
      const sets = { ...prev.sets };
      if (!sets[exId]) sets[exId] = [];
      sets[exId] = [...sets[exId]];
      if (!sets[exId][setIdx]) sets[exId][setIdx] = { weight: "", reps: "" };
      sets[exId][setIdx] = { ...sets[exId][setIdx], [field]: value };
      return { ...prev, sets };
    });
  };

  const saveSession = async () => {
    setSaving(true);
    setError(null);
    try {
      const final = { ...session, complete: true };
      if (activeDay.swim) final.swim_log = swimLog;
      await api("/workout_sessions", "POST", final);
      const benchEx = activeDay.exercises.find(e => e.id === "bench" || e.id === "bench_d5");
      if (benchEx && final.sets[benchEx.id]?.length) {
        const existing = benchLog.find(b => b.date === today() && b.user_id === USER_ID);
        if (existing) {
          await api(`/bench_log?user_id=eq.${USER_ID}&date=eq.${today()}`, "PATCH", { sets: final.sets[benchEx.id] });
        } else {
          await api("/bench_log", "POST", { user_id: USER_ID, date: today(), sets: final.sets[benchEx.id] });
        }
      }
      await loadAll();
      setScreen("home");
      setSession(null);
    } catch {
      setError("Save failed. Check your connection and try again.");
    }
    setSaving(false);
  };

  const getLastWeight = (dayId, exId, setIdx) => {
    const last = sessions
      .filter(s => s.day_id === dayId && s.complete && s.date < today())
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    return last?.sets?.[exId]?.[setIdx]?.weight || "";
  };

  if (loading) return <><G /><Loader /></>;

  if (screen === "bench") return <><G /><BenchScreen benchLog={benchLog} onBack={() => setScreen("home")} /></>;
  if (screen === "history") return <><G /><HistoryScreen sessions={sessions} onBack={() => setScreen("home")} /></>;
  if (screen === "day" && activeDay && session) return (
    <><G /><DayScreen
      day={activeDay} session={session} activeExercise={activeExercise}
      setActiveExercise={setActiveExercise} updateSet={updateSet}
      onSave={saveSession} onBack={() => setScreen("home")}
      getLastWeight={(exId, si) => getLastWeight(activeDay.id, exId, si)}
      swimLog={swimLog} setSwimLog={setSwimLog} saving={saving} error={error}
    /></>
  );

  return <><G /><HomeScreen days={DAYS} sessions={sessions} onSelectDay={startDay} onHistory={() => setScreen("history")} onBench={() => setScreen("bench")} error={error} onRetry={loadAll} /></>;
}

function Loader() {
  return (
    <div style={{ minHeight: "100vh", background: "#0f0f13", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <div style={{ width: 36, height: 36, border: "3px solid #222", borderTop: "3px solid #2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <div style={{ color: "#555", fontSize: 13 }}>Loading...</div>
    </div>
  );
}

function HomeScreen({ days, sessions, onSelectDay, onHistory, onBench, error, onRetry }) {
  const todayStr = today();
  const completedToday = new Set(sessions.filter(s => s.date === todayStr && s.complete).map(s => s.day_id));
  const lastSession = (dayId) => sessions.filter(s => s.day_id === dayId && s.complete).sort((a,b) => b.date.localeCompare(a.date))[0];

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f13", paddingBottom: 48 }}>
      <div style={{ padding: "env(safe-area-inset-top, 32px) 20px 16px", paddingTop: "max(32px, env(safe-area-inset-top))", borderBottom: "1px solid #1a1a22" }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: "#444", textTransform: "uppercase", marginBottom: 4 }}>Drew's</div>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>Training</div>
        <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
      </div>

      {error && (
        <div style={{ margin: "12px 20px 0", background: "#2a0d0d", border: "1px solid #5a1a1a", borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#f87171", fontSize: 13 }}>{error}</span>
          <button onClick={onRetry} style={{ background: "none", border: "1px solid #5a1a1a", borderRadius: 6, color: "#f87171", fontSize: 12, padding: "4px 10px" }}>Retry</button>
        </div>
      )}

      <div style={{ padding: "14px 20px", display: "flex", gap: 10 }}>
        <button onClick={onHistory} style={pill("#1e1e28", "#888")}>History</button>
        <button onClick={onBench} style={pill("#0d1f0d", "#4ade80")}>Bench Tracker</button>
      </div>

      <div style={{ padding: "4px 20px 0" }} className="fadein">
        <div style={{ fontSize: 11, letterSpacing: 2, color: "#333", textTransform: "uppercase", marginBottom: 14 }}>Select Day</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {days.map(day => {
            const done = completedToday.has(day.id);
            const last = lastSession(day.id);
            return (
              <button key={day.id} onClick={() => onSelectDay(day)} style={{
                background: done ? "#0d1f0d" : "#15151e",
                border: `1px solid ${done ? "#1a3a1a" : "#1e1e28"}`,
                borderLeft: `3px solid ${done ? "#4ade80" : day.color}`,
                borderRadius: 10, padding: "15px 16px",
                textAlign: "left", color: "#f0f0f0",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div>
                  <div style={{ fontSize: 11, color: done ? "#4ade80" : day.color, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3, fontFamily: "'DM Mono', monospace" }}>{day.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{day.title}</div>
                  {last && <div style={{ fontSize: 11, color: "#444", marginTop: 3 }}>Last: {formatDate(last.date)}</div>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {done && <span style={{ color: "#4ade80", fontSize: 16 }}>✓</span>}
                  <span style={{ color: "#333", fontSize: 22 }}>›</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DayScreen({ day, session, activeExercise, setActiveExercise, updateSet, onSave, onBack, getLastWeight, swimLog, setSwimLog, saving, error }) {
  const exercises = day.exercises;

  if (day.swim) return (
    <div style={wrap()}>
      <TopBar title={day.title} sub={day.label} color={day.color} onBack={onBack} />
      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        <div style={{ color: "#666", fontSize: 13, marginBottom: 20 }}>{day.note}</div>
        {["duration", "distance", "notes"].map(f => (
          <div key={f} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>{f}</div>
            <input value={swimLog[f]} onChange={e => setSwimLog(p => ({ ...p, [f]: e.target.value }))}
              placeholder={f === "duration" ? "e.g. 45 min" : f === "distance" ? "e.g. 1500m" : "Notes..."}
              style={inp()} />
          </div>
        ))}
        {error && <Err msg={error} />}
      </div>
      <BottomBar><button onClick={onSave} disabled={saving} style={btn(day.color)}>{saving ? "Saving..." : "Save Session"}</button></BottomBar>
    </div>
  );

  if (day.mobility) return (
    <div style={wrap()}>
      <TopBar title={day.title} sub={day.label} color={day.color} onBack={onBack} />
      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        <div style={{ color: "#666", fontSize: 13, marginBottom: 20 }}>{day.note}</div>
        {exercises.map(ex => (
          <div key={ex.id} style={{ background: "#15151e", border: "1px solid #1e1e28", borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{ex.name}</div>
            <div style={{ color: day.color, fontSize: 12, fontFamily: "'DM Mono', monospace", marginTop: 4 }}>{ex.reps}</div>
            {ex.note && <div style={{ color: "#555", fontSize: 12, marginTop: 4 }}>{ex.note}</div>}
          </div>
        ))}
        {error && <Err msg={error} />}
      </div>
      <BottomBar><button onClick={onSave} disabled={saving} style={btn(day.color)}>{saving ? "Saving..." : "Done"}</button></BottomBar>
    </div>
  );

  const ex = exercises[activeExercise];
  const isLate = ex?.phase1 === false;

  return (
    <div style={wrap()}>
      <TopBar title={day.title} sub={`${day.label} · ${activeExercise + 1} of ${exercises.length}`} color={day.color} onBack={onBack} />

      <div style={{ overflowX: "auto", display: "flex", gap: 8, padding: "12px 20px", borderBottom: "1px solid #1a1a22", scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {exercises.map((e, i) => {
          const filled = session.sets[e.id]?.some(s => s?.weight || s?.reps);
          return (
            <button key={e.id} onClick={() => setActiveExercise(i)} style={{
              flexShrink: 0, minWidth: 36, padding: "6px 13px", borderRadius: 20, border: "none",
              fontSize: 12,
              background: i === activeExercise ? day.color : filled ? "#1a2a1a" : "#1e1e28",
              color: i === activeExercise ? "#fff" : filled ? "#4ade80" : "#555",
              fontWeight: i === activeExercise ? 600 : 400,
            }}>{i + 1}</button>
          );
        })}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 0" }} className="fadein">
        <div style={{ fontSize: 11, color: day.color, letterSpacing: 2, textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>
          {ex.sets} sets · {ex.reps} reps
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{ex.name}</div>
        {ex.note && <div style={{ color: "#555", fontSize: 13, marginBottom: isLate ? 8 : 18 }}>{ex.note}</div>}
        {isLate && (
          <div style={{ color: "#d97706", fontSize: 12, background: "#1a150a", border: "1px solid #2a200a", borderRadius: 8, padding: "8px 12px", marginBottom: 16 }}>
            Add in week 5-6 when legs have adapted
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {Array.from({ length: ex.sets }, (_, si) => {
            const setData = session.sets[ex.id]?.[si] || { weight: "", reps: "" };
            const lastWt = getLastWeight(ex.id, si);
            const filled = setData.weight || setData.reps;
            return (
              <div key={si} style={{
                background: filled ? "#0d1a2a" : "#15151e",
                border: `1px solid ${filled ? "#1e3a5a" : "#1e1e28"}`,
                borderRadius: 10, padding: "12px 14px",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: filled ? day.color : "#1e1e28", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: filled ? "#fff" : "#444", flexShrink: 0 }}>{si + 1}</div>
                <div style={{ flex: 1, display: "flex", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: "#444", marginBottom: 5 }}>WEIGHT{lastWt ? ` · last: ${lastWt}` : ""}</div>
                    <input type="number" inputMode="decimal" placeholder={lastWt || "lbs"} value={setData.weight}
                      onChange={e => updateSet(ex.id, si, "weight", e.target.value)} style={inp()} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: "#444", marginBottom: 5 }}>REPS</div>
                    <input type="number" inputMode="numeric" placeholder={ex.reps} value={setData.reps}
                      onChange={e => updateSet(ex.id, si, "reps", e.target.value)} style={inp()} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {error && <Err msg={error} />}
      </div>

      <BottomBar>
        <div style={{ display: "flex", gap: 10 }}>
          {activeExercise > 0 && (
            <button onClick={() => setActiveExercise(p => p - 1)} style={{ ...btn("#1e1e28"), flex: 0.4, color: "#888" }}>← Back</button>
          )}
          {activeExercise < exercises.length - 1 ? (
            <button onClick={() => setActiveExercise(p => p + 1)} style={{ ...btn(day.color), flex: 1 }}>Next →</button>
          ) : (
            <button onClick={onSave} disabled={saving} style={{ ...btn("#16a34a"), flex: 1 }}>{saving ? "Saving..." : "Save Session ✓"}</button>
          )}
        </div>
      </BottomBar>
    </div>
  );
}

function BenchScreen({ benchLog, onBack }) {
  const log = [...benchLog].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div style={wrap()}>
      <TopBar title="Bench Tracker" sub="Goal: Rep 225" color="#4ade80" onBack={onBack} />
      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        <div style={{ background: "#0d1f0d", border: "1px solid #1a3a1a", borderRadius: 10, padding: 16, marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: "#4ade80", letterSpacing: 2, marginBottom: 10, fontFamily: "'DM Mono', monospace" }}>PROGRESSION GUIDE</div>
          {[
            ["Now","185 lbs","4×6 baseline"],
            ["Wks 1-4","190-195","Add 5 when all sets clean"],
            ["Wks 5-8","200-205","Midpoint"],
            ["Wks 9-12","210-215","Approaching 1RM zone"],
            ["Wks 13-16","220","225 single solid"],
            ["Wks 17-20","225","GOAL: Repping 225"],
          ].map(([phase, wt, note], i, arr) => (
            <div key={phase} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: i < arr.length - 1 ? "1px solid #1a2a1a" : "none" }}>
              <div style={{ width: 72, fontSize: 12, color: "#4ade80", fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>{phase}</div>
              <div style={{ width: 64, fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{wt}</div>
              <div style={{ fontSize: 12, color: "#666" }}>{note}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Session Log</div>
        {log.length === 0 && <div style={{ color: "#444", fontSize: 14 }}>No bench sessions yet. Auto-logs from Day 1 and Day 5.</div>}
        {log.map((entry, i) => {
          const topSet = entry.sets?.reduce((best, s) => (parseFloat(s?.weight) || 0) > (parseFloat(best?.weight) || 0) ? s : best, {});
          return (
            <div key={i} style={{ background: "#15151e", border: "1px solid #1e1e28", borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontWeight: 600 }}>{formatDate(entry.date)}</div>
                {topSet?.weight && <div style={{ color: "#4ade80", fontFamily: "'DM Mono', monospace", fontSize: 13 }}>Top: {topSet.weight} × {topSet.reps}</div>}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {entry.sets?.map((s, si) => (
                  <div key={si} style={{ background: "#1e1e28", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontFamily: "'DM Mono', monospace", color: "#666" }}>
                    S{si+1}: {s?.weight || "--"} × {s?.reps || "--"}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HistoryScreen({ sessions, onBack }) {
  const sorted = [...sessions].filter(s => s.complete).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div style={wrap()}>
      <TopBar title="Session History" sub={`${sorted.length} sessions`} color="#888" onBack={onBack} />
      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        {sorted.length === 0 && <div style={{ color: "#444", fontSize: 14 }}>No sessions logged yet.</div>}
        {sorted.map(s => {
          const day = DAYS.find(d => d.id === s.day_id);
          return (
            <div key={s.id} style={{ background: "#15151e", borderLeft: `3px solid ${day?.color || "#444"}`, border: `1px solid #1e1e28`, borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, color: day?.color, letterSpacing: 1, textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 3 }}>{day?.label}</div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{day?.title}</div>
                  <div style={{ color: "#444", fontSize: 12, marginTop: 3 }}>{formatDate(s.date)}</div>
                </div>
                <div style={{ color: "#4ade80", fontSize: 18 }}>✓</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TopBar({ title, sub, color, onBack }) {
  return (
    <div style={{ padding: "max(18px, env(safe-area-inset-top)) 20px 14px", borderBottom: "1px solid #1a1a22", display: "flex", alignItems: "center", gap: 14, flexShrink: 0, background: "#0f0f13" }}>
      <button onClick={onBack} style={{ background: "#1e1e28", border: "none", color: "#666", width: 36, height: 36, borderRadius: 9, fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>‹</button>
      <div>
        <div style={{ fontSize: 11, color, letterSpacing: 2, textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>{sub}</div>
        <div style={{ fontSize: 17, fontWeight: 700 }}>{title}</div>
      </div>
    </div>
  );
}

function BottomBar({ children }) {
  return (
    <div style={{ padding: "12px 20px", paddingBottom: "max(20px, env(safe-area-inset-bottom))", borderTop: "1px solid #1a1a22", background: "#0f0f13", flexShrink: 0 }}>
      {children}
    </div>
  );
}

function Err({ msg }) {
  return <div style={{ background: "#2a0d0d", border: "1px solid #5a1a1a", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13, marginBottom: 16 }}>{msg}</div>;
}

const wrap = () => ({ minHeight: "100vh", minHeight: "100dvh", background: "#0f0f13", display: "flex", flexDirection: "column" });
const inp = () => ({ background: "#1e1e28", border: "1px solid #2a2a38", borderRadius: 8, color: "#f0f0f0", fontSize: 16, padding: "10px 12px", width: "100%", fontFamily: "'DM Mono', monospace" });
const btn = (bg) => ({ background: bg, border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 600, padding: 15, width: "100%" });
const pill = (bg, color) => ({ background: bg, border: "1px solid #2a2a38", borderRadius: 20, color, fontSize: 12, fontWeight: 500, padding: "7px 16px" });
