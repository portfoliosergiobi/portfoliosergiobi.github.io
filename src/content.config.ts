import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const proyectos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/proyectos' }),
  schema: z.object({
    titulo: z.string(),
    resumen: z.string(),
    area: z.string(),
    anio: z.number(),
    orden: z.number(),
    captura: z.string(),
    informe: z.object({ url: z.string().url(), titulo: z.string() }).optional(),
    frase: z.string().optional(),
    cadena: z.array(z.string()).default([]),
    credito: z.string().optional(),
    borrador: z.boolean().default(false),
  }),
});

export const collections = { proyectos };
