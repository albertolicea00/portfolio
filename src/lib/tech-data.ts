export const TECH_NAMES: Record<string, string> = {
  html: 'HTML',
  css: 'CSS',
  english: 'English',
  spanish: 'Español',
  csharp: 'C#',
  'react-native': 'React Native',
  'android-studio': 'Android Studio',
  nodejs: 'Node.js',
  mariadb: 'MariaDB',
  mssql: 'MS SQL',
  postgresql: 'PostgreSQL',
  mysql: 'MySQL',
  mongodb: 'MongoDB',
  sqlite: 'SQLite',
  aws: 'AWS',
  php: 'PHP',
  sql: 'SQL',
  livewire: 'Livewire',
  tailwind: 'Tailwind CSS',
  sass: 'Sass',
  vue: 'Vue.js',
  react: 'React',
  svelte: 'Svelte',
  astro: 'Astro',
  alpine: 'Alpine.js',
  django: 'Django',
  flask: 'Flask',
  express: 'Express.js',
  laravel: 'Laravel',
  firebase: 'Firebase',
  cordova: 'Cordova',
  xcode: 'Xcode',
  docker: 'Docker',
  azure: 'Azure',
  jenkins: 'Jenkins',
  git: 'Git',
  postman: 'Postman',
  linux: 'Linux',
  figma: 'Figma',
  procreate: 'Procreate',
  krita: 'Krita',
  canva: 'Canva',
  photoshop: 'Photoshop',
  illustrator: 'Illustrator',
  coreldraw: 'CorelDRAW',
  blender: 'Blender',
  autograph: 'Autograph',
  'premiere-pro': 'Premiere Pro',
  'after-effects': 'After Effects',
  unity: 'Unity',
  'unreal-engine': 'Unreal Engine',
  pygame: 'Pygame',
  renpy: "Ren'Py",
  python: 'Python',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  swift: 'Swift',
  kotlin: 'Kotlin',
  java: 'Java',
  bash: 'Bash',
};

export interface TechCategory {
  id: string;
  i18n: string;
  label: string;
  items: string[];
}

export const TECH_CATEGORIES: TechCategory[] = [
  { id: 'code', i18n: 'home.skills_section.categories.code', label: 'Programming & Languages', items: ['english', 'spanish', 'python', 'javascript', 'html', 'css', 'typescript', 'swift', 'kotlin', 'java', 'php', 'csharp', 'sql', 'bash'] },
  { id: 'frontend', i18n: 'home.skills_section.categories.frontend', label: 'Frontend', items: ['react', 'vue', 'svelte', 'astro', 'alpine', 'livewire', 'tailwind', 'sass', 'bootstrap'] },
  { id: 'backend', i18n: 'home.skills_section.categories.backend', label: 'Backend', items: ['django', 'flask', 'nodejs', 'express', 'laravel', 'firebase'] },
  { id: 'mobile', i18n: 'home.skills_section.categories.mobile', label: 'Mobile', items: ['react-native', 'cordova', 'android-studio', 'xcode'] },
  { id: 'databases', i18n: 'home.skills_section.categories.databases', label: 'Databases', items: ['postgresql', 'mysql', 'mongodb', 'sqlite', 'mariadb', 'mssql'] },
  { id: 'devopsTools', i18n: 'home.skills_section.categories.devopsTools', label: 'DevOps & Tools', items: ['docker', 'aws', 'azure', 'jenkins', 'git', 'postman', 'linux'] },
  { id: 'design', i18n: 'home.skills_section.categories.design', label: 'Design', items: ['figma', 'procreate', 'krita', 'canva', 'photoshop', 'illustrator', 'coreldraw'] },
  { id: 'animationAndVideo', i18n: 'home.skills_section.categories.animationAndVideo', label: 'Animation & Video', items: ['blender', 'autograph', 'premiere-pro', 'after-effects'] },
  { id: 'gaming', i18n: 'home.skills_section.categories.gaming', label: 'Gaming', items: ['unity', 'unreal-engine', 'pygame', 'renpy'] },
];

export function formatTechName(key: string): string {
  return TECH_NAMES[key] || key.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export const EXPERIENCE_START_DATE = { year: 2019, month: 0, day: 1 };

export function getCompletedYearsSince({ year, month, day }: { year: number; month: number; day: number }): number {
  const now = new Date();
  let years = now.getFullYear() - year;
  const hasReachedAnniversary = now.getMonth() > month || (now.getMonth() === month && now.getDate() >= day);
  if (!hasReachedAnniversary) years -= 1;
  return Math.max(0, years);
}
