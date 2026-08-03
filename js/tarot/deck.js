// 타로 덱 데이터 (라이더-웨이트 체계 78장)
// 키워드는 전통적 상징어를 간결히 정리한 자체 저작 텍스트 (해석·점술 조언 아님)

/** 메이저 아르카나 22장 */
const MAJOR = [
  ['The Fool', '광대', '0',
    { ko: ['새로운 시작', '자유', '모험', '순수'], en: ['new beginnings', 'freedom', 'adventure', 'innocence'] },
    { ko: ['무모함', '경솔', '방향 상실'], en: ['recklessness', 'carelessness', 'lack of direction'] }],
  ['The Magician', '마법사', 'I',
    { ko: ['의지', '창조력', '집중', '실행'], en: ['willpower', 'creation', 'focus', 'action'] },
    { ko: ['재능 낭비', '속임수', '준비 부족'], en: ['wasted talent', 'trickery', 'poor planning'] }],
  ['The High Priestess', '여사제', 'II',
    { ko: ['직관', '내면의 지혜', '신비', '침묵'], en: ['intuition', 'inner wisdom', 'mystery', 'stillness'] },
    { ko: ['비밀', '단절된 직관', '표면적 판단'], en: ['secrets', 'blocked intuition', 'surface judgment'] }],
  ['The Empress', '여황제', 'III',
    { ko: ['풍요', '돌봄', '성장', '아름다움'], en: ['abundance', 'nurturing', 'growth', 'beauty'] },
    { ko: ['과보호', '정체', '자기 돌봄 부족'], en: ['overprotection', 'stagnation', 'self-neglect'] }],
  ['The Emperor', '황제', 'IV',
    { ko: ['질서', '권위', '안정', '책임'], en: ['order', 'authority', 'stability', 'responsibility'] },
    { ko: ['경직', '독단', '통제 과잉'], en: ['rigidity', 'domination', 'excessive control'] }],
  ['The Hierophant', '교황', 'V',
    { ko: ['전통', '가르침', '제도', '신념'], en: ['tradition', 'guidance', 'institutions', 'belief'] },
    { ko: ['형식주의', '관습에 대한 저항'], en: ['dogma', 'rebellion against convention'] }],
  ['The Lovers', '연인', 'VI',
    { ko: ['사랑', '조화', '선택', '가치의 일치'], en: ['love', 'harmony', 'choice', 'alignment of values'] },
    { ko: ['불화', '가치관 충돌', '망설임'], en: ['disharmony', 'misalignment', 'indecision'] }],
  ['The Chariot', '전차', 'VII',
    { ko: ['추진력', '승리', '자기 통제', '결단'], en: ['drive', 'victory', 'self-control', 'determination'] },
    { ko: ['방향 상실', '폭주', '통제 불능'], en: ['lack of direction', 'aggression', 'loss of control'] }],
  ['Strength', '힘', 'VIII',
    { ko: ['용기', '인내', '부드러운 힘', '자신감'], en: ['courage', 'patience', 'gentle strength', 'confidence'] },
    { ko: ['자기 의심', '무기력', '조급함'], en: ['self-doubt', 'weakness', 'impatience'] }],
  ['The Hermit', '은둔자', 'IX',
    { ko: ['성찰', '고독', '내면 탐구', '지혜'], en: ['introspection', 'solitude', 'soul-searching', 'wisdom'] },
    { ko: ['고립', '외로움', '회피'], en: ['isolation', 'loneliness', 'withdrawal'] }],
  ['Wheel of Fortune', '운명의 수레바퀴', 'X',
    { ko: ['전환점', '순환', '기회', '운명'], en: ['turning point', 'cycles', 'opportunity', 'destiny'] },
    { ko: ['역행', '통제 밖의 변화', '불운의 순환'], en: ['setbacks', 'resistance to change', 'bad luck cycle'] }],
  ['Justice', '정의', 'XI',
    { ko: ['공정', '진실', '인과', '균형'], en: ['fairness', 'truth', 'cause and effect', 'balance'] },
    { ko: ['불공정', '책임 회피', '편향'], en: ['unfairness', 'avoiding accountability', 'bias'] }],
  ['The Hanged Man', '매달린 사람', 'XII',
    { ko: ['관점 전환', '내려놓음', '기다림', '희생'], en: ['new perspective', 'letting go', 'pause', 'sacrifice'] },
    { ko: ['정체', '무의미한 희생', '지연'], en: ['stalling', 'needless sacrifice', 'delay'] }],
  ['Death', '죽음', 'XIII',
    { ko: ['끝과 시작', '변화', '이별', '재생'], en: ['endings', 'transformation', 'release', 'renewal'] },
    { ko: ['변화에 대한 저항', '집착', '정체'], en: ['resistance to change', 'holding on', 'stagnation'] }],
  ['Temperance', '절제', 'XIV',
    { ko: ['균형', '조화', '중용', '치유'], en: ['balance', 'harmony', 'moderation', 'healing'] },
    { ko: ['과잉', '불균형', '조급함'], en: ['excess', 'imbalance', 'impatience'] }],
  ['The Devil', '악마', 'XV',
    { ko: ['집착', '유혹', '속박', '물질주의'], en: ['attachment', 'temptation', 'bondage', 'materialism'] },
    { ko: ['해방', '속박에서 벗어남', '자각'], en: ['release', 'breaking free', 'awareness'] }],
  ['The Tower', '탑', 'XVI',
    { ko: ['급변', '붕괴', '충격', '각성'], en: ['sudden change', 'upheaval', 'shock', 'awakening'] },
    { ko: ['임박한 변화의 지연', '재난 회피', '두려움'], en: ['delayed disaster', 'averting crisis', 'fear of change'] }],
  ['The Star', '별', 'XVII',
    { ko: ['희망', '치유', '영감', '평온'], en: ['hope', 'healing', 'inspiration', 'serenity'] },
    { ko: ['실망', '희망 상실', '단절감'], en: ['discouragement', 'lost faith', 'disconnection'] }],
  ['The Moon', '달', 'XVIII',
    { ko: ['불확실성', '무의식', '환상', '직감'], en: ['uncertainty', 'subconscious', 'illusion', 'instinct'] },
    { ko: ['혼란 해소', '진실 드러남', '불안 완화'], en: ['clarity emerging', 'truth revealed', 'easing anxiety'] }],
  ['The Sun', '태양', 'XIX',
    { ko: ['성공', '활력', '기쁨', '긍정'], en: ['success', 'vitality', 'joy', 'positivity'] },
    { ko: ['일시적 침체', '과신', '지연된 성공'], en: ['temporary gloom', 'overconfidence', 'delayed success'] }],
  ['Judgement', '심판', 'XX',
    { ko: ['부활', '평가', '소명', '용서'], en: ['rebirth', 'reckoning', 'calling', 'forgiveness'] },
    { ko: ['자기 비판', '과거에 매임', '결정 회피'], en: ['self-judgment', 'stuck in the past', 'avoiding the call'] }],
  ['The World', '세계', 'XXI',
    { ko: ['완성', '성취', '통합', '여정의 끝'], en: ['completion', 'achievement', 'integration', 'fulfillment'] },
    { ko: ['미완성', '마무리 부족', '지연된 성취'], en: ['incompletion', 'loose ends', 'delayed closure'] }],
];

