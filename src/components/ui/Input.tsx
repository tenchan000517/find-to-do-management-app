import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'error';
  inputSize?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const inputVariants = {
  default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
  error: 'border-red-500 focus:border-red-500 focus:ring-red-500',
};

const inputSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-3 py-2',
  lg: 'px-4 py-3 text-lg',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = 'default', inputSize = 'md', fullWidth = true, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'rounded-md border transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-opacity-50',
          'placeholder:text-gray-400',
          'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
          inputVariants[variant],
          inputSizes[inputSize],
          fullWidth ? 'w-full' : '',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';