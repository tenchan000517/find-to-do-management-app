import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  variant?: 'default' | 'error';
  selectSize?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  placeholder?: string;
}

const selectVariants = {
  default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
  error: 'border-red-500 focus:border-red-500 focus:ring-red-500',
};

const selectSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-3 py-2',
  lg: 'px-4 py-3 text-lg',
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, variant = 'default', selectSize = 'md', fullWidth = true, placeholder, children, ...props }, ref) => {
    return (
      <div className={cn('relative', fullWidth ? 'w-full' : '')}>
        <select
          ref={ref}
          className={cn(
            'appearance-none rounded-md border transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-opacity-50',
            'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
            'pr-10', // Space for chevron icon
            selectVariants[variant],
            selectSizes[selectSize],
            fullWidth ? 'w-full' : '',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
    );
  }
);

Select.displayName = 'Select';

// Option component for consistency
export const SelectOption = forwardRef<HTMLOptionElement, React.OptionHTMLAttributes<HTMLOptionElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <option
        ref={ref}
        className={cn('text-gray-900 bg-white', className)}
        {...props}
      >
        {children}
      </option>
    );
  }
);

SelectOption.displayName = 'SelectOption';