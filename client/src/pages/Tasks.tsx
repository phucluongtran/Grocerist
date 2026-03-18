import { useEffect, useState } from 'react';
import { CheckSquare, Square } from 'lucide-react';
import api from '../lib/api';

interface Task {
  id: string;
  label: string;
  done: boolean;
}

const STATIC_TASKS: Omit<Task, 'done'>[] = [
  { id: 'static-1', label: 'Review slow-moving items and consider promotions' },
  { id: 'static-2', label: 'Reconcile inventory counts with purchase orders' },
  { id: 'static-3', label: 'Update product pricing for next month' },
];

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    api.get('/alerts').then((r) => {
      const alertTasks: Task[] = (r.data.low_stock ?? []).map((a: { name: string }) => ({
        id: `restock-${a.name}`,
        label: `Restock "${a.name}"`,
        done: false,
      }));
      const staticTasks: Task[] = STATIC_TASKS.map((t) => ({ ...t, done: false }));
      setTasks([...alertTasks, ...staticTasks]);
    });
  }, []);

  function toggleTask(id: string) {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  }

  const pending = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
        <span className="text-sm text-gray-500">{pending.length} remaining</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {pending.length === 0 && done.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-10">No tasks</p>
        )}

        {pending.map((task) => (
          <div key={task.id} className="flex items-center gap-3 px-4 py-3">
            <button onClick={() => toggleTask(task.id)} className="text-gray-400 hover:text-green-600 transition-colors flex-shrink-0">
              <Square size={18} />
            </button>
            <span className="text-sm text-gray-900">{task.label}</span>
          </div>
        ))}

        {done.map((task) => (
          <div key={task.id} className="flex items-center gap-3 px-4 py-3 opacity-50">
            <button onClick={() => toggleTask(task.id)} className="text-green-600 flex-shrink-0">
              <CheckSquare size={18} />
            </button>
            <span className="text-sm text-gray-500 line-through">{task.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
