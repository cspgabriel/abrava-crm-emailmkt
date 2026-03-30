Guia rápido: Deploy para GitHub Pages

1) Ajuste do `base` (opcional mas recomendado)
- Se este repositório for um "Project Page" (ex.: https://<user>.github.io/<repo>), abra `vite.config.ts` e defina `base: '/REPO_NAME/'` (substitua `REPO_NAME`).

2) Como funciona o workflow
- O workflow `.github/workflows/deploy-gh-pages.yml` roda em push para `main` e também manualmente (workflow_dispatch).
- Ele executa `npm ci`, `npm run build` (gera `dist`) e publica `dist` no branch `gh-pages` usando o token automático do GitHub.

3) Passos para ativar
- Certifique-se de que o repositório remoto está configurado e você tem permissão para push.
- Ajuste `vite.config.ts` `base` se necessário.
- Commit e push para `main`:

```bash
git add .
git commit -m "chore: add GitHub Actions deploy to Pages"
git push origin main
```

- O Actions irá rodar e criar/atualizar o branch `gh-pages` com os arquivos estáticos.

4) Configurar GitHub Pages (na interface do GitHub)
- Vá em Settings → Pages e selecione o branch `gh-pages` (pasta `/`). Salve.

5) Observações
- Se você usa um domínio custom, adicione `CNAME` ao `dist` via workflow ou gerencie no painel do GitHub Pages.
- Se preferir deploy por outra ferramenta (Vercel, Netlify), siga os guias correspondentes.
