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

/** One physical unit offered in the public catalog (never carries notes or sale data). */
export interface CatalogUnit {
  id: string;
  gauge: string;
  serialNumber: string;
}

/** A model in `GET /api/catalog`: its available units, or a made-to-order machine with none. */
export interface CatalogModel {
  brand: string;
  model: string;
  /** Spec sheet id when the model has one, which `/maquinas/:id` can open. */
  machineId: string | null;
  image: string | null;
  modality: 'EN_BODEGA' | 'BAJO_PEDIDO';
  gauges: string[];
  units: CatalogUnit[];
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