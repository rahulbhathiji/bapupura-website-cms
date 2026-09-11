// Dynamically resolve backend base so the site works across the LAN.
// When served from port 8080 (dev), backend is on port 5000 of the same host.
// When served directly from port 5000, use the same origin.
const BACKEND_BASE = (window.location.port === '8080')
    ? window.location.protocol + '//' + window.location.hostname + ':5000'
    : window.location.protocol + '//' + window.location.host;
const API_BASE = BACKEND_BASE + '/api';

/**
 * Language Management System
 */
function getCurrentLang() {
    return localStorage.getItem('bapupura_lang') || 'gu';
}

function setLanguage(lang) {
    var body = document.body;
    if (lang === 'en') {
        body.classList.remove('lang-gu');
        body.classList.add('lang-en');
    } else {
        body.classList.remove('lang-en');
        body.classList.add('lang-gu');
    }
    localStorage.setItem('bapupura_lang', lang);
    syncLanguage();
}

function toggleLanguage() {
    var isCurrentEn = document.body.classList.contains('lang-en');
    var nextLang = isCurrentEn ? 'gu' : 'en';
    setLanguage(nextLang);
}

/**
 * syncLanguage — Re-applies the current lang-gu / lang-en state.
 * Syncs CSS classes, button labels, and ensures dynamic content obeys active language.
 */
function syncLanguage() {
    var body = document.body;
    var isEn = body.classList.contains('lang-en');
    var isGu = !isEn;

    if (isEn) {
        body.classList.remove('lang-gu');
        body.classList.add('lang-en');
    } else {
        body.classList.remove('lang-en');
        body.classList.add('lang-gu');
    }

    // Explicitly toggle display property to guarantee instant and reliable switching across all browsers
    document.querySelectorAll('.gu-text').forEach(function(el) {
        if (isEn) {
            el.style.setProperty('display', 'none', 'important');
        } else {
            el.style.removeProperty('display');
        }
    });

    document.querySelectorAll('.en-text').forEach(function(el) {
        if (isGu) {
            el.style.setProperty('display', 'none', 'important');
        } else {
            el.style.removeProperty('display');
        }
    });

    // Update all language toggle button labels
    document.querySelectorAll('.lang-btn-text, #langBtnText').forEach(function(el) {
        el.textContent = isEn ? 'ગુજરાતી' : 'English';
    });
}

function toggleMobileMenu() {
    var drawer = document.getElementById('mobileDrawer');
    if (!drawer) return;
    if (drawer.classList.contains('hidden')) {
        drawer.classList.remove('hidden');
    } else {
        drawer.classList.add('hidden');
    }
}

// Attach functions to window for CSP and global inline compatibility
window.getCurrentLang = getCurrentLang;
window.setLanguage = setLanguage;
window.toggleLanguage = toggleLanguage;
window.syncLanguage = syncLanguage;
window.toggleMobileMenu = toggleMobileMenu;

// Fix relative upload URLs to absolute (for backward compat with old data)
function fixUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    if (url.startsWith('/')) return BACKEND_BASE + url;
    return url;
}

document.addEventListener('DOMContentLoaded', () => {
    // Restore saved language preference immediately
    var savedLang = getCurrentLang();
    setLanguage(savedLang);

    // Bind click listeners for all language toggle buttons
    document.querySelectorAll('#language-toggle-btn, #mobile-language-toggle-btn, .lang-toggle-btn').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            toggleLanguage();
        });
    });

    // Mobile menu toggle listeners
    var mobileToggleBtn = document.getElementById('mobile-menu-toggle-btn');
    if (mobileToggleBtn) {
        mobileToggleBtn.addEventListener('click', toggleMobileMenu);
    }
    var mobileCloseBtn = document.getElementById('mobile-menu-close-btn');
    if (mobileCloseBtn) {
        mobileCloseBtn.addEventListener('click', toggleMobileMenu);
    }
    document.querySelectorAll('#mobileDrawer nav a').forEach(function(link) {
        link.addEventListener('click', function() {
            var drawer = document.getElementById('mobileDrawer');
            if (drawer) drawer.classList.add('hidden');
        });
    });

    initRouter();
    fetchCMSData();
    fetchGalleryData();
    initSliders();
    fetchFounder();
    window.addEventListener('hashchange', initRouter);
});

function getYouTubeDetails(url) {
    if (!url) return null;
    var fixed = fixUrl(url);
    var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    var match = fixed.match(regExp);
    if (match && match[2].length === 11) {
        var videoId = match[2];
        return {
            isYouTube: true,
            videoId: videoId,
            embedUrl: 'https://www.youtube.com/embed/' + videoId,
            thumbnailUrl: 'https://img.youtube.com/vi/' + videoId + '/hqdefault.jpg'
        };
    }
    return {
        isYouTube: false,
        videoUrl: fixed
    };
}

function renderVideoCardHtml(videoUrl, titleGu, titleEn) {
    var yt = getYouTubeDetails(videoUrl);
    if (yt && yt.isYouTube) {
        var id = 'yt_' + Math.random().toString(36).substr(2, 9);
        return '<div class="flex flex-col gap-2 group">' +
            '<div id="' + id + '" class="relative h-56 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-black group-hover:shadow-md transition-all cursor-pointer">' +
                '<img src="' + yt.thumbnailUrl + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="YouTube Thumbnail" />' +
                '<div class="absolute inset-0 bg-black/30 flex items-center justify-center">' +
                    '<button onclick="playYouTubeEmbed(\'' + id + '\', \'' + yt.embedUrl + '\')" class="w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg transition-transform transform group-hover:scale-110 cursor-pointer" title="Play Video">' +
                        '<svg class="w-7 h-7 fill-current translate-x-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>' +
                    '</button>' +
                '</div>' +
            '</div>' +
            '<div class="font-bold text-sm text-slate-800">' +
                '<span class="gu-text">' + (titleGu || titleEn || 'ઇવેન્ટ વિડિઓ') + '</span>' +
                '<span class="en-text">' + (titleEn || titleGu || 'Event Video') + '</span>' +
            '</div>' +
        '</div>';
    }
    return '<div class="flex flex-col gap-2">' +
        '<video src="' + fixUrl(videoUrl) + '" controls class="w-full h-56 rounded-2xl bg-black object-contain border border-slate-200 shadow-sm"></video>' +
        '<div class="font-bold text-sm text-slate-800">' +
            '<span class="gu-text">' + (titleGu || titleEn || 'ઇવેન્ટ વિડિઓ') + '</span>' +
            '<span class="en-text">' + (titleEn || titleGu || 'Event Video') + '</span>' +
        '</div>' +
    '</div>';
}

function playYouTubeEmbed(containerId, embedUrl) {
    var container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '<iframe src="' + embedUrl + '?autoplay=1" class="w-full h-full rounded-2xl" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
    }
}
window.playYouTubeEmbed = playYouTubeEmbed;

function initRouter() {
    var hash = window.location.hash || '#home';
    var dynamicContainer = document.getElementById('dynamic-page');
    var staticSections = document.querySelectorAll('section:not(#dynamic-page)');
    var founderSec = document.getElementById('founder-section-container');

    var isDynamic = (
        hash.indexOf('#/page/') === 0 ||
        hash.indexOf('#/facility/') === 0 ||
        hash.indexOf('#/event/') === 0 ||
        hash.indexOf('#/notice/') === 0 ||
        hash === '#/donors' ||
        hash.indexOf('#/donors') === 0 ||
        hash.indexOf('#/donor/') === 0 ||
        hash === '#/committees' ||
        hash.indexOf('#/committees') === 0
    );

    if (isDynamic) {
        staticSections.forEach(function(sec) { sec.style.display = 'none'; });
        if (founderSec) founderSec.style.display = 'none';
        dynamicContainer.style.display = 'block';
        dynamicContainer.innerHTML = '<div class="text-center py-20 text-sky-700 text-xl font-semibold">Loading...</div>';
        loadDynamicContent(hash);
    } else {
        staticSections.forEach(function(sec) { sec.style.display = 'block'; });
        if (founderSec) {
            if (founderSec.dataset.hasData === 'true') {
                founderSec.style.display = 'block';
            } else {
                founderSec.style.display = 'none';
            }
        }
        dynamicContainer.style.display = 'none';
    }
}

