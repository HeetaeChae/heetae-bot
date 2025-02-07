export type Star = '3' | '4' | '5' | undefined;

export interface PriceInfo {
  originPrice: string | null;
  salesPrice: string | null;
  promotionType: string | null;
  promotionStatus: string | null;
}

export interface HotelInfo {
  name: string | null;
  priceInfo: PriceInfo;
  score: string | null;
  reviewCount: string | null;
  summary: string | null;
  rank: number | null;
  imgUrls: string[];
}
