
import React, { createContext, useContext, useEffect, useState } from 'react';
import { CustomCategory } from '@/types/expense';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface CategoryContextType {
  categories: CustomCategory[];
  defaultCategories: { name: string; emoji: string; background_color: string }[];
  addCategory: (category: Omit<CustomCategory, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<Omit<CustomCategory, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getAllCategories: () => { name: string; emoji: string; background_color: string }[];
  clearData: () => void;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
};

export const CategoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const defaultCategories = [
    { name: 'food', emoji: '🍔', background_color: '#fed7aa' },
    { name: 'transport', emoji: '🚗', background_color: '#fef3c7' },
    { name: 'entertainment', emoji: '🎮', background_color: '#e9d5ff' },
    { name: 'shopping', emoji: '🛍️', background_color: '#fce7f3' },
    { name: 'other', emoji: '📝', background_color: '#f3f4f6' },
  ];

  // Clear all data (for logout)
  const clearData = () => {
    setCategories([]);
  };

  // Load categories from Supabase when user is logged in
  useEffect(() => {
    const fetchCategories = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('created_at', { ascending: true });
        
        if (error) {
          throw error;
        }
        
        setCategories(data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast({
          title: 'Error loading categories',
          description: 'Failed to load your custom categories.',
          variant: 'destructive',
        });
      }
    };

    fetchCategories();
  }, [user, toast]);

  const addCategory = async (categoryData: Omit<CustomCategory, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to create custom categories.',
        variant: 'destructive',
      });
      return;
    }

    // Check if category name already exists
    const allCategories = getAllCategories();
    if (allCategories.some(cat => cat.name.toLowerCase() === categoryData.name.toLowerCase())) {
      toast({
        title: 'Category already exists',
        description: `A category with the name "${categoryData.name}" already exists.`,
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: categoryData.name,
          emoji: categoryData.emoji,
          background_color: categoryData.background_color,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: 'Category already exists',
            description: `A category with the name "${categoryData.name}" already exists.`,
            variant: 'destructive',
          });
          return;
        }
        throw error;
      }

      setCategories(prev => [...prev, data]);
      
      toast({
        title: 'Category created',
        description: `Category "${categoryData.name}" was created successfully.`,
      });
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: 'Error creating category',
        description: 'Failed to create your category.',
        variant: 'destructive',
      });
    }
  };

  const updateCategory = async (id: string, updatedFields: Partial<Omit<CustomCategory, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!user) return;

    // Check if new name already exists (if name is being updated)
    if (updatedFields.name) {
      const allCategories = getAllCategories();
      const currentCategory = categories.find(cat => cat.id === id);
      if (allCategories.some(cat => 
        cat.name.toLowerCase() === updatedFields.name!.toLowerCase() && 
        cat.name !== currentCategory?.name
      )) {
        toast({
          title: 'Category already exists',
          description: `A category with the name "${updatedFields.name}" already exists.`,
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .update({
          ...updatedFields,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: 'Category already exists',
            description: `A category with the name "${updatedFields.name}" already exists.`,
            variant: 'destructive',
          });
          return;
        }
        throw error;
      }

      setCategories(prev => prev.map(cat => cat.id === id ? data : cat));
      
      toast({
        title: 'Category updated',
        description: 'Your category was updated successfully.',
      });
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: 'Error updating category',
        description: 'Failed to update your category.',
        variant: 'destructive',
      });
    }
  };

  const deleteCategory = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setCategories(prev => prev.filter(cat => cat.id !== id));
      
      toast({
        title: 'Category deleted',
        description: 'Your category was deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Error deleting category',
        description: 'Failed to delete your category.',
        variant: 'destructive',
      });
    }
  };

  const getAllCategories = () => {
    const customCats = categories.map(cat => ({
      name: cat.name,
      emoji: cat.emoji,
      background_color: cat.background_color,
    }));
    
    return [...defaultCategories, ...customCats];
  };

  return (
    <CategoryContext.Provider value={{ 
      categories,
      defaultCategories,
      addCategory,
      updateCategory,
      deleteCategory,
      getAllCategories,
      clearData,
    }}>
      {children}
    </CategoryContext.Provider>
  );
};
