# AGENTS.md — fortune-platform (오픈소스 만세력·타로·점성술)

> AI 어시스턴트 공통 컨텍스트. 변경 후 이 파일을 갱신하세요.

## 프로젝트 요약

- **목적**: 사주 만세력·타로·점성술 계산기 오픈소스 공개 (AI 해석 없음, 계산만)
- **공개 저장소**: https://github.com/fortune-org/fortune-platform (MIT, public)
- **라이브**: https://fortune-org.github.io/fortune-platform/
- **스택**: 순수 HTML5 + CSS3 + ES6 모듈. 백엔드/빌드 없음. GitHub Pages(Actions 배포)
- **기여자**: 박성모 @GoGoComputer <vividsaebom@gmail.com>

## 구조

- `index.html` 3모드(사주/타로/점성술) 앱, `guide/faq/about.html` 콘텐츠 페이지
- `js/saju/` — constants(간지 상수) · calendar(JDN/음력/절기) · engine(순수 계산) · ui
- `js/tarot/deck.js` 78장 데이터+셔플, `js/astro/ephemeris.js` 저정밀 천체력(Schlyter)
- `js/i18n.js` ko/en (locales/*.json, `data-i18n`), `js/page.js` 공통 부트스트랩
- `data/solar-terms.json` `data/lunar-table.json` — 1900–2100, 비공개 기준 DB에서 추출

## 데이터 재생성 (비공개 DB 필요 — 커밋 금지)

```bash
MANSERYEOK_DB=/Users/mo/DEV/awsKeys/MobidicSajutarot/loving-bell/backend/lib/Manseryeok.db \
  python3 tools/generate_data.py          # data/*.json + test/vectors.json, 전수 검증 내장
DE421_DIR=/Users/mo/DEV/awsKeys/MobidicSajutarot/loving-bell/backend/lib \
  /tmp/fp-astro-venv/bin/python tools/generate_astro_vectors.py  # skyfield 필요
```

## 검증

```bash
node test/run-tests.mjs    # 만세력 벡터 1만+ 점성술 + 타로 (푸시 전 필수)
node test/check-i18n.mjs   # i18n 키 무결성
python3 -m http.server 8791 --directory . # 로컬 확인
```

## 주의사항 (gotchas)

- 원본 DB quirk: 절기 시각이 KST 00:00~01:00인 날의 DB 간지 열은 중국(UTC+8) 관행으로
  하루 일찍 전환되어 있음 → 본 엔진은 KST 절입 시각 기준(정답), 검증에서 해당 99일 제외
- 원본 DB 결측: 1903-07~08, 2019-06, 2050-06 일 행 / 절기 8건 / 2081-02 중복 →
  `tools/generate_data.py`가 skyfield(de421) 재계산 값으로 채우고 전수 assert
- 시주 규칙: Mobidic 미러 — `-30분 보정 시 자시가 23:30 시작`, 정자시법 기본(23시 이후 익일),
  야자시 옵션 시 당일 유지. 한국 DST(1948–60, 1987–88)/UTC+8:30(1908–11, 1954–61) 자동
- `[hidden]{display:none!important}` 규칙 필수 (display 지정 클래스가 hidden을 덮는 버그 방지)
- i18n 키 추가 시 ko/en 동시 추가 후 `check-i18n.mjs` 실행

## 최근 작업 로그

- 2026-08-03: 최초 공개. 만세력(음력/절기/사주팔자/십성/지장간/12운성/납음/공망/대운),
  타로 78장 4스프레드, 점성술 출생차트(10행성/ASC·MC/어스펙트), ko-en i18n, md 복사,
  GitHub Pages Actions 배포, 저장소 public 전환. 테스트 10,849건 통과.
