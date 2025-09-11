/* app.ui.view.js — Mistakes: no counters in title or flag */
(function(){
  const App = window.App, D = App.DOM;

  // ─────────────────────────────────────────────────────────────
  // Мотивация
  function showMotivation(type){
    const box = document.getElementById('motivationBox');
    if (!box) return;
    let phrase = '';
    try{
      if (App && App.Motivation && typeof App.Motivation.next === 'function'){
        phrase = App.Motivation.next(type);
      }
    }catch(e){}
    if (!phrase){
      try{
        const t = (typeof App.i18n === 'function') ? App.i18n() : null;
        const pool = (type === 'praise') ? (t && t.praise || []) : (t && t.encouragement || []);
        if (pool && pool.length) phrase = pool[(Math.random()*pool.length)|0];
      }catch(e){}
    }
    box.textContent = phrase || '';
    try{
      box.classList.remove('motivation-fade');
      void box.offsetWidth;
      box.classList.add('motivation-fade');
    }catch(e){}
  }
  // ─────────────────────────────────────────────────────────────

  function getActiveDeck(){
    if (App.Trainer && typeof App.Trainer.safeGetDeckSlice === 'function')
      return App.Trainer.safeGetDeckSlice(App.dictRegistry.activeKey) || [];
    if (App.Trainer && typeof App.Trainer.getDeckSlice === 'function'){
      const slice = App.Trainer.getDeckSlice(App.dictRegistry.activeKey) || [];
      if (slice && slice.length) return slice;
    }
    return App.Decks.resolveDeckByKey(App.dictRegistry.activeKey) || [];
  }

  function current(){
    const deck = getActiveDeck();
    if(!deck.length) return {id:-1,word:'',uk:'',ru:''};
    if (App.state.index<0 || App.state.index>=deck.length) App.state.index=0;
    return deck[App.state.index];
  }

  function decideModeForWord(w){
    const succ = App.state.successes[w.id] || 0;
    let reverse = (succ >= App.Trainer.unlockThreshold()) ? (Math.random() < 0.5) : false;
    try{
      if (App.Penalties){
        const p = App.Penalties.reverseProbFor(w.id);
        if (Math.random() < p) reverse = true;
      }
    }catch(e){}
    return reverse;
  }

  function renderStars(){
    const w = current(); 
    try{
      if (App.dictRegistry.activeKey==='mistakes' && App.Mistakes) App.Mistakes.onShow(w.id);
    }catch(e){} 
    const score = App.clamp(App.state.stars[w.id]||0,0,App.Trainer.starsMax());
    const host = D.starsEl; if(!host) return; host.innerHTML='';
    for(let i=0;i<App.Trainer.starsMax();i++){
      const s=document.createElement('span');
      s.className='starIcon'+(i<score?' filled':'');
      s.textContent='★';
      host.appendChild(s);
    }
  }

  function updateStats(){
    const t = App.i18n ? App.i18n() : { totalWords:'Всего слов', learned:'Выучено' };
    const key = (App.dictRegistry && App.dictRegistry.activeKey) || null;
    const fullDeck = (App.Decks && App.Decks.resolveDeckByKey) ? (App.Decks.resolveDeckByKey(key) || []) : [];
    const repeats = (App.Trainer && typeof App.Trainer.starsMax === 'function') ? App.Trainer.starsMax() : ((App.state && App.state.repeats) || 3);
    const starsMap = (App.state && App.state.stars) || {};
    let learned = 0;
    for (let i = 0; i < fullDeck.length; i++){
      const w = fullDeck[i];
      if ((starsMap[w.id] || 0) >= repeats) learned++;
    }
    if (App.DOM && App.DOM.statsBar){
      App.DOM.statsBar.textContent = `${t.totalWords}: ${fullDeck.length} / ${t.learned}: ${learned}`;
    } 
  }

  function drawOptions(correct,pool){
    const distractors = App.shuffle(pool).slice(0,3);
    const variants    = App.shuffle([correct,...distractors]);
    variants.forEach(v=>{
      const b=document.createElement('button');
      b.className='optionBtn';
      b.textContent=v;
      if(v===correct) b.dataset.correct='1';
      b.addEventListener('click',()=>onChoice(b,v===correct));
      D.optionsRow.appendChild(b);
    });
  }

  function addIDontKnowButton(){
    const t=App.i18n();
    const wrap=document.createElement('div');
    wrap.className='idkWrapper';
    const b=document.createElement('button');
    b.className='ghost';
    b.textContent=t.iDontKnow;
    b.addEventListener('click',onIDontKnow);
    wrap.appendChild(b);
    D.optionsRow.appendChild(wrap);
  }

  function renderCard(force=false){
    if(document.activeElement&&document.activeElement.blur) try{document.activeElement.blur();}catch(e){}
    const deck = getActiveDeck();
    if(!deck.length){
      if(D.wordEl) D.wordEl.textContent='—';
      if(D.hintEl) D.hintEl.textContent='—';
      if(D.optionsRow) D.optionsRow.innerHTML='';
      renderStars(); updateStats(); return;
    }
    if (force || App.state.index===App.state.lastIndex) App.state.index = App.Trainer.sampleNextIndexWeighted(deck);
    const w = current();
    if (App.state.lastShownWordId!==w.id){
      App.state.totals.shown+=1; App.state.lastShownWordId=w.id; App.state.lastSeen[w.id]=Date.now(); App.saveState();
    }
    const t=App.i18n();
    const isReverse=decideModeForWord(w);
    renderStars(); D.optionsRow.innerHTML='';
    if(!isReverse){
      if(D.wordEl) D.wordEl.textContent=w.word;
      const correct=(App.settings.lang==='ru')?w.ru:w.uk;
      const pool=deck.filter(x=>x.id!==w.id).map(x=>(App.settings.lang==='ru'?x.ru:x.uk));
      drawOptions(correct,pool);
    }else{
      if(D.wordEl) D.wordEl.textContent=(App.settings.lang==='ru')?w.ru:w.uk;
      const correct=w.word;
      const pool=deck.filter(x=>x.id!==w.id).map(x=>x.word);
      drawOptions(correct,pool);
    }
    if(D.hintEl) D.hintEl.textContent=t.choose;

    

if(D.favBtn){
  const dictKey = App.dictRegistry.activeKey;
  D.favBtn.textContent = (App.isFavorite && App.isFavorite(dictKey, w.id)) ? '♥' : '♡';
  D.favBtn.disabled = (App.dictRegistry.activeKey==='fav');
}


    addIDontKnowButton(); updateStats();
  }

  function onChoice(btn,correct){
    const w=current(); const cur=App.clamp(App.state.stars[w.id]||0,0,App.Trainer.starsMax());
    if(correct){
      showMotivation('praise');
      btn.classList.add('correct');
      D.optionsRow.querySelectorAll('button.optionBtn').forEach(b=>b.disabled=true);
      App.state.stars[w.id]=App.clamp(cur+1,0,App.Trainer.starsMax());
      App.state.successes[w.id]=(App.state.successes[w.id]||0)+1;
      App.saveState(); renderStars(); updateStats(); setTimeout(nextWord,500);
    }else{
      showMotivation('encouragement');
      btn.classList.add('wrong'); btn.disabled=true;
      App.state.stars[w.id]=App.clamp(cur-1,0,App.Trainer.starsMax());
      App.state.totals.errors+=1;
      App.saveState(); renderStars(); updateStats();
      // App.addToMistakesOnFailure && App.addToMistakesOnFailure(w);
    }
  }

  function addToMistakesOnFailure(word){
    try{ if (word && App.Mistakes) App.Mistakes.add(word.id); }catch(e){}
  }

  function onIDontKnow(){
    const w=current();
    showMotivation('encouragement');
    const c=D.optionsRow.querySelector('button.optionBtn[data-correct="1"]');
    if(c) c.classList.add('correct');
    D.optionsRow.querySelectorAll('button.optionBtn').forEach(b=>b.disabled=true);
    const cur=App.clamp(App.state.stars[w.id]||0,0,App.Trainer.starsMax());
    App.state.stars[w.id]=App.clamp(cur-1,0,App.Trainer.starsMax());
    App.state.totals.errors+=1;
    addToMistakesOnFailure(w);
    App.saveState(); renderStars(); updateStats();
    setTimeout(function(){ App.Sets.checkCompletionAndAdvance(); nextWord(); },700);
  }

  // === Sets UI & logic ===
  App.renderSetsBar = function(){
    const host = document.getElementById('setsBar');
    if (!host) return;
    host.innerHTML = '';
    const total = (App.Sets && App.Sets.setTotalCount) ? App.Sets.setTotalCount() : 1;
    const active = (App.Sets && App.Sets.getActiveSetIndex) ? App.Sets.getActiveSetIndex() : 0;
    for (let i=0;i<total;i++){
      const btn = document.createElement('button');
      btn.className = 'setTile' + (i===active?' active':'') + (App.Sets.isSetDone(i)?' done':'');
      btn.setAttribute('type','button');
      btn.setAttribute('aria-pressed', i===active ? 'true' : 'false');
      btn.textContent = (i+1);
      btn.addEventListener('click', ()=>{
        App.Sets.setActiveSetIndex(i);
        App.switchToSetImmediate();
      });
      host.appendChild(btn);
    }
  };

  App.switchToSetImmediate = function(){
    const bounds = App.Sets.activeBounds();
    if (App.state.index < bounds.start || App.state.index >= bounds.end){
      App.state.index = bounds.start;
    }
    renderCard(true);
    App.saveState && App.saveState();
  };

  function sampleIndexInActiveSet(){
    const deck = App.Decks.resolveDeckByKey(App.dictRegistry.activeKey) || [];
    const b = App.Sets.activeBounds();
    const sub = deck.slice(b.start, b.end);
    try{
      if (App.Penalties && sub.length){
        let sum = 0;
        const weights = sub.map(w=>{ const wt = Math.max(1, App.Penalties.weightFor(w.id)||1); sum += wt; return wt; });
        const r = Math.random() * sum;
        let acc = 0;
        for (let i=0;i<sub.length;i++){
          acc += weights[i];
          if (r <= acc) return b.start + i;
        }
      }
    }catch(e){}
    const nextLocal = App.Trainer.sampleNextIndexWeighted(sub);
    return b.start + nextLocal;
  }

  /* MOTIVATION ENGINE (non-repeating) */
  App.Motivation = App.Motivation || {};
  (function(M){
    const LS = 'motivation.seq.v1';
    function load(){ try{ return JSON.parse(localStorage.getItem(LS)||'{}'); }catch(e){ return {}; } }
    function save(s){ try{ localStorage.setItem(LS, JSON.stringify(s)); }catch(e){} }
    function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [a[i],a[j]]=[a[j],a[i]]; } return a; }
    function key(lang, mode){ return lang+'::'+mode; }
    M.next = function(mode){
      try{
        const t = (typeof App.i18n==='function') ? App.i18n() : null;
        const lang = t && t.lang ? t.lang : 'default';
        const pool = (mode==='praise') ? (t?.praise||[]) : (t?.encouragement||[]);
        if (!pool || !pool.length) return '';
        const st = load(); const k = key(lang, mode);
        if (!st[k] || !Array.isArray(st[k].order) || st[k].ver!==pool.length){
          st[k] = { order: shuffle(pool.map((_,i)=>i)), idx: 0, ver: pool.length };
        }
        const i = st[k].order[ st[k].idx % st[k].order.length ];
        st[k].idx = (st[k].idx + 1) % st[k].order.length;
        save(st);
        return String(pool[i]||'');
      }catch(e){ return ''; }
    };
  })(App.Motivation);

  function nextWord(){
    App.state.lastIndex=App.state.index;
    const deck=getActiveDeck();
    App.state.index=App.Trainer.sampleNextIndexWeighted(deck);
    App.state.index = sampleIndexInActiveSet();
    renderCard(true);
  }

  

