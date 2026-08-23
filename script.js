const MAX_FIELD_LENGTH = 1000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BOT_FIELD_NAMES = ['website', 'company', 'url', 'phone2', 'confirm_email'];

const sanitizeText = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value)
    .replace(/<\/?script[^>]*>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, MAX_FIELD_LENGTH);
};

const hasBotTrap = (form) => {
  return Array.from(form.elements).some((element) => {
    if (!element || !('name' in element)) {
      return false;
    }

    const name = String(element.name || '').toLowerCase();
    return BOT_FIELD_NAMES.includes(name) && String(element.value || '').trim() !== '';
  });
};

const isSubmissionRateLimited = (formId) => {
  const key = `vines-studio-last-submit:${formId}`;
  const now = Date.now();

  try {
    const last = Number(window.localStorage.getItem(key) || '0');
    if (last && now - last < 15000) {
      return true;
    }
    window.localStorage.setItem(key, String(now));
  } catch (error) {
    return false;
  }

  return false;
};

const sanitizeFormData = (form) => {
  const safeData = new FormData();
  const entries = new FormData(form).entries();

  for (const [key, value] of entries) {
    const normalizedKey = String(key).toLowerCase();
    if (BOT_FIELD_NAMES.includes(normalizedKey)) {
      if (sanitizeText(value).trim() !== '') {
        throw new Error('Your request looks suspicious. Please try again in a moment.');
      }
      continue;
    }

    const cleanValue = sanitizeText(value);
    if (!cleanValue && key !== 'message') {
      continue;
    }

    if (key === 'email' && cleanValue && !EMAIL_REGEX.test(cleanValue)) {
      throw new Error('Please enter a valid email address.');
    }

    if (key === 'name' && cleanValue && cleanValue.length < 2) {
      throw new Error('Please enter your name.');
    }

    safeData.append(key, cleanValue || '');
  }

  return safeData;
};

const navToggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');
const contactForm = document.getElementById('contact-form');
const formNote = document.getElementById('form-note');
const formEndpoint = contactForm?.dataset.endpoint || contactForm?.action;
let directSubmit = false;

const bookingOverlay = document.getElementById('booking-overlay');
const bookingDrawer = document.getElementById('booking-drawer');
const bookingClose = document.getElementById('booking-close');
const bookingForm = document.getElementById('booking-form');
const bookingFormNote = document.getElementById('booking-form-note');
const bookingFormEndpoint = bookingForm?.dataset.endpoint || bookingForm?.action;
const contactSection = document.getElementById('contact');
let bookingDirectSubmit = false;

const toggleBookingDrawer = (open) => {
  if (!bookingOverlay || !bookingDrawer) return;
  bookingOverlay.setAttribute('aria-hidden', String(!open));
  bookingDrawer.classList.toggle('open', open);
  document.body.classList.toggle('modal-open', open);

  if (open) {
    window.setTimeout(() => {
      const firstField = bookingDrawer.querySelector('input, select, textarea');
      if (firstField) firstField.focus();
    }, 220);
  }
};

const scrollToContactForm = () => {
  const target = contactForm || contactSection;
  if (!target) return;

  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  target.classList.add('booking-highlight');

  const firstField = target.querySelector('input, select, textarea');
  if (firstField) {
    firstField.focus({ preventScroll: true });
  }

  window.setTimeout(() => {
    target.classList.remove('booking-highlight');
  }, 1600);
};

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const open = !navToggle.classList.contains('open');
    navToggle.classList.toggle('open', open);
    navLinks.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('open');
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const serviceDetailsPanel = document.getElementById('service-details-panel');
const serviceFeaturesList = document.getElementById('service-features-list');

