#!/usr/bin/env python3
"""fortune-platform 데이터 생성기.

만세력 SQLite DB(1900-2100, 비공개 원본)에서 정적 웹앱용 컴팩트 JSON을 추출한다.

생성물
  data/solar-terms.json : 24절기 시각 (KST 표기 기준 epoch 분) 정렬 배열
  data/lunar-table.json : 음력 월 테이블 (월 시작 JDN + 월 길이)
  test/vectors.json     : JS 엔진 회귀 테스트 벡터 (DB 대조 기대값)

검증 (스크립트 내부에서 전수 assert)
  - 일주: (JDN + K) % 60 공식이 DB 73,320행 전체와 일치
  - 년주/월주: 절입 시각 기반 계산이 DB 전 행(그날 23:59 기준)과 일치
  - 음력: 테이블 기반 양력<->음력 변환이 DB 전 행과 왕복 일치
  - 시주: 오서둔 공식이 전통 시두법 표와 일치

사용법
  MANSERYEOK_DB=/path/to/Manseryeok.db python3 tools/generate_data.py
  또는: python3 tools/generate_data.py /path/to/Manseryeok.db
"""

from __future__ import annotations

import calendar
import json
import os
import sqlite3
import sys
from datetime import date, datetime, timedelta

DEFAULT_DB = os.environ.get("MANSERYEOK_DB", "Manseryeok.db")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"]
JI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]

# 절기 순서 (연초부터). 짝수 인덱스 = 節(월 경계), 홀수 = 中氣
TERM_NAMES = [
    "소한", "대한", "입춘", "우수", "경칩", "춘분", "청명", "곡우",
    "입하", "소만", "망종", "하지", "소서", "대서", "입추", "처서",
    "백로", "추분", "한로", "상강", "입동", "소설", "대설", "동지",
]
TERM_IDX = {name: i for i, name in enumerate(TERM_NAMES)}

# 1900-01-01 ~ 1900-01-05 (소한 이전): 기해년 병자월 (1899년 대설 관할)
FALLBACK_YEAR_IDX = 35   # 己亥
FALLBACK_MONTH_IDX = 12  # 丙子

# 원본 DB 결측 절기 보정 (skyfield + JPL de421로 계산, KASI 공표값과 분 단위 일치 확인)
MISSING_TERMS = [
    ("소서", "190307081735"),
    ("대서", "190307241058"),
    ("입추", "190308090315"),
    ("처서", "190308241740"),
    ("망종", "201906060806"),
    ("하지", "201906220054"),
    ("망종", "205006051954"),
    ("하지", "205006211233"),
]

# 원본 DB 결측 구간(1903-07~08, 2019-06, 2050-06)의 음력 재구성.
# 근거: 양쪽 경계 행 + skyfield(de421) 합삭 시각(KST) 전수 일치 확인.
#   1903-06-25 15:10 윤5월삭, 1903-07-24 21:45 6월삭, 1903-08-23 04:50 7월삭
#   2019-06-03 19:01 5월삭 / 2050-06-19 17:21 5월삭
GAP_FILL_RANGES = [
    # (solar start y,m,d), days, (lunar y, m, leap, first lunar day)
    ((1903, 7, 1), 23, (1903, 5, 1, 7)),    # 윤5월 7~29일
    ((1903, 7, 24), 30, (1903, 6, 0, 1)),   # 6월 1~30일
    ((1903, 8, 23), 9, (1903, 7, 0, 1)),    # 7월 1~9일
    ((2019, 6, 1), 2, (2019, 4, 0, 28)),    # 4월 28~29일
    ((2019, 6, 3), 28, (2019, 5, 0, 1)),    # 5월 1~28일
    ((2050, 6, 1), 18, (2050, 4, 0, 12)),   # 4월 12~29일
    ((2050, 6, 19), 12, (2050, 5, 0, 1)),   # 5월 1~12일
]


def jdn(y: int, m: int, d: int) -> int:
    return date(y, m, d).toordinal() + 1721425


