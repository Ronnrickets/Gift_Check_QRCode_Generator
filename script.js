const fileInput = document.getElementById('file-input');
const importStatus = document.getElementById('import-status');
const qrCodesOutput = document.getElementById('qr-codes-output');
const dataCountSpan = document.getElementById('data-count');

// --- EVENT LISTENER FOR FILE IMPORT ---
fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) {
        importStatus.textContent = "Please select a file.";
        importStatus.style.color = 'red';
        return;
    }

    // Use FileReader to read the contents of the file
    const reader = new FileReader();
    reader.onload = function(e) {
        const fileContent = e.target.result;
        
        // Process the content to create the data list
        const importedDataList = processFileContent(fileContent);
        
        // Generate the QR codes based on the new list
        generateQRCodes(importedDataList);
        
        importStatus.textContent = `Successfully imported ${importedDataList.length} items.`;
        importStatus.style.color = 'green';
    };
    reader.onerror = function() {
        importStatus.textContent = "Error reading file!";
        importStatus.style.color = 'red';
    };
    
    // Read the file as text
    reader.readAsText(file);
});

/**
 * Parses the raw file content (from Notepad/Excel) into a clean array of strings.
 * Assumes each item is separated by a new line.
 * @param {string} content - The raw text content of the file.
 * @returns {Array<string>} - An array of cleaned data values.
 */
function processFileContent(content) {
    // Split content by new lines, filter out empty/whitespace lines, and trim
    const dataArray = content
        .split(/[\r\n]+/) // Split by carriage return or newline
        .map(line => line.trim())
        .filter(line => line.length > 0); // Remove empty lines
        
    return dataArray;
}

/**
 * Generates table rows and QR codes from a given data array.
 * @param {Array<string>} dataList - The array of values to encode.
 */
function generateQRCodes(dataList) {
    // Clear previous content
    qrCodesOutput.innerHTML = '';
    
    // Update the count display
    dataCountSpan.textContent = dataList.length;

    dataList.forEach((valueToEncode, index) => {
        const itemNumber = index + 1;

        // --- 1. Populate the Table Row ---
        const newRow = document.createElement('tr');
        
        // Column 1: Item Number
        const numCell = document.createElement('td');
        numCell.textContent = itemNumber;
        newRow.appendChild(numCell);
        
        // Column 2: Value to Encode
        const valueCell = document.createElement('td');
        valueCell.textContent = valueToEncode;
        newRow.appendChild(valueCell);
        
        // Column 3: Placeholder for QR Code (in the table)
        const qrCell = document.createElement('td');
        const qrCodeInTableCell = document.createElement('div');
        qrCodeInTableCell.id = `qr-table-${itemNumber}`; 
        qrCell.appendChild(qrCodeInTableCell);
        newRow.appendChild(qrCell);
        


        // --- 2. Generate and Display the QR Code in the Table Cell ---
        new QRCode(qrCodeInTableCell, {
            text: valueToEncode,
            width: 70, 
            height: 70,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.L
        });


        // --- 3. Generate and Display the QR Code in the main Output Area ---
        const qrCodeItemDiv = document.createElement('div');
        qrCodeItemDiv.classList.add('qr-code-item');
        qrCodeItemDiv.classList.add('qr-code-border-style')
        
        // **MODIFIED LABEL:** Show only the item number and a truncated value 
        const displayValue = valueToEncode.length > 20 ? 
                             valueToEncode.substring(0, 17) + '...' : 
                             valueToEncode;
        
        qrCodeItemDiv.innerHTML = `<span>${displayValue}</span>`; 
        
        qrCodesOutput.appendChild(qrCodeItemDiv);
        
        new QRCode(qrCodeItemDiv, {
            text: valueToEncode,
            width: 70, 
            height: 70,
            colorDark : "#2c3e50", 
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.M 
        });
    });
}

// const downloadPdfBtn = document.getElementById('download-pdf-btn');

// // --- EVENT LISTENER FOR PDF DOWNLOAD ---
// downloadPdfBtn.addEventListener('click', () => {
//     // Check if any QR codes have been generated
//     if (dataCountSpan.textContent === '0' || qrCodesOutput.children.length === 0) {
//         alert("Please import data and generate QR codes first.");
//         return;
//     }

//     downloadPdfBtn.textContent = "Generating PDF... Please Wait...";
//     downloadPdfBtn.disabled = true;

//     // Use html2canvas to render the entire QR code output area as a single image
//     html2canvas(qrCodesOutput, {
//         scale: 2, // Increase scale for higher resolution in the PDF
//         allowTaint: true,
//         useCORS: true,
//     }).then(canvas => {
//         // Get the image data
//         const imgData = canvas.toDataURL('image/png');
        
