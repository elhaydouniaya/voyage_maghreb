import { defineConfig } from '@prisma/cli';

export default defineConfig({
  datasource: {
    provider: 'postgresql',
    url: 'postgresql://postgres:aya123@localhost:5432/maghrebVoyage',
  },
});