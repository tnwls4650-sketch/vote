/*
  투표 저장소 (Google Apps Script)

  동작
  - 참가자가 투표하면 "투표" 탭에 [시간, 기기ID, 선택] 한 줄을 남깁니다.
  - 같은 기기ID는 한 번만 기록됩니다 (두 번째부터는 처음 선택을 돌려줍니다).
  - 결과 화면은 후보별 득표 수를 받아 갑니다.

  사용법
  1. 새 구글 스프레드시트를 만듭니다. (탭은 자동으로 만들어집니다)
  2. 메뉴 [확장 프로그램] → [Apps Script]를 열고, 기본 코드를 지운 뒤 이 파일 내용을 붙여넣습니다.
  3. [배포] → [새 배포] → 유형 "웹 앱"
     · 실행 사용자: 나
     · 액세스 권한: 모든 사용자
  4. 웹 앱 URL을 data/candidates.js의 voteUrl에 넣습니다.
  5. 투표를 처음부터 다시 하려면 "투표" 탭의 2행부터 지우면 됩니다.
*/

const VOTE_SHEET = '투표';

function doPost(e){
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    const device = String(data.device || '').trim();
    const choice = String(data.choice || '').trim();
    if(!device || !choice) return out_({ ok: false, error: 'device and choice required' });

    const sheet = getSheet_();
    const rows = sheet.getDataRange().getValues();
    for(let r = 1; r < rows.length; r++){
      if(String(rows[r][1]) === device){
        return out_({ ok: true, already: true, choice: String(rows[r][2]) });
      }
    }
    sheet.appendRow([new Date(), device, choice]);
    return out_({ ok: true, already: false, choice: choice });
  } catch(err){
    return out_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet(){
  const rows = getSheet_().getDataRange().getValues();
  const counts = {};
  let total = 0;
  for(let r = 1; r < rows.length; r++){
    const choice = String(rows[r][2] || '').trim();
    if(!choice) continue;
    counts[choice] = (counts[choice] || 0) + 1;
    total++;
  }
  return out_({ ok: true, total: total, counts: counts });
}

function getSheet_(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(VOTE_SHEET);
  if(!sheet){
    sheet = ss.insertSheet(VOTE_SHEET);
    sheet.appendRow(['시간', '기기ID', '선택']);
  }
  return sheet;
}

function out_(obj){
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
