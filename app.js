
// ============================================================
// CLEARMAY — app.js
// Supabase backend + password gate
// ============================================================

// ---------- SUPABASE CONFIG ----------
const SUPABASE_URL = 'https://jbvzsyqhflaoyrfxewqk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpidnpzeXFoZmxhb3lyZnhld3FrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzgzNTYxNiwiZXhwIjoyMDkzNDExNjE2fQ.yNX8osKZJIQTX0zxmbSTibFyfrW_0Io4NLL4VxJJybA';
const APP_PASSWORD  = 'sviatkros';
const STATE_KEY     = 'clearmay_state_v2';

// ---------- SUPABASE HELPERS ----------
async function sbGet(key) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/app_state?key=eq.${encodeURIComponent(key)}&select=value`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return rows.length ? rows[0].value : null;
}

async function sbSet(key, value) {
  // upsert — insert or update by key
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/app_state`,
    {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ key, value })
    }
  );
  return res.ok || res.status === 201 || res.status === 200;
}

// ---------- PASSWORD SCREEN ----------
function initPasswordScreen() {
  const screen = document.getElementById('passwordScreen');
  const input  = document.getElementById('passwordInput');
  const btn    = document.getElementById('passwordBtn');
  const err    = document.getElementById('passwordError');

  screen.style.display = 'flex';
  document.getElementById('app').style.display = 'none';

  function tryLogin() {
    if (input.value === APP_PASSWORD) {
      sessionStorage.setItem('cm_auth', '1');
      screen.style.display = 'none';
      document.getElementById('app').style.display = '';
      initApp();
    } else {
      err.textContent = 'Wrong password';
      input.value = '';
      input.focus();
    }
  }

  btn.addEventListener('click', tryLogin);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });
}

// ---------- CONSTANTS ----------
const START_DATE  = new Date(2026, 4, 4);   // May 4
const END_DATE    = new Date(2026, 5, 7);   // Jun 7
const TOTAL_DAYS  = 35;

const GOALS = {
  pomo: 160, diag: 20, mentees: 5, networking: 2,
  talks: 1, lives: 2, content: 35, init: 30, struct: 10
};

const MACRO_NORMS = {
  protein: { goal: 170, mode: 'min' },  // 170g+ — больше лучше
  fat:     { goal: 75,  mode: 'max' },  // до 75g
  carbs:   { goal: 260, mode: 'max' }   // до 260g
};

const SCORE_KEYS = [
  'steps_8k','kcal_under','kcal_count','sleep_7',
  'no_alco','no_smoke','no_sweets',
  'silence_10','no_phone_morning','no_phone_night',
  'early_rise','money_action'
];

const HABIT_LABELS = {
  steps_8k:'8k steps', kcal_under:'≤2200 kcal', kcal_count:'calorie tracking',
  sleep_7:'7+ hours sleep', no_alco:'no alco', no_smoke:'no smoking',
  no_sweets:'no bad sweets', silence_10:'10 min of silence',
  no_phone_morning:'no phone morning', no_phone_night:'no phone night',
  early_rise:'wake-up 6–7', money_action:'money action'
};

const ACHIEVEMENTS = [
  { id:'first_check',  icon:'I',   name:'First Step',          desc:'First check-in',              check:s=>s.totalChecks>=1 },
  { id:'first_clean',  icon:'★',   name:'Clean Day',           desc:'10+/12 in a day',             check:s=>s.cleanDays>=1 },
  { id:'streak_3',     icon:'III', name:'Triad',               desc:'3 clean days in a row',       check:s=>s.maxStreak>=3 },
  { id:'streak_7',     icon:'VII', name:'Week of Strength',    desc:'7 clean days in a row',       check:s=>s.maxStreak>=7 },
  { id:'streak_14',    icon:'XIV', name:'Halfway Point',       desc:'14 clean days in a row',      check:s=>s.maxStreak>=14 },
  { id:'pomo_50',      icon:'50',  name:'Focus',               desc:'50 pomodoro',                 check:s=>s.pomo>=50 },
  { id:'pomo_100',     icon:'100', name:'Machine',             desc:'100 pomodoro',                check:s=>s.pomo>=100 },
  { id:'pomo_160',     icon:'160', name:'Contract',            desc:'Pomodoro goal reached',       check:s=>s.pomo>=160 },
  { id:'diag_10',      icon:'10',  name:'Half the Diagnostics',desc:'10 diagnostics',              check:s=>s.diag>=10 },
  { id:'diag_20',      icon:'20',  name:'All Diagnostics',     desc:'20 diagnostics',              check:s=>s.diag>=20 },
  { id:'content_10',   icon:'10',  name:'Creator',             desc:'10 content pieces',           check:s=>s.content>=10 },
  { id:'content_35',   icon:'35',  name:'Content Machine',     desc:'35 pieces',                   check:s=>s.content>=35 },
  { id:'first_mentee', icon:'M',   name:'Mentor',              desc:'First mentee',                check:s=>s.mentees>=1 },
  { id:'all_mentees',  icon:'V',   name:'Guru',                desc:'5 mentees',                   check:s=>s.mentees>=5 },
  { id:'first_talk',   icon:'!',   name:'Voice',               desc:'Spoke publicly',              check:s=>s.talks>=1 },
  { id:'no_phone_7',   icon:'7',   name:'Digital Cleanliness', desc:'7 days without phone',        check:s=>s.noPhoneBoth>=7 },
  { id:'sport_week',   icon:'W',   name:'Sports Week',         desc:'3+ sports sessions per week', check:s=>s.bestSportWeek>=3 },
  { id:'all_clean',    icon:'★★',  name:'Flawlessness',        desc:'15+ clean days',              check:s=>s.cleanDays>=15 },
  { id:'half_way',     icon:'18',  name:'Midpoint',            desc:'18 days behind',              check:s=>s.elapsed>=18 },
  { id:'finish',       icon:'∞',   name:'Completed',           desc:'35 days behind',              check:s=>s.elapsed>=35 }
];

// ---------- STATE ----------
let state = {
  days: {},
  monthly: { mentees:0, networking:0, talks:0, lives:0, init:0, struct:0 },
  unlockedAchievements: []
};
let selectedDate = todayKey();
let saveTimer;
let scheduleTimer;
let isSaving = false;

// ---------- PERSISTENCE ----------
async function saveState() {
  if (isSaving) return;
  isSaving = true;
  showSaveIndicator('saving');
  try {
    const ok = await sbSet(STATE_KEY, JSON.stringify(state));
    showSaveIndicator(ok ? 'saved' : 'error');
  } catch(e) {
    console.error('Save error:', e);
    showSaveIndicator('error');
  } finally {
    isSaving = false;
  }
}

