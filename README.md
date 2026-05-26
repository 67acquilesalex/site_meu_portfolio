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

## Plataforma com Firebase

O site usa Firebase no plano Spark, sem Firebase Storage:

- Firebase Auth faz cadastro e login por e-mail e senha.
- Firestore salva usuarios em `users/{uid}`.
- Fotógrafos salvam perfil, contatos e links de fotos em `photographers/{uid}`.
- A listagem publica dos fotografos fica em `platform/directory`.
- As imagens devem ser adicionadas por URL externa, por exemplo Cloudinary, Imgur ou outro host de imagens.
- O Firebase Storage nao e usado porque exige upgrade do projeto.

Para ativar:

1. Crie um projeto no Firebase.
2. Ative Authentication com provedor Email/Password.
3. Os usuarios podem ser criados pelo proprio site.
4. Ative Firestore Database.
5. Copie a configuracao Web App do Firebase para `firebase-config.js`.
6. Publique na Vercel.

Regras iniciais sugeridas para Firestore:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /platform/directory {
      allow read: if true;
      allow write: if request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "fotografo";
    }

    match /users/{userId} {
      allow create: if request.auth != null && request.auth.uid == userId;
      allow read, update, delete: if request.auth != null && request.auth.uid == userId;
    }

    match /photographers/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
