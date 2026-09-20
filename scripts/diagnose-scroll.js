import { chromium } from 'playwright';

async function diagnoseScroll() {
  console.log('--- STARTING PLAYWRIGHT SCROLL AUDIT ON http://localhost:5173/ ---');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => consoleLogs.push(`[PAGE_ERROR] ${err.message}`));

  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000); // Wait for preloader

  // Get total document height
  const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  console.log(`Document scrollHeight: ${scrollHeight}px`);

  // We will scroll at 200px increments or 5% increments through the 800vh container
  const step = 400; // px
  const checkpoints = [];

  for (let y = 0; y <= scrollHeight - 1080; y += step) {
    await page.evaluate((scrollPos) => {
      window.scrollTo(0, scrollPos);
    }, y);
    await page.waitForTimeout(100);

    const state = await page.evaluate((scrollPos) => {
      const pct = (scrollPos / (document.documentElement.scrollHeight - window.innerHeight)).toFixed(3);
      
      // Check visible scenes
      const scenes = [
        { name: 'Scene 1: Arrival', el: document.querySelector('header[aria-label*="Arrival"]') },
        { name: 'Scene 2: Forest', el: document.querySelector('section[aria-label*="Forest"]') },
        { name: 'Scene 3: Discovery', el: document.querySelector('section[aria-label*="Pepper"]') },
        { name: 'Scene 4: Harvest', el: document.querySelector('section[aria-label*="Harvest"]') },
        { name: 'Scene 4.5: Honey', el: document.querySelector('section[aria-label*="Honey"]') },
        { name: 'Scene 5: Collection', el: document.getElementById('collection') },
      ];

      const sceneStates = scenes.map(s => {
        if (!s.el) return { name: s.name, exists: false };
        const cs = window.getComputedStyle(s.el);
        const rect = s.el.getBoundingClientRect();
        return {
          name: s.name,
          exists: true,
          opacity: parseFloat(cs.opacity).toFixed(2),
          visibility: cs.visibility,
          pointerEvents: cs.pointerEvents,
          rectTop: Math.round(rect.top),
          rectBottom: Math.round(rect.bottom),
          inViewport: rect.bottom > 0 && rect.top < window.innerHeight
        };
      });

      // Check text elements visibility
      const texts = Array.from(document.querySelectorAll('h1, h2, h3, p')).filter(el => {
        const rect = el.getBoundingClientRect();
        const cs = window.getComputedStyle(el);
        const inVp = rect.bottom > 0 && rect.top < window.innerHeight && rect.height > 0 && rect.width > 0;
        const op = parseFloat(cs.opacity);
        return inVp && op > 0.1 && cs.visibility !== 'hidden';
      }).map(el => ({ tag: el.tagName, text: el.innerText.slice(0, 30).replace(/\n/g, ' ') }));

      // Check if the master sticky viewport is visible
      const stickyEl = document.querySelector('.experience-shell > div > div');
      const stickyOpacity = stickyEl ? window.getComputedStyle(stickyEl).opacity : 'N/A';

      return {
        y: scrollPos,
        progress: pct,
        stickyOpacity,
        activeScenes: sceneStates.filter(s => s.exists && s.inViewport && parseFloat(s.opacity) > 0.05),
        visibleTextCount: texts.length,
        visibleTexts: texts.slice(0, 3)
      };
    }, y);

    checkpoints.push(state);

    // If no active scene has opacity > 0.05 OR no visible text, log potential blank!
    if (state.activeScenes.length === 0 || state.visibleTextCount === 0) {
      console.log(`[POTENTIAL DEAD/BLANK SPOT] y=${state.y} (${(state.progress * 100).toFixed(1)}%): activeScenes=${state.activeScenes.map(s => s.name + ':' + s.opacity).join(', ') || 'NONE'}, visibleTexts=${state.visibleTextCount}, stickyOpacity=${state.stickyOpacity}`);
    }
  }

  console.log(`\nTotal checkpoints audited: ${checkpoints.length}`);
  console.log(`Console Logs / Errors during scroll:`, consoleLogs);

  await browser.close();
}

diagnoseScroll().catch(console.error);