async function loadState() {
  showSaveIndicator('loading');
  try {
    const raw = await sbGet(STATE_KEY);
    if (raw) {
      const loaded = JSON.parse(raw);
      state = { ...state, ...loaded };
      if (!state.monthly) state.monthly = { mentees:0, networking:0, talks:0, lives:0, init:0, struct:0 };
      if (!state.unlockedAchievements) state.unlockedAchievements = [];
    }
  } catch(e) {
    console.error('Load error:', e);
  }
  showSaveIndicator('hidden');
}

function showSaveIndicator(mode) {
  const ind  = document.getElementById('saveIndicator');
  const text = document.getElementById('saveText');
  clearTimeout(saveTimer);
  if (mode === 'hidden') { ind.classList.remove('show'); return; }
  const labels = { saving:'Saving…', saved:'Saved', error:'Save error', loading:'Loading…' };
  text.textContent = labels[mode] || mode;
  ind.classList.add('show');
  if (mode === 'saved') saveTimer = setTimeout(() => ind.classList.remove('show'), 1500);
}

function scheduleSave() {
  clearTimeout(scheduleTimer);
  scheduleTimer = setTimeout(saveState, 800);
}

// ---------- DATE UTILS ----------
function fmtDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function todayKey() { return fmtDate(new Date()); }
function dowShort(d) { return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]; }
function dowLong(d)  { return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()]; }
function dateOnly(d) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate()+n); return x; }

// ---------- DATA HELPERS ----------
function getDayData(key) {
  if (!state.days[key]) state.days[key] = { checks:{}, nums:{}, reflection:'' };
  return state.days[key];
}

function dayScore(dayData) {
  if (!dayData) return 0;
  return SCORE_KEYS.reduce((sum, k) => sum + (dayData.checks[k] ? 1 : 0), 0);
}

function elapsedDays() {
  const now   = dateOnly(new Date());
  const start = dateOnly(START_DATE);
  if (now < start) return 0;
  const end = dateOnly(END_DATE);
  if (now > end) return TOTAL_DAYS;
  return Math.floor((now - start) / (1000*60*60*24)) + 1;
}

function sumDays(field) {
  let total = 0;
  Object.values(state.days).forEach(d => {
    const v = d.nums?.[field];
    if (typeof v === 'number') total += v;
  });
  return total;
}

function countDayChecks(checkKey) {
  return Object.values(state.days).filter(d => d.checks?.[checkKey]).length;
}

function maxStreakDays() {
  let max = 0, cur = 0;
  const today = dateOnly(new Date());
  for (let i = 0; i < TOTAL_DAYS; i++) {
    const d = new Date(START_DATE);
    d.setDate(d.getDate() + i);
    if (d > today) break;
    const day = state.days[fmtDate(d)];
    if (day && dayScore(day) >= 10) { cur++; max = Math.max(max, cur); }
    else cur = 0;
  }
  return { max, current: cur };
}

function bestSportWeek() {
  let best = 0;
  const sportKeys = ['gym','run','box'];
  for (let i = 0; i < TOTAL_DAYS; i++) {
    let cnt = 0;
    for (let j = 0; j < 7 && i+j < TOTAL_DAYS; j++) {
      const d = new Date(START_DATE);
      d.setDate(d.getDate() + i + j);
      const day = state.days[fmtDate(d)];
      if (day) sportKeys.forEach(k => { if (day.checks?.[k]) cnt++; });
    }
    best = Math.max(best, cnt);
  }
  return best;
}

function noPhoneBothDays() {
  return Object.values(state.days).filter(d =>
    d.checks?.no_phone_morning && d.checks?.no_phone_night
  ).length;
}

function calcXP() {
  let xp = 0;
  Object.values(state.days).forEach(d => {
    const cks = SCORE_KEYS.filter(k => d.checks?.[k]).length;
    xp += cks * 5;
    if (cks >= 10) xp += 30;
    xp += (d.nums?.pomo    || 0) * 2;
    xp += (d.nums?.content || 0) * 10;
    xp += (d.nums?.diag    || 0) * 15;
  });
  xp += state.monthly.mentees    * 50;
  xp += state.monthly.networking * 30;
  xp += state.monthly.talks      * 100;
  xp += state.monthly.lives      * 40;
  return xp;
}

function levelFromXP(xp) {
  let lvl = 1, need = 100, cum = 0;
  while (cum + need <= xp) { cum += need; lvl++; need += 50; }
  return { level: lvl, current: xp - cum, next: need };
}

function statsForAchievements() {
  const streakInfo = maxStreakDays();
  const cleanDays  = Object.values(state.days).filter(d => dayScore(d) >= 10).length;
  let totalChecks  = 0;
  Object.values(state.days).forEach(d => {
    totalChecks += SCORE_KEYS.filter(k => d.checks?.[k]).length;
  });
  return {
    totalChecks, cleanDays,
    maxStreak:    streakInfo.max,
    pomo:         sumDays('pomo'),
    diag:         sumDays('diag'),
    content:      sumDays('content'),
    mentees:      state.monthly.mentees,
    talks:        state.monthly.talks,
    noPhoneBoth:  noPhoneBothDays(),
    bestSportWeek:bestSportWeek(),
    elapsed:      elapsedDays()
  };
}

