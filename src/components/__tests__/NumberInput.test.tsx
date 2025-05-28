
import { render, fireEvent } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import { NumberInput } from '../NumberInput';

describe('NumberInput', () => {
  test('formats numbers with thousand separators', () => {
    const mockOnChange = jest.fn();
    
    render(
      <NumberInput
        value="50000"
        onChange={mockOnChange}
        placeholder="Enter amount"
      />
    );

    const input = screen.getByDisplayValue('50.000');
    expect(input).toBeInTheDocument();
  });

  test('calls onChange with clean numeric value', () => {
    const mockOnChange = jest.fn();
    
    render(
      <NumberInput
        value=""
        onChange={mockOnChange}
        placeholder="Enter amount"
      />
    );

    const input = screen.getByPlaceholderText('Enter amount');
    fireEvent.change(input, { target: { value: '123.456' } });

    expect(mockOnChange).toHaveBeenCalledWith('123456');
  });

  test('handles empty input', () => {
    const mockOnChange = jest.fn();
    
    render(
      <NumberInput
        value=""
        onChange={mockOnChange}
        placeholder="Enter amount"
      />
    );

    const input = screen.getByPlaceholderText('Enter amount');
    expect(input).toHaveValue('');
  });
});