const scrollToServiceDetailsPanel = () => {
  if (!serviceDetailsPanel) return;
  serviceDetailsPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  serviceDetailsPanel.classList.add('highlighted');
  window.setTimeout(() => {
    serviceDetailsPanel.classList.remove('highlighted');
  }, 2200);
};

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userName = document.getElementById('user_name').value.trim();
    const userEmail = document.getElementById('user_email').value.trim();
    const service = document.getElementById('service').value.trim();
    const preferredDate = document.getElementById('preferred_date').value.trim();
    const preferredTime = document.getElementById('preferred_time').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!userName || !userEmail || !service || !preferredDate || !preferredTime) {
      if (formNote) {
        formNote.textContent = 'Please fill in all required fields.';
        formNote.hidden = false;
      }
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
      if (formNote) {
        formNote.textContent = 'Please enter a valid email address.';
        formNote.hidden = false;
      }
      return;
    }

    if (isSubmissionRateLimited(contactForm.id)) {
      if (formNote) {
        formNote.textContent = 'Please wait before sending another request.';
        formNote.hidden = false;
      }
      return;
    }

    if (formNote) {
      formNote.textContent = 'Sending your booking request...';
      formNote.hidden = false;
    }

    const endpoint = (formEndpoint && formEndpoint.length) ? formEndpoint : '/api/booking';
    const isFormspree = /formspree\.io/.test(endpoint);

    // If the form is configured to use mailto only (no external endpoint), open the user's mail client
    if (contactForm.dataset.mailtoOnly === 'true') {
      const mailto = `mailto:vinacanoy@gmail.com?subject=${encodeURIComponent('Booking request from ' + userName)}&body=${encodeURIComponent(
        `Name: ${userName}\nEmail: ${userEmail}\nService: ${service}\nDate: ${preferredDate}\nTime: ${preferredTime}\n\nMessage:\n${message}`
      )}`;

      // Open the user's mail client
      window.location.href = mailto;

      if (formNote) {
        formNote.textContent = 'Opening your mail app to send the booking request...';
        formNote.hidden = false;
      }

      contactForm.reset();
      return;
    }

    try {
      const subject = `✦ Vine's Beauty — Booking: ${service} — ${preferredDate} ${preferredTime} — ${userName}`;
      const replytoEl = document.getElementById('_replyto');
      const subjectEl = document.getElementById('_subject');
      let nextEl = document.getElementById('_next');

      if (replytoEl) {
        replytoEl.value = userEmail;
      }
      if (subjectEl) {
        subjectEl.value = subject;
      }

      if (isFormspree) {
        // Ensure the _next field exists so Formspree knows where to return after POST
        if (!nextEl) {
          nextEl = document.createElement('input');
          nextEl.type = 'hidden';
          nextEl.name = '_next';
          nextEl.id = '_next';
          contactForm.appendChild(nextEl);
        }

        nextEl.value = new URL('thank-you.html', window.location.href).href;

        try {
          const ajaxData = new FormData(contactForm);
          // Ensure reply-to/subject are present
          if (replytoEl) ajaxData.set('_replyto', userEmail);
          ajaxData.set('_subject', subject);

          const ajaxResp = await fetch(endpoint, {
            method: 'POST',
            body: ajaxData,
            headers: { 'Accept': 'application/json' }
          });

          if (ajaxResp.type === 'opaque') {
            throw new Error('Opaque response — possible CORS block');
          }

          if (ajaxResp.ok) {
            // Stay in the same tab and show the local thank-you page
            window.location.assign(new URL('thank-you.html', window.location.href).href);
            return;
          }

          // Non-OK: fall back to regular form submit so Formspree can handle the response
          HTMLFormElement.prototype.submit.call(contactForm);
          return;
        } catch (ajaxError) {
          console.warn('Formspree AJAX failed, falling back to standard submit:', ajaxError);
          HTMLFormElement.prototype.submit.call(contactForm);
          return;
        }
      }

      // Create FormData to send to backend
      const formData = new FormData();
      formData.append('name', userName);
      formData.append('email', userEmail);
      formData.append('service', service);
      formData.append('preferred_date', preferredDate);
      formData.append('preferred_time', preferredTime);
      formData.append('message', message);
      formData.append('_replyto', userEmail);
      formData.append('_subject', subject);

      if (location.protocol === 'file:' && !isFormspree) {
        if (formNote) {
          formNote.innerHTML = 'Please open the website via <strong>http://localhost:5000</strong> and run the backend server before submitting the booking form. If you need to book a schedule now, email <a href="mailto:vinacanoy@gmail.com">vinacanoy@gmail.com</a> directly.';
          formNote.hidden = false;
        }
        return;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.type === 'opaque') {
        throw new Error('Opaque response — possible CORS block');
      }

      let result = {};
      const contentType = response.headers.get('content-type') || '';
      const bodyText = await response.text();
      if (contentType.indexOf('application/json') !== -1) {
        try {
          result = JSON.parse(bodyText);
        } catch (parseError) {
          console.warn('Failed to parse JSON response from backend:', parseError);
        }
      } else {
        result.message = bodyText;
      }

      if (response.ok) {
        contactForm.reset();
        window.location.assign(new URL('thank-you.html', window.location.href).href);
      } else {
        let message = result.message || 'Error sending request. Please try again.';
        if (response.status === 501 || /Unsupported method \('POST'\)/i.test(message)) {
          message = 'Booking failed because the form backend is not running. Start the local server with `python server/app.py` and open the site from that backend URL.';
        } else if (contentType.indexOf('text/html') !== -1) {
          message = 'Booking failed because an incorrect server handled the request. Make sure you are running the Flask backend at http://localhost:5000 and not a static file server.';
        }
        if (formNote) {
          formNote.textContent = message;
          formNote.hidden = false;
        }
      }
    } catch (error) {
      console.error('Form submission unexpected error:', error);
      if (formNote) {
        formNote.textContent = 'Error sending request. Please try again later.';
        formNote.hidden = false;
      }
    }
  });
}

