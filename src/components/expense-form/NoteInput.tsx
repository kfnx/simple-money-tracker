
import { Input } from "@/components/ui/input";

interface NoteInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const NoteInput = ({ value, onChange }: NoteInputProps) => {
  return (
    <div>
      <label htmlFor="note" className="font-medium block mb-2">
        Note (optional)
      </label>
      <Input
        id="note"
        type="text"
        placeholder="Add a note..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={128}
      />
      <div className="text-xs text-muted-foreground mt-1">
        {value.length}/128 characters
      </div>
    </div>
  );
};
