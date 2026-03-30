# Filipe Treinos - TODO List

## Funcionalidades Principais

### Autenticação e Perfil
- [x] Sistema de autenticação com Manus OAuth
- [x] Perfil de usuário exibindo nome completo (Filipe Pimenta de Souza)
- [x] Exibir peso atual (83kg) no perfil
- [x] Permitir atualização de peso corporal

### Dashboard Principal
- [x] Dashboard mostrando visão geral dos treinos da semana atual
- [x] Exibir ciclo atual do programa anual
- [x] Mostrar próximo treino agendado
- [x] Resumo de treinos completados na semana

### Biblioteca de Exercícios
- [x] Biblioteca completa de exercícios
- [x] Filtros por grupo muscular (peito, costas, pernas, ombro)
- [x] Visualização detalhada de cada exercício
- [ ] Imagens/vídeos de demonstração (opcional)

### Visualização de Treinos
- [x] Visualização detalhada do Treino A (Peito e Tríceps)
- [x] Visualização detalhada do Treino B (Costas e Bíceps)
- [x] Visualização detalhada do Treino C (Membros Inferiores)
- [x] Visualização detalhada do Treino D (Ombro, Trapézio e Abdome)
- [x] Exibir exercícios, séries, repetições e técnicas

### Sistema de Progressão de Carga
- [x] Progressão automática de carga a cada 2-3 semanas
- [x] Cálculo de cargas baseado no peso inicial e progressão
- [ ] Ajuste manual de cargas quando necessário
- [ ] Histórico de progressão por exercício

### Programa Anual (4 Ciclos)
- [x] Ciclo 1: Hipertrofia com Força (Semanas 1-12)
- [x] Ciclo 2: Hipertrofia Máxima (Semanas 13-24)
- [x] Ciclo 3: Força e Definição (Semanas 25-36)
- [x] Ciclo 4: Definição com Força (Semanas 37-52)
- [ ] Navegação entre ciclos
- [x] Visualização de objetivos e foco de cada ciclo

### Registro de Treinos
- [x] Registrar treino realizado com data
- [ ] Marcar exercícios como completos
- [ ] Registrar cargas utilizadas por série
- [ ] Registrar repetições executadas por série
- [ ] Adicionar notas/observações ao treino

### Histórico e Progresso
- [x] Histórico completo de treinos realizados
- [ ] Filtrar histórico por período
- [ ] Filtrar histórico por tipo de treino (A, B, C, D)
- [ ] Exportar histórico (opcional)

### Gráficos de Progresso
- [ ] Gráfico de evolução de força por exercício
- [x] Gráfico de evolução de peso corporal
- [ ] Gráfico de volume total de treino
- [x] Gráfico de frequência semanal

### Seção de Cardio
- [x] Recomendações de cardio por ciclo
- [x] Frequência semanal recomendada
- [x] Duração recomendada
- [x] Intensidade recomendada (LISS/HIIT)
- [x] Registro de sessões de cardio realizadas

### Design e UX
- [x] Design system preto e vermelho
- [x] Layout responsivo para desktop
- [x] Layout responsivo para tablet
- [x] Layout responsivo para mobile
- [x] Navegação intuitiva
- [x] Loading states apropriados
- [x] Error states apropriados
- [x] Empty states apropriados

### Dados Iniciais
- [x] Popular banco de dados com programa de 1 ano
- [x] Popular biblioteca de exercícios
- [x] Configurar dados iniciais do usuário Filipe


## Novas Funcionalidades Solicitadas

### Menu Lateral (Sidebar)
- [x] Criar sidebar estilo Ramon Dino com navegação organizada
- [x] Seções: Dashboard, Meus Treinos, Biblioteca, Anamnese, Progresso, Histórico
- [x] Menu colasável para mobile
- [x] Indicador visual da página atual

### Seção de Anamnese
- [x] Página dedicada mostrando anamnese completa do usuário
- [x] Exibir todas as informações do Check Shape
- [x] Layout organizado e fácil de ler
- [ ] Permitir edição da anamnese

### Formulário de Anamnese para Novos Usuários
- [x] Formulário completo de anamnese
- [x] Campos: dados pessoais, objetivos, histórico de treino, restrições, medidas
- [x] Validação de campos obrigatórios
- [x] Salvar anamnese no banco de dados

