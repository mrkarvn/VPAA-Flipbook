// js/lib/api.js

import { state } from './state.js';
import { renderSpread } from './render.js';
import { flipPage } from './animation.js';

export const bookAPI = {
    goToPage: async (pageNumber, animate = true) => {
        if (state.isFlipping) return;

        let targetPageIndex;
        if (pageNumber === 1) { // Page 1 is always the cover
            targetPageIndex = -1;
        } else {
            targetPageIndex = pageNumber - 1; // Convert 1-based page number to 0-based index for rawPages
        }

        // Ensure targetPageIndex is valid for a spread
        // If currentPageIndex = -1 (page 1 is right)
        //   targetPageIndex can be 0 (page 1 right, left blank)
        //   targetPageIndex can be 1 (page 1 left, page 2 right)
        // ...
        //   targetPageIndex can be rawPages.length - 2 (last content page on left)
        if (targetPageIndex < -1 || targetPageIndex > state.rawPages.length - 1) { // rawPages.length-1 is the index of the backcover, which can be a left page
            targetPageIndex = -1; // Default to cover if invalid
        }
        
        // Adjust for odd pages to be left page of a spread
        // If requested page is 2 (index 1), targetPageIndex is 1. This is fine.
        // If requested page is 3 (index 2), targetPageIndex is 2. This is an even index, meaning it should be a right page.
        // So we need to adjust targetPageIndex to be the left page of that spread.
        // The left page for rawPages[2] is rawPages[1]. So targetPageIndex should be 1.
        if (targetPageIndex > 0 && targetPageIndex % 2 === 0) { // If it's an even index > 0, adjust to its left spread partner
            targetPageIndex -= 1;
        }

        if (targetPageIndex === state.currentPageIndex) {
            return; // Already on the target page
        }

        // Determine direction for animation if requested
        let direction = 'forward';
        if (targetPageIndex < state.currentPageIndex) {
            direction = 'backward';
        }

        if (animate) {
            // Animate multiple flips if needed
            let current = bookAPI.getCurrentPageNumber();
            let flipsNeeded = Math.ceil(Math.abs(pageNumber - current) / 2); // Each flip changes 2 raw pages

            for (let i = 0; i < flipsNeeded; i++) {
                await flipPage(direction);
                // The flipPage function updates state.currentPageIndex internally
                // We need to ensure that the loop continues to flip until targetPageIndex is reached
                // This will happen automatically if flipPage is sequential, but needs careful await.
                // flipPage already updates currentPageIndex, so the next iteration will check the new state
                if (state.currentPageIndex === targetPageIndex) {
                    break;
                }
            }
            
        } else { // No animation, direct jump
            state.currentPageIndex = targetPageIndex;
            await renderSpread();
        }
    },
    getCurrentPageNumber: () => {
        return (state.currentPageIndex === -1) ? 1 : state.currentPageIndex + 1;
    },
    getTotalPages: () => state.pdfDoc ? state.pdfDoc.numPages : 0 // Total pages from PDF.js document
};
