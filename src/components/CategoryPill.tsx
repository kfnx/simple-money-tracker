
import { CategoryType } from "@/types/expense";

interface CategoryPillProps {
  category: CategoryType;
  onClick?: () => void;
  selected?: boolean;
}

export const CategoryPill = ({ category, onClick, selected = false }: CategoryPillProps) => {
  const baseClasses = `category-pill ${selected ? 'ring-2 ring-primary' : ''}`;
  
  const categoryClasses = {
    food: "bg-category-food text-orange-800",
    transport: "bg-category-transport text-yellow-800",
    entertainment: "bg-category-entertainment text-purple-800",
    shopping: "bg-category-shopping text-pink-800",
    other: "bg-category-other text-gray-800",
  };

  return (
    <button
      type="button"
      className={`${baseClasses} ${categoryClasses[category]}`}
      onClick={onClick}
    >
      {category.charAt(0).toUpperCase() + category.slice(1)}
    </button>
  );
};
