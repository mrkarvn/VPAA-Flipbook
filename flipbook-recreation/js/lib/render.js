// js/lib/render.js

import { state, dom } from './state.js';
import { loadPageContent } from './helpers.js';

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
    // Clear previous content
    dom.pageLeft.innerHTML = '';
    dom.pageRight.innerHTML = '';

    let leftPageNumber, rightPageNumber;
    
    if (state.currentPageIndex === -1) { // Front cover
        leftPageNumber = null;
        rightPageNumber = 1;
    } else {
        leftPageNumber = state.currentPageIndex;
        rightPageNumber = state.currentPageIndex + 1;
    }

    if (leftPageNumber) {
        const pageContent = await loadPageContent(leftPageNumber);
        dom.pageLeft.appendChild(pageContent);
    }

    if (rightPageNumber && rightPageNumber <= state.pdfDoc.numPages) {
        const pageContent = await loadPageContent(rightPageNumber);
        dom.pageRight.appendChild(pageContent);
    }
    
    updateNavigationButtons();
    // updateUrlHash(); // This is called in other places
}

export function updateNavigationButtons() {
    dom.prevBtn.disabled = state.currentPageIndex <= 0; 
    dom.nextBtn.disabled = state.currentPageIndex >= state.rawPages.length - 2;
}