/** 마이너 아르카나 슈트 */
const SUITS = [
  {
    key: 'wands', en: 'Wands', ko: '완드', elementKo: '불', elementEn: 'Fire',
    theme: { ko: '열정 · 행동 · 창의', en: 'passion · action · creativity' },
  },
  {
    key: 'cups', en: 'Cups', ko: '컵', elementKo: '물', elementEn: 'Water',
    theme: { ko: '감정 · 관계 · 직관', en: 'emotion · relationships · intuition' },
  },
  {
    key: 'swords', en: 'Swords', ko: '소드', elementKo: '공기', elementEn: 'Air',
    theme: { ko: '지성 · 갈등 · 결단', en: 'intellect · conflict · decision' },
  },
  {
    key: 'pentacles', en: 'Pentacles', ko: '펜타클', elementKo: '흙', elementEn: 'Earth',
    theme: { ko: '물질 · 현실 · 성과', en: 'material · practicality · results' },
  },
];

const RANKS = [
  ['Ace', '에이스'], ['Two', '2'], ['Three', '3'], ['Four', '4'], ['Five', '5'],
  ['Six', '6'], ['Seven', '7'], ['Eight', '8'], ['Nine', '9'], ['Ten', '10'],
  ['Page', '시종'], ['Knight', '기사'], ['Queen', '여왕'], ['King', '왕'],
];

