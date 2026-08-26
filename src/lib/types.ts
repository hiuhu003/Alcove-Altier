export type Category = {
  slug: string;
  name: string;
  blurb: string;
  image: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string; // category slug
  price: number; // in KES
  compareAt?: number; // optional "was" price
  shortDesc: string;
  description: string;
  images: string[];
  colors: string[]; // color names
  sizes: string[]; // size labels
  materials?: string[];
  featured: boolean;
  bespoke: boolean; // made-to-order -> WhatsApp inquiry
  inStock: number; // ready-made stock count (0 => inquiry only)
  rating: number;
  reviews: number;
  createdAt: string; // ISO
};