async function loadDynamicContent(hash) {
    // parse: #/type/slug  e.g. #/facility/library  or  #/donors
    var withoutHash = hash.replace('#/', '');
    var slashIdx = withoutHash.indexOf('/');
    var type = slashIdx === -1 ? withoutHash : withoutHash.substring(0, slashIdx);
    var slug = slashIdx === -1 ? '' : withoutHash.substring(slashIdx + 1);

    var container = document.getElementById('dynamic-page');

    try {
        if (type === 'donors') {
            await renderDonorsList(container);
            return;
        }

        if (type === 'committees') {
            await renderCommitteesPage(container);
            return;
        }

        if (type === 'donor' && slug) {
            var res = await fetch(API_BASE + '/donors/' + slug);
            var json = await res.json();
            if (json.success) {
                renderDonorDetail(json.data, container);
            } else {
                container.innerHTML = '<div class="text-center py-20 text-red-500">Donor not found.</div>';
            }
            return;
        }

        if (type === 'facility' && slug) {
            var facRes = await fetch(API_BASE + '/facilities');
            var facJson = await facRes.json();
            var facilities = facJson.data || [];
            var found = null;
            for (var i = 0; i < facilities.length; i++) {
                var f = facilities[i];
                var fSlug = (f.slug || '').toLowerCase();
                if (fSlug === slug.toLowerCase() || f._id === slug || f.id === slug) {
                    found = f;
                    break;
                }
            }
            if (found) {
                renderDynamicFacility(found, container);
            } else {
                container.innerHTML = '<div class="text-center py-20 text-red-500">Facility not found.</div>';
            }
            return;
        }

        if (type === 'page' && slug) {
            var pageRes = await fetch(API_BASE + '/pages');
            var pageJson = await pageRes.json();
            var pages = pageJson.data || [];
            var foundPage = null;
            for (var j = 0; j < pages.length; j++) {
                if (pages[j].slug === slug) {
                    foundPage = pages[j];
                    break;
                }
            }
            if (foundPage) {
                renderDynamicPage(foundPage, container);
            } else {
                container.innerHTML = '<div class="text-center py-20 text-red-500">Page not found.</div>';
            }
            return;
        }

        container.innerHTML = '<div class="text-center py-20 text-red-500">Content not found.</div>';

    } catch(err) {
        container.innerHTML = '<div class="text-center py-20 text-red-500">Error loading content: ' + err.message + '</div>';
    }
}

function renderDynamicPage(page, container) {
    var banner = page.bannerImage ? '<img src="' + fixUrl(page.bannerImage) + '" class="w-full h-64 md:h-80 object-cover rounded-2xl mb-8 shadow-sm" />' : '';
    var sec = page.enabledSections || {
        enableContent: true, enableGallery: true, enableVideos: true, enableDocuments: true, enableLinks: true
    };

    // Information Rich Text
    var contentHtml = '';
    if (sec.enableContent !== false && (page.contentGu || page.contentEn)) {
        contentHtml =
            '<div class="prose max-w-none text-slate-700 leading-relaxed mb-8 gu-text">' + (page.contentGu || '') + '</div>' +
            '<div class="prose max-w-none text-slate-700 leading-relaxed mb-8 en-text">' + (page.contentEn || '') + '</div>';
    }

    // Photo Gallery
    var galleryHtml = '';
    if (sec.enableGallery !== false && page.galleryImages && page.galleryImages.length > 0) {
        var imgs = page.galleryImages.map(function(img) {
            var url = fixUrl(img.url || img);
            var capGu = img.captionGu || '';
            var capEn = img.captionEn || '';
            return '<div class="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square shadow-xs hover:shadow-md transition-all">' +
                '<img src="' + url + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />' +
                (capGu || capEn ? (
                    '<div class="absolute bottom-0 inset-x-0 bg-black/70 backdrop-blur-xs text-white text-[11px] p-2 text-center truncate">' +
                        '<span class="gu-text">' + capGu + '</span>' +
                        '<span class="en-text">' + capEn + '</span>' +
                    '</div>'
                ) : '') +
            '</div>';
        }).join('');
        galleryHtml =
            '<div class="mt-10 border-t border-slate-100 pt-8">' +
                '<h3 class="text-2xl font-bold text-sky-950 mb-6 gu-text">📷 ફોટો ગેલેરી</h3>' +
                '<h3 class="text-2xl font-bold text-sky-950 mb-6 en-text">📷 Photo Gallery</h3>' +
                '<div class="grid grid-cols-2 md:grid-cols-4 gap-4">' + imgs + '</div>' +
            '</div>';
    }

    // Video Gallery
    var videosHtml = '';
    if (sec.enableVideos !== false && page.videos && page.videos.length > 0) {
        var vids = page.videos.map(function(v) {
            return renderVideoCardHtml(v.url || '', v.titleGu, v.titleEn);
        }).join('');
        videosHtml =
            '<div class="mt-10 border-t border-slate-100 pt-8">' +
                '<h3 class="text-2xl font-bold text-sky-950 mb-6 gu-text">🎬 વિડિઓ ગેલેરી</h3>' +
                '<h3 class="text-2xl font-bold text-sky-950 mb-6 en-text">🎬 Video Gallery</h3>' +
                '<div class="grid grid-cols-1 md:grid-cols-2 gap-6">' + vids + '</div>' +
            '</div>';
    }

    // Documents
    var docsHtml = '';
    if (sec.enableDocuments !== false && page.documents && page.documents.length > 0) {
        var docs = page.documents.map(function(doc) {
            var fixedDoc = fixUrl(doc.url || doc);
            var titleGu = doc.titleGu || doc.titleEn || 'દસ્તાવેજ ડાઉનલોડ';
            var titleEn = doc.titleEn || doc.titleGu || 'Download Document';
            var size = doc.fileSize ? ' (' + doc.fileSize + ')' : '';
            return '<a href="' + fixedDoc + '" target="_blank" class="flex items-center gap-3 p-4 bg-sky-50 hover:bg-sky-100 rounded-xl border border-sky-100 transition-all font-semibold text-sky-900 group">' +
                '<span class="text-2xl">📄</span>' +
                '<div class="flex-1">' +
                    '<span class="gu-text block">' + titleGu + size + '</span>' +
                    '<span class="en-text block">' + titleEn + size + '</span>' +
                '</div>' +
                '<span class="text-xs bg-sky-600 text-white px-3 py-1.5 rounded-lg shadow-xs group-hover:bg-sky-700 transition-colors">Download ⬇</span>' +
            '</a>';
        }).join('');
        docsHtml =
            '<div class="mt-10 border-t border-slate-100 pt-8">' +
                '<h3 class="text-2xl font-bold text-sky-950 mb-6 gu-text">📄 દસ્તાવેજો અને પત્રકો</h3>' +
                '<h3 class="text-2xl font-bold text-sky-950 mb-6 en-text">📄 Documents & Downloads</h3>' +
                '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">' + docs + '</div>' +
            '</div>';
    }

    // Links
    var linksHtml = '';
    if (sec.enableLinks !== false && page.links && page.links.length > 0) {
        var linkItems = page.links.map(function(l) {
            var tGu = l.titleGu || l.titleEn || l.url;
            var tEn = l.titleEn || l.titleGu || l.url;
            return '<a href="' + l.url + '" target="_blank" class="inline-flex items-center gap-2 p-3 bg-white hover:bg-slate-50 border border-slate-200 shadow-xs hover:shadow-md rounded-xl text-sky-700 font-bold transition-all text-sm">' +
                '<span>🔗</span>' +
                '<span class="gu-text">' + tGu + '</span>' +
                '<span class="en-text">' + tEn + '</span>' +
            '</a>';
        }).join('');
        linksHtml =
            '<div class="mt-10 border-t border-slate-100 pt-8">' +
                '<h3 class="text-2xl font-bold text-sky-950 mb-6 gu-text">🔗 ઉપયોગી લિંક્સ</h3>' +
                '<h3 class="text-2xl font-bold text-sky-950 mb-6 en-text">🔗 Useful External Links</h3>' +
                '<div class="flex flex-wrap gap-3">' + linkItems + '</div>' +
            '</div>';
    }

    container.innerHTML =
        '<div class="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-sky-100/80">' +
            banner +
            '<h1 class="text-3xl md:text-5xl font-extrabold text-sky-950 mb-6 gu-text tracking-tight">' + (page.titleGu || '') + '</h1>' +
            '<h1 class="text-3xl md:text-5xl font-extrabold text-sky-950 mb-6 en-text tracking-tight">' + (page.titleEn || '') + '</h1>' +
            contentHtml +
            galleryHtml +
            videosHtml +
            docsHtml +
            linksHtml +
        '</div>';
    syncLanguage();
}