/** 슈트별 랭크 키워드 (정방향/역방향) */
const MINOR_KEYWORDS = {
  wands: [
    [{ ko: ['영감의 불씨', '새 기회', '잠재력'], en: ['spark of inspiration', 'new opportunity', 'potential'] },
      { ko: ['지연된 시작', '동기 저하'], en: ['delayed start', 'low motivation'] }],
    [{ ko: ['계획', '미래 구상', '갈림길의 선택'], en: ['planning', 'future vision', 'first decision'] },
      { ko: ['좁은 시야', '계획 부재'], en: ['narrow vision', 'lack of planning'] }],
    [{ ko: ['확장', '전망', '진행 중인 성과'], en: ['expansion', 'foresight', 'progress underway'] },
      { ko: ['지연', '장애물', '좌절된 확장'], en: ['delays', 'obstacles', 'blocked growth'] }],
    [{ ko: ['축하', '안정된 기반', '화합'], en: ['celebration', 'stable foundation', 'community'] },
      { ko: ['불안정한 기반', '미뤄진 축하'], en: ['instability', 'postponed celebration'] }],
    [{ ko: ['경쟁', '갈등', '의견 충돌'], en: ['competition', 'conflict', 'clashing views'] },
      { ko: ['갈등 회피', '내부 긴장 완화'], en: ['avoiding conflict', 'tension easing'] }],
    [{ ko: ['승리', '인정', '자신감'], en: ['victory', 'recognition', 'confidence'] },
      { ko: ['자만', '인정받지 못함'], en: ['egotism', 'lack of recognition'] }],
    [{ ko: ['방어', '입장 고수', '도전 대응'], en: ['defense', 'standing ground', 'perseverance'] },
      { ko: ['압도됨', '수세 몰림'], en: ['overwhelmed', 'giving ground'] }],
    [{ ko: ['빠른 전개', '소식', '추진'], en: ['swift movement', 'news', 'momentum'] },
      { ko: ['지연', '성급함', '엇갈린 소식'], en: ['delays', 'haste', 'mixed signals'] }],
    [{ ko: ['끈기', '마지막 고비', '경계'], en: ['resilience', 'last push', 'vigilance'] },
      { ko: ['소진', '방어적 태도'], en: ['burnout', 'defensiveness'] }],
    [{ ko: ['과중한 책임', '부담', '완수 직전'], en: ['heavy burden', 'responsibility', 'near completion'] },
      { ko: ['짐 내려놓기', '위임 필요'], en: ['releasing burden', 'need to delegate'] }],
    [{ ko: ['열정적 탐색', '새 아이디어', '호기심'], en: ['enthusiastic exploration', 'new ideas', 'curiosity'] },
      { ko: ['산만함', '미숙한 열정'], en: ['scattered energy', 'immature enthusiasm'] }],
    [{ ko: ['모험', '대담한 행동', '추진력'], en: ['adventure', 'bold action', 'drive'] },
      { ko: ['충동', '무모한 질주'], en: ['impulsiveness', 'recklessness'] }],
    [{ ko: ['카리스마', '독립심', '따뜻한 리더십'], en: ['charisma', 'independence', 'warm leadership'] },
      { ko: ['질투', '요구 과다'], en: ['jealousy', 'demanding nature'] }],
    [{ ko: ['비전 리더십', '기업가 정신', '결단력'], en: ['visionary leadership', 'entrepreneurship', 'decisiveness'] },
      { ko: ['독선', '성급한 결정'], en: ['high-handedness', 'hasty decisions'] }],
  ],
  cups: [
    [{ ko: ['감정의 시작', '사랑의 씨앗', '직관의 열림'], en: ['new feelings', 'seed of love', 'intuitive opening'] },
      { ko: ['감정 억압', '공허함'], en: ['blocked emotions', 'emptiness'] }],
    [{ ko: ['상호 끌림', '파트너십', '조화'], en: ['mutual attraction', 'partnership', 'harmony'] },
      { ko: ['불균형한 관계', '오해'], en: ['imbalanced relationship', 'misunderstanding'] }],
    [{ ko: ['우정', '축하', '공동체의 기쁨'], en: ['friendship', 'celebration', 'community joy'] },
      { ko: ['과잉', '겉도는 모임'], en: ['overindulgence', 'superficial socializing'] }],
    [{ ko: ['권태', '재평가', '무관심'], en: ['apathy', 'reevaluation', 'disinterest'] },
      { ko: ['새 관점 수용', '동기 회복'], en: ['renewed interest', 'accepting new offers'] }],
    [{ ko: ['상실감', '후회', '남은 것 바라보기'], en: ['loss', 'regret', 'what remains'] },
      { ko: ['수용', '회복의 시작', '용서'], en: ['acceptance', 'moving on', 'forgiveness'] }],
    [{ ko: ['추억', '순수함', '재회'], en: ['nostalgia', 'innocence', 'reunion'] },
      { ko: ['과거에 매임', '이상화'], en: ['living in the past', 'idealizing memories'] }],
    [{ ko: ['선택지 과다', '상상', '가능성 탐색'], en: ['many options', 'imagination', 'exploring possibilities'] },
      { ko: ['환상 정리', '명확한 선택'], en: ['clarity of choice', 'cutting through illusion'] }],
    [{ ko: ['떠남', '더 깊은 의미 찾기', '전환'], en: ['walking away', 'seeking deeper meaning', 'transition'] },
      { ko: ['머무름과 방황 사이', '회피'], en: ['fear of moving on', 'aimless drifting'] }],
    [{ ko: ['만족', '소원 성취', '풍족함'], en: ['contentment', 'wish fulfilled', 'emotional plenty'] },
      { ko: ['과욕', '겉치레 만족'], en: ['greed', 'superficial satisfaction'] }],
    [{ ko: ['정서적 충만', '가정의 화목', '완성된 행복'], en: ['emotional fulfillment', 'family harmony', 'lasting happiness'] },
      { ko: ['가정 불화', '깨진 이상'], en: ['family discord', 'broken ideals'] }],
    [{ ko: ['감성적 메시지', '창의적 시작', '순수한 마음'], en: ['emotional message', 'creative beginnings', 'open heart'] },
      { ko: ['감정 미성숙', '현실 도피'], en: ['emotional immaturity', 'escapism'] }],
    [{ ko: ['로맨틱한 제안', '매력', '이상 추구'], en: ['romantic offer', 'charm', 'pursuing ideals'] },
      { ko: ['비현실적 약속', '변덕'], en: ['unrealistic promises', 'moodiness'] }],
    [{ ko: ['공감', '정서적 안정', '배려'], en: ['compassion', 'emotional security', 'care'] },
      { ko: ['감정 과몰입', '정서적 소진'], en: ['emotional overwhelm', 'martyrdom'] }],
    [{ ko: ['감정의 절제', '포용', '지혜로운 조언'], en: ['emotional balance', 'tolerance', 'wise counsel'] },
      { ko: ['감정 조작', '억눌린 감정'], en: ['manipulation', 'repressed feelings'] }],
  ],
  swords: [
    [{ ko: ['명료함', '돌파구', '진실'], en: ['clarity', 'breakthrough', 'truth'] },
      { ko: ['혼란', '왜곡된 정보'], en: ['confusion', 'distorted information'] }],
    [{ ko: ['교착', '결정 보류', '균형 잡기'], en: ['stalemate', 'difficult decision', 'weighing options'] },
      { ko: ['정보 과부하', '결정 강요'], en: ['information overload', 'forced choice'] }],
    [{ ko: ['상심', '아픈 진실', '슬픔'], en: ['heartbreak', 'painful truth', 'sorrow'] },
      { ko: ['치유의 시작', '상처 회복'], en: ['beginning to heal', 'recovering from hurt'] }],
    [{ ko: ['휴식', '재충전', '심리적 정리'], en: ['rest', 'recuperation', 'mental reset'] },
      { ko: ['소진', '강요된 휴식'], en: ['burnout', 'restlessness'] }],
    [{ ko: ['이기고도 잃는 싸움', '갈등의 대가'], en: ['hollow victory', 'conflict at a cost'] },
      { ko: ['화해', '오랜 갈등의 종료'], en: ['reconciliation', 'ending old conflict'] }],
    [{ ko: ['이행', '회복으로의 이동', '떠나는 용기'], en: ['transition', 'moving toward calmer waters', 'rite of passage'] },
      { ko: ['미련', '벗어나지 못함'], en: ['unfinished business', 'stuck in transition'] }],
    [{ ko: ['전략', '독자 행동', '기민함'], en: ['strategy', 'acting alone', 'cunning'] },
      { ko: ['기만 드러남', '양심의 소리'], en: ['deception exposed', 'coming clean'] }],
    [{ ko: ['자기 제한', '갇힌 느낌', '관점의 감옥'], en: ['self-restriction', 'feeling trapped', 'mental bind'] },
      { ko: ['속박 해제', '자율 회복'], en: ['release', 'reclaiming agency'] }],
    [{ ko: ['불안', '걱정', '불면'], en: ['anxiety', 'worry', 'sleepless nights'] },
      { ko: ['불안의 완화', '두려움 직면'], en: ['easing fear', 'facing anxiety'] }],
    [{ ko: ['바닥', '끝맺음', '아픈 종료'], en: ['rock bottom', 'painful ending', 'closure'] },
      { ko: ['회복의 시작', '최악의 종료'], en: ['recovery begins', 'worst is over'] }],
    [{ ko: ['호기심', '새로운 사고', '관찰'], en: ['curiosity', 'new ideas', 'watchfulness'] },
      { ko: ['험담', '설익은 판단'], en: ['gossip', 'hasty judgment'] }],
    [{ ko: ['직진', '결단력', '빠른 사고'], en: ['charging ahead', 'decisiveness', 'quick thinking'] },
      { ko: ['성급함', '방향 없는 돌진'], en: ['impulsiveness', 'reckless haste'] }],
    [{ ko: ['통찰', '독립적 판단', '경계 설정'], en: ['perceptiveness', 'independent judgment', 'clear boundaries'] },
      { ko: ['냉소', '지나친 비판'], en: ['coldness', 'harsh criticism'] }],
    [{ ko: ['논리', '권위 있는 판단', '원칙'], en: ['logic', 'authoritative judgment', 'principle'] },
      { ko: ['독단적 판단', '권력 남용'], en: ['dogmatism', 'abuse of authority'] }],
  ],
  pentacles: [
    [{ ko: ['물질적 기회', '실질적 시작', '풍요의 씨앗'], en: ['material opportunity', 'practical start', 'seed of prosperity'] },
      { ko: ['놓친 기회', '불안정한 출발'], en: ['missed opportunity', 'shaky start'] }],
    [{ ko: ['균형 잡기', '유연한 대응', '우선순위 조율'], en: ['juggling priorities', 'adaptability', 'balance'] },
      { ko: ['과부하', '재정 불균형'], en: ['overload', 'financial imbalance'] }],
    [{ ko: ['협업', '숙련', '인정받는 실력'], en: ['teamwork', 'craftsmanship', 'recognized skill'] },
      { ko: ['협력 부족', '어긋난 역할'], en: ['poor collaboration', 'misaligned roles'] }],
    [{ ko: ['절약', '소유', '안정 추구'], en: ['saving', 'possession', 'security seeking'] },
      { ko: ['인색함', '지나친 방어'], en: ['stinginess', 'over-guarding'] }],
    [{ ko: ['궁핍', '소외감', '어려운 시기'], en: ['hardship', 'feeling left out', 'lean times'] },
      { ko: ['회복', '도움의 수용'], en: ['recovery', 'accepting help'] }],
    [{ ko: ['나눔', '관대함', '주고받음의 균형'], en: ['generosity', 'sharing', 'balanced giving'] },
      { ko: ['부채감', '조건 있는 호의'], en: ['strings attached', 'one-sided giving'] }],
    [{ ko: ['기다림', '장기 투자', '성과 점검'], en: ['patience', 'long-term investment', 'assessment'] },
      { ko: ['조급함', '노력 대비 낮은 성과'], en: ['impatience', 'limited returns'] }],
    [{ ko: ['숙달', '성실한 연마', '디테일'], en: ['mastery in progress', 'diligence', 'attention to detail'] },
      { ko: ['기계적 반복', '완벽주의'], en: ['monotony', 'perfectionism'] }],
    [{ ko: ['자립', '여유', '노력의 결실'], en: ['self-sufficiency', 'comfort', 'fruits of labor'] },
      { ko: ['과시', '홀로 남은 성취'], en: ['showing off', 'lonely success'] }],
    [{ ko: ['유산', '가족의 번영', '장기적 안정'], en: ['legacy', 'family prosperity', 'long-term security'] },
      { ko: ['가족 갈등', '불안정한 기반'], en: ['family disputes', 'unstable foundations'] }],
    [{ ko: ['배움', '실용적 목표', '꾸준한 시작'], en: ['study', 'practical goals', 'steady start'] },
      { ko: ['산만한 학습', '미루기'], en: ['lack of progress', 'procrastination'] }],
    [{ ko: ['근면', '신뢰성', '착실한 전진'], en: ['diligence', 'reliability', 'steady progress'] },
      { ko: ['정체', '융통성 부족'], en: ['stagnation', 'inflexibility'] }],
    [{ ko: ['실용적 돌봄', '풍요로운 살림', '현실 감각'], en: ['practical care', 'resourcefulness', 'groundedness'] },
      { ko: ['일과 삶의 불균형', '자기 돌봄 소홀'], en: ['work-life imbalance', 'self-neglect'] }],
    [{ ko: ['성공', '안정된 부', '믿음직함'], en: ['success', 'established wealth', 'dependability'] },
      { ko: ['물질 집착', '완고함'], en: ['materialism', 'stubbornness'] }],
  ],
};

