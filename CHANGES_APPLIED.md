git commit -m "Fix: normalize inputs, type Timestamp, atomic reserve transactions, UI label updates"
Resumo das alterações aplicadas — consorcio2
Data: 2026-03-12

Visão geral
-----------
Este arquivo registra as alterações feitas durante a sessão de revisão e implementação. Contém melhorias de tipos, utilitários de normalização, correções transacionais para reserva de cartas, atualização de rótulos de UI e instruções rápidas para verificar e enviar as mudanças.

Arquivos alterados / adicionados
--------------------------------
- `types.ts`
  - Alterado `createdAt` para `Timestamp | null` em `Simulation` e `UserProfile`.

- `utils/normalizers.ts` (novo)
  - Adicionadas funções `normalizeEmail(email)` e `normalizePhone(phone)`.

- `components/SimulatorForm.tsx`
  - Usa `normalizeEmail` e `normalizePhone` antes de salvar `simulations`.
  - Salva o email normalizado em `localStorage` como `last_simulation_email`.

- `components/AuthModal.tsx`
  - Usa `normalizeEmail` nas consultas e na criação do documento `users`.
  - Garante criação de `users` com email normalizado em login com Google e cadastro.

- `components/ContemplatedLetters.tsx`
  - Substituída atualização direta por `runTransaction` para reservar cartas de forma atômica (evita race conditions).
  - Mensagens básicas ao usuário em caso de falha na reserva.

- `components/Navbar.tsx`
  - Rótulo do menu alterado: `Contemplados` → `Cartas Contempladas` (desktop e mobile).

- `pages/Home.tsx`
  - Card em destaque: `Contemplados` → `Cartas Contempladas`.

Observações / justificativa
--------------------------
- Tipar `createdAt` como `Timestamp` melhora a correção dos tipos e evita `any`. Ao renderizar, converta para `Date` com `createdAt?.toDate()`.
- Normalizar email/telefone garante consultas consistentes e permite linkar simulações órfãs corretamente.
- Usar `runTransaction` evita que duas pessoas reservem a mesma carta simultaneamente.

Verificação rápida
------------------
1. Instale dependências e verifique TypeScript:

```bash
npm install
npx tsc --noEmit
```

2. Execute o servidor de desenvolvimento e teste os fluxos:

```bash
npm run dev
# abra http://localhost:5173 (ou a porta exibida) e teste:
# - Enviar simulação (ver coleção `simulations` no Firestore)
# - Cadastrar/logar via modal de Auth (ver coleção `users` criada)
# - Reservar uma carta (ver mudança de `status` em `contemplated_letters`)
# - Abrir Painel Admin e confirmar leitura das coleções
```

3. Se a coleção `users` estiver vazia (usuários só em Auth), execute o script de migração (requer service account JSON do Firebase):

```bash
npm install firebase-admin
node scripts/migrate-auth-to-firestore.js "C:\caminho\para\serviceAccountKey.json"
```

Commit & push sugerido
----------------------
Se quiser que eu faça o commit e push, o comando sugerido é:

```bash
git add -A
git commit -m "Corrige: normaliza entradas, tipa createdAt, transações de reserva e rótulos UI"
git push origin main
```

Próximas tarefas recomendadas
----------------------------
- Revisar regras de segurança do Firestore: restringir escrita em `contemplated_letters` apenas a administradores.
- Implementar Cloud Function `auth.onCreate` para criar automaticamente o documento `users` quando uma conta Auth for criada.
- Criar índices compostos para queries que usam `where('userId')` + `orderBy('createdAt')` (console Firebase sugere índices quando necessário).

Quer que eu faça o commit/push agora e gere um PR?