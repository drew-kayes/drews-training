import { useState, useEffect, useRef } from "react";

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
  if (!res.ok) throw new Error(await res.text());
  const t = await res.text();
  return t ? JSON.parse(t) : null;
};

// 16-week block, one bench session per week, off a 215 lb baseline.
const BENCH_PROGRAM = [
  { week: 1,  phase: "Volume",   sets: 4, reps: 8, weight: 140, note: "Block starts here. 65% of 215. Should feel easy, that's the point." },
  { week: 2,  phase: "Volume",   sets: 4, reps: 8, weight: 145, note: "" },
  { week: 3,  phase: "Volume",   sets: 4, reps: 8, weight: 150, note: "Top of the volume phase. Bar speed still fast on every rep." },
  { week: 4,  phase: "Volume",   sets: 4, reps: 6, weight: 155, note: "Reps drop, weight climbs. Transition week." },
  { week: 5,  phase: "Strength", sets: 5, reps: 5, weight: 160, note: "Fives begin. Rest 2-3 min between sets." },
  { week: 6,  phase: "Strength", sets: 5, reps: 5, weight: 165, note: "" },
  { week: 7,  phase: "Strength", sets: 5, reps: 5, weight: 170, note: "Last heavy week before the deload. Grind here is acceptable, form breakdown is not." },
  { week: 8,  phase: "Deload",   sets: 3, reps: 5, weight: 150, note: "Deload. Back off and let shoulders and elbows recover." },
  { week: 9,  phase: "Peak",     sets: 4, reps: 3, weight: 180, note: "Triples. 84% of baseline." },
  { week: 10, phase: "Peak",     sets: 4, reps: 3, weight: 185, note: "" },
  { week: 11, phase: "Peak",     sets: 4, reps: 3, weight: 190, note: "88%. Heaviest triples of the block." },
  { week: 12, phase: "Deload",   sets: 3, reps: 3, weight: 165, note: "Second deload. Do not talk yourself into more." },
  { week: 13, phase: "Test",     sets: 3, reps: 2, weight: 195, note: "Doubles. Peaking begins." },
  { week: 14, phase: "Test",     sets: 3, reps: 1, weight: 205, note: "Singles at 95%." },
  { week: 15, phase: "Test",     sets: 2, reps: 1, weight: 215, note: "Old 1RM as a working single." },
  { week: 16, phase: "Test",     sets: 1, reps: 1, weight: 235, note: "Test day. Work up and take 235. Take 240 if it moves clean." },
];

const WARMUP = [
  { id: "w_couch", name: "Couch Stretch", reps: "1 min/side" },
  { id: "w_9090", name: "90/90 Hip Stretch", reps: "1 min/side" },
  { id: "w_ankle", name: "Ankle Circles", reps: "30 sec/side" },
  { id: "w_shoulder", name: "Shoulder Pass-Throughs", reps: "15 reps" },
  { id: "w_arm", name: "Arm Circles (fwd + back)", reps: "30 sec each" },
  { id: "w_catcow", name: "Cat-Cow", reps: "10 reps" },
  { id: "w_wgs", name: "World's Greatest Stretch", reps: "5 reps/side" },
];

// Ramp for programmed bench warmup sets, applied against the day's prescribed weight.
const BENCH_WARMUP_RAMP = [
  { pct: 0.5, reps: 8 },
  { pct: 0.7, reps: 5 },
  { pct: 0.85, reps: 3 },
];

// Ramp for any other exercise carrying warmup sets (sled press).
const GENERAL_WARMUP_RAMP = [
  { pct: 0.4, reps: 12 },
  { pct: 0.7, reps: 10 },
  { pct: 0.85, reps: 8 },
];

