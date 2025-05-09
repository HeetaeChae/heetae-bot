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

export interface GoogleHotelInfo {
  name: string;
  star: string | null;
  description: string | null;
  checkInfo: string | null;
  address: string | null;
  contact: string | null;
  review: { score: string | null; count: string | null; list: any[] | null };
  imgUrls: string[];
}
