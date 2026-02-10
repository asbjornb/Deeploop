import './ui/style.css';
import { GameEngine } from './game/engine.js';
import { GameUI } from './ui/interface.js';

const app = document.getElementById('app');

const engine = new GameEngine((state) => {
  ui.render(state);
});

const ui = new GameUI(app, engine);

// Show start screen
ui.renderStartScreen();
