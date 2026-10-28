# Sistema de Chamados — NestJS + Prisma + MySQL

API REST para registrar e acompanhar chamados de suporte: pessoas (solicitantes e
técnicos), tipos de problema, chamados e comentários.

Fluxo: `Cliente (HTTP) → Controller → Service → Prisma → MySQL`

## Pré-requisitos

- Node.js 22+
- MySQL rodando em `localhost:3306` (nesta máquina: serviço **MySQL84**)

> O tutorial original sobe o MySQL com Docker. Aqui o Docker não está instalado,
> então usamos o MySQL local já existente.

## Configuração

1. Edite o `.env` com a senha do seu MySQL:

   ```
   DATABASE_URL="mysql://root:SUA_SENHA@localhost:3306/chamados"
   ```

2. Crie a tabela e gere o client:

   ```bash
   npx prisma migrate dev --name inicial
   npx prisma generate
   ```

   `migrate dev` cria o banco `chamados` (se não existir) e todas as tabelas.

3. Rode:

   ```bash
   npm run start:dev
   ```

Dica: `npx prisma studio` abre uma interface visual do banco.

## Modelo de dados

- **Pessoa** — `nome`, `email` (único), `tipo` (SOLICITANTE | TECNICO), `ativo`
- **TipoProblema** — `nome` (único), `ativo`
- **Chamado** — `titulo`, `descricao`, `prioridade`, `situacao`, `solicitante`,
  `tecnico` (opcional), `tipoProblema`, `criadoEm`, `resolvidoEm`
- **Comentario** — `texto`, `autor`, `chamado`, `criadoEm`

Prioridade: `BAIXA | MEDIA | ALTA | CRITICA` (padrão `MEDIA`).
Situação: `ABERTO → EM_ATENDIMENTO → RESOLVIDO → FECHADO`, com `RESOLVIDO →
EM_ATENDIMENTO` (reabrir) e `ABERTO | EM_ATENDIMENTO → CANCELADO`.

## Rotas

### Pessoas

| Método | Rota           | Ação                                             |
| ------ | -------------- | ------------------------------------------------ |
| POST   | /pessoas       | Cadastra pessoa (`nome`, `email`, `tipo`)        |
| GET    | /pessoas       | Lista pessoas                                    |
| GET    | /pessoas/:id   | Busca uma pessoa                                 |
| PATCH  | /pessoas/:id   | Atualiza `nome` e/ou `ativo` (ativar/desativar)  |
| DELETE | /pessoas/:id   | Remove — bloqueado se já envolvida em chamados   |

### Tipos de problema

| Método | Rota                 | Ação                                            |
| ------ | -------------------- | ----------------------------------------------- |
| POST   | /tipos-problema      | Cadastra tipo (`nome`)                          |
| GET    | /tipos-problema      | Lista tipos                                     |
| GET    | /tipos-problema/:id  | Busca um tipo                                   |
| PATCH  | /tipos-problema/:id  | Atualiza `nome` e/ou `ativo`                    |
| DELETE | /tipos-problema/:id  | Remove — bloqueado se já usado em chamados      |

### Chamados

| Método | Rota                    | Ação                                          |
| ------ | ----------------------- | --------------------------------------------- |
| POST   | /chamados               | Abre chamado                                  |
| GET    | /chamados               | Lista (filtros abaixo)                        |
| GET    | /chamados/:id           | Vê o chamado com toda a conversa              |
| PATCH  | /chamados/:id/tecnico   | Designa técnico (inicia o atendimento)        |
| PATCH  | /chamados/:id/situacao  | Muda a situação (respeitando as transições)   |

Filtros de `GET /chamados` (query string, combináveis):
`?situacao=ABERTO&prioridade=ALTA&tipoProblemaId=1&tecnicoId=2`

Corpo de `POST /chamados`:

```json
{
  "titulo": "Impressora não imprime",
  "descricao": "A impressora do 2º andar não responde desde cedo",
  "prioridade": "ALTA",
  "solicitanteId": 1,
  "tipoProblemaId": 1
}
```

### Comentários

| Método | Rota                             | Ação                              |
| ------ | -------------------------------- | --------------------------------- |
| POST   | /chamados/:id/comentarios        | Comenta (`autorId`, `texto`)      |
| GET    | /chamados/:id/comentarios        | Lista os comentários do chamado   |

Comentários não podem ser editados nem apagados (fazem parte do histórico).

## Regras de negócio implementadas

| #  | Regra                                                                 | Onde |
| -- | --------------------------------------------------------------------- | ---- |
| 1  | E-mail único e válido                                                  | `pessoas.service` + DTO |
| 2  | Pessoa é SOLICITANTE ou TECNICO                                        | enum `TipoPessoa` |
| 3  | Inativo não abre, não é designado, não comenta                        | chamados/comentarios service |
| 4  | Pessoa já envolvida não é removida, só desativada                     | `pessoas.service.remover` |
| 5  | Nome do tipo é único                                                   | `tipos-problema.service` |
| 6  | Não abre chamado em tipo desativado                                   | `chamados.service.abrir` |
| 7  | Tipo já usado não é removido, só desativado                          | `tipos-problema.service.remover` |
| 8  | Chamado nasce ABERTO e sem técnico                                    | schema `@default` |
| 9  | Quem abre é solicitante ativo                                        | `chamados.service.abrir` |
| 10 | Título 5–100, descrição ≥ 10                                         | `abrir-chamado.dto` |
| 11 | Prioridade padrão MEDIA                                               | schema `@default(MEDIA)` |
| 12 | Só técnico ativo é designado                                         | `designarTecnico` |
| 13 | Designar técnico a chamado aberto inicia o atendimento               | `designarTecnico` |
| 14 | Transições de situação válidas apenas                               | mapa `TRANSICOES` |
| 15 | Chamado encerrado não muda nem recebe comentário                    | chamados/comentarios service |
| 16 | Momento da resolução registrado                                     | `resolvidoEm` |
| 17 | Técnico com no máximo 5 chamados em atendimento                     | `designarTecnico` |
| 18 | Ninguém atende o próprio chamado                                    | `designarTecnico` |
| 19 | Só solicitante e técnico responsável comentam                       | `comentarios.service` |
| 20 | Comentário não vazio                                                 | `criar-comentario.dto` |
| 21 | Comentário imutável (sem editar/apagar)                             | sem rotas de update/delete |
