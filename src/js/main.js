// Entry point: build the map, wire the controls, restore the view.
import { S, byId } from './core.js';
import { buildBasemap } from './basemap.js';
import { buildOverlay, resetTextMetrics } from './overlay.js';
import { initView, startView, draw, render, watchResize } from './view.js';
import { initControls, setSeries } from './controls.js';
import { initStory, storyOpen } from './story.js';
import { initTheme } from './theme.js';
import { renderIndex, select } from './gazetteer.js';
import { initSpoiler } from './spoiler.js';

buildBasemap();
buildOverlay();
initView();
initControls();
initStory();
initTheme();

startView();
setSeries(S.series, true);
renderIndex();
draw();

// deep links: #<place id> opens that place, #story starts story mode
const hash = (location.hash || '').slice(1);
if (hash && byId[hash]) select(hash, true);
else if (hash === 'story') storyOpen(0);

// last, so the map behind the notice is already drawn and any deep link has resolved
initSpoiler();

watchResize();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { resetTextMetrics(); render(); });
