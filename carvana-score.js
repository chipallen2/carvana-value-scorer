// Carvana Value Scorer — paste this entire file into the console on Carvana search results
// MIT License
(() => {
  // Your target cost in dollars per 10,000 estimated remaining miles.
  const TARGET = 1400;
  // Expected total lifetime odometer reading, not additional miles from today.
  const MAX_MILES = 200000;

  const STORAGE_PREFIX = 'carvana-value-scorer:vehicle:';
  window.__chipScoreCleanup?.();
  document.querySelectorAll('.chip-car-tools, .chip-notes-dialog, #chip-car-styles').forEach(el => el.remove());
  const styles = document.createElement('style');
  styles.id = 'chip-car-styles';
  styles.textContent = `
    .chip-car-hidden > :not(.chip-car-tools) { opacity: .22 !important; filter: grayscale(1) !important; }
    .chip-car-tools { position:absolute; top:8px; right:44px; display:flex; gap:6px; z-index:100000; }
    .chip-car-tools button { display:grid; place-items:center; width:32px; height:32px; padding:5px; border:1px solid #cbd5e1; border-radius:50%; background:white; color:#334155; cursor:pointer; box-shadow:0 1px 4px #0002; }
    .chip-car-tools button[data-has-notes="true"] { position:relative; background:#f1f3f5; border-color:#cbd0d5; color:#525960; }
    .chip-car-tools button[data-has-notes="true"]::after { content:""; position:absolute; top:2px; right:2px; width:5px; height:5px; border-radius:50%; background:#6b7280; box-shadow:0 0 0 2px #f1f3f5; pointer-events:none; }
    .chip-car-tools button[aria-pressed="true"] { background:#fafafa; border-color:#d9dde1; color:#737980; box-shadow:none; }
    .chip-car-tools button:focus-visible { outline:2px solid #737980; outline-offset:2px; }
    .chip-notes-dialog button:focus-visible { outline:3px solid #60a5fa; outline-offset:2px; }
    .chip-notes-dialog { box-sizing:border-box; position:fixed; inset:0; margin:auto; width:min(440px, calc(100vw - 32px)); max-height:90vh; overflow:auto; padding:24px; border:0; border-radius:14px; background:white; color:#172033; box-shadow:0 20px 70px #0005; font:16px/1.5 system-ui,sans-serif; }
    .chip-notes-dialog::backdrop { background:rgb(15 23 42 / .5); }
    .chip-notes-dialog h2 { margin:0 32px 16px 0; font-size:21px; }
    .chip-notes-dialog textarea { display:block; box-sizing:border-box; width:100%; min-height:150px; margin:8px 0 16px; padding:10px; border:1px solid #94a3b8; border-radius:6px; background:white; color:#172033; font:inherit; resize:vertical; }
    .chip-notes-dialog button { padding:8px 16px; border:1px solid #cbd5e1; border-radius:6px; background:white; color:#172033; font:inherit; cursor:pointer; }
    .chip-notes-dialog .chip-close { position:absolute; top:12px; right:12px; padding:2px 10px; font-size:24px; }
    .chip-notes-dialog .chip-save { background:#1d4ed8; border-color:#1d4ed8; color:white; }
    .chip-notes-dialog .chip-dialog-actions { display:flex; justify-content:flex-end; gap:8px; }
    .chip-notes-dialog .chip-error { color:#b91c1c; }
  `;
  document.head.appendChild(styles);

  const readVehicle = id => {
    const raw = localStorage.getItem(STORAGE_PREFIX + id);
    const record = raw ? JSON.parse(raw) : {};
    if (!record || typeof record !== 'object' || Array.isArray(record)) throw new Error('Invalid saved vehicle data');
    return { notes: typeof record.notes === 'string' ? record.notes : '', hidden: record.hidden === true };
  };
  const writeVehicle = (id, update) => {
    const record = { ...readVehicle(id), ...update };
    localStorage.setItem(STORAGE_PREFIX + id, JSON.stringify(record));
  };
  const icon = (button, kind) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(svg.namespaceURI, 'path');
    path.setAttribute('d', kind === 'notes' ? 'M21 11.5a8.5 8.5 0 0 1-8.5 8.5H3l2-5a8.5 8.5 0 1 1 16-3.5ZM8 10h8M8 14h5' : kind === 'restore' ? 'M4 10a8 8 0 1 1 1 9M4 4v6h6' : 'M6 6l12 12M18 6 6 18');
    svg.appendChild(path);
    button.replaceChildren(svg);
  };
  const button = (label, className) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = className;
    el.title = label;
    el.setAttribute('aria-label', label);
    return el;
  };
  let activeDialog;
  const openNotes = (id, trigger) => {
    activeDialog?.close();
    const dialog = document.createElement('dialog');
    activeDialog = dialog;
    dialog.className = 'chip-notes-dialog';
    dialog.setAttribute('aria-labelledby', 'chip-notes-title');
    const heading = document.createElement('h2');
    heading.id = 'chip-notes-title';
    heading.textContent = 'Vehicle Notes';
    const close = button('Close notes', 'chip-close');
    close.textContent = '×';
    const input = document.createElement('textarea');
    input.id = 'chip-notes-text';
    input.setAttribute('aria-label', 'Vehicle Notes');
    input.placeholder = 'What do you want to remember about this car?';
    const error = document.createElement('p');
    error.className = 'chip-error';
    error.setAttribute('role', 'alert');
    error.hidden = true;
    const actions = document.createElement('div');
    actions.className = 'chip-dialog-actions';
    const cancel = button('Cancel', 'chip-cancel');
    cancel.textContent = 'Cancel';
    const save = button('Save notes', 'chip-save');
    save.textContent = 'Save';
    save.title = 'Save (Ctrl+Enter or Command+Enter)';
    save.setAttribute('aria-keyshortcuts', 'Control+Enter Meta+Enter');
    const showError = message => { error.textContent = message; error.hidden = false; };
    try { input.value = readVehicle(id).notes; }
    catch { showError('Saved notes could not be read. Check that browser storage is available.'); save.disabled = true; }
    close.onclick = cancel.onclick = () => dialog.close();
    save.onclick = () => {
      try {
        writeVehicle(id, { notes: input.value });
        addScores();
        dialog.close();
      } catch { showError('Could not save your notes. Browser storage may be blocked or full. Your text is still here.'); }
    };
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !event.isComposing) {
        event.preventDefault();
        if (!event.repeat) save.click();
      }
    });
    dialog.addEventListener('close', () => {
      dialog.remove();
      if (activeDialog === dialog) activeDialog = null;
      if (trigger.isConnected) trigger.focus();
    }, { once: true });
    actions.append(cancel, save);
    dialog.append(heading, close, input, error, actions);
    document.body.appendChild(dialog);
    dialog.showModal();
    input.focus();
  };
  const updateTools = (card, id) => {
    let toolbar = card.querySelector(':scope > .chip-car-tools');
    if (toolbar && toolbar.dataset.vehicle !== id) { toolbar.remove(); toolbar = null; }
    if (!toolbar) {
      if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
      toolbar = document.createElement('div');
      toolbar.className = 'chip-car-tools';
      toolbar.dataset.vehicle = id;
      toolbar.setAttribute('role', 'group');
      toolbar.setAttribute('aria-label', 'Vehicle notes and visibility');
      toolbar.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); });
      const notes = button('Add notes', 'chip-notes-button');
      icon(notes, 'notes');
      notes.onclick = () => openNotes(id, notes);
      const hide = button('Hide car', 'chip-hide-button');
      hide.onclick = () => {
        try { writeVehicle(id, { hidden: !readVehicle(id).hidden }); addScores(); }
        catch { window.alert('Could not save this change. Browser storage may be blocked or full.'); }
      };
      toolbar.append(notes, hide);
      card.appendChild(toolbar);
    }
    // Match the 38px center-to-center spacing of our buttons, ignoring the heart's wider hit area.
    const heart = [...card.querySelectorAll('button, [role="button"]')].find(el =>
      !toolbar.contains(el) && /favorite|favourite|wishlist|heart|save vehicle|save car/i.test(
        [el.getAttribute('aria-label'), el.getAttribute('title'), el.getAttribute('data-testid')].filter(Boolean).join(' ')
      )
    );
    if (heart) {
      const box = heart.getBoundingClientRect(), bounds = card.getBoundingClientRect();
      if (box.width && box.height) {
        const heartCenter = box.left + box.width / 2;
        toolbar.style.right = `${Math.max(8, bounds.right - heartCenter + 22)}px`;
        toolbar.style.top = `${Math.max(8, box.top - bounds.top)}px`;
      }
    } else { toolbar.style.right = '44px'; toolbar.style.top = '8px'; }
    let record;
    try { record = readVehicle(id); } catch { record = { notes: '', hidden: false }; }
    card.classList.toggle('chip-car-hidden', record.hidden);
    const notes = toolbar.querySelector('.chip-notes-button');
    const hasNotes = Boolean(record.notes.trim());
    notes.dataset.hasNotes = String(hasNotes);
    notes.title = hasNotes ? 'Edit saved notes' : 'Add notes';
    notes.setAttribute('aria-label', notes.title);
    const hide = toolbar.querySelector('.chip-hide-button');
    const state = String(record.hidden);
    if (hide.getAttribute('aria-pressed') !== state) icon(hide, record.hidden ? 'restore' : 'hide');
    hide.setAttribute('aria-pressed', state);
    hide.title = record.hidden ? 'Unhide car' : 'Hide car';
    hide.setAttribute('aria-label', hide.title);
  };
  const onStorage = event => { if (event.key === null || event.key.startsWith(STORAGE_PREFIX)) addScores(); };
  window.addEventListener('storage', onStorage);
  window.__chipScoreCleanup = () => { window.removeEventListener('storage', onStorage); activeDialog?.close(); };

