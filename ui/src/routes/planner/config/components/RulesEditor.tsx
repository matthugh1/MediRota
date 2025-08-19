import React, { useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Plus, Trash2, Settings } from 'lucide-react';

interface Rule {
  key: string;
  value: string;
}

interface RulesEditorProps {
  name: string;
  label: string;
  className?: string;
}

const defaultRules = [
  { key: 'minRestHours', value: '11' },
  { key: 'maxConsecutiveNights', value: '3' },
  { key: 'oneShiftPerDay', value: 'true' },
];

export function RulesEditor({ name, label, className = '' }: RulesEditorProps) {
  const { control, formState: { errors } } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  const [newRule, setNewRule] = useState({ key: '', value: '' });

  const handleAddRule = () => {
    if (newRule.key && newRule.value) {
      append(newRule);
      setNewRule({ key: '', value: '' });
    }
  };

  const handleRemoveRule = (index: number) => {
    remove(index);
  };

  const handleAddDefaultRules = () => {
    defaultRules.forEach(rule => {
      const exists = fields.some((field: any) => field.key === rule.key);
      if (!exists) {
        append(rule);
      }
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-zinc-700">
          {label}
        </label>
        <button
          type="button"
          onClick={handleAddDefaultRules}
          className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
        >
          <Settings className="w-3 h-3 mr-1" />
          Add Defaults
        </button>
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center space-x-3 p-3 bg-zinc-50 rounded-lg">
            <div className="flex-1">
              <input
                {...control.register(`${name}.${index}.key`)}
                placeholder="Rule key"
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              />
            </div>
            <div className="flex-1">
              <input
                {...control.register(`${name}.${index}.value`)}
                placeholder="Rule value"
                className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              />
            </div>
            <button
              type="button"
              onClick={() => handleRemoveRule(index)}
              className="p-2 text-red-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Add New Rule */}
      <div className="flex items-center space-x-3 p-3 bg-zinc-50 rounded-lg border-2 border-dashed border-zinc-300">
        <div className="flex-1">
          <input
            value={newRule.key}
            onChange={(e) => setNewRule(prev => ({ ...prev, key: e.target.value }))}
            placeholder="New rule key"
            className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          />
        </div>
        <div className="flex-1">
          <input
            value={newRule.value}
            onChange={(e) => setNewRule(prev => ({ ...prev, value: e.target.value }))}
            placeholder="New rule value"
            className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          />
        </div>
        <button
          type="button"
          onClick={handleAddRule}
          disabled={!newRule.key || !newRule.value}
          className="p-2 text-indigo-600 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Error Display */}
      {errors[name] && (
        <p className="text-sm text-red-600">{errors[name]?.message as string}</p>
      )}

      {/* Help Text */}
      <div className="text-sm text-zinc-500">
        <p>Common rule keys:</p>
        <ul className="mt-1 space-y-1">
          <li><code className="bg-zinc-100 px-1 rounded">minRestHours</code> - Minimum rest hours between shifts (default: 11)</li>
          <li><code className="bg-zinc-100 px-1 rounded">maxConsecutiveNights</code> - Maximum consecutive night shifts (default: 3)</li>
          <li><code className="bg-zinc-100 px-1 rounded">oneShiftPerDay</code> - Allow only one shift per day (default: true)</li>
        </ul>
      </div>
    </div>
  );
}