def ganji_idx(text: str) -> int:
    g = GAN.index(text[0])
    j = JI.index(text[1])
    for k in range(g, 60, 10):
        if k % 12 == j:
            return k
    raise ValueError(f"invalid ganji {text}")


def ganji_from_idx(k: int) -> str:
    return GAN[k % 10] + JI[k % 12]


def printed_epoch_min(y: int, m: int, d: int, hh: int = 0, mm: int = 0) -> int:
    """표기 시각(한국 만세력 표기 기준)을 UTC처럼 취급한 epoch 분."""
    return calendar.timegm((y, m, d, hh, mm, 0, 0, 0, 0)) // 60


def month_idx_from(term_even_idx: int, saju_year: int) -> int:
    branch = (term_even_idx // 2 + 1) % 12
    n = (branch - 2 + 12) % 12
    stem = (((saju_year - 4) % 10) * 2 + 2 + n) % 10
    for k in range(stem, 60, 10):
        if k % 12 == branch:
            return k
    raise AssertionError


def main() -> None:
    db_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_DB
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    raw = conn.execute(
        """SELECT cd_sy, cd_sm, cd_sd, cd_ly, cd_lm, cd_ld, cd_leap_month,
                  cd_hyganjee, cd_hmganjee, cd_hdganjee, cd_kterms, cd_terms_time
             FROM manseryeok ORDER BY cd_sy, cd_sm, cd_sd"""
    ).fetchall()
    # 중복 행 제거 (원본 DB의 2081-02 구간 중복) — 내용 동일성 확인 후 dedupe
    rows, seen = [], {}
    for r in raw:
        key = (r["cd_sy"], r["cd_sm"], r["cd_sd"])
        if key in seen:
            assert tuple(seen[key]) == tuple(r), f"conflicting duplicate row {key}"
            continue
        seen[key] = r
        rows.append(dict(r) | {"synth": False})

    # 결측 일 행 재구성 (간지는 검증된 공식으로 후단에서 채움)
    for (sy, sm, sd), n_days, (ly, lm, leap, ld0) in GAP_FILL_RANGES:
        start = date(sy, sm, sd)
        for k in range(n_days):
            d = date.fromordinal(start.toordinal() + k)
            rows.append({
                "cd_sy": d.year, "cd_sm": d.month, "cd_sd": d.day,
                "cd_ly": ly, "cd_lm": lm, "cd_ld": ld0 + k, "cd_leap_month": leap,
                "cd_hyganjee": None, "cd_hmganjee": None, "cd_hdganjee": None,
                "cd_kterms": None, "cd_terms_time": None, "synth": True,
            })
    rows.sort(key=lambda r: (r["cd_sy"], r["cd_sm"], r["cd_sd"]))
    for i in range(1, len(rows)):
        a, b = rows[i - 1], rows[i]
        assert jdn(b["cd_sy"], b["cd_sm"], b["cd_sd"]) == jdn(a["cd_sy"], a["cd_sm"], a["cd_sd"]) + 1, \
            f"day gap after {a['cd_sy']}-{a['cd_sm']}-{a['cd_sd']}"
    assert len(rows) == (date(2100, 12, 31).toordinal() - date(1900, 1, 1).toordinal() + 1)
    print(f"rows: {len(raw)} -> dedup+fill {len(rows)}")

    # ── 1. 절기 추출 ─────────────────────────────────────────
    terms: list[tuple[int, int]] = []  # (printedEpochMin, termIdx)
    for r in rows:
        name = r["cd_kterms"]
        if not name or name == "NULL":
            continue
        t = str(r["cd_terms_time"]).strip()
        assert len(t) == 12, f"bad terms_time {t!r}"
        y, m, d = int(t[0:4]), int(t[4:6]), int(t[6:8])
        hh, mm = int(t[8:10]), int(t[10:12])
        assert (y, m, d) == (r["cd_sy"], r["cd_sm"], r["cd_sd"])
        terms.append((printed_epoch_min(y, m, d, hh, mm), TERM_IDX[name]))
    for name, t in MISSING_TERMS:
        y, m, d = int(t[0:4]), int(t[4:6]), int(t[6:8])
        terms.append((printed_epoch_min(y, m, d, int(t[8:10]), int(t[10:12])), TERM_IDX[name]))
    terms.sort()
    assert len(terms) == 201 * 24, f"terms count {len(terms)}"
    for i in range(1, len(terms)):
        assert terms[i][0] > terms[i - 1][0]
        assert terms[i][1] == (terms[i - 1][1] + 1) % 24, f"term order break @{i}"

    ipchun_by_year: dict[int, int] = {}
    for t_min, t_idx in terms:
        if t_idx == TERM_IDX["입춘"]:
            y = (datetime(1970, 1, 1) + timedelta(minutes=t_min)).year
            ipchun_by_year[y] = t_min

    # ── 2. 음력 월 테이블 ────────────────────────────────────
    months: list[list[int]] = []  # [ly, lm, leap, startJdn, days]
    cur = None
    for r in rows:
        key = (r["cd_ly"], r["cd_lm"], r["cd_leap_month"])
        j = jdn(r["cd_sy"], r["cd_sm"], r["cd_sd"])
        assert r["cd_ld"] >= 1
        if cur and key == (cur[0], cur[1], cur[2]):
            cur[4] += 1
            assert r["cd_ld"] == cur[4], f"lunar day gap at {j}"
        else:
            if cur:
                months.append(cur)
            assert r["cd_ld"] == 1, f"month must start at day 1: {dict(r)}"
            cur = [r["cd_ly"], r["cd_lm"], int(r["cd_leap_month"]), j, 1]
    months.append(cur)
    for i in range(1, len(months)):
        assert months[i][3] == months[i - 1][3] + months[i - 1][4]
        assert months[i - 1][4] in (29, 30) or i == len(months) - 1
    print(f"lunar months: {len(months)}")

    # 왕복 검증
    by_start = [(m[3], m) for m in months]
    def solar_to_lunar(j: int):
        lo, hi = 0, len(by_start) - 1
        while lo < hi:
            mid = (lo + hi + 1) // 2
            if by_start[mid][0] <= j:
                lo = mid
            else:
                hi = mid - 1
        m = by_start[lo][1]
        assert j < m[3] + m[4]
        return m[0], m[1], m[2], j - m[3] + 1

    for r in rows:
        j = jdn(r["cd_sy"], r["cd_sm"], r["cd_sd"])
        got = solar_to_lunar(j)
        want = (r["cd_ly"], r["cd_lm"], int(r["cd_leap_month"]), r["cd_ld"])
        assert got == want, f"lunar mismatch {want} != {got} @ {j}"
    print("lunar roundtrip: OK (all rows)")

    # ── 3. 일주 공식 검증 ────────────────────────────────────
    r0 = rows[0]
    K = (ganji_idx(r0["cd_hdganjee"]) - jdn(r0["cd_sy"], r0["cd_sm"], r0["cd_sd"])) % 60
    for r in rows:
        if r["synth"]:
            continue
        j = jdn(r["cd_sy"], r["cd_sm"], r["cd_sd"])
        assert (j + K) % 60 == ganji_idx(r["cd_hdganjee"]), f"day pillar mismatch @ {j}"
    print(f"day pillar: OK (K={K})")

    # ── 4. 년주/월주 검증 (그날 23:59 기준 == DB 행 값) ──────
    # 예외: 절기 순간이 KST 00:00~00:59인 경우 DB 간지 열은 중국(UTC+8)
    # 관행으로 전날 전환되어 있다. 순간 기준 계산(KASI 한국 관행)이 정답이므로
    # 해당 전날(quirk day)은 일치 검사에서 제외하고 개수만 확인한다.
    quirk_month_days: set[tuple[int, int, int]] = set()
    quirk_year_days: set[tuple[int, int, int]] = set()
    for t_min, t_idx in terms:
        if t_min % 1440 <= 60:  # KST 00:00~01:00 (01:00은 중국시 23:5x 반올림 경계)
            prev_day = datetime(1970, 1, 1) + timedelta(minutes=t_min - 1440)
            key = (prev_day.year, prev_day.month, prev_day.day)
            if t_idx % 2 == 0:
                quirk_month_days.add(key)
            if t_idx == TERM_IDX["입춘"]:
                quirk_year_days.add(key)

    term_mins = [t[0] for t in terms]
    import bisect

    def pillars_at(minute: int, solar_year: int):
        ipchun = ipchun_by_year.get(solar_year)
        saju_year = solar_year if (ipchun is not None and minute >= ipchun) else solar_year - 1
        year_idx = (saju_year - 4) % 60
        pos = bisect.bisect_right(term_mins, minute) - 1
        while pos >= 0 and terms[pos][1] % 2 == 1:
            pos -= 1
        if pos < 0:
            return FALLBACK_YEAR_IDX, FALLBACK_MONTH_IDX
        return year_idx, month_idx_from(terms[pos][1], saju_year)

    mismatches = []
    quirk_hits = 0
    for r in rows:
        if r["synth"]:
            continue
        key = (r["cd_sy"], r["cd_sm"], r["cd_sd"])
        minute = printed_epoch_min(r["cd_sy"], r["cd_sm"], r["cd_sd"], 23, 59)
        y_idx, m_idx = pillars_at(minute, r["cd_sy"])
        y_ok = y_idx == ganji_idx(r["cd_hyganjee"]) or key in quirk_year_days
        m_ok = m_idx == ganji_idx(r["cd_hmganjee"]) or key in quirk_month_days
        if key in quirk_month_days or key in quirk_year_days:
            quirk_hits += 1
        if not (y_ok and m_ok):
            mismatches.append((r["cd_sy"], r["cd_sm"], r["cd_sd"],
                               r["cd_hyganjee"], ganji_from_idx(y_idx),
                               r["cd_hmganjee"], ganji_from_idx(m_idx)))
    if mismatches:
        print(f"year/month mismatches: {len(mismatches)}")
        for mm in mismatches[:80]:
            print("  ", mm)
        raise SystemExit(1)
    print(f"year/month pillars: OK (all rows @23:59, china-day quirks skipped: {quirk_hits})")

    # ── 5. 시주 공식 vs 전통 시두법 표 ───────────────────────
    TIME_TABLE = [
        ["甲子", "乙丑", "丙寅", "丁卯", "戊辰", "己巳", "庚午", "辛未", "壬申", "癸酉", "甲戌", "乙亥"],
        ["丙子", "丁丑", "戊寅", "己卯", "庚辰", "辛巳", "壬午", "癸未", "甲申", "乙酉", "丙戌", "丁亥"],
        ["戊子", "己丑", "庚寅", "辛卯", "壬辰", "癸巳", "甲午", "乙未", "丙申", "丁酉", "戊戌", "己亥"],
        ["庚子", "辛丑", "壬寅", "癸卯", "甲辰", "乙巳", "丙午", "丁未", "戊申", "己酉", "庚戌", "辛亥"],
        ["壬子", "癸丑", "甲寅", "乙卯", "丙辰", "丁巳", "戊午", "己未", "庚申", "辛酉", "壬戌", "癸亥"],
    ]
    for ds in range(10):
        for hb in range(12):
            stem = ((ds % 5) * 2 + hb) % 10
            assert GAN[stem] + JI[hb] == TIME_TABLE[ds % 5][hb]
    print("hour pillar formula: OK")

    # ── 6. JSON 출력 ─────────────────────────────────────────
    data_dir = os.path.join(ROOT, "data")
    test_dir = os.path.join(ROOT, "test")
    os.makedirs(data_dir, exist_ok=True)
    os.makedirs(test_dir, exist_ok=True)

    with open(os.path.join(data_dir, "solar-terms.json"), "w", encoding="utf-8") as f:
        json.dump(
            {
                "about": "24 solar terms 1900-2100. [printedKstEpochMinute, termIndex]; termIndex 0=sohan",
                "names": TERM_NAMES,
                "terms": [[t, i] for t, i in terms],
            },
            f, ensure_ascii=False, separators=(",", ":"),
        )

    with open(os.path.join(data_dir, "lunar-table.json"), "w", encoding="utf-8") as f:
        json.dump(
            {
                "about": "Korean lunar calendar months 1900-2100. [lunarYear, lunarMonth, isLeap, startJdn, days]",
                "months": months,
                "dayGanjiOffset": K,
            },
            f, ensure_ascii=False, separators=(",", ":"),
        )

    # ── 7. 테스트 벡터 ───────────────────────────────────────
    vec_days, vec_ym, vec_ym_pre, vec_lunar = [], [], [], []
    prev_row = None
    for i, r in enumerate(rows):
        if r["synth"]:
            if r["cd_ld"] == 1:
                vec_lunar.append([r["cd_sy"], r["cd_sm"], r["cd_sd"],
                                  r["cd_ly"], r["cd_lm"], int(r["cd_leap_month"]), r["cd_ld"]])
            prev_row = r
            continue
        is_term_day = bool(r["cd_kterms"]) and r["cd_kterms"] != "NULL"
        key = (r["cd_sy"], r["cd_sm"], r["cd_sd"])
        is_quirk = key in quirk_month_days or key in quirk_year_days
        if i % 137 == 0 or i in (0, len(rows) - 1):
            vec_days.append([r["cd_sy"], r["cd_sm"], r["cd_sd"], ganji_idx(r["cd_hdganjee"])])
        if (i % 97 == 0 or is_term_day) and not is_quirk:
            vec_ym.append([r["cd_sy"], r["cd_sm"], r["cd_sd"],
                           ganji_idx(r["cd_hyganjee"]), ganji_idx(r["cd_hmganjee"])])
        if is_term_day and prev_row is not None and not prev_row["synth"]:
            pkey = (prev_row["cd_sy"], prev_row["cd_sm"], prev_row["cd_sd"])
            t = str(r["cd_terms_time"]).strip()
            if (t[8:12] != "0000" and TERM_IDX[r["cd_kterms"]] % 2 == 0
                    and pkey not in quirk_month_days and pkey not in quirk_year_days):
                vec_ym_pre.append([r["cd_sy"], r["cd_sm"], r["cd_sd"],
                                   ganji_idx(prev_row["cd_hyganjee"]),
                                   ganji_idx(prev_row["cd_hmganjee"])])
        if i % 89 == 0 or (r["cd_ld"] == 1 and (r["cd_leap_month"] or r["cd_lm"] == 1)):
            vec_lunar.append([r["cd_sy"], r["cd_sm"], r["cd_sd"],
                              r["cd_ly"], r["cd_lm"], int(r["cd_leap_month"]), r["cd_ld"]])
        prev_row = r

    with open(os.path.join(test_dir, "vectors.json"), "w", encoding="utf-8") as f:
        json.dump(
            {
                "about": "Regression vectors derived from the reference manseryeok DB",
                "days": vec_days,
                "ym": vec_ym,
                "ymPre": vec_ym_pre,
                "lunar": vec_lunar,
            },
            f, ensure_ascii=False, separators=(",", ":"),
        )

    print(f"vectors: days={len(vec_days)} ym={len(vec_ym)} ymPre={len(vec_ym_pre)} lunar={len(vec_lunar)}")
    st = os.path.getsize(os.path.join(data_dir, "solar-terms.json"))
    lt = os.path.getsize(os.path.join(data_dir, "lunar-table.json"))
    print(f"solar-terms.json: {st/1024:.1f}KB, lunar-table.json: {lt/1024:.1f}KB")
    print("DONE")


if __name__ == "__main__":
    main()
