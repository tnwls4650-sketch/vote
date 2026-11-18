/*
  연결 설정 파일

  - voteUrl : 구글 시트 저장소(Apps Script 웹앱) 주소. 후보 명단·제목·투표 기록은 모두 여기에 저장됩니다.
              명단은 이 파일이 아니라 관리자 화면(주소 뒤에 ?admin)에서 넣습니다.
              비워 두면 연습 모드 — 이 브라우저 안에서만 동작합니다 (연습 PIN: 0000).
  - qrUrl   : 참가자용 QR이 가리킬 주소 (비우면 현재 페이지 주소)
*/
window.VOTE = {
  voteUrl: "https://script.google.com/macros/s/AKfycbxIC1YgaDiSiviEBNrxhJzl91BWtKmBPvpsc5SraRt-9-TCuwZwoS8jPy8fSp1YDb8Dmw/exec",
  qrUrl: "https://tnwls4650-sketch.github.io/vote/"
};
