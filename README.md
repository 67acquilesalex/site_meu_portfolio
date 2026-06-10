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

## Como o fotografo edita sem codigo

Depois do Firebase configurado e do site publicado, o fotografo usa o botao `Conta` no proprio site:

- Criar conta ou entrar com email/senha ou Google.
- Editar nome publico, email publico, cidade, bio, WhatsApp, mensagem do WhatsApp, Instagram e categorias.
- Enviar logo pelo computador.
- Enviar foto de capa pelo computador.
- Adicionar fotos pelo computador.
- Remover fotos.
- Marcar `Publicar meu portfolio` para aparecer na galeria publica.

O fotografo final nao precisa editar HTML, CSS, JavaScript ou Vercel para trocar fotos, contatos e textos principais do perfil.

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

O site usa Firebase:

- Firebase Auth faz cadastro e login por e-mail e senha.
- Firestore salva usuarios em `users/{uid}`.
- Fotografos salvam perfil, contatos, mensagem de WhatsApp e fotos em `photographers/{uid}`.
- A listagem publica dos fotografos fica em `platform/directory`.
- Firebase Storage salva uploads reais de capa e fotos.

Para ativar:

1. Crie um projeto no Firebase.
2. Ative Authentication com provedor Email/Password.
3. Para o botao Google funcionar, ative tambem Authentication > Sign-in method > Google.
4. Os usuarios podem ser criados pelo proprio site.
5. Ative Firestore Database.
6. Ative Firebase Storage.
7. Copie a configuracao Web App do Firebase para `firebase-config.js`.
8. Publique na Vercel.

Se aparecer `auth/api-key-not-valid`, a `apiKey` em `firebase-config.js` nao pertence a um Web App valido do Firebase. No console do Firebase, abra `Project settings > General > Your apps`, selecione ou crie um app Web e copie o bloco `firebaseConfig` completo novamente.

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

Regras iniciais sugeridas para Firebase Storage:

```js
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /photographers/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