function renderDynamicFacility(facility, container) {
    var banner = facility.bannerImage ? '<img src="' + fixUrl(facility.bannerImage) + '" class="w-full h-64 object-cover rounded-xl mb-8" />' : '';
    var icon = facility.icon || '';

    var galleryHtml = '';
    if (facility.galleryImages && facility.galleryImages.length > 0) {
        var imgs = facility.galleryImages.map(function(img) {
            return '<img src="' + fixUrl(img) + '" class="w-full h-40 object-cover rounded-lg border border-slate-200 shadow-sm hover:opacity-90 transition-opacity cursor-pointer" />';
        }).join('');
        galleryHtml =
            '<h3 class="text-xl font-bold mt-8 mb-4 gu-text">ફોટો ગેલેરી</h3>' +
            '<h3 class="text-xl font-bold mt-8 mb-4 en-text">Photo Gallery</h3>' +
            '<div class="grid grid-cols-2 md:grid-cols-4 gap-4">' + imgs + '</div>';
    }

    var videosHtml = '';
    if (facility.videos && facility.videos.length > 0) {
        var vids = facility.videos.map(function(vid) {
            return renderVideoCardHtml(vid.url || vid, vid.titleGu, vid.titleEn);
        }).join('');
        videosHtml =
            '<h3 class="text-xl font-bold mt-8 mb-4 gu-text">વિડિઓઝ</h3>' +
            '<h3 class="text-xl font-bold mt-8 mb-4 en-text">Videos</h3>' +
            '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">' + vids + '</div>';
    }

    var docsHtml = '';
    if (facility.documents && facility.documents.length > 0) {
        var docs = facility.documents.map(function(doc) {
            var fixedDoc = fixUrl(doc);
            var name = fixedDoc.split('/').pop().split('?')[0] || 'Download Document';
            return '<a href="' + fixedDoc + '" target="_blank" class="text-sky-600 hover:underline flex items-center gap-2">📄 ' + name + '</a>';
        }).join('');
        docsHtml =
            '<h3 class="text-xl font-bold mt-8 mb-4 gu-text">દસ્તાવેજો</h3>' +
            '<h3 class="text-xl font-bold mt-8 mb-4 en-text">Documents</h3>' +
            '<div class="flex flex-col gap-2">' + docs + '</div>';
    }

    var linksHtml = '';
    if (facility.links && facility.links.length > 0) {
        var linkItems = facility.links.map(function(l) {
            return '<a href="' + l.url + '" target="_blank" class="text-sky-600 hover:underline">🔗 ' + (l.title || l.url) + '</a>';
        }).join('');
        linksHtml =
            '<h3 class="text-xl font-bold mt-8 mb-4 gu-text">ઉપયોગી લિંક્સ</h3>' +
            '<h3 class="text-xl font-bold mt-8 mb-4 en-text">Useful Links</h3>' +
            '<div class="flex flex-col gap-2">' + linkItems + '</div>';
    }

    container.innerHTML =
        '<a href="#facilities" class="inline-flex items-center gap-2 text-sky-600 hover:underline font-medium mb-6">← <span class="gu-text">પાછળ</span><span class="en-text">Back to Facilities</span></a>' +
        '<div class="bg-white p-8 rounded-2xl shadow-sm border border-sky-100">' +
            banner +
            '<div class="flex items-center gap-4 mb-6">' +
                '<div class="text-5xl">' + icon + '</div>' +
                '<div>' +
                    '<h1 class="text-3xl font-bold text-sky-900 gu-text">' + (facility.titleGu || '') + '</h1>' +
                    '<h1 class="text-3xl font-bold text-sky-900 en-text">' + (facility.titleEn || '') + '</h1>' +
                '</div>' +
            '</div>' +
            '<div class="text-slate-600 leading-relaxed mb-6 gu-text">' + (facility.descGu || '') + '</div>' +
            '<div class="text-slate-600 leading-relaxed mb-6 en-text">' + (facility.descEn || '') + '</div>' +
            '<div class="text-slate-700 leading-relaxed gu-text">' + (facility.contentGu || '') + '</div>' +
            '<div class="text-slate-700 leading-relaxed en-text">' + (facility.contentEn || '') + '</div>' +
            galleryHtml +
            videosHtml +
            docsHtml +
            linksHtml +
        '</div>';
    syncLanguage();
}

async function renderDonorsList(container) {
    try {
        var res = await fetch(API_BASE + '/donors');
        var json = await res.json();
        var donors = json.data || [];

        var cardsHtml = '';
        if (donors.length === 0) {
            cardsHtml = '<div class="col-span-4 text-center py-12 text-slate-400">No donors added yet.</div>';
        } else {
            cardsHtml = donors.map(function(d) {
                var photo = fixUrl(d.photoUrl) || 'https://placehold.co/150x150/e0f2fe/0369a1?text=' + encodeURIComponent((d.nameEn || 'D').charAt(0));
                var featured = d.isFeatured ? '<span class="mt-2 text-xs font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded">⭐ Featured</span>' : '';
                return '<a href="#/donor/' + (d._id || d.id) + '" class="bg-white rounded-2xl shadow-sm hover:shadow-md border border-sky-100 p-6 text-center transition-all flex flex-col items-center group">' +
                    '<img src="' + photo + '" class="w-24 h-24 rounded-full object-cover mb-4 border-4 border-sky-50 shadow-sm group-hover:border-sky-200 transition-all" alt="' + (d.nameEn || '') + '" />' +
                    '<h3 class="font-bold text-lg text-slate-800 gu-text">' + (d.nameGu || '') + '</h3>' +
                    '<h3 class="font-bold text-lg text-slate-800 en-text">' + (d.nameEn || '') + '</h3>' +
                    featured +
                '</a>';
            }).join('');
        }

        container.innerHTML =
            '<div class="text-center mb-10">' +
                '<h1 class="text-4xl font-bold text-sky-900 mb-4 gu-text">અમારા દાતાઓ</h1>' +
                '<h1 class="text-4xl font-bold text-sky-900 mb-4 en-text">Our Donors</h1>' +
                '<p class="text-slate-600 gu-text">તમારા અમૂલ્ય યોગદાન બદલ આભાર.</p>' +
                '<p class="text-slate-600 en-text">Thank you for your invaluable contributions.</p>' +
            '</div>' +
            '<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">' +
                cardsHtml +
            '</div>';
    } catch(e) {
        container.innerHTML = '<div class="text-center py-20 text-red-500">Failed to load donors. (' + e.message + ')</div>';
    }
}

