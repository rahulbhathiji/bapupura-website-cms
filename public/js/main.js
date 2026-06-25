(function() {
  // Global Data Stores
  let settings = null;
  let heroContent = null;
  let aboutContent = null;
  let donationContent = null;
  let contactContent = null;

  // Initialize Page Setup
  document.addEventListener('DOMContentLoaded', () => {
    trackVisitor();
    loadCMSData();
    setupInquiryForm();
    setupModalListeners();
    setupInteractivity();
  });

  // Interactivity system bindings for CSP compliance
  function setupInteractivity() {
    const langBtn = document.getElementById('language-toggle-btn');
    if (langBtn) {
      langBtn.addEventListener('click', toggleLanguage);
    }
    
    const mobileToggleBtn = document.getElementById('mobile-menu-toggle-btn');
    if (mobileToggleBtn) {
      mobileToggleBtn.addEventListener('click', toggleMobileMenu);
    }
    
    const mobileCloseBtn = document.getElementById('mobile-menu-close-btn');
    if (mobileCloseBtn) {
      mobileCloseBtn.addEventListener('click', toggleMobileMenu);
    }
    
    const mobileMenuLinks = document.getElementById('mobile-menu-links');
    if (mobileMenuLinks) {
      mobileMenuLinks.addEventListener('click', toggleMobileMenu);
    }
  }

  // Language Toggle System Logic
  function toggleLanguage() {
    const body = document.body;
    const btnText = document.getElementById('langBtnText');
    
    if (body.classList.contains('lang-gu')) {
      body.classList.remove('lang-gu');
      body.classList.add('lang-en');
      if (btnText) btnText.innerText = 'ગુજરાતી';
    } else {
      body.classList.remove('lang-en');
      body.classList.add('lang-gu');
      if (btnText) btnText.innerText = 'English';
    }
  }

  // Mobile responsive drawer toggle functionality 
  function toggleMobileMenu() {
    const drawer = document.getElementById('mobileDrawer');
    if (!drawer) return;
    if (drawer.classList.contains('hidden')) {
      drawer.classList.remove('hidden');
    } else {
      drawer.classList.add('hidden');
    }
  }

  // Track Unique Visitor Hits
  function trackVisitor() {
    const isReturning = localStorage.getItem('bapupura_returning_visitor');
    const payload = {
      path: window.location.pathname,
      isNewVisitor: !isReturning
    };

    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(() => {
      localStorage.setItem('bapupura_returning_visitor', 'true');
    })
    .catch(err => console.error('Analytics tracking failed:', err));
  }

  // Load CMS Data
  async function loadCMSData() {
    try {
      // Fetch global settings
      const settingsRes = await fetch('/api/settings');
      const settingsJson = await settingsRes.json();
      if (settingsJson.success) {
        settings = settingsJson.data;
        applySettings();
      }

      // Fetch Hero
      const heroRes = await fetch('/api/content/hero');
      const heroJson = await heroRes.json();
      if (heroJson.success) {
        heroContent = heroJson.data;
        applyHero();
      }

      // Fetch About
      const aboutRes = await fetch('/api/content/about');
      const aboutJson = await aboutRes.json();
      if (aboutJson.success) {
        aboutContent = aboutJson.data;
        applyAbout();
      }

      // Fetch Donation
      const donationRes = await fetch('/api/content/donation');
      const donationJson = await donationRes.json();
      if (donationJson.success) {
        donationContent = donationJson.data;
        applyDonation();
      }

      // Fetch Contact
      const contactRes = await fetch('/api/content/contact');
      const contactJson = await contactRes.json();
      if (contactJson.success) {
        contactContent = contactJson.data;
        applyContact();
      }

      // Load Facilities and Notices
      loadFacilitiesGrid();
      loadNoticesCirculars();

    } catch (e) {
      console.error('Failed to bootstrap CMS data:', e);
    }
  }

  // Inject dual-text translations helper
  function injectBilingualText(parentSelector, guText, enText) {
    const parent = document.querySelector(parentSelector);
    if (!parent) return;
    parent.innerHTML = `
      <span class="gu-text">${guText || ''}</span>
      <span class="en-text">${enText || ''}</span>
    `;
  }

  // Apply site global Settings
  function applySettings() {
    if (!settings) return;
    
    // SEO setup
    if (settings.seo) {
      document.title = settings.seo.metaTitle;
      const descMeta = document.getElementById('site-meta-desc');
      if (descMeta) descMeta.setAttribute('content', settings.seo.metaDescription);
      
      const keywordsMeta = document.getElementById('site-meta-keywords');
      if (keywordsMeta) keywordsMeta.setAttribute('content', settings.seo.keywords);
      
      const ogTitle = document.getElementById('og-title');
      if (ogTitle) ogTitle.setAttribute('content', settings.seo.metaTitle);

      const ogDesc = document.getElementById('og-desc');
      if (ogDesc) ogDesc.setAttribute('content', settings.seo.metaDescription);

      if (settings.seo.ogImage) {
        const ogImg = document.getElementById('og-image');
        if (ogImg) ogImg.setAttribute('content', settings.seo.ogImage);
      }
    }

    // Favicon
    if (settings.faviconUrl) {
      const fav = document.getElementById('site-favicon');
      if (fav) fav.setAttribute('href', settings.faviconUrl);
    }

    // Logo & Header names
    if (settings.logoUrl) {
      const logoBox = document.getElementById('brand-logo');
      if (logoBox) {
        logoBox.innerHTML = `<img src="${settings.logoUrl}" className="w-10 h-10 object-contain rounded-lg" alt="Logo" />`;
        logoBox.className = 'w-12 h-12 p-0.5 rounded-xl bg-white flex items-center justify-center';
      }
    }

    injectBilingualText('#site-name-gu', settings.websiteName, '');
    injectBilingualText('#site-name-en', '', settings.websiteName);
    
    // Copyrights
    injectBilingualText('#footer-copyright-gu', settings.copyrightGu, '');
    injectBilingualText('#footer-copyright-en', '', settings.copyrightEn);
    injectBilingualText('#footer-sub-gu', settings.footerSubtextGu, '');
    injectBilingualText('#footer-sub-en', '', settings.footerSubtextEn);

    // Apply Brand Color Palette (injected dynamically into CSS variables or selectors)
    if (settings.themeColors) {
      const primary = settings.themeColors.primary || '#0284c7';
      const secondary = settings.themeColors.secondary || '#f59e0b';
      // In Tailwind v4, we can set stylesheet styles on body or elements:
      const style = document.createElement('style');
      style.innerHTML = `
        .bg-sky-600 { background-color: ${primary} !important; }
        .hover\\:bg-sky-700:hover { background-color: ${primary}d0 !important; }
        .text-sky-600 { color: ${primary} !important; }
        .text-sky-900 { color: ${primary} !important; }
        .border-sky-200 { border-color: ${primary}20 !important; }
        .bg-sky-700 { background-color: ${primary}e0 !important; }
        .bg-sky-900 { background-color: ${primary} !important; }
        .bg-amber-500 { background-color: ${secondary} !important; }
        .hover\\:bg-amber-600:hover { background-color: ${secondary}d0 !important; }
      `;
      document.head.appendChild(style);
    }
  }

  // Apply Hero contents
  function applyHero() {
    if (!heroContent) return;

    injectBilingualText('#hero-tag-gu', heroContent.tagGu, '');
    injectBilingualText('#hero-tag-en', '', heroContent.tagEn);
    
    injectBilingualText('#hero-heading-gu', heroContent.headingGu, '');
    injectBilingualText('#hero-heading-en', '', heroContent.headingEn);

    injectBilingualText('#hero-desc-gu', heroContent.descGu, '');
    injectBilingualText('#hero-desc-en', '', heroContent.descEn);

    // Buttons
    injectBilingualText('#hero-btn1-gu', heroContent.button1TextGu + ' &rarr;', '');
    injectBilingualText('#hero-btn1-en', '', heroContent.button1TextEn + ' &rarr;');
    const btn1 = document.getElementById('hero-btn1-gu');
    if (btn1) btn1.setAttribute('href', heroContent.button1Link || '#facilities');
    const btn1En = document.getElementById('hero-btn1-en');
    if (btn1En) btn1En.setAttribute('href', heroContent.button1Link || '#facilities');

    injectBilingualText('#hero-btn2-gu', heroContent.button2TextGu, '');
    injectBilingualText('#hero-btn2-en', '', heroContent.button2TextEn);

    // Announcements
    const announcementGu = document.getElementById('banner-text-gu');
    if (announcementGu) announcementGu.innerText = heroContent.announcementGu;
    const announcementEn = document.getElementById('banner-text-en');
    if (announcementEn) announcementEn.innerText = heroContent.announcementEn;

    // Apply Background Image
    if (heroContent.bgImageUrl) {
      const heroSec = document.getElementById('home');
      if (heroSec) {
        heroSec.style.backgroundImage = `linear-gradient(to bottom, rgba(224, 242, 254, 0.9), rgba(240, 249, 255, 0.95)), url(${heroContent.bgImageUrl})`;
        heroSec.style.backgroundSize = 'cover';
        heroSec.style.backgroundPosition = 'center';
      }
    }
  }

  // Apply About Section
  function applyAbout() {
    if (!aboutContent) return;

    injectBilingualText('#about-heading-gu', aboutContent.visionHeadingGu, '');
    injectBilingualText('#about-heading-en', '', aboutContent.visionHeadingEn);

    injectBilingualText('#about-desc-gu', aboutContent.visionGu, '');
    injectBilingualText('#about-desc-en', '', aboutContent.visionEn);

    injectBilingualText('#about-quote-gu', `"${aboutContent.quoteGu}"`, '');
    injectBilingualText('#about-quote-en', '', `"${aboutContent.quoteEn}"`);
  }

  // Apply Donation details
  function applyDonation() {
    if (!donationContent) return;

    injectBilingualText('#don-title-gu', donationContent.headingGu, '');
    injectBilingualText('#don-title-en', '', donationContent.headingEn);

    injectBilingualText('#don-desc-gu', donationContent.descGu, '');
    injectBilingualText('#don-desc-en', '', donationContent.descEn);

    const bankBox = document.getElementById('donation-bank-box');
    if (bankBox) {
      bankBox.innerHTML = `
        <p class="text-xs text-sky-400 uppercase tracking-widest font-bold mb-2">Bank Transfer Details</p>
        <p class="text-sm font-mono"><strong class="text-sky-300">Bank:</strong> ${donationContent.bankName || ''}</p>
        <p class="text-sm font-mono"><strong class="text-sky-300">A/C Name:</strong> ${donationContent.acName || ''}</p>
        <p class="text-sm font-mono"><strong class="text-sky-300">A/C No:</strong> ${donationContent.acNumber || ''}</p>
        <p class="text-sm font-mono"><strong class="text-sky-300">IFSC:</strong> ${donationContent.ifsc || ''}</p>
        ${donationContent.upiId ? `<p class="text-sm font-mono"><strong class="text-sky-300">UPI ID:</strong> ${donationContent.upiId}</p>` : ''}
        ${donationContent.qrCodeUrl ? `
          <div class="mt-4 flex flex-col items-center justify-center p-3 bg-white rounded-xl max-w-[160px] mx-auto border shadow-inner">
            <img src="${donationContent.qrCodeUrl}" class="w-32 h-32 object-contain" alt="QR Code" />
            <span class="text-[9px] font-bold text-slate-500 mt-1.5 uppercase">Scan to Donate</span>
          </div>
        ` : ''}
      `;
    }
  }

  // Apply Contact details
  function applyContact() {
    if (!contactContent) return;

    const detailsBox = document.getElementById('contact-details-box');
    if (detailsBox) {
      detailsBox.innerHTML = `
        <div class="text-slate-600 text-sm leading-relaxed gu-text">
          📍 ${contactContent.addressGu}<br>
          📞 ${contactContent.phoneGu}<br>
          ✉️ ઈમેલ: ${contactContent.email}
        </div>
        <div class="text-slate-600 text-sm leading-relaxed en-text">
          📍 ${contactContent.addressEn}<br>
          📞 ${contactContent.phoneEn}<br>
          ✉️ Email: ${contactContent.email}
        </div>
        ${contactContent.whatsappUrl ? `
          <a href="https://wa.me/${contactContent.whatsappUrl.replace(/[+\s-]/g, '')}" target="_blank" class="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all">
            💬 WhatsApp Chat Support
          </a>
        ` : ''}
      `;
    }

    // Google Map embed
    if (contactContent.mapsUrl) {
      const mapBox = document.getElementById('map-iframe-container');
      if (mapBox) {
        mapBox.innerHTML = `<iframe src="${contactContent.mapsUrl}" class="w-full h-full border-none" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
      }
    }
  }

  // Load Facilities Section
  async function loadFacilitiesGrid() {
    const grid = document.getElementById('facilities-container');
    if (!grid) return;

    try {
      const res = await fetch('/api/facilities');
      const json = await res.json();
      if (json.success) {
        grid.innerHTML = '';
        json.data.forEach(item => {
          // Identify if it matches custom modals
          let modalTriggerId = '';
          if (item.titleEn.toLowerCase().includes('library')) modalTriggerId = 'library';
          else if (item.titleEn.toLowerCase().includes('training') || item.titleEn.toLowerCase().includes('workshop')) modalTriggerId = 'events';
          else if (item.titleEn.toLowerCase().includes('women')) modalTriggerId = 'women';

          const card = document.createElement('div');
          card.id = item._id || item.id;
          card.className = `bg-sky-50 p-6 rounded-2xl border border-sky-100 hover:shadow-md transition-all cursor-pointer`;
          
          if (modalTriggerId) {
            card.addEventListener('click', () => openCmsModal(modalTriggerId));
          } else {
            card.addEventListener('click', () => window.location.hash = '#contact');
          }

          card.innerHTML = `
            <div class="text-3xl mb-4">${item.icon}</div>
            <h4 class="font-bold text-lg text-sky-900 gu-text">${item.titleGu}</h4>
            <h4 class="font-bold text-lg text-sky-900 en-text">${item.titleEn}</h4>
            <p class="text-slate-600 text-sm mt-2 leading-relaxed gu-text">${item.descGu}</p>
            <p class="text-slate-600 text-sm mt-2 leading-relaxed en-text">${item.descEn}</p>
          `;
          grid.appendChild(card);
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Load Announcements / Notices Circular Board
  async function loadNoticesCirculars() {
    const list = document.getElementById('notices-container');
    if (!list) return;

    try {
      const res = await fetch('/api/notices');
      const json = await res.json();
      if (json.success) {
        list.innerHTML = '';
        if (json.data.length === 0) {
          list.innerHTML = `<p class="p-6 text-center text-slate-500 text-sm">No active announcements posted at this time.</p>`;
          return;
        }

        json.data.forEach(item => {
          const row = document.createElement('div');
          row.className = `p-4 flex flex-wrap justify-between items-center gap-2 ${
            item.isUrgent ? 'bg-amber-50/40' : ''
          }`;

          row.innerHTML = `
            <div>
              <span class="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded font-bold uppercase tracking-wider gu-text">${item.categoryGu}</span>
              <span class="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded font-bold uppercase tracking-wider en-text">${item.categoryEn}</span>
              <h4 class="font-semibold text-slate-800 mt-1 text-sm md:text-base gu-text">${item.titleGu}</h4>
              <h4 class="font-semibold text-slate-800 mt-1 text-sm md:text-base en-text">${item.titleEn}</h4>
            </div>
            <a href="${item.pdfUrl}" target="_blank" class="notice-download-btn bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-3 py-2 rounded-lg flex items-center gap-1 transition-all" data-id="${item._id || item.id}">
              📄 PDF (${item.fileSize})
            </a>
          `;

          // Track download clicks
          const downloadBtn = row.querySelector('.notice-download-btn');
          if (downloadBtn) {
            downloadBtn.addEventListener('click', (e) => {
              const noticeId = downloadBtn.getAttribute('data-id');
              // Increment circular analytics trigger
              fetch(`/api/library/download/${noticeId}`, { method: 'POST' }).catch(err => console.error(err));
            });
          }

          list.appendChild(row);
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Setup Contact Form Submitter
  function setupInquiryForm() {
    const form = document.getElementById('public-contact-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('form-name').value;
      const phone = document.getElementById('form-phone').value;
      const email = document.getElementById('form-email').value;
      const message = document.getElementById('form-message').value;

      try {
        const res = await fetch('/api/inquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, email, message })
        });
        const json = await res.json();
        if (json.success) {
          alert('Inquiry Details Submitted Successfully! Thank you.');
          form.reset();
        } else {
          alert(json.message || 'Submission failed');
        }
      } catch (err) {
        console.error(err);
        alert('Server connection failed. Try again.');
      }
    });
  }

  // Intercept Navigation hash changes to trigger Modals
  function setupModalListeners() {
    document.querySelectorAll('.modal-link').forEach(link => {
      link.addEventListener('click', (e) => {
        const hash = link.getAttribute('href');
        if (hash.startsWith('#')) {
          e.preventDefault();
          const targetModal = hash.substring(1);
          openCmsModal(targetModal);
        }
      });
    });
  }

  // Render modal content dynamically based on target type
  async function openCmsModal(type) {
    const root = document.getElementById('cms-modals-root');
    if (!root) return;

    document.body.classList.add('modal-active');
    root.innerHTML = `
      <div id="modal-container" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 backdrop-blur-xs p-4 animate-fadeIn">
        <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-3xl h-[85vh] rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col justify-between relative animate-scale">
          <button id="close-modal-btn" class="absolute top-4 right-4 p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-lg font-bold">&times;</button>
          
          <div id="modal-body-viewport" class="flex-1 overflow-y-auto pr-1">
            <!-- Loader -->
            <div class="flex justify-center items-center h-full">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    const closeBtn = document.getElementById('close-modal-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeCmsModal);
    }

    // Route view rendering
    if (type === 'library') await renderLibraryModal();
    else if (type === 'events') await renderEventsModal();
    else if (type === 'women') await renderWomenModal();
  }

  function closeCmsModal() {
    const root = document.getElementById('cms-modals-root');
    if (root) root.innerHTML = '';
    document.body.classList.remove('modal-active');
  }

  // Dynamic Library Catalogue renderer inside Modal
  async function renderLibraryModal() {
    const viewport = document.getElementById('modal-body-viewport');
    if (!viewport) return;

    try {
      const res = await fetch('/api/library');
      const json = await res.json();
      if (json.success) {
        viewport.innerHTML = `
          <div>
            <h3 class="text-xl font-bold text-sky-900 dark:text-sky-400 mb-2 gu-text">ડીજીટલ પુસ્તકાલય અને વાચન ખંડ</h3>
            <h3 class="text-xl font-bold text-sky-900 dark:text-sky-400 mb-2 en-text">Digital Library wing</h3>
            <p class="text-xs text-slate-500 mb-6 gu-text">પરીક્ષા તૈયારી ફાઇલો અને પુસ્તકો ઓનલાઇન ડાઉનલોડ કરો</p>
            <p class="text-xs text-slate-500 mb-6 en-text">Download textbook guidelines and competitive syllabus files</p>
            
            <div class="grid md:grid-cols-2 gap-4">
              ${json.data.map(book => `
                <div class="border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex gap-3 bg-slate-50 dark:bg-slate-900/50">
                  <div class="w-14 h-18 bg-slate-100 border dark:border-slate-700 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                    ${book.coverUrl ? `<img src="${book.coverUrl}" class="w-full h-full object-cover" />` : '📚'}
                  </div>
                  <div class="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 class="font-bold text-sm text-slate-900 dark:text-white leading-tight">${book.title}</h4>
                      <p class="text-[11px] text-slate-500 mt-1">${book.author || 'Mentorship Cell'}</p>
                    </div>
                    <a href="${book.pdfUrl}" target="_blank" class="book-dl-link text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 mt-2 cursor-pointer" data-id="${book._id || book.id}">
                      📥 Download PDF Document
                    </a>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;

        // Bind download trackers
        viewport.querySelectorAll('.book-dl-link').forEach(link => {
          link.addEventListener('click', () => {
            const bookId = link.getAttribute('data-id');
            fetch(`/api/library/download/${bookId}`, { method: 'POST' }).catch(err => console.error(err));
          });
        });
      }
    } catch (e) {
      viewport.innerHTML = `<p class="text-slate-500 text-xs">Failed to load library resources.</p>`;
    }
  }

  // Dynamic Seminar Events renderer inside Modal
  async function renderEventsModal() {
    const viewport = document.getElementById('modal-body-viewport');
    if (!viewport) return;

    try {
      const res = await fetch('/api/events?archived=false');
      const json = await res.json();
      if (json.success) {
        viewport.innerHTML = `
          <div>
            <h3 class="text-xl font-bold text-sky-900 dark:text-sky-400 mb-2 gu-text">આગામી તાલીમ અને સેમિનારો</h3>
            <h3 class="text-xl font-bold text-sky-900 dark:text-sky-400 mb-2 en-text">Workshops & Training camps</h3>
            <p class="text-xs text-slate-500 mb-6 gu-text">ગામના પ્રગતિ કાર્યક્રમોમાં રજીસ્ટ્રેશન કરાવો</p>
            <p class="text-xs text-slate-500 mb-6 en-text">Enroll in digital skills or organic agriculture classes</p>
            
            <div class="space-y-6">
              ${json.data.length === 0 ? `
                <p class="text-slate-500 text-xs py-8 text-center">No active upcoming seminars scheduled at the moment.</p>
              ` : json.data.map(event => `
                <div class="border border-slate-200 dark:border-slate-800 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                  <div class="flex justify-between items-center pb-2 border-b dark:border-slate-800">
                    <span class="text-xs font-bold text-sky-600">📅 ${new Date(event.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                    <span class="text-xs text-slate-500 font-semibold">📍 ${event.locationEn}</span>
                  </div>
                  <h4 class="font-bold text-slate-900 dark:text-white mt-3 gu-text">${event.titleGu}</h4>
                  <h4 class="font-bold text-slate-900 dark:text-white mt-3 en-text">${event.titleEn}</h4>
                  <p class="text-xs text-slate-500 mt-2 leading-relaxed gu-text">${event.descGu}</p>
                  <p class="text-xs text-slate-500 mt-2 leading-relaxed en-text">${event.descEn}</p>
                  
                  ${event.registrationLink ? `
                    <a href="${event.registrationLink}" target="_blank" class="inline-block mt-4 bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition-all cursor-pointer">
                      Register Online Now
                    </a>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }
    } catch (e) {
      viewport.innerHTML = `<p class="text-slate-500 text-xs">Failed to load event details.</p>`;
    }
  }

  // Dynamic Women Empowerment information inside Modal
  async function renderWomenModal() {
    const viewport = document.getElementById('modal-body-viewport');
    if (!viewport) return;

    // Load detailed descriptions matching local block
    viewport.innerHTML = `
      <div>
        <h3 class="text-xl font-bold text-sky-900 dark:text-sky-400 mb-2 gu-text">મહિલા સશક્તિકરણ પાંખ</h3>
        <h3 class="text-xl font-bold text-sky-900 dark:text-sky-400 mb-2 en-text">Women Empowerment wing</h3>
        <p class="text-xs text-slate-500 mb-6 gu-text">ગૃહ ઉદ્યોગ તાલીમ અને આર્થિક પગભર બનાવવાના વર્ગો</p>
        <p class="text-xs text-slate-500 mb-6 en-text">Vocational courses and digital skills for entrepreneurship</p>
        
        <div class="grid md:grid-cols-2 gap-5 leading-relaxed text-sm text-slate-600 dark:text-slate-400">
          <div class="border border-slate-200 dark:border-slate-800 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
            <h4 class="font-bold text-slate-900 dark:text-white mb-2 gu-text">વર્તમાન તાલીમ વર્ગો:</h4>
            <h4 class="font-bold text-slate-900 dark:text-white mb-2 en-text">Active Vocations:</h4>
            <ul class="list-disc pl-5 space-y-1 text-xs">
              <li class="gu-text">ટપક સિલાઈ અને સીવણ વર્ગો (Tailoring & Design)</li>
              <li class="en-text">Tailoring & Apparel Design classes</li>
              <li class="gu-text">ગૃહ ઉદ્યોગ પ્રોડક્ટ્સ પેકિંગ તાલીમ</li>
              <li class="en-text">Small products packaging modules</li>
              <li class="gu-text">બેઝિક કમ્પ્યુટર લિટરસી પ્રોગ્રામ</li>
              <li class="en-text">Basic computer & internet operations</li>
            </ul>
          </div>

          <div class="border border-slate-200 dark:border-slate-800 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 flex flex-col justify-center">
            <blockquote class="italic border-l-4 border-amber-500 pl-4 text-xs">
              <p class="gu-text">"મહિલાઓ આત્મનિર્ભર બને ત્યારે આખો પરિવાર અને ગામ સમૃદ્ધ બને છે."</p>
              <p class="en-text">"When a woman achieves economic independence, she strengthens her entire household and blocks."</p>
            </blockquote>
          </div>
        </div>
      </div>
    `;
  }
})();
