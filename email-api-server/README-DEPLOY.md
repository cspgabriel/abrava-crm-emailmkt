
Deploy rápido (Cloud Run)

Recomendações e opções de CLI para envio de e-mails:

- Para o envio com Google Workspace CLI (recomendado sem necessidade de projeto pago): instale globalmente a ferramenta:

```powershell
npm install -g @googleworkspace/cli
```

- A instalação global disponibiliza o comando `gws` no PATH e dispensa usar `npx`. O servidor foi atualizado para preferir `gws` e usar `npx gws` como fallback quando `gws` não estiver disponível.

Requisitos para deploy (Cloud Run):
- `gcloud` instalado e no PATH (somente para deploy no Cloud Run)
- Permissões no projeto GCP

Passos para deploy no Cloud Run (opcional):

1) Autenticar e selecionar projeto (se for usar Cloud Run):

```powershell
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

2) Ajustar variável `X_API_KEY` no `env`/Secret do Cloud Run se necessário

3) Rodar o script de deploy (substitua PROJECT_ID/REGION):

```powershell
cd email-api-server
.\deploy-cloud-run.ps1 -PROJECT_ID "my-gcp-project" -REGION "us-central1"
```

Observações:
- O script usa `gcloud builds submit` para construir e empurrar a imagem para `gcr.io/<PROJECT_ID>/email-api-server` e depois chama `gcloud run deploy`.
- Se preferir, use GitHub Actions ou outro CI para criar a imagem e executar o deploy.