function escapeHTML(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ---------- WEEK HELPERS ----------
function currentChallengeDate() {
  const today = dateOnly(new Date());
  const start = dateOnly(START_DATE);
  const end   = dateOnly(END_DATE);
  if (today < start) return start;
  if (today > end)   return end;
  return today;
}

function currentWeekBounds() {
  const current   = currentChallengeDate();
  const start     = dateOnly(START_DATE);
  const idx       = Math.floor((current - start) / (1000*60*60*24));
  const weekIndex = Math.floor(Math.max(0, idx) / 7);
  const weekStart = addDays(start, weekIndex * 7);
  const weekEnd   = addDays(weekStart, 6);
  const challengeEnd = dateOnly(END_DATE);
  return {
    index: weekIndex + 1,
    start: weekStart,
    end:   weekEnd > challengeEnd ? challengeEnd : weekEnd,
    today: current
  };
}

function eachDayInRange(start, end, fn) {
  const s = dateOnly(start), e = dateOnly(end);
  for (let d = new Date(s); d <= e; d.setDate(d.getDate()+1)) fn(new Date(d), fmtDate(d));
}

function sumNumInRange(field, start, end) {
  let total = 0;
  eachDayInRange(start, end, (_, key) => {
    const v = state.days[key]?.nums?.[field];
    if (typeof v === 'number') total += v;
  });
  return total;
}

function countCheckInRange(checkKey, start, end) {
  let total = 0;
  eachDayInRange(start, end, (_, key) => {
    if (state.days[key]?.checks?.[checkKey]) total++;
  });
  return total;
}

function countSportsInRange(start, end) {
  let total = 0;
  eachDayInRange(start, end, (_, key) => {
    const checks = state.days[key]?.checks || {};
    if (checks.gym) total++;
    if (checks.run) total++;
    if (checks.box) total++;
  });
  return total;
}

function weekdayReportTarget(start, end) {
  let total = 0;
  eachDayInRange(start, end, (d) => {
    const day = d.getDay();
    if (day >= 1 && day <= 5) total++;
  });
  return total;
}

// ---------- RENDER: TODAY TAB ----------
function renderToday() {
  const day = getDayData(selectedDate);
  const d   = new Date(selectedDate);
  document.getElementById('datePicker').value = selectedDate;
  document.getElementById('pickerDay').textContent =
    `${dowLong(d)} · ${d.getDate()}.${String(d.getMonth()+1).padStart(2,'0')}`;
  document.getElementById('todayBtn').classList.toggle('active', selectedDate === todayKey());

  const isPast = dateOnly(new Date(selectedDate)) < dateOnly(new Date());

  document.querySelectorAll('#tab-today .check-item').forEach(el => {
    const checked = !!day.checks[el.dataset.check];
    el.classList.toggle('checked', checked);
    el.classList.toggle('missed-check', isPast && !checked);
  });

  document.querySelectorAll('#tab-today input[data-num]').forEach(el => {
    const v = day.nums[el.dataset.num];
    el.value = (v !== undefined && v !== null) ? v : '';
    el.classList.toggle('past-empty', isPast && (v === undefined || v === null));
  });

  document.getElementById('reflectionText').value = day.reflection || '';
  updateScoreToday();
  renderCounters();
}

function updateScoreToday() {
  const score = dayScore(getDayData(selectedDate));
  document.getElementById('scoreToday').textContent = score;
  const messages = [
    'Clean slate.','The start is there.','Let\'s go.','Building momentum.',
    'Not bad already.','Halfway Point.','Good day.','Strong.',
    'Very good.','Almost ideal.','On the edge of ideal.','Ideal.','12/12. Clean day.'
  ];
  document.getElementById('scoreMsg').textContent = messages[score] || '';
}

// ---------- RENDER: COUNTERS ----------
const COUNTER_LIST = [
  { key:'mentees',    label:'Mentees',           goal: GOALS.mentees },
  { key:'networking', label:'Networking events',  goal: GOALS.networking },
  { key:'talks',      label:'Talks',              goal: GOALS.talks },
  { key:'lives',      label:'Live streams',       goal: GOALS.lives },
  { key:'init',       label:'+ in Initiation',    goal: GOALS.init },
  { key:'struct',     label:'+ in Structure',     goal: GOALS.struct }
];

function renderCounters() {
  const html = COUNTER_LIST.map(c => `
    <div class="counter">
      <div>
        <div class="cl">${c.label}</div>
        <div class="cv">${state.monthly[c.key] || 0}<span class="target"> / ${c.goal}</span></div>
      </div>
      <div class="controls">
        <button data-cnt="${c.key}" data-d="-1">−</button>
        <button data-cnt="${c.key}" data-d="1">+</button>
      </div>
    </div>
  `).join('');
  document.getElementById('counterGrid').innerHTML = html;
  document.querySelectorAll('#counterGrid button').forEach(b => {
    b.addEventListener('click', () => {
      const k = b.dataset.cnt;
      state.monthly[k] = Math.max(0, (state.monthly[k] || 0) + Number(b.dataset.d));
      renderCounters();
      scheduleSave();
      checkNewAchievements();
    });
  });
}

// ---------- RENDER: THIS WEEK ----------
function renderThisWeek() {
  const w          = currentWeekBounds();
  const elapsedEnd = w.today < w.end ? w.today : w.end;
  const sports     = countSportsInRange(w.start, elapsedEnd);
  const pomo       = sumNumInRange('pomo', w.start, elapsedEnd);
  const reports    = countCheckInRange('report_submitted', w.start, elapsedEnd);
  const reportTarget = weekdayReportTarget(w.start, elapsedEnd);
  let clean = 0;
  eachDayInRange(w.start, elapsedEnd, (_, key) => {
    const d = state.days[key];
    if (d && dayScore(d) >= 10) clean++;
  });
  const weekDaysElapsed = Math.floor((elapsedEnd - w.start) / (1000*60*60*24)) + 1;

  document.getElementById('weekMeta').textContent =
    `week ${w.index} · ${fmtDate(w.start).slice(5)} → ${fmtDate(w.end).slice(5)}`;

  document.getElementById('weeklyStats').innerHTML = [
    { label:'Sport',      value:`${sports}/3`,              sub:'minimum without penalty',  cls: sports >= 3 ? 'ok' : '' },
    { label:'Pomodoro',   value:`${pomo}/32`,               sub:'weekly pace',              cls: pomo >= 32 ? 'ok' : '' },
    { label:'Reports',    value:`${reports}/${reportTarget}`,sub:'weekdays only',           cls: reportTarget && reports >= reportTarget ? 'ok' : '' },
    { label:'Clean days', value:`${clean}/${weekDaysElapsed}`,sub:'10+ score days',        cls: clean >= weekDaysElapsed && weekDaysElapsed ? 'ok' : '' }
  ].map(x => `
    <div class="status-card ${x.cls}">
      <div class="sl">${x.label}</div>
      <div class="sv">${x.value}</div>
      <div class="ss">${x.sub}</div>
    </div>
  `).join('');

  const today = currentChallengeDate();
  const isWeekend = today.getDay() === 0 || today.getDay() === 6;
  document.getElementById('weekendMode').textContent = isWeekend
    ? 'Weekend recovery mode is active. No daily report, but base rules stay active.'
    : 'Weekday mode. Report by 00:00 and keep base rules active.';
}

// ---------- RENDER: PENALTY RISK ----------
function renderPenaltyRisk() {
  const today      = currentChallengeDate();
  const todayK     = fmtDate(today);
  const day        = state.days[todayK];
  const kcal       = day?.nums?.kcal;
  const reportDone = !!day?.checks?.report_submitted;
  const isWeekend  = today.getDay() === 0 || today.getDay() === 6;
  const w          = currentWeekBounds();
  const elapsedEnd = w.today < w.end ? w.today : w.end;
  const sports     = countSportsInRange(w.start, elapsedEnd);
  const pomo       = sumDays('pomo');
  const ended      = dateOnly(new Date()) > dateOnly(END_DATE);

  const risks = [
    {
      name:'Calories',
      detail: typeof kcal === 'number' ? `${kcal} / 2200 kcal today` : 'no calories entered today',
      tag: typeof kcal === 'number' ? (kcal > 2200 ? 'risk' : 'ok') : 'pending',
      cls: typeof kcal === 'number' ? (kcal > 2200 ? 'danger' : 'ok') : ''
    },
    {
      name:'Monthly Pomodoro',
      detail: `${pomo} / 160 total`,
      tag: ended ? (pomo >= 160 ? 'ok' : 'risk') : 'tracking',
      cls: ended ? (pomo >= 160 ? 'ok' : 'danger') : ''
    },
    {
      name:'Weekly Sport',
      detail: `${sports} / 3 activities this week`,
      tag: sports >= 3 ? 'ok' : 'pending',
      cls: sports >= 3 ? 'ok' : ''
    },
    {
      name:'Daily Report',
      detail: isWeekend ? 'weekend: report is off' : 'weekday report by 00:00',
      tag: isWeekend ? 'off' : (reportDone ? 'ok' : 'pending'),
      cls: !isWeekend && reportDone ? 'ok' : ''
    }
  ];

  document.getElementById('penaltyRiskList').innerHTML = risks.map(r => `
    <div class="risk-row ${r.cls}">
      <div>
        <div class="risk-name">${r.name}</div>
        <div class="risk-detail">${r.detail}</div>
      </div>
      <div class="risk-tag">${r.tag}</div>
    </div>
  `).join('');
}

// ---------- RENDER: HEATMAP ----------
function renderHeatmap(elementId) {
  const cont  = document.getElementById(elementId);
  if (!cont) return;
  const today = dateOnly(new Date());
  let html    = '';

  const startDow = (START_DATE.getDay() + 6) % 7;
  for (let i = 0; i < startDow; i++) html += '<div></div>';

  for (let i = 0; i < TOTAL_DAYS; i++) {
    const d        = new Date(START_DATE);
    d.setDate(d.getDate() + i);
    const key      = fmtDate(d);
    const isFuture = d > today;
    const isToday  = key === fmtDate(today);
    const day      = state.days[key];
    const score    = day ? dayScore(day) : 0;

    // Прошедший день без данных или score=0 — missed
    // Сегодня тоже missed если score=0 и время после 23:00
    const hour     = new Date().getHours();
    const isPast   = !isFuture && (!isToday || hour >= 23);
    const isMissed = isPast && score === 0;

    let cls = 's0';
    if      (score >= 12) cls = 's5';
    else if (score >= 10) cls = 's4';
    else if (score >= 7)  cls = 's3';
    else if (score >= 4)  cls = 's2';
    else if (score >= 1)  cls = 's1';

    const extraCls = [
      isFuture ? 'future' : '',
      isToday  ? 'today'  : '',
      isMissed ? 'missed' : ''
    ].filter(Boolean).join(' ');

    html += `<div class="hm-cell ${cls} ${extraCls}" data-key="${key}" data-score="${score}">
      <span class="num">${d.getDate()}</span>
      ${isMissed ? '<span class="hm-cross">✕</span>' : ''}
    </div>`;
  }
  cont.innerHTML = html;

  const tip = document.getElementById('tip');
  cont.querySelectorAll('.hm-cell[data-key]').forEach(el => {
    el.addEventListener('mouseenter', () => {
      const d     = new Date(el.dataset.key);
      const score = el.dataset.score;
      tip.innerHTML = `<div class="tip-h">${d.getDate()}.${String(d.getMonth()+1).padStart(2,'0')} · ${dowShort(d)}</div><div class="tip-s">Score ${score}/12</div>`;
      const r = el.getBoundingClientRect();
      tip.style.left = (r.left + window.scrollX + r.width/2 - 60) + 'px';
      tip.style.top  = (r.top  + window.scrollY - 50) + 'px';
      tip.classList.add('show');
    });
    el.addEventListener('mouseleave', () => tip.classList.remove('show'));

    if (elementId === 'historyHeatmap' && !el.classList.contains('future')) {
      el.addEventListener('click', () => showDayDetail(el.dataset.key));
    }
  });
}

function renderHistoryHeatmap() { renderHeatmap('historyHeatmap'); }

// ---------- RENDER: DAY DETAIL ----------
function showDayDetail(key) {
  const d    = new Date(key);
  const day  = state.days[key];
  const wrap = document.getElementById('dayDetailWrap');

  if (!day) {
    wrap.innerHTML = `
      <div class="day-detail-panel">
        <h3>${d.getDate()}.${String(d.getMonth()+1).padStart(2,'0')} · ${dowLong(d)}</h3>
        <p style="color:var(--text-faint);font-style:italic;margin-bottom:16px;">No data for this day.</p>
        <button class="picker-btn" id="goEditBtn">fill in →</button>
      </div>`;
    document.getElementById('goEditBtn').addEventListener('click', () => {
      selectedDate = key;
      document.querySelector('.tab[data-tab="today"]').click();
    });
    return;
  }

  const score      = dayScore(day);
  const checked    = SCORE_KEYS.filter(k => day.checks[k]);
  const sportItems = [];
  if (day.checks?.gym) sportItems.push('Gym');
  if (day.checks?.run) sportItems.push('Run');
  if (day.checks?.box) sportItems.push('Boxing');

  wrap.innerHTML = `
    <div class="day-detail-panel">
      <h3>${d.getDate()}.${String(d.getMonth()+1).padStart(2,'0')} · ${dowLong(d)}</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:16px;margin-bottom:24px;">
        <div><div style="font-size:10px;color:var(--text-faint);text-transform:uppercase;letter-spacing:0.15em;margin-bottom:4px;">Score</div><div style="font-family:'Roboto Mono',serif;font-size:24px;font-weight:700;">${score}/12</div></div>
        <div><div style="font-size:10px;color:var(--text-faint);text-transform:uppercase;letter-spacing:0.15em;margin-bottom:4px;">Steps</div><div style="font-family:'Roboto Mono',serif;font-size:20px;font-weight:600;">${day.nums.steps ?? '—'}</div></div>
        <div><div style="font-size:10px;color:var(--text-faint);text-transform:uppercase;letter-spacing:0.15em;margin-bottom:4px;">Calories</div><div style="font-family:'Roboto Mono',serif;font-size:20px;font-weight:600;">${day.nums.kcal ?? '—'}</div></div>
        <div><div style="font-size:10px;color:var(--text-faint);text-transform:uppercase;letter-spacing:0.15em;margin-bottom:4px;">Pomodoro</div><div style="font-family:'Roboto Mono',serif;font-size:20px;font-weight:600;">${day.nums.pomo ?? '—'}</div></div>
        <div><div style="font-size:10px;color:var(--text-faint);text-transform:uppercase;letter-spacing:0.15em;margin-bottom:4px;">Sleep</div><div style="font-family:'Roboto Mono',serif;font-size:20px;font-weight:600;">${day.nums.sleep_h ?? '—'} h</div></div>
        <div><div style="font-size:10px;color:var(--text-faint);text-transform:uppercase;letter-spacing:0.15em;margin-bottom:4px;">Sport</div><div style="font-family:'Roboto Mono',serif;font-size:14px;font-weight:600;">${sportItems.join(' · ') || '—'}</div></div>
      </div>
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:var(--text-faint);margin-bottom:8px;">Completed</div>
      <div style="font-size:13px;color:var(--text-dim);line-height:1.8;margin-bottom:24px;">${checked.length ? checked.map(k => HABIT_LABELS[k]).join(' · ') : 'nothing'}</div>
      ${day.reflection ? `
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:var(--text-faint);margin-bottom:8px;">Reflection</div>
        <div style="font-family:'Roboto Mono',serif;font-style:italic;color:var(--text-dim);line-height:1.7;font-size:15px;margin-bottom:16px;">${escapeHTML(day.reflection).replace(/\n/g,'<br>')}</div>
      ` : ''}
      <button class="picker-btn" id="editDayBtn">edit →</button>
    </div>`;

  document.getElementById('editDayBtn').addEventListener('click', () => {
    selectedDate = key;
    document.querySelector('.tab[data-tab="today"]').click();
  });
}

// ---------- RENDER: RADAR CHART (Shape) ----------
let radarChart = null;
function renderRadar() {
  const elapsed = Math.max(elapsedDays(), 1);

  const bodyKeys = ['steps_8k','kcal_under','sleep_7','no_alco','no_smoke','no_sweets'];
  const mindKeys = ['silence_10','no_phone_morning','no_phone_night','early_rise'];

  const bodyAvg    = bodyKeys.map(k => countDayChecks(k)).reduce((a,b)=>a+b,0) / (bodyKeys.length * elapsed) * 100;
  const mindAvg    = mindKeys.map(k => countDayChecks(k)).reduce((a,b)=>a+b,0) / (mindKeys.length * elapsed) * 100;
  const moneyPct   = Math.min(100, (sumDays('pomo')/GOALS.pomo*0.5 + sumDays('diag')/GOALS.diag*0.3 + state.monthly.mentees/GOALS.mentees*0.2) * 100);
  const contentPct = Math.min(100, (sumDays('content')/GOALS.content*0.5 + state.monthly.init/GOALS.init*0.3 + state.monthly.struct/GOALS.struct*0.2) * 100);

  const data = [Math.round(bodyAvg), Math.round(mindAvg), Math.round(moneyPct), Math.round(contentPct)];

  // Ensure canvas exists in radar-wrap
  const wrap = document.querySelector('.radar-wrap');
  if (!wrap) return;
  if (!wrap.querySelector('canvas')) {
    wrap.innerHTML = '<canvas id="radarChart" role="img" aria-label="Shape radar"></canvas>';
  }
  const ctx = document.getElementById('radarChart');
  if (!ctx) return;

  if (radarChart) radarChart.destroy();
  radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Body', 'Mindset', 'Money', 'Content'],
      datasets: [{
        data,
        backgroundColor: 'rgba(255,255,255,0.22)',
        borderColor: '#e8e8e8',
        borderWidth: 2,
        pointBackgroundColor: '#e8e8e8',
        pointBorderColor: '#e8e8e8',
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: { top: 20, bottom: 20, left: 20, right: 20 }
      },
      plugins: { legend: { display: false } },
      scales: {
        r: {
          angleLines: { color: 'rgba(255,255,255,0.06)' },
          grid:       { color: 'rgba(255,255,255,0.06)' },
          min: 0, max: 100,
          ticks: { display: false, stepSize: 25 },
          pointLabels: {
            color: '#888',
            font: { family: 'Roboto Mono', size: 11, weight: 700 },
            padding: 10
          }
        }
      }
    }
  });
}

