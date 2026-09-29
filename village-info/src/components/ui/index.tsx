import React from 'react';
import { Loader2 } from 'lucide-react';

// ─── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary', size = 'md', loading, children, disabled, className = '', ...props
}) => {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';
  const variants = {
    primary: 'bg-[#7B1D1D] text-white hover:bg-[#9B2C2C] focus:ring-[#7B1D1D] shadow-sm hover:shadow-md',
    secondary: 'bg-[#FEF3E2] text-[#7B1D1D] border border-[#E8D5A3] hover:bg-[#F5E6C8] focus:ring-[#B7791F]',
    danger: 'bg-red-700 text-white hover:bg-red-800 focus:ring-red-600 shadow-sm',
    success: 'bg-emerald-700 text-white hover:bg-emerald-800 focus:ring-emerald-600 shadow-sm',
    ghost: 'bg-transparent text-[#7B1D1D] hover:bg-[#FEF3E2] focus:ring-[#B7791F]',
    gold: 'bg-[#B7791F] text-white hover:bg-[#D69E2E] focus:ring-[#B7791F] shadow-sm hover:shadow-md',
  };
  const sizes = { sm: 'px-3 py-1.5 text-xs gap-1.5', md: 'px-4 py-2 text-sm gap-2', lg: 'px-6 py-3 text-base gap-2' };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="animate-spin h-3.5 w-3.5" />}
      {children}
    </button>
  );
};

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}
export const Input: React.FC<InputProps> = ({ label, error, icon, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="block text-xs font-semibold text-[#4A2C0A] mb-1.5 uppercase tracking-wide">{label}</label>}
    <div className="relative">
      {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B7791F]">{icon}</span>}
      <input
        className={`w-full px-3 py-2.5 border rounded-lg text-sm bg-white text-[#2D2D2D] placeholder-[#B7791F]/50 focus:outline-none focus:ring-2 focus:ring-[#B7791F]/40 focus:border-[#B7791F] transition-colors ${error ? 'border-red-400 bg-red-50' : 'border-[#E8D5A3] hover:border-[#B7791F]/60'} ${icon ? 'pl-9' : ''} ${className}`}
        {...props}
      />
    </div>
    {error && <p className="mt-1 text-xs text-red-600 flex items-center gap-1">⚠ {error}</p>}
  </div>
);

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}
export const Select: React.FC<SelectProps> = ({ label, error, options, placeholder, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="block text-xs font-semibold text-[#4A2C0A] mb-1.5 uppercase tracking-wide">{label}</label>}
    <select
      className={`w-full px-3 py-2.5 border rounded-lg text-sm bg-white text-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#B7791F]/40 focus:border-[#B7791F] transition-colors cursor-pointer ${error ? 'border-red-400' : 'border-[#E8D5A3] hover:border-[#B7791F]/60'} ${className}`}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {error && <p className="mt-1 text-xs text-red-600">⚠ {error}</p>}
  </div>
);

// ─── Spinner ──────────────────────────────────────────────────────────────────
export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const s = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return <Loader2 className={`animate-spin ${s[size]} text-[#7B1D1D]`} />;
};

// ─── Badge ────────────────────────────────────────────────────────────────────
interface BadgeProps { label: string; variant?: 'success' | 'danger' | 'warning' | 'info' | 'gray' }
export const Badge: React.FC<BadgeProps> = ({ label, variant = 'gray' }) => {
  const variants = {
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    danger: 'bg-red-50 text-red-800 border border-red-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    info: 'bg-blue-50 text-blue-800 border border-blue-200',
    gray: 'bg-[#F5E6C8] text-[#4A2C0A] border border-[#E8D5A3]',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {label}
    </span>
  );
};

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl' }
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-[#2D2D2D]/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] overflow-y-auto border border-[#E8D5A3]`}>
        {/* Modal header with pattern */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8D5A3] bg-gradient-to-r from-[#FFFBF5] to-[#FEF3E2]">
          <h3 className="text-base font-bold text-[#7B1D1D] font-devanagari">{title}</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full text-[#B7791F] hover:bg-[#F5E6C8] transition-colors text-lg leading-none" aria-label="Close">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

// ─── ConfirmDialog ────────────────────────────────────────────────────────────
interface ConfirmProps { isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmLabel?: string; variant?: 'danger' | 'warning' }
export const ConfirmDialog: React.FC<ConfirmProps> = ({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', variant = 'danger' }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <p className="text-sm text-[#4A2C0A] mb-5 leading-relaxed">{message}</p>
    <div className="flex gap-2 justify-end">
      <Button variant="secondary" onClick={onClose}>रद्द करें</Button>
      <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
    </div>
  </Modal>
);

// ─── Pagination ───────────────────────────────────────────────────────────────
interface PaginationProps { page: number; totalPages: number; totalCount: number; pageSize: number; onPageChange: (p: number) => void }
export const Pagination: React.FC<PaginationProps> = ({ page, totalPages, totalCount, pageSize, onPageChange }) => (
  <div className="flex items-center justify-between px-4 py-3 border-t border-[#E8D5A3] bg-[#FFFBF5]">
    <p className="text-xs text-[#6B3F1A]">
      {Math.min((page - 1) * pageSize + 1, totalCount)}–{Math.min(page * pageSize, totalCount)} / {totalCount}
    </p>
    <div className="flex gap-1">
      <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}
        className="px-3 py-1.5 text-xs border border-[#E8D5A3] rounded-lg disabled:opacity-40 hover:bg-[#F5E6C8] text-[#7B1D1D] transition-colors">‹</button>
      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
        return p <= totalPages ? (
          <button key={p} onClick={() => onPageChange(p)}
            className={`px-3 py-1.5 text-xs border rounded-lg transition-colors ${p === page ? 'bg-[#7B1D1D] text-white border-[#7B1D1D]' : 'border-[#E8D5A3] hover:bg-[#F5E6C8] text-[#7B1D1D]'}`}>{p}</button>
        ) : null;
      })}
      <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
        className="px-3 py-1.5 text-xs border border-[#E8D5A3] rounded-lg disabled:opacity-40 hover:bg-[#F5E6C8] text-[#7B1D1D] transition-colors">›</button>
    </div>
  </div>
);