### Gerador de Treinos com IA
- [x] Integrar LLM para análise de anamnese
- [x] Criar endpoint para gerar treino personalizado
- [x] Interface para solicitar geração de treino
- [x] Exibir treino gerado com opção de salvar
- [ ] Histórico de treinos gerados por IA


## Bugs Reportados

- [x] Corrigir query anamnese.getMy retornando undefined em vez de null quando usuário não tem anamnese


## Melhorias de UX Solicitadas

- [x] Criar página "Meus Treinos" com os 4 treinos (A, B, C, D)
- [x] Simplificar Dashboard mantendo apenas card do ciclo atual
- [x] Remover seção de treinos do Dashboard

- [x] Criar barra superior (header) mobile com botão de menu
- [x] Remover botão flutuante que sobrepõe conteúdo
- [x] Adicionar logo e informações do usuário no header mobile

- [x] Ajustar padding-top do sidebar mobile para não sobrepor com header

## Funcionalidades de Edição

- [x] Criar modal de edição de peso corporal do usuário
- [x] Implementar backend (tRPC) para atualizar peso do usuário
- [x] Adicionar botão de edição no perfil da sidebar
- [x] Permitir ajuste manual de cargas dos exercícios
- [ ] Salvar cargas personalizadas no banco de dados (estado local por enquanto)


## GIFs Demonstrativos de Exercícios

- [x] Adicionar campo gifUrl na tabela exercises
- [x] Buscar e adicionar URLs de GIFs para todos os exercícios (14 exercícios com GIFs)
- [x] Exibir GIF na página de detalhes do treino (lazy loading)
- [x] Criar modal expandido para visualização ampliada do GIF
- [ ] Adicionar instruções de execução junto com o GIF
-- [x] Adicionar GIFs para os exercícios restantes (46 exercícios no total)
- [x] Buscar e adicionar GIFs para os 36 exercícios restantes
- [x] Corrigir URLs de GIFs que não estão sendo exibidos (abdominal infra, prancha)
- [x] Verificar que todos os GIFs carregam corretamente


## PWA (Progressive Web App)

- [x] Criar manifest.json com configurações do app
- [x] Gerar ícones em todos os tamanhos (192x192, 512x512)
- [x] Implementar Service Worker para cache offline
- [x] Adicionar meta tags específicas para iOS
- [x] Registrar Service Worker no main.tsx
- [ ] Testar instalação no iPhone (requer teste do usuário)


## Notificações Push

- [x] Implementar solicitação de permissão de notificações
- [x] Criar sistema de agendamento de lembretes de treino
- [x] Adicionar configurações de notificações no Dashboard
- [ ] Testar notificações no iPhone (requer teste do usuário)

## Modo Offline Completo

- [x] Expandir Service Worker para cachear dados de treinos
- [x] Implementar IndexedDB para armazenamento local
- [x] Criar fila de sincronização para ações offline
- [x] Sincronização automática quando voltar online
- [x] Indicador visual de status online/offline

- [x] Corrigir loop de redirecionamento entre tela de login e aplicação (resolvido)
- [x] Corrigir GIFs dos exercícios que não estão sendo exibidos

- [x] Corrigir erro de API retornando HTML em vez de JSON na página /treino/A

## Próximas Funcionalidades a Implementar

- [x] Implementar modo de execução de treino passo a passo
- [x] Adicionar timer de descanso entre séries
- [x] Permitir registro de cargas utilizadas durante o treino
- [x] Criar página de Conquistas (Badges)
- [x] Implementar lógica de desbloqueio automático de conquistas
- [x] Adicionar conquistas: 7 dias consecutivos, 50 treinos, etc.

## Verificação Multi-Usuário

- [x] Verificar isolamento de dados entre usuários
- [x] Testar criação de conta e login de novo usuário
- [x] Documentar como compartilhar o app

## Bug Reportado

- [x] Corrigir GIFs dos exercícios não carregando (aparecem ícones de interrogação)

- [x] Corrigir erro 404 ao clicar no botão "Iniciar Treino"

## Novas Funcionalidades Solicitadas

- [x] Implementar vibração háptica no mobile (completar série, descanso, conquistas)
- [x] Adicionar modo fullscreen durante execução de treino
- [x] Criar widget de progresso semanal no Dashboard
- [x] Implementar widget para tela bloqueada (Lock Screen Widget)

## Novas Funcionalidades - Flexibilidade no Treino