//         // Initialize jsPDF
//         // 'p' = portrait, 'mm' = units (millimeters), 'a4' = page size
//         const { jsPDF } = window.jspdf;
//         const pdf = new jsPDF('p', 'mm', 'a4');

//         const pdfWidth = pdf.internal.pageSize.getWidth();
//         const pdfHeight = pdf.internal.pageSize.getHeight();
        
//         // Calculate image dimensions for a good fit on the PDF page
//         const imgProps = pdf.getImageProperties(imgData);
//         const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
//         // Check if the content is too tall for one page
//         let heightLeft = imgHeight;
//         let position = 0;
        
//         // Add the image to the PDF
//         pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
//         heightLeft -= pdfHeight;

//         // If content is longer than one page, add new pages
//         while (heightLeft >= 0) {
//             position = heightLeft - imgHeight;
//             pdf.addPage();
//             pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
//             heightLeft -= pdfHeight;
//         }

//         // Save the PDF file
//         const today = new Date();
//         const year = today.getFullYear();
//         const month = (today.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
//         const day = today.getDate().toString().padStart(2, '0');
//         const dateToday = `${year}${month}${day}`
//         pdf.save('generatedQrCode_' + dateToday + '.pdf');

//         // Reset button state
//         downloadPdfBtn.textContent = "⬇️ Download All QR Codes as PDF";
//         downloadPdfBtn.disabled = false;
//     });
// });

const downloadPdfBtn = document.getElementById('download-pdf-btn');
const ITEMS_PER_PAGE = 50; // 10 rows * 5 columns = 50 items

// --- EVENT LISTENER FOR PDF DOWNLOAD ---
downloadPdfBtn.addEventListener('click', async () => {
    // Check if any QR codes have been generated
    if (dataCountSpan.textContent === '0' || qrCodesOutput.children.length === 0) {
        alert("Please import data and generate QR codes first.");
        return;
    }

    downloadPdfBtn.textContent = "Generating PDF... Please Wait...";
    downloadPdfBtn.disabled = true;

    // --- 1. Split QR Code Items into Pages ---
    const qrCodeItems = Array.from(qrCodesOutput.children);
    const numPages = Math.ceil(qrCodeItems.length / ITEMS_PER_PAGE);
    
    // Initialize jsPDF
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 5;

    // Create a temporary element to hold one page of QR codes at a time
    const tempContainer = document.createElement('div');
    // Copy the original grid styling to the temporary container
    tempContainer.id = 'temp-qr-codes-page'; 
    tempContainer.style.width = qrCodesOutput.offsetWidth + 'px';
    tempContainer.style.margin = '0 auto';
    // Append to body but make it invisible so the user doesn't see page changes
    tempContainer.style.position = 'absolute';
    tempContainer.style.top = '-9999px';
    document.body.appendChild(tempContainer);

    // --- 2. Loop through pages and capture each one ---
    for (let i = 0; i < numPages; i++) {
        const start = i * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const pageItems = qrCodeItems.slice(start, end);

        // Clear and populate the temp container with the current page's items
        tempContainer.innerHTML = '';
        pageItems.forEach(item => tempContainer.appendChild(item.cloneNode(true)));
        const progress = Math.round(((i + 1) / numPages) * 100);
        downloadPdfBtn.textContent = `Generating PDF... ${progress}% Complete (Page ${i + 1} of ${numPages})`;
        // Wait for html2canvas to render the single page container
        const canvas = await html2canvas(tempContainer, {
            scale: 1.5, // Use scale 2 for high resolution
            allowTaint: true,
            useCORS: true,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        const imgProps = pdf.getImageProperties(imgData);
        
        // Calculate the height required for the image to fit the width
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

        // Add a new page only if it's not the very first page
        if (i > 0) {
            pdf.addPage();
        }

        // Add the image to the PDF, leaving a small margin
        const contentWidth = pdfWidth - (margin * 2);
        const contentHeight = (imgProps.height * contentWidth) / imgProps.width;

        pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, contentHeight);
    }
    
    // --- 3. Finalize and Clean Up ---
    pdf.save('generatedQrCode_' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '.pdf');

    // Remove the temporary element from the DOM
    document.body.removeChild(tempContainer);

    // Reset button state
    downloadPdfBtn.textContent = "⬇️ Download All QR Codes as PDF";
    downloadPdfBtn.disabled = false;
});


// Call this function once on page load to initialize the screen (clears table/output)
document.addEventListener('DOMContentLoaded', () => {
    generateQRCodes([]);
});

// Initial call to clear screen and show count as 0 on page load
generateQRCodes([]);
