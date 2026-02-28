# 🎨 KAMAL - Frontend UI & Landing Page

## 📍 Your Responsibility
- Landing page design
- Homepage UI/UX
- Responsive design
- Navigation components
- Page routing
- Visual polish

---

## 📁 Your Code Locations

### Main Frontend Project
```
kamal_part/
├── src/
│   ├── pages/
│   │   ├── HomePage.jsx       # Landing page
│   │   ├── LeaderboardPage.jsx # Leaderboard view
│   │   ├── RoomsPage.jsx      # Game rooms list
│   │   ├── ContactPage.jsx    # Contact page
│   │   ├── TermsPage.jsx      # Terms of service
│   │   ├── PrivacyPage.jsx    # Privacy policy
│   │   ├── NotFoundPage.jsx   # 404 page
│   │   └── PlayPage.jsx       # Play page
│   ├── components/
│   │   ├── Navbar.jsx         # Navigation bar
│   │   ├── Footer.jsx         # Footer
│   │   ├── RoomCard.jsx       # Room card component
│   │   ├── PlayersList.jsx    # Players list display
│   │   └── AuthModal.jsx      # Auth modal
│   ├── layouts/
│   │   └── MainLayout.jsx     # Main layout wrapper
│   ├── constants/
│   │   └── index.js           # Constants
│   ├── styles/
│   │   └── [your css files]   # Styling
│   └── assets/
│       └── [images, icons]
│
├── dist/                       # Built frontend
├── package.json
├── vite.config.js
└── README.md
```

### HTML Authentication Pages
```
public/
├── login.html                 # Login form (you style)
├── register.html              # Register form (you style)
└── profile.html               # User profile page (you style)
```

---

## 🔌 Packages You Use

```json
{
  "react": "^18.x",                    // UI framework
  "react-router-dom": "^6.x",          // Page routing
  "@vitejs/plugin-react": "^4.x",      // React integration
  "vite": "^4.x"                       // Build tool
}
```

### Check package.json for full list:
```bash
cat kamal_part/package.json | grep '"dependencies"' -A 20
```

---

## 🌐 Pages You Maintain

| Page | Route | Purpose |
|------|-------|---------|
| HomePage | / | Landing page, game info |
| PlayPage | /play | Play button, start game |
| RoomsPage | /rooms | List available rooms |
| LeaderboardPage | /leaderboard | Player rankings |
| ContactPage | /contact | Contact information |
| TermsPage | /terms | Terms of service |
| PrivacyPage | /privacy | Privacy policy |
| NotFoundPage | /404 | 404 error page |

---

## 🎨 Components You Create

| Component | Purpose | File |
|-----------|---------|------|
| Navbar | Navigation menu | components/Navbar.jsx |
| Footer | Footer section | components/Footer.jsx |
| RoomCard | Room preview | components/RoomCard.jsx |
| PlayersList | Show players | components/PlayersList.jsx |
| AuthModal | Login/register | components/AuthModal.jsx |
| MainLayout | Page wrapper | layouts/MainLayout.jsx |

---

## 🔗 Integration Points

### Linking to Game
1. **Play Button**
   - Redirects to: `/game?token=xxx&multiplayer=true&gameType=1v1`
   - Pass token for authentication
   - Pass game type (1v1 or 4-player)

2. **Rooms List**
   - Show available game rooms
   - Link to join room

3. **Leaderboard**
   - Fetch user stats from backend
   - Display rankings

### Code Example
```javascript
// HomePage.jsx
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();
  
  const playGame = () => {
    const token = localStorage.getItem('token');
    navigate(`/game?token=${token}&multiplayer=true&gameType=1v1`);
  };
  
  return (
    <MainLayout>
      <h1>Welcome to Parchisi</h1>
      <button onClick={playGame}>Play Game</button>
    </MainLayout>
  );
}
```

---

## 🚀 Build & Deploy

### Development
```bash
cd kamal_part
npm install
npm run dev    # Starts dev server (not used - built instead)
```

### Production Build
```bash
cd kamal_part
npm run build  # Creates dist/ folder
# Built files served from http://localhost:3000/
```

---

## 📝 Files to Maintain

| File | What to Check |
|------|---------------|
| HomePage.jsx | Landing page content, design |
| Navbar.jsx | Navigation links, styling |
| Footer.jsx | Footer content, layout |
| RoomCard.jsx | Room display, info shown |
| pages/* | All page components |
| styles/ | All CSS files |
| assets/ | Images, icons |

---

## 🎯 Styling Guidelines

### Color Scheme (Suggest)
```css
--primary: #FF4757        /* Red - game color */
--secondary: #2ED573      /* Green - accent */
--dark: #1f1f1f           /* Dark background */
--light: #f5f5f5          /* Light background */
```

### Responsive Breakpoints
```css
@media (max-width: 768px) {
  /* Mobile styles */
}

@media (max-width: 1024px) {
  /* Tablet styles */
}
```

---

## ✅ Checklist for Maintenance

- [ ] Landing page looks great
- [ ] Navigation works on all pages
- [ ] Responsive design on mobile/tablet/desktop
- [ ] Links to game work correctly
- [ ] Images load properly
- [ ] No CSS conflicts
- [ ] Page transitions smooth
- [ ] Footer displays on all pages

---

## 🚨 Common Issues & Fixes

**Problem**: Game link doesn't work
- Check token is being passed
- Verify route format: `/game?token=xxx`

**Problem**: Responsive design broken
- Check media queries in CSS
- Use flexbox/grid for layouts

**Problem**: Images not loading
- Verify image paths in assets/
- Check vite.config.js base path

---

## 📚 Files to Read & Understand

1. **kamal_part/vite.config.js**
   - Build configuration
   - Base path settings

2. **kamal_part/src/App.jsx**
   - Page routing setup
   - Main layout

3. **App.css or main.css**
   - Global styles
   - Color scheme

4. **react-router documentation**
   - Page routing patterns
   - useNavigate hooks

---

## 🔄 Coordination with Others

- **Anas**: Chat integration in game page
- **Soumya**: Game board display
- **Backend Dev**: API calls for rooms/leaderboard

---

## 🎯 Current Status

✅ Frontend builds successfully
✅ Pages load correctly
✅ Navigation works
⚠️ Styling may need refinement
⚠️ Mobile responsiveness to check

---

**Last Updated**: Feb 24, 2026
**View Built Files**: kamal_part/dist/