- [x] Adicionar botão de pular exercício
- [x] Criar modal/drawer com lista completa de exercícios do treino
- [x] Permitir navegação livre entre exercícios (saltar para qualquer um)

## Nova Funcionalidade - Encerrar Treino Antecipadamente

- [x] Adicionar botão de encerrar treino antecipadamente
- [x] Implementar confirmação antes de encerrar
- [x] Salvar treino parcial como completo no histórico

## Persistência de Treino em Andamento

- [x] Salvar estado do treino em localStorage automaticamente
- [x] Restaurar estado ao voltar para página de execução
- [x] Limpar estado salvo ao encerrar ou finalizar treino

## Bug Reportado

- [x] Botões de "Pular Exercício" e "Encerrar Treino" não aparecem na tela mobile

## Correções Solicitadas

- [x] Corrigir ícone do app que sumiu
- [ ] Gerar ilustrações com IA para 46 exercícios (10/46 completas)
- [ ] Fazer upload das ilustrações para S3 (10/46 completas)
- [ ] Atualizar banco de dados com URLs das ilustrações (10/46 completas)
- [ ] Garantir que GIFs funcionem offline

## Bug Crítico Reportado

- [x] Corrigir erro de query na tabela user_achievements ao salvar treino

## Remover Funcionalidade de GIFs

- [x] Remover campo gifUrl do schema de exercises
- [x] Atualizar componentes para usar apenas placeholders
- [x] Limpar código e arquivos relacionados a GIFs

## Melhorias de UX Solicitadas

- [x] Adicionar histórico de última execução inline durante treino
- [x] Implementar botões de ajuste rápido de carga (+2.5kg/-2.5kg)
- [x] Criar indicador visual de progresso por exercício com círculos

## Novas Funcionalidades Solicitadas

- [x] Criar página de gráficos de evolução de carga por exercício
- [x] Implementar calculadora de 1RM (1 Repetição Máxima)
- [x] Integrar calculadora no fluxo de treino
- [x] Adicionar link de Evolução no menu principal

## Melhorias Solicitadas (Mar 2026)

- [x] Corrigir fuso horário: dia registrado no treino está sempre 1 dia antes do real
- [x] Iniciar pesos dos exercícios em 0 (usuário digita a carga atual a cada treino)
- [x] Adicionar configuração de tempo de descanso nas configurações gerais (válido para todos os treinos)
- [x] Notificação push quando descanso termina e tela está bloqueada

## Melhorias Adicionais (Mar 2026 - v2)

- [x] Mostrar tempo de descanso ativo na tela do treino (configuração pessoal vs programa)
- [x] Histórico de cargas inline: mostrar últimos 3 valores ao editar peso
- [x] Alerta de PR: detectar e celebrar quando supera peso máximo registrado
- [x] Aba "Personalização" no menu com seletor de tema
- [x] Tema pré-definido: Branco e Azul Claro
- [x] Tema pré-definido: Preto e Vermelho (atual)
- [x] Tema pré-definido: Roxo e Verde (EVA Unit 1)
- [x] Personalização completa: seletor de cor com círculo cromático
- [x] Corrigir ícone do app que parou de aparecer
- [x] Corrigir personalização customizada — usuário não consegue alterar cores

## Novas Funcionalidades — Calistenia e Copiar Treino

- [x] Criar página Calistenia com gerador de treino em casa via IA baseado na anamnese
- [x] Criar backend: rota tRPC generateCalisthenicsWorkout
- [x] Criar página Copiar Treino com input de URL de vídeo (YouTube)
- [x] Criar backend: rota tRPC copyWorkoutFromVideo que analisa vídeo e gera treino
- [x] Adicionar links no menu lateral para Calistenia e Copiar Treino
- [x] Escrever testes para as novas rotas

## Melhorias — Salvar Treinos, Histórico, Calistenia Executável e Correções

- [x] Corrigir sistema de personalização de cores (não aplica corretamente)
- [x] Remover aba de Progresso Semanal do menu e da Home
- [x] Salvar treinos gerados pela Calistenia no perfil do usuário
- [x] Salvar treinos adaptados pelo Copiar Treino no perfil do usuário
- [x] Histórico de treinos copiados (nome do atleta, data, link do vídeo)
- [x] Execução de treino de calistenia com timer de descanso e registro de séries

## Bug — Personalização de Cores

- [x] Corrigir definitivamente: cores customizadas não são aplicadas visualmente no app
