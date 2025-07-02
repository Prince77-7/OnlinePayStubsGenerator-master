const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = 3003; // You can choose any available port

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase limit for potentially large HTML content
app.use(express.static(path.join(__dirname, '.'))); // Serve files from the root directory
app.use(express.static(path.join(__dirname, 'public'))); // Serve files from a public directory if you use one

// Serve the rendered statements directory statically
const outputDir = path.join(__dirname, 'rendered_statements');
app.use('/rendered_statements', express.static(outputDir));

// Ensure an output directory exists
if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir);
}

// Temporary storage for HTML content for PDF rendering
let pdfHtmlContent = '';

app.post('/render-page', async (req, res) => {
    const { htmlContent, pageIndex, month } = req.body;

    if (!htmlContent) {
        return res.status(400).send('No HTML content provided.');
    }

    let browser;
    try {
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'], // Required for some environments
            headless: true // Use headless mode for background rendering
        });
        const page = await browser.newPage();

        // Set the viewport size to match the statement page dimensions (approx)
        await page.setViewport({
            width: 800 + 60, // Statement page width + horizontal padding (20*2 + 30*2)/2? Adjust as needed
            height: 980 + 40, // Statement page min-height + vertical padding (20*2)? Adjust as needed
            deviceScaleFactor: 2, // Increase resolution for better image quality
        });

        // Set the page content and wait for it to load
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        // Optional: Wait for specific elements to be sure everything is rendered
        // await page.waitForSelector('.statement-page');

        // Find the element to screenshot (the statement page div)
        const statementPageElement = await page.$('.statement-page');

        if (!statementPageElement) {
             return res.status(500).send('Statement page element not found.');
        }

        // Define the output file name
        const fileName = `statement_${month.toLowerCase()}_page_${pageIndex + 1}.png`;
        const filePath = path.join(outputDir, fileName);

        // Take a screenshot of the specific element
        await statementPageElement.screenshot({
            path: filePath,
            omitBackground: false, // Include background
        });

        await browser.close();

        res.status(200).send({ message: 'Page rendered successfully', fileName: fileName });

    } catch (error) {
        console.error('Error rendering page:', error);
        if (browser) {
            await browser.close();
        }
        res.status(500).send('Error rendering page.');
    }
});

