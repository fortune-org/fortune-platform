// 사주 명리 기본 상수 테이블
// 출처: 전통 명리학 공식 (십간/십이지/납음/지장간/십성/12운성)

/** 십간 (天干) */
export const STEMS = [
  { hanja: '甲', ko: '갑', en: 'Gap', element: 0, yang: true },
  { hanja: '乙', ko: '을', en: 'Eul', element: 0, yang: false },
  { hanja: '丙', ko: '병', en: 'Byeong', element: 1, yang: true },
  { hanja: '丁', ko: '정', en: 'Jeong', element: 1, yang: false },
  { hanja: '戊', ko: '무', en: 'Mu', element: 2, yang: true },
  { hanja: '己', ko: '기', en: 'Gi', element: 2, yang: false },
  { hanja: '庚', ko: '경', en: 'Gyeong', element: 3, yang: true },
  { hanja: '辛', ko: '신', en: 'Sin', element: 3, yang: false },
  { hanja: '壬', ko: '임', en: 'Im', element: 4, yang: true },
  { hanja: '癸', ko: '계', en: 'Gye', element: 4, yang: false },
];

/** 십이지 (地支) — animal 은 i18n 키 */
export const BRANCHES = [
  { hanja: '子', ko: '자', en: 'Ja', element: 4, yang: true, animal: 'rat' },
  { hanja: '丑', ko: '축', en: 'Chuk', element: 2, yang: false, animal: 'ox' },
  { hanja: '寅', ko: '인', en: 'In', element: 0, yang: true, animal: 'tiger' },
  { hanja: '卯', ko: '묘', en: 'Myo', element: 0, yang: false, animal: 'rabbit' },
  { hanja: '辰', ko: '진', en: 'Jin', element: 2, yang: true, animal: 'dragon' },
  { hanja: '巳', ko: '사', en: 'Sa', element: 1, yang: false, animal: 'snake' },
  { hanja: '午', ko: '오', en: 'O', element: 1, yang: true, animal: 'horse' },
  { hanja: '未', ko: '미', en: 'Mi', element: 2, yang: false, animal: 'goat' },
  { hanja: '申', ko: '신', en: 'Shin', element: 3, yang: true, animal: 'monkey' },
  { hanja: '酉', ko: '유', en: 'Yu', element: 3, yang: false, animal: 'rooster' },
  { hanja: '戌', ko: '술', en: 'Sul', element: 2, yang: true, animal: 'dog' },
  { hanja: '亥', ko: '해', en: 'Hae', element: 4, yang: false, animal: 'pig' },
];

/** 오행 (五行) */
export const ELEMENTS = [
  { key: 'wood', hanja: '木', ko: '목', en: 'Wood' },
  { key: 'fire', hanja: '火', ko: '화', en: 'Fire' },
  { key: 'earth', hanja: '土', ko: '토', en: 'Earth' },
  { key: 'metal', hanja: '金', ko: '금', en: 'Metal' },
  { key: 'water', hanja: '水', ko: '수', en: 'Water' },
];

/** 납음오행 (納音五行) — 60갑자 순서대로 2간지당 1개 (index = ganjiIdx >> 1) */
export const NAPEUM = [
  { ko: '해중금', hanja: '海中金', en: 'Gold in the Sea', element: 3 },
  { ko: '노중화', hanja: '爐中火', en: 'Fire in the Furnace', element: 1 },
  { ko: '대림목', hanja: '大林木', en: 'Great Forest Wood', element: 0 },
  { ko: '노방토', hanja: '路傍土', en: 'Roadside Earth', element: 2 },
  { ko: '검봉금', hanja: '劍鋒金', en: 'Sword-Edge Metal', element: 3 },
  { ko: '산두화', hanja: '山頭火', en: 'Mountain-Top Fire', element: 1 },
  { ko: '간하수', hanja: '澗下水', en: 'Stream Water', element: 4 },
  { ko: '성두토', hanja: '城頭土', en: 'Fortress Earth', element: 2 },
  { ko: '백랍금', hanja: '白蠟金', en: 'White Wax Metal', element: 3 },
  { ko: '양류목', hanja: '楊柳木', en: 'Willow Wood', element: 0 },
  { ko: '정천수', hanja: '井泉水', en: 'Well-Spring Water', element: 4 },
  { ko: '옥상토', hanja: '屋上土', en: 'Rooftop Earth', element: 2 },
  { ko: '벽력화', hanja: '霹靂火', en: 'Thunderbolt Fire', element: 1 },
  { ko: '송백목', hanja: '松柏木', en: 'Pine and Cypress Wood', element: 0 },
  { ko: '장류수', hanja: '長流水', en: 'Long-Flowing Water', element: 4 },
  { ko: '사중금', hanja: '砂中金', en: 'Gold in the Sand', element: 3 },
  { ko: '산하화', hanja: '山下火', en: 'Fire Below the Mountain', element: 1 },
  { ko: '평지목', hanja: '平地木', en: 'Plains Wood', element: 0 },
  { ko: '벽상토', hanja: '壁上土', en: 'Wall-Top Earth', element: 2 },
  { ko: '금박금', hanja: '金箔金', en: 'Gold-Leaf Metal', element: 3 },
  { ko: '복등화', hanja: '覆燈火', en: 'Covered-Lamp Fire', element: 1 },
  { ko: '천하수', hanja: '天河水', en: 'Heavenly River Water', element: 4 },
  { ko: '대역토', hanja: '大驛土', en: 'Great Post-Road Earth', element: 2 },
  { ko: '채천금', hanja: '釵釧金', en: 'Hairpin-Bracelet Metal', element: 3 },
  { ko: '상자목', hanja: '桑柘木', en: 'Mulberry Wood', element: 0 },
  { ko: '대계수', hanja: '大溪水', en: 'Great Stream Water', element: 4 },
  { ko: '사중토', hanja: '沙中土', en: 'Earth in the Sand', element: 2 },
  { ko: '천상화', hanja: '天上火', en: 'Heavenly Fire', element: 1 },
  { ko: '석류목', hanja: '石榴木', en: 'Pomegranate Wood', element: 0 },
  { ko: '대해수', hanja: '大海水', en: 'Great Sea Water', element: 4 },
];

