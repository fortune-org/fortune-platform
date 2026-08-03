# Fortune Platform — 오픈소스 사주 만세력 · 타로 · 점성술

> 생년월일·시간을 입력하면 정확한 **사주 만세력**(천간지지·오행·납음오행·절기·대운)을 계산하는
> 무료 오픈소스 웹 애플리케이션. **타로 카드**와 **서양 점성술 출생 차트**도 같은 수준으로 제공합니다.
> AI 해석 없이 **계산 결과만** 제공하며, 모든 정보를 마크다운(.md)으로 복사할 수 있습니다.

**▶ 바로 사용하기: <https://fortune-org.github.io/fortune-platform/>**

[![Deploy to GitHub Pages](https://github.com/fortune-org/fortune-platform/actions/workflows/deploy.yml/badge.svg)](https://github.com/fortune-org/fortune-platform/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 주요 기능

### ☯ 사주 만세력
- **1900–2100년** 정밀 음력 변환 (윤달 포함)
- **절입 시각(분 단위)** 기준 년주·월주 판정 — 입춘 전 출생은 전년도 간지로 정확히 처리
- 24절기 시각, 월령(월지), 띠
- 사주팔자 + 오행 분포 + 지장간 + 십성 + 12운성 + 공망 + **납음오행**
- **대운** (양남음녀 순행/역행, 대운수)
- 시간 옵션: 출생 시간 모름 / 한국식 −30분 보정 / 야자시 / 서머타임(한국 1948–1960·1987–1988 자동) /
  역사적 표준시(UTC+8:30 구간) / 다국가 시간대 (한국·일본·중국·홍콩·태국·UTC·런던·뉴욕·LA)

### 🂠 타로
- 라이더-웨이트 체계 78장 전체 덱 (한/영 전통 키워드)
- 스프레드 4종: 원 카드 · 쓰리 카드 · 파이브 카드 · 켈틱 크로스
- 역방향 옵션, 암호학적 난수(`crypto.getRandomValues`) 셔플

### ✦ 점성술
- 10행성(태양~명왕성) 지심 황경 — 순수 JS 저정밀 천체력 (JPL DE421 대비 오차 ≲0.1°, 테스트로 관리)
- 상승점(ASC)·중천점(MC)·이퀄 하우스, 메이저 어스펙트 5종, 원소·양태 분포

### 공통
- 🌐 한국어/영어 다국어 (자동 감지 + 수동 전환)
- 📋 모든 결과 **마크다운 복사** 버튼
- 🌙 다크 모드(시스템 설정 연동), 반응형, 접근성(WCAG 기본) 준수
- 🔒 **백엔드 없음** — 모든 계산이 브라우저에서 실행되며 개인정보를 수집·전송하지 않음

## 로컬 실행

빌드 도구가 필요 없습니다. 정적 서버만 있으면 됩니다.

```bash
git clone https://github.com/fortune-org/fortune-platform.git
cd fortune-platform
python3 -m http.server 8080
# → http://localhost:8080
```

## 테스트

```bash
node test/run-tests.mjs
```

- **만세력**: 기준 만세력 DB에서 추출한 회귀 벡터 약 1만 건
  (일주/년주/월주/음력 왕복 변환/절입 경계/야자시/서머타임/시간대 변환)
- **점성술**: Skyfield + JPL DE421로 생성한 참조 황경 대비 허용 오차 검증
- **타로**: 덱 무결성(78장·중복 없음)·스프레드 검증

## 프로젝트 구조

```
fortune-platform/
├── index.html            # 메인 앱 (사주/타로/점성술 3모드)
├── guide.html            # 용어·개념 가이드
├── faq.html              # 자주 묻는 질문
├── about.html            # 프로젝트 소개
├── css/style.css         # 전체 스타일 (다크모드·반응형)
├── js/
│   ├── main.js           # 앱 초기화·모드 탭·복사 버튼
│   ├── i18n.js           # 다국어 (ko/en)
│   ├── utils.js          # 공용 유틸 (클립보드·DOM·연락처 보호)
│   ├── saju/
│   │   ├── constants.js  # 간지·오행·납음·지장간·십성·12운성 상수
│   │   ├── calendar.js   # JDN·음력 변환·절기 조회
│   │   ├── engine.js     # 사주 계산 엔진 (순수 함수)
│   │   └── ui.js         # 사주 폼·렌더·마크다운
│   ├── tarot/            # deck.js (78장 데이터) + ui.js
│   └── astro/            # ephemeris.js (천체력) + ui.js
├── data/
│   ├── solar-terms.json  # 24절기 시각 1900–2100 (KST 표기)
│   └── lunar-table.json  # 음력 월 테이블 1900–2100
├── locales/              # ko.json · en.json
├── tools/                # 데이터 생성·검증 스크립트 (Python)
├── test/                 # 회귀 테스트 (Node) + 검증 벡터
└── .github/workflows/deploy.yml  # GitHub Pages 자동 배포
```

## 데이터 출처와 정확성

- `data/*.json`은 1900–2100년 기준 만세력 데이터베이스에서 추출했으며,
  추출 시 **73,000여 일 전체**에 대해 일주(JDN 공식)·년주·월주(절입 시각)·음력 왕복 변환을 교차 검증했습니다.
- 원본의 결측 구간(1903·2019·2050년 일부)과 결측 절기는 **NASA JPL DE421** 천체력(Skyfield)으로 재계산해 보정했고,
  합삭·절기 시각이 KASI 공표값과 분 단위로 일치함을 확인했습니다.
- 절기 시각이 자정(00:00–01:00 KST) 직후인 날의 년주·월주는 자료마다 하루 차이가 있을 수 있습니다
  (중국 관행 UTC+8 vs 한국 KST). 본 프로젝트는 **KST 절입 시각 기준**을 따릅니다.
- 점성술은 공개 저정밀 알고리즘(P. Schlyter) 구현으로, 별자리 경계(±0.5°) 부근은 주의 문구를 표시합니다.

## 기여하기

버그 제보·데이터 오류 신고·기능 제안·번역 개선 모두 환영합니다.

1. 이 저장소를 Fork 합니다
2. 브랜치를 만듭니다 (`git checkout -b feature/my-feature`)
3. 변경 후 테스트를 실행합니다 (`node test/run-tests.mjs`)
4. Pull Request를 보냅니다

## 기여자

| 이름 | GitHub | 이메일 |
|---|---|---|
| **박성모** (Park Sung-mo) | [@GoGoComputer](https://github.com/GoGoComputer) | vividsaebom@gmail.com |

## 라이선스

[MIT License](LICENSE) © 2026 Park Sung-mo and Fortune Platform contributors

---

# Fortune Platform — Open-source Saju Manseryeok · Tarot · Astrology (English)

A free, open-source web app that computes an accurate **Korean Four Pillars (Saju) chart** —
stems & branches, five elements, Napeum, solar terms and Daeun luck cycles — plus a **78-card tarot
deck** and a **Western natal chart**, all in the browser with no backend and no AI interpretation.
Every result can be copied as Markdown.

**▶ Try it: <https://fortune-org.github.io/fortune-platform/>**

- Precise lunar conversion 1900–2100 (incl. leap months); pillars decided by exact solar-term times
- DST & historical Korean standard time handling, multiple time zones, yajasi option
- Tarot: full Rider–Waite deck, 4 spreads, cryptographic shuffle
- Astrology: 10 planets, ASC/MC, equal houses, major aspects (low-precision ephemeris, error ≲0.1°, enforced by tests)
- Korean/English UI, dark mode, responsive, WCAG-minded, zero data collection

```bash
git clone https://github.com/fortune-org/fortune-platform.git
cd fortune-platform && python3 -m http.server 8080
node test/run-tests.mjs   # run the regression suite
```

Licensed under the [MIT License](LICENSE).
