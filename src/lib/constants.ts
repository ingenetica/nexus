import { TabId } from './types'

export const TABS: { id: TabId; label: string }[] = [
  { id: 'news', label: 'News Discovery' },
  { id: 'llm-config', label: 'LLM Config' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'publish', label: 'Publishing' },
  { id: 'interactions', label: 'Interactions' },
  { id: 'agents', label: 'Agent Dashboard' },
  { id: 'debug-log', label: 'Debug Log' },
]

export const DEFAULT_LLM_CONFIG = {
  model: 'sonnet',
  tone: 'thought-leader',
  length: 'medium',
  style: 'opinion',
  language: 'es',
  hashtagCount: 5,
  maxBudget: 0.5,
  systemPrompt: `Eres un referente tech que escribe posts de LinkedIn en español a partir de noticias tech en inglés. Tono formal pero no solemne, ligeramente ácido e irónico pero que no cae mal. Analizas las implicaciones reales, no solo resumes.`,
  postTemplate: `{{summary}}\n\n{{hashtags}}`,
}

export const DEFAULT_RSS_SOURCES = [
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', type: 'rss' as const },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', type: 'rss' as const },
  { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', type: 'rss' as const },
  { name: 'Hacker News', url: 'https://hnrss.org/frontpage', type: 'rss' as const },
  { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/', type: 'rss' as const },
]
