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

## Admin com Firebase

O admin usa Firebase no plano Spark, mantendo a edicao inline no proprio site:

- Firebase Auth faz o login administrativo por e-mail e senha.
- Firestore salva albuns, ordem, visibilidade, titulos e metadados das fotos em `portfolio/content`.
- Firebase Storage salva uploads em `portfolio/{albumSlug}/`.
- Visitantes continuam vendo o portfolio normalmente.
- Depois do login, aparecem controles inline para enviar, remover, ocultar e reordenar albuns e fotos.

Para ativar:

1. Crie um projeto no Firebase.
2. Ative Authentication com provedor Email/Password.
3. Crie o usuario administrativo em Authentication > Users.
4. Ative Firestore Database.
5. Ative Storage.
6. Copie a configuracao Web App do Firebase para `firebase-config.js`.
7. Publique na Vercel.

Regras iniciais sugeridas para Firestore:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /portfolio/content {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

Regras iniciais sugeridas para Storage:

```js
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /portfolio/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```