// ---------- RENDER: TREND CHART ----------
let trendChart = null;
function renderTrend() {
  const labels = [], scores = [];
  for (let i = 0; i < TOTAL_DAYS; i++) {
    const d   = new Date(START_DATE);
    d.setDate(d.getDate() + i);
    const key = fmtDate(d);
    labels.push(d.getDate() + '.' + String(d.getMonth()+1).padStart(2,'0'));
    scores.push(state.days[key] ? dayScore(state.days[key]) : null);
  }

  const ctx = document.getElementById('trendChart');
  if (!ctx) return;
  if (trendChart) trendChart.destroy();
  trendChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: scores,
        backgroundColor: scores.map(s =>
          s === null ? 'rgba(232,232,232,0.06)' :
          s >= 10    ? 'rgba(232,232,232,0.9)'  :
          s >= 7     ? 'rgba(232,232,232,0.5)'  :
                       'rgba(232,232,232,0.2)'
        ),
        borderWidth: 0,
        borderRadius: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { display: false }, ticks: { color: '#747474', font: { family: 'Roboto Mono', size: 9 } } },
        y: { min: 0, max: 12, grid: { color: 'rgba(232,232,232,0.08)' }, ticks: { color: '#747474', font: { family: 'Roboto Mono', size: 9 }, stepSize: 3 } }
      },
      plugins: { legend: { display: false }, tooltip: {
        callbacks: { label: ctx => `Score: ${ctx.raw ?? '—'}/12` }
      }}
    }
  });
}

