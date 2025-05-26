
import { Button } from "@/components/ui/button";
import { CategoryPill } from "@/components/CategoryPill";
import { useCategories } from "@/context/CategoryContext";
import { Settings } from "lucide-react";

interface CategorySelectorProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onManageCategories: () => void;
}

export const CategorySelector = ({ 
  selectedCategory, 
  onCategoryChange, 
  onManageCategories 
}: CategorySelectorProps) => {
  const { getAllCategories } = useCategories();
  const allCategories = getAllCategories();

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-lg font-medium">Category</label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onManageCategories}
          className="flex items-center gap-1"
        >
          <Settings size={16} />
          Manage
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {allCategories.map((category) => (
          <CategoryPill
            key={category.name}
            category={category.name}
            selected={selectedCategory === category.name}
            onClick={() => onCategoryChange(category.name)}
          />
        ))}
      </div>
    </div>
  );
};
