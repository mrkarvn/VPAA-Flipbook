// js/lib/animation.js

import { state, dom } from './state.js';
import { loadPageContent } from './helpers.js';
import { createTurningPageElement } from './dom-manipulation.js';
import { renderSpread, updateNavigationButtons } from './render.js';

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
    // 1. Update the static pages (pageLeft, pageRight) with the *new spread's content*
    //    This makes the target spread visible *underneath* the turning page.
    // 2. Create the turning page and populate its faces with the *old* content
    
    // Temporarily update currentPageIndex to render the new spread underneath
    const tempCurrentPageIndex = state.currentPageIndex; // Store old index
    state.currentPageIndex = newPageIndex;
    await renderSpread(); // This will put the target spread underneath the turning page
    state.currentPageIndex = tempCurrentPageIndex; // Revert for accurate old page content fetching

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
        turningPageBackContent = await loadPageContent(state.rawPages[oldPageIndex + 1] || 'blank'); // Use oldPageIndex for content
        
        turningPage.style.left = '0px';
        turningPage.style.transformOrigin = 'right center';
        dom.book.classList.add('turn-left');
        turningPage.style.transform = 'rotateY(180deg) rotateX(-2deg)';
    }

    frontFace.innerHTML = turningPageFrontContent;
    backFace.innerHTML = turningPageBackContent;
    turningPage.style.transition = `transform ${state.options.animationDuration}ms ease-in-out, box-shadow ${state.options.animationDuration}ms ease-in-out`;
    
    turningPage.addEventListener('transitionend', () => {
        if (turningPage.parentNode) {
            turningPage.parentNode.removeChild(turningPage);
        }
        dom.book.classList.remove('turn-right', 'turn-left');
        state.currentPageIndex = newPageIndex; // Final update of index
        renderSpread(); // Re-render to ensure final state consistency and hash update
        state.isFlipping = false;
        
        // Dispatch 'book:flipped' event
        const flippedEvent = new CustomEvent('book:flipped', { detail: { 
            pageIndex: state.currentPageIndex, 
            pageNumber: (state.currentPageIndex === -1) ? 1 : state.currentPageIndex + 1
        }});
        dom.bookContainer.dispatchEvent(flippedEvent);

    }, { once: true });
}