const trainingCards = document.querySelectorAll('[data-training-card]');
const trainingModal = document.getElementById('training-modal');
const trainingModalClose = document.getElementById('training-modal-close');

const toggleTrainingModal = (open) => {
  if (!trainingModal) return;
  trainingModal.classList.toggle('active', open);
  trainingModal.setAttribute('aria-hidden', String(!open));
  document.body.classList.toggle('modal-open', open);
};

trainingCards.forEach((card) => {
  card.addEventListener('click', () => toggleTrainingModal(true));
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleTrainingModal(true);
    }
  });
});

if (trainingModalClose) {
  trainingModalClose.addEventListener('click', () => toggleTrainingModal(false));
}

if (trainingModal) {
  trainingModal.addEventListener('click', (event) => {
    if (event.target === trainingModal || event.target.classList.contains('training-modal-backdrop')) {
      toggleTrainingModal(false);
    }
  });
}

const serviceDetails = {
  'COMBI BROWS': {
    subtitle: 'A balanced combination of hair strokes and shading for brows that feel softly sculpted and naturally full.',
    features: [
      'Customized brow mapping for your face shape and natural features',
      'Hair-stroke definition plus powder shading for added depth',
      'Longer-lasting pigment with beautifully blended texture',
      'A refined finish that stays soft and natural as it heals'
    ]
  },
  'MICROBLADING': {
    subtitle: 'Precise, hair-like strokes for sparse or over-plucked brows that want a natural, defined shape.',
    features: [
      'Ultra-fine hand tool strokes for realistic hair detail',
      'Custom color and shape created for your skin tone',
      'Ideal for clients with normal to dry skin',
      'Results that look natural and grow out softly over time'
    ]
  },
  'POWDER BROWS': {
    subtitle: 'Soft, makeup-inspired pigment with a gentle gradient that gives brows a polished finish.',
    features: [
      'Airbrushed shading for a soft, filled-in effect',
      'Designed for a low-maintenance, beauty-ready look',
      'Comfortable application with gradual color build-up',
      'Perfect for those who want a subtle yet defined brow statement'
    ]
  },
  'MACHINE NANO HAIRSTROKES': {
    subtitle: 'Crisp, natural-looking hair strokes created with a machine for precision and consistent detail.',
    features: [
      'Ultra-fine strokes for a soft natural result',
      'Precision machine work ideal for oily or mature skin',
      'A more defined look with minimal spreading over time',
      'Beautifully balanced brows with sharp, clean edges'
    ]
  },
  'OMBRE BROWS': {
    subtitle: 'A soft gradient brow with a lighter front and fuller tail for a polished, modern finish.',
    features: [
      'Soft powder fade from front to tail',
      'A perfect blend of delicate and bold for daily wear',
      'Great for clients who love a makeup-finish brow',
      'Low-maintenance healing with smooth, even color'
    ]
  },
  'HOME SERVICE': {
    subtitle: 'Professional brow styling delivered to your home for a relaxed, private beauty experience.',
    features: [
      'Comfortable service in your chosen location',
      'Premium brow shaping with hygiene and care',
      'Ideal for busy clients or pampering at home',
      'Convenient scheduling with a trusted artist'
    ]
  },
  'COMBO PACKAGE': {
    subtitle: 'A special package designed for two clients with extra perks, style, and convenience.',
    features: [
      'Bring one extra customer for a shared brow experience',
      'Deluxe aftercare guidance for both appointments',
      'Priority scheduling for a smooth service flow',
      'Shared savings with a beautiful result for every client'
    ]
  },
  'LIP PIGMENTATION': {
    subtitle: 'A soft, customized lip tint that enhances your natural color and creates a fresh, polished look.',
    features: [
      'Customized pigment shade selected for your natural lip tone',
      'Defines the lip shape while creating an even, balanced color',
      'A soft tint that enhances your everyday look without heavy makeup',
      'Personalized aftercare guidance for smooth, beautiful healing'
    ]
  }
};