function stretchLink(name) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(name + " stretch tutorial")}`;
}

function exerciseLink(ex) {
  const q = ex.videoQuery || `${ex.name} proper form`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}

const DEFAULT_DAYS = [
  {
    id: "day1", label: "Monday", title: "Chest / Shoulders / Tris", color: "#2563eb",
    note: "Bench follows the 16-week program. Everything after it supports the press.",
    exercises: [
      { id: "bench", name: "Flat Barbell Bench Press", sets: 4, reps: "8", weight: 140, note: "Weight comes from the bench program above.", programmed: true, warmupSets: 3 },
      { id: "incline_db", name: "Incline Dumbbell Press", sets: 3, reps: "10", weight: 50, note: "Weight is per dumbbell.", videoQuery: "incline dumbbell press proper form" },
      { id: "landmine", name: "Single-Arm Landmine Press", sets: 3, reps: "8", weight: 45, note: "Per side. Weight = plates on the bar end, not counting the bar.", videoQuery: "single arm landmine press form" },
      { id: "cable_lat", name: "Cable Lateral Raise", sets: 3, reps: "15", weight: 15, note: "Light. Lead with the elbow. Pause at the top.", videoQuery: "cable lateral raise form" },
      { id: "close_grip", name: "Close-Grip Bench Press", sets: 3, reps: "8", weight: 135, note: "Hands shoulder-width. Elbows tucked.", videoQuery: "close grip bench press form" },
      { id: "oh_rope", name: "Overhead Rope Tricep Extension", sets: 3, reps: "12", weight: 40, note: "Long head. Full stretch behind the head.", videoQuery: "overhead rope tricep extension form" },
      { id: "kickback", name: "Single-Arm Cable Kickback", sets: 2, reps: "15", weight: 15, note: "Per side. Slow negative, squeeze at lockout.", videoQuery: "single arm cable tricep kickback form" },
      { id: "calf_d1", name: "Seated Calf Raise", sets: 3, reps: "15", weight: 90, note: "Soleus. Full stretch at the bottom.", videoQuery: "seated calf raise proper form" },
    ],
  },
  {
    id: "day2", label: "Tuesday", title: "Back / Biceps", color: "#7c3aed",
    note: "Cable row is the anchor. Preacher and hammer curls drive arm thickness.",
    exercises: [
      { id: "pullup", name: "Pull-Up", sets: 4, reps: "8", weight: 0, note: "Bodyweight to start, log added load here once you clear 4x8 clean. Assisted machine is fine, log the assist as a negative.", videoQuery: "pull up proper form" },
      { id: "cable_row", name: "Seated Cable Row", sets: 4, reps: "12", weight: 60, note: "Elbows tight. Squeeze at peak. Last two sets go to 65.", videoQuery: "seated cable row proper form" },
      { id: "single_row", name: "Single-Arm Dumbbell Row", sets: 3, reps: "10", weight: 50, note: "Per side. Chest supported on an incline bench if your back prefers it.", videoQuery: "single arm dumbbell row form" },
      { id: "straight_arm", name: "Straight-Arm Cable Pulldown", sets: 3, reps: "12", weight: 50, note: "Lat isolation, no bicep. Arms stay locked.", videoQuery: "straight arm cable pulldown form" },
      { id: "preacher_curl", name: "Preacher Curl", sets: 3, reps: "10", weight: 55, note: "Strict. No swinging. Full extension at the bottom.", videoQuery: "preacher curl proper form" },
      { id: "hammer", name: "Hammer Curl", sets: 3, reps: "10", weight: 30, note: "Weight is per dumbbell. Brachialis, adds arm width.", videoQuery: "hammer curl proper form" },
      { id: "calf_d2", name: "Standing Calf Raise", sets: 3, reps: "15", weight: 120, note: "Full stretch. Slow negative.", videoQuery: "standing calf raise proper form" },
    ],
  },
  {
    id: "day3", label: "Thursday", title: "Legs", color: "#059669",
    note: "Loads start low on purpose. Your lower back sets the ceiling here, not your quads.",
    exercises: [
      { id: "sled", name: "Sled Press", sets: 3, reps: "12", weight: 135, note: "Feet low and hip-width or narrower for quad emphasis. Weight = plates loaded.", warmupSets: 2, videoQuery: "sled press machine proper form" },
      { id: "rdl", name: "Romanian Deadlift", sets: 3, reps: "10", weight: 95, note: "Hips back, bar drags down the legs. Stop the set when your back rounds, not when your hamstrings are done.", videoQuery: "romanian deadlift proper form" },
      { id: "leg_ext", name: "Leg Extension Machine", sets: 3, reps: "12", weight: 70, note: "Quad iso. Full contraction at the top, slow negative.", videoQuery: "leg extension machine proper form" },
      { id: "hip_thrust", name: "Hip Thrust Machine", sets: 3, reps: "12", weight: 110, note: "Glute iso. Pause and squeeze at the top.", videoQuery: "hip thrust machine proper form" },
      { id: "stand_calf", name: "Standing Calf Raise", sets: 4, reps: "15", weight: 120, note: "Heavy. 3-sec negative. Full stretch.", videoQuery: "standing calf raise proper form" },
      { id: "seat_calf", name: "Seated Calf Raise", sets: 3, reps: "15", weight: 90, note: "Soleus. Different angle than standing.", videoQuery: "seated calf raise proper form" },
    ],
  },
  {
    id: "day5", label: "Friday", title: "Upper / Arms", color: "#2563eb",
    note: "Hypertrophy day. Keep the press moderate, Monday's bench is the priority.",
    exercises: [
      { id: "flat_db", name: "Flat Dumbbell Press", sets: 4, reps: "10", weight: 50, note: "Per dumbbell. Secondary press, do not max out.", videoQuery: "flat dumbbell press proper form" },
      { id: "cs_row", name: "Chest-Supported Row", sets: 3, reps: "12", weight: 70, note: "Zero lower back involvement. Squeeze the shoulder blades.", videoQuery: "chest supported row form" },
      { id: "arnold", name: "Arnold Press", sets: 3, reps: "10", weight: 35, note: "Per dumbbell. Full rotation, all three delt heads.", videoQuery: "arnold press proper form" },
      { id: "face_pull", name: "Face Pull", sets: 3, reps: "15", weight: 40, note: "Rear delt and rotator cuff. Do not skip.", videoQuery: "face pull proper form" },
      { id: "reverse_curl", name: "Reverse Curl", sets: 3, reps: "12", weight: 45, note: "Weight includes the EZ bar. Forearm size.", videoQuery: "reverse curl proper form" },
      { id: "preacher_curl2", name: "Preacher Curl", sets: 3, reps: "10", weight: 50, note: "Frequency builds size. Slightly lighter than Tuesday.", videoQuery: "preacher curl proper form" },
      { id: "jm", name: "JM Press", sets: 3, reps: "8", weight: 65, note: "Start light. Drop it and sub diamond push-ups if your elbows complain.", videoQuery: "JM press triceps form" },
      { id: "calf_d5", name: "Seated Calf Raise", sets: 3, reps: "15", weight: 90, note: "Full stretch. Slow negative.", videoQuery: "seated calf raise proper form" },
    ],
  },
  {
    id: "day4", label: "Optional · Sat/Sun", title: "Swim", color: "#0284c7",
    note: "Optional fifth day. Low intensity. Recovery, not extra training stress.",
    swim: true, exercises: [],
  },
  {
    id: "day7", label: "Optional · Sat/Sun", title: "Active Recovery", color: "#d97706",
    note: "10-15 min. Keeps you from stiffening up as the weight climbs.",
    mobility: true,
    exercises: [
      { id: "couch", name: "Couch Stretch", sets: 1, reps: "2 min/side", note: "Hip flexors. Critical for depth." },
      { id: "hip90", name: "90/90 Hip Stretch", sets: 1, reps: "2 min/side", note: "" },
      { id: "tspine", name: "Thoracic Extension on Foam Roller", sets: 1, reps: "2 min", note: "Upper back. Helps your bench arch and shoulder position." },
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
function uid() { return Math.random().toString(36).slice(2, 10); }
function roundTo5(n) { return Math.round(n / 5) * 5; }

// Builds the prefilled weight/rep targets for every row of an exercise,
// warmup rows first, then work sets.
function targetRows(ex, benchPrescription) {
  const isProgrammed = ex.programmed && benchPrescription;
  const workWeight = isProgrammed ? benchPrescription.weight : (typeof ex.weight === "number" ? ex.weight : null);
  const workReps = isProgrammed ? String(benchPrescription.reps) : String(ex.reps);
  const workSets = isProgrammed ? benchPrescription.sets : ex.sets;
  const warmupCount = ex.warmupSets || 0;
  const ramp = isProgrammed ? BENCH_WARMUP_RAMP : GENERAL_WARMUP_RAMP;

  const rows = [];
  for (let i = 0; i < warmupCount; i++) {
    const r = ramp[i] || ramp[ramp.length - 1];
    rows.push({
      warmup: true,
      weight: workWeight === null ? "" : String(roundTo5(workWeight * r.pct)),
      reps: String(r.reps),
    });
  }
  for (let i = 0; i < workSets; i++) {
    rows.push({
      warmup: false,
      weight: workWeight === null ? "" : String(workWeight),
      reps: workReps,
    });
  }
  return rows;
}

// Prefills a session's sets with targets, preserving anything already edited.
function prefillSets(day, benchPrescription, existing) {
  const sets = { ...(existing || {}) };
  (day.exercises || []).forEach(ex => {
    const rows = targetRows(ex, benchPrescription);
    const current = sets[ex.id] || [];
    sets[ex.id] = rows.map((row, i) => {
      const cur = current[i];
      if (cur && cur.t) return cur;
      return { weight: row.weight, reps: row.reps, t: false };
    });
  });
  return sets;
}

let _audioCtx = null;
function beep() {
  try {
    _audioCtx = _audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (_audioCtx.state === "suspended") _audioCtx.resume();
    const now = _audioCtx.currentTime;
    [0, 0.18].forEach(offset => {
      const osc = _audioCtx.createOscillator();
      const gain = _audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.3, now + offset + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.15);
      osc.connect(gain).connect(_audioCtx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.16);
    });
  } catch {}
}

function useRestTimer() {
  const [endAt, setEndAt] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!endAt) return;
    firedRef.current = false;
    const tick = () => {
      const left = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0 && !firedRef.current) {
        firedRef.current = true;
        beep();
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endAt]);

  const start = (seconds) => setEndAt(Date.now() + seconds * 1000);
  const adjust = (deltaSeconds) => setEndAt(prev => prev ? Math.max(Date.now(), prev + deltaSeconds * 1000) : null);
  const clear = () => setEndAt(null);

  return { active: !!endAt && remaining > 0, remaining, start, adjust, clear };
}

const G = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    html, body, #root { height: 100%; background: #0f0f13; }
    body { font-family: 'DM Sans', sans-serif; color: #f0f0f0; overflow-x: hidden; }
    input, button, textarea { font-family: 'DM Sans', sans-serif; }
    input, textarea { outline: none; }
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
  const [customDays, setCustomDays] = useState(null);
  const [session, setSession] = useState(null);
  const [activeExercise, setActiveExercise] = useState(0);
  const [swimLog, setSwimLog] = useState({ duration: "", distance: "", notes: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [editingDay, setEditingDay] = useState(null);

  const days = customDays || DEFAULT_DAYS;

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, b, c] = await Promise.all([
        api(`/workout_sessions?user_id=eq.${USER_ID}&order=date.desc`),
        api(`/bench_log?user_id=eq.${USER_ID}&order=date.asc`),
        api(`/workout_config?user_id=eq.${USER_ID}`).catch(() => []),
      ]);
      setSessions(s || []);
      setBenchLog(b || []);
      if (c && c.length > 0 && c[0].days) setCustomDays(c[0].days);
    } catch {
      setError("Could not connect.");
    }
    setLoading(false);
  };

  const saveDays = async (newDays) => {
    setCustomDays(newDays);
    try {
      await api("/workout_config", "POST", { id: `${USER_ID}_config`, user_id: USER_ID, days: newDays });
    } catch {}
  };

  const getBenchPrescription = () => {
    const COMPLETED = 0;
    const idx = Math.min(COMPLETED + benchLog.length, BENCH_PROGRAM.length - 1);
    return BENCH_PROGRAM[idx];
  };

  const startDay = (day) => {
    setActiveDay(day);
    const prescription = getBenchPrescription();
    const existing = sessions.find(s => s.day_id === day.id && s.date === today());
    const base = existing
      ? { ...existing }
      : { id: `${USER_ID}_${day.id}_${today()}`, user_id: USER_ID, day_id: day.id, date: today(), sets: {}, notes: {}, swim_log: null, complete: false };
    base.sets = prefillSets(day, prescription, base.sets);
    setSession(base);
    setActiveExercise(0);
    setSwimLog({ duration: "", distance: "", notes: "" });
    setScreen("day");
  };

  const updateSet = (exId, setIdx, field, value) => {
    setSession(prev => {
      const sets = { ...prev.sets };
      if (!sets[exId]) sets[exId] = [];
      sets[exId] = [...sets[exId]];
      if (!sets[exId][setIdx]) sets[exId][setIdx] = { weight: "", reps: "", t: false };
      sets[exId][setIdx] = { ...sets[exId][setIdx], [field]: value, t: true };
      return { ...prev, sets };
    });
  };

  const updateNote = (exId, value) => {
    setSession(prev => ({ ...prev, notes: { ...(prev.notes || {}), [exId]: value } }));
  };

  const saveSession = async () => {
    setSaving(true);
    setError(null);
    try {
      const final = { ...session, complete: true };
      if (activeDay.swim) final.swim_log = swimLog;
      await api("/workout_sessions", "POST", final);
      const benchEx = activeDay.exercises.find(e => e.programmed);
      if (benchEx && final.sets[benchEx.id]?.length) {
        // Log work sets only, drop the warmup rows and the edited flag.
        const workSets = final.sets[benchEx.id]
          .slice(benchEx.warmupSets || 0)
          .map(s => ({ weight: s.weight, reps: s.reps }));
        const existing = benchLog.find(b => b.date === today());
        if (existing) {
          await api(`/bench_log?user_id=eq.${USER_ID}&date=eq.${today()}`, "PATCH", { sets: workSets });
        } else {
          await api("/bench_log", "POST", { user_id: USER_ID, date: today(), sets: workSets });
        }
      }
      await loadAll();
      setScreen("home");
      setSession(null);
    } catch {
      setError("Save failed. Try again.");
    }
    setSaving(false);
  };

  const getLastWeight = (dayId, exId, setIdx) => {
    const last = sessions.filter(s => s.day_id === dayId && s.complete && s.date < today()).sort((a, b) => b.date.localeCompare(a.date))[0];
    return last?.sets?.[exId]?.[setIdx]?.weight || "";
  };

  if (loading) return <><G /><Loader /></>;
  if (screen === "bench") return <><G /><BenchScreen benchLog={benchLog} onBack={() => setScreen("home")} /></>;
  if (screen === "history") return <><G /><HistoryScreen sessions={sessions} days={days} onBack={() => setScreen("home")} /></>;
  if (screen === "edit" && editingDay) return <><G /><EditDayScreen day={editingDay} onSave={async (updated) => { await saveDays(days.map(d => d.id === updated.id ? updated : d)); setScreen("home"); }} onBack={() => setScreen("home")} /></>;
  if (screen === "day" && activeDay && session) return (
    <><G /><DayScreen
      day={activeDay} session={session} activeExercise={activeExercise}
      setActiveExercise={setActiveExercise} updateSet={updateSet} updateNote={updateNote}
      onSave={saveSession} onBack={() => setScreen("home")}
      getLastWeight={(exId, si) => getLastWeight(activeDay.id, exId, si)}
      swimLog={swimLog} setSwimLog={setSwimLog} saving={saving} error={error}
      benchPrescription={getBenchPrescription()}
    /></>
  );

  return <><G /><HomeScreen days={days} sessions={sessions} onSelectDay={startDay} onHistory={() => setScreen("history")} onBench={() => setScreen("bench")} onEdit={(day) => { setEditingDay(day); setScreen("edit"); }} error={error} onRetry={loadAll} /></>;
}

function HomeScreen({ days, sessions, onSelectDay, onHistory, onBench, onEdit, error, onRetry }) {
  const todayStr = today();
  const completedToday = new Set(sessions.filter(s => s.date === todayStr && s.complete).map(s => s.day_id));
  const lastSession = (dayId) => sessions.filter(s => s.day_id === dayId && s.complete).sort((a,b) => b.date.localeCompare(a.date))[0];
  return (
    <div style={{ minHeight: "100vh", background: "#0f0f13", paddingBottom: 48 }}>
      <div style={{ padding: "max(32px, env(safe-area-inset-top)) 20px 16px", borderBottom: "1px solid #1a1a22" }}>
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
        <button onClick={onBench} style={pill("#0d1f0d", "#4ade80")}>Bench Program</button>
      </div>
      <div style={{ padding: "4px 20px 0" }} className="fadein">
        <div style={{ fontSize: 11, letterSpacing: 2, color: "#333", textTransform: "uppercase", marginBottom: 14 }}>Select Day</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {days.map(day => {
            const done = completedToday.has(day.id);
            const last = lastSession(day.id);
            return (
              <div key={day.id} style={{ display: "flex", gap: 8 }}>
                <button onClick={() => onSelectDay(day)} style={{
                  flex: 1, background: done ? "#0d1f0d" : "#15151e",
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
                {!day.swim && !day.mobility && (
                  <button onClick={() => onEdit(day)} style={{ background: "#15151e", border: "1px solid #1e1e28", borderRadius: 10, color: "#555", fontSize: 20, width: 44, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>⋯</button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EditDayScreen({ day, onSave, onBack }) {
  const [exercises, setExercises] = useState(day.exercises.map(e => ({ ...e })));
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newEx, setNewEx] = useState({ name: "", sets: "3", reps: "10", weight: "" });

  const updateEx = (idx, field, val) => setExercises(prev => prev.map((e, i) => i === idx ? { ...e, [field]: val } : e));
  const deleteEx = (idx) => setExercises(prev => prev.filter((_, i) => i !== idx));
  const addEx = () => {
    if (!newEx.name.trim()) return;
    setExercises(prev => [...prev, { id: uid(), name: newEx.name, sets: parseInt(newEx.sets) || 3, reps: newEx.reps || "10", weight: newEx.weight === "" ? null : parseFloat(newEx.weight), note: "" }]);
    setNewEx({ name: "", sets: "3", reps: "10", weight: "" });
    setAdding(false);
  };

  return (
    <div style={wrap()}>
      <TopBar title={`Edit ${day.label}`} sub={day.title} color={day.color} onBack={onBack} />
      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        <div style={{ background: "#1a150a", border: "1px solid #2a200a", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#d97706" }}>
          Saving here overrides the built-in program permanently. To go back to the default, clear your workout_config row in Supabase.
        </div>
        <div style={{ fontSize: 11, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 14 }}>Exercises</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {exercises.map((ex, idx) => (
            <div key={ex.id} style={{ background: "#15151e", border: "1px solid #1e1e28", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <input value={ex.name} onChange={e => updateEx(idx, "name", e.target.value)}
                  style={{ background: "none", border: "none", color: "#f0f0f0", fontSize: 15, fontWeight: 600, flex: 1, outline: "none" }} />
                <button onClick={() => deleteEx(idx)} style={{ background: "none", border: "none", color: "#555", fontSize: 18, marginLeft: 8 }}>✕</button>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, marginBottom: 5 }}>SETS</div>
                  <input type="number" value={ex.sets} onChange={e => updateEx(idx, "sets", parseInt(e.target.value) || 3)} style={inp()} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, marginBottom: 5 }}>REPS</div>
                  <input value={ex.reps} onChange={e => updateEx(idx, "reps", e.target.value)} style={inp()} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, marginBottom: 5 }}>WEIGHT</div>
                  <input type="number" inputMode="decimal" value={ex.weight ?? ""} placeholder="lbs"
                    onChange={e => updateEx(idx, "weight", e.target.value === "" ? null : parseFloat(e.target.value))} style={inp()} />
                </div>
              </div>
            </div>
          ))}
        </div>
        {adding ? (
          <div style={{ background: "#0d1a2a", border: "1px solid #1e3a5a", borderRadius: 12, padding: "14px 16px", marginTop: 12 }}>
            <div style={{ fontSize: 12, color: "#60a5fa", marginBottom: 12 }}>New Exercise</div>
            <input placeholder="Exercise name" value={newEx.name} onChange={e => setNewEx(p => ({ ...p, name: e.target.value }))} style={{ ...inp(), marginBottom: 10 }} />
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, marginBottom: 5 }}>SETS</div>
                <input type="number" value={newEx.sets} onChange={e => setNewEx(p => ({ ...p, sets: e.target.value }))} style={inp()} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, marginBottom: 5 }}>REPS</div>
                <input value={newEx.reps} onChange={e => setNewEx(p => ({ ...p, reps: e.target.value }))} style={inp()} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, marginBottom: 5 }}>WEIGHT</div>
                <input type="number" inputMode="decimal" placeholder="lbs" value={newEx.weight} onChange={e => setNewEx(p => ({ ...p, weight: e.target.value }))} style={inp()} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setAdding(false)} style={{ ...btn("#1e1e28"), flex: 0.4, color: "#888" }}>Cancel</button>
              <button onClick={addEx} style={{ ...btn("#2563eb"), flex: 1 }}>Add</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} style={{ width: "100%", marginTop: 12, background: "#1a1a24", border: "1px dashed #2a2a38", borderRadius: 12, color: "#555", fontSize: 14, padding: 14 }}>+ Add Exercise</button>
        )}
      </div>
      <BottomBar>
        <button onClick={async () => { setSaving(true); await onSave({ ...day, exercises }); }} disabled={saving} style={btn("#16a34a")}>{saving ? "Saving..." : "Save Workout ✓"}</button>
      </BottomBar>
    </div>
  );
}

function DayScreen({ day, session, activeExercise, setActiveExercise, updateSet, updateNote, onSave, onBack, getLastWeight, swimLog, setSwimLog, saving, error, benchPrescription }) {
  const exercises = day.exercises;
  const restTimer = useRestTimer();
  const triggeredRef = useRef({});

  if (day.swim) return (
    <div style={wrap()}>
      <TopBar title={day.title} sub={day.label} color={day.color} onBack={onBack} />
      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        <div style={{ color: "#666", fontSize: 13, marginBottom: 20 }}>{day.note}</div>
        {["duration", "distance", "notes"].map(f => (
          <div key={f} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>{f}</div>
            <input value={swimLog[f]} onChange={e => setSwimLog(p => ({ ...p, [f]: e.target.value }))}
              placeholder={f === "duration" ? "e.g. 45 min" : f === "distance" ? "e.g. 1500m" : "Notes..."} style={inp()} />
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
        {exercises.map(ex => (
          <div key={ex.id} style={{ background: "#15151e", border: "1px solid #1e1e28", borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
            <a href={stretchLink(ex.name)} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, fontSize: 15, color: "#f0f0f0", textDecoration: "underline", textDecorationColor: "#2a2a38" }}>{ex.name}</a>
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
  const isProgrammed = ex?.programmed && benchPrescription;
  const rows = targetRows(ex, benchPrescription);

  return (
    <div style={wrap()}>
      <TopBar title={day.title} sub={`${day.label} · ${activeExercise + 1} of ${exercises.length}`} color={day.color} onBack={onBack} />
      <div style={{ overflowX: "auto", display: "flex", gap: 8, padding: "12px 20px", borderBottom: "1px solid #1a1a22", scrollbarWidth: "none" }}>
        {exercises.map((e, i) => {
          const touched = session.sets[e.id]?.some(s => s?.t);
          return (
            <button key={e.id} onClick={() => setActiveExercise(i)} style={{
              flexShrink: 0, minWidth: 36, padding: "6px 13px", borderRadius: 20, border: "none", fontSize: 12,
              background: i === activeExercise ? day.color : touched ? "#1a2a1a" : "#1e1e28",
              color: i === activeExercise ? "#fff" : touched ? "#4ade80" : "#555",
              fontWeight: i === activeExercise ? 600 : 400,
            }}>{i + 1}</button>
          );
        })}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 0" }} className="fadein">
        {activeExercise === 0 && (
          <div style={{ background: "#1a150a", border: "1px solid #2a200a", borderRadius: 10, padding: "12px 14px", marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: "#d97706", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>Warm-up First</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {WARMUP.map(w => (
                <div key={w.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <a href={stretchLink(w.name)} target="_blank" rel="noopener noreferrer" style={{ color: "#ccc", textDecoration: "underline", textDecorationColor: "#3a2f10" }}>{w.name}</a>
                  <span style={{ color: "#d97706", fontFamily: "'DM Mono', monospace" }}>{w.reps}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {isProgrammed && (
          <div style={{ background: "#0d1a0d", border: "1px solid #1a3a1a", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: "#4ade80", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>Week {benchPrescription.week} · {benchPrescription.phase}</div>
            <div style={{ fontSize: 14, color: "#f0f0f0", fontWeight: 600 }}>
              {benchPrescription.sets} sets × {benchPrescription.reps} reps @ <span style={{ color: "#4ade80" }}>{benchPrescription.weight} lbs</span>
            </div>
            {benchPrescription.note && <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>{benchPrescription.note}</div>}
          </div>
        )}
        <div style={{ fontSize: 11, color: day.color, letterSpacing: 2, textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>
          {isProgrammed ? benchPrescription.sets : ex.sets} sets · {isProgrammed ? benchPrescription.reps : ex.reps} reps
        </div>
        <a href={exerciseLink(ex)} target="_blank" rel="noopener noreferrer"
          style={{ display: "inline-block", fontSize: 20, fontWeight: 700, marginBottom: 6, color: "#f0f0f0", textDecoration: "underline", textDecorationColor: "#2a2a38", textUnderlineOffset: 4 }}>
          {ex.name} <span style={{ fontSize: 13, color: "#555", fontWeight: 400 }}>▸ form</span>
        </a>
        {ex.note && <div style={{ color: "#555", fontSize: 13, marginBottom: 14 }}>{ex.note}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          {rows.map((row, si) => {
            const isWarmup = row.warmup;
            const warmupCount = ex.warmupSets || 0;
            const workNum = isWarmup ? null : si - warmupCount + 1;
            const setData = session.sets[ex.id]?.[si] || { weight: row.weight, reps: row.reps, t: false };
            const lastWt = getLastWeight(ex.id, si);
            const touched = !!setData.t;

            const weightLabel = isWarmup
              ? `WEIGHT · warmup`
              : `WEIGHT${lastWt ? ` · last: ${lastWt}` : ""}`;

            return (
              <div key={si} style={{
                background: touched ? "#0d1a2a" : isWarmup ? "#151510" : "#15151e",
                border: `1px solid ${touched ? "#1e3a5a" : isWarmup ? "#2a2a1a" : "#1e1e28"}`,
                borderRadius: 10, padding: "12px 14px",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: touched ? day.color : isWarmup ? "#2a2410" : "#1e1e28", display: "flex", alignItems: "center", justifyContent: "center", fontSize: isWarmup ? 11 : 13, fontWeight: 700, color: touched ? "#fff" : isWarmup ? "#d97706" : "#444", flexShrink: 0 }}>
                  {isWarmup ? `W${si + 1}` : workNum}
                </div>
                <div style={{ flex: 1, display: "flex", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: "#444", marginBottom: 5 }}>{weightLabel}</div>
                    <input type="number" inputMode="decimal" placeholder="lbs"
                      value={setData.weight} onChange={e => updateSet(ex.id, si, "weight", e.target.value)} style={inp()} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: "#444", marginBottom: 5 }}>REPS</div>
                    <input type="number" inputMode="numeric" placeholder="reps"
                      value={setData.reps} onChange={e => updateSet(ex.id, si, "reps", e.target.value)}
                      onBlur={() => {
                        const key = `${ex.id}-${si}`;
                        if (setData.weight && setData.reps && triggeredRef.current[key] !== setData.reps) {
                          triggeredRef.current[key] = setData.reps;
                          restTimer.start(isWarmup ? 60 : 120);
                        }
                      }}
                      style={inp()} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Notes (optional)</div>
          <textarea value={session.notes?.[ex.id] || ""} onChange={e => updateNote(ex.id, e.target.value)}
            placeholder="How did it feel? Anything to note..." rows={2}
            style={{ width: "100%", background: "#15151e", border: "1px solid #2a2a38", borderRadius: 8, color: "#f0f0f0", fontSize: 14, padding: "10px 12px", resize: "none", outline: "none" }} />
        </div>
        {error && <Err msg={error} />}
      </div>
      {restTimer.active && (
        <div style={{ padding: "10px 20px", background: "#0d1a2a", borderTop: "1px solid #1e3a5a", flexShrink: 0, display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => restTimer.adjust(-30)} style={{ background: "#1e1e28", border: "none", color: "#888", width: 34, height: 34, borderRadius: 8, fontSize: 12, fontWeight: 600, flexShrink: 0 }}>-30</button>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#60a5fa", letterSpacing: 2, textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>Rest</div>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{String(Math.floor(restTimer.remaining / 60)).padStart(1, "0")}:{String(restTimer.remaining % 60).padStart(2, "0")}</div>
          </div>
          <button onClick={() => restTimer.adjust(30)} style={{ background: "#1e1e28", border: "none", color: "#888", width: 34, height: 34, borderRadius: 8, fontSize: 12, fontWeight: 600, flexShrink: 0 }}>+30</button>
          <button onClick={restTimer.clear} style={{ background: "#1e1e28", border: "none", color: "#666", padding: "0 14px", height: 34, borderRadius: 8, fontSize: 12, flexShrink: 0 }}>Skip</button>
        </div>
      )}
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
  const COMPLETED = 0;
  const nextIdx = Math.min(COMPLETED + benchLog.length, BENCH_PROGRAM.length - 1);
  const next = BENCH_PROGRAM[nextIdx];
  const phases = [
    { name: "Volume", start: 1, end: 4, color: "#60a5fa" },
    { name: "Strength", start: 5, end: 8, color: "#f59e0b" },
    { name: "Peak", start: 9, end: 12, color: "#f87171" },
    { name: "Test", start: 13, end: 16, color: "#4ade80" },
  ];
  return (
    <div style={wrap()}>
      <TopBar title="Bench Program" sub="16-Week | 215 → 235 lbs" color="#4ade80" onBack={onBack} />
      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        {next && (
          <div style={{ background: "#0d1f0d", border: "1px solid #1a3a1a", borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 10, color: "#4ade80", letterSpacing: 2, marginBottom: 8, fontFamily: "'DM Mono', monospace" }}>NEXT SESSION · WEEK {next.week} · {next.phase.toUpperCase()}</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{next.weight} lbs</div>
            <div style={{ fontSize: 14, color: "#888" }}>{next.sets} sets × {next.reps} reps</div>
            {next.note && <div style={{ fontSize: 12, color: "#555", marginTop: 8 }}>{next.note}</div>}
          </div>
        )}
        <div style={{ fontSize: 11, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Full 16-Week Schedule</div>
        {phases.map((p, pi) => {
          const weeks = Array.from({ length: p.end - p.start + 1 }, (_, i) => i + p.start);
          return (
            <div key={p.name} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, color: p.color, fontWeight: 600, marginBottom: 8, fontFamily: "'DM Mono', monospace", letterSpacing: 1 }}>
                PHASE {pi + 1}: {p.name.toUpperCase()} (WKS {p.start}-{p.end})
              </div>
              {weeks.map(week => {
                const s = BENCH_PROGRAM.find(x => x.week === week);
                if (!s) return null;
                const progIdx = BENCH_PROGRAM.findIndex(x => x.week === week);
                const done = (COMPLETED + benchLog.length) > progIdx;
                return (
                  <div key={week} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: "1px solid #1a1a22", alignItems: "center" }}>
                    <div style={{ width: 48, fontSize: 11, color: done ? "#4ade80" : "#555", fontFamily: "'DM Mono', monospace" }}>Wk {week}</div>
                    <div style={{ width: 68, fontSize: 13, fontWeight: 600, color: done ? "#555" : "#f0f0f0" }}>{s.weight} lbs</div>
                    <div style={{ fontSize: 12, color: "#555" }}>{s.sets}×{s.reps}</div>
                    <div style={{ fontSize: 11, color: "#444", flex: 1, textAlign: "right" }}>{s.phase}</div>
                    {done && <span style={{ color: "#4ade80", fontSize: 14 }}>✓</span>}
                  </div>
                );
              })}
            </div>
          );
        })}
        <div style={{ fontSize: 11, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12, marginTop: 8 }}>Session Log</div>
        {log.length === 0 && <div style={{ color: "#444", fontSize: 14 }}>No bench sessions logged yet.</div>}
        {log.map((entry, i) => {
          const topSet = entry.sets?.reduce((best, s) => (parseFloat(s?.weight)||0) > (parseFloat(best?.weight)||0) ? s : best, {});
          return (
            <div key={i} style={{ background: "#15151e", border: "1px solid #1e1e28", borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontWeight: 600 }}>{formatDate(entry.date)}</div>
                {topSet?.weight && <div style={{ color: "#4ade80", fontFamily: "'DM Mono', monospace", fontSize: 13 }}>Top: {topSet.weight} × {topSet.reps}</div>}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {entry.sets?.map((s, si) => (
                  <div key={si} style={{ background: "#1e1e28", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontFamily: "'DM Mono', monospace", color: "#666" }}>
                    S{si+1}: {s?.weight||"--"} × {s?.reps||"--"}
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

function HistoryScreen({ sessions, days, onBack }) {
  const sorted = [...sessions].filter(s => s.complete).sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div style={wrap()}>
      <TopBar title="Session History" sub={`${sorted.length} sessions`} color="#888" onBack={onBack} />
      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        {sorted.length === 0 && <div style={{ color: "#444", fontSize: 14 }}>No sessions logged yet.</div>}
        {sorted.map(s => {
          const day = days.find(d => d.id === s.day_id);
          const label = day?.label || "Archived";
          const title = day?.title || "Previous program";
          const color = day?.color || "#444";
          return (
            <div key={s.id} style={{ background: "#15151e", borderLeft: `3px solid ${color}`, border: "1px solid #1e1e28", borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, color, letterSpacing: 1, textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 3 }}>{label}</div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{title}</div>
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

function Loader() {
  return (
    <div style={{ minHeight: "100vh", background: "#0f0f13", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <div style={{ width: 36, height: 36, border: "3px solid #222", borderTop: "3px solid #2563eb", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <div style={{ color: "#555", fontSize: 13 }}>Loading...</div>
    </div>
  );
}

function Err({ msg }) {
  return <div style={{ background: "#2a0d0d", border: "1px solid #5a1a1a", borderRadius: 8, padding: "10px 14px", color: "#f87171", fontSize: 13, marginBottom: 16 }}>{msg}</div>;
}

const wrap = () => ({ minHeight: "100vh", background: "#0f0f13", display: "flex", flexDirection: "column" });
const inp = () => ({ background: "#1e1e28", border: "1px solid #2a2a38", borderRadius: 8, color: "#f0f0f0", fontSize: 16, padding: "10px 12px", width: "100%", fontFamily: "'DM Mono', monospace" });
const btn = (bg) => ({ background: bg, border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 600, padding: 15, width: "100%", fontFamily: "'DM Sans', sans-serif" });
const pill = (bg, color) => ({ background: bg, border: "1px solid #2a2a38", borderRadius: 20, color, fontSize: 12, fontWeight: 500, padding: "7px 16px", fontFamily: "'DM Sans', sans-serif" });
