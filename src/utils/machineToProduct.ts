import type { Machine, Product } from '../types';

/** Adapts a Machine into the Product shape expected by ContactModal. */
export function machineToProduct(machine: Machine): Product {
  return {
    id: machine.id,
    name: machine.name,
    description: machine.description,
    price: 'Consultar precio',
    image: machine.image,
    features: [machine.speed, machine.width].filter(Boolean),
    category: machine.category,
    discount: machine.brand,
    inStock: machine.inStock,
  };
}