const selectedServiceTitle = document.getElementById('service-details-title');
const selectedServiceCopy = document.querySelector('.service-details-copy');
const allServiceCards = document.querySelectorAll('.service-card[data-service]');

const combiBrowResults = [
  { face: 'Face 1', before: 'Combi Browns/0.jpg', after: 'Combi Browns/00.jpg' },
  { face: 'Face 2', before: 'Combi Browns/1..jpg', after: 'Combi Browns/1.jpg' },
  { face: 'Face 3', before: 'Combi Browns/2..jpg', after: 'Combi Browns/2.jpg' },
  { face: 'Face 4', before: 'Combi Browns/3..jpg', after: 'Combi Browns/3.jpg' },
  { face: 'Face 5', before: 'Combi Browns/4..jpg', after: 'Combi Browns/4.jpg' },
  { face: 'Face 6', before: 'Combi Browns/6..jpg', after: 'Combi Browns/6.jpg' }
];

const clearSelectedService = () => {
  allServiceCards.forEach((card) => card.classList.remove('active'));
};
const showServiceDetails = (serviceKey) => {
  const service = serviceDetails[serviceKey];
  if (!service || !selectedServiceTitle || !selectedServiceCopy || !serviceFeaturesList || !serviceDetailsPanel) return;

  selectedServiceTitle.textContent = `${serviceKey} features`;
  selectedServiceCopy.textContent = service.subtitle;
  serviceFeaturesList.innerHTML = service.features.map(feature => `<li>${feature}</li>`).join('');
  serviceDetailsPanel.classList.add('active');
};

allServiceCards.forEach((card) => {
  card.addEventListener('click', () => {
    const serviceKey = card.dataset.service;
    if (!serviceKey) return;
    clearSelectedService();
    card.classList.add('active');
    showServiceDetails(serviceKey);
    scrollToServiceDetailsPanel();
  });

  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      card.click();
    }
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (trainingModal && trainingModal.classList.contains('active')) {
      toggleTrainingModal(false);
    }
    if (bookingOverlay && bookingOverlay.getAttribute('aria-hidden') === 'false') {
      toggleBookingDrawer(false);
    }
    const logoModal = document.getElementById('logo-preview-modal');
    if (logoModal && logoModal.classList.contains('active')) {
      logoModal.classList.remove('active');
      logoModal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
    }
    const expandedGallery = document.querySelector('.gallery-featured-item.expanded');
    if (expandedGallery) {
      expandedGallery.classList.remove('expanded');
      expandedGallery.setAttribute('aria-expanded', 'false');
    }
  }
});

// Handle expand/toggle for all featured gallery items (supports multiple containers)
const galleryFeaturedCards = document.querySelectorAll('.gallery-featured-item');
if (galleryFeaturedCards && galleryFeaturedCards.length) {
  galleryFeaturedCards.forEach((card) => {
    const viewBtn = card.querySelector('.gallery-view-toggle');
    const closeBtn = card.querySelector('.gallery-close-toggle');

    const setGalleryExpanded = (expanded) => {
      card.classList.toggle('expanded', expanded);
      card.setAttribute('aria-expanded', String(expanded));
    };

    if (viewBtn) {
      viewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        setGalleryExpanded(!card.classList.contains('expanded'));
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        setGalleryExpanded(false);
      });
    }

    // clicking anywhere in the card toggles expand (except the control buttons)
    card.addEventListener('click', (e) => {
      if (e.target.closest('.gallery-view-toggle') || e.target.closest('.gallery-close-toggle')) return;
      setGalleryExpanded(!card.classList.contains('expanded'));
    });

    // keyboard accessibility
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        setGalleryExpanded(!card.classList.contains('expanded'));
      }
    });
  });
}

