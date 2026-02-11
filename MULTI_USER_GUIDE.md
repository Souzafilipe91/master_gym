# Guia Multi-Usuário - Master Gym

## Como Compartilhar o App com Outros Usuários

O **Master Gym** está totalmente preparado para suportar múltiplos usuários com isolamento completo de dados. Cada pessoa que criar uma conta terá seu próprio espaço privado com treinos, progresso e conquistas independentes.

---

## 🔐 Sistema de Autenticação

O app utiliza **Manus OAuth**, que oferece:

- **Login com Google**: Autenticação rápida usando conta Google
- **Login com GitHub**: Para desenvolvedores e usuários técnicos
- **Login com Email**: Opção tradicional com email e senha
- **Sessões seguras**: Cookies HTTP-only com JWT para máxima segurança

---

## 👥 Como Outros Usuários Podem Acessar

### 1. **Publique o App**

Antes de compartilhar, você precisa publicar o app:

1. Clique no botão **"Publish"** no canto superior direito da interface de gerenciamento
2. O app ficará disponível publicamente na URL gerada (ex: `https://seu-app.manus.space`)
3. Você pode configurar um domínio personalizado nas configurações

### 2. **Compartilhe o Link**

Depois de publicado, compartilhe o link público com outras pessoas:

- Via WhatsApp, email, redes sociais
- Adicione o link em materiais de marketing
- Use QR codes para facilitar o acesso mobile

### 3. **Novo Usuário Cria Conta**

Quando alguém acessar o link:

1. Verá a **tela de boas-vindas** com informações sobre o programa
2. Clicará em **"Entrar na Plataforma"**
3. Será redirecionado para a página de login do Manus OAuth
4. Poderá escolher entre **Google**, **GitHub** ou **Email** para criar conta
5. Após autenticação, será criado automaticamente no sistema

---

## 🔒 Isolamento de Dados

O sistema garante que cada usuário veja apenas seus próprios dados:

### Dados Isolados por Usuário

- ✅ **Treinos realizados** (`workoutLogs`)
- ✅ **Logs de exercícios** (`exerciseLogs`)
- ✅ **Peso corporal** (`weightLogs`)
- ✅ **Cardio** (`cardioLogs`)
- ✅ **Anamnese** (`anamneses`)
- ✅ **Conquistas desbloqueadas** (`userAchievements`)
- ✅ **Peso atual** (`user.currentWeight`)

### Dados Compartilhados (Somente Leitura)

- 📖 **Ciclos de treino** (`cycles`)
- 📖 **Tipos de treino** (A, B, C, D)
- 📖 **Exercícios** (`exercises`)
- 📖 **Grupos musculares** (`muscleGroups`)
- 📖 **Lista de conquistas** (`achievements`)

---

## 🛡️ Segurança Implementada

### Rotas Protegidas

Todas as operações sensíveis usam `protectedProcedure`, que:

- Verifica se o usuário está autenticado
- Injeta `ctx.user` com os dados do usuário logado
- Retorna erro 401 (Unauthorized) se não autenticado

### Queries Filtradas

Todas as queries de dados do usuário incluem filtro por `userId`:

```typescript
// Exemplo: buscar treinos do usuário
db.select()
  .from(workoutLogs)
  .where(eq(workoutLogs.userId, ctx.user.id))
```

Isso garante que **nenhum usuário consiga acessar dados de outro**.

---

## 📊 Gerenciamento de Usuários

### Como Administrador

Você (dono do app) tem acesso especial:

- **Painel de Gerenciamento**: Acesso completo ao banco de dados via UI
- **Analytics**: Visualize número de usuários ativos, treinos realizados, etc.
- **Notificações**: Receba alertas quando novos usuários se cadastrarem (opcional)

### Verificar Usuários Cadastrados

Acesse o **painel de Database** na interface de gerenciamento e consulte a tabela `user`:

```sql
SELECT id, name, email, loginMethod, createdAt, lastSignedIn 
FROM user 
ORDER BY createdAt DESC;
```

---

## 🎯 Casos de Uso

### Personal Trainer com Múltiplos Alunos

1. Publique o app com seu programa de treino
2. Compartilhe o link com seus alunos
3. Cada aluno cria sua conta e segue o programa
4. Você pode acompanhar o progresso via banco de dados

### Academia ou Box

1. Configure o programa de treino da academia
2. Coloque o link em cartazes ou QR codes
3. Alunos acessam e acompanham seus treinos
4. Sistema escalável para centenas de usuários

### Programa Online

1. Venda acesso ao programa de treino
2. Envie o link após pagamento confirmado
3. Cliente cria conta e acessa imediatamente
4. Sem necessidade de gerenciar senhas ou cadastros manuais

---

## ⚙️ Configurações Avançadas

### Domínio Personalizado

Para profissionalizar ainda mais:

1. Acesse **Settings > Domains** na interface de gerenciamento
2. Configure um domínio próprio (ex: `app.seusite.com`)
3. Siga as instruções de configuração DNS
4. Seu app ficará acessível no domínio personalizado

### Personalização Visual

Edite os seguintes arquivos para personalizar:

- **Logo**: Substitua em `client/public/logo.png`
- **Nome do App**: Altere `VITE_APP_TITLE` nas variáveis de ambiente
- **Cores**: Modifique `client/src/index.css` (seção de cores CSS)
- **Texto de Boas-Vindas**: Edite `client/src/pages/Home.tsx`

---

## 🚀 Próximos Passos

Após publicar e compartilhar:

1. **Monitore o uso**: Acompanhe quantos usuários estão se cadastrando
2. **Colete feedback**: Pergunte aos usuários sobre melhorias
3. **Adicione funcionalidades**: Sistema de pagamento, chat, etc.
4. **Escale**: O sistema suporta milhares de usuários simultâneos

---

## 📞 Suporte

Se tiver dúvidas sobre multi-usuário ou publicação:

- Consulte a documentação do Manus em https://docs.manus.im
- Entre em contato via https://help.manus.im

---

**Última atualização**: Fevereiro 2026
