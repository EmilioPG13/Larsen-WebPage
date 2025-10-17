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

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  productId?: string;
  productName?: string;
}