// ─── Card ─────────────────────────────────────────────────────────────────────
export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-[#E8D5A3] ${className}`}>{children}</div>
);

// ─── StatCard ─────────────────────────────────────────────────────────────────
interface StatCardProps { title: string; value: number | string; icon: React.ReactNode; gradient?: string; trend?: string }
export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, gradient = 'from-[#7B1D1D] to-[#C05621]', trend }) => (
  <div className={`relative overflow-hidden rounded-xl p-5 bg-gradient-to-br ${gradient} text-white shadow-md card-hover`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium opacity-80 uppercase tracking-wide mb-1">{title}</p>
        <p className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString('hi-IN') : value}</p>
        {trend && <p className="text-xs opacity-70 mt-1">{trend}</p>}
      </div>
      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
        {icon}
      </div>
    </div>
    {/* Decorative circle */}
    <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
    <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-white/5 rounded-full" />
  </div>
);

// ─── EmptyState ───────────────────────────────────────────────────────────────
interface EmptyStateProps { message: string; description?: string; action?: React.ReactNode; icon?: React.ReactNode }
export const EmptyState: React.FC<EmptyStateProps> = ({ message, description, action, icon }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-16 h-16 bg-[#FEF3E2] rounded-full flex items-center justify-center mb-4 text-3xl">
      {icon || '🔍'}
    </div>
    <p className="text-base font-semibold text-[#4A2C0A] mb-1">{message}</p>
    {description && <p className="text-sm text-[#6B3F1A]/70 mb-4 max-w-xs">{description}</p>}
    {action}
  </div>
);

// ─── LoadingOverlay ───────────────────────────────────────────────────────────
export const LoadingOverlay: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <Spinner size="lg" />
    <p className="text-sm text-[#6B3F1A] animate-pulse">लोड हो रहा है...</p>
  </div>
);

// ─── SkeletonRow ──────────────────────────────────────────────────────────────
export const SkeletonRow: React.FC<{ cols?: number }> = ({ cols = 5 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="skeleton h-4 rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
      </td>
    ))}
  </tr>
);

// ─── Table ────────────────────────────────────────────────────────────────────
interface Column<T> { key: string; header: string; render?: (row: T) => React.ReactNode; sortable?: boolean }
interface TableProps<T> { columns: Column<T>[]; data: T[]; loading?: boolean; emptyMessage?: string; onSort?: (key: string) => void; sortBy?: string; sortDesc?: boolean }
export function Table<T extends Record<string, unknown>>({ columns, data, loading, emptyMessage = 'No data', onSort, sortBy, sortDesc }: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gradient-to-r from-[#7B1D1D] to-[#9B2C2C]">
            {columns.map((col) => (
              <th key={col.key}
                className={`px-4 py-3 text-left text-xs font-semibold text-white/90 uppercase tracking-wide whitespace-nowrap ${col.sortable ? 'cursor-pointer hover:text-white select-none' : ''}`}
                onClick={() => col.sortable && onSort?.(col.key)}>
                <span className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && sortBy === col.key && <span className="text-[#F6AD55]">{sortDesc ? '↓' : '↑'}</span>}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F5E6C8]">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={columns.length} />)
          ) : data.length === 0 ? (
            <tr><td colSpan={columns.length}><EmptyState message={emptyMessage} /></td></tr>
          ) : (
            data.map((row, i) => (
              <tr key={i} className={`transition-colors hover:bg-[#FFFBF5] ${i % 2 === 0 ? 'bg-white' : 'bg-[#FFFBF5]/50'}`}>
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-[#2D2D2D]">
                    {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── PageHeader ───────────────────────────────────────────────────────────────
interface PageHeaderProps { title: string; subtitle?: string; action?: React.ReactNode }
export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between mb-6">
    <div>
      <h1 className="text-xl font-bold text-[#7B1D1D] font-devanagari">{title}</h1>
      {subtitle && <p className="text-sm text-[#6B3F1A]/70 mt-0.5">{subtitle}</p>}
    </div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </div>
);

// ─── SectionDivider ───────────────────────────────────────────────────────────
export const SectionDivider: React.FC<{ label?: string }> = ({ label }) => (
  <div className="flex items-center gap-3 my-4">
    <div className="flex-1 pattern-border" />
    {label && <span className="text-xs font-semibold text-[#B7791F] uppercase tracking-widest px-2">{label}</span>}
    <div className="flex-1 pattern-border" />
  </div>
);