/** 지장간 (支藏干): 지지 index → [여기, 중기, 정기] (stem index, 없으면 null) + 배분 일수 */
export const JIJANGAN = [
  { stems: [8, null, 9], days: [10, 0, 20] },  // 子: 壬 癸
  { stems: [9, 7, 5], days: [9, 3, 18] },      // 丑: 癸 辛 己
  { stems: [4, 2, 0], days: [7, 7, 16] },      // 寅: 戊 丙 甲
  { stems: [0, null, 1], days: [10, 0, 20] },  // 卯: 甲 乙
  { stems: [1, 9, 4], days: [9, 3, 18] },      // 辰: 乙 癸 戊
  { stems: [4, 6, 2], days: [7, 7, 16] },      // 巳: 戊 庚 丙
  { stems: [2, 5, 3], days: [10, 9, 11] },     // 午: 丙 己 丁
  { stems: [3, 1, 5], days: [9, 3, 18] },      // 未: 丁 乙 己
  { stems: [4, 8, 6], days: [7, 7, 16] },      // 申: 戊 壬 庚
  { stems: [6, null, 7], days: [10, 0, 20] },  // 酉: 庚 辛
  { stems: [7, 3, 4], days: [9, 3, 18] },      // 戌: 辛 丁 戊
  { stems: [4, 0, 8], days: [7, 7, 16] },      // 亥: 戊 甲 壬
];

/** 십성 (十星) 라벨 — [같은 음양, 다른 음양] × 오행 관계(비겁/식상/재성/관성/인성) */
export const SIPSEONG = [
  [{ ko: '비견', hanja: '比肩', en: 'Friend' }, { ko: '겁재', hanja: '劫財', en: 'Rival' }],
  [{ ko: '식신', hanja: '食神', en: 'Gourmet' }, { ko: '상관', hanja: '傷官', en: 'Performer' }],
  [{ ko: '편재', hanja: '偏財', en: 'Windfall Wealth' }, { ko: '정재', hanja: '正財', en: 'Steady Wealth' }],
  [{ ko: '편관', hanja: '偏官', en: 'Irregular Authority' }, { ko: '정관', hanja: '正官', en: 'Proper Authority' }],
  [{ ko: '편인', hanja: '偏印', en: 'Unconventional Resource' }, { ko: '정인', hanja: '正印', en: 'Proper Resource' }],
];

/** 12운성 (十二運星) */
export const UNSEONG_NAMES = [
  { ko: '장생', hanja: '長生', en: 'Birth' }, { ko: '목욕', hanja: '沐浴', en: 'Bath' },
  { ko: '관대', hanja: '冠帶', en: 'Coming of Age' }, { ko: '건록', hanja: '建祿', en: 'Prosperity' },
  { ko: '제왕', hanja: '帝旺', en: 'Peak' }, { ko: '쇠', hanja: '衰', en: 'Decline' },
  { ko: '병', hanja: '病', en: 'Illness' }, { ko: '사', hanja: '死', en: 'Death' },
  { ko: '묘', hanja: '墓', en: 'Tomb' }, { ko: '절', hanja: '絶', en: 'Severance' },
  { ko: '태', hanja: '胎', en: 'Conception' }, { ko: '양', hanja: '養', en: 'Nurture' },
];

/** 12운성 장생 시작 지지 index + 진행 방향 (양간 순행 +1 / 음간 역행 -1) */
export const UNSEONG_START = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3];
export const UNSEONG_DIR = [1, -1, 1, -1, 1, -1, 1, -1, 1, -1];