function toggleFav(){
  const w = current();
  const dictKey = App.dictRegistry.activeKey;
  App.toggleFavorite && App.toggleFavorite(dictKey, w.id);
  if(D.favBtn){
    D.favBtn.textContent = (App.isFavorite && App.isFavorite(dictKey, w.id)) ? '♥' : '♡';
    D.favBtn.style.transform='scale(1.2)';
    setTimeout(()=>{D.favBtn.style.transform='scale(1)';},140);
  }
  renderDictList(); App.renderSetsBar();
}
  renderDictList(); App.renderSetsBar();
}
    renderDictList(); App.renderSetsBar();
  }

  

function canShowFav(){
  try{
    App.migrateFavoritesToV2 && App.migrateFavoritesToV2();
    const v2 = (App.state && App.state.favorites_v2) || {};
    let cnt = 0;
    Object.keys(v2).forEach(k=>{ cnt += Object.keys(v2[k]||{}).filter(x=>v2[k][x]).length; });
    return cnt >= 4;
  }catch(e){ return false; }
}
;
    let cnt = 0;
    Object.keys(v2).forEach(k=>{ cnt += Object.keys(v2[k]||{}).filter(x=>v2[k][x]).length; });
    return cnt >= 4;
  }catch(e){ return false; }
}


  // === makeDictRow: без количества для "Мои ошибки" и без числа в флаге
  function makeDictRow(key){
    const words=App.Decks.resolveDeckByKey(key)||[];

    const row=document.createElement('div'); 
    row.className='dictRow'+(key===App.dictRegistry.activeKey?' active':''); 
    row.dataset.key=key;

    const flag=document.createElement('div'); 
    flag.className='dictFlag'; 
    if (key === 'mistakes') {
      flag.textContent = '⚠️';     // ← только иконка, без числа
    } else {
      flag.textContent = App.Decks.flagForKey(key,words);
    }

    const name=document.createElement('div'); 
    name.className='dictName';
    if (key === 'mistakes') {
      const t = (typeof App.i18n === 'function') ? App.i18n() : null;
      name.textContent = (t && t.mistakesName) ? t.mistakesName : 'Мои ошибки';
    } else {
      name.textContent = App.Decks.resolveNameByKey(key);
    }
    name.title=name.textContent;

    const actions=document.createElement('div'); 
    actions.className='dictActions';

    const prevBtn=document.createElement('button'); 
    prevBtn.className='iconOnly'; 
    prevBtn.title=App.i18n().ttPreview; 
    prevBtn.textContent='👁️';
    prevBtn.addEventListener('click',(e)=>{e.stopPropagation(); App.Decks.openPreview(words,name.textContent);});
    actions.appendChild(prevBtn);

    

if (key === 'fav' || key === 'favorites') {
  const delBtn = document.createElement('button');
  delBtn.className = 'iconOnly';
  delBtn.title = (App.settings.lang === 'ru') ? 'Очистить «Избранное»' : 'Очистити «Обране»';
  delBtn.textContent = '🗑️';
  delBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const msg = (App.settings.lang === 'ru')
      ? 'Очистить «Избранное»? Это действие нельзя отменить.'
      : 'Очистити «Обране»? Дію не можна скасувати.';
    if (!confirm(msg)) return;
    App.clearFavoritesAll && App.clearFavoritesAll();
    App.dictRegistry.activeKey = App.Decks.pickDefaultKey();
    App.saveDictRegistry();
    renderDictList(); App.renderSetsBar(); renderCard(true); updateStats();
  });
  actions.appendChild(delBtn);
}
);
  actions.appendChild(delBtn);
}
;
        App.saveState();
        const nounKey = Object.keys(App.Decks.builtinKeys ? App.Decks.builtinKeys() : [])
          .find(k => App.Decks.resolveNameByKey(k) === (App.settings.lang === 'ru' ? 'Существительные' : 'Іменники'));
        App.dictRegistry.activeKey = nounKey || App.Decks.pickDefaultKey();
        App.saveDictRegistry();
        renderDictList(); App.renderSetsBar(); renderCard(true); updateStats();
      });
      actions.appendChild(delBtn);
    }

    row.appendChild(flag); 
    row.appendChild(name); 
    row.appendChild(actions);

    row.addEventListener('click',()=>{
      if (row.classList.contains('disabled')) return;
      App.dictRegistry.activeKey=key; App.saveDictRegistry();
      App.state.index=0; App.state.lastIndex=-1;
      renderDictList(); App.renderSetsBar(); renderCard(true); updateStats();
    });

    return row;
  }

  function renderDictList(){
    function appendMistakesRowFirst(host){
      try{
        const row = makeDictRow('mistakes');
        if (!row) return;
        host.appendChild(row);
        let cnt = 0;
        if (App.Mistakes && typeof App.Mistakes.count === 'function'){
          cnt = App.Mistakes.count();
        }
        if (cnt < 4){
          row.classList.add('disabled');
          row.setAttribute('aria-disabled','true');
          row.addEventListener('click', function(e){
            e.preventDefault();
            e.stopPropagation();
            try{
              const t = (typeof App.i18n==='function') ? App.i18n() : null;
              const msg = t && t.needMoreMistakes ? t.needMoreMistakes.replace('{n}', String(4-cnt)) : 'Добавьте ещё '+(4-cnt)+' слов с ошибками для активации';
              const box = document.getElementById('motivationBox');
              if (box){
                box.textContent = msg;
                box.classList.remove('motivation-fade'); void box.offsetWidth; box.classList.add('motivation-fade');
              }
            }catch(_){}
          }, {capture:true});
        }
      }catch(e){}
    }

    const host=D.dictListHost; if(!host) return; host.innerHTML='';
    appendMistakesRowFirst(host);
    if (canShowFav()) host.appendChild(makeDictRow('fav'));
    for (const k of App.Decks.builtinKeys()) host.appendChild(makeDictRow(k));
    for (const k of Object.keys(App.dictRegistry.user||{})) host.appendChild(makeDictRow(k));
  }

  function applyLang(){
    const t=App.i18n();
    if (D.titleEl&&D.titleEl.firstChild) D.titleEl.firstChild.textContent=t.appTitle+' ';
    if (D.appVerEl) D.appVerEl.textContent='v'+App.APP_VER;
    if (D.taglineEl) D.taglineEl.textContent=t.tagline;
    if (D.dictsBtn) D.dictsBtn.title = t.dictsHeader;
    renderDictList(); App.renderSetsBar(); updateStats();
  }

  function openModal(){ if(D.modal) D.modal.classList.remove('hidden'); }
  function closeModal(){
    try{
      const box=document.getElementById('motivationBox');
      if (box){
        const t=(typeof App.i18n==='function')?App.i18n():null;
        const patt = t && t.needMoreMistakes ? t.needMoreMistakes.replace('{n}','').trim() : '';
        if (patt && box.textContent && box.textContent.indexOf(patt)===0){
          box.textContent=''; box.classList.remove('motivation-fade');
        }
      }
    }catch(e){}
    if(D.modal) D.modal.classList.add('hidden');
  }

  function bindHeaderButtons(){
    if (D.langToggleBtn){
      D.langToggleBtn.addEventListener('click',()=>{
        App.settings.lang = (App.settings.lang==='ru') ? 'uk' : 'ru';
        D.langToggleBtn.textContent = (App.settings.lang==='ru') ? '🇷🇺' : '🇺🇦';
        App.saveSettings(App.settings); 
        applyLang(); 
        App.applyTheme();
        showMotivation('encouragement');
        renderCard(true);
      });
    }
    if (D.themeToggleBtn){
      const updateIcon=()=>{ const mode=document.documentElement.getAttribute('data-theme'); D.themeToggleBtn.textContent = (mode==='dark')?'🌙':'🌞'; };
      D.themeToggleBtn.addEventListener('click',()=>{
        const cur=document.documentElement.getAttribute('data-theme')||'light';
        const next = (cur==='dark')?'light':'dark';
        App.settings.theme=next; App.saveSettings(App.settings); App.applyTheme(); updateIcon();
      });
      updateIcon();
    }
    if (D.dictsBtn){
      D.dictsBtn.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); openModal(); });
    }
    if (D.okBtn){ D.okBtn.addEventListener('click',()=>{ closeModal(); }); }
    if (D.backdrop){ D.backdrop.addEventListener('click',()=>{ closeModal(); }); }
    if (D.favBtn){ D.favBtn.addEventListener('click', toggleFav); }
  }

  const _origBootstrap = App.bootstrap;
  App.bootstrap = function(){
    
    
    try{ App.migrateFavoritesToV2 && App.migrateFavoritesToV2(); }catch(e){}
try{ App.migrateFavoritesToV2 && App.migrateFavoritesToV2(); }catch(e){}
_origBootstrap();
    if (!App.dictRegistry.activeKey){
      App.dictRegistry.activeKey = App.Decks.pickDefaultKey(); App.saveDictRegistry();
    }
    applyLang(); App.applyTheme(); App.scheduleThemeTick();
    bindHeaderButtons();
    renderCard(true);
  };

})();
