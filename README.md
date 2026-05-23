# Portfolio de Fotografia

Site estatico pronto para publicar na Vercel, agora separado por paginas.

## Paginas

- `index.html`: Home
- `sobre.html`: Sobre
- `portfolio.html`: Portfolio e galeria
- `empresarial.html`: Fotos da categoria Empresarial
- `familia.html`: Fotos da categoria Familia
- `gestante.html`: Fotos da categoria Gestante
- `eventos.html`: Fotos da categoria Eventos
- `projetos.html`: Tipos de ensaio/projetos
- `orcamento.html`: Formulario de orcamento
- `contato.html`: Links de contato

## Como editar

- Troque o nome `Seu Nome Fotografia` pelo nome real do fotografo ou estudio.
- Substitua as URLs de imagens do Unsplash nos arquivos `.html` pelas fotos reais do portfolio.
- Atualize o WhatsApp em `https://wa.me/5592999999999` nos arquivos `index.html`, `orcamento.html` e `contato.html`, se aparecer.
- Atualize tambem o numero `5592999999999` no arquivo `script.js`; ele e usado pelo formulario de orcamento.
- Atualize o e-mail `contato@seudominio.com`.
- Ajuste os textos de sobre, projetos, portfolio e contato.

## Publicar na Vercel

1. Envie estes arquivos para o repositorio no GitHub.
2. Na Vercel, clique em `Add New Project`.
3. Importe o repositorio.
4. Framework Preset: `Other`.
5. Build Command: deixe vazio.
6. Output Directory: deixe vazio ou use `.`.
7. Clique em `Deploy`.

Depois do deploy, conecte o dominio da Hostinger em `Project Settings > Domains` na Vercel e configure o DNS conforme as instrucoes exibidas.

## Proxima etapa tecnica

O modo admin atual e apenas um mock local para demonstrar UX. Para upload real de fotos e albuns, migrar o projeto para Next.js otimizado e usar Firebase no plano Spark:

- Usar Firebase Auth para o login administrativo.
- Usar Firestore para salvar albuns, ordem, visibilidade, titulos e metadados das fotos.
- Usar Firebase Storage para upload, remocao e exibicao real das imagens.
- Manter a experiencia atual: o site publico continua igual, e ao logar como admin aparecem controles inline nos proprios albuns e fotos.
- Otimizar imagens com Next.js Image, lazy loading, tamanhos responsivos e cache adequado para Vercel.
- Remover o mock baseado em `localStorage` quando Firebase estiver implementado.
