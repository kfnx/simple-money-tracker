
import { NumberInput } from "@/components/NumberInput";

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const AmountInput = ({ value, onChange }: AmountInputProps) => {
  return (
    <div>
      <label htmlFor="amount" className="text-lg font-medium block mb-2">
        How much?
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-xl font-semibold text-muted-foreground">
          Rp.
        </span>
        <NumberInput
          id="amount"
          placeholder="0"
          className="pl-12 text-xl h-14"
          value={value}
          onChange={onChange}
          autoFocus
        />
      </div>
    </div>
  );
};
