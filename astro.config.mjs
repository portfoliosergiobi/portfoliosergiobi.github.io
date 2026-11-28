// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://portfoliosergiobi.github.io',
  trailingSlash: 'ignore',
  devToolbar: { enabled: false },
  // El proyecto se llamaba «La hora barata»: el enlace antiguo sigue funcionando.
  redirects: { "/proyectos/la-hora-barata": "/proyectos/la-hora-lavadora" },
});
