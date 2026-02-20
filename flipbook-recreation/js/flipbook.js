// flipbook-recreation/js/flipbook.js

document.addEventListener('DOMContentLoaded', async () => {
    const flipbookContainer = document.getElementById('flipbook-container');
    const flipbookDiv = document.getElementById('flipbook');

    // Zoom and Pan variables
    let currentZoom = 1.0;
    const minZoom = 1.0;
    const maxZoom = 3.0;
    let isDragging = false;
    let startX, startY; // Mouse position when drag starts
    let translateX = 0, translateY = 0; // Current pan offset
    let lastTranslateX = 0, lastTranslateY = 0; // To store translation before a new zoom
    let allowPageTurn = true; // Control page turning during drag

    // Audio for page flip sound
    const flipSound = new Audio('../Page Flip - QuickSounds.com.mp3');
    flipSound.preload = 'auto';
    flipSound.load();
    let isMuted = false;
    let firstTurn = true; // Flag to skip sound on initial load

    // Control buttons
    // homeBtn removed from DOM, reference deleted
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const muteBtn = document.getElementById('mute-btn');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const downloadBtn = document.getElementById('download-btn');
    const arrowLeftBtn = document.getElementById('arrow-left');
    const arrowRightBtn = document.getElementById('arrow-right');
    const arrowButtonContainer = document.querySelector('.arrow-button-container');
    const wrapper = document.documentElement;
    
    // Function to hide skeleton loader
    function hideSkeletonLoader() {
        const skeletonLoader = document.getElementById('skeleton-loader');
        if (skeletonLoader) {
            // Add fade-out animation
            skeletonLoader.classList.remove('visible');
            skeletonLoader.classList.add('hidden');
            
            // Remove from DOM after animation completes
            setTimeout(() => {
                skeletonLoader.style.display = 'none';
            }, 600);
        }
    }
    
        // Function to update the CSS transform
        function updateTransform() {
            flipbookDiv.style.transform = `scale(${currentZoom}) translate(${translateX}px, ${translateY}px)`;
            flipbookDiv.style.transformOrigin = `0 0`;
            
            // Apply the same transform to arrow button container on desktop only (not on mobile)
            if (arrowButtonContainer) {
                const isMobile = window.innerWidth <= 768;
                if (!isMobile) {
                    // Desktop: buttons attached to flipbook with transforms
                    arrowButtonContainer.style.transform = `scale(${currentZoom}) translate(${translateX}px, ${translateY}px)`;
                    arrowButtonContainer.style.transformOrigin = `0 0`;
                } else {
                    // Mobile: buttons stay fixed at bottom, no transform
                    arrowButtonContainer.style.transform = 'translateX(-50%)';
                    arrowButtonContainer.style.transformOrigin = 'center center';
                }
            }

        // Apply cursor based on zoom level
        if (currentZoom > minZoom) {
            flipbookContainer.classList.add('grab-cursor');
        } else {
            flipbookContainer.classList.remove('grab-cursor');
            flipbookContainer.classList.remove('grabbing-cursor');
        }
    }

    // Function to set the zoom level
    function setZoom(newZoom, originX = flipbookContainer.offsetWidth / 2, originY = flipbookContainer.offsetHeight / 2, recenter = false) {
        newZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));

        if (newZoom === currentZoom) return;

        const currentScale = currentZoom;
        const newScale = newZoom;

        if (recenter || newZoom <= minZoom) { // Always recenter if flag is true or if zooming out to minZoom
            translateX = 0;
            translateY = 0;
        } else {
            // Adjust translate to keep the origin point (mouse position) in the same relative spot
            // This effectively "zooms into" the mouse cursor
            translateX = originX - (originX - translateX) * (newScale / currentScale);
            translateY = originY - (originY - translateY) * (newScale / currentScale);
        }

        currentZoom = newZoom;
        clampTranslate(); // Ensure translation stays within bounds after zoom
        updateTransform();
    }

    
fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        // This will fullscreen the whole page, preserving your body background
        wrapper.requestFullscreen().catch(err => {
            console.error(`Fullscreen error: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
});
document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
        console.log('Entered fullscreen');
        // re-render / resize flipbook here
    } else {
        console.log('Exited fullscreen');
        // restore layout if needed
    }
});
    // Function to clamp translation values
    function clampTranslate() {
        if (currentZoom <= minZoom) {
            translateX = 0;
            translateY = 0;
            return;
        }

        const containerWidth = flipbookContainer.offsetWidth;
        const containerHeight = flipbookContainer.offsetHeight;
        const scaledContentWidth = containerWidth * currentZoom;
        const scaledContentHeight = containerHeight * currentZoom;

        // Max translation values (cannot translate positively beyond 0,0 since origin is 0,0)
        const maxAllowedTranslateX = 0;
        const maxAllowedTranslateY = 0;

        // Min translation values (negative values to show content that has scaled beyond view)
        const minAllowedTranslateX = -(scaledContentWidth - containerWidth);
        const minAllowedTranslateY = -(scaledContentHeight - containerHeight);
        
        translateX = Math.max(minAllowedTranslateX, Math.min(maxAllowedTranslateX, translateX));
        translateY = Math.max(minAllowedTranslateY, Math.min(maxAllowedTranslateY, translateY));
}


    try {
        // 1. Retrieve PDF by id from backend
        const flipbookId = window.flipbookId;
        if (!flipbookId) {
            alert("No flipbook ID provided in URL.");
            return;
        }
        // Fetch the PDF as an ArrayBuffer
        const response = await fetch(`backend-php/view.php?id=${flipbookId}`);
        if (!response.ok) {
            alert("Failed to load PDF. It may not exist or you do not have access.");
            return;
        }
        const pdfArrayBuffer = await response.arrayBuffer();

        // Make flipbook visible immediately after PDF data is retrieved
        flipbookContainer.style.display = 'block';

        // 2. Render PDF pages using PDF.js
        const pdf = await pdfjsLib.getDocument({ data: pdfArrayBuffer }).promise;
        const numPages = pdf.numPages;

        // Calculate optimal dimensions for Turn.js based on first page aspect ratio
        const firstPage = await pdf.getPage(1);
        const viewport = firstPage.getViewport({ scale: 1 }); // Get original PDF page dimensions
        const pdfPageOriginalWidth = viewport.width;
        const pdfPageOriginalHeight = viewport.height;
        const pageAspectRatio = pdfPageOriginalWidth / pdfPageOriginalHeight;

        let calculatedFlipbookWidth, calculatedFlipbookHeight;
        let displayMode = 'double';

        // Function to adjust flipbook size based on container and page aspect ratio
        const adjustFlipbookSize = () => {
            const containerInitialWidth = flipbookContainer.offsetWidth;
            const containerInitialHeight = flipbookContainer.offsetHeight;
            const isMobile = window.innerWidth <= 768;

            // Use single page mode on mobile or if only 1 page
            if (numPages === 1 || isMobile) {
                displayMode = 'single';
                let singlePageFitWidth = containerInitialWidth;
                let singlePageFitHeight = singlePageFitWidth / pageAspectRatio;

                if (singlePageFitHeight > containerInitialHeight) {
                    singlePageFitHeight = containerInitialHeight;
                    singlePageFitWidth = singlePageFitHeight * pageAspectRatio;
                }
                calculatedFlipbookWidth = singlePageFitWidth;
                calculatedFlipbookHeight = singlePageFitHeight;

            } else {
                // For double page spread
                const desiredSinglePageWidth = containerInitialWidth / 2;
                const desiredSinglePageHeight = containerInitialHeight;

                let singlePageWidth = desiredSinglePageWidth;
                let singlePageHeight = singlePageWidth / pageAspectRatio;

                if (singlePageHeight > desiredSinglePageHeight) {
                    singlePageHeight = desiredSinglePageHeight;
                    singlePageWidth = singlePageHeight * pageAspectRatio;
                }
                
                calculatedFlipbookWidth = singlePageWidth * 2;
                calculatedFlipbookHeight = singlePageHeight;
            }

            // Fallback if calculated dimensions are too small (e.g., for very narrow containers)
            if (calculatedFlipbookWidth < 300) { // Minimum width for the entire flipbook
                 calculatedFlipbookWidth = 300;
                 if (displayMode === 'single') {
                     calculatedFlipbookHeight = calculatedFlipbookWidth / pageAspectRatio;
                 } else {
                     calculatedFlipbookHeight = calculatedFlipbookWidth / (2 * pageAspectRatio);
                 }
                 if (calculatedFlipbookHeight > containerInitialHeight) {
                     calculatedFlipbookHeight = containerInitialHeight;
                     if (displayMode === 'single') {
                         calculatedFlipbookWidth = calculatedFlipbookHeight * pageAspectRatio;
                     } else {
                         calculatedFlipbookWidth = calculatedFlipbookHeight * 2 * pageAspectRatio;
                     }
                 }
            }
            if (calculatedFlipbookHeight < 200) { // Minimum height for the entire flipbook
                calculatedFlipbookHeight = 200;
                if (displayMode === 'single') {
                    calculatedFlipbookWidth = calculatedFlipbookHeight * pageAspectRatio;
                } else {
                    calculatedFlipbookWidth = calculatedFlipbookHeight * 2 * pageAspectRatio;
                }
                if (calculatedFlipbookWidth > containerInitialWidth) {
                     calculatedFlipbookWidth = containerInitialWidth;
                     if (displayMode === 'single') {
                         calculatedFlipbookHeight = calculatedFlipbookWidth / pageAspectRatio;
                     } else {
                         calculatedFlipbookHeight = calculatedFlipbookWidth / (2 * pageAspectRatio);
                     }
                 }
            }

            // Set flipbook container's actual dimensions to match calculated flipbook dimensions
            flipbookContainer.style.width = `${calculatedFlipbookWidth}px`;
            flipbookContainer.style.height = `${calculatedFlipbookHeight}px`;

            // Update Turn.js dimensions if already initialized
            if ($(flipbookDiv).data().turn) {
                 $(flipbookDiv).turn('size', calculatedFlipbookWidth, calculatedFlipbookHeight);
            }
        };

        // Initial adjustment
        adjustFlipbookSize();

        // 1. Determine the optimal render scale
        // Check the device's pixel density (usually 1 on old screens, 2 or 3 on modern ones)
        const dpr = window.devicePixelRatio || 3;

        // Multiplier to keep text sharp when zooming in later (e.g., if maxZoom is 3, render at higher res)
        const ZOOM_BUFFER = 3;

        // Calculate the scale needed to fit the page height
        let baseScale = (calculatedFlipbookHeight / pdfPageOriginalHeight);
        if (displayMode === 'double') {
            // If double view, scaling is the same per-page logic
            baseScale = (calculatedFlipbookHeight / pdfPageOriginalHeight);
        }

        // The final scale for the high-res canvas rendering
        const outputScale = baseScale * dpr * ZOOM_BUFFER;

        const renderPagePromises = [];

        for (let i = 1; i <= numPages; i++) {
            renderPagePromises.push(
                (async () => {
                    const page = await pdf.getPage(i);

                    // Create the viewport at the HIGH resolution
                    const viewport = page.getViewport({ scale: outputScale });

                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');

                    // Set actual canvas dimensions (High Res)
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;

                    // Set CSS dimensions (The visual size on screen)
                    // We divide by the multiplier to shrink the high-res image into the visual space
                    canvas.style.width = (viewport.width / (dpr * ZOOM_BUFFER)) + 'px';
                    canvas.style.height = (viewport.height / (dpr * ZOOM_BUFFER)) + 'px';

                    const renderContext = {
                        canvasContext: context,
                        viewport: viewport
                    };

                    await page.render(renderContext).promise;

                    // Convert to image
                    const img = document.createElement('img');

                    // Use quality 1.0 (maximum quality) to prevent JPEG artifacts
                    img.src = canvas.toDataURL('image/jpeg', 1.0);

                    img.classList.add('page-image');

                    // OPTIONAL: Force the image to respect the CSS bounds
                    img.style.width = '100%';
                    img.style.height = '100%';

                    return img;
                })()
            );
        }

        const pageImages = await Promise.all(renderPagePromises);

        // 3. Add images as pages to the flipbook div
        pageImages.forEach(img => {
            const pageDiv = document.createElement('div');
            pageDiv.classList.add('page');
            pageDiv.appendChild(img);
            flipbookDiv.appendChild(pageDiv);
        });

        // 4. Initialize Turn.js
        $(flipbookDiv).turn({
            width: calculatedFlipbookWidth,
            height: calculatedFlipbookHeight,
            autoCenter: true,
            acceleration: true,
            display: displayMode, // Use dynamic display mode
            elevation: 50,
            gradients: true,
            pages: numPages,
            shadows: false // Disable shadows to prevent potential rendering issues
        });

        // Initial transform
        updateTransform();

        // Function to update arrow button visibility based on current page
        function updateArrowButtonStates() {
            const currentPage = $(flipbookDiv).turn('page');
            
            // Disable left arrow if on first page
            if (currentPage <= 1) {
                arrowLeftBtn.disabled = true;
            } else {
                arrowLeftBtn.disabled = false;
            }
            
            // Disable right arrow if on last page (or last two pages for double mode)
            const lastPage = displayMode === 'single' ? numPages : numPages;
            if (currentPage >= lastPage - 1) {
                arrowRightBtn.disabled = true;
            } else {
                arrowRightBtn.disabled = false;
            }
        }

        // Arrow button click handlers
        arrowLeftBtn.addEventListener('click', () => {
            const currentPage = $(flipbookDiv).turn('page');
            if (currentPage > 1) {
                $(flipbookDiv).turn('previous');
            }
        });

        arrowRightBtn.addEventListener('click', () => {
            const currentPage = $(flipbookDiv).turn('page');
            if (displayMode === 'single') {
                if (currentPage < numPages) {
                    $(flipbookDiv).turn('next');
                }
            } else {
                if (currentPage < numPages - 1) {
                    $(flipbookDiv).turn('next');
                }
            }
        });

        // Add sound on user-initiated page turns
        $(flipbookDiv).bind('turning', function(event, page, view) {
            if (!isMuted) {
                flipSound.currentTime = 0;
                flipSound.play().catch(e => console.log('Audio play failed:', e));
            }
            // Update arrow button states after page turn
            setTimeout(updateArrowButtonStates, 100);
        });

        // Also update arrow buttons when turn completes
        $(flipbookDiv).bind('turned', function(event, page, view) {
            updateArrowButtonStates();
        });

        // Initial arrow button state
        updateArrowButtonStates();

        // Hide skeleton loader when flipbook is ready
        hideSkeletonLoader();

        // Handle window resize
        let resizeTimeout;
        const resizeFlipbook = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                adjustFlipbookSize();
                clampTranslate(); // Re-clamp after resize
                updateTransform();
            }, 500); 
        };

        window.addEventListener('resize', resizeFlipbook);

        // Event listeners for control buttons

        zoomInBtn.addEventListener('click', () => {
            setZoom(currentZoom + 0.1, undefined, undefined, true); // Zoom towards center with smaller step, and recenter
        });

        zoomOutBtn.addEventListener('click', () => {
            setZoom(currentZoom - 0.1, undefined, undefined, true); // Zoom towards center with smaller step, and recenter
        });

        muteBtn.addEventListener('click', () => {
            isMuted = !isMuted;
            muteBtn.classList.toggle('muted', isMuted);
        });

       
        

                // Mouse wheel zoom

                flipbookContainer.addEventListener('wheel', (event) => {

                    if (currentZoom === minZoom && event.deltaY < 0) return; // Don't zoom out if already at min

                    if (currentZoom === maxZoom && event.deltaY > 0) return; // Don't zoom in if already at max

        

                    event.preventDefault(); // Prevent page scrolling

        

                    const scaleFactor = 0.1; // How much to zoom per wheel tick

                    const direction = event.deltaY > 0 ? -1 : 1; // Negative deltaY means scroll up (zoom in)

                    const newZoom = currentZoom * (1 + direction * scaleFactor);

        

                    // Get mouse position relative to the flipbook container

                    const rect = flipbookContainer.getBoundingClientRect();

                    const originX = event.clientX - rect.left;

                    const originY = event.clientY - rect.top;

        

                    setZoom(newZoom, originX, originY);

                });

        

                        // Pan handlers

        

                        let onMouseMove = (event) => {

        

                            if (!isDragging) return;

        

                            event.preventDefault(); // Prevent text selection etc.

        

                

        

                            const deltaX = event.clientX - startX;

        

                            const deltaY = event.clientY - startY;

        

                

        

                            // Pan speed needs to be adjusted by currentZoom so it feels consistent regardless of zoom level

        

                            translateX = lastTranslateX + deltaX / currentZoom;

        

                            translateY = lastTranslateY + deltaY / currentZoom;

        

                

        

                            clampTranslate();

        

                            updateTransform();

        

                        };

        

                

        

                        let onMouseUp = () => {

        

                            isDragging = false;

        

                            flipbookContainer.classList.remove('grabbing-cursor');

        

                            if (currentZoom > minZoom) {

        

                                flipbookContainer.classList.add('grab-cursor');

        

                            }

        

                

        

                            // Re-enable Turn.js page turning

        

                            if ($(flipbookDiv).data().turn) {

        

                                $(flipbookDiv).turn('disable', false);

        

                                allowPageTurn = true;

        

                            }

        

                

        

                            // Remove global event listeners

        

                            window.removeEventListener('mousemove', onMouseMove);

        

                            window.removeEventListener('mouseup', onMouseUp);

        

                        };

        

                

        

                        flipbookContainer.addEventListener('mousedown', (event) => {

        

                            if (currentZoom > minZoom) {

        

                                event.preventDefault(); // Prevent default browser drag behavior (e.g., image drag)

        

                                isDragging = true;

        

                                startX = event.clientX;

        

                                startY = event.clientY;

        

                                lastTranslateX = translateX; // Store current translation

        

                                lastTranslateY = translateY;

        

                                flipbookContainer.classList.add('grabbing-cursor');

        

                                flipbookContainer.classList.remove('grab-cursor');

        

                                

        

                                // Disable Turn.js page turning while dragging

        

                                if ($(flipbookDiv).data().turn) {

        

                                    $(flipbookDiv).turn('disable', true);

        

                                    allowPageTurn = false;

        

                                }

        

                

        

                                // Add global event listeners to ensure mouseup is captured even if mouse leaves flipbookContainer

        

                                window.addEventListener('mousemove', onMouseMove);

        

                                window.addEventListener('mouseup', onMouseUp);

        

                            }

        

                        });

        

                

        

                // Download button event listener

                downloadBtn.addEventListener('click', async () => {

                    const originalIcon = downloadBtn.innerHTML;

                    downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

                    downloadBtn.disabled = true;

        

        

                    try {

                        // Fetch external file contents

                        const [styleRes, turnRes, jqueryRes, flipbookCoreJsRes, geometricBluePngRes] = await Promise.all([

                            fetch('../flipbook-recreation/css/style.css').then(res => res.text()),

                            fetch('../turnjs4/lib/turn.min.js').then(res => res.text()),

                            fetch('../turnjs4/extras/jquery.min.1.7.js').then(res => res.text()),

                            fetch('../flipbook-recreation/js/flipbook.js').then(res => res.text()), // Content of this very file

                            fetch('../GEOMETRIC BLUE.png').then(res => res.blob()) // Fetch image as blob

                        ]);

        

                        await downloadFlipbookAsZip(

                            pageImages,

                            pdfData.name,

                            numPages,

                            calculatedFlipbookWidth,

                            calculatedFlipbookHeight,

                            styleRes,

                            turnRes,

                            jqueryRes,

                            flipbookCoreJsRes,

                            geometricBluePngRes // Pass the image blob

                        );

                    } catch (error) {

                        console.error("Error downloading flipbook:", error);

                        alert("An error occurred while generating the flipbook download. Please try again.");

                    } finally {

                        downloadBtn.innerHTML = originalIcon;

                        downloadBtn.disabled = false;

                    }

                });

        

            } catch (error) {

                console.error("Error loading flipbook:", error);

                alert(`Error loading flipbook: ${error.message}. Please try again.`);

            }

        });

        

        // IndexedDB functions (copied from upload.js for now, consider refactoring)

        function openIndexedDB() {

            return new Promise((resolve, reject) => {

                const request = indexedDB.open('PDFStorage', 1);

                request.onupgradeneeded = (event) => {

                    const db = event.target.result;

                    if (!db.objectStoreNames.contains('pdfs')) {

                        db.createObjectStore('pdfs', { keyPath: 'id' });

                    }

                };

                request.onsuccess = (event) => resolve(event.target.result);

                request.onerror = (event) => reject(event.target.error);

            });

        }

        

        async function getPdfFromIndexedDB(id) {

            const db = await openIndexedDB();

            const transaction = db.transaction(['pdfs'], 'readonly');

            const store = transaction.objectStore('pdfs');

            const request = store.get(id);

            return new Promise((resolve, reject) => {

                request.onsuccess = () => resolve(request.result);

                request.onerror = () => reject(request.error);

            });

        }

        

        // Helper function to generate HTML content for the downloaded flipbook

        function generateOfflineHtml(numPages, flipbookWidth, flipbookHeight) {

            const displayMode = (numPages === 1) ? 'single' : 'double';

            return `<!DOCTYPE html>

        <html lang="en">

        <head>

            <meta charset="UTF-8">

            <meta name="viewport" content="width=device-width, initial-scale=1.0">

            <title>Your Offline Flipbook</title>

            <link rel="stylesheet" href="css/style.css">

            <style>

                body {

                    margin: 0;

                    overflow: hidden;

                    display: flex;

                    justify-content: center;

                    align-items: center;

                    min-height: 100vh;

                    background-color: #f0f0f0; /* Default background */

                    background-image: url('assets/GEOMETRIC BLUE.png'); /* Updated path */

                    background-size: cover;

                    background-position: center;

                    background-repeat: no-repeat;

                }

                #flipbook-container {

                    width: ${flipbookWidth}px;

                    height: ${flipbookHeight}px;

                    max-width: 100%;

                    max-height: 90vh;

                    background-color: transparent;

                    position: relative;

                }

                #flipbook {

                    width: 100%;

                    height: 100%;

                    display: flex;

                    justify-content: center;

                    align-items: center;

                }

                .page {

                    width: ${displayMode === 'single' ? '100%' : '50%'};

                    height: 100%;

                    box-sizing: border-box;

                    display: flex;

                    justify-content: center;

                    align-items: center;

                    overflow: hidden;

                }

                .page-image {

                    max-width: 100%;

                    max-height: 100%;

                    object-fit: contain;

                    display: block;

                }

            </style>

        </head>

        <body>

            <div id="flipbook-container">

                <div id="flipbook"></div>

            </div>

            <script src="js/jquery.min.1.7.js"></script>

            <script src="js/turn.min.js"></script>

            <script src="js/flipbook_bundle.js"></script>

        </body>

        </html>`;

        }

        

        // Helper function to generate JS content for the downloaded flipbook

        function generateOfflineJs(numPages, flipbookWidth, flipbookHeight) {

            const displayMode = (numPages === 1) ? 'single' : 'double';

            return `// Custom flipbook.js for offline viewing

        

        document.addEventListener('DOMContentLoaded', () => {

            const flipbookDiv = document.getElementById('flipbook');

            const numPages = ${numPages};

            const calculatedFlipbookWidth = ${flipbookWidth};

            const calculatedFlipbookHeight = ${flipbookHeight};

        

            // Dynamically add images to the flipbook div

            for (let i = 1; i <= numPages; i++) {

                const pageDiv = document.createElement('div');

                pageDiv.classList.add('page');

                const img = document.createElement('img');

                img.src = \`pages/page_\${i}.jpeg\`;

                img.classList.add('page-image');

                pageDiv.appendChild(img);

                flipbookDiv.appendChild(pageDiv);

            }

        

            // Initialize Turn.js

            $(flipbookDiv).turn({

                width: calculatedFlipbookWidth,

                height: calculatedFlipbookHeight,

                autoCenter: true,

                acceleration: true,

                display: '${displayMode}',

                elevation: 50,

                gradients: true,

                pages: numPages,

                shadows: false

            });

        });

        `;

        }

        

        // Function to download the flipbook as a ZIP of images and assets

        async function downloadFlipbookAsZip(

            pageImages,

            originalFilename,

            numPages,

            calculatedFlipbookWidth,

            calculatedFlipbookHeight,

            styleCssContent,

            turnMinJsContent,

            jqueryMinJsContent,

            flipbookCoreJsContent, // This file's own content for reference

            geometricBluePngBlob // The image blob

        ) {

            const zip = new JSZip();

            const folderName = originalFilename.replace(/\.pdf$/i, '_interactive_flipbook');

        

            const rootFolder = zip.folder(folderName);

            const cssFolder = rootFolder.folder('css');

            const jsFolder = rootFolder.folder('js');

            const pagesFolder = rootFolder.folder('pages');

            const assetsFolder = rootFolder.folder('assets'); // New assets folder

        

            // Add CSS file

            cssFolder.file('style.css', styleCssContent);

        

            // Add JS files

            jsFolder.file('jquery.min.1.7.js', jqueryMinJsContent);

            jsFolder.file('turn.min.js', turnMinJsContent);

        

            // Generate the custom flipbook JS for the downloaded version

            const customFlipbookJsContent = generateOfflineJs(numPages, calculatedFlipbookWidth, calculatedFlipbookHeight);

            jsFolder.file('flipbook_bundle.js', customFlipbookJsContent);

        

            // Generate the custom HTML for the downloaded version

            const customHtmlContent = generateOfflineHtml(numPages, calculatedFlipbookWidth, calculatedFlipbookHeight);

            rootFolder.file('index.html', customHtmlContent);

        

            // Add the GEOMETRIC BLUE.png to assets

            assetsFolder.file('GEOMETRIC BLUE.png', geometricBluePngBlob);

        

            // Add each page image to the zip file

            pageImages.forEach((img, index) => {

                const dataURL = img.src;

                const base64Data = dataURL.split(',')[1];

                pagesFolder.file(`page_${index + 1}.jpeg`, base64Data, { base64: true });

            });

        

            const blob = await zip.generateAsync({ type: "blob" });

        

            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');

            a.href = url;

            a.download = `${folderName}.zip`;

            document.body.appendChild(a);

            a.click();

            document.body.removeChild(a);

            URL.revokeObjectURL(url);

        }


