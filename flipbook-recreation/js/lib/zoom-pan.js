// js/lib/zoom-pan.js

import { state, dom } from './state.js';
import { getX, getY } from './helpers.js';

export function applyZoomTransform() {
    dom.bookContainer.style.transform = `scale(${state.zoomLevel}) translate(${state.translateX}px, ${state.translateY}px)`;
}

export function resetZoom() {
    state.zoomLevel = 1;
    state.translateX = 0;
    state.translateY = 0;
    applyZoomTransform();
}

export function handleZoom(e) {
    e.preventDefault(); // Prevent page scrolling
    if (state.isFlipping) return;

    const oldZoomLevel = state.zoomLevel;
    let delta = e.deltaY;

    if (e.ctrlKey) { // Pinch zoom on trackpad
        delta = delta / 30;
    } else {
        delta = delta / 100;
    }
    
    state.zoomLevel = Math.max(state.options.minZoom, Math.min(state.options.maxZoom, state.zoomLevel - delta * state.options.zoomFactor * 5));

    if (state.zoomLevel > state.options.minZoom) {
        const rect = dom.bookContainer.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - (rect.width / 2);
        const mouseY = e.clientY - rect.top - (rect.height / 2);
        
        state.translateX = (mouseX * (oldZoomLevel - state.zoomLevel)) / oldZoomLevel;
        state.translateY = (mouseY * (oldZoomLevel - state.zoomLevel)) / oldZoomLevel;

    } else {
        resetZoom();
    }

    applyZoomTransform();
}

export function handleDoubleClick(e) {
    if (state.isFlipping) return;

    if (state.zoomLevel === state.options.minZoom) {
        state.zoomLevel = state.options.maxZoom;
        const rect = dom.bookContainer.getBoundingClientRect();
        state.translateX = -(e.clientX - rect.left - (rect.width / 2)) * (state.zoomLevel - 1) / state.zoomLevel;
        state.translateY = -(e.clientY - rect.top - (rect.height / 2)) * (state.zoomLevel - 1) / state.zoomLevel;
    } else {
        resetZoom();
    }
    applyZoomTransform();
}

export function startPan(e) {
    if (state.zoomLevel === state.options.minZoom) return; // Only pan if zoomed
    state.isPanning = true;
    state.panStartX = getX(e);
    state.panStartY = getY(e);
    dom.bookContainer.style.cursor = 'grabbing';
}

export function panMove(e) {
    if (!state.isPanning) return;
    const currentX = getX(e);
    const currentY = getY(e);

    state.translateX += (currentX - state.panStartX) / state.zoomLevel;
    state.translateY += (currentY - state.panStartY) / state.zoomLevel;

    state.panStartX = currentX;
    state.panStartY = currentY;

    applyZoomTransform();
}

export function endPan() {
    state.isPanning = false;
    dom.bookContainer.style.cursor = 'grab';
}

// --- Pinch-to-zoom (Touch) ---
export function getPinchDistance(e) {
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    return Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
    );
}

export function startPinch(e) {
    if (e.touches.length === 2 && !state.isFlipping) {
        state.isPinching = true;
        state.initialPinchDistance = getPinchDistance(e);
        state.initialZoomLevel = state.zoomLevel;
        e.preventDefault();
    }
}

export function movePinch(e) {
    if (!state.isPinching || e.touches.length < 2) return;

    const currentPinchDistance = getPinchDistance(e);
    const scaleFactor = currentPinchDistance / state.initialPinchDistance;
    const newZoomLevel = state.initialZoomLevel * scaleFactor;

    state.zoomLevel = Math.max(state.options.minZoom, Math.min(state.options.maxZoom, newZoomLevel));

    const rect = dom.bookContainer.getBoundingClientRect();
    const pinchCenterX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left - (rect.width / 2);
    const pinchCenterY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top - (rect.height / 2);

    state.translateX = pinchCenterX * (1 - (state.zoomLevel / state.initialZoomLevel));
    state.translateY = pinchCenterY * (1 - (state.zoomLevel / initialZoomLevel));

    applyZoomTransform();
    e.preventDefault();
}

export function endPinch() {
    state.isPinching = false;
    if (state.zoomLevel < state.options.minZoom + 0.1) {
        resetZoom();
    }
}
