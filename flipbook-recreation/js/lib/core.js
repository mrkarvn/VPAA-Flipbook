// js/lib/core.js

export const state = {
    // Configuration options
    options: {},
    defaultOptions: {
        pages: [], // Will be set externally
        animationDuration: 800, // milliseconds
        dragThresholdPercentage: 0.25, // Percentage of page width to trigger a flip
        zoomFactor: 0.1,
        maxZoom: 3,
        minZoom: 1,
        pageWidth: 450 // Default width of a single page in pixels, used for calculations
    },

    rawPages: [], // Array of page content paths

    // Page state
    currentPageIndex: -1, // -1: Front cover, 0: rawPages[0] on right, 1: rawPages[1] left, rawPages[2] right

    // Animation state
    isFlipping: false,

    // Drag state
    isDragging: false,
    startX: 0,
    dragDirection: null, // 'forward' or 'backward'
    currentTurningPage: null, // Reference to the dynamically created turning page element

    // Zoom/Pan state
    zoomLevel: 1,
    translateX: 0,
    translateY: 0,
    isPanning: false,
    panStartX: 0,
    panStartY: 0,

    // Pinch-to-zoom state
    initialPinchDistance: 0,
    initialZoomLevel: 1,
    isPinching: false,
};

// DOM elements (will be set on init)
export const dom = {
    bookContainer: null,
    book: null,
    pageLeft: null,
    pageRight: null,
    prevBtn: null,
    nextBtn: null,
};

// Helper function to load page content
export async function loadPageContent(pagePath) {
    if (!pagePath || pagePath === 'blank') {
        return '<div class="page-content"></div>';
    }
    try {
        const response = await fetch(pagePath);
        if (!response.ok) {
            return `<div class="page-content"><h1>Page Not Found</h1><p>Could not load ${pagePath}</p></div>`;
        }
        return await response.text();
    } catch (error) {
        console.error('Error loading page content:', error);
        return `<div class="page-content"><h1>Error loading page</h1><p>${error.message}</p></div>`;
    }
}

// Applies scale and translate transforms to the book container
export function applyZoomTransform() {
    dom.bookContainer.style.transform = `scale(${state.zoomLevel}) translate(${state.translateX}px, ${state.translateY}px)`;
}

// Resets zoom level and position
export function resetZoom() {
    state.zoomLevel = 1;
    state.translateX = 0;
    state.translateY = 0;
    applyZoomTransform();
}

// Creates a turning page element
export function createTurningPageElement() {
    const turningPage = document.createElement('div');
    turningPage.classList.add('turning-page');
    
    const frontFace = document.createElement('div');
    frontFace.classList.add('front-face');
    const backFace = document.createElement('div');
    backFace.classList.add('back-face');

    turningPage.appendChild(frontFace);
    turningPage.appendChild(backFace);
    dom.book.appendChild(turningPage);
    return { turningPage, frontFace, backFace };
}

// Updates the PAGE_WIDTH based on current screen size and CSS media queries
export function updatePageWidth() {
    const computedPageWidth = parseFloat(getComputedStyle(dom.pageLeft).width);
    if (computedPageWidth) {
        state.options.pageWidth = computedPageWidth;
    } else {
        // Fallback if computed style is not immediately available
        if (window.innerWidth <= 768) {
            state.options.pageWidth = dom.bookContainer.offsetWidth * 0.475; 
        } else if (window.innerWidth <= 992) {
            state.options.pageWidth = dom.bookContainer.offsetWidth * 0.45; 
        } else {
            state.options.pageWidth = state.defaultOptions.pageWidth; 
        }
    }
}

// Renders the current spread (left and right pages) based on currentPageIndex
export async function renderSpread() {
    let leftPageHTML = '';
    let rightPageHTML = '';

    if (state.currentPageIndex === -1) { // Front cover
        leftPageHTML = '<div class="page-content"></div>';
        rightPageHTML = await loadPageContent(state.rawPages[0]);
    } else if (state.currentPageIndex === state.rawPages.length - 1) { // Back cover
        leftPageHTML = await loadPageContent(state.rawPages[state.rawPages.length - 1]);
        rightPageHTML = '<div class="page-content"></div>';
    } else {
        leftPageHTML = await loadPageContent(state.rawPages[state.currentPageIndex]);
        rightPageHTML = await loadPageContent(state.rawPages[state.currentPageIndex + 1]);
    }

    dom.pageLeft.innerHTML = leftPageHTML;
    dom.pageRight.innerHTML = rightPageHTML;
    updateNavigationButtons();
    // updateUrlHash(); // Hash update is called after flip completes
}

