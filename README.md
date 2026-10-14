# Jonas Joaquim Cossa — Portfólio Cinematográfico

Website de página única com scroll cinematográfico (scroll-scrubbing de vídeo), animações de texto com parallax e showcase de projectos para **Jonas Joaquim Cossa** — Consultor de Marketing, Branding e Design Visual baseado em Matola, Moçambique.

---

## 🎨 Identidade Visual & Conceito
- **Referência Visual**: Editorial minimalista e de bastidores (estilo poster *"Behind All Project"*).
- **Paleta de Cores**:
  - Vermelho Principal: `#E8191F` (`--red`)
  - Cinzentos: `#F2F2F2`, `#BDBDBD`, `#6B6B6B`, `#1C1C1C`
- **Tipografia**:
  - Títulos: Display condensado em maiúsculas (`Bebas Neue`)
  - Microtexto & Etiquetas: Sans-serif geométrica com letter-spacing largo (`Inter`), formato `[ MARKETING ]`

---

## ⚡ Tecnologias
- **HTML5 & CSS3** (Vanilla, design responsivo com `clamp()`, zero dependências pesadas)
- **JavaScript Moderno (ES6+)**
- **Sequência de Frames em Canvas**: Renderização WebP a 60fps sincronizada com o scroll
- **GSAP 3 + ScrollTrigger**: Controlo de scrub e timeline das animações horizontais com parallax
- **Lenis**: Smooth scrolling suave a 60fps
- **Node.js**: Servidor local leve com suporte para streaming HTTP Byte Range (`Accept-Ranges: bytes`)

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) instalado (v18+)

### Iniciar o servidor
```bash
# Na raiz do projecto:
npm start
# ou:
node server.js
```
Acede no teu navegador em: `http://localhost:3000`

---

## 🎬 Como Gerar Novos Frames com FFmpeg

Para atualizar o vídeo de fundo (`Fundo/Background2.mp4`):

```bash
# Versão Desktop (1280px, 24fps, WebP):
ffmpeg -y -i "Fundo/Background2.mp4" -vf "fps=24,scale=1280:-1:flags=lanczos" -c:v libwebp -quality 75 -start_number 0 "assets/frames/desktop/frame_%04d.webp"

# Versão Mobile (720px, 24fps, WebP):
ffmpeg -y -i "Fundo/Background2.mp4" -vf "fps=24,scale=720:-1:flags=lanczos" -c:v libwebp -quality 65 -start_number 0 "assets/frames/mobile/frame_%04d.webp"

# Imagem de partilha Open Graph (frame 0):
ffmpeg -y -ss 00:00:00 -i "Fundo/Background2.mp4" -vframes 1 -q:v 2 "assets/og-image.jpg"
```

---

## 📁 Estrutura de Pastas

```
├── index.html            # Estrutura semântica principal
├── style.css             # Estilos completos e responsivos
├── main.js               # Lógica de animação, canvas e modal
├── projects.json         # Base de dados dos projectos
├── server.js             # Servidor HTTP local zero-config
├── vercel.json           # Configuração de publicação na Vercel
├── assets/
│   ├── favicon.svg       # Favicon vermelho
│   ├── og-image.jpg      # Imagem para redes sociais
│   └── frames/           # Sequências WebP para desktop e mobile
├── Fundo/                # Ficheiros de vídeo originais (.mp4)
└── Projectos/            # Imagens e materiais dos clientes
```

---

## 📱 Contactos
- **Telefone**: [+258 85 318 3744](tel:+258853183744)
- **WhatsApp**: [wa.me/258853183744](https://wa.me/258853183744)
- **E-mail**: [jonasjoaquimcossa2@gmail.com](mailto:jonasjoaquimcossa2@gmail.com)
- **LinkedIn**: [Jonas Joaquim Cossa](https://linkedin.com/in/jonas-joaquim-cossa-a7798b1a8)
- **Instagram**: [@eujayjunior](https://instagram.com/eujayjunior)

---

© 2024 Jonas Joaquim Cossa — Matola, Moçambique. Todos os direitos reservados.
