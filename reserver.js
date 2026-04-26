/* ============================================
   LAKAM — Reservation wizard
   ============================================ */

(() => {
  const FORMULES = {
    burger:       { name: 'Burger Night',        price: 49, min: 6 },
    signature:    { name: 'Menu Signature',      price: 75, min: 8 },
    mexican:      { name: 'Mexican Vibes',       price: 45, min: 8 },
    hotdog:       { name: 'Hot Dog & Co',        price: 39, min: 6 },
    tenders:      { name: 'Tenders Bar',         price: 35, min: 6 },
    'sweet-only': { name: 'Sweet Finish (seul)', price: 19, min: 10 },
  };
  const SWEET_ADDON_PRICE = 19;
  const DEPOSIT_RATE = 0.30;

  const wizard = document.getElementById('wizard');
  const panels = wizard.querySelectorAll('.step-panel');
  const progress = document.getElementById('progress');
  const progressSteps = progress.querySelectorAll('.progress-step');
  const totalSteps = panels.length;
  let currentStep = 1;

  const state = {
    formule: null,
    guests: null,
    date: null,
    addSweet: false,
    address: '', zip: '', city: '', access: '', kitchen: '',
    firstname: '', lastname: '', email: '', phone: '', message: '',
  };

  // ==== Init from URL param ====
  const params = new URLSearchParams(window.location.search);
  const urlFormule = params.get('formule');
  if (urlFormule && FORMULES[urlFormule === 'sweet' ? 'sweet-only' : urlFormule]) {
    const key = urlFormule === 'sweet' ? 'sweet-only' : urlFormule;
    const opt = wizard.querySelector(`.formule-option[data-formule="${key}"]`);
    if (opt) {
      opt.classList.add('selected');
      opt.querySelector('input').checked = true;
      state.formule = key;
    }
  }

  // ==== Default min date = J+7 ====
  const dateInput = document.getElementById('date');
  const today = new Date();
  const minDate = new Date(today.getTime() + 7 * 86400000);
  dateInput.min = minDate.toISOString().split('T')[0];

  // ==== Formule selection ====
  wizard.querySelectorAll('.formule-option').forEach((opt) => {
    opt.addEventListener('click', () => {
      wizard.querySelectorAll('.formule-option').forEach((o) => o.classList.remove('selected'));
      opt.classList.add('selected');
      opt.querySelector('input').checked = true;
      state.formule = opt.dataset.formule;
      // Adjust min guests
      const min = FORMULES[state.formule].min;
      const guestsInput = document.getElementById('guests');
      guestsInput.min = min;
      guestsInput.placeholder = `Minimum ${min}`;
      clearError(opt.closest('.formule-options'));
    });
  });

  // ==== Step navigation ====
  wizard.querySelectorAll('[data-next]').forEach((btn) => {
    btn.addEventListener('click', () => goNext());
  });
  wizard.querySelectorAll('[data-prev]').forEach((btn) => {
    btn.addEventListener('click', () => goPrev());
  });

  function goNext() {
    if (!validateStep(currentStep)) return;
    saveStep(currentStep);
    if (currentStep < totalSteps) {
      currentStep++;
      updateUI();
      if (currentStep === 4) renderRecap();
    }
  }

  function goPrev() {
    if (currentStep > 1) {
      currentStep--;
      updateUI();
    }
  }

  function updateUI() {
    panels.forEach((p) => p.classList.remove('active'));
    wizard.querySelector(`.step-panel[data-panel="${currentStep}"]`).classList.add('active');

    progressSteps.forEach((s) => {
      const step = parseInt(s.dataset.step, 10);
      s.classList.remove('active', 'complete');
      if (step < currentStep) s.classList.add('complete');
      else if (step === currentStep) s.classList.add('active');
    });

    const progressPct = ((currentStep - 1) / (totalSteps - 1)) * 100;
    progress.style.setProperty('--progress', progressPct + '%');

    window.scrollTo({ top: document.querySelector('.reserver-header').offsetTop - 80, behavior: 'smooth' });
  }

  // ==== Validation ====
  function validateStep(step) {
    let ok = true;
    if (step === 1) {
      if (!state.formule) {
        setError(wizard.querySelector('#formuleOptions'), 'Sélectionnez une formule.');
        ok = false;
      }
      const guests = parseInt(document.getElementById('guests').value, 10);
      const min = state.formule ? FORMULES[state.formule].min : 6;
      if (!guests || guests < min) {
        setFieldError('guests', `Minimum ${min} convives.`);
        ok = false;
      } else clearFieldError('guests');

      const dateVal = document.getElementById('date').value;
      if (!dateVal) {
        setFieldError('date', 'Choisissez une date.');
        ok = false;
      } else {
        const chosen = new Date(dateVal);
        if (chosen < minDate) {
          setFieldError('date', 'La date doit être au moins dans 7 jours.');
          ok = false;
        } else clearFieldError('date');
      }
    }

    if (step === 2) {
      ['address', 'zip', 'city', 'kitchen'].forEach((id) => {
        const el = document.getElementById(id);
        if (!el.value.trim()) {
          setFieldError(id, 'Champ requis.');
          ok = false;
        } else clearFieldError(id);
      });
    }

    if (step === 3) {
      ['firstname', 'lastname', 'email', 'phone'].forEach((id) => {
        const el = document.getElementById(id);
        if (!el.value.trim()) {
          setFieldError(id, 'Champ requis.');
          ok = false;
        } else clearFieldError(id);
      });
      const email = document.getElementById('email').value;
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setFieldError('email', 'Email invalide.');
        ok = false;
      }
    }

    if (step === 4) {
      ['cardName', 'cardNumber', 'cardExp', 'cardCvc'].forEach((id) => {
        const el = document.getElementById(id);
        if (!el.value.trim()) {
          setFieldError(id, 'Champ requis.');
          ok = false;
        } else clearFieldError(id);
      });
      const num = document.getElementById('cardNumber').value.replace(/\s/g, '');
      if (num && !/^\d{13,19}$/.test(num)) {
        setFieldError('cardNumber', 'Numéro invalide.');
        ok = false;
      }
      const exp = document.getElementById('cardExp').value;
      if (exp && !/^(0[1-9]|1[0-2])\/\d{2}$/.test(exp)) {
        setFieldError('cardExp', 'Format MM/AA.');
        ok = false;
      }
      const cvc = document.getElementById('cardCvc').value;
      if (cvc && !/^\d{3,4}$/.test(cvc)) {
        setFieldError('cardCvc', 'CVC invalide.');
        ok = false;
      }
    }

    return ok;
  }

  function saveStep(step) {
    if (step === 1) {
      state.guests = parseInt(document.getElementById('guests').value, 10);
      state.date = document.getElementById('date').value;
      state.addSweet = document.getElementById('addSweet').checked;
    }
    if (step === 2) {
      state.address = document.getElementById('address').value.trim();
      state.zip = document.getElementById('zip').value.trim();
      state.city = document.getElementById('city').value.trim();
      state.access = document.getElementById('access').value.trim();
      state.kitchen = document.getElementById('kitchen').value;
    }
    if (step === 3) {
      state.firstname = document.getElementById('firstname').value.trim();
      state.lastname = document.getElementById('lastname').value.trim();
      state.email = document.getElementById('email').value.trim();
      state.phone = document.getElementById('phone').value.trim();
      state.message = document.getElementById('message').value.trim();
    }
  }

  // ==== Error helpers ====
  function setFieldError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('error');
    let err = el.parentElement.querySelector('.error-msg');
    if (!err) {
      err = document.createElement('div');
      err.className = 'error-msg';
      el.parentElement.appendChild(err);
    }
    err.textContent = msg;
  }
  function clearFieldError(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('error');
    const err = el.parentElement.querySelector('.error-msg');
    if (err) err.remove();
  }
  function setError(container, msg) {
    let err = container.parentElement.querySelector('.error-msg');
    if (!err) {
      err = document.createElement('div');
      err.className = 'error-msg';
      container.parentElement.insertBefore(err, container.nextSibling);
    }
    err.textContent = msg;
  }
  function clearError(container) {
    const err = container.parentElement.querySelector('.error-msg');
    if (err) err.remove();
  }

  // ==== Recap ====
  function renderRecap() {
    const f = FORMULES[state.formule];
    const baseTotal = f.price * state.guests;
    const sweetTotal = state.addSweet ? SWEET_ADDON_PRICE * state.guests : 0;
    const total = baseTotal + sweetTotal;
    const deposit = Math.round(total * DEPOSIT_RATE);
    const balance = total - deposit;

    const dateFmt = state.date
      ? new Date(state.date).toLocaleDateString('fr-FR', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        })
      : '—';

    const recap = document.getElementById('recap');
    recap.innerHTML = `
      <div class="recap-row"><span class="label">Formule</span><span class="value">${f.name}</span></div>
      <div class="recap-row"><span class="label">Convives</span><span class="value">${state.guests} pers</span></div>
      <div class="recap-row"><span class="label">Date</span><span class="value">${dateFmt}</span></div>
      <div class="recap-row"><span class="label">Lieu</span><span class="value">${state.city || '—'}</span></div>
      <div class="recap-row"><span class="label">${f.name}</span><span class="value">${baseTotal} €</span></div>
      ${state.addSweet ? `<div class="recap-row"><span class="label">+ Sweet Finish (${state.guests} × ${SWEET_ADDON_PRICE} €)</span><span class="value">${sweetTotal} €</span></div>` : ''}
      <div class="recap-total"><span class="label">Total</span><span class="value">${total} €</span></div>
      <div class="recap-row" style="margin-top:1rem;"><span class="label">Acompte (30 %)</span><span class="value text-red" style="color:var(--red);font-weight:600;">${deposit} €</span></div>
      <div class="recap-row"><span class="label">Solde le jour J</span><span class="value">${balance} €</span></div>
    `;

    // Pre-fill card name
    const cardName = document.getElementById('cardName');
    if (!cardName.value && state.firstname && state.lastname) {
      cardName.value = `${state.firstname} ${state.lastname}`.toUpperCase();
    }
  }

  // ==== Card formatting ====
  const cardNumber = document.getElementById('cardNumber');
  cardNumber.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 19);
    e.target.value = v.replace(/(.{4})/g, '$1 ').trim();
  });

  const cardExp = document.getElementById('cardExp');
  cardExp.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
    e.target.value = v;
  });

  const cardCvc = document.getElementById('cardCvc');
  cardCvc.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
  });

  // ==== Submit (mock payment) ====
  wizard.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    const payBtn = document.getElementById('payBtn');
    payBtn.disabled = true;
    payBtn.innerHTML = '<span style="display:inline-block;animation:spin 1s linear infinite;">⟳</span> Traitement…';

    // Compute amounts to pass to confirmation
    const f = FORMULES[state.formule];
    const baseTotal = f.price * state.guests;
    const sweetTotal = state.addSweet ? SWEET_ADDON_PRICE * state.guests : 0;
    const total = baseTotal + sweetTotal;
    const deposit = Math.round(total * DEPOSIT_RATE);

    // Simulate API call
    setTimeout(() => {
      const params = new URLSearchParams({
        formule: f.name,
        guests: state.guests,
        date: state.date,
        total: total,
        deposit: deposit,
        firstname: state.firstname,
        email: state.email,
      });
      window.location.href = 'confirmation.html?' + params.toString();
    }, 1400);
  });

  // ==== Spin animation injection ====
  const style = document.createElement('style');
  style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(style);
})();
