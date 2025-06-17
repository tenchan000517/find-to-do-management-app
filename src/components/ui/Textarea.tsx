import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'default' | 'error';
  textareaSize?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

const textareaVariants = {
  default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
  error: 'border-red-500 focus:border-red-500 focus:ring-red-500',
};

const textareaSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-3 py-2',
  lg: 'px-4 py-3 text-lg',
};

const resizeClasses = {
  none: 'resize-none',
  vertical: 'resize-y',
  horizontal: 'resize-x',
  both: 'resize',
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    variant = 'default', 
    textareaSize = 'md', 
    fullWidth = true, 
    resize = 'vertical',
    rows = 4,
    ...props 
  }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          'rounded-md border transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-opacity-50',
          'placeholder:text-gray-400',
          'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
          textareaVariants[variant],
          textareaSizes[textareaSize],
          resizeClasses[resize],
          fullWidth ? 'w-full' : '',
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';