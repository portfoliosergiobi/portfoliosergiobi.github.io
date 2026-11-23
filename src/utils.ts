import { getCollection, type CollectionEntry } from 'astro:content';

// Los borradores se ven en local (npm run dev) pero nunca se publican.
export const visible = ({ data }: { data: { borrador: boolean } }) =>
  import.meta.env.PROD ? !data.borrador : true;

export async function proyectosOrdenados(): Promise<CollectionEntry<'proyectos'>[]> {
  return (await getCollection('proyectos', visible)).sort((a, b) => a.data.orden - b.data.orden);
}

export const dos = (n: number) => String(n).padStart(2, '0');