function renderDonorDetail(donor, container) {
    var photo = fixUrl(donor.photoUrl) || 'https://placehold.co/200x200/e0f2fe/0369a1?text=' + encodeURIComponent((donor.nameEn || 'D').charAt(0));
    container.innerHTML =
        '<a href="#/donors" class="inline-flex items-center gap-2 text-sky-600 hover:underline font-medium mb-6">← <span class="gu-text">દાતા સૂચિ</span><span class="en-text">Back to Donors</span></a>' +
        '<div class="bg-white rounded-3xl shadow-lg overflow-hidden border border-sky-100 max-w-4xl mx-auto">' +
            '<div class="bg-gradient-to-r from-sky-700 to-sky-900 h-32 md:h-48"></div>' +
            '<div class="px-8 pb-8 relative">' +
                '<img src="' + photo + '" class="w-32 h-32 md:w-48 md:h-48 rounded-full object-cover border-8 border-white shadow-md absolute -top-16 md:-top-24 bg-white" alt="Donor Photo" />' +
                '<div class="pt-20 md:pt-28">' +
                    '<h1 class="text-3xl md:text-5xl font-bold text-slate-800 gu-text mb-2">' + (donor.nameGu || '') + '</h1>' +
                    '<h1 class="text-3xl md:text-5xl font-bold text-slate-800 en-text mb-2">' + (donor.nameEn || '') + '</h1>' +
                    '<div class="text-lg text-slate-500 font-medium italic gu-text mb-6">' + (donor.bioGu || '') + '</div>' +
                    '<div class="text-lg text-slate-500 font-medium italic en-text mb-6">' + (donor.bioEn || '') + '</div>' +
                    '<div class="prose max-w-none text-slate-700 mt-8 border-t border-slate-100 pt-8 gu-text">' + (donor.detailsGu || '') + '</div>' +
                    '<div class="prose max-w-none text-slate-700 mt-8 border-t border-slate-100 pt-8 en-text">' + (donor.detailsEn || '') + '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    syncLanguage();
}

async function renderCommitteesPage(container) {
    try {
        var res = await fetch(API_BASE + '/committees');
        var json = await res.json();
        var members = json.data || [];

        var trustees = members.filter(function(m) { return m.committeeType === 'trustees'; });
        var advisory = members.filter(function(m) { return m.committeeType === 'advisory'; });
        var executive = members.filter(function(m) { return m.committeeType === 'executive'; });

        trustees.sort(function(a, b) { return (a.order || 0) - (b.order || 0); });
        advisory.sort(function(a, b) { return (a.order || 0) - (b.order || 0); });
        executive.sort(function(a, b) { return (a.order || 0) - (b.order || 0); });

        function buildMemberCards(list, badgeLabelGu, badgeLabelEn, colorClass) {
            if (!list || list.length === 0) {
                return '<div class="col-span-full text-center py-8 text-slate-400">માહિતી ઉપલબ્ધ નથી / No members available</div>';
            }
            return list.map(function(m) {
                var photo = fixUrl(m.photoUrl);
                var photoHtml = photo
                    ? '<img src="' + photo + '" alt="' + (m.nameEn || '') + '" class="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md mx-auto mb-3" />'
                    : '<div class="w-24 h-24 rounded-full bg-gradient-to-br from-sky-600 to-sky-800 text-white font-extrabold text-2xl flex items-center justify-center border-4 border-white shadow-md mx-auto mb-3">' + (m.nameEn || 'M').charAt(0) + '</div>';

                return '<div class="bg-white rounded-2xl p-5 border border-slate-100 shadow-md hover:shadow-xl transition-all text-center flex flex-col items-center justify-between group relative overflow-hidden">' +
                    '<div class="absolute top-3 right-3 text-xs font-bold bg-slate-100 text-slate-500 w-6 h-6 rounded-full flex items-center justify-center shadow-xs">' + (m.order || 1) + '</div>' +
                    '<div class="w-full">' +
                        photoHtml +
                        '<h4 class="font-extrabold text-slate-900 text-base leading-snug gu-text mb-0.5">' + (m.nameGu || '') + '</h4>' +
                        '<h4 class="font-extrabold text-slate-900 text-base leading-snug en-text mb-0.5">' + (m.nameEn || '') + '</h4>' +
                        (m.designationGu || m.designationEn ? (
                            '<div class="mt-3 pt-2.5 border-t border-slate-100 w-full text-xs font-semibold text-sky-700">' +
                                '<p class="gu-text">' + (m.designationGu || '') + '</p>' +
                                '<p class="en-text">' + (m.designationEn || '') + '</p>' +
                            '</div>'
                        ) : '') +
                    '</div>' +
                '</div>';
            }).join('');
        }

        container.innerHTML =
            '<div class="max-w-6xl mx-auto py-4">' +
                /* Top Banner Header */
                '<div class="text-center mb-10">' +
                    '<span class="inline-block bg-sky-100 text-sky-800 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full gu-text mb-3">શ્રી રઘુવીર ચૌધરી સંસ્કાર ભવન ટ્રસ્ટ, બાપુપુરા</span>' +
                    '<span class="inline-block bg-sky-100 text-sky-800 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full en-text mb-3">Shri Raghuveer Chaudhary Sanskar Bhavan Trust, Bapupura</span>' +
                    '<h1 class="text-3xl md:text-5xl font-extrabold text-slate-900 gu-text tracking-tight">ટ્રસ્ટીમંડળ અને સમિતિ સભ્યો</h1>' +
                    '<h1 class="text-3xl md:text-5xl font-extrabold text-slate-900 en-text tracking-tight">Board of Trustees & Committees</h1>' +
                    '<p class="text-slate-600 mt-3 text-sm md:text-base max-w-2xl mx-auto gu-text">બાપુપુરા ગામ અને સંસ્કાર ભવનના સંચાલન અને વિકાસ માટે સમર્પિત ટ્રસ્ટીમંડળ, સલાહકાર સમિતિ અને નિયામક મંડળ.</p>' +
                    '<p class="text-slate-600 mt-3 text-sm md:text-base max-w-2xl mx-auto en-text">Dedicated leadership governing the social, educational, and community welfare initiatives of Sanskar Bhavan.</p>' +
                '</div>' +

                /* Trust Contact & Leadership Highlight Box */
                '<div class="bg-gradient-to-r from-sky-900 via-sky-800 to-sky-900 text-white rounded-3xl p-6 md:p-8 shadow-xl mb-12 border border-sky-700/50 relative overflow-hidden">' +
                    '<div class="relative z-10 grid md:grid-cols-3 gap-6 text-center md:text-left items-center divide-y md:divide-y-0 md:divide-x divide-sky-700/60">' +
                        '<div class="pb-4 md:pb-0 md:pr-6">' +
                            '<span class="text-amber-400 text-xs font-bold uppercase tracking-wider gu-text">ટ્રસ્ટ વડુ મથક</span>' +
                            '<span class="text-amber-400 text-xs font-bold uppercase tracking-wider en-text">Trust Headquarters</span>' +
                            '<h3 class="text-xl font-bold mt-1 gu-text">શ્રી રઘુવીર ચૌધરી સંસ્કાર ભવન ટ્રસ્ટ</h3>' +
                            '<h3 class="text-xl font-bold mt-1 en-text">Shri Raghuveer Chaudhary Sanskar Bhavan Trust</h3>' +
                            '<p class="text-sky-200 text-xs mt-1">મુ. પો. બાપુપુરા, તા. માણસા, જિ. ગાંધીનગર</p>' +
                        '</div>' +
                        '<div class="py-4 md:py-0 md:px-6">' +
                            '<span class="text-sky-300 text-xs font-bold uppercase tracking-wider gu-text">મેનેજિંગ ટ્રસ્ટી - પ્રમુખ</span>' +
                            '<span class="text-sky-300 text-xs font-bold uppercase tracking-wider en-text">Managing Trustee - President</span>' +
                            '<h4 class="text-lg font-extrabold text-white mt-1 gu-text">શ્રી સંજયભાઈ રઘુવીરભાઈ ચૌધરી</h4>' +
                            '<h4 class="text-lg font-extrabold text-white mt-1 en-text">Shri Sanjaybhai Raghuveerbhai Chaudhary</h4>' +
                        '</div>' +
                        '<div class="pt-4 md:pt-0 md:pl-6">' +
                            '<span class="text-sky-300 text-xs font-bold uppercase tracking-wider gu-text">મંત્રી</span>' +
                            '<span class="text-sky-300 text-xs font-bold uppercase tracking-wider en-text">Secretary</span>' +
                            '<h4 class="text-lg font-extrabold text-white mt-1 gu-text">શ્રી મંગળભાઈ જોઇતાભાઈ ચૌધરી</h4>' +
                            '<h4 class="text-lg font-extrabold text-white mt-1 en-text">Shri Mangalbhai Joitabhai Chaudhary</h4>' +
                        '</div>' +
                    '</div>' +
                '</div>' +

                /* Category 1: Board of Trustees (ટ્રસ્ટીમંડળ) */
                '<div class="mb-14">' +
                    '<div class="flex items-center gap-3 mb-6 pb-3 border-b-2 border-amber-400">' +
                        '<div class="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-md">🏛️</div>' +
                        '<div>' +
                            '<h2 class="text-2xl font-extrabold text-slate-900 gu-text">ટ્રસ્ટીમંડળ (Board of Trustees)</h2>' +
                            '<h2 class="text-2xl font-extrabold text-slate-900 en-text">Board of Trustees</h2>' +
                            '<p class="text-xs text-slate-500 font-semibold gu-text">કુલ ૯ ટ્રસ્ટી સભ્યો</p>' +
                            '<p class="text-xs text-slate-500 font-semibold en-text">Total 9 Governing Trustees</p>' +
                        '</div>' +
                    '</div>' +
                    '<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">' +
                        buildMemberCards(trustees, 'ટ્રસ્ટી', 'Trustee', 'amber') +
                    '</div>' +
                '</div>' +

                /* Category 2: Advisory Committee (સલાહકાર સમિતિ) */
                '<div class="mb-14">' +
                    '<div class="flex items-center gap-3 mb-6 pb-3 border-b-2 border-sky-500">' +
                        '<div class="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-lg shadow-md">💡</div>' +
                        '<div>' +
                            '<h2 class="text-2xl font-extrabold text-slate-900 gu-text">સલાહકાર સમિતિ (Advisory Committee)</h2>' +
                            '<h2 class="text-2xl font-extrabold text-slate-900 en-text">Advisory Committee</h2>' +
                            '<p class="text-xs text-slate-500 font-semibold gu-text">કુલ ૯ માનનીય સલાહકાર સભ્યો</p>' +
                            '<p class="text-xs text-slate-500 font-semibold en-text">Total 9 Advisory Board Members</p>' +
                        '</div>' +
                    '</div>' +
                    '<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">' +
                        buildMemberCards(advisory, 'સલાહકાર', 'Adviser', 'sky') +
                    '</div>' +
                '</div>' +

                /* Category 3: Executive Committee (નિયામક મંડળ) */
                '<div class="mb-14">' +
                    '<div class="flex items-center gap-3 mb-6 pb-3 border-b-2 border-emerald-500">' +
                        '<div class="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-md">⚙️</div>' +
                        '<div>' +
                            '<h2 class="text-2xl font-extrabold text-slate-900 gu-text">નિયામક મંડળ (Executive Committee)</h2>' +
                            '<h2 class="text-2xl font-extrabold text-slate-900 en-text">Executive Committee</h2>' +
                            '<p class="text-xs text-slate-500 font-semibold gu-text">કુલ ૧૫ કાર્યકારી સભ્યો</p>' +
                            '<p class="text-xs text-slate-500 font-semibold en-text">Total 15 Executive Committee Members</p>' +
                        '</div>' +
                    '</div>' +
                    '<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">' +
                        buildMemberCards(executive, 'નિયામક', 'Executive Member', 'emerald') +
                    '</div>' +
                '</div>' +
            '</div>';

        syncLanguage();
    } catch(e) {
        container.innerHTML = '<div class="text-center py-20 text-red-500">Failed to load committee members. (' + e.message + ')</div>';
    }
}

