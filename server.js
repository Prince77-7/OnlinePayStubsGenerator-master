const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Serve static UI (index.html, css, js) from project root
app.use(express.static(__dirname));

// Fallback root -> index.html
app.get('/', (req,res)=>{
  res.sendFile(require('path').join(__dirname, 'index.html'));
});

// --- HTML Pay Stub Template Builder ---
function buildPayStubHtml(data) {
  // Calculate totals dynamically
  const totalEarnings = (
    parseFloat(data.basic_pay || 0) +
    parseFloat(data.overtime_pay || 0) +
    parseFloat(data.bonus_pay || 0) +
    parseFloat(data.commission || 0) +
    parseFloat(data.allowances || 0) +
    parseFloat(data.other_earnings || 0)
  );

  const totalTaxes = (
    parseFloat(data.federal_tax || 0) +
    parseFloat(data.state_tax || 0) +
    parseFloat(data.social_security_tax || 0) +
    parseFloat(data.medicare_tax || 0)
  );

  const totalDeductions = (
    parseFloat(data.health_insurance || 0) +
    parseFloat(data.dental_insurance || 0) +
    parseFloat(data.retirement_401k || 0) +
    parseFloat(data.other_deductions || 0)
  );

  const netPay = totalEarnings - totalTaxes - totalDeductions;

  return `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>Pay Stub</title>
    <style>
      body { 
        font-family: 'Courier New', monospace; 
        margin: 0; 
        padding: 20px; 
        color: #000;
        background: #fff;
        font-size: 10pt;
        line-height: 1.2;
      }
      .paystub-container {
        max-width: 8.5in;
        margin: 0 auto;
        border: 2px solid #000;
        padding: 0;
        background: #fff;
      }
      
      /* Header Section */
      .header-section {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 10px 15px;
        border-bottom: 1px solid #000;
      }
      .company-info {
        flex: 1;
        font-size: 9pt;
        line-height: 1.1;
      }
      .document-title-box {
        border: 2px solid #000;
        padding: 8px 12px;
        text-align: center;
        font-weight: bold;
        font-size: 11pt;
        max-width: 300px;
        margin-left: 20px;
      }
      
      /* Employer Info Bar */
      .employer-info-bar {
        border-top: 1px solid #000;
        border-bottom: 1px solid #000;
        padding: 6px 15px;
        background: #fff;
        font-size: 9pt;
      }
      
      /* Main Grid */
      .main-grid {
        display: flex;
        flex-direction: column;
      }
      
      /* Employee and Pay Info Row */
      .employee-pay-row {
        display: flex;
        border-bottom: 1px solid #000;
      }
      .employee-section {
        flex: 35%;
        padding: 10px 15px;
        border-right: 1px solid #000;
      }
      .pay-period-section {
        flex: 35%;
        padding: 10px 15px;
        border-right: 1px solid #000;
      }
      .tax-data-section {
        flex: 30%;
        padding: 10px 15px;
      }
      
      /* Tables */
      .earnings-taxes-row {
        display: flex;
        border-bottom: 1px solid #000;
      }
      .earnings-section {
        flex: 50%;
        border-right: 1px solid #000;
      }
      .taxes-section {
        flex: 50%;
      }
      
      .deductions-benefits-row {
        display: flex;
        border-bottom: 2px solid #000;
      }
      .deductions-section {
        flex: 50%;
        border-right: 1px solid #000;
      }
      .benefits-section {
        flex: 50%;
      }
      
      /* Table Styling */
      .pay-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 9pt;
      }
      .pay-table th {
        background: #000;
        color: #fff;
        padding: 4px 8px;
        text-align: center;
        font-weight: bold;
        border: 1px solid #000;
      }
      .pay-table td {
        padding: 3px 8px;
        border: 1px solid #000;
        vertical-align: top;
      }
      .amount-right {
        text-align: right;
      }
      .amount-center {
        text-align: center;
      }
      
      /* Tax Data Table */
      .tax-data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 8pt;
        margin-top: 10px;
      }
      .tax-data-table th {
        background: #000;
        color: #fff;
        padding: 2px 4px;
        text-align: center;
        font-weight: bold;
        border: 1px solid #000;
        font-size: 7pt;
      }
      .tax-data-table td {
        padding: 2px 4px;
        border: 1px solid #000;
        text-align: center;
        font-size: 8pt;
      }
      
      /* Wage Summary */
      .wage-summary {
        border: 1px solid #000;
        margin: 0;
      }
      .wage-summary-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 9pt;
      }
      .wage-summary-table th {
        background: #000;
        color: #fff;
        padding: 4px;
        text-align: center;
        font-weight: bold;
        border: 1px solid #000;
        font-size: 8pt;
      }
      .wage-summary-table td {
        padding: 4px;
        border: 1px solid #000;
        text-align: center;
      }
      
      /* Pay Distribution */
      .pay-distribution-row {
        display: flex;
        margin: 10px 0;
        gap: 10px;
        padding: 0 15px;
      }
      .pay-distribution-box {
        flex: 100%;
        border: 1px solid #000;
      }
      
      .box-title {
        background: #000;
        color: #fff;
        padding: 4px;
        text-align: center;
        font-weight: bold;
        font-size: 9pt;
      }
      .box-content {
        padding: 8px;
        font-size: 8pt;
      }
      
      /* Footer */
      .footer-note {
        text-align: center;
        padding: 8px;
        font-size: 8pt;
        border-top: 1px solid #000;
        font-style: italic;
      }
      
      /* Field styling */
      .field-group {
        margin-bottom: 4px;
        font-size: 8pt;
      }
      .field-label {
        font-weight: bold;
        display: inline-block;
        width: 80px;
      }
      .field-value {
        display: inline-block;
      }
      
      /* Print adjustments */
      @media print {
        body { margin: 0; padding: 0; }
        .paystub-container { 
          max-width: none; 
          width: 100%; 
          border: 1px solid #000;
        }
      }
    </style>
  </head>
  <body>
    <div class="paystub-container">
      <!-- Header Section -->
      <div class="header-section">
        <div class="company-info">
          ${data.company_name || 'Company Name'}<br>
          ${data.company_address || 'Company Address'}<br>
          ${data.company_phone || 'Phone: (555) 123-4567'}
        </div>
        <div class="document-title-box">
          PAYROLL STATEMENT<br>
          Statement of Earnings and Deductions
        </div>
      </div>

      <!-- Employer Info Bar -->
      <div class="employer-info-bar">
        ${data.company_name || 'COMPANY NAME'} &nbsp;&nbsp;&nbsp;
        ${data.company_address || 'COMPANY ADDRESS'} &nbsp;&nbsp;&nbsp;
        ${data.company_city_state_zip || 'CITY, STATE ZIP'} &nbsp;&nbsp;&nbsp;
        EIN: ${data.company_ein || 'XX-XXXXXXX'}
      </div>

      <!-- Main Grid -->
      <div class="main-grid">
        <!-- Employee and Pay Info Row -->
        <div class="employee-pay-row">
          <div class="employee-section">
            <div class="field-group">
              <strong>${data.employee_name || 'EMPLOYEE NAME'}</strong><br>
              ${data.employee_address || 'Employee Address'}<br>
              ${data.employee_city_state_zip || 'City, State ZIP'}
            </div>
            <br>
            <div class="field-group">
              <span class="field-label">Employee ID:</span>
              <span class="field-value">${data.employee_id || 'EMP001'}</span>
            </div>
            <div class="field-group">
              <span class="field-label">SSN:</span>
              <span class="field-value">${data.employee_ssn || 'XXX-XX-1234'}</span>
            </div>
            <div class="field-group">
              <span class="field-label">Department:</span>
              <span class="field-value">${data.department || 'General'}</span>
            </div>
            <div class="field-group">
              <span class="field-label">Position:</span>
              <span class="field-value">${data.position || 'Employee'}</span>
            </div>
          </div>
          
          <div class="pay-period-section">
            <div class="field-group">
              <span class="field-label">Pay Period:</span>
              <span class="field-value">${data.pay_period_start || ''} - ${data.pay_period_end || ''}</span>
            </div>
            <div class="field-group">
              <span class="field-label">Pay Date:</span>
              <span class="field-value">${data.pay_date || ''}</span>
            </div>
            <div class="field-group">
              <span class="field-label">Check Number:</span>
              <span class="field-value">${data.check_number || ''}</span>
            </div>
            <div class="field-group">
              <span class="field-label">Pay Frequency:</span>
              <span class="field-value">${data.pay_frequency || 'Bi-Weekly'}</span>
            </div>
            <div class="field-group">
              <span class="field-label">Hours Worked:</span>
              <span class="field-value">${data.hours_worked || '80.00'}</span>
            </div>
            <div class="field-group">
              <span class="field-label">Hourly Rate:</span>
              <span class="field-value">$${parseFloat(data.hourly_rate || 0).toFixed(2)}</span>
            </div>
          </div>
          
          <div class="tax-data-section">
            <table class="tax-data-table">
              <thead>
                <tr>
                  <th>TAX DATA</th>
                  <th>Federal</th>
                  <th>${data.state_abbreviation || 'State'}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Filing Status</td>
                  <td>${data.federal_filing_status || 'Single'}</td>
                  <td>${data.state_filing_status || 'Single'}</td>
                </tr>
                <tr>
                  <td>Allowances</td>
                  <td>${data.federal_allowances || '0'}</td>
                  <td>${data.state_allowances || '0'}</td>
                </tr>
                <tr>
                  <td>Additional $</td>
                  <td>$${parseFloat(data.federal_additional || 0).toFixed(2)}</td>
                  <td>$${parseFloat(data.state_additional || 0).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Earnings and Taxes Row -->
        <div class="earnings-taxes-row">
          <div class="earnings-section">
            <table class="pay-table">
              <thead>
                <tr>
                  <th colspan="2">EARNINGS</th>
                </tr>
                <tr>
                  <th>Description</th>
                  <th>Current</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Regular Pay</td>
                  <td class="amount-right">$${parseFloat(data.basic_pay || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Overtime Pay</td>
                  <td class="amount-right">$${parseFloat(data.overtime_pay || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Bonus/Commission</td>
                  <td class="amount-right">$${parseFloat(data.bonus_pay || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Allowances</td>
                  <td class="amount-right">$${parseFloat(data.allowances || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Other Earnings</td>
                  <td class="amount-right">$${parseFloat(data.other_earnings || 0).toFixed(2)}</td>
                </tr>
                <tr style="background: #f0f0f0; font-weight: bold;">
                  <td>TOTAL:</td>
                  <td class="amount-right">$${totalEarnings.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="taxes-section">
            <table class="pay-table">
              <thead>
                <tr>
                  <th colspan="3">TAXES</th>
                </tr>
                <tr>
                  <th>Description</th>
                  <th>Current</th>
                  <th>YTD</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Federal Tax</td>
                  <td class="amount-right">$${parseFloat(data.federal_tax || 0).toFixed(2)}</td>
                  <td class="amount-right">$${parseFloat(data.federal_tax_ytd || data.federal_tax || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>State Tax</td>
                  <td class="amount-right">$${parseFloat(data.state_tax || 0).toFixed(2)}</td>
                  <td class="amount-right">$${parseFloat(data.state_tax_ytd || data.state_tax || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Social Security</td>
                  <td class="amount-right">$${parseFloat(data.social_security_tax || 0).toFixed(2)}</td>
                  <td class="amount-right">$${parseFloat(data.social_security_tax_ytd || data.social_security_tax || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Medicare/Medical Tax</td>
                  <td class="amount-right">$${parseFloat(data.medicare_tax || 0).toFixed(2)}</td>
                  <td class="amount-right">$${parseFloat(data.medicare_tax_ytd || data.medicare_tax || 0).toFixed(2)}</td>
                </tr>
                <tr style="background: #f0f0f0; font-weight: bold;">
                  <td>TOTAL:</td>
                  <td class="amount-right">$${totalTaxes.toFixed(2)}</td>
                  <td class="amount-right">$${(
                    parseFloat(data.federal_tax_ytd || data.federal_tax || 0) +
                    parseFloat(data.state_tax_ytd || data.state_tax || 0) +
                    parseFloat(data.social_security_tax_ytd || data.social_security_tax || 0) +
                    parseFloat(data.medicare_tax_ytd || data.medicare_tax || 0)
                  ).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Deductions and Benefits Row -->
        <div class="deductions-benefits-row">
          <div class="deductions-section">
            <table class="pay-table">
              <thead>
                <tr>
                  <th colspan="2">DEDUCTIONS</th>
                </tr>
                <tr>
                  <th>Description</th>
                  <th>Current</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Blue Cross Blue Shield</td>
                  <td class="amount-right">$${parseFloat(data.health_insurance || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Dental Insurance</td>
                  <td class="amount-right">$${parseFloat(data.dental_insurance || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>401(k) Contribution</td>
                  <td class="amount-right">$${parseFloat(data.retirement_401k || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Other Deductions</td>
                  <td class="amount-right">$${parseFloat(data.other_deductions || 0).toFixed(2)}</td>
                </tr>
                <tr style="background: #f0f0f0; font-weight: bold;">
                  <td>TOTAL:</td>
                  <td class="amount-right">$${totalDeductions.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="benefits-section">
            <table class="pay-table">
              <thead>
                <tr>
                  <th colspan="2">EMPLOYER CONTRIBUTIONS</th>
                </tr>
                <tr>
                  <th>Description</th>
                  <th>Current</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>BCBS Premium Match</td>
                  <td class="amount-right">$${parseFloat(data.employer_health_contribution || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>401(k) Match</td>
                  <td class="amount-right">$${parseFloat(data.employer_401k_match || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Other Benefits</td>
                  <td class="amount-right">$${parseFloat(data.other_benefits || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td></td>
                  <td></td>
                </tr>
                <tr style="background: #f0f0f0; font-weight: bold;">
                  <td>TOTAL:</td>
                  <td class="amount-right">$${(
                    parseFloat(data.employer_health_contribution || 0) +
                    parseFloat(data.employer_401k_match || 0) +
                    parseFloat(data.other_benefits || 0)
                  ).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Wage Summary -->
      <div class="wage-summary">
        <table class="wage-summary-table">
          <thead>
            <tr>
              <th></th>
              <th>GROSS WAGES</th>
              <th>TAXABLE WAGES</th>
              <th>TOTAL TAXES</th>
              <th>TOTAL DEDUCTIONS</th>
              <th>NET PAY</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Current</strong></td>
              <td>$${totalEarnings.toFixed(2)}</td>
              <td>$${totalEarnings.toFixed(2)}</td>
              <td>$${totalTaxes.toFixed(2)}</td>
              <td>$${totalDeductions.toFixed(2)}</td>
              <td>$${netPay.toFixed(2)}</td>
            </tr>
            <tr>
              <td><strong>YTD</strong></td>
              <td>$${parseFloat(data.gross_wages_ytd || totalEarnings).toFixed(2)}</td>
              <td>$${parseFloat(data.taxable_wages_ytd || totalEarnings).toFixed(2)}</td>
              <td>$${(
                parseFloat(data.federal_tax_ytd || data.federal_tax || 0) +
                parseFloat(data.state_tax_ytd || data.state_tax || 0) +
                parseFloat(data.social_security_tax_ytd || data.social_security_tax || 0) +
                parseFloat(data.medicare_tax_ytd || data.medicare_tax || 0)
              ).toFixed(2)}</td>
              <td>$${parseFloat(data.total_deductions_ytd || totalDeductions).toFixed(2)}</td>
              <td>$${parseFloat(data.net_pay_ytd || netPay).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pay Distribution -->
      <div class="pay-distribution-row">
        <div class="pay-distribution-box">
          <div class="box-title">NET PAY DISTRIBUTION</div>
          <div class="box-content">
            <table style="width: 100%; border-collapse: collapse; font-size: 8pt;">
              <thead>
                <tr>
                  <th style="border: 1px solid #000; padding: 2px; background: #000; color: #fff;">Account Type</th>
                  <th style="border: 1px solid #000; padding: 2px; background: #000; color: #fff;">Account Number</th>
                  <th style="border: 1px solid #000; padding: 2px; background: #000; color: #fff;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="border: 1px solid #000; padding: 2px; text-align: center;">${data.account_type || 'Direct Deposit'}</td>
                  <td style="border: 1px solid #000; padding: 2px; text-align: center;">${data.account_number || '****1234'}</td>
                  <td style="border: 1px solid #000; padding: 2px; text-align: right;">$${netPay.toFixed(2)}</td>
                </tr>
                <tr style="background: #f0f0f0; font-weight: bold;">
                  <td colspan="2" style="border: 1px solid #000; padding: 2px; text-align: center;">TOTAL NET PAY:</td>
                  <td style="border: 1px solid #000; padding: 2px; text-align: right;">$${netPay.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer-note">
        ${data.footer_message || 'This statement is for informational purposes only. Please retain for your records.'}
      </div>
    </div>
  </body>
  </html>`;
}

