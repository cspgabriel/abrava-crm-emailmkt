Importar planilha para as cartas do sistema
=========================================

Passos rápidos:

- Instale dependências: `npm install` (ou `pnpm`/`yarn`).
- Forneça credenciais de serviço (service account JSON) apontando `GOOGLE_APPLICATION_CREDENTIALS` ou `SERVICE_ACCOUNT` para o arquivo JSON.
- Rode o comando informando o caminho do arquivo Excel:

```
npm run import:letters -- ./path/para/planilha.xlsx
```

Opções:
- `--sheet <nome>`: usar outra aba da planilha (opcional).

O que o script faz:
- Lê a primeira aba (ou a aba indicada) da planilha.
- Mapeia colunas pelo cabeçalho (ex.: `id`, `code`, `name`, `category`, `credit`, `entry`, `installmentsCount`, `installmentValue`, `transferFee`, `saldoDevedor`, `group`, `administrator`, `status`, `reajusteIndex`, `contactPhone`, `contactEmail`, `observations`, `insurance`).
- Apaga todos os documentos existentes na coleção `contemplated_letters` e insere as linhas da planilha como novos documentos.

Avisos:
- Faça backup antes de rodar — o script apaga os dados atuais.
- O script usa `firebase-admin` e requer permissões de escrita no projeto Firestore.
