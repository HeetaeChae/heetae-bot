export enum HotelType {
  GOOD_REVIEW = '1',
  GOOD_LOCATION = '2',
  GOOD_PRICE = '3',
  RECOMMEND = '4',
  LUXURY = '5',
  UNDER_10 = '6',
  ABOUT_10 = '7',
  ABOUT_20 = '8',
}

export const HotelTypeDesc = {
  [HotelType.GOOD_REVIEW]: '리뷰 좋은',
  [HotelType.GOOD_LOCATION]: '위치 좋은',
  [HotelType.GOOD_PRICE]: '가성비',
  [HotelType.RECOMMEND]: '추천',
  [HotelType.LUXURY]: '럭셔리',
  [HotelType.UNDER_10]: '10만원 이하',
  [HotelType.ABOUT_10]: '10만원대',
  [HotelType.ABOUT_20]: '20만원대',
};
