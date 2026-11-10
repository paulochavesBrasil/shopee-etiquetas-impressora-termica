# Shopee Etiquetas para Impressora Térmica

Extensão para **Brave** e **Google Chrome** que pega a folha de etiquetas de envio da Shopee (aquela que vem com até **4 etiquetas numa folha A4**) e separa cada etiqueta numa página própria de **10 x 15 cm**, pronta pra imprimir em **impressora térmica** (JK-402A, Elgin, Zebra, Argox e afins).

Chega de recortar etiqueta, imprimir em folha A4 e colar com fita. 😉

## O que ela faz

- Coloca um botão laranja **"Dividir etiquetas (térmica)"** na página de impressão de etiquetas da Central do Vendedor da Shopee (`seller.shopee.com.br/awbprint`).
- Lê o PDF da etiqueta direto da página, divide cada folha em 4 partes e **descarta as partes em branco** (folhas com 1, 2 ou 3 etiquetas funcionam normal).
- Funciona com PDFs de **várias folhas** (lotes grandes de pedidos).
- Abre uma aba com uma etiqueta por página e já chama a janela de impressão.
- Dá pra escolher o tamanho: **10 x 15 cm** (padrão), **A6** ou o tamanho original do recorte.
- Tudo roda **no seu computador**. Nenhum dado de pedido é enviado para lugar nenhum.

## Como instalar

1. Baixe este projeto: botão verde **Code → Download ZIP** e descompacte numa pasta fixa (ex.: `Documentos\extensoes\shopee-etiquetas`).
   > Não apague nem mova essa pasta depois: o navegador roda a extensão direto dela.
2. No Brave, abra `brave://extensions` (no Chrome: `chrome://extensions`).
3. Ligue o **Modo do desenvolvedor** (canto superior direito).
4. Clique em **Carregar sem compactação** e escolha a pasta que você descompactou (a que tem o arquivo `manifest.json`).
5. Pronto! Se quiser, fixe o ícone da extensão na barra (ícone de quebra-cabeça → alfinete).

## Como usar

1. Na Central do Vendedor da Shopee, vá em **Meus envios** e mande **imprimir etiqueta** normalmente.
2. Na página da etiqueta, clique no botão laranja **"Dividir etiquetas (térmica)"** no canto superior direito
   (ou clique no ícone da extensão na barra do navegador).
3. Vai abrir uma aba nova com as etiquetas separadas e a janela de impressão.
4. Escolha a impressora térmica, confira se o papel está em **100 x 150 mm** e **margens: nenhuma**, e imprima.

### Dicas de impressão

- Se a etiqueta sair cortada ou pequena, confira o tamanho do papel nas configurações da impressora térmica (100 x 150 mm).
- Em "Mais definições", deixe **Escala: padrão** e **Margens: nenhuma**.

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `manifest.json` | Configuração da extensão (Manifest V3) |
| `content.js` / `content.css` | Botão na página da Shopee |
| `background.js` | Pega o PDF da página e abre a aba de impressão |
| `splitter.js` | Divide cada folha em 4 e descarta as partes em branco |
| `print.html` / `print.js` / `print.css` | Página de impressão (uma etiqueta por página) |
| `lib/` | [pdf.js](https://github.com/mozilla/pdf.js) da Mozilla (licença Apache 2.0) para ler o PDF |

## Observações

- Feita para a Shopee **Brasil** (`seller.shopee.com.br`).
- Se a Shopee mudar o layout da página de etiquetas, pode ser que precise de ajuste. Abra uma *issue* aqui no GitHub.
- Projeto independente, sem nenhuma ligação com a Shopee.

## Licença

Código da extensão: [MIT](LICENSE), use, copie e modifique à vontade.
A biblioteca pdf.js (pasta `lib/`) é da Mozilla Foundation, sob a licença Apache 2.0.

---

Feito pela [Megarte3D](https://megarte3d.com.br), Anápolis/GO.