// Lightbox: one-by-one image viewing
(function(){
  const lightbox = document.getElementById('lightbox');
  const lbImg = lightbox?.querySelector('.lightbox-img');
  const lbCaption = lightbox?.querySelector('.lightbox-caption');
  const btnPrev = lightbox?.querySelector('.lightbox-prev');
  const btnNext = lightbox?.querySelector('.lightbox-next');
  const btnClose = lightbox?.querySelector('.lightbox-close');

  if (!lightbox || !lbImg) return;

  let currentIndex = 0;
  let currentSet = [];

  function openLightbox(set, index){
    currentSet = set || [];
    currentIndex = Math.max(0, Math.min(index || 0, currentSet.length - 1));
    showImage(currentIndex);
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    document.addEventListener('keydown', onKey);
  }

  function closeLightbox(){
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    document.removeEventListener('keydown', onKey);
  }

  function showImage(idx){
    const item = currentSet[idx];
    if(!item) return;
    lbImg.src = item.src;
    lbImg.alt = item.alt || '';
    lbCaption.textContent = item.alt || '';
    currentIndex = idx;
  }

  function onKey(e){
    if(e.key === 'Escape') return closeLightbox();
    if(e.key === 'ArrowLeft') return showImage(Math.max(0, currentIndex - 1));
    if(e.key === 'ArrowRight') return showImage(Math.min(currentSet.length - 1, currentIndex + 1));
  }

  btnPrev && btnPrev.addEventListener('click', (e)=>{ e.stopPropagation(); showImage(Math.max(0, currentIndex - 1)); });
  btnNext && btnNext.addEventListener('click', (e)=>{ e.stopPropagation(); showImage(Math.min(currentSet.length - 1, currentIndex + 1)); });
  btnClose && btnClose.addEventListener('click', (e)=>{ e.stopPropagation(); closeLightbox(); });

  // clicking backdrop closes
  lightbox.addEventListener('click', (e)=>{
    if(e.target.classList.contains('lightbox-backdrop')) closeLightbox();
  });

  // Attach lightbox behavior to a group of images defined by selector
  window.attachLightboxTo = function(selector){
    const imgs = Array.from(document.querySelectorAll(selector));
    if(!imgs.length) return;
    const set = imgs.map((img)=>({ src: img.src, alt: img.alt }));
    imgs.forEach((img, i)=>{
      img.style.cursor = 'zoom-in';
      img.setAttribute('tabindex', '0');
      img.addEventListener('click', (e)=>{ e.stopPropagation(); openLightbox(set, i); });
      img.addEventListener('keydown', (e)=>{ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openLightbox(set, i); } });
    });
  };

  // initialize on known selectors
  window.attachLightboxTo('.gallery-featured-thumbs img');
  // Also attach to combi results if they are already present
  window.attachLightboxTo('.combi-result-frame img');
})();


const logo = document.getElementById('site-logo');
const logoPreviewModal = document.getElementById('logo-preview-modal');
const closeLogoPreview = document.getElementById('close-logo-preview');

if (logo && logoPreviewModal) {
  logo.addEventListener('click', (event) => {
    event.preventDefault();
    logoPreviewModal.classList.add('active');
    logoPreviewModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  });
}

if (closeLogoPreview) {
  closeLogoPreview.addEventListener('click', () => {
    logoPreviewModal.classList.remove('active');
    logoPreviewModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  });
}

if (logoPreviewModal) {
  logoPreviewModal.addEventListener('click', (event) => {
    if (event.target === logoPreviewModal || event.target.classList.contains('logo-preview-backdrop')) {
      logoPreviewModal.classList.remove('active');
      logoPreviewModal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
    }
  });
}

const navCta = document.querySelector('.nav-cta');
if (navCta) {
  navCta.addEventListener('click', () => {
    navCta.classList.add('clicked');
    window.setTimeout(() => navCta.classList.remove('clicked'), 260);
  });
}

// Pointer-tracked subtle zoom toward cursor for service cards
(() => {
  const cards = document.querySelectorAll('.service-card');
  if (!cards || !cards.length) return;

  cards.forEach((card) => {
    card.style.setProperty('--mx', '50%');
    card.style.setProperty('--my', '50%');

    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      card.style.setProperty('--mx', `${x}%`);
      card.style.setProperty('--my', `${y}%`);

      // stronger pointer-driven scale: closer to center => larger scale (up to ~1.18)
      const nx = (x - 50) / 50; // -1..1
      const ny = (y - 50) / 50;
      const dist = Math.min(1, Math.sqrt(nx * nx + ny * ny));
      const intensity = 1.05 + (1 - dist) * 0.13; // range ~1.05..1.18
      const ty = -6 - ((intensity - 1.05) * 40); // map to -6 .. ~-11
      card.style.setProperty('--card-scale', intensity.toFixed(3));
      card.style.setProperty('--card-ty', `${ty.toFixed(2)}px`);
    });

    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--mx', '50%');
      card.style.setProperty('--my', '50%');
      card.style.setProperty('--card-scale', '1.02');
      card.style.setProperty('--card-ty', '-6px');
    });
  });
})();

