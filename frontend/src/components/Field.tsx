import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "../lib/cn";

const control = "w-full rounded-2xl border border-leaf-200 bg-white px-4 text-leaf-900 outline-none transition placeholder:text-leaf-900/35 focus:border-leaf-500 focus:ring-4 focus:ring-leaf-200/60";

function Wrapper({ id, label, hint, icon, children }: { id: string; label: ReactNode; hint?: ReactNode; icon?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <div className="relative">
        {icon && <span className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-leaf-900/40">{icon}</span>}
        {children}
      </div>
      {hint && <p className="mt-1 text-xs text-leaf-900/50">{hint}</p>}
    </div>
  );
}

export function TextField({ label, hint, icon, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; hint?: ReactNode; icon?: ReactNode }) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} hint={hint} icon={icon}>
      <input id={id} className={cn(control, "h-12", icon && "ps-11", className)} {...rest} />
    </Wrapper>
  );
}

export function SelectField({ label, hint, children, className, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { label: ReactNode; hint?: ReactNode }) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} hint={hint}>
      <select id={id} className={cn(control, "h-12", className)} {...rest}>
        {children}
      </select>
    </Wrapper>
  );
}

export function TextAreaField({ label, hint, className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: ReactNode; hint?: ReactNode }) {
  const id = useId();
  return (
    <Wrapper id={id} label={label} hint={hint}>
      <textarea id={id} rows={3} className={cn(control, "py-3", className)} {...rest} />
    </Wrapper>
  );
}
