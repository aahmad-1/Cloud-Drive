
```
Cloud-Drive
├─ client
│  ├─ eslint.config.js
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ public
│  │  ├─ favicon.svg
│  │  ├─ icons.svg
│  │  ├─ locales
│  │  │  ├─ en
│  │  │  │  └─ translation.json
│  │  │  └─ fi
│  │  │     └─ translation.json
│  │  └─ No-Image-Placeholder.svg
│  ├─ README.md
│  ├─ src
│  │  ├─ App.css
│  │  ├─ App.tsx
│  │  ├─ assets
│  │  │  ├─ hero.png
│  │  │  ├─ react.svg
│  │  │  └─ vite.svg
│  │  ├─ components
│  │  │  ├─ DocumentEditor.tsx
│  │  │  ├─ Drive.tsx
│  │  │  ├─ Login.tsx
│  │  │  ├─ Navigation.tsx
│  │  │  ├─ Profile.tsx
│  │  │  ├─ Register.tsx
│  │  │  └─ Trash.tsx
│  │  ├─ i18n.ts
│  │  ├─ index.css
│  │  ├─ main.tsx
│  │  └─ types
│  │     ├─ CloudDocument.ts
│  │     └─ User.ts
│  ├─ tsconfig.app.json
│  ├─ tsconfig.json
│  ├─ tsconfig.node.json
│  └─ vite.config.ts
│  └─ .gitignore
├─ package-lock.json
├─ package.json
├─ .gitkeep
├─ README.md
└─ server
   ├─ package-lock.json
   ├─ package.json
   ├─ public
   │  └─ images (git ignored but exists)
   │  |  └─ .gitkeep (git ignored but exists)
   │  └─ index.html
   ├─ server.ts
   ├─ src
   │  ├─ middleware
   │  │  ├─ multer-config.ts
   │  │  └─ validateToken.ts
   │  ├─ models
   │  │  ├─ CloudDocument.ts
   │  │  └─ User.ts
   │  ├─ routes
   │  │  ├─ auth.ts
   │  │  └─ documents.ts
   │  └─ validators
   │     └─ inputValidation.ts
   └─ tsconfig.json

```