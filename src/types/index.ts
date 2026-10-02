export interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
  features: string[];
  category: string;
  discount: string;
  inStock?: boolean;
}

/** Campos traducibles de una máquina. Los que falten caen al valor en español. */
export interface MachineI18n {
  description?: string;
  type?: string;
  knittingSystems?: string;
  width?: string;
  speed?: string;
  gauge?: string;
  yarnGuides?: string;
  capabilities?: string[];
  software?: string;
  power?: string;
  category?: string;
}

export interface Machine {
  id: string;
  name: string;
  brand: string;
  description: string;
  type: string;
  knittingSystems: string;
  width: string;
  speed: string;
  gauge: string;
  yarnGuides: string;
  capabilities: string[];
  software: string;
  power: string;
  category: string;
  image: string;
  inStock?: boolean;
  /** Sold to order from Italy: listed in the catalog without physical units. */
  onOrder?: boolean;
  en?: MachineI18n;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  productId?: string;
  productName?: string;
}

export type SearchResultType = 'machine' | 'product' | 'page';

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  route: string;
  data?: Machine | Product;
}