# Beethoven — site de demonstração

Site de uma página para o atelier de balayage do Beethoven (LABOR B, Porto), com marcação e pagamento online simulados. Todo em português (PT).

## Abrir

Site estático, sem build. Os ficheiros estão em `beethoven/` e usam caminhos absolutos (`/beethoven/...`), porque o site vive em **https://innoweb.agency/beethoven**. Para ver localmente, sirva a raiz do repositório:

```bash
python -m http.server 5173
# http://127.0.0.1:5173/beethoven/
```

As fontes vêm do Google Fonts, por isso é preciso internet.

## Publicação

- Projeto Vercel próprio, ligado a este repositório; o `vercel.json` serve o site em `/beethoven`.
- O site da agência (repositório `innoweb-agency`) encaminha `innoweb.agency/beethoven` para este projeto através de um rewrite em `next.config.js`.

## Estrutura

| Ficheiro | Conteúdo |
|---|---|
| `beethoven/index.html` | Todas as secções do site + overlay de marcação |
| `beethoven/js/data.js` | **Serviços, preços, durações, horário, avaliações.** Edite aqui. |
| `beethoven/js/main.js` | Animações e interações (scroll suave, manifesto, cartões empilhados, rituais, gráfico da sessão, galeria, percurso) |
| `beethoven/js/booking.js` | Fluxo de marcação: serviços → profissional → hora → confirmar e pagar |
| `beethoven/css/` | Estilos do site e da marcação |
| `beethoven/assets/img`, `beethoven/assets/video` | Fotos do Beethoven (Fresha + site pessoal), já otimizadas em WebP |
| `beethoven/assets/vendor` | GSAP, ScrollTrigger e Lenis (locais, sem CDN) |

## Marcação (demo)

Nada é enviado nem cobrado; tudo corre no browser.

- A disponibilidade é gerada por dia (fixa para cada data) e respeita o horário real do atelier e a duração dos serviços escolhidos.
- O passo de pagamento **aceita qualquer coisa**: pode deixar campos vazios ou escrever o que quiser, e a marcação é sempre confirmada. Não há avisos de erro.
- Pagamento: sinal de 30% ou valor total. Métodos: cartão (cartão animado que vira ao escrever o CVC), MB WAY (contagem decrescente que confirma sozinha ao fim de ~5 s) ou Apple/Google Pay.
- Botão "Preencher com dados de teste" para apresentações.
- **Qualquer código promocional** dá 10% de desconto.
- No fim gera uma referência, um recibo e um ficheiro `.ics` para o calendário.

A linha "Modo de demonstração: não é feita nenhuma cobrança real" no passo de pagamento evita que um cliente real pense que marcou de verdade. Pode ser removida em `beethoven/js/booking.js` (procure `bk-secure`) antes de uma apresentação privada.

## A confirmar com o cliente

- **Política de cancelamento** (24 h) e **sinal de 30%** são valores de exemplo.
- **Vídeos:** o Instagram exige login, por isso os vídeos em `beethoven/assets/video/` foram montados a partir das fotos do portfólio. Para usar Reels reais, substitua `reel-wide.mp4` (16:9, desktop), `reel-tall.mp4` (9:16, móvel) e `reel-pill.mp4` (pequeno, no título) mantendo os nomes.
- As legendas da galeria (ex.: "Loiro bege") foram escritas a partir das fotos.
- A avaliação da Fanny F. foi traduzida do inglês e está assinalada no site.
