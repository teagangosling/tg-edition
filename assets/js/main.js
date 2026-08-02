var html = document.documentElement;
var body = document.body;
var timeout;
var st = 0;

cover();
featured();
pagination(false);
floatedImages();
expandableImages();

window.addEventListener('scroll', function () {
    'use strict';
    if (body.classList.contains('home-template') && body.classList.contains('with-full-cover') && !document.querySelector('.cover').classList.contains('half')) {
        if (timeout) {
            window.cancelAnimationFrame(timeout);
        }
        timeout = window.requestAnimationFrame(portalButton);
    }
});

if (document.querySelector('.cover') && document.querySelector('.cover').classList.contains('half')) {
    body.classList.add('portal-visible');
}

function portalButton() {
    'use strict';
    st = window.scrollY;

    if (st > 300) {
        body.classList.add('portal-visible');
    } else {
        body.classList.remove('portal-visible');
    }
}

function cover() {
    'use strict';
    var cover = document.querySelector('.cover');
    if (!cover) return;

    imagesLoaded(cover, function () {
        cover.classList.remove('image-loading');
    });

    document.querySelector('.cover-arrow').addEventListener('click', function () {
        var element = cover.nextElementSibling;
        element.scrollIntoView({behavior: 'smooth', block: 'start'});
    });
}

// Ghost lays .gh-content.gh-canvas out as a CSS grid: every paragraph and
// every card is its own grid item. A float on a figure therefore has nothing
// to wrap around it, because the text lives in sibling grid items and a float
// cannot escape the item it is in. So the figure and the text blocks that
// should flow beside it are moved into one wrapper element, which becomes a
// single grid item; the float then resolves inside that wrapper's own block
// formatting context, which is the only place it can affect the text.
//
// This has to run before expandableImages() would matter either way - moving
// an element with appendChild keeps its listeners - but doing it first means
// the lightbox pass sees the final DOM, so there is only ever one arrangement
// to reason about.
function floatedImages() {
    'use strict';
    var content = document.querySelector('.gh-content');
    if (!content) return;

    // Authors opt in by ending the image's alt text with [left] or [right].
    var marker = /\s*\[\s*(left|right)\s*\]\s*$/i;
    // Blocks that read sensibly beside a floated image. Everything else - a
    // heading, a rule, another card - ends the run and is left outside the
    // wrapper, which is what makes the float clear at a natural break.
    var wrappable = 'p, ul, ol, blockquote';

    content.querySelectorAll('img[alt]').forEach(function (img) {
        var alt = img.getAttribute('alt');
        var match = alt.match(marker);
        if (!match) return;

        // Strip the marker so it is never announced by a screen reader.
        img.setAttribute('alt', alt.replace(marker, ''));

        var figure = img.closest('figure.kg-card');
        if (!figure) return;

        figure.classList.add('tg-float-' + match[1].toLowerCase());

        // Only a direct child of the grid is a grid item, so only that case
        // needs - or can use - the wrapper.
        if (figure.parentNode !== content) return;

        var wrapper = document.createElement('div');
        wrapper.className = 'tg-float-wrap';
        content.insertBefore(wrapper, figure);
        wrapper.appendChild(figure);

        while (wrapper.nextElementSibling && wrapper.nextElementSibling.matches(wrappable)) {
            wrapper.appendChild(wrapper.nextElementSibling);
        }
    });
}

// The shared theme assets only make gallery images and image cards that
// carry width/height attributes clickable. Everything else - feature images,
// images pasted into HTML cards, older image cards without dimensions - is
// picked up here and gets a single-image lightbox.
function expandableImages() {
    'use strict';
    if (typeof PhotoSwipe === 'undefined') return;

    var alreadyHandled = '.kg-image-card > .kg-image[width][height], .kg-gallery-image > img';
    // Images that are part of another control, or already a link somewhere.
    var notAnImage = 'a, .kg-bookmark-card, .kg-product-card, .kg-header-card';

    document.querySelectorAll('.gh-content img, .single-media img').forEach(function (img) {
        if (img.matches(alreadyHandled) || img.closest(notAnImage)) return;

        img.classList.add('is-expandable');
        img.addEventListener('click', function () {
            openImage(img);
        });
    });
}

function openImage(img) {
    'use strict';
    var pswpElement = document.querySelector('.pswp');
    if (!pswpElement) return;

    // The width/height attributes describe the original upload; naturalWidth
    // only describes whichever srcset variant happens to be loaded, so it is
    // the fallback rather than the first choice.
    var item = {
        src: img.getAttribute('src'),
        msrc: img.currentSrc || img.getAttribute('src'),
        w: parseInt(img.getAttribute('width'), 10) || img.naturalWidth,
        h: parseInt(img.getAttribute('height'), 10) || img.naturalHeight,
        el: img,
    };

    if (!item.src || !item.w || !item.h) return;

    var gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, [item], {
        bgOpacity: 0.9,
        closeOnScroll: true,
        fullscreenEl: false,
        history: false,
        index: 0,
        shareEl: false,
        zoomEl: false,
        getThumbBoundsFn: function () {
            var pageYScroll = window.pageYOffset || document.documentElement.scrollTop;
            var rect = img.getBoundingClientRect();

            return {x: rect.left, y: rect.top + pageYScroll, w: rect.width};
        },
    });
    gallery.init();
}

function featured() {
    'use strict';
    var feed = document.querySelector('.featured-feed');
    if (!feed) return;

    tns({
        container: feed,
        controlsText: [
            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M20.547 22.107L14.44 16l6.107-6.12L18.667 8l-8 8 8 8 1.88-1.893z"></path></svg>',
            '<svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M11.453 22.107L17.56 16l-6.107-6.12L13.333 8l8 8-8 8-1.88-1.893z"></path></svg>',
        ],
        gutter: 30,
        loop: false,
        nav: false,
        responsive: {
            0: {
                items: 1,
            },
            768: {
                items: 2,
            },
            992: {
                items: 3,
            },
        },
    });
}
