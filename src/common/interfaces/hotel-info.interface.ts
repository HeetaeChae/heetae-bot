export interface HotelInfoV1 {
  imgUrls: string[];
  name: string;
  subName: string;
  address: string;
  description: string;
  trafficInfos: string[];
  aiReview: string | null;
  lowestPrice: number;
}
