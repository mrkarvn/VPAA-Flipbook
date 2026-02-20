// js/lib/drag-turn.js

import { state, dom } from './state.js';
import { getX, loadPageContent } from './helpers.js';
import { createTurningPageElement } from './dom-manipulation.js';
import { renderSpread } from './render.js';
import { flipPage } from './animation.js'; // Import flipPage for drag-commit

export function startDrag(e) {
    if (state.isFlipping || state.zoomLevel !== 1 || (e.touches && e.touches.length > 1)) return; // Prevent drag if zoomed or multi-touch
    // updatePageWidth is called on init and resize, no need to call on every drag start
    
    state.isDragging = true;
    state.startX = getX(e);
    dom.book.style.cursor = 'grabbing';

    const rect = dom.bookContainer.getBoundingClientRect();
    const clickX = getX(e) - rect.left;

    if (clickX > rect.width / 2 && state.currentPageIndex < state.rawPages.length - 2) { 
        state.dragDirection = 'forward';
    } 
    else if (clickX < rect.width / 2 && state.currentPageIndex > -1) { 
        state.dragDirection = 'backward';
    } else {
        state.isDragging = false;
        return;
    }

    const { turningPage, frontFace, backFace } = createTurningPageElement();
    state.currentTurningPage = turningPage;
    state.currentTurningPage.style.transition = 'none'; // No transition during drag

    if (state.dragDirection === 'forward') {
        frontFace.innerHTML = dom.pageRight.innerHTML; // Content of current right page (e.g., page 2)
        
        // For a forward drag, the backface of the turning page should show the new left page's content
        // (which is the old left page + 2, or cover for first turn)
        let nextLeftPageIndex = (state.currentPageIndex === -1) ? 0 : state.currentPageIndex + 2;
        loadPageContent(state.rawPages[nextLeftPageIndex]).then(content => {
            backFace.innerHTML = content;
        });
        
        state.currentTurningPage.style.left = `${state.options.pageWidth}px`;
        state.currentTurningPage.style.transformOrigin = 'left center';
    } else { // backward
        frontFace.innerHTML = dom.pageLeft.innerHTML; // Content of current left page (e.g., page 1)
        
        // For a backward drag, the backface of the turning page should show the previous right page's content
        let prevRightPageIndex = (state.currentPageIndex === 0) ? 0 : state.currentPageIndex - 1;
        loadPageContent(state.rawPages[prevRightPageIndex]).then(content => {
            backFace.innerHTML = content;
        });

        state.currentTurningPage.style.left = '0px';
        state.currentTurningPage.style.transformOrigin = 'right center';
    }
}

export function dragMove(e) {
    if (!state.isDragging || !state.currentTurningPage || !state.dragDirection || (e.touches && e.touches.length > 1)) return;

    const currentX = getX(e);
    let dragAmount = currentX - state.startX;
    let rotation = 0;
    let tilt = 0;

    if (state.dragDirection === 'forward') {
        dragAmount = Math.min(0, dragAmount); // Only allow dragging left (negative)
        rotation = (dragAmount / state.options.pageWidth) * 180; // 0 to -180
        tilt = 2;
    } else { // backward
        dragAmount = Math.max(0, dragAmount); // Only allow dragging right (positive)
        rotation = (dragAmount / state.options.pageWidth) * 180; // 0 to 180
        tilt = -2;
    }

    state.currentTurningPage.style.transform = `rotateY(${rotation}deg) rotateX(${tilt}deg)`;
}

export async function endDrag(e) {
    if (!state.isDragging) return;
    state.isDragging = false;
    dom.book.style.cursor = 'grab';

    if (!state.currentTurningPage || !state.dragDirection) {
        if (state.currentTurningPage && state.currentTurningPage.parentNode) {
            state.currentTurningPage.parentNode.removeChild(state.currentTurningPage);
        }
        state.currentTurningPage = null;
        state.dragDirection = null;
        return;
    }

    const currentX = getX(e);
    let dragAmount = currentX - state.startX;
    const pageRelativeDrag = Math.abs(dragAmount) / state.options.pageWidth;

    if (pageRelativeDrag > state.options.dragThresholdPercentage) {
        state.currentTurningPage.style.transition = `transform ${state.options.animationDuration}ms ease-in-out, box-shadow ${state.options.animationDuration}ms ease-in-out`;
        if (state.dragDirection === 'forward') {
            state.currentTurningPage.style.transform = 'rotateY(-180deg) rotateX(2deg)';
            dom.book.classList.add('turn-right');
        } else { // backward
            state.currentTurningPage.style.transform = 'rotateY(180deg) rotateX(-2deg)';
            dom.book.classList.add('turn-left');
        }

        state.isFlipping = true;
        
        const newPageIndex = (state.dragDirection === 'forward') ? 
                              ((state.currentPageIndex === -1) ? 0 : state.currentPageIndex + 2) :
                              ((state.currentPageIndex === 0) ? -1 : state.currentPageIndex - 2);

        const flippingEvent = new CustomEvent('book:flipping', { detail: { 
            oldPageIndex: state.currentPageIndex, 
            newPageIndex: newPageIndex,
            direction: state.dragDirection
        }});
        dom.bookContainer.dispatchEvent(flippingEvent);

        state.currentTurningPage.addEventListener('transitionend', () => {
            if (state.currentTurningPage.parentNode) {
                state.currentTurningPage.parentNode.removeChild(state.currentTurningPage);
            }
            dom.book.classList.remove('turn-right', 'turn-left');
            state.currentPageIndex = newPageIndex; // Final update of index
            renderSpread(); // Re-render static pages to reflect final state
            state.isFlipping = false;
            state.currentTurningPage = null;
            state.dragDirection = null;

            const flippedEvent = new CustomEvent('book:flipped', { detail: { 
                pageIndex: state.currentPageIndex, 
                pageNumber: (state.currentPageIndex === -1) ? 1 : state.currentPageIndex + 1
            }});
            dom.bookContainer.dispatchEvent(flippedEvent);

        }, { once: true });

    } else {
        // Snap back
        state.currentTurningPage.style.transition = 'transform 0.3s ease-out';
        if (state.dragDirection === 'forward') {
            state.currentTurningPage.style.transform = 'rotateY(0deg) rotateX(0deg)';
        } else { // backward
            state.currentTurningPage.style.transform = 'rotateY(0deg) rotateX(0deg)';
        }

        state.currentTurningPage.addEventListener('transitionend', () => {
            if (state.currentTurningPage.parentNode) {
                state.currentTurningPage.parentNode.removeChild(state.currentTurningPage);
            }
            state.currentTurningPage = null;
            state.dragDirection = null;
        }, { once: true });
    }
}