/**
 * POST /render-pdf
 * Body: JSON matching the pay-stub fields.
 * Returns: PDF file of the rendered pay stub.
 */
app.post('/render-pdf', async (req, res) => {
  const payload = req.body || {};
  const html = buildPayStubHtml(payload);

  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--disable-gpu',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding'
    ],
    headless: 'new'
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename=paystub.pdf',
      'Content-Length': pdfBuffer.length
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF generation failed:', err);
    res.status(500).send('PDF generation failed');
  } finally {
    await browser.close();
  }
});

/**
 * POST /render-multiple-pdfs
 * Body: { paystubs: Array of pay-stub data objects }
 * Returns: Combined PDF file with all pay stubs.
 */
app.post('/render-multiple-pdfs', async (req, res) => {
  const payload = req.body || {};
  const paystubs = payload.paystubs || [];

  if (!Array.isArray(paystubs) || paystubs.length === 0) {
    return res.status(400).send('No paystubs provided');
  }

  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--disable-gpu',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding'
    ],
    headless: 'new'
  });

  try {
    const page = await browser.newPage();
    
    // Generate sophisticated HTML for each paystub and combine them
    const paystubHtmls = paystubs.map(data => {
      const html = buildPayStubHtml(data);
      // Extract just the paystub container content, removing the outer html/body tags
      const bodyMatch = html.match(/<body[^>]*>(.*)<\/body>/s);
      return bodyMatch ? bodyMatch[1] : html;
    });

    // Combine all paystubs into one HTML document with sophisticated styling
    const combinedHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Pay Stubs</title>
        <style>
          body { 
            font-family: 'Courier New', monospace; 
            margin: 0; 
            padding: 0; 
            color: #000;
            background: #fff;
            font-size: 10pt;
            line-height: 1.2;
          }
          .paystub-container {
            max-width: 8.5in;
            margin: 0 auto 20px auto;
            border: 2px solid #000;
            padding: 0;
            background: #fff;
            page-break-after: always;
            page-break-inside: avoid;
          }
          .paystub-container:last-child {
            page-break-after: auto;
            margin-bottom: 0;
          }
          
          /* Include all the sophisticated styling from buildPayStubHtml */
          .header-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 10px 15px;
            border-bottom: 1px solid #000;
          }
          .issuing-agency {
            flex: 1;
            font-size: 9pt;
            line-height: 1.1;
          }
          .document-title-box {
            border: 2px solid #000;
            padding: 8px 12px;
            text-align: center;
            font-weight: bold;
            font-size: 11pt;
            max-width: 300px;
            margin-left: 20px;
          }
          .employer-info-bar {
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            padding: 6px 15px;
            background: #fff;
            font-size: 9pt;
          }
          .main-grid {
            display: flex;
            flex-direction: column;
          }
          .employee-pay-row {
            display: flex;
            border-bottom: 1px solid #000;
          }
          .employee-section {
            flex: 35%;
            padding: 10px 15px;
            border-right: 1px solid #000;
          }
          .pay-period-section {
            flex: 35%;
            padding: 10px 15px;
            border-right: 1px solid #000;
          }
          .tax-data-section {
            flex: 30%;
            padding: 10px 15px;
          }
          .earnings-taxes-row {
            display: flex;
            border-bottom: 1px solid #000;
          }
          .earnings-section {
            flex: 50%;
            border-right: 1px solid #000;
          }
          .taxes-section {
            flex: 50%;
          }
          .deductions-benefits-row {
            display: flex;
            border-bottom: 2px solid #000;
          }
          .deductions-section {
            flex: 50%;
            border-right: 1px solid #000;
          }
          .benefits-section {
            flex: 50%;
          }
          .pay-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
          }
          .pay-table th {
            background: #000;
            color: #fff;
            padding: 4px 8px;
            text-align: center;
            font-weight: bold;
            border: 1px solid #000;
          }
          .pay-table td {
            padding: 3px 8px;
            border: 1px solid #000;
            vertical-align: top;
          }
          .amount-right {
            text-align: right;
          }
          .amount-center {
            text-align: center;
          }
          .tax-data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8pt;
            margin-top: 10px;
          }
          .tax-data-table th {
            background: #000;
            color: #fff;
            padding: 2px 4px;
            text-align: center;
            font-weight: bold;
            border: 1px solid #000;
            font-size: 7pt;
          }
          .tax-data-table td {
            padding: 2px 4px;
            border: 1px solid #000;
            text-align: center;
            font-size: 8pt;
          }
          .wage-summary {
            border: 1px solid #000;
            margin: 0;
          }
          .wage-summary-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
          }
          .wage-summary-table th {
            background: #000;
            color: #fff;
            padding: 4px;
            text-align: center;
            font-weight: bold;
            border: 1px solid #000;
            font-size: 8pt;
          }
          .wage-summary-table td {
            padding: 4px;
            border: 1px solid #000;
            text-align: center;
          }
          .pay-distribution-row {
            display: flex;
            margin: 10px 0;
            gap: 10px;
            padding: 0 15px;
          }
          .pay-distribution-box {
            flex: 100%;
            border: 1px solid #000;
          }
          .box-title {
            background: #000;
            color: #fff;
            padding: 4px;
            text-align: center;
            font-weight: bold;
            font-size: 9pt;
          }
          .box-content {
            padding: 8px;
            font-size: 8pt;
          }
          .key-value-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
            font-size: 8pt;
          }
          .key-value-row:last-child {
            margin-bottom: 0;
          }
          .remarks-section {
            padding: 10px 15px;
            font-size: 8pt;
            line-height: 1.3;
          }
          .remarks-title {
            font-weight: bold;
            margin-bottom: 5px;
          }
          .remarks-content {
            margin-left: 10px;
          }
          .footer-note {
            text-align: center;
            padding: 8px;
            font-size: 8pt;
            border-top: 1px solid #000;
            font-style: italic;
          }
          .field-group {
            margin-bottom: 4px;
            font-size: 8pt;
          }
          .field-label {
            font-weight: bold;
            display: inline-block;
            width: 80px;
          }
          .field-value {
            display: inline-block;
          }
          
          /* Print adjustments */
          @media print {
            body { margin: 0; padding: 0; }
            .paystub-container { 
              max-width: none; 
              width: 100%; 
              border: 1px solid #000;
            }
          }
        </style>
      </head>
      <body>
        ${paystubHtmls.join('\n')}
      </body>
      </html>
    `;

    await page.setContent(combinedHtml, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename=paystubs.pdf',
      'Content-Length': pdfBuffer.length
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Multiple PDF generation failed:', err);
    res.status(500).send('Multiple PDF generation failed');
  } finally {
    await browser.close();
  }
});

const PORT = process.env.PORT || 3003;
const server = app.listen(PORT, () => {
  console.log(`Pay Stub PDF server listening on port ${PORT}`);
});

// Graceful shutdown for container environment
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
}); 