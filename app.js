(() => {
  'use strict';
  const store = 'https://www.rustore.ru/catalog/app/com.shelestov.noir_2048';
  let lang = document.documentElement.lang === 'en' ? 'en' : 'ru';
  const page = document.body.dataset.page;
  const words = {
    ru: { one: '1 на партию', used: 'Использовано', help: 'Свайп или стрелки / WASD', select: 'Выберите плитку для удаления', last: 'Последнюю плитку удалить нельзя', score: 'Счёт', max: 'Максимальная плитка', removeLabel: 'Удалить плитку', board: 'Поле 4 × 4. Свайп или стрелки / WASD.', cell: 'ряд', col: 'столбец', stalled: 'Ходов больше нет', rescue: 'Осталось одно бесплатное удаление. Освободите место или завершите партию.', remove: 'Удалить плитку', finish: 'Завершить партию', over: 'Партия завершена', overMessage: 'Продолжите играть в Noir 2048 на Android.', download: 'Скачать в RuStore', again: 'Играть снова', restartTitle: 'Начать заново?', restartMessage: 'Текущий счёт и поле будут сброшены. В новой партии снова доступно одно удаление.', restart: 'Начать заново', cancel: 'Продолжить игру', empty: 'Пустая клетка', nav: 'Основная навигация', style: 'Стиль плиток', skip: 'Перейти к содержимому' },
    en: { one: '1 per game', used: 'Used', help: 'Swipe or use arrows / WASD', select: 'Choose a tile to remove', last: 'You cannot remove the last tile', score: 'Score', max: 'Highest tile', removeLabel: 'Remove a tile', board: '4 × 4 board. Swipe or use arrows / WASD.', cell: 'row', col: 'column', stalled: 'No moves left', rescue: 'You have one free tile removal left. Make room or finish the game.', remove: 'Remove a tile', finish: 'Finish game', over: 'Game finished', overMessage: 'Keep playing Noir 2048 on Android.', download: 'Get it on RuStore', again: 'Play again', restartTitle: 'Start a new game?', restartMessage: 'Your current score and board will be reset. The new game comes with one tile removal.', restart: 'Start new game', cancel: 'Keep playing', empty: 'Empty cell', nav: 'Main navigation', style: 'Tile style', skip: 'Skip to content' }
  };
  const w = key => words[lang][key];
  words.ru.noMove = 'В эту сторону плитки не двигаются.';
  words.en.noMove = 'Tiles cannot move in that direction.';
  function localize(next) {
    lang = next;
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => { const entry = window.NOIR_TRANSLATIONS[el.dataset.i18n]; if (entry) el.innerHTML = entry[lang]; });
    document.querySelectorAll('[data-language]').forEach(a => a.setAttribute('aria-current', String(a.dataset.language === lang)));
    document.querySelectorAll('[data-legal]').forEach(a => a.href = `./${a.dataset.legal}${lang === 'en' ? '.en' : ''}.html`);
    document.querySelectorAll('[data-help]').forEach(a => a.href = `./help${lang === 'en' ? '.en' : ''}.html`);
    document.querySelector('.brand').href = lang === 'en' ? './en.html' : './index.html';
    const back = document.querySelector('[data-i18n=legal_back]'); if (back) back.href = lang === 'en' ? './en.html' : './index.html';
    const skip = document.querySelector('.skip'); if (skip && page !== 'home') skip.textContent = w('skip');
    const nav = document.querySelector('nav'); if (nav) nav.setAttribute('aria-label',w('nav'));
    const styles = document.querySelector('.style-tabs'); if (styles) styles.setAttribute('aria-label',w('style'));
    const title = page === 'home' ? (lang === 'ru' ? 'Noir 2048 — игра 2048 от SKRAY' : 'Noir 2048 — a 2048 game by SKRAY') : `${window.NOIR_TRANSLATIONS['legal_title_'+page][lang]} — Noir 2048`;
    document.title = title; document.querySelector('[property="og:title"]').content = title;
    const description = lang === 'ru' ? 'Классическая игра 2048 для Android. Попробуйте демо, выберите стиль плиток и скачайте Noir 2048 в RuStore.' : 'Classic 2048 for Android. Try the demo, choose a tile style and get Noir 2048 on RuStore.';
    document.querySelector('[name=description]').content = description; document.querySelector('[property="og:description"]').content = description;
  }
  document.querySelectorAll('[data-language]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault(); const next = a.dataset.language;
    localize(next);
    // Local file previews have an opaque origin and cannot change the path.
    if (location.protocol === 'http:' || location.protocol === 'https:') history.replaceState(null,'',a.getAttribute('href')+location.hash);
    if (page === 'home') { updateUI(); if (!busy) renderTiles(); if (overlay) showOverlay(overlay); }
  }));
  localize(lang);
  if (page !== 'home') return;
  const G = window.NoirGame;
  const boardEl = document.querySelector('#board'), layer = document.querySelector('#tiles'), overlayEl = document.querySelector('#game-overlay');
  const scoreEl = document.querySelector('#score'), deleteBtn = document.querySelector('#delete'), helpEl = document.querySelector('#game-help');
  let board = G.start(), score = 0, skin = 'gold', removal = 1, deleting = false, busy = false, overlay = null, ended = false;
  let pendingMove = null, pendingAction = null;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const textures = new Map();
  function prepareTexture(style, value) {
    const key = `${style}/${value}`;
    if (!textures.has(key)) {
      const img = new Image(); img.src = `./assets/tiles/${style}/tile-${value}.svg`;
      const ready = img.decode().catch(() => {});
      textures.set(key, { img, ready });
    }
    return textures.get(key).ready;
  }
  function warmStyle(style) {
    return Promise.all(Array.from({length:17},(_,i)=>prepareTexture(style,2 ** (i+1))));
  }
  function updateArt(tile, value) {
    const key = `${skin}/${value}`;
    if (tile.dataset.art === key) return;
    tile.dataset.art = key;
    const img = new Image(); img.alt = ''; img.draggable = false;
    img.src = `./assets/tiles/${skin}/tile-${value}.svg`;
    // Keep the old art visible until the replacement is decoded.
    img.decode().then(() => {
      if (tile.dataset.art === key) tile.replaceChildren(img);
    }).catch(() => {
      if (tile.dataset.art !== key) return;
      const fallback = document.createElement('span'); fallback.className='fallback'; fallback.textContent=value;
      tile.replaceChildren(fallback);
    });
  }
  function renderTiles(spawnCell = -1, merged = []) {
    const existing = new Map([...layer.children].map(tile=>[Number(tile.dataset.cell),tile]));
    const occupied = board.filter(Boolean).length;
    board.forEach((value,i) => {
      if (!value) return;
      let tile = existing.get(i);
      if (!tile) {
        tile = document.createElement('button'); tile.type = 'button'; tile.className = 'tile';
        tile.addEventListener('click',()=>removeTile(Number(tile.dataset.cell)));
        layer.append(tile);
      }
      existing.delete(i); tile.dataset.cell = i; tile.dataset.value = value;
      tile.style.setProperty('--r',Math.floor(i/4)); tile.style.setProperty('--c',i%4);
      tile.disabled = !deleting || occupied <= 1; tile.tabIndex = deleting && !tile.disabled ? 0 : -1;
      tile.setAttribute('aria-label', `${deleting ? w('removeLabel')+' ' : ''}${value}, ${w('cell')} ${Math.floor(i/4)+1}, ${w('col')} ${i%4+1}`);
      updateArt(tile,value);
      tile.classList.toggle('spawn',i === spawnCell);
      tile.classList.toggle('merge',merged.includes(i));
    });
    existing.forEach(tile=>tile.remove());
    boardEl.classList.toggle('delete-mode',deleting);
    updateBoardLabel();
  }
  function updateBoardLabel() {
    boardEl.setAttribute('aria-label',`${w('board')} ${w('score')}: ${score}. `+board.map((v,i) => `${w('cell')} ${Math.floor(i/4)+1}, ${w('col')} ${i%4+1}: ${v || w('empty')}`).join('; '));
  }
  function updateUI() {
    scoreEl.textContent = score.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US');
    deleteBtn.disabled = !removal || ended || board.filter(Boolean).length <= 1;
    deleteBtn.classList.toggle('needs-attention',!!removal && !ended && !deleting && !G.canMove(board));
    deleteBtn.setAttribute('aria-pressed',String(deleting));
    deleteBtn.setAttribute('aria-label',w('removeLabel')+'. '+(removal ? w('one') : w('used')));
    document.querySelector('#delete-count').textContent = removal ? w('one') : w('used');
    helpEl.textContent = deleting ? w('select') : w('help'); helpEl.classList.toggle('delete-help',deleting);
    document.querySelector('#cancel-delete').hidden = !deleting;
    document.querySelectorAll('[data-style]').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.style === skin)));
    updateBoardLabel();
  }
  function announce(text) { document.querySelector('#announcer').textContent = text; }
  function newGame() {
    if (busy) return;
    pendingMove=null;pendingAction=null;
    board=G.start(); score=0; removal=1; deleting=false; ended=false; hideOverlay(); renderTiles(); updateUI(); boardEl.focus({preventScroll:true});
    announce(w('again')+'. '+w('score')+': 0');
  }
  function hideOverlay() { overlay=null;overlayEl.hidden=true; }
  function showOverlay(kind) {
    overlay=kind;overlayEl.hidden=false;
    const titleEl=document.querySelector('#overlay-title'), msg=document.querySelector('#overlay-message'), count=document.querySelector('#overlay-score'), actions=document.querySelector('#overlay-actions');
    titleEl.textContent=w(kind==='restart' ? 'restartTitle' : kind==='stalled' ? 'stalled' : 'over');
    msg.textContent=w(kind==='restart' ? 'restartMessage' : kind==='stalled' ? 'rescue' : 'overMessage');
    count.textContent=kind==='over' ? score.toLocaleString(lang==='ru'?'ru-RU':'en-US') : '';count.hidden=kind!=='over';
    actions.replaceChildren();
    function action(text,callback,primary=false) { const b=document.createElement('button'); b.type='button';b.className='button '+(primary?'primary':'secondary');b.textContent=text;b.addEventListener('click',callback);actions.append(b);return b; }
    if (kind==='restart') { action(w('restart'),newGame,true);action(w('cancel'),()=>{hideOverlay();boardEl.focus({preventScroll:true});checkEnd();}); }
    else if (kind==='stalled') { action(w('remove'),()=>{hideOverlay();setDelete(true);},true); action(w('finish'),finish); }
    else { const a=document.createElement('a');a.className='button primary';a.href=store;a.target='_blank';a.rel='noopener noreferrer';a.textContent=w('download');actions.append(a);action(w('again'),newGame); }
    overlayEl.setAttribute('role','region');overlayEl.setAttribute('aria-labelledby','overlay-title');
    announce(titleEl.textContent+'. '+msg.textContent);
    // Move keyboard focus to the visible choice, never navigate automatically.
    actions.firstElementChild.focus({preventScroll:true});
  }
  function finish() { ended=true;deleting=false;updateUI();showOverlay('over'); }
  function checkEnd() { if (!G.canMove(board)) { if (removal) showOverlay('stalled'); else finish(); } }
  let feedbackTimer;
  function showNoMove(direction) {
    clearTimeout(feedbackTimer);
    boardEl.classList.remove('invalid-horizontal','invalid-vertical');
    // Restart the feedback for every completed gesture, including repeated ones.
    void boardEl.offsetWidth;
    boardEl.classList.add(direction === 'left' || direction === 'right' ? 'invalid-horizontal' : 'invalid-vertical');
    feedbackTimer = setTimeout(() => boardEl.classList.remove('invalid-horizontal','invalid-vertical'),220);
    announce(w('noMove'));
  }
  async function applyMove(direction) {
    if (deleting || overlay || ended) return;
    if (busy) { pendingMove=direction;return; }
    const result=G.move(board,direction);
    if (!result.changed) { showNoMove(direction);checkEnd();return; }
    busy=true;
    const nextBoard=result.board,spawned=G.spawn(nextBoard);
    await Promise.all([...new Set(nextBoard.filter(Boolean))].map(value=>prepareTexture(skin,value)));
    const oldNodes=new Map([...layer.children].map(tile=>[Number(tile.dataset.cell),tile]));
    const survivors=new Map(), consumed=[];
    // Reuse moving nodes; only consumed merge partners disappear.
    result.movements.forEach(({from,to})=>{
      const tile=oldNodes.get(from);if(!tile)return;
      tile.classList.remove('spawn','merge');
      if (!survivors.has(to)) survivors.set(to,tile); else consumed.push(tile);
    });
    if (!reducedMotion.matches) await new Promise(requestAnimationFrame);
    const moving=[];
    result.movements.forEach(({from,to})=>{
      const tile=oldNodes.get(from);if(!tile)return;
      tile.style.setProperty('--r',Math.floor(to/4));tile.style.setProperty('--c',to%4);
      if(from!==to)moving.push(tile);
    });
    if (!reducedMotion.matches && moving.length) {
      await Promise.all(moving.map(tile=>new Promise(resolve=>{
        let timer;
        const done=e=>{if(e && (e.target!==tile || e.propertyName!=='transform'))return;clearTimeout(timer);tile.removeEventListener('transitionend',done);tile.removeEventListener('transitioncancel',done);resolve();};
        tile.addEventListener('transitionend',done);tile.addEventListener('transitioncancel',done);
        timer=setTimeout(done,220);
      })));
    }
    consumed.forEach(tile=>tile.remove());
    survivors.forEach((tile,cell)=>{tile.dataset.cell=cell;});
    board=nextBoard;score+=result.points;
    busy=false;renderTiles(spawned,result.mergedCells);updateUI();
    announce(`${w('score')}: ${score}. ${w('max')}: ${Math.max(...board)}.`);checkEnd();
    if(pendingAction){const action=pendingAction;pendingAction=null;pendingMove=null;action();}
    else if(pendingMove){const next=pendingMove;pendingMove=null;applyMove(next);}
  }
  function setDelete(active) {
    if (busy || ended || (active && !removal)) return;
    deleting=active;hideOverlay();renderTiles();updateUI();
    if(active){announce(w('select'));const first=layer.querySelector('.tile:not(:disabled)');if(first)first.focus({preventScroll:true});}
    else {boardEl.focus({preventScroll:true});checkEnd();}
  }
  function removeTile(i) {
    if (!deleting || busy || !removal || !board[i] || board.filter(Boolean).length<=1) return;
    board[i]=0;removal=0;deleting=false;renderTiles();updateUI();boardEl.focus({preventScroll:true});announce(w('used'));checkEnd();
  }
  function afterMove(action) { if(busy)pendingAction=action;else action(); }
  deleteBtn.addEventListener('click',()=>afterMove(()=>setDelete(!deleting)));
  document.querySelector('#cancel-delete').addEventListener('click',()=>setDelete(false));
  document.querySelector('#restart').addEventListener('click',()=>afterMove(()=>showOverlay('restart')));
  document.querySelectorAll('[data-style]').forEach(b=>b.addEventListener('click',()=>{skin=b.dataset.style;if(!busy)renderTiles();updateUI();}));
  document.querySelectorAll('a[href="#play"]').forEach(a=>a.addEventListener('click',()=>{setTimeout(()=>boardEl.focus({preventScroll:true}),30);}));
  let pointer=null;
  // Native image/text dragging steals pointerup and shows a forbidden-drop cursor.
  boardEl.addEventListener('dragstart',e=>e.preventDefault());
  boardEl.addEventListener('pointerdown',e=>{
    if (e.button!==0 || e.isPrimary===false || pointer || overlay || deleting) return;
    e.preventDefault();
    pointer={id:e.pointerId,x:e.clientX,y:e.clientY};boardEl.setPointerCapture(e.pointerId);boardEl.focus({preventScroll:true});
  });
  boardEl.addEventListener('pointermove',e=>{
    if(pointer && pointer.id===e.pointerId)e.preventDefault();
  });
  boardEl.addEventListener('pointerup',e=>{
    if(!pointer || pointer.id!==e.pointerId)return;
    e.preventDefault();
    const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;pointer=null;
    const threshold=Math.max(22,boardEl.clientWidth*.07);
    if(Math.max(Math.abs(dx),Math.abs(dy))<threshold)return;
    applyMove(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'));
  });
  boardEl.addEventListener('pointercancel',()=>{pointer=null;});
  boardEl.addEventListener('lostpointercapture',e=>{if(pointer && pointer.id===e.pointerId)pointer=null;});
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){
      if(deleting)setDelete(false);
      else if(overlay==='restart'){hideOverlay();boardEl.focus({preventScroll:true});checkEnd();}
      return;
    }
    const direction={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',a:'left',d:'right',w:'up',s:'down'}[e.key] || {KeyA:'left',KeyD:'right',KeyW:'up',KeyS:'down'}[e.code];
    if(!direction || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey)return;
    const target=e.target;
    if(target!==boardEl && target!==document.body)return;
    const rect=boardEl.getBoundingClientRect();if(target===document.body && (rect.bottom<0 || rect.top>innerHeight))return;
    e.preventDefault();applyMove(direction);
  });
  warmStyle(skin);
  const idle=window.requestIdleCallback || (callback=>setTimeout(callback,250));
  idle(()=>{warmStyle('classic');warmStyle('aurora');});
  renderTiles();updateUI();
})();