clearTimeout(window.__chipScoreTimer);window.__chipScoreObserver?.disconnect();document.querySelectorAll('.chip-value-score').forEach(b=>b.remove());const money=n=>'$'+Math.round(n).toLocaleString('en-US');const addScores=()=>{document.querySelectorAll('a[href*="/vehicle/"]').forEach(a=>{const card=a.parentElement;if(!card)return;const vehicleId=a.getAttribute('href')?.match(/\/vehicle\/([^/?#]+)/)?.[1];if(vehicleId)updateTools(card,vehicleId);const priceNode=card.querySelector('[data-testid="price"] > span:not(.sr-only)');if(!priceNode)return;const shown=priceNode.textContent.trim(),vehicle=a.getAttribute('href').split('?')[0];if(priceNode.dataset.chipVehicle!==vehicle||shown!==priceNode.dataset.chipRendered){priceNode.dataset.chipBase=shown.replace(/[^0-9.]/g,'');priceNode.dataset.chipVehicle=vehicle}card.querySelectorAll('[data-testid="discount-wrapper"],[data-testid="terms-and-shipping-wrapper"],[data-testid="deal-tags-wrapper"]').forEach(el=>el.style.setProperty('display','none','important'));const text=card.innerText||'',mm=text.match(/([\d,.]+)\s*([kK])?\s*miles/i),pm=text.match(/Current price:\s*\$\s*([\d,]+)/i)||text.match(/\$\s*([\d,]+)/);let badge=card.querySelector(':scope > .chip-value-score');if(!mm||!pm){badge?.remove();return}const mileage=parseFloat(mm[1].replace(/,/g,''))*(mm[2]?1000:1),price=Number(priceNode.dataset.chipBase),remaining=MAX_MILES-mileage;if(!Number.isFinite(price)||!Number.isFinite(mileage)||remaining<=0){badge?.remove();return}const shippingText=card.querySelector('[data-testid="shipping-cost"]')?.textContent||text,sm=shippingText.match(/\$\s*([\d,]+(?:\.\d{2})?)\s*shipping\b/i),shipping=sm?Number(sm[1].replace(/,/g,'')):/free\s+shipping/i.test(shippingText)?0:null;if(shipping===null){badge?.remove();if(priceNode.dataset.chipRendered===shown)priceNode.textContent=money(price);priceNode.removeAttribute('title');a.removeAttribute('title');delete priceNode.dataset.chipRendered;return}const total=price+shipping,display=money(total)+(shipping>0?'*':''),tooltip=money(price)+' vehicle price + '+money(shipping)+' shipping = '+money(total)+'. Shipping included once. Taxes and other fees excluded.';priceNode.dataset.chipRendered=display;if(priceNode.textContent!==display)priceNode.textContent=display;if(shipping>0){priceNode.title=tooltip;a.title=tooltip}else{priceNode.removeAttribute('title');a.removeAttribute('title')}const score=(price+shipping)/remaining*10000,pct=(score/TARGET-1)*100,rounded=Math.round(pct),label=(rounded>0?'+':'')+rounded+'%',color=rounded<0?'#1d4ed8':rounded===0?'#15803d':pct<=10?'#3f6212':pct<=20?'#854d0e':pct<=30?'#9a3412':'#991b1b';if(!badge){if(getComputedStyle(card).position==='static')card.style.position='relative';badge=document.createElement('div');badge.className='chip-value-score';Object.assign(badge.style,{position:'absolute',top:'8px',left:'8px',zIndex:'99999',background:'#111',color:'#fff',padding:'0',borderRadius:'7px',font:'700 15px/1.15 system-ui,-apple-system,sans-serif',boxShadow:'0 2px 8px rgba(0,0,0,.35)',pointerEvents:'none',letterSpacing:'.1px'});card.appendChild(badge)}const key=label+'|'+money(score)+'|'+color;if(badge.dataset.scoreKey!==key){const wrap=document.createElement('span');Object.assign(wrap.style,{display:'inline-flex',alignItems:'baseline',gap:'8px',background:color,padding:'7px 10px',borderRadius:'7px'});const main=document.createElement('span');main.textContent=label;main.style.fontSize='22px';const sub=document.createElement('span');sub.textContent=money(score);Object.assign(sub.style,{fontSize:'12px',fontWeight:'500'});wrap.append(main,sub);badge.replaceChildren(wrap);badge.dataset.scoreKey=key}const description=money(price)+' price + '+money(shipping)+' shipping = '+money(price+shipping)+'; '+money(score)+' per 10,000 remaining miles; '+pct.toFixed(1)+'% versus '+money(TARGET)+' target. Negative is below target; positive is above. Lower is better.';badge.title=description;badge.setAttribute('aria-label',description)})};addScores();window.__chipScoreObserver=new MutationObserver(()=>{clearTimeout(window.__chipScoreTimer);window.__chipScoreTimer=setTimeout(addScores,150)});window.__chipScoreObserver.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['href']});return document.querySelectorAll('.chip-value-score').length+' badges added; target '+money(TARGET)+' per 10,000 miles'})()
