/**
 * Icon asset loaders
 * Dynamically imports SVG icons from the icons directory
 */

const icons = import.meta.glob<string>('./*.svg', {
  query: '?raw',
  import: 'default',
});

export async function getIcon(name: string): Promise<string> {
  const icon = icons[`./${name}.svg`];
  if (!icon) {
    console.warn(`Icon not found: ${name}`);
    return '';
  }
  return await icon();
}

export function getIconUrl(name: string): string {
  return new URL(`./${name}.svg`, import.meta.url).href;
}