export function updateNavigationButtons() {
    dom.prevBtn.disabled = state.currentPageIndex <= 0; 
    dom.nextBtn.disabled = state.currentPageIndex >= state.rawPages.length - 2;
}

// Main page flipping logic
export async function flipPage(direction) {
    if (state.isFlipping || state.zoomLevel !== 1) return;

    const oldPageIndex = state.currentPageIndex;
    let newPageIndex;
    if (direction === 'forward') {
        newPageIndex = (oldPageIndex === -1) ? 0 : oldPageIndex + 2;
    } else { // 'backward'
        newPageIndex = (oldPageIndex === 0) ? -1 : oldPageIndex - 2;
    }

    if (newPageIndex < -1 || newPageIndex > state.rawPages.length - 1) {
        return;
    }
    
    // Dispatch 'book:flipping' event
    const flippingEvent = new CustomEvent('book:flipping', { detail: { 
        oldPageIndex: oldPageIndex, 
        newPageIndex: newPageIndex,
        direction: direction
    }});
    dom.bookContainer.dispatchEvent(flippingEvent);

    state.isFlipping = true;

    // --- ENHANCED FLIP VISUAL BEHAVIOR ---
    // 1. Pre-render the *target spread* on the static pages (pageLeft, pageRight)
    // 2. Create the turning page and populate its faces with the *old* content
    
    const { turningPage, frontFace, backFace } = createTurningPageElement();
    turningPage.style.zIndex = 10; // Ensure turning page is above static pages

    let turningPageFrontContent = '';
    let turningPageBackContent = '';

    if (direction === 'forward') {
        // The page that is visually turning away (front face of turning page)
        turningPageFrontContent = dom.pageRight.innerHTML;
        // The page that is revealed by turning away (back face of turning page)
        turningPageBackContent = await loadPageContent(state.rawPages[newPageIndex] || 'blank');
        
        turningPage.style.left = `${state.options.pageWidth}px`;
        turningPage.style.transformOrigin = 'left center';
        dom.book.classList.add('turn-right');
        turningPage.style.transform = 'rotateY(-180deg) rotateX(2deg)';
    } else { // 'backward'
        // The page that is visually turning away (front face of turning page)
        turningPageFrontContent = dom.pageLeft.innerHTML;
        // The page that is revealed by turning away (back face of turning page)
        turningPageBackContent = await loadPageContent(state.rawPages[newPageIndex + 1] || 'blank');
        
        turningPage.style.left = '0px';
        turningPage.style.transformOrigin = 'right center';
        dom.book.classList.add('turn-left');
        turningPage.style.transform = 'rotateY(180deg) rotateX(-2deg)';
    }

    frontFace.innerHTML = turningPageFrontContent;
    backFace.innerHTML = turningPageBackContent;
    turningPage.style.transition = `transform ${state.options.animationDuration}ms ease-in-out, box-shadow ${state.options.animationDuration}ms ease-in-out`;
    
    // Now, update the static pages (pageLeft, pageRight) with the *new spread's content*
    state.currentPageIndex = newPageIndex; // Temporarily update index for renderSpread
    await renderSpread(); // This will put the target spread underneath the turning page
    updateNavigationButtons(); // Update buttons immediately

    turningPage.addEventListener('transitionend', () => {
        if (turningPage.parentNode) {
            turningPage.parentNode.removeChild(turningPage);
        }
        dom.book.classList.remove('turn-right', 'turn-left');
        state.isFlipping = false;
        
        // Dispatch 'book:flipped' event
        const flippedEvent = new CustomEvent('book:flipped', { detail: { 
            pageIndex: state.currentPageIndex, 
            pageNumber: (state.currentPageIndex === -1) ? 1 : state.currentPageIndex + 1
        }});
        dom.bookContainer.dispatchEvent(flippedEvent);

    }, { once: true });
}
