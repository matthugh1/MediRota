import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Users, Check } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface Skill {
  id: string;
  code: string;
  name: string;
}

interface DemandEditorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  slot: string;
  demand: Record<string, number>;
  skills: Skill[];
  onSubmit: (demand: Record<string, number>) => void;
  isLoading?: boolean;
  error?: string;
}

const demandItemSchema = z.object({
  skillCode: z.string().min(1, 'Skill is required'),
  count: z.number().min(0, 'Count must be 0 or greater'),
});

const demandSchema = z.object({
  items: z.array(demandItemSchema).min(1, 'At least one skill is required'),
});

type DemandFormData = z.infer<typeof demandSchema>;

export function DemandEditorSheet({
  isOpen,
  onClose,
  date,
  slot,
  demand,
  skills,
  onSubmit,
  isLoading = false,
  error,
}: DemandEditorSheetProps) {
  const [filteredSkills, setFilteredSkills] = useState<Skill[]>(skills);
  const [searchTerm, setSearchTerm] = useState('');

  const form = useForm<DemandFormData>({
    resolver: zodResolver(demandSchema),
    defaultValues: {
      items: Object.entries(demand).map(([skillCode, count]) => ({
        skillCode,
        count,
      })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // Filter skills based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = skills.filter(skill =>
        skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        skill.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSkills(filtered);
    } else {
      setFilteredSkills(skills);
    }
  }, [searchTerm, skills]);

  // Update form when demand prop changes
  useEffect(() => {
    if (Object.keys(demand).length > 0) {
      form.reset({
        items: Object.entries(demand).map(([skillCode, count]) => ({
          skillCode,
          count,
        })),
      });
    } else {
      form.reset({ items: [] });
    }
  }, [demand, form]);

  const handleSubmit = (data: DemandFormData) => {
    const demandObject = data.items.reduce((acc, item) => {
      acc[item.skillCode] = item.count;
      return acc;
    }, {} as Record<string, number>);
    
    onSubmit(demandObject);
  };

  const handleAddSkill = () => {
    append({ skillCode: '', count: 0 });
  };

  const handleRemoveSkill = (index: number) => {
    remove(index);
  };

  const getSkillName = (skillCode: string) => {
    const skill = skills.find(s => s.code === skillCode);
    return skill ? `${skill.name} (${skill.code})` : skillCode;
  };

  const totalDemand = form.watch('items').reduce((sum, item) => sum + (item.count || 0), 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/25 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-200">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Edit Demand</h2>
                <p className="text-sm text-zinc-500">
                  {new Date(date).toLocaleDateString()} - {slot}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={form.handleSubmit(handleSubmit)} className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto p-6">
                {/* Error Display */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Total Demand */}
                <div className="mb-6 p-4 bg-zinc-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-700">Total Required</span>
                    <span className="text-lg font-bold text-zinc-900">{totalDemand}</span>
                  </div>
                </div>

                {/* Demand Items */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-zinc-700">Skills Required</h3>
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Skill
                    </button>
                  </div>

                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center space-x-3 p-3 bg-zinc-50 rounded-lg">
                      {/* Skill Select */}
                      <div className="flex-1 relative">
                        <input
                          {...form.register(`items.${index}.skillCode`)}
                          placeholder="Search skills..."
                          className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            form.setValue(`items.${index}.skillCode`, e.target.value);
                          }}
                        />
                        
                        {/* Skill Dropdown */}
                        {searchTerm && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                            {filteredSkills.map((skill) => (
                              <button
                                key={skill.id}
                                type="button"
                                className="w-full px-3 py-2 text-sm text-left hover:bg-zinc-50 flex items-center justify-between"
                                onClick={() => {
                                  form.setValue(`items.${index}.skillCode`, skill.code);
                                  setSearchTerm('');
                                }}
                              >
                                <span>{skill.name} ({skill.code})</span>
                                {form.watch(`items.${index}.skillCode`) === skill.code && (
                                  <Check className="w-4 h-4 text-indigo-600" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Count Input */}
                      <input
                        {...form.register(`items.${index}.count`, { valueAsNumber: true })}
                        type="number"
                        min="0"
                        placeholder="0"
                        className="w-20 px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      />

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(index)}
                        className="p-2 text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {fields.length === 0 && (
                    <div className="text-center py-8 text-zinc-500">
                      <Users className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                      <p className="text-sm">No skills added yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-zinc-200 bg-zinc-50">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    'Save Demand'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
