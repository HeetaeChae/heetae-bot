import { HotelType } from './blog-v2.enum';

export const HOTEL_TYPE_DESCRIPTIONS: Record<HotelType, string> = {
  [HotelType.PRICE_UNDER_5]: '5만원 이하',
  [HotelType.PRICE_UNDER_10]: '10만원 이하',
  [HotelType.PRICE_ABOUT_10]: '10만원대',
  [HotelType.PRICE_ABOUT_20]: '20만원대',
  [HotelType.FACILITY_SPA]: '스파 있는',
  [HotelType.FACILITY_POOL]: '수영장 있는',
  [HotelType.FACILITY_BAR]: '바 있는',
  [HotelType.FACILITY_RESORT]: '리조트',
  [HotelType.FACILITY_HOSTEL]: '호스텔',
  [HotelType.AMENITY_BREAKFAST]: '조식 포함',
  [HotelType.AMENITY_OCEAN_VIEW]: '오션뷰',
  [HotelType.AMENITY_PET]: '애견 동반',
  [HotelType.STAR_FOUR]: '4성급',
  [HotelType.STAR_FIVE]: '5성급',
  [HotelType.GUEST_ALONE]: '혼자 여행객',
  [HotelType.GUEST_FAMILY]: '가족여행',
  [HotelType.GUEST_KID]: '어린이 동반',
  [HotelType.GUEST_BABY]: '아기 동반',
  [HotelType.RATING_HIGH]: '평점 높은',
};

export const HOTEL_TITLE_TEMPLATES: Record<HotelType, string> = {
  [HotelType.PRICE_UNDER_5]: '{city} 5만원 이하 가성비 호텔 BEST {count}',
  [HotelType.PRICE_UNDER_10]: '{city} 10만원 이하 가성비 호텔 TOP {count}',
  [HotelType.PRICE_ABOUT_10]: '{city} 10만원대 추천 호텔 {count}곳',
  [HotelType.PRICE_ABOUT_20]: '{city} 20만원대 추천 호텔 BEST {count}',
  [HotelType.FACILITY_SPA]: '{city} 스파 있는 호텔 추천 {count}곳',
  [HotelType.FACILITY_POOL]: '{city} 수영장 있는 호텔 TOP {count}',
  [HotelType.FACILITY_BAR]: '{city} 바 있는 분위기 좋은 호텔 BEST {count}',
  [HotelType.FACILITY_RESORT]: '{city} 인기 리조트 숙소 추천 리스트 {count}곳',
  [HotelType.FACILITY_HOSTEL]:
    '{city} 가성비 호스텔 TOP {count} – 나홀로 여행 추천',
  [HotelType.AMENITY_BREAKFAST]: '{city} 조식 포함 호텔 추천 {count}곳',
  [HotelType.AMENITY_OCEAN_VIEW]:
    '{city} 오션뷰 호텔 BEST {count} – 바다 보이는 뷰 맛집',
  [HotelType.AMENITY_PET]: '반려견과 함께! {city} 애견 동반 호텔 TOP {count}',
  [HotelType.STAR_FOUR]: '{city} 4성급 럭셔리 호텔 추천 {count}곳',
  [HotelType.STAR_FIVE]: '{city} 5성급 럭셔리 호텔 BEST {count}',
  [HotelType.GUEST_ALONE]: '{city} 혼자 여행객 추천 호텔 TOP {count}',
  [HotelType.GUEST_FAMILY]: '{city} 가족여행 추천 호텔 {count}곳',
  [HotelType.GUEST_KID]: '어린이와 함께 가기 좋은 {city} 호텔 BEST {count}',
  [HotelType.GUEST_BABY]: '{city} 아기 동반 가족을 위한 숙소 추천 {count}곳',
  [HotelType.RATING_HIGH]: '{city} 평점 높은 숙소 BEST {count}',
};

