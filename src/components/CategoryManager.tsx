
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCategories } from "@/context/CategoryContext";
import { Plus, Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

interface CategoryManagerProps {
  onClose: () => void;
}

export const CategoryManager = ({ onClose }: CategoryManagerProps) => {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Manage Categories</h3>
        <Button
          onClick={() => setIsAddingCategory(true)}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Add Category
        </Button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {categories.map((category) => (
          <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <span 
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                style={{ backgroundColor: category.background_color }}
              >
                {category.emoji}
              </span>
              <span className="font-medium capitalize">{category.name}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingCategory(category.id)}
              >
                <Edit size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeletingCategory(category.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Done
        </Button>
      </div>

      {/* Add Category Dialog */}
      <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
          </DialogHeader>
          <CategoryForm
            onSubmit={async (data) => {
              await addCategory(data);
              setIsAddingCategory(false);
            }}
            onCancel={() => setIsAddingCategory(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <CategoryForm
              initialData={categories.find(c => c.id === editingCategory)}
              onSubmit={async (data) => {
                await updateCategory(editingCategory, data);
                setEditingCategory(null);
              }}
              onCancel={() => setEditingCategory(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? All expenses using this category will be moved to "other".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                if (deletingCategory) {
                  await deleteCategory(deletingCategory);
                  setDeletingCategory(null);
                }
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

interface CategoryFormProps {
  initialData?: any;
  onSubmit: (data: { name: string; emoji: string; background_color: string }) => void;
  onCancel: () => void;
}

const CategoryForm = ({ initialData, onSubmit, onCancel }: CategoryFormProps) => {
  const [name, setName] = useState(initialData?.name || '');
  const [emoji, setEmoji] = useState(initialData?.emoji || '📝');
  const [backgroundColor, setBackgroundColor] = useState(initialData?.background_color || '#f3f4f6');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onSubmit({
      name: name.trim().toLowerCase(),
      emoji,
      background_color: backgroundColor,
    });
  };

  const commonColors = [
    '#fed7aa', '#fef3c7', '#e9d5ff', '#fce7f3', '#f3f4f6',
    '#fbbf24', '#34d399', '#60a5fa', '#f87171', '#a78bfa'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2">
          Category Name
        </label>
        <Input
          id="name"
          type="text"
          placeholder="e.g., groceries, bills, etc."
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>

      <div>
        <label htmlFor="emoji" className="block text-sm font-medium mb-2">
          Emoji
        </label>
        <Input
          id="emoji"
          type="text"
          placeholder="🏠"
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          maxLength={2}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Background Color
        </label>
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            {commonColors.map((color) => (
              <button
                key={color}
                type="button"
                className={`w-8 h-8 rounded-full border-2 ${
                  backgroundColor === color ? 'border-gray-900' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setBackgroundColor(color)}
              />
            ))}
          </div>
          <Input
            type="color"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="w-20 h-10"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!name.trim()}>
          {initialData ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
};