/** 전체 78장 덱 생성 */
export function buildDeck() {
  const deck = [];
  MAJOR.forEach(([en, ko, numeral, up, rev], i) => {
    deck.push({
      id: `major-${i}`, arcana: 'major', suit: null, number: i, numeral,
      nameEn: en, nameKo: ko, up, rev,
    });
  });
  for (const suit of SUITS) {
    RANKS.forEach(([rankEn, rankKo], i) => {
      const [up, rev] = MINOR_KEYWORDS[suit.key][i];
      deck.push({
        id: `${suit.key}-${i + 1}`, arcana: 'minor', suit, number: i + 1,
        numeral: rankEn,
        nameEn: `${rankEn} of ${suit.en}`,
        nameKo: `${suit.ko} ${rankKo}`,
        up, rev,
      });
    });
  }
  return deck;
}

/** 스프레드 정의: positions 는 i18n 키 (tarot.positions.*). free 는 가변(1~12장) */
export const SPREADS = [
  { key: 'one', count: 1, positions: ['focus'] },
  { key: 'three', count: 3, positions: ['past', 'present', 'future'] },
  { key: 'five', count: 5, positions: ['situation', 'obstacle', 'advice', 'surroundings', 'outcome'] },
  {
    key: 'celtic', count: 10,
    positions: ['heart', 'challenge', 'foundation', 'recentPast', 'crown',
      'nearFuture', 'self', 'environment', 'hopesFears', 'outcome'],
  },
  { key: 'free', count: 0, positions: [] }, // count 런타임 지정 (1~12), 포지션은 '카드 N'
];

