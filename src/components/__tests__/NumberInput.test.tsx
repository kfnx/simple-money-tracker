import { render, screen, fireEvent } from '@testing-library/react';
import { NumberInput } from '../NumberInput';
import { describe, it, expect, vi } from 'vitest';

describe('NumberInput', () => {
  it('formats numbers with thousand separators', () => {
    const mockOnChange = vi.fn();
    render(<NumberInput value="1000000" onChange={mockOnChange} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('1.000.000');
  });

  it('calls onChange with clean numeric value', () => {
    const mockOnChange = vi.fn();
    render(<NumberInput value="1000000" onChange={mockOnChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '2.000.000' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('2000000');
  });

  it('allows decimal input and formats correctly', () => {
    const mockOnChange = vi.fn();
    render(<NumberInput value="1234.56" onChange={mockOnChange} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('1.234.56');
  });

  it('passes raw input value to onChange', () => {
    const mockOnChange = vi.fn();
    render(<NumberInput value="1234" onChange={mockOnChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '1a2b3c4d' } });
    expect(mockOnChange).toHaveBeenCalledWith('1a2b3c4d');
  });

  it('calls onChange with correct value for various valid inputs', () => {
    const mockOnChange = vi.fn();
    render(<NumberInput value="5000" onChange={mockOnChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '10.000' } });
    expect(mockOnChange).toHaveBeenCalledWith('10000');
    fireEvent.change(input, { target: { value: '1.000.000' } });
    expect(mockOnChange).toHaveBeenCalledWith('1000000');
    fireEvent.change(input, { target: { value: '123.45' } });
    expect(mockOnChange).toHaveBeenCalledWith('12345');
  });
});
