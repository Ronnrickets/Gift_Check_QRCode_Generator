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

const downloadPdfBtn = document.getElementById('download-pdf-btn');

// --- EVENT LISTENER FOR PDF DOWNLOAD ---
downloadPdfBtn.addEventListener('click', () => {
    // Check if any QR codes have been generated
    if (dataCountSpan.textContent === '0' || qrCodesOutput.children.length === 0) {
        alert("Please import data and generate QR codes first.");
        return;
    }

    downloadPdfBtn.textContent = "Generating PDF... Please Wait...";
    downloadPdfBtn.disabled = true;

    // Use html2canvas to render the entire QR code output area as a single image
    html2canvas(qrCodesOutput, {
        scale: 2, // Increase scale for higher resolution in the PDF
        allowTaint: true,
        useCORS: true,
    }).then(canvas => {
        // Get the image data
        const imgData = canvas.toDataURL('image/png');
        
        // Initialize jsPDF
        // 'p' = portrait, 'mm' = units (millimeters), 'a4' = page size
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // Calculate image dimensions for a good fit on the PDF page
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        // Check if the content is too tall for one page
        let heightLeft = imgHeight;
        let position = 0;
        
        // Add the image to the PDF
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;

        // If content is longer than one page, add new pages
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;
        }

        // Save the PDF file
        pdf.save('generatedQrCode.pdf');

        // Reset button state
        downloadPdfBtn.textContent = "⬇️ Download All QR Codes as PDF";
        downloadPdfBtn.disabled = false;
    });
});


// Call this function once on page load to initialize the screen (clears table/output)
document.addEventListener('DOMContentLoaded', () => {
    generateQRCodes([]);
});

// Initial call to clear screen and show count as 0 on page load
generateQRCodes([]);