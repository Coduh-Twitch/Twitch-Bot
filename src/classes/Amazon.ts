import { get } from "axios";

export interface AmazonProduct {
  title: string;
  subtitle: string;
  brand: string;
  url: string;
  asin: string;
  isPrime: boolean;
  isNew: boolean;
  isInStock: boolean;
  price: {
    symbol: string;
    value: number;
    currency: string;
    display: string;
  };
  mainImageUrl: string;
  imageUrls: string[];
  rating: number;
  ratingsTotal: number;
  featureBullets: string[];
  technicalSpecifications: {
    name: string;
    value: string;
  }[];
  categories: {
    id: string;
    name: string;
    url: string;
    breadcrumbPath: string;
  }[];
  coupon: {
    label: string;
  };
  seller: {
    sellerId: string;
    name: string;
  };
}

export default class Amazon {
  apiKey: string;
  productBaseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.productBaseUrl = "https://rest.canopyapi.co/api/amazon/product";
  }

  getHeaders(): Record<string, string> {
    return {
      "API-KEY": `${this.apiKey}`,
    };
  }

  async getProduct(id_or_url: string): Promise<AmazonProduct | null> {
    let type: "url" | "asin" = "asin";
    if (id_or_url.startsWith("http")) type = "url";

    const res = await get(`${this.productBaseUrl}?${type}=${id_or_url}`, {
      headers: this.getHeaders(),
    });
    return res.data?.data?.amazonProduct || null;
  }
}