export const HOTEL_META_DESCRIPTION_TEMPLATES: Record<HotelType, string> = {
  [HotelType.PRICE_UNDER_5]:
    '{city}에서 5만원 이하로 숙박 가능한 가성비 좋은 호텔 {count}곳을 소개합니다.',
  [HotelType.PRICE_UNDER_10]:
    '{city} 10만원 이하 추천 호텔 TOP {count}. 합리적인 가격으로 만족도 높은 숙소를 확인해보세요.',
  [HotelType.PRICE_ABOUT_10]:
    '{city} 10만원대 숙소 {count}곳! 가격과 후기 모두 만족스러운 호텔 리스트입니다.',
  [HotelType.PRICE_ABOUT_20]:
    '{city}에서 20만원대의 쾌적한 호텔을 찾는다면? 가성비 좋은 호텔 BEST {count}을 확인해보세요.',
  [HotelType.FACILITY_SPA]:
    '스파로 힐링하기 좋은 {city} 호텔 {count}곳을 소개합니다. 여행의 피로를 확실히 풀어보세요.',
  [HotelType.FACILITY_POOL]:
    '{city} 수영장 있는 인기 호텔 {count}곳! 여름 여행객에게 딱 맞는 숙소 모음입니다.',
  [HotelType.FACILITY_BAR]:
    '{city}에서 바 분위기를 즐길 수 있는 감성 호텔 TOP {count}. 밤이 더 특별해지는 공간.',
  [HotelType.FACILITY_RESORT]:
    '휴양을 원한다면 {city} 리조트 숙소 {count}곳! 풍경과 시설 모두 만족스러운 곳만 모았습니다.',
  [HotelType.FACILITY_HOSTEL]:
    '{city} 가성비 좋은 호스텔 {count}곳! 저렴하지만 후기가 좋은 숙소만 선별했습니다.',
  [HotelType.AMENITY_BREAKFAST]:
    '조식이 맛있는 {city} 호텔 BEST {count}. 아침을 든든하게 시작할 수 있는 숙소 리스트입니다.',
  [HotelType.AMENITY_OCEAN_VIEW]:
    '바다 전망이 멋진 {city} 오션뷰 호텔 {count}곳! 여행의 낭만을 더해보세요.',
  [HotelType.AMENITY_PET]:
    '반려견과 함께 여행 가능한 {city} 애견 동반 호텔 {count}곳. 반려동물과 편안한 휴식!',
  [HotelType.STAR_FOUR]:
    '{city}의 4성급 호텔 {count}곳을 추천합니다. 위치, 후기, 가격 모두 갖춘 숙소만 골랐어요.',
  [HotelType.STAR_FIVE]:
    '럭셔리한 여행을 위한 {city} 5성급 호텔 BEST {count}. 품격 있는 휴식을 원하신다면 추천!',
  [HotelType.GUEST_ALONE]:
    '혼자 여행하기 좋은 {city} 숙소 {count}곳. 조용하고 안전한 호텔로만 골라봤어요.',
  [HotelType.GUEST_FAMILY]:
    '{city} 가족 여행에 적합한 호텔 {count}곳을 추천합니다. 공간, 편의, 위치 모두 고려!',
  [HotelType.GUEST_KID]:
    '아이와 함께 묵기 좋은 {city} 숙소 {count}곳. 키즈 프렌들리한 호텔만 골라 소개합니다.',
  [HotelType.GUEST_BABY]:
    '아기 동반 여행자를 위한 {city} 호텔 추천 {count}곳. 침대, 욕조, 편의시설까지 고려했습니다.',
  [HotelType.RATING_HIGH]:
    '사람들에게 좋은 평가를 받은 {city} 호텔 {count}곳. 만족도 높은, 평점 높은 숙소를 소개해드리겠습니다.',
};

export const GPT_PROMPTS: Record<string, string> = {
  intro:
    '{title}\n위의 내용은 블로그 글의 제목이다. 이를 참고하여 블로그 글의 인트로를 300자 정도로 작성하라.',
  hashtags:
    '{title}\n위의 내용은 블로그 글의 제목이다. 이를 참고하여 해시태그를 ,로 나누어 5가지 생성하라. 단, 앞에 #을 붙이지 않는다.',
};

export const CSS_STYLES: Record<string, string> = {
  title:
    'margin: 29px 0 22px; text-align: center; font-size: 1.9em; color: #60e800',
  metaDescription: 'margin: 29px 0 22px; font-size: 1.55em; text-align:center;',
  intro: 'margin: 29px 0 22px; font-size: 1.15em, line-height: 1.2rem',
  indexContainer:
    'margin: 1em 0em; width: 100%; border: 1px solid #ddd; padding: 1em; border-radius: 5px;',
  indexText: 'text-decoration: none; color: #007bff;',
  line: 'margin: 20px auto; width: 64px;',
  sectionTitle:
    'margin: 29px 0 22px; text-align: center; font-size: 1.55em; color: #419d00',
  description: 'font-size: 1.15em; line-height: 1.625rem',
  infoBox: 'margin: 0.5em 0em; border-left: 2px solid lightgray;',
  empty: 'margin: 1em 0em;',
  frame: 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5em;',
  image: 'width: 100%; object-fit: cover;',
};
