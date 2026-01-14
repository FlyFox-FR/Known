/* Simple single-file app logic (vanilla JS).
   Stores everything in localStorage under "microlearn:v1".
   Supports: deck CRUD, card CRUD, import/export JSON, swipe (touch+mouse), flip.
*/

const STORAGE_KEY = 'microlearn:v1';

const SAMPLE = {
  deck: {
    id: 'deck-sample-1',
    title: 'Schnelle Tech‑Facts',
    description: 'Kurze Fakten zu Programmierung & Web',
    language: 'de-DE',
    tags: ['tech','grundlagen'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    authorId: 'local'
  },
  cards: [
    {
      id: 'card-1',
      deckId: 'deck-sample-1',
      type: 'fact',
      front: 'Was ist der Unterschied zwischen HTTP und HTTPS?',
      back: 'HTTPS ist HTTP über TLS/SSL — es verschlüsselt die Verbindung, so dass Daten nicht einfach mitgelesen oder verändert werden können.',
      tags: ['netzwerk','security'],
      difficulty: 'easy',
      estimatedSeconds: 30,
      locale: 'de-DE',
      createdAt: new Date().toISOString(),
      meta: { version:1, aiGenerated:false }
    },
    {
      id: 'card-2',
      deckId: 'deck-sample-1',
      type: 'fact',
      front: 'Nenne drei HTTP‑Methoden',
      back: 'GET, POST, PUT (es gibt noch DELETE, PATCH, OPTIONS usw.)',
      tags: ['http'],
      difficulty: 'easy',
      estimatedSeconds: 20,
      locale: 'de-DE',
      createdAt: new Date().toISOString(),
      meta: { version:1, aiGenerated:false }
    }
  ]
};

let state = { decks: [], cards: [], currentDeckId: null, index: 0, stats: {} };

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      state = JSON.parse(raw);
      if (!state.decks) throw 0;
      return;
    } catch (e) {
      console.warn('invalid storage, resetting');
    }
  }
  // seed with sample
  state = { decks: [SAMPLE.deck], cards: SAMPLE.cards.slice(), currentDeckId: SAMPLE.deck.id, index:0, stats: {} };
  saveState();
}

function qs(sel){return document.querySelector(sel)}
function qsa(sel){return Array.from(document.querySelectorAll(sel))}

function renderDeckSelect() {
  const sel = qs('#deckSelect');
  sel.innerHTML = '';
  state.decks.forEach(d=>{
    const opt = document.createElement('option');
    opt.value = d.id;
    opt.textContent = d.title;
    sel.appendChild(opt);
  });
  if (state.currentDeckId) sel.value = state.currentDeckId;
  sel.onchange = e => {
    state.currentDeckId = e.target.value;
    state.index = 0;
    saveState();
    render();
  };
}

function currentDeck(){ return state.decks.find(d=>d.id===state.currentDeckId) || state.decks[0] }

function deckCards(deckId){
  return state.cards.filter(c=>c.deckId===deckId);
}

function renderDeckInfo(){
  const info = qs('#deckInfo');
  const deck = currentDeck();
  if (!deck){ info.innerHTML='Kein Deck'; return; }
  const cards = deckCards(deck.id);
  info.innerHTML = `<strong>${escapeHtml(deck.title)}</strong><p>${escapeHtml(deck.description||'')}</p><small>${cards.length} Cards · ${deck.tags?.join(',')||''}</small>`;
}

function renderStats(){
  const s = qs('#stats');
  s.innerHTML = `<div>Known: ${state.stats.known||0} · Skipped: ${state.stats.skipped||0}</div>`;
}

function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }

function createCardElement(card){
  const tmpl = document.querySelector('#cardTemplate').content.cloneNode(true);
  const el = tmpl.querySelector('.card');
  const front = el.querySelector('.card-front');
  const back = el.querySelector('.card-back');
  front.innerHTML = markdownToSimpleHtml(card.front);
  back.innerHTML = markdownToSimpleHtml(card.back);
  el.dataset.id = card.id;
  // flip toggle
  el.addEventListener('click', (ev)=>{
    // only flip on short tap/click
    if (ev.detail && ev.detail>1) return;
    el.classList.toggle('flipped');
  });
  // long press to edit
  el.addEventListener('contextmenu', (e)=>{ e.preventDefault(); openEditCard(card); });
  return el;
}

function markdownToSimpleHtml(md){
  // keep it very simple: line breaks -> <br>, **bold**
  if (!md) return '';
  return escapeHtml(md).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');
}

function renderCardStack(){
  const stack = qs('#cardStack');
  stack.innerHTML = '';
  const deck = currentDeck();
  if (!deck) return;
  const cards = deckCards(deck.id);
  if (cards.length===0){
    stack.innerHTML = `<div class="card"><div class="card-inner"><div class="card-front">Keine Cards. + Card drücken, um zu starten.</div></div></div>`;
    return;
  }
  // show from current index
  const visible = cards.slice(state.index, state.index+3);
  visible.reverse().forEach((card, i)=>{
    const el = createCardElement(card);
    el.style.zIndex = 100 - i;
    el.style.transform = `scale(${1 - i*0.03}) translateY(${i*8}px)`;
    // attach swipe handlers
    attachPointerSwipe(el, card);
    qs('#cardStack').appendChild(el);
  });
}

