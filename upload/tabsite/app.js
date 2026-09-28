(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const songs = Array.isArray(window.TAB_LIBRARY) ? window.TAB_LIBRARY : [];
  const viewport = $('tab-viewport');
  let current = null;
  let zoom = 100;
  let speed = 20;
  let theme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
  let controlsHidden = window.matchMedia('(max-width:700px)').matches;
  let playing = false;
  let animation = 0;
  let lastTime = null;
  let position = 0;
  let libraryPosition = 0;
  let lastOpened = null;
  let fullscreenPending = false;
  let fullscreenNoticeTimer = 0;
  const ZOOM_MIN = 25;
  const ZOOM_MAX = 250;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function loadPreferences() {
    try {
      const saved = JSON.parse(localStorage.getItem('tabbook-preferences') || '{}');
      if (Number.isFinite(saved.speed)) speed = Math.max(2, Math.min(80, saved.speed));
      if (Number.isFinite(saved.zoom)) zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, saved.zoom));
      if (saved.theme === 'light' || saved.theme === 'dark') theme = saved.theme;
      if (typeof saved.controlsHidden === 'boolean') controlsHidden = saved.controlsHidden;
    } catch { /* Storage may be unavailable; the reader still works. */ }
    $('speed').value = speed;
    updateSpeed();
    applyTheme();
    applyControlsVisibility();
  }

  function savePreferences() {
    try { localStorage.setItem('tabbook-preferences', JSON.stringify({zoom, speed, theme, controlsHidden})); } catch { /* Optional local preference. */ }
  }

  function applyTheme() {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#101813' : '#f4f6f4';
    const action = `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`;
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      button.setAttribute('aria-label', action);
      button.title = action;
      button.querySelector('.theme-icon').textContent = theme === 'dark' ? '☀' : '☾';
    });
  }

  function applyControlsVisibility() {
    const scrollTop = viewport.scrollTop;
    $('reader-controls').hidden = controlsHidden;
    $('reader-toolbar').classList.toggle('controls-collapsed', controlsHidden);
    $('compact-play').hidden = !controlsHidden;
    $('toggle-controls').setAttribute('aria-expanded', String(!controlsHidden));
    const action = controlsHidden ? 'Show controls' : 'Hide controls';
    $('toggle-controls').setAttribute('aria-label', action);
    $('toggle-controls').title = action;
    $('controls-arrow').textContent = controlsHidden ? '↓' : '↑';
    // Keep the current passage and ongoing playback when the toolbar changes size.
    viewport.scrollTop = scrollTop;
    position = viewport.scrollTop;
    lastTime = null;
  }

  function updatePlaybackButtons() {
    const label = playing ? 'Pause' : 'Play scroll';
    for (const id of ['play', 'compact-play']) {
      $(id).setAttribute('aria-pressed', String(playing));
      $(id).setAttribute('aria-label', label);
      $(id).title = `${label} (Space)`;
    }
    for (const id of ['play-icon', 'compact-play-icon']) $(id).textContent = playing ? 'Ⅱ' : '▶';
    $('play-label').textContent = label;
    updateStartButton();
  }

  function updateStartButton() {
    const atStart = viewport.scrollTop <= 1 && !playing;
    $('restart').disabled = atStart;
    $('restart').title = atStart ? 'Already at the start' : 'Pause and return to start';
  }

  function updateFullscreenButton() {
    const active = Boolean(document.fullscreenElement);
    const supported = Boolean(document.fullscreenEnabled && document.documentElement.requestFullscreen && document.exitFullscreen);
    $('fullscreen').hidden = !supported && !active;
    $('fullscreen').disabled = fullscreenPending;
    $('fullscreen').setAttribute('aria-pressed', String(active));
    $('fullscreen').setAttribute('aria-label', active ? 'Exit full screen' : 'Enter full screen');
    $('fullscreen').title = active ? 'Exit full screen (Esc)' : 'Enter full screen';
    $('fullscreen-icon').setAttribute('d', active
      ? 'M3 8h5V3M16 3v5h5M21 16h-5v5M8 21v-5H3'
      : 'M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5');
  }

  async function toggleFullscreen() {
    if (fullscreenPending) return;
    fullscreenPending = true;
    $('fullscreen').disabled = true;
    clearTimeout(fullscreenNoticeTimer);
    $('fullscreen-notice').hidden = true;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        // Invoke directly from the click so the browser receives user activation.
        await document.documentElement.requestFullscreen({navigationUI:'hide'});
      }
    } catch {
      $('fullscreen-notice').textContent = 'Full screen couldn’t open here. Try your browser’s full-screen control.';
      $('fullscreen-notice').hidden = false;
      fullscreenNoticeTimer = setTimeout(() => { $('fullscreen-notice').hidden = true; }, 6000);
    } finally {
      fullscreenPending = false;
      updateFullscreenButton();
    }
  }

  function buildContents() {
    $('song-count').textContent = `${songs.length} tabs`;
    $('library-error').hidden = songs.length > 0;
    const groups = new Map();
    for (const song of songs) {
      const letter = song.title[0].toUpperCase();
      if (!groups.has(letter)) groups.set(letter, []);
      groups.get(letter).push(song);
    }
    for (const [letter, entries] of groups) {
      const jump = element('a', '', letter);
      jump.href = `#letter-${letter}`;
      jump.setAttribute('aria-label', `Jump to ${letter}`);
      $('alphabet').append(jump);
      const section = element('section', 'letter-group');
      section.id = `letter-${letter}`;
      section.setAttribute('aria-labelledby', `heading-${letter}`);
      const heading = element('h2', '', letter);
      heading.id = `heading-${letter}`;
      const list = element('ul', 'song-list');
      for (const song of entries) {
        const item = element('li');
        const link = element('a', 'song-link');
        link.href = `#tab/${song.id}`;
        link.id = `link-${song.id}`;
        link.append(element('span', 'song-name', song.title));
        if (song.artist) link.append(element('span', 'artist', song.artist));
        item.append(link);
        list.append(item);
      }
      section.append(heading, list);
      $('contents').append(section);
    }
  }

  function lineClass(text) {
    if (/^\s*\[(?:[^\]]+)\]/.test(text)) return ' section';
    const chord = /^(?:[A-G](?:#|b)?(?:m|maj|min|dim|aug|sus|add|M)?\d*(?:sus\d|add\d)?(?:\/[A-G](?:#|b)?)?[/*]*|[|%:/()\d.xX-]+)$/;
    const tokens = text.trim().split(/\s+/);
    return tokens.length && tokens.some(t => /^[A-G]/.test(t)) && tokens.every(t => chord.test(t)) ? ' chords' : '';
  }

  function showSong(song) {
    pause();
    if (!current) libraryPosition = window.scrollY;
    current = song;
    lastOpened = song.id;
    document.body.classList.add('reading');
    $('library-view').hidden = true;
    $('reader-view').hidden = false;
    $('song-title').textContent = song.title;
    $('song-artist').textContent = song.artist;
    $('song-artist').hidden = !song.artist;
    $('song-note').textContent = song.note || '';
    $('song-note').hidden = !song.note;
    document.title = `${song.title} · Tab book`;
    const content = $('tab-content');
    content.replaceChildren();
    for (const block of song.blocks) {
      if (block.type === 'line') content.append(element('div', 'tab-line' + lineClass(block.text), block.text || '\u00a0'));
      else if (block.type === 'images') {
        const row = element('div', 'diagram-row');
        for (const picture of block.images) {
          const img = element('img');
          img.src = picture.src;
          img.alt = picture.alt;
          img.width = picture.width;
          if (picture.height) img.height = picture.height;
          img.style.width = `${picture.width / 18}em`;
          row.append(img);
        }
        content.append(row);
      }
    }
    applyZoom(zoom, false);
    viewport.scrollTop = 0;
    viewport.scrollLeft = 0;
    position = 0;
    setStatus('Ready');
    updateStartButton();
    viewport.focus({preventScroll:true});
  }

  function showLibrary() {
    pause();
    const wasReading = Boolean(current);
    current = null;
    $('library-view').hidden = false;
    $('reader-view').hidden = true;
    document.body.classList.remove('reading');
    document.title = 'Tab book · virtualrobot';
    if (wasReading) {
      window.scrollTo(0, libraryPosition);
      if (lastOpened) $(`link-${lastOpened}`)?.focus({preventScroll:true});
    }
    if (/^#letter-[A-Z]$/.test(location.hash)) $(location.hash.slice(1))?.scrollIntoView();
  }

  function route() {
    if (location.hash.startsWith('#tab/')) {
      const song = songs.find(s => `#tab/${s.id}` === location.hash);
      if (song) return showSong(song);
      showLibrary();
      $('library-error').textContent = 'That tab is not in this collection. Choose a title below.';
      $('library-error').hidden = false;
      return;
    }
    showLibrary();
  }

  function setStatus(text) { $('scroll-status').textContent = text; }

  function pause(message) {
    playing = false;
    cancelAnimationFrame(animation);
    lastTime = null;
    updatePlaybackButtons();
    if (message) setStatus(message);
  }

  function tick(now) {
    if (!playing) return;
    if (lastTime !== null) {
      // Keep fractional pixels so very slow speeds work on every display.
      position += speed * Math.min((now - lastTime) / 1000, .1);
      viewport.scrollTop = position;
      if (viewport.scrollTop >= viewport.scrollHeight - viewport.clientHeight - 1) {
        pause('End of tab · Return to start to play again');
        return;
      }
    }
    lastTime = now;
    animation = requestAnimationFrame(tick);
  }

  function togglePlay() {
    if (!current) return;
    if (playing) return pause('Paused');
    if (viewport.scrollTop >= viewport.scrollHeight - viewport.clientHeight - 1) {
      setStatus('End of tab · Return to start to play again');
      return;
    }
    playing = true;
    position = viewport.scrollTop;
    lastTime = null;
    updatePlaybackButtons();
    setStatus(`Scrolling · ${speed} px/s`);
    animation = requestAnimationFrame(tick);
  }

  function applyZoom(value, preserve = true) {
    if (playing) pause('Paused · Zoom changed');
    const content = $('tab-content');
    // Anchor the same passage, accounting for the unscaled song heading.
    const top = content.getBoundingClientRect().top - viewport.getBoundingClientRect().top + viewport.scrollTop;
    const offset = viewport.scrollTop - top;
    const previous = zoom;
    zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, Math.round(value)));
    content.style.fontSize = `${18 * zoom / 100}px`;
    $('zoom-value').textContent = `${zoom}%`;
    $('zoom-out').disabled = zoom <= ZOOM_MIN;
    $('zoom-in').disabled = zoom >= ZOOM_MAX;
    if (preserve && offset > 0) viewport.scrollTop = top + offset * zoom / previous;
    position = viewport.scrollTop;
    savePreferences();
  }

  function fitToWidth() {
    const content = $('tab-content');
    const page = document.querySelector('.song-page');
    const pageStyle = getComputedStyle(page);
    const viewportStyle = getComputedStyle(viewport);
    const available = viewport.clientWidth - parseFloat(viewportStyle.paddingLeft) - parseFloat(viewportStyle.paddingRight)
      - parseFloat(pageStyle.paddingLeft) - parseFloat(pageStyle.paddingRight) - 4;
    // Measure lines independently; the paper's minimum width must not affect fit.
    let width = 1;
    const range = document.createRange();
    for (const line of content.querySelectorAll('.tab-line')) {
      range.selectNodeContents(line);
      width = Math.max(width, range.getBoundingClientRect().width);
    }
    for (const row of content.querySelectorAll('.diagram-row')) {
      const images = [...row.children];
      width = Math.max(width, images.reduce((n, img) => n + img.getBoundingClientRect().width, 0) + Math.max(0, images.length - 1) * parseFloat(getComputedStyle(content).fontSize));
    }
    applyZoom(Math.floor(zoom * available / width));
    viewport.scrollLeft = 0;
  }

  function updateSpeed() {
    $('speed-value').textContent = speed;
    $('speed').setAttribute('aria-valuetext', `${speed} pixels per second`);
    if (playing) setStatus(`Scrolling · ${speed} px/s`);
  }

  $('play').addEventListener('click', togglePlay);
  $('compact-play').addEventListener('click', togglePlay);
  $('fullscreen').addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', () => {
    // Also synchronize when Esc or a browser control leaves full screen.
    updateFullscreenButton();
    $('fullscreen-notice').hidden = true;
    if (playing) pause('Paused · Full screen changed');
  });
  $('toggle-controls').addEventListener('click', () => {
    controlsHidden = !controlsHidden;
    applyControlsVisibility();
    savePreferences();
  });
  document.querySelectorAll('[data-theme-toggle]').forEach(button => button.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme();
    savePreferences();
  }));
  $('restart').addEventListener('click', () => {
    pause('Ready');
    viewport.scrollTop = 0;
    position = 0;
    updateStartButton();
  });
  viewport.addEventListener('scroll', updateStartButton, {passive:true});
  $('zoom-in').addEventListener('click', () => applyZoom(zoom + 10));
  $('zoom-out').addEventListener('click', () => applyZoom(zoom - 10));
  $('fit').addEventListener('click', fitToWidth);
  $('speed').addEventListener('input', event => { speed = Number(event.target.value); updateSpeed(); savePreferences(); });
  const manualScroll = () => { if (playing) pause('Paused · Press play to resume'); };
  viewport.addEventListener('wheel', manualScroll, {passive:true});
  viewport.addEventListener('touchstart', manualScroll, {passive:true});
  viewport.addEventListener('pointerdown', manualScroll, {passive:true});
  document.addEventListener('visibilitychange', () => { if (document.hidden && playing) pause('Paused · Tab was in the background'); });
  window.addEventListener('pagehide', () => pause('Paused'));
  window.addEventListener('resize', () => { if (playing) pause('Paused · Window resized'); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.fullscreenElement) {
      event.preventDefault();
      toggleFullscreen();
      return;
    }
    if (!current || event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
    if (event.target.closest('button, a, input, select, textarea, [contenteditable="true"]')) return;
    if (event.code === 'Space') { event.preventDefault(); togglePlay(); }
    else if (event.key === '+' || event.key === '=') { event.preventDefault(); applyZoom(zoom + 10); }
    else if (event.key === '-') { event.preventDefault(); applyZoom(zoom - 10); }
    else if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) manualScroll();
  });
  window.addEventListener('hashchange', route);
  loadPreferences();
  updateFullscreenButton();
  buildContents();
  route();
})();
