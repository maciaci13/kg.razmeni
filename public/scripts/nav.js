const screens = ['home','request','coord','coord','chat','radar','profile','safety','cause','share'];

function go(id) {
  if (id === 'match') id = 'coord';
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('on'));
  const s = document.getElementById('s-' + id);
  if (s) {
    s.classList.add('on');
    const app = s.querySelector('.app');
    if (app) app.scrollTop = 0;
  }
  document.querySelectorAll('.onb').forEach((b, i) => {
    b.classList.toggle('on', screens[i] === id);
  });
}

function sendMsg() {
  const input = document.getElementById('chat-in');
  if (!input || !input.value.trim()) return;
  const msgs = document.getElementById('chat-msgs');
  const g = document.createElement('div');
  g.className = 'msg-group me';
  g.innerHTML = `<div class="msg me">${input.value}</div><div class="msg-time" style="text-align:right">Сега</div>`;
  msgs.appendChild(g);
  input.value = '';
  g.scrollIntoView({ behavior: 'smooth' });
}

function toggleFolderMenu(e, btn) {
  e.stopPropagation();
  const pop = btn.nextElementSibling;
  const wasOpen = pop.classList.contains('open');
  document.querySelectorAll('.folder-menu-pop.open').forEach(p => p.classList.remove('open'));
  if (!wasOpen) pop.classList.add('open');
}

function toggleRequestForm(btn) {
  const wrap = btn.closest('.request-collapse');
  const body = wrap.querySelector('.request-collapse-body');
  const isOpen = wrap.classList.contains('open');
  if (isOpen) {
    body.style.maxHeight = body.scrollHeight + 'px';
    requestAnimationFrame(() => { body.style.maxHeight = '0px'; });
    wrap.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  } else {
    wrap.classList.add('open');
    body.style.maxHeight = body.scrollHeight + 'px';
    btn.setAttribute('aria-expanded', 'true');
    body.addEventListener('transitionend', function h(){ body.style.maxHeight=''; body.removeEventListener('transitionend', h); });
  }
}

function initNav() {
  document.querySelectorAll('.chip-row').forEach(row => {
    row.querySelectorAll('.chip-sel').forEach(chip => {
      chip.addEventListener('click', function() {
        row.querySelectorAll('.chip-sel').forEach(c => c.classList.remove('on'));
        this.classList.add('on');
      });
    });
  });

  document.querySelectorAll('.chk-row').forEach(row => {
    row.addEventListener('click', () => {
      const cb = row.querySelector('.chk-box');
      cb.classList.toggle('on');
      cb.innerHTML = cb.classList.contains('on')
        ? '<svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M2 6l3 3 5-5"/></svg>'
        : '';
    });
  });

  const sendBtn = document.getElementById('send-btn');
  const chatIn = document.getElementById('chat-in');
  if (sendBtn) sendBtn.addEventListener('click', sendMsg);
  if (chatIn) chatIn.addEventListener('keydown', e => { if (e.key === 'Enter') sendMsg(); });

  const deck = document.getElementById('folderDeck');
  if (deck) {
    const dots = [document.getElementById('dot0'), document.getElementById('dot1')];
    let startX = 0, isDragging = false, flipped = false;

    function flip() {
      flipped = !flipped;
      deck.classList.toggle('flipped', flipped);
      const front = flipped ? 0 : 1;
      dots.forEach((d, i) => d && d.classList.toggle('active', i === front));
    }

    deck.addEventListener('touchstart', e => { startX = e.touches[0].clientX; isDragging = true; }, {passive:true});
    deck.addEventListener('touchend', e => {
      if (!isDragging) return;
      if (Math.abs(e.changedTouches[0].clientX - startX) > 40) flip();
      isDragging = false;
    });
    deck.addEventListener('mousedown', e => { startX = e.clientX; isDragging = true; e.preventDefault(); });
    document.addEventListener('mouseup', e => {
      if (!isDragging) return;
      if (Math.abs(e.clientX - startX) > 40) flip();
      isDragging = false;
    });
    dots.forEach((dot, i) => {
      if (dot) dot.addEventListener('click', () => { if (i !== (flipped ? 0 : 1)) flip(); });
    });
  }

  document.addEventListener('click', () => {
    document.querySelectorAll('.folder-menu-pop.open').forEach(p => p.classList.remove('open'));
  });
}
