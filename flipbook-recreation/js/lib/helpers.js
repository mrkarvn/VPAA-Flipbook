// js/lib/helpers.js

import { state } from './state.js';

// Helper to get X coordinate from mouse/touch event
export function getX(e) {
    return e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
}

// Helper to get Y coordinate from mouse/touch event
export function getY(e) {
    return e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
}

// New loadPageContent to render PDF page onto a canvas
export async function loadPageContent(pageNumber) {
    if (!state.pdfDoc || !pageNumber || pageNumber < 1 || pageNumber > state.pdfDoc.numPages) {
        // Return an empty page content if no PDF or page number is invalid
        const emptyPage = document.createElement('div');
        emptyPage.classList.add('page-content');
        return emptyPage;
    }

    try {
        const page = await state.pdfDoc.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.5 }); // Adjust scale for desired resolution

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        await page.render(renderContext).promise;

        const pageContent = document.createElement('div');
        pageContent.classList.add('page-content');
        pageContent.appendChild(canvas);
        return pageContent;

    } catch (error) {
        console.error(`Error rendering page ${pageNumber}:`, error);
        const errorPage = document.createElement('div');
        errorPage.classList.add('page-content');
        errorPage.innerHTML = `<h1>Error rendering page ${pageNumber}</h1><p>${error.message}</p>`;
        return errorPage;
    }
}
