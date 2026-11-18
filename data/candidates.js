/*
  연결 설정 파일

  - voteUrl  : 구글 시트 저장소(Apps Script 웹앱) 주소. 후보 명단·제목·투표 기록은 모두 여기에 저장됩니다.
               명단은 이 파일이 아니라 관리자 화면(주소 뒤에 ?admin)에서 넣습니다.
               비워 두면 연습 모드 — 이 브라우저 안에서만 동작합니다 (연습 PIN: 0000).
  - qrUrl    : 참가자용 QR이 가리킬 주소 (비우면 현재 페이지 주소)
  - criteria : 선정 기준 [이름, 설명] — 발표 화면 '선정 기준' 장표와 참가자 화면에 나옵니다.
*/
window.VOTE = {
  voteUrl: "https://script.google.com/macros/s/AKfycbxIC1YgaDiSiviEBNrxhJzl91BWtKmBPvpsc5SraRt-9-TCuwZwoS8jPy8fSp1YDb8Dmw/exec",
  qrUrl: "https://tnwls4650-sketch.github.io/vote/",
  criteria: [
    ["효과성", "업무 효율화 및 생산성 향상"],
    ["참신함", "새로운 아이디어"],
    ["현업 적용", "실제 업무에 반복 활용되는 정도"],
    ["확산 가능성", "개인·팀·회사에 기여할 수 있는지"],
    ["완성도", "디자인, 일관된 결과 등"]
  ]
};
