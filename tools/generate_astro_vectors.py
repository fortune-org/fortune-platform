#!/usr/bin/env python3
"""점성술 엔진 검증용 참조 벡터 생성 (skyfield + JPL de421).

geocentric apparent ecliptic longitude (date 기준 분점) 를 여러 시점에 대해
계산하여 test/astro-vectors.json 으로 저장한다.
JS 저정밀 엔진(js/astro/ephemeris.js)은 이 값과 허용 오차 내에서 일치해야 한다.

사용법: /tmp/fp-astro-venv/bin/python tools/generate_astro_vectors.py
"""

import json
import os

from skyfield.api import Loader

LIB = os.environ.get(
    "DE421_DIR",
    "/Users/mo/DEV/awsKeys/MobidicSajutarot/loving-bell/backend/lib",
)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

load = Loader(LIB, verbose=False)
eph = load("de421.bsp")
ts = load.timescale(builtin=True)
earth = eph["earth"]

BODIES = [
    ("sun", "sun"),
    ("moon", "moon"),
    ("mercury", "mercury"),
    ("venus", "venus"),
    ("mars", "mars"),
    ("jupiter", "jupiter barycenter"),
    ("saturn", "saturn barycenter"),
    ("uranus", "uranus barycenter"),
    ("neptune", "neptune barycenter"),
    ("pluto", "pluto barycenter"),
]

# (UTC) 다양한 연대 + 스펙 테스트 케이스(1990-05-15 14:30 KST = 05:30 UTC)
SAMPLES = [
    (1900, 6, 15, 12, 0), (1912, 3, 1, 0, 0), (1925, 11, 20, 18, 30),
    (1936, 7, 4, 6, 0), (1948, 1, 26, 3, 45), (1955, 9, 9, 21, 0),
    (1961, 4, 12, 9, 7), (1969, 7, 20, 20, 17), (1976, 2, 29, 12, 0),
    (1983, 12, 25, 15, 30), (1990, 5, 15, 5, 30), (1995, 10, 3, 2, 2),
    (2000, 1, 1, 0, 0), (2004, 8, 13, 13, 13), (2010, 4, 4, 4, 4),
    (2016, 11, 8, 23, 59), (2020, 2, 29, 8, 30), (2024, 12, 31, 18, 0),
    (2030, 6, 21, 12, 0), (2038, 1, 19, 3, 14), (2045, 5, 5, 5, 5),
    (2052, 10, 10, 10, 10),
]

out = []
for y, m, d, hh, mm in SAMPLES:
    t = ts.utc(y, m, d, hh, mm)
    row = {"utc": [y, m, d, hh, mm], "lon": {}}
    e = earth.at(t)
    for key, target in BODIES:
        _, lon, _ = e.observe(eph[target]).apparent().ecliptic_latlon("date")
        row["lon"][key] = round(lon.degrees % 360.0, 4)
    # 항성시 검증용 (그리니치 겉보기 항성시, 시간 단위)
    row["gast"] = round(t.gast, 6)
    out.append(row)

os.makedirs(os.path.join(ROOT, "test"), exist_ok=True)
with open(os.path.join(ROOT, "test", "astro-vectors.json"), "w") as f:
    json.dump({"about": "skyfield de421 apparent ecliptic longitudes (deg, equinox of date) + GAST(h)",
               "samples": out}, f, separators=(",", ":"))
print(f"astro vectors: {len(out)} samples -> test/astro-vectors.json")
