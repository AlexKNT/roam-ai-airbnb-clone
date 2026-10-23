export const stayTypeValues = ['cabin', 'beach', 'city', 'villa'] as const;

export type StayType = (typeof stayTypeValues)[number];

export type StayImage = {
  url: string | null;
  alt: string;
};

export type Host = {
  name: string;
  avatar: StayImage | null;
  superhost: boolean;
};

export type CancellationPolicy = {
  title: string;
  summary: string;
  body: string;
};

export type HouseRules = {
  name: string;
  rules: string[];
};

export type StaySummary = {
  _id: string;
  slug: string;
  name: string;
  type: StayType;
  place: string;
  pricePerNight: number;
  rating: number;
  reviewCount: number;
  amenities: string[];
  coverImage: StayImage | null;
};

export type StayDetail = StaySummary & {
  summary: string;
  guests: number;
  bedrooms: number | null;
  beds: number | null;
  baths: number | null;
  petsAllowed: boolean;
  gallery: StayImage[];
  checkInTime: string;
  checkOutTime: string;
  host: Host | null;
  cancellationPolicy: CancellationPolicy | null;
  houseRules: HouseRules | null;
};