// Endpoint to receive HTML content and trigger PDF generation
app.post('/render-pdf', async (req, res) => {
    const { pagesHtml, paperSize, fontSize } = req.body;

    if (!pagesHtml || !Array.isArray(pagesHtml) || pagesHtml.length === 0) {
        return res.status(400).send('No HTML pages content provided.');
    }
    
    // Validate paperSize, default to A4
    const format = ['A4', 'Legal'].includes(paperSize) ? paperSize : 'A4';
    let width, minHeight;

    if (format === 'Legal') {
        width = '816px'; // 8.5" * 96 DPI
        minHeight = '1344px'; // 14" * 96 DPI
    } else { // A4
        width = '794px'; // 210mm to px at 96 DPI
        minHeight = '1123px'; // 297mm to px at 96 DPI
    }

    // --- Font Size Calculation ---
    const baseSize = parseFloat(fontSize) || 10; // Default to 10px if not provided
    const premierTextSize = baseSize * 1.4;
    const transactionTableSize = baseSize * 1.1;
    const footerSize = baseSize * 0.9;
    const condensedHeaderSize = baseSize * 0.95;
    const tablePadding = baseSize * 0.4;

    // Combine all page HTML content and add necessary structure for PDF
    // Store it temporarily to be served by the /pdf-content endpoint
     pdfHtmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>HSBC Premier Statements</title>
            <meta charset="UTF-8">
            <style>
                /* Essential styles for PDF/printing */
                body { font-family: Arial, sans-serif; color: #000; margin: 0; padding: 0; background-color: #fff; font-size: ${baseSize}px; }
                
                /* Base styles for statement page, adapted for print */
                .statement-page {
                    width: ${width};
                    min-height: ${minHeight};
                    margin: 0 auto; /* Center page content */
                    padding: 20px 30px; /* Use original HTML padding */
                    border: none; /* Remove border in print */
                    box-shadow: none; /* Remove shadow in print */
                    box-sizing: border-box;
                    display: flex; /* Use flexbox for sticky footer */
                    flex-direction: column; /* Arrange content vertically */
                    page-break-inside: avoid; /* Avoid breaking within a statement page */
                    page-break-after: always;
                }
                .statement-page:last-child { page-break-after: auto; } /* No break after the last page */

                .page-content {
                    flex-grow: 1; /* Allow content to push footer down */
                }
                
                /* Include all other necessary styles from the original index.html */
                .header-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                .header-table td { vertical-align: top; padding: 0; }
                .hsbc-logo { margin-bottom: 5px; }
                .address-block { line-height: 1.4; }
                .right-align { text-align: right; }
                .premier-text { font-size: ${premierTextSize}px; font-weight: bold; margin-bottom: 2px; }
                .account-bar { background-color: #f0f0f0; padding: 5px; margin-bottom: 15px; font-weight: bold; display: flex; justify-content: space-between; }
                .summary-table { width: 100%; margin-bottom: 15px; border-collapse: collapse; }
                .summary-table td { padding: 3px 0; }
                .summary-label { font-weight: normal; }
                .summary-value { text-align: right; font-weight: bold; }
                .transactions-table { width: 100%; border-collapse: collapse; font-size: ${transactionTableSize}px; }
                .transactions-table th, .transactions-table td { border-bottom: 1px solid #eee; padding: ${tablePadding}px; text-align: left; vertical-align: top; line-height: 1.25; }
                .transactions-table th { background-color: #f7f7f7; font-weight: bold; border-top: 2px solid #000; border-bottom: 2px solid #000; }
                .transactions-table td.amount { text-align: right; }
                .transactions-table td.balance { text-align: right; font-weight: bold; }
                .page-footer {
                    flex-shrink: 0; /* Prevent footer from shrinking */
                    width: 100%;
                    padding-top: 10px;
                    border-top: 1px solid #ccc;
                    display: flex;
                    justify-content: space-between;
                    font-size: ${footerSize}px;
                }
                .small-print { font-size: ${footerSize}px; margin-top: 15px;}
                .continued-text { text-align: right; font-style: italic; font-size: ${footerSize}px; margin-top: 10px; margin-bottom: 5px;}
                .page-header-condensed { padding: 10px 0; font-size: ${condensedHeaderSize}px; display: flex; justify-content: space-between; border-bottom: 1px solid #ccc; margin-bottom: 10px;}
                .page-header-condensed .left { text-align: left; }
                .page-header-condensed .right { text-align: right; }
                 /* Ensure image loads correctly, assumes it's in the same directory or served statically */
                 .hsbc-logo img { display: block; width: 180px; height: auto; }

                 /* Hide the print button in the PDF */
                button { display: none; }

            </style>
        </head>
        <body>
            ${pagesHtml.join('')}
        </body>
        </html>
    `;

    let browser;
    try {
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: true
        });
        const page = await browser.newPage();

        // Navigate to the temporary endpoint serving the HTML
        		await page.goto('http://localhost:3003/pdf-content', { waitUntil: 'networkidle0' });

        const pdfFileName = 'hsbc_statements_march_may_2025.pdf';
        const pdfFilePath = path.join(outputDir, pdfFileName);

        await page.pdf({
            path: pdfFilePath,
            format: format, // Use the dynamic format
            printBackground: true,
            margin: { // Set PDF document margins to 0
                top: '0in',
                right: '0in',
                bottom: '0in',
                left: '0in'
            },
            displayHeaderFooter: false,
            mediaType: 'print',
        });

        await browser.close();

        // Clear temporary content after PDF is generated
        pdfHtmlContent = '';

        res.status(200).send({ message: 'PDF generated successfully', fileName: pdfFileName });

    } catch (error) {
        console.error('Error generating PDF:', error);
        if (browser) {
            await browser.close();
        }
         // Clear temporary content on error as well
        pdfHtmlContent = '';
        res.status(500).send('Error generating PDF.');
    }
});

// Temporary endpoint to serve the HTML content for Puppeteer
app.get('/pdf-content', (req, res) => {
    if (pdfHtmlContent) {
        res.send(pdfHtmlContent);
    } else {
        res.status(404).send('HTML content not found. Please trigger PDF generation first.');
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
}); 