/** 24절기: 이름 (index 0 = 소한). 짝수 index = 節(월 경계), 홀수 = 中氣 */
export const TERMS = [
  { ko: '소한', hanja: '小寒', en: 'Minor Cold' }, { ko: '대한', hanja: '大寒', en: 'Major Cold' },
  { ko: '입춘', hanja: '立春', en: 'Start of Spring' }, { ko: '우수', hanja: '雨水', en: 'Rain Water' },
  { ko: '경칩', hanja: '驚蟄', en: 'Awakening of Insects' }, { ko: '춘분', hanja: '春分', en: 'Spring Equinox' },
  { ko: '청명', hanja: '淸明', en: 'Pure Brightness' }, { ko: '곡우', hanja: '穀雨', en: 'Grain Rain' },
  { ko: '입하', hanja: '立夏', en: 'Start of Summer' }, { ko: '소만', hanja: '小滿', en: 'Grain Buds' },
  { ko: '망종', hanja: '芒種', en: 'Grain in Ear' }, { ko: '하지', hanja: '夏至', en: 'Summer Solstice' },
  { ko: '소서', hanja: '小暑', en: 'Minor Heat' }, { ko: '대서', hanja: '大暑', en: 'Major Heat' },
  { ko: '입추', hanja: '立秋', en: 'Start of Autumn' }, { ko: '처서', hanja: '處暑', en: 'End of Heat' },
  { ko: '백로', hanja: '白露', en: 'White Dew' }, { ko: '추분', hanja: '秋分', en: 'Autumn Equinox' },
  { ko: '한로', hanja: '寒露', en: 'Cold Dew' }, { ko: '상강', hanja: '霜降', en: 'Frost Descent' },
  { ko: '입동', hanja: '立冬', en: 'Start of Winter' }, { ko: '소설', hanja: '小雪', en: 'Minor Snow' },
  { ko: '대설', hanja: '大雪', en: 'Major Snow' }, { ko: '동지', hanja: '冬至', en: 'Winter Solstice' },
];

/** 시진 경계 표시용 (자시 23:00~00:59 기준, 보정 미적용 표기) */
export const HOUR_RANGES = [
  '23:00–00:59', '01:00–02:59', '03:00–04:59', '05:00–06:59',
  '07:00–08:59', '09:00–10:59', '11:00–12:59', '13:00–14:59',
  '15:00–16:59', '17:00–18:59', '19:00–20:59', '21:00–22:59',
];

/** 출생지 시간대 프리셋
 *  offset: UTC 오프셋(분), koreanAdjust: -30분 보정 기본값 (동경 135° vs 서울 경도 관례)
 *  Korea 는 역사적 표준시(+8:30 구간)와 서머타임을 엔진에서 자동 반영 */
export const TIMEZONES = [
  { key: 'korea', offset: 540, koreanAdjust: true, auto: true },
  { key: 'japan', offset: 540, koreanAdjust: false },
  { key: 'china', offset: 480, koreanAdjust: false },
  { key: 'hongkong', offset: 480, koreanAdjust: false },
  { key: 'thailand', offset: 420, koreanAdjust: false },
  { key: 'utc', offset: 0, koreanAdjust: false },
  { key: 'london', offset: 0, koreanAdjust: false },
  { key: 'newyork', offset: -300, koreanAdjust: false },
  { key: 'losangeles', offset: -480, koreanAdjust: false },
];

/** 한국 역사적 표준시 (시작일 포함 ~ 종료일 미만, UTC 오프셋 분) */
export const KOREA_TZ_HISTORY = [
  { from: [1908, 4, 1], to: [1912, 1, 1], offset: 510 },
  { from: [1912, 1, 1], to: [1954, 3, 21], offset: 540 },
  { from: [1954, 3, 21], to: [1961, 8, 10], offset: 510 },
];

/** 한국 서머타임 시행 기간 [시작 y,m,d,h,min 포함 ~ 종료 미만] */
export const KOREA_DST = [
  [[1948, 6, 1, 0, 0], [1948, 9, 13, 0, 0]],
  [[1949, 4, 3, 0, 0], [1949, 9, 11, 0, 0]],
  [[1950, 4, 1, 0, 0], [1950, 9, 10, 0, 0]],
  [[1951, 5, 6, 0, 0], [1951, 9, 9, 0, 0]],
  [[1955, 5, 5, 0, 0], [1955, 9, 9, 0, 0]],
  [[1956, 5, 20, 0, 0], [1956, 9, 30, 0, 0]],
  [[1957, 5, 5, 0, 0], [1957, 9, 22, 0, 0]],
  [[1958, 5, 4, 0, 0], [1958, 9, 21, 0, 0]],
  [[1959, 5, 3, 0, 0], [1959, 9, 20, 0, 0]],
  [[1960, 5, 1, 0, 0], [1960, 9, 18, 0, 0]],
  [[1987, 5, 10, 2, 0], [1987, 10, 11, 3, 0]],
  [[1988, 5, 8, 2, 0], [1988, 10, 9, 3, 0]],
];

/** 60갑자 index → 표기 도우미 */
export function ganjiParts(idx) {
  const stem = STEMS[idx % 10];
  const branch = BRANCHES[idx % 12];
  return {
    idx,
    stemIdx: idx % 10,
    branchIdx: idx % 12,
    hanja: stem.hanja + branch.hanja,
    ko: stem.ko + branch.ko,
    stem,
    branch,
  };
}
