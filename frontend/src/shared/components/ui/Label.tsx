import React from 'react';
import { cn } from '@/shared/utils/cn';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    // Primitivo reutilizable: cada consumidor asocia su control mediante `htmlFor`
    // a través de {...props} (p. ej. <Label htmlFor="email">), por lo que la
    // asociación no es verificable estáticamente en esta definición.
    <label ref={ref} className={cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ml-1', className)} {...props} /> // NOSONAR: S6853 asociación provista por el consumidor vía htmlFor
  )
);

Label.displayName = 'Label';
