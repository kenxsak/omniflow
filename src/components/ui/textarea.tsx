import * as React from 'react';

import {cn} from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({className, ...props}, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2.5 text-base',
          'ring-offset-background transition-all duration-200',
          'placeholder:text-muted-foreground/60',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:border-primary',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50',
          'hover:border-muted-foreground/30',
          'resize-y',
          'scrollbar-thin',
          'sm:text-sm sm:min-h-[80px]',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export {Textarea};