function attachPointerSwipe(el, card){
  let startX=0, startY=0, dragging=false;
  el.style.transition = 'transform 220ms ease';
  el.addEventListener('pointerdown', e=>{
    dragging=true;
    el.setPointerCapture(e.pointerId);
    startX = e.clientX;
    startY = e.clientY;
    el.style.transition = 'none';
  });
  el.addEventListener('pointermove', e=>{
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    el.style.transform = `translate(${dx}px, ${dy}px) rotate(${dx/12}deg)`;
  });
  el.addEventListener('pointerup', e=>{
    if (!dragging) return;
    dragging=false;
    el.releasePointerCapture(e.pointerId);
    el.style.transition = 'transform 220ms ease';
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 100){
      const known = dx > 0;
      // animate out
      el.style.transform = `translate(${dx>0?800:-800}px, 0) rotate(${dx>0?20:-20}deg)`;
      setTimeout(()=> {
        if (known) markKnown(card.id); else markSkipped(card.id);
        state.index = Math.min(state.index + 1, deckCards(state.currentDeckId).length-1);
        saveState();
        render();
      }, 180);
    } else {
      // reset
      el.style.transform = '';
    }
  });
  // also support keyboard buttons via actions
}

function markKnown(cardId){
  state.stats.known = (state.stats.known||0) + 1;
}

function markSkipped(cardId){
  state.stats.skipped = (state.stats.skipped||0) + 1;
}

function bindActions(){
  qs('#flipBtn').onclick = ()=>{
    const top = qs('#cardStack .card');
    if (top) top.classList.toggle('flipped');
  };
  qs('#skipBtn').onclick = ()=> {
    const cards = deckCards(state.currentDeckId);
    if (state.index < cards.length) {
      markSkipped(cards[state.index].id);
      state.index = Math.min(state.index+1, cards.length-1);
      saveState(); render();
    }
  };
  qs('#knowBtn').onclick = ()=> {
    const cards = deckCards(state.currentDeckId);
    if (state.index < cards.length) {
      markKnown(cards[state.index].id);
      state.index = Math.min(state.index+1, cards.length-1);
      saveState(); render();
    }
  };

  qs('#newDeckBtn').onclick = ()=>{
    const title = prompt('Neues Deck Name:');
    if (!title) return;
    const id = 'deck-'+Date.now();
    const deck = { id, title, description:'', tags:[], createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(), language:'de-DE' };
    state.decks.push(deck);
    state.currentDeckId = id;
    state.index = 0;
    saveState(); render();
  };

  qs('#newCardBtn').onclick = ()=>{
    openNewCard();
  };

  qs('#exportBtn').onclick = ()=> {
    const deck = currentDeck();
    if (!deck) return alert('Kein Deck ausgewählt');
    const cards = deckCards(deck.id);
    const payload = { deck, cards };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${deck.title.replace(/\s+/g,'_')}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  qs('#importBtn').onclick = ()=> qs('#fileInput').click();
  qs('#fileInput').addEventListener('change', (e)=>{
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev)=>{
      try {
        const json = JSON.parse(ev.target.result);
        if (json.deck && Array.isArray(json.cards)){
          // add deck (ensure id unique)
          const id = json.deck.id || ('deck-' + Date.now());
          json.deck.id = id;
          json.cards.forEach(c=> c.deckId = id);
          state.decks.push(json.deck);
          state.cards.push(...json.cards);
          state.currentDeckId = id;
          state.index = 0;
          saveState(); render();
          alert('Deck importiert');
        } else {
          alert('Ungültiges Deck JSON');
        }
      } catch (err){
        alert('Fehler beim Lesen der Datei');
      }
    };
    reader.readAsText(f);
    e.target.value = '';
  });

  // modal handlers
  qs('#cancelBtn').onclick = ()=> closeModal();
  qs('#modalForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    const front = qs('#frontInput').value.trim();
    const back = qs('#backInput').value.trim();
    const tags = qs('#tagsInput').value.split(',').map(s=>s.trim()).filter(Boolean);
    if (!front || !back) return alert('Front & Back erforderlich');
    const editingId = qs('#modal').dataset.editing;
    if (editingId){
      // update
      const c = state.cards.find(x=>x.id===editingId);
      if (c){ c.front = front; c.back = back; c.tags = tags; c.updatedAt = new Date().toISOString(); }
    } else {
      const id = 'card-'+Date.now();
      const card = { id, deckId: state.currentDeckId, type:'fact', front, back, tags, createdAt:new Date().toISOString(), meta:{version:1,aiGenerated:false} };
      state.cards.push(card);
    }
    saveState();
    closeModal(); render();
  });
}

function openNewCard(){
  if (!state.currentDeckId) return alert('Wähle zuerst ein Deck');
  qs('#modalTitle').textContent = 'Neue Card';
  qs('#frontInput').value = '';
  qs('#backInput').value = '';
  qs('#tagsInput').value = '';
  qs('#modal').dataset.editing = '';
  qs('#modal').classList.remove('hidden');
}

function openEditCard(card){
  qs('#modalTitle').textContent = 'Card bearbeiten';
  qs('#frontInput').value = card.front || '';
  qs('#backInput').value = card.back || '';
  qs('#tagsInput').value = (card.tags||[]).join(',');
  qs('#modal').dataset.editing = card.id;
  qs('#modal').classList.remove('hidden');
}

function closeModal(){ qs('#modal').classList.add('hidden'); qs('#modal').dataset.editing = ''; }

function render(){
  renderDeckSelect();
  renderDeckInfo();
  renderCardStack();
  renderStats();
}

function setupKeyboardShortcuts(){
  window.addEventListener('keydown', (e)=>{
    if (e.code==='ArrowLeft') qs('#skipBtn').click();
    if (e.code==='ArrowRight') qs('#knowBtn').click();
    if (e.code==='Space') { e.preventDefault(); qs('#flipBtn').click(); }
  });
}

function init(){
  loadState();
  bindActions();
  setupKeyboardShortcuts();
  render();
}

init();
