// i18n 키 참조 무결성 검사: JS/HTML 에서 참조하는 모든 키가 ko/en 로케일에 존재하는지 확인
// 실행: node test/check-i18n.mjs

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ko = JSON.parse(readFileSync(join(root, 'locales/ko.json'), 'utf8'));
const en = JSON.parse(readFileSync(join(root, 'locales/en.json'), 'utf8'));

function walk(dir, exts, out = []) {
  for (const name of readdirSync(dir)) {
    if (['node_modules', '.git', 'data', 'test'].includes(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, exts, out);
    else if (exts.some((e) => name.endsWith(e))) out.push(p);
  }
  return out;
}

function has(dict, key) {
  let cur = dict;
  for (const part of key.split('.')) {
    if (cur && typeof cur === 'object' && part in cur) cur = cur[part];
    else return false;
  }
  return true;
}

const keys = new Set();
for (const file of walk(root, ['.js', '.html'])) {
  const src = readFileSync(file, 'utf8');
  // t('a.b') / t(`a.b`) 정적 호출
  for (const m of src.matchAll(/\bt(?:Raw)?\(\s*['"`]([a-zA-Z0-9_.]+)['"`]/g)) keys.add(m[1]);
  // data-i18n 계열 속성
  for (const m of src.matchAll(/data-i18n(?:-[a-z]+)?="([a-zA-Z0-9_.]+)"/g)) keys.add(m[1]);
}

// 동적 키 패턴 수동 등록 (템플릿 리터럴로 조립되는 키)
const dynamic = [];
for (const k of ['wood', 'fire', 'earth', 'metal', 'water']) dynamic.push(`element.${k}`);
for (const k of ['rat', 'ox', 'tiger', 'rabbit', 'dragon', 'snake', 'horse', 'goat', 'monkey', 'rooster', 'dog', 'pig']) dynamic.push(`animal.${k}`);
for (let i = 0; i < 7; i += 1) dynamic.push(`weekday.${i}`);
for (const k of ['Hour', 'Day', 'Month', 'Year']) dynamic.push(`saju.result.pillar${k}`);
for (const k of ['korea', 'japan', 'china', 'hongkong', 'thailand', 'utc', 'london', 'newyork', 'losangeles']) dynamic.push(`saju.tz.${k}`);
for (const k of ['invalidDate', 'invalidTime', 'invalidLunar', 'outOfRange', 'dataLoad', 'needDate', 'needLocation']) dynamic.push(`common.errors.${k}`);
for (const k of ['one', 'three', 'five', 'celtic']) dynamic.push(`tarot.spread.${k}`);
for (const k of ['focus', 'past', 'present', 'future', 'situation', 'obstacle', 'advice', 'surroundings', 'outcome', 'heart', 'challenge', 'foundation', 'recentPast', 'crown', 'nearFuture', 'self', 'environment', 'hopesFears']) dynamic.push(`tarot.pos.${k}`);
for (const k of ['wands', 'cups', 'swords', 'pentacles']) dynamic.push(`tarot.suit.${k}`);
for (const k of ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces']) dynamic.push(`astro.sign.${k}`);
for (const k of ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto']) dynamic.push(`astro.planet.${k}`);
for (const k of ['conjunction', 'sextile', 'square', 'trine', 'opposition']) dynamic.push(`astro.aspect.${k}`);
for (const k of ['fire', 'earth', 'air', 'water']) dynamic.push(`astro.el.${k}`);
for (const k of ['cardinal', 'fixed', 'mutable']) dynamic.push(`astro.mod.${k}`);
for (const k of ['seoul', 'tokyo', 'beijing', 'hongkong', 'bangkok', 'london', 'newyork', 'losangeles', 'custom']) dynamic.push(`astro.city.${k}`);
for (const k of ['Index', 'Guide', 'Faq', 'About']) dynamic.push(`meta.title${k}`);
dynamic.push('yinyang.yang', 'yinyang.um', 'guide.jeol', 'guide.junggi');
for (const k of dynamic) keys.add(k);

let missing = 0;
for (const key of [...keys].sort()) {
  const inKo = has(ko, key);
  const inEn = has(en, key);
  if (!inKo || !inEn) {
    console.error(`MISSING ${key}  ko:${inKo} en:${inEn}`);
    missing += 1;
  }
}
console.log(`checked ${keys.size} keys, missing: ${missing}`);
if (missing > 0) process.exit(1);
console.log('I18N KEYS OK');
