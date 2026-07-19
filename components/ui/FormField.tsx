import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  className?: string;
  error?: string;
}

export default function FormField({
  label,
  children,
  className,
  error,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
