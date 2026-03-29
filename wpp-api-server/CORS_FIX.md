# CORS Configuration Fix

## Problema
O servidor WPP estava retornando erro 502 e bloqueando requisições CORS com a mensagem:
```
Access-Control-Allow-Origin header is missing
```

## Causa
A configuração de CORS estava usando um array diretamente no Express, o que não funciona:
```javascript
app.use(cors({ origin: TRUSTED_ORIGINS })); // ❌ ERRADO
```

## Solução
Usar uma **função callback** para validar origins dinamicamente:
```javascript
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || TRUSTED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-API-Key', 'Authorization']
}));
```

## Origens Aceitas
- `https://abravacom.com.br` (produção)
- `http://localhost:3000` (desenvolvimento)
- `http://localhost:3001` (CRM frontend)
- `http://localhost:5173` (Vite dev)

## Como Ativar
1. Parar o servidor: `Ctrl+C`
2. Reiniciar: `npm start`

## Resultado Esperado
✅ Requisições CORS serão aceitas com headers corretos
✅ QR Code visual será carregado
✅ Status de conexão funcionará
