/**
 * Inline validation message rendered directly beneath its input. Give it the
 * same `id` you point the input's `aria-describedby` at so assistive tech reads
 * the two together.
 */
export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-sm font-medium text-destructive">
      {message}
    </p>
  );
}
