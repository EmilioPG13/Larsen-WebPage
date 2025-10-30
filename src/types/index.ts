export interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
  features: string[];
  category: string;
  discount: string;
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