async function fetchFounder() {
    try {
        var res = await fetch(API_BASE + '/content/founder');
        var json = await res.json();
        var data = json.data;
        if (data && (data.nameEn || data.nameGu)) {
            var container = document.getElementById('founder-section-container');
            if (container) {
                var fbLink = data.facebookUrl ? '<a href="' + data.facebookUrl + '" target="_blank" title="Facebook" class="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white transition-all text-sm font-bold">f</a>' : '';
                var twLink = data.twitterUrl ? '<a href="' + data.twitterUrl + '" target="_blank" title="Twitter" class="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white transition-all text-sm font-bold">𝕏</a>' : '';
                var igLink = data.instagramUrl ? '<a href="' + data.instagramUrl + '" target="_blank" title="Instagram" class="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white transition-all text-sm font-bold">ig</a>' : '';
                var inLink = data.linkedinUrl ? '<a href="' + data.linkedinUrl + '" target="_blank" title="LinkedIn" class="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white transition-all text-sm font-bold">in</a>' : '';
                var photo = fixUrl(data.photoUrl) || '';
                var photoHtml = photo
                    ? '<img src="' + photo + '" alt="Founder" onerror="this.src=\'https://placehold.co/200x200/0c4a6e/e0f2fe?text=F\'" class="w-36 h-36 md:w-44 md:h-44 rounded-full object-cover border-4 border-white shadow-2xl mx-auto" />'
                    : '<div class="w-36 h-36 md:w-44 md:h-44 rounded-full bg-sky-800 border-4 border-white shadow-2xl mx-auto flex items-center justify-center text-5xl font-bold text-white">' + (data.nameEn || 'F').charAt(0) + '</div>';

                container.innerHTML =
                    '<div class="container mx-auto px-4 max-w-5xl">' +

                        '<div class="text-center mb-10">' +
                            '<span class="inline-block bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full gu-text">ટ્રસ્ટ સ્થાપક</span>' +
                            '<span class="inline-block bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full en-text">Trust Founder</span>' +
                            '<h2 class="text-3xl font-bold text-slate-900 mt-3 gu-text">સ્થાપક અને ટ્રસ્ટી</h2>' +
                            '<h2 class="text-3xl font-bold text-slate-900 mt-3 en-text">Founder & Trustee</h2>' +
                        '</div>' +

                        '<div class="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">' +

                            /* Top banner with gradient */
                            '<div class="bg-gradient-to-r from-sky-800 via-sky-700 to-sky-600 px-8 pt-10 pb-20 text-center relative">' +
                                '<div class="absolute inset-0 opacity-10" style="background-image: url(\'data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\');"></div>' +
                            '</div>' +

                            /* Photo overlapping the banner */
                            '<div class="relative -mt-16 flex flex-col items-center pb-8 px-8">' +
                                photoHtml +

                                '<h3 class="text-2xl md:text-3xl font-extrabold text-slate-900 mt-5 gu-text">' + (data.nameGu || '') + '</h3>' +
                                '<h3 class="text-2xl md:text-3xl font-extrabold text-slate-900 mt-5 en-text">' + (data.nameEn || '') + '</h3>' +
                                '<p class="text-sky-700 font-semibold text-sm uppercase tracking-wider mt-1 gu-text">સ્થાપક અને મેનેજિંગ ટ્રસ્ટી</p>' +
                                '<p class="text-sky-700 font-semibold text-sm uppercase tracking-wider mt-1 en-text">Founder & Managing Trustee</p>' +

                                /* Social Links */
                                (fbLink || twLink || igLink || inLink ? (
                                    '<div class="flex gap-3 mt-4">' +
                                        '<style>.founder-social-btn{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:#0369a1;color:white;font-size:13px;font-weight:700;text-decoration:none;transition:all 0.2s;}.founder-social-btn:hover{background:#0284c7;transform:scale(1.1);}</style>' +
                                        (data.facebookUrl ? '<a href="' + data.facebookUrl + '" target="_blank" class="founder-social-btn" title="Facebook">f</a>' : '') +
                                        (data.twitterUrl ? '<a href="' + data.twitterUrl + '" target="_blank" class="founder-social-btn" title="Twitter">𝕏</a>' : '') +
                                        (data.instagramUrl ? '<a href="' + data.instagramUrl + '" target="_blank" class="founder-social-btn" title="Instagram">📷</a>' : '') +
                                        (data.linkedinUrl ? '<a href="' + data.linkedinUrl + '" target="_blank" class="founder-social-btn" title="LinkedIn">in</a>' : '') +
                                    '</div>'
                                ) : '') +

                                /* Bio quote */
                                (data.bioGu || data.bioEn ? (
                                    '<div class="mt-8 max-w-2xl mx-auto text-center">' +
                                        '<blockquote class="text-slate-600 text-lg italic leading-relaxed border-l-4 border-amber-400 pl-5 text-left gu-text">"' + (data.bioGu || '') + '"</blockquote>' +
                                        '<blockquote class="text-slate-600 text-lg italic leading-relaxed border-l-4 border-amber-400 pl-5 text-left en-text">"' + (data.bioEn || '') + '"</blockquote>' +
                                    '</div>'
                                ) : '') +

                                /* Achievements */
                                (data.achievementsGu || data.achievementsEn ? (
                                    '<div class="mt-8 w-full max-w-2xl mx-auto bg-slate-50 rounded-2xl p-6 text-left border border-slate-100">' +
                                        '<h4 class="font-bold text-sky-900 mb-3 gu-text">✨ સિદ્ધિઓ અને યોગદાન</h4>' +
                                        '<h4 class="font-bold text-sky-900 mb-3 en-text">✨ Achievements & Contributions</h4>' +
                                        '<div class="prose max-w-none text-slate-700 text-sm leading-relaxed gu-text">' + (data.achievementsGu || '') + '</div>' +
                                        '<div class="prose max-w-none text-slate-700 text-sm leading-relaxed en-text">' + (data.achievementsEn || '') + '</div>' +
                                    '</div>'
                                ) : '') +

                                /* Committee Page Button Callout */
                                '<div class="mt-8 pt-6 border-t border-slate-100 w-full flex justify-center">' +
                                    '<a href="#/committees" class="inline-flex items-center gap-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-sky-600/20 transition-all hover:scale-105 cursor-pointer">' +
                                        '<span class="text-xl">👥</span>' +
                                        '<span class="gu-text">ટ્રસ્ટીઓ અને કમિટી સભ્યો જુઓ &rarr;</span>' +
                                        '<span class="en-text">View Board of Trustees & Committees &rarr;</span>' +
                                    '</a>' +
                                '</div>' +

                            '</div>' +
                        '</div>' +
                    '</div>';

                container.dataset.hasData = 'true';
                var hash = window.location.hash || '#home';
                var isDynamic = (
                    hash.indexOf('#/page/') === 0 ||
                    hash.indexOf('#/facility/') === 0 ||
                    hash.indexOf('#/event/') === 0 ||
                    hash.indexOf('#/notice/') === 0 ||
                    hash === '#/donors' ||
                    hash.indexOf('#/donors') === 0 ||
                    hash.indexOf('#/donor/') === 0 ||
                    hash === '#/committees' ||
                    hash.indexOf('#/committees') === 0
                );
                if (!isDynamic) {
                    container.style.display = 'block';
                } else {
                    container.style.display = 'none';
                }
                syncLanguage();
            }
        }
    } catch(e) {
        console.error('Failed to fetch founder data', e);
    }
}

