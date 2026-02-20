// js/lib/dom-manipulation.js

import { dom } from './state.js';

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
