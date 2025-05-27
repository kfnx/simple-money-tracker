
import { Input } from "@/components/ui/input";
import { forwardRef } from "react";

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value, onChange, ...props }, ref) => {
    const formatNumber = (num: string) => {
      // Remove any non-digit characters except dots
      const cleanNum = num.replace(/[^\d.]/g, '');
      
      // Handle empty string
      if (!cleanNum) return '';
      
      // Split by decimal point
      const parts = cleanNum.split('.');
      
      // Format the integer part with thousand separators
      const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      
      // If there's a decimal part, add it back
      if (parts.length > 1) {
        return `${integerPart}.${parts[1]}`;
      }
      
      return integerPart;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Remove dots for the actual numeric value
      const numericValue = inputValue.replace(/\./g, '');
      
      // Update with formatted display value
      onChange(numericValue);
    };

    const displayValue = formatNumber(value);

    return (
      <Input
        {...props}
        ref={ref}
        type="number"
        value={displayValue}
        onChange={handleChange}
      />
    );
  }
);

NumberInput.displayName = "NumberInput";