/** 특수 카드 조합 (뽑힌 카드 안의 쌍 일치 시 표시) — 자체 저작 해설 문장 */
export const SPECIAL_COMBOS = [
  {
    ids: ['major-0', 'major-21'],
    ko: '광대의 무한한 잠재력이 세계 카드의 완성과 만났습니다. 지금 시작하는 일은 큰 순환을 돌아 완성으로 이어질 흐름입니다.',
    en: 'The Fool\u2019s boundless potential meets the completion of The World — what begins now tends to travel the full circle toward fulfillment.',
  },
  {
    ids: ['major-13', 'major-16'],
    ko: '죽음과 탑이 함께 나오면 큰 전환의 신호로 읽힙니다. 낚은 구조가 빠르게 해체되고 새 판이 짜이는 흐름입니다.',
    en: 'Death together with The Tower signals sweeping transformation — old structures dissolve quickly to make room for a new configuration.',
  },
  {
    ids: ['major-17', 'major-19'],
    ko: '별과 태양의 조합은 회복 뒤에 찾아오는 밝은 성과를 암시하는 대표적인 길조 조합입니다.',
    en: 'The Star with The Sun is a classic bright pairing — hope and healing followed by visible success.',
  },
  {
    ids: ['major-6', 'major-15'],
    ko: '연인과 악마의 조합은 매력과 집착이 공존함을 보여줍니다. 관계·선택에서 건강한 경계가 중요해지는 흐름입니다.',
    en: 'The Lovers with The Devil shows attraction and attachment side by side — healthy boundaries become the key question.',
  },
  {
    ids: ['major-10', 'major-2'],
    ko: '운명의 수레바퀴와 여사제의 조합은 흐름을 억지로 밀기보다 직관을 따라 타이밍을 기다리라는 신호로 읽힙니다.',
    en: 'Wheel of Fortune with The High Priestess suggests trusting intuition and timing rather than forcing the flow.',
  },
];

/** 뽑힌 카드 집합에서 특수 조합 찾기 */
export function findSpecialCombos(drawn) {
  const ids = new Set(drawn.map((x) => x.card.id));
  return SPECIAL_COMBOS.filter((c) => c.ids.every((id) => ids.has(id)));
}

/** 카드의 조합용 핵심 태그 (키워드 앞 2개 조합) */
export function cardTag(card, reversed, lang) {
  const set = reversed ? card.rev : card.up;
  const words = lang === 'ko' ? set.ko : set.en;
  return words.slice(0, 2).join(' · ');
}

/** 암호학적 난수 기반 셔플 + 드로우 */
export function drawCards(deck, count, allowReversed) {
  const pool = [...deck];
  // Fisher–Yates (crypto.getRandomValues)
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count).map((card) => ({
    card,
    reversed: allowReversed ? randomInt(2) === 1 : false,
  }));
}

function randomInt(maxExclusive) {
  const buf = new Uint32Array(1);
  const limit = Math.floor(0xFFFFFFFF / maxExclusive) * maxExclusive;
  let v;
  do {
    globalThis.crypto.getRandomValues(buf);
    v = buf[0];
  } while (v >= limit);
  return v % maxExclusive;
}
