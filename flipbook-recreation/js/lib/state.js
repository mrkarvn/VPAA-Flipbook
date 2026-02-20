// js/lib/state.js

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
    
    pdfDoc: null, // To store the loaded PDF document object
    rawPages: [], // Array of page numbers, e.g., [1, 2, 3, ...]

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