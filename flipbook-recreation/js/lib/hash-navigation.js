// js/lib/hash-navigation.js

import { state, dom } from './state.js';
import { bookAPI } from './api.js'; // bookAPI will be defined in api.js

export function updateUrlHash() {
    let pageNumberForHash = (state.currentPageIndex === -1) ? 1 : state.currentPageIndex + 1;

    if (window.location.hash !== `#page/${pageNumberForHash}`) {
        history.pushState(null, null, `#page/${pageNumberForHash}`);
    }
}

export function handleHashChange() {
    const hash = window.location.hash;
    if (hash.startsWith('#page/')) {
        const requestedPageNumber = parseInt(hash.substring(6));
        if (!isNaN(requestedPageNumber)) {
            bookAPI.goToPage(requestedPageNumber, false); // Use the API's goToPage, no animation
        }
    }
}