// ---------- RENDER: RINGS ----------
function renderRings() {
  const rings = [
    { label:'Pomodoro',  val: sumDays('pomo'),           goal: GOALS.pomo },
    { label:'Diagnostics',val:sumDays('diag'),           goal: GOALS.diag },
    { label:'Content',   val: sumDays('content'),        goal: GOALS.content },
    { label:'Mentees',   val: state.monthly.mentees,     goal: GOALS.mentees },
    { label:'Networking',val: state.monthly.networking,  goal: GOALS.networking },
    { label:'Talks',     val: state.monthly.talks,       goal: GOALS.talks },
    { label:'Lives',     val: state.monthly.lives,       goal: GOALS.lives }
  ];

  document.getElementById('ringGrid').innerHTML = rings.map(r => {
    const pct = Math.min(100, Math.round(r.val / r.goal * 100));
    const circ = 2 * Math.PI * 40;
    const dash = circ * pct / 100;
    return `
      <div class="ring-card">
        <svg class="ring-svg" viewBox="0 0 104 104">
          <circle cx="52" cy="52" r="40" fill="none" stroke="rgba(232,232,232,0.12)" stroke-width="8"/>
          <circle cx="52" cy="52" r="40" fill="none" stroke="#e8e8e8" stroke-width="8"
            stroke-dasharray="${dash} ${circ}" stroke-dashoffset="${circ/4}"
            stroke-linecap="square" transform="rotate(-90 52 52)"
            style="transition:stroke-dasharray 0.6s linear"/>
          <text x="52" y="57" text-anchor="middle" fill="#e8e8e8"
            font-family="Roboto Mono,monospace" font-size="16" font-weight="700">${pct}%</text>
        </svg>
        <div class="rl">${r.label}</div>
        <div class="rv">${r.val} <span style="color:var(--text-faint);font-size:13px;">/ ${r.goal}</span></div>
      </div>`;
  }).join('');
}

