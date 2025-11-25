import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProductCard from '../ProductCard';
import type { Product } from '../../types';

describe('ProductCard', () => {
  const mockProduct: Product = {
    id: '1',
    name: 'Test Product',
    description: 'Test Description',
    price: '$100',
    image: '/test-image.png',
    features: ['Feature 1', 'Feature 2'],
    category: 'Test Category',
    discount: '',
  };

  const mockOnInterest = vi.fn();

  it('should render product information', () => {
    render(<ProductCard product={mockProduct} onInterest={mockOnInterest} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('$100')).toBeInTheDocument();
    expect(screen.getByText('Test Category')).toBeInTheDocument();
  });

  it('should display "En Stock" badge when inStock is true', () => {
    const productInStock = { ...mockProduct, inStock: true };
    render(<ProductCard product={productInStock} onInterest={mockOnInterest} />);

    const badge = screen.getByText('En Stock');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-green-600');
  });

  it('should display "No disponible" badge when inStock is false', () => {
    const productOutOfStock = { ...mockProduct, inStock: false };
    render(<ProductCard product={productOutOfStock} onInterest={mockOnInterest} />);

    const badge = screen.getByText('No disponible');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-gray-500');
  });

  it('should not display stock badge when inStock is undefined', () => {
    render(<ProductCard product={mockProduct} onInterest={mockOnInterest} />);

    expect(screen.queryByText('En Stock')).not.toBeInTheDocument();
    expect(screen.queryByText('No disponible')).not.toBeInTheDocument();
  });

  it('should call onInterest when "Me interesa" button is clicked', () => {
    render(<ProductCard product={mockProduct} onInterest={mockOnInterest} />);

    const button = screen.getByText('💬 Me interesa');
    button.click();

    expect(mockOnInterest).toHaveBeenCalledWith(mockProduct);
    expect(mockOnInterest).toHaveBeenCalledTimes(1);
  });

  it('should display discount badge when discount is provided', () => {
    const productWithDiscount = { ...mockProduct, discount: '20% OFF' };
    render(<ProductCard product={productWithDiscount} onInterest={mockOnInterest} />);

    expect(screen.getByText('20% OFF')).toBeInTheDocument();
  });

  it('should display features', () => {
    render(<ProductCard product={mockProduct} onInterest={mockOnInterest} />);

    expect(screen.getByText('Feature 1')).toBeInTheDocument();
    expect(screen.getByText('Feature 2')).toBeInTheDocument();
  });
});

