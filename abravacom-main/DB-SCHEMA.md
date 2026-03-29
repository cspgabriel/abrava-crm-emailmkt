# Estrutura proposta do Firestore

Coleções principais e campos sugeridos:

- `users` (document ID = `uid`)
  - `uid` (string)
  - `email` (string, lowercase)
  - `displayName` (string)
  - `role` (string) — e.g. `client`, `admin`
  - `createdAt` (timestamp)

- `simulations` (auto-id)
  - `userId` (string | null) — referência ao `users.uid` quando disponível
  - `userEmail` (string) — email do lead, sempre salvo em lowercase
  - `userName` (string)
  - `userPhone` (string)
  - `type` (string) — tipo de consórcio
  - `creditAmount` (number)
  - `acceptWhatsApp` (boolean)
  - `status` (string) — e.g. `pending`, `approved`, `rejected`
  - `createdAt` (timestamp)

- `contemplated_letters` (auto-id)
  - `userId` (string | null)
  - `administrator` (string)
  - `category` (string)
  - `credit` (number)
  - `status` (string)
  - `createdAt` (timestamp)

- `consorcios` (auto-id)
  - `name` (string)
  - `administrator` (string)
  - `terms` (object)
  - `createdAt` (timestamp)

Observações e migração
- Firestore é schemaless; coleções são criadas no primeiro write.
- Para usuários que simulam antes de criar conta, a aplicação salva `userEmail` na simulação. Ao criar a conta, `AuthModal` executa ligação (link) procurando por `userEmail` e atualizando `userId`.
- Se o comportamento de link falhar por regras de segurança, verifique as regras do Firestore e permissões de escrita/leitura para docs com `userId == null`.
- Recomenda-se índices compostos quando fizer queries com `where('userId','==', ...)` + `orderBy('createdAt')` — o console do Firebase sugere criação automática quando necessário.

Como usar este arquivo
- Este documento é referência para desenvolver regras, scripts de seed/migração e contratos de API entre frontend/backend.
