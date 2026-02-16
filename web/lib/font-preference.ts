export type FontOption = 'atkinson' | 'system-sans' | 'classic-serif'

export const DEFAULT_FONT_PREFERENCE: FontOption = 'atkinson'

export const FONT_FAMILIES: Record<FontOption, string> = {
  atkinson: '"Atkinson Hyperlegible Next", Georgia, "Times New Roman", Times, serif',
  'system-sans': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
  'classic-serif': 'Georgia, "Times New Roman", Times, serif',
}
