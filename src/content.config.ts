import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const homeSchema = z.object({
  nav: z.object({
    home: z.string(),
    projects: z.string(),
    experience: z.string(),
    allwork: z.string(),
    contact: z.string(),
  }),
  hero: z.object({
    subtitle: z.string(),
    bio: z.string(),
    cta: z.string(),
    contact: z.string(),
    download_cv: z.string(),
  }),
  projects_section: z.object({
    title: z.string(),
    subtitle: z.string(),
    view_all: z.string(),
  }),
  experience_section: z.object({
    title: z.string(),
    subtitle: z.string(),
  }),
  about_section: z.object({
    title: z.string(),
    p1: z.string(),
    p2: z.string(),
    stats: z.object({
      years: z.string(),
      commitment: z.string(),
    }),
  }),
  skills_section: z.object({
    title: z.string(),
    view_more: z.string(),
    view_less: z.string(),
    categories: z.object({
      code: z.string(),
      frontend: z.string(),
      backend: z.string(),
      mobile: z.string(),
      databases: z.string(),
      devopsTools: z.string(),
      design: z.string(),
      animationAndVideo: z.string(),
      gaming: z.string(),
    }),
    view_more_tooltip: z.string(),
    view_less_tooltip: z.string(),
  }),
  contact_section: z.object({
    title: z.string(),
    desc: z.string(),
    labels: z.object({
      name: z.string(),
      email: z.string(),
      phone: z.string(),
      message: z.string(),
    }),
    placeholders: z.object({
      name: z.string(),
      email: z.string(),
      phone: z.string(),
      message: z.string(),
    }),
    form_help: z.string(),
    submit_btn: z.string(),
    success_msg: z.string(),
    error_msg: z.string(),
    submit_btn_tooltip: z.string(),
  }),
  footer: z.object({
    rights: z.string(),
  }),
  // Free-form: ~29 accessibility strings, looked up by key rather than
  // destructured, so a record keeps this resilient to additions.
  accessibility: z.record(z.string(), z.string()),
  common: z.object({
    view_project: z.string(),
    repository: z.string(),
    coming_soon_title: z.string(),
    coming_soon: z.string(),
  }),
});

const projectSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  image: z.string(),
  tags: z.array(z.string()),
  githubUrl: z.string(),
  liveUrl: z.string(),
  featured: z.boolean(),
});

const experienceSchema = z.object({
  date: z.string(),
  title: z.string(),
  logo: z.string().optional(),
  logoWide: z.boolean().optional(),
  logoDark: z.boolean().optional(),
  logoLight: z.boolean().optional(),
  desc: z.string(),
  links: z.array(z.object({ url: z.string(), label: z.string() })).optional(),
});

const i18n = defineCollection({
  // Default id generation slugifies away dots (en.cav.json -> "encav"), but
  // "en.cav" / "es.cav" are meaningful locale ids here, so keep the filename
  // stem verbatim instead.
  loader: glob({
    pattern: '*.json',
    base: './src/content/i18n',
    generateId: ({ entry }) => entry.replace(/\.json$/, ''),
  }),
  schema: z.object({
    home: homeSchema,
    projects: z.array(projectSchema),
    experience: z.array(experienceSchema),
  }),
});

export const collections = { i18n };
