import { useRef, useState } from 'react';
import { Upload, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import api from '../lib/api';
import { cn } from '../lib/utils';

interface ImportResult {
  imported: number;
  skipped: number;
  total: number;
}

interface TableConfig {
  key: string;
  label: string;
  endpoint: string;
  description: string;
  columns: string;
  example: string;
}

const TABLES: TableConfig[] = [
  {
    key: 'products',
    label: 'Products',
    endpoint: '/import/products',
    description: 'Import your product catalog. Products with duplicate SKUs will be updated.',
    columns: 'name (required), price (required), category, sku, unit',
    example: 'name,price,category,sku,unit\nMilk,2.99,Dairy,SKU001,litre\nBread,1.50,Bakery,SKU002,each',
  },
  {
    key: 'inventory',
    label: 'Inventory / Stock',
    endpoint: '/import/inventory',
    description: 'Set stock levels. Products must exist first (import Products before Inventory).',
    columns: 'name or sku (required), quantity (required), low_stock_threshold',
    example: 'name,quantity,low_stock_threshold\nMilk,50,10\nBread,30,5',
  },
  {
    key: 'customers',
    label: 'Customers',
    endpoint: '/import/customers',
    description: 'Import your customer list.',
    columns: 'name (required), email, phone, notes',
    example: 'name,email,phone,notes\nJohn Smith,john@email.com,555-1234,Regular\nJane Doe,jane@email.com,,',
  },
  {
    key: 'sales',
    label: 'Sales History',
    endpoint: '/import/sales',
    description: 'Import past sales. Products must exist first. If date is omitted, today is used.',
    columns: 'name or sku (required), quantity (required), sale_price (required), date',
    example: 'name,quantity,sale_price,date\nMilk,3,2.99,2026-03-01\nBread,5,1.50,2026-03-02',
  },
];

interface TableState {
  file: File | null;
  loading: boolean;
  result: ImportResult | null;
  error: string | null;
}

export default function Import() {
  const [states, setStates] = useState<Record<string, TableState>>(
    Object.fromEntries(TABLES.map((t) => [t.key, { file: null, loading: false, result: null, error: null }]))
  );
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  function setTableState(key: string, patch: Partial<TableState>) {
    setStates((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  function handleFileChange(key: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setTableState(key, { file, result: null, error: null });
  }

  async function handleImport(table: TableConfig) {
    const state = states[table.key];
    if (!state.file) return;
    setTableState(table.key, { loading: true, result: null, error: null });
    try {
      const form = new FormData();
      form.append('file', state.file);
      const r = await api.post(table.endpoint, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setTableState(table.key, { loading: false, result: r.data, file: null });
      if (inputRefs.current[table.key]) inputRefs.current[table.key]!.value = '';
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Import failed';
      setTableState(table.key, { loading: false, error: msg });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Import from CSV</h2>
        <p className="text-sm text-gray-500 mt-1">
          Upload CSV files to bulk-import data. Column names are flexible — common variations are recognized automatically.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>Recommended import order:</strong> Products → Inventory → Sales → Customers
      </div>

      <div className="grid grid-cols-1 gap-6">
        {TABLES.map((table) => {
          const state = states[table.key];
          return (
            <div key={table.key} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{table.label}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{table.description}</p>
                </div>
              </div>

              {/* Column hint */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs font-medium text-gray-600 mb-1">Expected columns:</p>
                <p className="text-xs text-gray-500 font-mono">{table.columns}</p>
                <details className="mt-2">
                  <summary className="text-xs text-blue-600 cursor-pointer hover:underline flex items-center gap-1">
                    <FileText size={12} /> Show example CSV
                  </summary>
                  <pre className="text-xs text-gray-600 mt-2 bg-white border border-gray-200 rounded p-2 overflow-x-auto">{table.example}</pre>
                </details>
              </div>

              {/* Upload area */}
              <div
                className={cn(
                  'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
                  state.file ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-gray-400'
                )}
                onClick={() => inputRefs.current[table.key]?.click()}
              >
                <input
                  ref={(el) => { inputRefs.current[table.key] = el; }}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => handleFileChange(table.key, e)}
                />
                <Upload size={20} className={cn('mx-auto mb-2', state.file ? 'text-green-500' : 'text-gray-400')} />
                {state.file ? (
                  <p className="text-sm font-medium text-green-700">{state.file.name}</p>
                ) : (
                  <p className="text-sm text-gray-500">Click to select a CSV file</p>
                )}
              </div>

              {/* Actions & Results */}
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={() => handleImport(table)}
                  disabled={!state.file || state.loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-40 transition-colors"
                >
                  {state.loading ? 'Importing…' : 'Import'}
                </button>

                {state.result && (
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle2 size={16} />
                    <span>
                      <strong>{state.result.imported}</strong> imported
                      {state.result.skipped > 0 && <span className="text-amber-600">, {state.result.skipped} skipped</span>}
                      {' '}of {state.result.total} rows
                    </span>
                  </div>
                )}

                {state.error && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle size={16} /> {state.error}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
