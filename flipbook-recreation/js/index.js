// DOM Elements
const uploadForm = document.getElementById("upload-form");
const pdfFileInput = document.getElementById("pdf-file");
const uploadBtn = document.getElementById("upload-btn");
const btnText = document.querySelector(".btn-text");
const loadingSpinner = document.getElementById("loading-spinner");
const instructions = document.getElementById("instructions");
const primaryText = document.getElementById("primary-text");
const secondaryText = document.getElementById("secondary-text");
const fileNameDisplay = document.getElementById("file-name");

// File validation
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

// Event Listeners
uploadForm.addEventListener("submit", handleUpload);
pdfFileInput.addEventListener("change", handleFileSelect);

// Drag and drop event listeners
const uploadLabel = document.querySelector(".upload-label");
uploadLabel.addEventListener("dragover", handleDragOver);
uploadLabel.addEventListener("dragleave", handleDragLeave);
uploadLabel.addEventListener("drop", handleDrop);

// Handle file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.size > MAX_FILE_SIZE) {
            alert("File size exceeds 100MB limit. Please choose a smaller PDF.");
            pdfFileInput.value = "";
            return;
        }
        if (file.type !== "application/pdf") {
            alert("Please select a valid PDF file.");
            pdfFileInput.value = "";
            return;
        }
        // Display the file name
        displayFileName(file.name);
    }
}

// Function to display the selected file name
function displayFileName(fileName) {
    primaryText.style.display = "none";
    secondaryText.style.display = "none";
    fileNameDisplay.textContent = fileName;
    fileNameDisplay.style.display = "block";
}

// Drag and drop handlers
function handleDragOver(event) {
    event.preventDefault();
    uploadLabel.classList.add("dragover");
}

function handleDragLeave(event) {
    event.preventDefault();
    uploadLabel.classList.remove("dragover");
}

function handleDrop(event) {
    event.preventDefault();
    uploadLabel.classList.remove("dragover");

    const files = event.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type !== "application/pdf") {
            alert("Please drop a valid PDF file.");
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            alert("File size exceeds 100MB limit. Please choose a smaller PDF.");
            return;
        }
        // Set the file to the input
        const dt = new DataTransfer();
        dt.items.add(file);
        pdfFileInput.files = dt.files;
        // Display the file name
        displayFileName(file.name);
    }
}

// Handle upload
async function handleUpload(event) {
    event.preventDefault();

    const file = pdfFileInput.files[0];
    if (!file) {
        alert("Please select a PDF file.");
        return;
    }

    setLoadingState(true);

    try {
        // Only upload to server, do not use IndexedDB/localStorage
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('backend-php/upload.php', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        const data = await response.json();
        if (response.ok && data.link) {
            setSuccessState(data.link);
            // Show a popup/alert for success
            alert('Flipbook uploaded and generated successfully!');
        } else {
            throw new Error(data.message || 'Upload failed');
        }
    } catch (error) {
        console.error("Upload error:", error);
        alert("An error occurred while uploading the file. Please try again.\n" + error.message);
        setLoadingState(false);
    }
}

// Utility functions
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
    });
}

function setLoadingState(isLoading) {
    uploadBtn.disabled = isLoading;
    loadingSpinner.style.display = isLoading ? "block" : "none";
    btnText.textContent = isLoading ? "Processing..." : "Upload & Create Flipbook";
}

function setSuccessState(flipbookUrl) {
    setLoadingState(false);
    btnText.textContent = "Flipbook Created!";
    uploadBtn.classList.add('success'); // Add a class for success state styling

    // Hide the upload label (choose PDF file)
    document.querySelector('.upload-label').style.display = 'none';

    instructions.innerHTML = `
        <div class="success-message">
            <div class="instruction-item">
                <i class="fas fa-check-circle"></i>
                <span>Flipbook Created! <a href="#" onclick="viewFlipbook('${flipbookUrl}')" style="color: #007bff; text-decoration: none; font-weight: bold;">Click here to View Flipbook</a></span>
            </div>
        </div>
    `;
}

function viewFlipbook(url) {
    window.open(url, '_blank');
}


// Utility functions
function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsArrayBuffer(file);
    });
}