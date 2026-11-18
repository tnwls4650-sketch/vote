/*
  과제 발표 투표 저장소 (Google Apps Script)

  탭 구성 (없으면 자동으로 만들어집니다)
  - 설정 : 제목·부제목·투표 시간·진행 상태 (ready=시작 전 / open=투표중 / closed=마감)
  - 명단 : 순번, 성명, 소속, 과제명  ← 관리자 화면(?admin)에서 저장
  - 투표 : 시간, 회차, 기기ID, 선택

  한 기기는 회차마다 한 표. 관리자 화면의 "투표 초기화"를 누르면 회차가 올라가고 투표 기록이 지워집니다.

  배포: [배포] → [새 배포] → 웹 앱 / 실행 사용자: 나 / 액세스: 모든 사용자
  코드 수정 후: [배포] → [배포 관리] → 연필 → 버전 "새 버전" → 배포 (URL 유지)
*/

const ADMIN_PIN = '4827';   // 관리자·발표 화면 PIN

const SHEET_SETTINGS = '설정', SHEET_ROSTER = '명단', SHEET_VOTES = '투표';
const HEADERS = {
  '설정': ['항목', '값'],
  '명단': ['순번', '성명', '소속', '과제명'],
  '투표': ['시간', '회차', '기기ID', '선택']
};
const DEFAULTS = {
  title: '과제 발표 투표',
  subtitle: '가장 인상 깊었던 과제에 한 표를 주세요',
  status: 'ready', round: '1', voteSeconds: '20', countdownSeconds: '5'
};
const EDITABLE = ['title', 'subtitle', 'voteSeconds', 'countdownSeconds'];

function doGet(){
  try { return out_(state_()); }
  catch(err){ return out_({ ok: false, error: String(err) }); }
}

function doPost(e){
  let body;
  try { body = JSON.parse((e.postData && e.postData.contents) || '{}'); }
  catch(err){ return out_({ ok: false, error: 'bad json' }); }

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    if(body.action === 'vote') return out_(vote_(body));
    if(String(body.pin) !== ADMIN_PIN) return out_({ ok: false, error: 'pin' });
    switch(body.action){
      case 'login':
        return out_({ ok: true });
      case 'setStatus':
        if(['ready', 'open', 'closed'].indexOf(body.status) < 0) return out_({ ok: false, error: 'status' });
        setSetting_('status', body.status);
        return out_(state_());
      case 'saveRoster':
        saveRoster_(body);
        return out_(state_());
      case 'reset':
        resetVotes_();
        return out_(state_());
    }
    return out_({ ok: false, error: 'unknown action' });
  } catch(err){
    return out_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* 처음 한 번 실행하면 탭 세 개를 만들어 둡니다 (안 해도 자동 생성) */
function setup(){
  [SHEET_SETTINGS, SHEET_ROSTER, SHEET_VOTES].forEach(sheet_);
  const s = settings_();
  Object.keys(DEFAULTS).forEach(k => setSetting_(k, s[k]));
}

function state_(){
  const s = settings_();
  const counts = {};
  let total = 0;
  const rows = sheet_(SHEET_VOTES).getDataRange().getValues();
  for(let r = 1; r < rows.length; r++){
    if(String(rows[r][1]) !== String(s.round)) continue;
    const choice = String(rows[r][3] || '').trim();
    if(!choice) continue;
    counts[choice] = (counts[choice] || 0) + 1;
    total++;
  }
  return { ok: true, config: s, candidates: roster_(), counts: counts, total: total };
}

function vote_(body){
  const s = settings_();
  if(s.status !== 'open') return { ok: false, error: 'not_open', status: s.status };
  const device = String(body.device || '').trim();
  const choice = String(body.choice || '').trim();
  if(!device || !choice) return { ok: false, error: 'device and choice required' };
  if(!roster_().some(c => c.name === choice)) return { ok: false, error: 'unknown candidate' };

  const sheet = sheet_(SHEET_VOTES);
  const rows = sheet.getDataRange().getValues();
  for(let r = 1; r < rows.length; r++){
    if(String(rows[r][1]) === String(s.round) && String(rows[r][2]) === device){
      return { ok: true, already: true, choice: String(rows[r][3]) };
    }
  }
  sheet.appendRow([new Date(), String(s.round), device, safe_(choice)]);
  return { ok: true, already: false, choice: choice };
}

function saveRoster_(body){
  const list = Array.isArray(body.candidates) ? body.candidates.slice(0, 60) : [];
  const rows = list
    .map(c => [String(c.name || '').trim(), String(c.team || '').trim(), String(c.project || '').trim()])
    .filter(r => r[0])
    .map((r, i) => [i + 1, safe_(r[0]), safe_(r[1]), safe_(r[2])]);
  const sheet = sheet_(SHEET_ROSTER);
  const last = sheet.getLastRow();
  if(last > 1) sheet.getRange(2, 1, last - 1, 4).clearContent();
  if(rows.length) sheet.getRange(2, 1, rows.length, 4).setValues(rows);

  const cfg = body.config || {};
  EDITABLE.forEach(k => { if(cfg[k] !== undefined) setSetting_(k, String(cfg[k]).slice(0, 200)); });
}

function resetVotes_(){
  const sheet = sheet_(SHEET_VOTES);
  const last = sheet.getLastRow();
  if(last > 1) sheet.deleteRows(2, last - 1);
  const s = settings_();
  setSetting_('round', String((parseInt(s.round, 10) || 1) + 1));
  setSetting_('status', 'ready');
}

function roster_(){
  const rows = sheet_(SHEET_ROSTER).getDataRange().getValues();
  const out = [];
  for(let r = 1; r < rows.length; r++){
    const name = String(rows[r][1] || '').trim();
    if(!name) continue;
    out.push({ name: name, team: String(rows[r][2] || '').trim(), project: String(rows[r][3] || '').trim() });
  }
  return out;
}

function settings_(){
  const rows = sheet_(SHEET_SETTINGS).getDataRange().getValues();
  const s = Object.assign({}, DEFAULTS);
  for(let r = 1; r < rows.length; r++){
    const k = String(rows[r][0] || '').trim();
    if(k) s[k] = String(rows[r][1]);
  }
  return s;
}

function setSetting_(key, value){
  const sheet = sheet_(SHEET_SETTINGS);
  const rows = sheet.getDataRange().getValues();
  for(let r = 1; r < rows.length; r++){
    if(String(rows[r][0]).trim() === key){
      sheet.getRange(r + 1, 2).setValue(safe_(value));
      return;
    }
  }
  sheet.appendRow([key, safe_(value)]);
}

function sheet_(name){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if(!sheet){
    sheet = ss.insertSheet(name);
    sheet.appendRow(HEADERS[name]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// 수식으로 해석되지 않도록
function safe_(v){
  const s = String(v == null ? '' : v);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function out_(obj){
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
