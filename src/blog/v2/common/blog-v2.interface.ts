import { HotelType } from './blog-v2.enum';

export interface HotelInfo {
  name: string;
  star: string | null;
  review: {
    score: string;
    count: string;
    list: { author: string; content: string }[];
  };
  imgUrls: string[];
  descriptionList: string[];
  checkInfo: { checkIn: string; checkOut: string };
  address: string;
  contact: string;
}

export interface KeywordData {
  id: number;
  city: string;
  hotelType: HotelType;
  relatedUrl: string | null;
}

export interface PostContent {
  title: string;
  HTML: string;
  hashtags: string[];
}

export interface ValidCountInfo {
  hotel: { min: number; max: number };
  img: number;
  reviewList: number;
}

export interface KakaoAuthInfo {
  email: null | string;
  pass: null | string;
}
