import { HotelType } from '../enums/hotel-type.enum';

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
};

export const HOTEL_INTRO_TEMPLATES: Record<HotelType, string> = {
  [HotelType.PRICE_UNDER_5]: `
{city} 여행에서 숙소 비용을 아끼고 싶은 분들을 위해 5만원 이하의 호텔 {count}곳을 소개합니다. 
가격은 낮지만 평점과 후기에서 이미 검증된 호텔만 선별했어요.
`,
  [HotelType.PRICE_UNDER_10]: `
{city}에서 10만원 이하로 묵을 수 있는 가성비 호텔 {count}곳을 엄선했습니다. 
깔끔한 시설, 위치, 후기가 모두 만족스러운 곳만 정리했어요.
`,
  [HotelType.PRICE_ABOUT_10]: `
10만원대 숙소를 찾고 있다면 이 글을 참고해보세요! {city}에서 실속 있게 즐길 수 있는 호텔 {count}곳을 추천합니다.
`,
  [HotelType.PRICE_ABOUT_20]: `
20만원대 숙소도 부담 없이 즐기고 싶다면? {city}에서 분위기 좋고 후기가 우수한 호텔 {count}곳을 정리해봤습니다.
`,
  [HotelType.FACILITY_SPA]: `
여행의 피로를 풀어주는 최고의 선택, 스파!  
{city}에서 스파 시설이 있는 감성 호텔 {count}곳을 소개합니다.
`,
  [HotelType.FACILITY_POOL]: `
여름이면 수영장 있는 호텔이 최고죠!  
{city} 여행자들에게 인기 있는 수영장 호텔 {count}곳을 모아봤어요.
`,
  [HotelType.FACILITY_BAR]: `
밤이 더 아름다운 {city}, 바 있는 호텔에서 특별한 시간을 보내보세요.  
감성 넘치는 숙소 {count}곳을 소개합니다.
`,
  [HotelType.FACILITY_RESORT]: `
한적한 휴식을 즐기고 싶다면 리조트가 제격이죠.  
{city} 리조트 스타일 숙소 {count}곳을 추천드립니다.
`,
  [HotelType.FACILITY_HOSTEL]: `
저렴하면서도 후기가 좋은 호스텔을 찾고 있다면, {city}의 추천 호스텔 {count}곳을 확인해보세요!
`,
  [HotelType.AMENITY_BREAKFAST]: `
조식이 맛있는 호텔은 아침의 기분을 바꿔줍니다.  
{city}에서 조식으로 인기 많은 호텔 {count}곳을 골라봤어요.
`,
  [HotelType.AMENITY_OCEAN_VIEW]: `
오션뷰 숙소만의 낭만, 누구나 한 번쯤 꿈꾸죠?  
{city}에서 바다가 보이는 호텔 {count}곳을 소개합니다.
`,
  [HotelType.AMENITY_PET]: `
반려견과 함께 떠나는 여행!  
{city}에서 애견 동반이 가능한 호텔 {count}곳을 정리했습니다.
`,
  [HotelType.STAR_FOUR]: `
너무 고급도 부담스럽고, 너무 저렴한 곳은 싫다면?  
{city} 4성급 호텔 {count}곳으로 균형 잡힌 여행을 즐겨보세요.
`,
  [HotelType.STAR_FIVE]: `
최상의 휴식을 원하신다면 5성급이 정답!  
{city}의 5성급 호텔 {count}곳을 추천드립니다.
`,
  [HotelType.GUEST_ALONE]: `
혼자만의 여유를 즐기기 좋은 {city} 혼행 숙소 {count}곳을 소개합니다.  
안전하고 편안한 공간만 선별했어요.
`,
  [HotelType.GUEST_FAMILY]: `
가족 여행은 호텔 선택이 더 중요하죠.  
{city}에서 가족 단위로 묵기 좋은 호텔 {count}곳을 추천해드립니다.
`,
  [HotelType.GUEST_KID]: `
아이와 함께하는 여행, 걱정 없이 즐기려면 키즈 프렌들리 호텔이 필요합니다.  
{city}에서 아이 동반 가족에게 인기 있는 숙소 {count}곳을 소개합니다.
`,
  [HotelType.GUEST_BABY]: `
아기와 함께하는 여행은 시설과 침구 하나까지도 중요하죠.  
{city}에서 아기 동반 고객에게 적합한 호텔 {count}곳을 골라봤어요.
`,
};