async function initSliders() {
    try {
        var heroRes = await fetch(API_BASE + '/sliders?section=hero');
        var aboutRes = await fetch(API_BASE + '/sliders?section=about');
        var heroJson = await heroRes.json();
        var aboutJson = await aboutRes.json();
        setupSliderElement('hero-slider-bg', heroJson.data || []);
        setupSliderElement('about-slider-bg', aboutJson.data || []);
    } catch(e) {
        console.error('Slider fetch error', e);
    }
}

function setupSliderElement(containerId, slides) {
    if (!slides || slides.length === 0) return;
    var container = document.getElementById(containerId);
    if (!container) return;

    var currentIndex = 0;
    var imageUrl = fixUrl(slides[currentIndex].imageUrl || '');
    container.style.backgroundImage = 'url("' + imageUrl + '")';
    container.style.backgroundSize = 'cover';
    container.style.backgroundPosition = 'center';
    container.style.transition = 'background-image 1s ease-in-out';

    if (slides.length > 1) {
        setInterval(function() {
            currentIndex = (currentIndex + 1) % slides.length;
            var nextImage = fixUrl(slides[currentIndex].imageUrl || '');
            container.style.backgroundImage = 'url("' + nextImage + '")';
        }, 5000);
    }
}

async function fetchCMSData() {
    // Fetch Settings and update custom Navigation labels
    try {
        var setRes = await fetch(API_BASE + '/settings');
        var setJson = await setRes.json();
        if (setJson.success && setJson.data && setJson.data.navLabels) {
            updateNavTabLabels(setJson.data.navLabels);
        }
    } catch(e) { console.error('Settings fetch error', e); }

    // Fetch and render Facilities cards
    try {
        var facRes = await fetch(API_BASE + '/facilities');
        var facJson = await facRes.json();
        if (facJson.success && facJson.data.length > 0) {
            var facContainer = document.querySelector('#facilities .grid');
            if (facContainer) {
                var enabled = facJson.data.filter(function(f) { return f.isEnabled; });
                enabled.sort(function(a, b) { return a.order - b.order; });
                facContainer.innerHTML = enabled.map(function(f) {
                    var slugId = f.slug || f._id || f.id;
                    return '<a href="#/facility/' + slugId + '" class="block bg-sky-50 p-6 rounded-2xl border border-sky-100 hover:shadow-md transition-all">' +
                        '<div class="text-3xl mb-4">' + (f.icon || '') + '</div>' +
                        '<h4 class="font-bold text-lg text-sky-900 gu-text">' + (f.titleGu || '') + '</h4>' +
                        '<h4 class="font-bold text-lg text-sky-900 en-text">' + (f.titleEn || '') + '</h4>' +
                        '<p class="text-slate-600 text-sm mt-2 leading-relaxed gu-text">' + (f.descGu || '') + '</p>' +
                        '<p class="text-slate-600 text-sm mt-2 leading-relaxed en-text">' + (f.descEn || '') + '</p>' +
                    '</a>';
                }).join('');
            }
        }
    } catch(e) { console.error('Facilities fetch error', e); }

    // Fetch and render custom Pages into nav
    try {
        var pageRes = await fetch(API_BASE + '/pages');
        var pageJson = await pageRes.json();
        if (pageJson.success && pageJson.data && pageJson.data.length > 0) {
            var nav = document.querySelector('nav.hidden.xl\\:flex');
            var mobileNav = document.querySelector('#mobileDrawer nav');

            var navPages = pageJson.data.filter(function(p) {
                return p.showInNav && p.isEnabled && p.status === 'published';
            });
            navPages.sort(function(a, b) { return (a.navOrder || 0) - (b.navOrder || 0); });

            navPages.forEach(function(p) {
                var linkHTML =
                    '<a href="#/page/' + p.slug + '" class="hover:text-sky-600 transition-colors gu-text">' + (p.titleGu || '') + '</a>' +
                    '<a href="#/page/' + p.slug + '" class="hover:text-sky-600 transition-colors en-text">' + (p.titleEn || '') + '</a>';
                if (nav) nav.insertAdjacentHTML('beforeend', linkHTML);
                if (mobileNav) mobileNav.insertAdjacentHTML('beforeend', linkHTML);
            });
            syncLanguage();
        }
    } catch(e) { console.error('Pages fetch error', e); }
    syncLanguage();
}

function updateNavTabLabels(nl) {
    if (!nl) return;
    var tabMap = [
        { href: '#home', gu: nl.homeGu, en: nl.homeEn },
        { href: '#about', gu: nl.aboutGu, en: nl.aboutEn },
        { href: '#facilities', gu: nl.facilitiesGu, en: nl.facilitiesEn },
        { href: '#/donors', gu: nl.donorsGu, en: nl.donorsEn },
        { href: '#gallery', gu: nl.galleryGu, en: nl.galleryEn },
        { href: '#news', gu: nl.noticesGu, en: nl.noticesEn },
        { href: '#contact', gu: nl.contactGu, en: nl.contactEn }
    ];

    tabMap.forEach(function(t) {
        var links = document.querySelectorAll('header nav a[href="' + t.href + '"], #mobileDrawer nav a[href="' + t.href + '"]');
        links.forEach(function(link) {
            if (link.classList.contains('gu-text') && t.gu) {
                var icon = link.querySelector('span');
                if (icon && link.innerText.trim().startsWith('🏛️')) {
                    icon.innerText = t.gu;
                } else {
                    link.innerText = t.gu;
                }
            }
            if (link.classList.contains('en-text') && t.en) {
                var icon = link.querySelector('span');
                if (icon && link.innerText.trim().startsWith('🏛️')) {
                    icon.innerText = t.en;
                } else {
                    link.innerText = t.en;
                }
            }
        });
    });

    var facBtnGu = document.querySelector('header nav .group button span.gu-text');
    var facBtnEn = document.querySelector('header nav .group button span.en-text');
    if (facBtnGu && nl.facilitiesGu) facBtnGu.innerText = nl.facilitiesGu;
    if (facBtnEn && nl.facilitiesEn) facBtnEn.innerText = nl.facilitiesEn;
}