// Tilt-surface pointer interaction for hero, about, and other panels
(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const surfaces = Array.from(document.querySelectorAll('.tilt-surface'));
  if (!surfaces.length || prefersReduced) {
    surfaces.forEach((surface) => {
      surface.style.setProperty('--surface-scale', '1');
      surface.style.setProperty('--tilt-rotateX', '0deg');
      surface.style.setProperty('--tilt-rotateY', '0deg');
    });
    return;
  }

  surfaces.forEach((surface) => {
    surface.style.setProperty('--surface-scale', '1');
    surface.style.setProperty('--tilt-rotateX', '0deg');
    surface.style.setProperty('--tilt-rotateY', '0deg');

    surface.addEventListener('pointermove', (event) => {
      const rect = surface.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      const rotateY = x * 10;
      const rotateX = -y * 10;
      surface.style.setProperty('--tilt-rotateX', `${rotateX.toFixed(2)}deg`);
      surface.style.setProperty('--tilt-rotateY', `${rotateY.toFixed(2)}deg`);
      surface.style.setProperty('--surface-scale', '1.016');
    });

    surface.addEventListener('pointerleave', () => {
      surface.style.setProperty('--tilt-rotateX', '0deg');
      surface.style.setProperty('--tilt-rotateY', '0deg');
      surface.style.setProperty('--surface-scale', '1');
    });
  });
})();

// Reveal elements as they scroll into view
(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealSelectors = ['.hero-content', '.section-header', '.service-card', '.about-frame', '.contact-info', '.contact-form', '.service-details-panel'];
  const revealItems = revealSelectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)));

  revealItems.forEach((item) => item.classList.add('reveal-on-scroll'));

  if (prefersReduced) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.18,
  });

  revealItems.forEach((item) => observer.observe(item));
})();

// Clickable helper panel for the eyebrow guide
(() => {
  const helper = document.querySelector('.eyebrow-helper');
  if (!helper) return;
  const panel = helper.querySelector('.helper-panel');
  const closeButton = helper.querySelector('.helper-close');

  helper.setAttribute('aria-expanded', 'false');
  if (panel) panel.setAttribute('aria-hidden', 'true');

  const openHelper = () => {
    helper.classList.add('open', 'clicked');
    helper.setAttribute('aria-expanded', 'true');
    if (panel) panel.setAttribute('aria-hidden', 'false');
  };
  const closeHelper = () => {
    helper.classList.remove('open');
    helper.setAttribute('aria-expanded', 'false');
    if (panel) panel.setAttribute('aria-hidden', 'true');
  };

  helper.addEventListener('click', (event) => {
    if (event.target.closest('.helper-close')) return;
    if (helper.classList.contains('open')) {
      closeHelper();
    } else {
      openHelper();
    }
  });

  helper.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (helper.classList.contains('open')) {
        closeHelper();
      } else {
        openHelper();
      }
    } else if (event.key === 'Escape') {
      closeHelper();
    }
  });

  if (closeButton) {
    closeButton.addEventListener('click', (event) => {
      event.stopPropagation();
      closeHelper();
    });
  }

  document.addEventListener('click', (event) => {
    if (!helper.contains(event.target) && helper.classList.contains('open')) {
      closeHelper();
    }
  });
})();

// Hide header halfway when scrolling down, show when scrolling up
(() => {
  const header = document.querySelector('.header');
  if (!header) return;

  let lastScrollY = window.scrollY;
  const threshold = 8;

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    if (Math.abs(currentScrollY - lastScrollY) < threshold) {
      return;
    }

    if (currentScrollY > lastScrollY && currentScrollY > 80) {
      header.classList.add('half-hidden');
    } else if (currentScrollY < lastScrollY) {
      header.classList.remove('half-hidden');
    }

    lastScrollY = currentScrollY;
  }, { passive: true });
})();

