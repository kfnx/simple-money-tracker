
import { useCategories } from "@/context/CategoryContext";

interface CategoryPillProps {
  category: string;
  onClick?: () => void;
  selected?: boolean;
}

export const CategoryPill = ({ category, onClick, selected = false }: CategoryPillProps) => {
  const { getAllCategories } = useCategories();
  const allCategories = getAllCategories();
  
  const categoryData = allCategories.find(cat => cat.name === category) || {
    name: category,
    emoji: '📝',
    background_color: '#f3f4f6'
  };

  const baseClasses = `category-pill ${selected ? 'ring-2 ring-primary' : ''}`;
  
  return (
    <button
      type="button"
      className={`${baseClasses} text-gray-800`}
      style={{ backgroundColor: categoryData.background_color }}
      onClick={onClick}
    >
      <span className="mr-1">{categoryData.emoji}</span>
      {categoryData.name.charAt(0).toUpperCase() + categoryData.name.slice(1)}
    </button>
  );
};
