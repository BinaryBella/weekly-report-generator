/**
 * Applies the saved theme before first paint to avoid a light/dark flash.
 * Rendered as the first child of <body> in the root layout. Keep the logic in
 * sync with `theme-preference.tsx` (same storage key, same resolution rule).
 */
export function ThemeInit() {
  const script = `(function(){try{var t=localStorage.getItem('wrg-theme')||'system';var m=window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',t==='dark'||(t==='system'&&m));}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