/**
 * Event Photo & Video Gallery Logic
 */
var allGalleryAlbums = [];
var currentActiveAlbum = null;
var currentLightboxIndex = 0;

async function fetchGalleryData() {
    var galleryGrid = document.getElementById('gallery-grid');
    var categoryFilters = document.getElementById('gallery-category-filters');
    if (!galleryGrid) return;

    try {
        var res = await fetch(API_BASE + '/gallery');
        var json = await res.json();
        if (json.success && Array.isArray(json.data)) {
            allGalleryAlbums = json.data;

            // Extract unique categories
            var categories = ['All'];
            allGalleryAlbums.forEach(function(album) {
                if (album.category && !categories.includes(album.category)) {
                    categories.push(album.category);
                }
            });

            // Render category filter buttons
            if (categoryFilters) {
                categoryFilters.innerHTML = categories.map(function(cat) {
                    var isAll = cat === 'All';
                    var activeClass = isAll ? 'bg-sky-600 text-white active' : 'bg-white hover:bg-sky-50 text-slate-700 border border-slate-200';
                    var labelGu = isAll ? 'બધા કાર્યક્રમો' : getCategoryLabelGu(cat);
                    var labelEn = isAll ? 'All Events' : cat;

                    return '<button onclick="filterGalleryCategory(\'' + cat + '\')" data-cat="' + cat + '" class="gallery-filter-btn px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all shadow-xs cursor-pointer ' + activeClass + '">' +
                        '<span class="gu-text">' + labelGu + '</span>' +
                        '<span class="en-text">' + labelEn + '</span>' +
                    '</button>';
                }).join('');
            }

            renderGalleryGrid(allGalleryAlbums);
        }
    } catch(err) {
        console.error('Error fetching gallery:', err);
        if (galleryGrid) {
            galleryGrid.innerHTML = '<div class="col-span-3 text-center py-12 text-slate-400">Failed to load gallery albums.</div>';
        }
    }
}

function getCategoryLabelGu(cat) {
    var mapping = {
        'Cultural': 'સાંસ્કૃતિક',
        'Education': 'શિક્ષણ',
        'Agriculture': 'કૃષિ / પર્યાવરણ',
        'Social': 'સામાજિક',
        'Health': 'આરોગ્ય',
        'Workshops': 'કાર્યશાળાઓ',
        'Sports': 'રમતગમત',
        'General': 'સામાન્ય'
    };
    return mapping[cat] || cat;
}

function filterGalleryCategory(cat) {
    document.querySelectorAll('.gallery-filter-btn').forEach(function(btn) {
        var btnCat = btn.getAttribute('data-cat');
        if (btnCat === cat) {
            btn.className = 'gallery-filter-btn px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all shadow-xs cursor-pointer bg-sky-600 text-white active';
        } else {
            btn.className = 'gallery-filter-btn px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all shadow-xs cursor-pointer bg-white hover:bg-sky-50 text-slate-700 border border-slate-200';
        }
    });

    if (cat === 'All') {
        renderGalleryGrid(allGalleryAlbums);
    } else {
        var filtered = allGalleryAlbums.filter(function(a) {
            return (a.category || '').toLowerCase() === cat.toLowerCase();
        });
        renderGalleryGrid(filtered);
    }
}

function renderGalleryGrid(albums) {
    var galleryGrid = document.getElementById('gallery-grid');
    if (!galleryGrid) return;

    if (!albums || albums.length === 0) {
        galleryGrid.innerHTML = '<div class="col-span-3 text-center py-16 bg-white rounded-3xl border border-sky-100 p-8 shadow-xs">' +
            '<div class="text-4xl mb-2">📁</div>' +
            '<p class="text-slate-500 font-semibold gu-text">આ કેટેગરીમાં કોઈ ઇવેન્ટ આલ્બમ ઉપલબ્ધ નથી.</p>' +
            '<p class="text-slate-500 font-semibold en-text">No event albums found in this category.</p>' +
        '</div>';
        syncLanguage();
        return;
    }

    galleryGrid.innerHTML = albums.map(function(album) {
        var id = album._id || album.id;
        var cover = fixUrl(album.coverImage || (album.photos && album.photos[0] ? album.photos[0].url : ''));
        var photoCount = album.photos ? album.photos.length : 0;
        var videoCount = album.videos ? album.videos.length : 0;
        var dateFormatted = album.date || '';

        var featuredBadge = album.isFeatured ? '<span class="absolute top-3 right-3 bg-amber-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm">⭐ Featured</span>' : '';

        return '<div data-album-id="' + id + '" onclick="openGalleryModal(\'' + id + '\')" class="gallery-album-card bg-white rounded-3xl overflow-hidden border border-sky-100/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col group">' +
            '<div class="relative h-56 bg-slate-100 overflow-hidden">' +
                '<img src="' + cover + '" alt="' + (album.titleEn || '') + '" onerror="this.src=\'https://placehold.co/600x400/e0f2fe/0369a1?text=Event+Gallery\'" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />' +
                '<div class="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>' +
                '<span class="absolute top-3 left-3 bg-sky-900/80 backdrop-blur-xs text-white text-xs font-bold px-3 py-1 rounded-lg shadow-xs">' + (album.category || 'Event') + '</span>' +
                featuredBadge +
                '<div class="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-medium">' +
                    '<span class="flex items-center gap-1">📅 ' + dateFormatted + '</span>' +
                    '<div class="flex items-center gap-2">' +
                        '<span class="bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-md">📷 ' + photoCount + '</span>' +
                        (videoCount > 0 ? '<span class="bg-purple-900/80 backdrop-blur-xs px-2 py-0.5 rounded-md">🎬 ' + videoCount + '</span>' : '') +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="p-6 flex-1 flex flex-col justify-between">' +
                '<div>' +
                    '<h4 class="text-lg md:text-xl font-bold text-sky-950 gu-text group-hover:text-sky-600 transition-colors leading-snug mb-1">' + (album.titleGu || '') + '</h4>' +
                    '<h4 class="text-lg md:text-xl font-bold text-sky-950 en-text group-hover:text-sky-600 transition-colors leading-snug mb-1">' + (album.titleEn || '') + '</h4>' +
                    '<p class="text-slate-500 text-xs md:text-sm mt-2 leading-relaxed line-clamp-2 gu-text">' + (album.descGu || '') + '</p>' +
                    '<p class="text-slate-500 text-xs md:text-sm mt-2 leading-relaxed line-clamp-2 en-text">' + (album.descEn || '') + '</p>' +
                '</div>' +
                '<div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sky-600 font-bold text-xs md:text-sm">' +
                    '<span class="gu-text flex items-center gap-1">ગેલેરી જુઓ &rarr;</span>' +
                    '<span class="en-text flex items-center gap-1">View Album &rarr;</span>' +
                    '<span class="text-xs text-slate-400 font-normal">' + (photoCount + videoCount) + ' Items</span>' +
                '</div>' +
            '</div>' +
        '</div>';
    }).join('');

    syncLanguage();
}

