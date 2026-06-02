export interface CategoryDefinition {
  id: string
  name: string
  description: string
  terms: string[]
}

export const BUILT_IN_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'adult',
    name: 'Adult Content',
    description: 'Pornographic and explicit adult content',
    terms: [
      'pornhub', 'xvideos', 'xhamster', 'xnxx', 'redtube', 'youporn',
      'brazzers', 'bangbros', 'realitykings', 'naughtyamerica',
      'chaturbate', 'stripchat', 'cam4', 'myfreecams', 'bongacams',
      'onlyfans', 'fansly', 'manyvids',
      'porn', 'hentai', 'xxx', 'nsfw', 'rule34',
      'spankbang', 'eporner', 'tnaflix', 'tube8',
      'motherless', 'heavy-r', 'efukt',
    ],
  },
  {
    id: 'gambling',
    name: 'Gambling',
    description: 'Online gambling and betting sites',
    terms: [
      'bet365', 'draftkings', 'fanduel', 'betway', 'pokerstars',
      'casino', 'slots', 'roulette', 'blackjack', 'sportsbet',
      'bovada', 'betonline', '888casino', 'betmgm', 'caesars',
      'gambling', 'sportsbetting', 'parlay',
    ],
  },
  {
    id: 'social_media',
    name: 'Social Media',
    description: 'Social media time-wasters',
    terms: [
      'instagram', 'tiktok', 'twitter', 'x.com', 'facebook',
      'reddit', 'snapchat', 'threads', 'tumblr', 'pinterest',
    ],
  },
  {
    id: 'gaming',
    name: 'Gaming',
    description: 'Gaming sites and platforms',
    terms: [
      'twitch', 'steam', 'epicgames', 'roblox', 'minecraft',
      'leagueoflegends', 'valorant', 'fortnite', 'apex',
    ],
  },
  {
    id: 'streaming',
    name: 'Streaming',
    description: 'Video streaming services',
    terms: [
      'netflix', 'youtube', 'hulu', 'disneyplus', 'hbomax',
      'primevideo', 'crunchyroll', 'peacock',
    ],
  },
  {
    id: 'self_harm',
    name: 'Self-Harm / Crisis',
    description: 'Content related to self-harm (redirects to crisis resources)',
    terms: [
      'suicide methods', 'how to kill myself', 'self harm',
      'cutting methods', 'overdose how to', 'want to die',
    ],
  },
]

export function getCategoryTerms(categoryId: string): string[] {
  return BUILT_IN_CATEGORIES.find(c => c.id === categoryId)?.terms ?? []
}

export function getAllCategories(): CategoryDefinition[] {
  return BUILT_IN_CATEGORIES
}
