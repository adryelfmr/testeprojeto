import { defineConfig } from "vite";

export default defineConfig({
  base: "/projetoeng/", // Substitua pelo nome do seu repositório
  build: {
    target: "esnext",
    outDir: "dist", // Pasta onde o Vite colocará os arquivos gerados
  },
});