function openGalleryModal(albumId) {
    var album = allGalleryAlbums.find(function(a) { return (a._id === albumId || a.id === albumId); });
    if (!album) return;

    currentActiveAlbum = album;

    var modal = document.getElementById('galleryModal');
    if (!modal) return;

    // Header content
    document.getElementById('modalAlbumCategory').innerText = album.category || 'Event';
    document.getElementById('modalAlbumTitleGu').innerText = album.titleGu || '';
    document.getElementById('modalAlbumTitleEn').innerText = album.titleEn || '';
    document.getElementById('modalAlbumDate').innerText = '📅 ' + (album.date || '');
    document.getElementById('modalAlbumDescGu').innerText = album.descGu ? ' • ' + album.descGu : '';
    document.getElementById('modalAlbumDescEn').innerText = album.descEn ? ' • ' + album.descEn : '';

    var photos = album.photos || [];
    var videos = album.videos || [];

    document.getElementById('modalPhotosCount').innerText = photos.length;
    document.getElementById('modalVideosCount').innerText = videos.length;

    // Render Photos
    var photosPanel = document.getElementById('modalPhotosPanel');
    if (photos.length === 0) {
        photosPanel.innerHTML = '<div class="col-span-4 text-center py-12 text-slate-400 text-sm">No photos added to this album.</div>';
    } else {
        photosPanel.innerHTML = photos.map(function(p, idx) {
            var url = fixUrl(p.url || p);
            var capGu = p.captionGu || '';
            var capEn = p.captionEn || '';
            return '<div data-photo-index="' + idx + '" onclick="openPhotoLightbox(' + idx + ')" class="photo-item-card group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square cursor-pointer shadow-xs hover:shadow-md transition-all">' +
                '<img src="' + url + '" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />' +
                '<div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">' +
                    '<span class="p-2 bg-white/20 backdrop-blur-xs rounded-full">🔍</span>' +
                '</div>' +
                (capGu || capEn ? (
                    '<div class="absolute bottom-0 inset-x-0 bg-black/70 backdrop-blur-xs text-white text-[11px] p-1.5 text-center truncate">' +
                        '<span class="gu-text">' + capGu + '</span>' +
                        '<span class="en-text">' + capEn + '</span>' +
                    '</div>'
                ) : '') +
            '</div>';
        }).join('');
    }

    // Render Videos
    var videosPanel = document.getElementById('modalVideosPanel');
    if (videos.length === 0) {
        videosPanel.innerHTML = '<div class="col-span-2 text-center py-12 text-slate-400 text-sm">No videos attached to this album.</div>';
    } else {
        videosPanel.innerHTML = videos.map(function(v) {
            return renderVideoCardHtml(v.url || '', v.titleGu, v.titleEn);
        }).join('');
    }

    switchGalleryModalTab('photos');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.style.display = 'flex';
    syncLanguage();
}

function closeGalleryModal() {
    var modal = document.getElementById('galleryModal');
    if (modal) {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
        modal.style.display = 'none';
        var vPanel = document.getElementById('modalVideosPanel');
        if (vPanel) vPanel.innerHTML = '';
    }
}

function switchGalleryModalTab(tab) {
    var photosBtn = document.getElementById('modalTabPhotosBtn');
    var videosBtn = document.getElementById('modalTabVideosBtn');
    var photosPanel = document.getElementById('modalPhotosPanel');
    var videosPanel = document.getElementById('modalVideosPanel');

    if (tab === 'photos') {
        photosBtn.className = 'py-3 px-4 border-b-2 border-sky-600 text-sky-600 flex items-center gap-2 cursor-pointer transition-all';
        videosBtn.className = 'py-3 px-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 flex items-center gap-2 cursor-pointer transition-all';
        photosPanel.classList.remove('hidden');
        photosPanel.style.display = 'grid';
        videosPanel.classList.add('hidden');
        videosPanel.style.display = 'none';
    } else {
        videosBtn.className = 'py-3 px-4 border-b-2 border-purple-600 text-purple-600 flex items-center gap-2 cursor-pointer transition-all';
        photosBtn.className = 'py-3 px-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700 flex items-center gap-2 cursor-pointer transition-all';
        videosPanel.classList.remove('hidden');
        videosPanel.style.display = 'grid';
        photosPanel.classList.add('hidden');
        photosPanel.style.display = 'none';
    }
    syncLanguage();
}

function openPhotoLightbox(index) {
    if (!currentActiveAlbum || !currentActiveAlbum.photos || currentActiveAlbum.photos.length === 0) return;
    currentLightboxIndex = index;

    var lightbox = document.getElementById('photoLightbox');
    if (!lightbox) return;

    updateLightboxView();
    lightbox.classList.remove('hidden');
    lightbox.classList.add('flex');
    lightbox.style.display = 'flex';
    syncLanguage();
}

function closePhotoLightbox() {
    var lightbox = document.getElementById('photoLightbox');
    if (lightbox) {
        lightbox.classList.remove('flex');
        lightbox.classList.add('hidden');
        lightbox.style.display = 'none';
    }
}

function updateLightboxView() {
    if (!currentActiveAlbum || !currentActiveAlbum.photos) return;
    var photos = currentActiveAlbum.photos;
    if (currentLightboxIndex < 0) currentLightboxIndex = photos.length - 1;
    if (currentLightboxIndex >= photos.length) currentLightboxIndex = 0;

    var photo = photos[currentLightboxIndex];
    var url = fixUrl(photo.url || photo);

    document.getElementById('lightboxImg').src = url;
    document.getElementById('lightboxCounter').innerText = (currentLightboxIndex + 1) + ' / ' + photos.length;
    document.getElementById('lightboxCaptionGu').innerText = photo.captionGu || '';
    document.getElementById('lightboxCaptionEn').innerText = photo.captionEn || '';
    syncLanguage();
}

function prevLightboxPhoto() {
    currentLightboxIndex--;
    updateLightboxView();
}

function nextLightboxPhoto() {
    currentLightboxIndex++;
    updateLightboxView();
}

// Global click event delegation & keyboard listeners
document.addEventListener('click', function(e) {
    var albumCard = e.target.closest('.gallery-album-card');
    if (albumCard) {
        var id = albumCard.getAttribute('data-album-id');
        if (id) openGalleryModal(id);
        return;
    }

    var filterBtn = e.target.closest('.gallery-filter-btn');
    if (filterBtn) {
        var cat = filterBtn.getAttribute('data-cat');
        if (cat) filterGalleryCategory(cat);
        return;
    }

    var tabBtn = e.target.closest('#modalTabPhotosBtn, #modalTabVideosBtn');
    if (tabBtn) {
        if (tabBtn.id === 'modalTabPhotosBtn') switchGalleryModalTab('photos');
        else if (tabBtn.id === 'modalTabVideosBtn') switchGalleryModalTab('videos');
        return;
    }

    var photoItem = e.target.closest('.photo-item-card');
    if (photoItem) {
        var pIdx = parseInt(photoItem.getAttribute('data-photo-index'), 10);
        if (!isNaN(pIdx)) openPhotoLightbox(pIdx);
        return;
    }

    if (e.target.closest('#closeGalleryModalBtn')) {
        closeGalleryModal();
        return;
    }

    if (e.target.closest('#closePhotoLightboxBtn')) {
        closePhotoLightbox();
        return;
    }

    if (e.target.closest('#prevLightboxPhotoBtn')) {
        prevLightboxPhoto();
        return;
    }

    if (e.target.closest('#nextLightboxPhotoBtn')) {
        nextLightboxPhoto();
        return;
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closePhotoLightbox();
        closeGalleryModal();
    } else if (e.key === 'ArrowLeft') {
        prevLightboxPhoto();
    } else if (e.key === 'ArrowRight') {
        nextLightboxPhoto();
    }
});

// Window global bindings for CSP and HTML onclick compliance
window.fetchGalleryData = fetchGalleryData;
window.filterGalleryCategory = filterGalleryCategory;
window.openGalleryModal = openGalleryModal;
window.closeGalleryModal = closeGalleryModal;
window.switchGalleryModalTab = switchGalleryModalTab;
window.openPhotoLightbox = openPhotoLightbox;
window.closePhotoLightbox = closePhotoLightbox;
window.prevLightboxPhoto = prevLightboxPhoto;
window.nextLightboxPhoto = nextLightboxPhoto;


