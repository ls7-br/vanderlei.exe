# Vanderlei.exe: O Match do Século

Site de namoro **100% humorístico**, feito como pegadinha entre amigos adultos (+18) para o
**Vanderlei Lopes** ([@vand2017](https://www.instagram.com/vand2017)).

HTML, CSS e JavaScript puros, sem build. Publicado pelo GitHub Pages a partir da branch `main`.

## O que tem
- **Loading cinematográfico**: faixas pretas de cinema, granulado, chuva de corações vetoriais, coração com
  eletrocardiograma, título digitado ("O amor que você tanto esperou está carregando…"), frases irônicas, barra de
  progresso que engasga e hesita em 99%. A foto da jacuzzi aparece desfocada no fundo, vai entrando em foco e é
  revelada no final com o letreiro "Vanderlei Lopes".
- **Vídeo no scroll**: o vídeo do carro foi quebrado em quadros e toca conforme a pessoa rola a página, com
  legendas de trailer, marcador REC e barra de progresso. Depois disso aparece o site normal.
- **Página principal**: retrato com fotos que se revezam (cada uma com um "modo"), contadores falsos, notificações
  inventadas, card do Instagram, ficha técnica, green e red flags, galeria polaroid, comparativo, avaliações,
  botão "Não" que foge e termos absurdos.
- **Quiz de inscrição** em 10 etapas, com bloqueio para menores de 18, veredito e certificado. Respostas vão
  para o Google Sheets.
- **Cofre secreto** no rodapé: um controle de videogame na tela (funciona no celular). O código
  cima, cima, baixo, baixo, esquerda, direita, esquerda, direita, B, A libera duas fotos secretas na galeria.
  No computador, o mesmo código digitado no teclado também funciona.
- **Detalhes**: ícones da biblioteca Lucide (sem emojis), cursor de coração com rastro de corações, barra de
  progresso de leitura no topo e barra de rolagem nas cores do site.

## Estrutura
```
index.html                  marcação (inclui o sprite de ícones Lucide)
css/style.css               visual e animações
js/config.js                configuração: planilha, fotos, fotos secretas, vídeo
js/app.js                   loading, vídeo no scroll, efeitos, cofre, quiz e envio
fonts/                      fontes locais (Abril Fatface, Poppins, Dancing Script)
img/                        fotos em WebP (nome-480.webp e nome-900.webp)
img/frames/lg e sm/         quadros do vídeo (computador e celular)
google-apps-script/Code.gs  receptor das respostas no Google Sheets
```

## Rodar localmente
```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

## Fotos
Cada foto existe em duas larguras: `img/nome-480.webp` e `img/nome-900.webp`. Em `js/config.js` você informa só o
começo do nome (ex.: `img/vand-carro`).

- `ABERTURA_FOTO`: foto revelada no final do loading.
- `RETRATO`: fotos que se revezam na moldura do topo, com selo e ícone.
- `FOTOS`: polaroids da galeria.
- `SECRETAS`: fotos liberadas pelo cofre. Enquanto o arquivo não existir, o espaço mostra o texto `emBreve`.

Para adicionar uma foto nova (exemplo: a do Sr. Burns), gere as duas larguras com Python e Pillow:
```bash
python3 -c "
from PIL import Image
im = Image.open('foto.jpg').convert('RGB')
for w in (480, 900):
    r = im if im.width <= w else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    r.save(f'img/vand-sr-burns-{w}.webp', 'WEBP', quality=74, method=6)
"
```

## Vídeo do scroll
Os quadros foram extraídos com ffmpeg, 12 quadros por segundo:
```bash
ffmpeg -i video.mp4 -vf "fps=12,scale=1024:-2" -c:v libwebp -quality 58 img/frames/lg/f-%03d.webp
ffmpeg -i video.mp4 -vf "fps=12,scale=640:-2"  -c:v libwebp -quality 55 img/frames/sm/f-%03d.webp
```
Se trocar o vídeo, atualize `CINEMA.quadros` em `js/config.js` com o total de arquivos gerados.

## Conectar ao Google Sheets (5 minutos)
1. Crie uma planilha nova em <https://sheets.new>.
2. Menu **Extensões > Apps Script**. Apague o que tiver, cole o conteúdo de `google-apps-script/Code.gs` e salve.
3. **Implantar > Nova implantação**, engrenagem, **App da Web**:
   - *Executar como*: **Eu**
   - *Quem pode acessar*: **Qualquer pessoa**
4. Clique em **Implantar** e autorize (vai aparecer "app não verificado": *Avançado > Acessar projeto*).
5. Copie a **URL do app da Web** (termina em `/exec`) e cole em `js/config.js`:
   ```js
   GOOGLE_SCRIPT_URL: "https://script.google.com/macros/s/XXXX/exec",
   ```
6. Faça uma inscrição de teste. A aba **Inscrições** é criada sozinha, com cabeçalho rosa.

Detalhes:
- O envio usa `fetch` com `mode: "no-cors"` e corpo `application/x-www-form-urlencoded`, o formato que o Apps Script
  aceita sem problema de CORS. O navegador não consegue ler a resposta, então o site mostra sucesso depois de enviar.
- Se editar o `Code.gs`, faça **Implantar > Gerenciar implantações > Editar > Nova versão**, senão a URL continua
  rodando o código antigo.
- Sem URL configurada, o site funciona em "modo de teste" e guarda as respostas no `localStorage`
  (chave `vand_inscricoes`).

## Desempenho
- Fontes locais com `font-display: swap` e pré-carregamento (sem Google Fonts).
- Fotos em WebP com `srcset`, dimensões fixas e carregamento preguiçoso.
- Quadros do vídeo carregados em segundo plano depois do loading, em ordem espaçada.
- Biblioteca de confete só é baixada quando é usada.
- Animações pausam quando a aba fica oculta ou a seção sai da tela.

A nota de SEO do PageSpeed fica baixa de propósito: o site tem `noindex` para não aparecer no Google.

---
*Feito com carinho, zero vergonha e muito tempo livre. Brincadeira entre amigos adultos. Ninguém deve levar a sério,
principalmente a parte em que o Vanderlei lava a louça.*