// ---------- RENDER: HABIT BARS ----------
function renderHabitBars(elapsed) {
  const el = elapsed || elapsedDays();
  document.getElementById('habitMeta').textContent = `of ${el} elapsed`;
  if (!el) { document.getElementById('habitBars').innerHTML = ''; return; }

  document.getElementById('habitBars').innerHTML = SCORE_KEYS.map(k => {
    const cnt  = countDayChecks(k);
    const pct  = Math.round(cnt / el * 100);
    const cls  = pct >= 80 ? 'gold' : pct >= 50 ? 'success' : 'warn';
    return `
      <div class="lbar">
        <div class="lbar-track">
          ${pct > 0 ? `<div class="lbar-fill ${cls}" style="width:${pct}%"><span class="lbar-label">${HABIT_LABELS[k]}</span></div>` : `<span class="lbar-empty-label">${HABIT_LABELS[k]}</span>`}
        </div>
        <div class="lbar-val ${pct >= 100 ? 'done' : ''}">${cnt}<span class="target">/${el}</span></div>
      </div>`;
  }).join('');
}

// ---------- TOAST QUEUE ----------
let toastQueue = [];
let toastBusy  = false;

function showToast(name) {
  toastQueue.push(name);
  if (!toastBusy) processToastQueue();
}

function processToastQueue() {
  if (!toastQueue.length) { toastBusy = false; return; }
  toastBusy = true;
  const name  = toastQueue.shift();
  const toast = document.getElementById('toast');
  document.getElementById('toastName').textContent = name;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(processToastQueue, 300);
  }, 3000);
}

// ---------- ACHIEVEMENTS ----------
function checkNewAchievements() {
  const stats = statsForAchievements();
  let newOnes = false;
  ACHIEVEMENTS.forEach(a => {
    if (!state.unlockedAchievements.includes(a.id) && a.check(stats)) {
      state.unlockedAchievements.push(a.id);
      showToast(a.name);
      newOnes = true;
    }
  });
  if (newOnes) scheduleSave();
}

function renderAchievements() {
  // Сначала проверяем новые — чтобы state был актуален
  checkNewAchievements();

  const stats = statsForAchievements();
  document.getElementById('achTotal').textContent    = ACHIEVEMENTS.length;
  document.getElementById('achUnlocked').textContent = state.unlockedAchievements.length;

  document.getElementById('achievementsList').innerHTML = ACHIEVEMENTS.map(a => {
    const unlocked = state.unlockedAchievements.includes(a.id);
    return `
      <div class="ach ${unlocked ? 'unlocked' : ''}">
        <div class="ach-icon">${a.icon}</div>
        <div class="ach-name">${a.name}</div>
        <div class="ach-desc">${a.desc}</div>
        <div class="ach-progress"><div class="fill" style="width:${unlocked ? 100 : 0}%"></div></div>
      </div>`;
  }).join('');
}

// ---------- RENDER: MACROS ----------
function renderMacros() {
  const el = elapsedDays() || 1;
  const today = fmtDate(currentChallengeDate());
  const day   = state.days[today];

  const macros = [
    {
      key:   'protein',
      label: 'Protein',
      unit:  'g',
      goal:  MACRO_NORMS.protein.goal,
      mode:  'min',
      val:   day?.nums?.protein ?? null,
      hint:  '170g+ target'
    },
    {
      key:   'fat',
      label: 'Fat',
      unit:  'g',
      goal:  MACRO_NORMS.fat.goal,
      mode:  'max',
      val:   day?.nums?.fat ?? null,
      hint:  'up to 75g'
    },
    {
      key:   'carbs',
      label: 'Carbs',
      unit:  'g',
      goal:  MACRO_NORMS.carbs.goal,
      mode:  'max',
      val:   day?.nums?.carbs ?? null,
      hint:  'up to 260g'
    }
  ];

  const wrap = document.getElementById('macrosWrap');
  if (!wrap) return;

  wrap.innerHTML = macros.map(m => {
    if (m.val === null) {
      return `
        <div class="macro-row">
          <div class="macro-info">
            <div class="macro-label">${m.label}</div>
            <div class="macro-hint">${m.hint}</div>
          </div>
          <div class="macro-bar-wrap">
            <div class="macro-bar-track">
              <span class="macro-empty">no data today</span>
            </div>
          </div>
          <div class="macro-val dim">—<span class="macro-unit"> g</span></div>
        </div>`;
    }

    const pct  = Math.min(Math.round(m.val / m.goal * 100), 200);
    const over = m.val > m.goal;

    // Status logic
    let status, statusCls;
    if (m.mode === 'min') {
      // protein — more is better
      if (m.val >= m.goal)      { status = '✓ good';  statusCls = 'ok'; }
      else if (m.val >= m.goal * 0.8) { status = 'low';   statusCls = 'warn'; }
      else                      { status = 'too low'; statusCls = 'danger'; }
    } else {
      // fat/carbs — less is better
      if (m.val <= m.goal)      { status = '✓ ok';    statusCls = 'ok'; }
      else if (m.val <= m.goal * 1.15) { status = '+' + (m.val - m.goal) + 'g over'; statusCls = 'warn'; }
      else                      { status = '+' + (m.val - m.goal) + 'g over'; statusCls = 'danger'; }
    }

    const barPct  = Math.min(pct, 100);
    const overPct = over ? Math.min(Math.round((m.val - m.goal) / m.goal * 100), 100) : 0;
    const freeGreenPct = (!over && m.mode === 'max') ? (100 - barPct) : 0;

    return `
      <div class="macro-row">
        <div class="macro-info">
          <div class="macro-label">${m.label}</div>
          <div class="macro-hint">${m.hint}</div>
        </div>
        <div class="macro-bar-wrap">
          <div class="macro-bar-track">
            <div class="macro-bar-fill ${statusCls}" style="width:${barPct}%"></div>
            ${freeGreenPct > 0 ? `<div class="macro-bar-free" style="width:${freeGreenPct}%;left:${barPct}%"></div>` : ''}
            ${over ? `<div class="macro-bar-over ${m.mode === 'min' ? 'good' : ''}" style="width:${overPct}%"></div>` : ''}
          </div>
          <div class="macro-status ${statusCls}">${status}</div>
        </div>
        <div class="macro-val ${statusCls === 'ok' ? 'done' : ''}">${m.val}<span class="macro-unit"> g</span></div>
      </div>`;
  }).join('');
}

