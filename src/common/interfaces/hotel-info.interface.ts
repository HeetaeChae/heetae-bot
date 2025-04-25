export interface HotelInfoV1 {
  imgUrls: string[];
  name: string;
  subName: string;
  address: string;
  description: string;
  lowestPrice: number;
}

export interface HotelInfo {
  name: string;
  subname: string;
  address: string;
  description: string;
  lowestPrice: number;
  imgUrls: string[];
  pageUrl: string;
  reviews: {
    author: string;
    review: string;
    score: string;
  }[];
}
