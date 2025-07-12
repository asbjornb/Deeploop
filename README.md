# Deeploop
*A minimalist incremental RPG adventure*

## Game Description

Deeploop is a minimalist incremental RPG where you build a party of adventurers who automatically explore a deepening dungeon, battle monsters, and gather loot. Between floors, you pause in safe rooms to tweak strategy, assign skill points, and equip gear. 

The game blends light strategy, quirky humor, and satisfying progression through leveling, skill upgrades, and prestige resets—all without requiring constant interaction. Each run starts with randomized skills and stats, encouraging creative builds. Skills improve the more they're used, and weird achievements unlock new abilities, classes, races, and upgrades for future runs.

## Tech Stack

### Core Technologies
- **HTML5/CSS3/JavaScript (ES6+)** - Pure web technologies for maximum compatibility
- **Canvas API** - For game rendering and animations
- **Local Storage** - For save data persistence
- **Web Audio API** - For sound effects and music

### Development Tools
- **mise** - Runtime version management (Node.js)
- **Taskfile** - Task runner for build, test, and development commands
- **Vite** - Fast development server and build tool
- **Vitest** - Testing framework for continuous test coverage
- **ESLint** - Code linting
- **Prettier** - Code formatting

### Optional Enhancements
- **TypeScript** - For better code organization as the project grows
- **Web Workers** - For heavy calculations without blocking the UI
- **Service Workers** - For offline gameplay capability

## Project Structure
```
deeploop/
├── index.html          # Main entry point
├── .mise.toml          # Runtime version management
├── Taskfile.yml        # Task definitions
├── src/
│   ├── game/
│   │   ├── engine.js    # Core game loop
│   │   ├── party.js     # Party management
│   │   ├── dungeon.js   # Dungeon generation
│   │   ├── combat.js    # Battle system
│   │   └── progression.js # Leveling and skills
│   ├── ui/
│   │   ├── interface.js # UI management
│   │   └── style.css    # Game styling
│   └── utils/
│       ├── save.js      # Auto-save/load system
│       └── math.js      # Game calculations
├── tests/
│   ├── save.test.js     # Auto-save system tests
│   ├── game.test.js     # Core game logic tests
│   └── integration/     # End-to-end tests
├── assets/
│   ├── sprites/         # Game graphics
│   └── sounds/          # Audio files
└── package.json         # Dependencies
```

## Getting Started

### Prerequisites
- Node.js (16+ recommended)
- Modern web browser

### Local Development
1. Clone the repository
2. Install dependencies: `npm install`
3. Run tests: `npm test` (auto-save and core features)
4. Start development server: `npm run dev`
5. Open browser to `http://localhost:3000`

### Testing
Run the test suite to ensure auto-save and core functionality:
```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:save     # Run only auto-save tests
```

### Building for Production
```bash
npm run build
```
This creates a `dist/` folder ready for deployment to GitHub Pages or Cloudflare Pages.

## Deployment Options

### GitHub Pages
1. Build the project: `npm run build`
2. Push the `dist/` folder to the `gh-pages` branch
3. Enable GitHub Pages in repository settings

### Cloudflare Pages
1. Connect your GitHub repository to Cloudflare Pages
2. Set build command: `npm run build`
3. Set build output directory: `dist`

## Features Roadmap

### Core Infrastructure (Priority 1)
- [ ] **Auto-save system** - Continuous localStorage saving every 10 seconds
- [ ] **Save/load testing** - Comprehensive test coverage for data persistence
- [ ] **Game state management** - Centralized state with auto-save integration

### Core Mechanics
- [ ] Auto-exploring party system
- [ ] Turn-based combat with strategic pauses
- [ ] Skill trees and character progression
- [ ] Loot and equipment system
- [ ] Safe room strategy planning

### Progression Systems
- [ ] Prestige/reset mechanics
- [ ] Achievement system
- [ ] Unlockable classes and races
- [ ] Skill usage-based improvement

### Polish
- [ ] Quirky humor and flavor text
- [ ] Sound effects and ambient music
- [ ] Responsive design for mobile
- [ ] Offline gameplay support

## Development Notes

This game is designed to be:
- **Client-side only** - No server required, keeps hosting costs minimal
- **Incrementally developed** - Start simple, add features over time
- **Mobile-friendly** - Touch controls and responsive design
- **Offline-capable** - All game logic runs locally
- **Test-driven** - Auto-save and core features maintained with continuous testing

### Auto-Save System Priority
The auto-save system is **critical infrastructure** that must be implemented first:
- Prevents player progress loss in an incremental game
- Enables seamless play across browser sessions
- Must be thoroughly tested before adding complex game features
- All new features should integrate with the auto-save system

### Testing Strategy
- **Unit tests** for save/load functionality and data serialization
- **Integration tests** for game state persistence across sessions
- **Regression tests** to ensure new features don't break auto-save
- **Performance tests** to verify save operations don't impact gameplay

The tech stack prioritizes simplicity and compatibility while allowing for future enhancement as the game grows in complexity.