// ---------- RENDER: DASHBOARD ----------
function renderDashboard() {
  const elapsed = elapsedDays();
  document.getElementById('dayCounter').textContent =
    elapsed === 0 ? 'not started' : `day ${elapsed} / ${TOTAL_DAYS}`;

  const xpInfo = levelFromXP(calcXP());
  document.getElementById('level').textContent    = xpInfo.level;
  document.getElementById('xpFill').style.width   = (xpInfo.current / xpInfo.next * 100) + '%';
  document.getElementById('xpCurrent').textContent = `${xpInfo.current} / ${xpInfo.next} XP`;
  document.getElementById('xpNext').textContent    = `to LVL ${xpInfo.level + 1}`;

  const streakInfo = maxStreakDays();
  document.getElementById('streak').textContent    = streakInfo.current;
  document.getElementById('streakSub').textContent = streakInfo.current === 0 ? 'start today' :
    streakInfo.max > streakInfo.current ? `record ${streakInfo.max}` : 'days in a row';

  const cleanDays = Object.values(state.days).filter(d => dayScore(d) >= 10).length;
  document.getElementById('cleanDays').textContent  = cleanDays;
  document.getElementById('elapsedDays').textContent = elapsed || TOTAL_DAYS;
  const pct = elapsed ? Math.round(cleanDays / elapsed * 100) : 0;
  document.getElementById('cleanRate').textContent  = pct + '% perfection';

  renderThisWeek();
  renderPenaltyRisk();
  renderMacros();
  renderHeatmap('heatmap');
  renderRadar();
  renderTrend();
  renderRings();
  renderHabitBars(elapsed);
}