// Render combi brows before/after gallery using images stored in the Combi Browns folder
(function renderCombiResults(){
  try {
    const container = document.getElementById('combi-result-row');
    if (!container) return;

    // Full list of files in the Combi Browns folder — will be paired into before/after
    const combiFiles = [
      'Combi Browns/0.jpg','Combi Browns/00.jpg','Combi Browns/1..jpg','Combi Browns/1.jpg',
      'Combi Browns/10..jpg','Combi Browns/10.jpg','Combi Browns/11..jpg','Combi Browns/11.jpg',
      'Combi Browns/12..jpg','Combi Browns/12.jpg','Combi Browns/2..jpg','Combi Browns/2.jpg',
      'Combi Browns/3 (2).jpg','Combi Browns/3..jpg','Combi Browns/3.jpg','Combi Browns/4..jpg',
      'Combi Browns/4.jpg',
      'Combi Browns/6..jpg','Combi Browns/6.jpg','Combi Browns/7..jpg','Combi Browns/7.jpg',
      'Combi Browns/8..jpg','Combi Browns/8.jpg','Combi Browns/9..jpg','Combi Browns/9.jpg'
    ];

    // Group by the first numeric sequence found in the filename (fallback to name without extension)
    const groups = combiFiles.reduce((acc, path) => {
      const name = path.split('/').pop();
      const digits = (name.match(/\d+/) || [])[0];
      const key = digits || name.replace(/\.[^.]+$/, '');
      (acc[key] = acc[key] || []).push(path);
      return acc;
    }, {});

    // Build pairs: for each group, sort and pair sequentially; singletons pair with themselves
    const pairs = [];
    Object.keys(groups).sort((a,b)=>Number(a) - Number(b)).forEach((key) => {
      const arr = groups[key].slice().sort((a,b) => a.length - b.length);
      if (arr.length === 1) {
        pairs.push([arr[0], arr[0]]);
      } else {
        for (let i = 0; i < arr.length; i += 2) {
          const before = arr[i];
          const after = arr[i+1] || arr[i];
          pairs.push([before, after]);
        }
      }
    });

    // Also populate the legacy `combiBrowResults` array (used as before/after content elsewhere)
    try {
      if (Array.isArray(combiBrowResults)) {
        combiBrowResults.length = 0;
        pairs.forEach((p, i) => {
          combiBrowResults.push({ face: `Face ${i+1}`, before: p[0], after: p[1] });
        });
      }
    } catch (e) { /* ignore if combiBrowResults isn't writable */ }

    const makeFrame = (beforeSrc, afterSrc, label) => {
      const face = document.createElement('div');
      face.className = 'combi-result-face';

      const labelEl = document.createElement('div');
      labelEl.className = 'combi-result-face-label';
      labelEl.textContent = label || '';

      const imagesWrap = document.createElement('div');
      imagesWrap.className = 'combi-result-images';

      const beforeFrame = document.createElement('div');
      beforeFrame.className = 'combi-result-frame';
      const beforeImg = document.createElement('img');
      beforeImg.src = encodeURI(beforeSrc);
      beforeImg.alt = 'Before';
      beforeFrame.appendChild(beforeImg);

      const afterFrame = document.createElement('div');
      afterFrame.className = 'combi-result-frame';
      const afterImg = document.createElement('img');
      afterImg.src = encodeURI(afterSrc);
      afterImg.alt = 'After';
      afterFrame.appendChild(afterImg);

      imagesWrap.appendChild(beforeFrame);
      imagesWrap.appendChild(afterFrame);

      face.appendChild(labelEl);
      face.appendChild(imagesWrap);
      return face;
    };

    pairs.forEach((p, i) => {
      const [before, after] = p;
      const label = `Result ${i + 1}`;
      const frame = makeFrame(before, after, label);
      container.appendChild(frame);
    });

    // Re-attach lightbox behavior to the newly created images
    if (typeof window.attachLightboxTo === 'function') {
      window.attachLightboxTo('.combi-result-frame img');
    }
  } catch (e) {
    console.error('Render combi results error', e);
  }
})();

// Ensure hero animation class is applied when script.js is used
(function(){
  try {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { hero.classList.add('animate'); return; }
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      window.setTimeout(() => hero.classList.add('animate'), 260);
    } else {
      document.addEventListener('DOMContentLoaded', () => setTimeout(() => hero.classList.add('animate'), 260));
    }
  } catch (e) { /* ignore */ }
})();