// ---------- RENDER: REPORT ----------
function renderReport() {
  const elapsed    = elapsedDays();
  const d          = new Date();
  const dateStr    = `${d.getDate()}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
  const streakInfo = maxStreakDays();
  const cleanDays  = Object.values(state.days).filter(d => dayScore(d) >= 10).length;
  const cleanPct   = elapsed ? Math.round(cleanDays / elapsed * 100) : 0;
  const xpInfo     = levelFromXP(calcXP());
  const pomo       = sumDays('pomo');
  const diag       = sumDays('diag');
  const content    = sumDays('content');
  const todayDay      = state.days[fmtDate(new Date())];
  const todayScore    = todayDay ? dayScore(todayDay) : 0;
  const todayPomo     = todayDay?.nums?.pomo ?? null;
  const todayKcal     = todayDay?.nums?.kcal ?? null;
  const todayReport   = !!todayDay?.checks?.report_submitted;
  const todaySteps    = todayDay?.nums?.steps ?? null;
  const isWeekend     = new Date().getDay() === 0 || new Date().getDay() === 6;
  const el2           = Math.max(elapsed, 1);
  const challengePct = elapsed ? Math.round(elapsed/TOTAL_DAYS*100) : 0;

  const bodyKeys = ['steps_8k','kcal_under','sleep_7','no_alco','no_smoke','no_sweets'];
  const mindKeys = ['silence_10','no_phone_morning','no_phone_night','early_rise'];
  const spiderData = [
    Math.round(bodyKeys.reduce((s,k)=>s+countDayChecks(k),0)/(bodyKeys.length*el2)*100),
    Math.round(mindKeys.reduce((s,k)=>s+countDayChecks(k),0)/(mindKeys.length*el2)*100),
    Math.min(100,Math.round((pomo/GOALS.pomo*0.5+diag/GOALS.diag*0.3+state.monthly.mentees/GOALS.mentees*0.2)*100)),
    Math.min(100,Math.round((content/GOALS.content*0.5+state.monthly.init/GOALS.init*0.3+state.monthly.struct/GOALS.struct*0.2)*100))
  ];
  const spiderLabels = ['Body','Mindset','Money','Content'];
  const overallShape = Math.round(spiderData.reduce((a,b)=>a+b,0)/4);

  function buildSpider(data, labels, size) {
    const pad = 36;
    const cx = size/2, cy = size/2, r = (size/2 - pad) * 0.97;
    const vb = `${-pad} ${-pad} ${size+pad*2} ${size+pad*2}`;
    const angles = [-90, 0, 90, 180];
    const grids = [0.25,0.5,0.75,1.0].map(lvl => {
      const pts = angles.map(a=>{const rad=a*Math.PI/180;return `${cx+r*lvl*Math.cos(rad)},${cy+r*lvl*Math.sin(rad)}`;});
      return `<polygon points="${pts}" fill="none" stroke="rgba(232,232,232,0.1)" stroke-width="1"/>`;
    }).join('');
    const axes = angles.map(a=>{const rad=a*Math.PI/180;return `<line x1="${cx}" y1="${cy}" x2="${cx+r*Math.cos(rad)}" y2="${cy+r*Math.sin(rad)}" stroke="rgba(232,232,232,0.1)" stroke-width="1"/>`;}).join('');
    const dataPts = angles.map((a,i)=>{const rad=a*Math.PI/180,dist=r*Math.min(data[i],100)/100;return `${cx+dist*Math.cos(rad)},${cy+dist*Math.sin(rad)}`;}).join(' ');
    const lbls = angles.map((a,i)=>{
      const rad=a*Math.PI/180,lx=cx+(r+26)*Math.cos(rad),ly=cy+(r+26)*Math.sin(rad);
      const anchor=a===0?'start':a===180?'end':'middle';
      const dy=a===-90?'-4':a===90?'12':'4';
      return `<text x="${lx}" y="${ly}" dy="${dy}" text-anchor="${anchor}" font-family="Roboto Mono,monospace" font-size="11" font-weight="800" fill="#888">${labels[i]}</text><text x="${lx}" y="${ly}" dy="${a===-90?'10':a===90?'24':'17'}" text-anchor="${anchor}" font-family="Roboto Mono,monospace" font-size="9" fill="#555">${data[i]}%</text>`;
    }).join('');
    return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(232,232,232,0.05)" stroke-width="1"/>${grids}${axes}<polygon points="${dataPts}" fill="rgba(255,255,255,0.12)" stroke="#e8e8e8" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="4" fill="#e8e8e8"/>${lbls}</svg>`;
  }

  const bar = (pct, h=6) => `<div class="rp2-bar" style="height:${h}px"><div style="width:${Math.min(100,pct)}%"></div></div>`;

  const wrap = document.getElementById('reportWrap');
  if (!wrap) return;

  wrap.innerHTML = `
  <div class="rp2-page">
    <div class="rp2-top">
      <div>
        <div class="rp2-brand">CLEARMAY</div>
        <div class="rp2-meta">${dateStr} &nbsp;·&nbsp; Day ${elapsed} / ${TOTAL_DAYS} &nbsp;·&nbsp; ${TOTAL_DAYS-elapsed} left</div>
      </div>
    </div>

    <div class="rp2-big4">
      <div class="rp2-big">
        <div class="rp2-big-v">${todayScore}<span class="rp2-big-s">/12</span></div>
        <div class="rp2-big-l">Today score</div>
        ${bar(todayScore/12*100, 4)}
      </div>
      <div class="rp2-big">
        <div class="rp2-big-v">${streakInfo.current}<span class="rp2-big-s">d</span></div>
        <div class="rp2-big-l">Streak</div>
        ${bar(streakInfo.current/TOTAL_DAYS*100, 4)}
      </div>
    </div>

    <div class="rp2-mid">
      <div class="rp2-spider-wrap">
        <div class="rp2-spider-title">Shape &nbsp;<span>${overallShape}%</span></div>
        <div class="rp2-spider">${buildSpider(spiderData, spiderLabels, 260)}</div>
      </div>
      <div class="rp2-progress-wrap">
        <div class="rp2-prog-title">Challenge</div>
        <div class="rp2-prog-big">${challengePct}<span>%</span></div>
        ${bar(challengePct, 8)}
        <div class="rp2-prog-sub">${elapsed} of ${TOTAL_DAYS} days done</div>

        <div class="rp2-prog-title" style="margin-top:24px;">Key metrics</div>
        <div class="rp2-goal-row"><span>Pomodoro</span><span>${pomo}/${GOALS.pomo}</span></div>
        ${bar(pomo/GOALS.pomo*100, 5)}
        <div class="rp2-goal-row"><span>Calories today</span><span>${todayKcal !== null ? todayKcal : '—'}/2200</span></div>
        ${bar(todayKcal !== null ? Math.min(todayKcal/2200*100, 100) : 0, 5)}
        <div class="rp2-goal-row"><span>Report today</span><span style="color:${todayReport ? '#64c864' : isWeekend ? 'var(--text-faint)' : 'var(--danger)'}">${todayReport ? '✓ done' : isWeekend ? '— weekend' : '✕ missing'}</span></div>
      </div>
    </div>

    <div class="rp2-footer">
      CLEARMAY &nbsp;·&nbsp; ${dateStr} &nbsp;·&nbsp; day ${elapsed}/${TOTAL_DAYS} &nbsp;·&nbsp; streak ${streakInfo.current} &nbsp;·&nbsp; lvl ${xpInfo.level} &nbsp;·&nbsp; ${cleanPct}% clean
    </div>
  </div>`;
}


// ---------- EVENT LISTENERS ----------
function bindEvents() {
  // Tabs
  document.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      document.getElementById('tab-' + t.dataset.tab).classList.add('active');
      if (t.dataset.tab === 'dashboard')    renderDashboard();
      if (t.dataset.tab === 'history')      renderHistoryHeatmap();
      if (t.dataset.tab === 'today')        renderToday();
      if (t.dataset.tab === 'achievements') renderAchievements();
      if (t.dataset.tab === 'report')       renderReport();
    });
  });

  // Date picker
  document.getElementById('datePicker').addEventListener('change', e => {
    selectedDate = e.target.value || todayKey();
    renderToday();
  });
  document.getElementById('todayBtn').addEventListener('click', () => {
    selectedDate = todayKey();
    renderToday();
  });
  document.getElementById('prevBtn').addEventListener('click', () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    selectedDate = fmtDate(d);
    renderToday();
  });
  document.getElementById('nextBtn').addEventListener('click', () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    if (d > new Date()) return;
    selectedDate = fmtDate(d);
    renderToday();
  });

  // Checkboxes
  document.querySelectorAll('#tab-today .check-item').forEach(el => {
    el.addEventListener('click', () => {
      const day = getDayData(selectedDate);
      const k   = el.dataset.check;
      day.checks[k] = !day.checks[k];
      el.classList.toggle('checked');
      el.classList.toggle('missed-check', dateOnly(new Date(selectedDate)) < dateOnly(new Date()) && !day.checks[k]);
      updateScoreToday();
      scheduleSave();
      checkNewAchievements();
    });
  });

  // Number inputs
  document.querySelectorAll('#tab-today input[data-num]').forEach(el => {
    el.addEventListener('input', () => {
      const day = getDayData(selectedDate);
      day.nums[el.dataset.num] = el.value === '' ? null : Number(el.value);
      scheduleSave();
      checkNewAchievements();
    });
  });

  // Reflection
  let reflTimer;
  document.getElementById('reflectionText').addEventListener('input', e => {
    getDayData(selectedDate).reflection = e.target.value;
    clearTimeout(reflTimer);
    reflTimer = setTimeout(saveState, 800);
  });
}

// ---------- INIT APP ----------
async function initApp() {
  await loadState();
  bindEvents();
  renderDashboard();
  renderToday();
  checkNewAchievements();
}

// ---------- BOOT ----------
document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('cm_auth') === '1') {
    document.getElementById('passwordScreen').style.display = 'none';
    document.getElementById('app').style.display = '';
    initApp();
  } else {
    initPasswordScreen();
  }
});
