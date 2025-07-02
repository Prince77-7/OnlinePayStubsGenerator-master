// Pay Stub Generator with Sophisticated Pay Cycle Management
// Enhanced with automatic mathematics and YTD calculations

$(document).ready(function () {
	console.log('Enhanced Pay Stub Generator: JavaScript loaded successfully');

	// Global variables for pay cycle management
	let generatedPaystubs = [];
	let currentCycleData = null;

	// Initialize date inputs with current date
	$('#cycle-start-date').val(new Date().toISOString().split('T')[0]);

	// Pay frequency change handler
	$('#pay-frequency').on('change', function() {
		const frequency = $(this).val();
		if (frequency === 'single') {
			$('#num-periods-group').hide();
			$('#generateCycleBtn').hide();
			$('#previewDatesBtn').hide();
			$('#pay-dates-preview').hide();
			$('#randomization-section').hide();
		} else {
			$('#num-periods-group').show();
			$('#generateCycleBtn').show();
			$('#previewDatesBtn').show();
			$('#randomization-section').show();
		}
	});

	// Preview pay dates functionality
	$('#previewDatesBtn').on('click', function() {
		const frequency = $('#pay-frequency').val();
		const startDate = new Date($('#cycle-start-date').val());
		const numPeriods = parseInt($('#num-periods').val()) || 4;

		if (!startDate || startDate.toString() === 'Invalid Date') {
			alert('Please select a valid start date');
			return;
		}

		const payDates = generatePayDates(frequency, startDate, numPeriods);
		displayPayDatesPreview(payDates);
	});

	// Generate pay cycle functionality
	$('#generateCycleBtn').on('click', function() {
		generatePayCycle();
	});

	// Clear results functionality
	$('#clearResultsBtn').on('click', function() {
		$('#paystubs-container').removeClass('show');
		$('#paystubs-results').empty();
		$('#generateAllPDFsBtn').hide();
		$('#clearResultsBtn').hide();
		generatedPaystubs = [];
	});

	// Generate all PDFs functionality
	$('#generateAllPDFsBtn').on('click', function() {
		generateAllPDFs();
	});

	// Sophisticated pay date calculation
	function generatePayDates(frequency, startDate, numPeriods) {
		const payDates = [];
		let currentDate = new Date(startDate);

		for (let i = 0; i < numPeriods; i++) {
			let payDate;

			switch (frequency) {
				case 'weekly':
					// Every Friday
					payDate = new Date(currentDate);
					const dayOfWeek = payDate.getDay();
					const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
					payDate.setDate(payDate.getDate() + daysUntilFriday);
					currentDate = new Date(payDate);
					currentDate.setDate(currentDate.getDate() + 7);
					break;

				case 'bi-weekly':
					// Every 2 weeks from start date
					payDate = new Date(currentDate);
					currentDate.setDate(currentDate.getDate() + 14);
					break;

				case 'semi-monthly':
					// 15th and last day of month
					const month = currentDate.getMonth();
					const year = currentDate.getFullYear();
					
					if (i % 2 === 0) {
						// 15th of the month
						payDate = new Date(year, month, 15);
					} else {
						// Last day of the month
						payDate = new Date(year, month + 1, 0);
						currentDate = new Date(year, month + 1, 1); // Move to next month
					}
					break;

				default:
					payDate = new Date(currentDate);
					currentDate.setDate(currentDate.getDate() + 7);
			}

			payDates.push({
				date: new Date(payDate),
				periodNumber: i + 1,
				payPeriodStart: calculatePayPeriodStart(payDate, frequency),
				payPeriodEnd: calculatePayPeriodEnd(payDate, frequency)
			});
		}

		return payDates;
	}

	// Calculate pay period start date
	function calculatePayPeriodStart(payDate, frequency) {
		const startDate = new Date(payDate);
		
		switch (frequency) {
			case 'weekly':
				startDate.setDate(startDate.getDate() - 6); // 7 days back
				break;
			case 'bi-weekly':
				startDate.setDate(startDate.getDate() - 13); // 14 days back
				break;
			case 'semi-monthly':
				if (payDate.getDate() === 15) {
					startDate.setDate(1); // 1st of month
				} else {
					startDate.setDate(16); // 16th of month
				}
				break;
		}

		return startDate;
	}

	// Calculate pay period end date
	function calculatePayPeriodEnd(payDate, frequency) {
		const endDate = new Date(payDate);
		
		switch (frequency) {
			case 'weekly':
			case 'bi-weekly':
				endDate.setDate(endDate.getDate() - 1); // Day before pay date
				break;
			case 'semi-monthly':
				if (payDate.getDate() === 15) {
					endDate.setDate(15); // 15th
				} else {
					// Last day of month
					endDate.setDate(new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate());
				}
				break;
		}

		return endDate;
	}

	// Display pay dates preview
	function displayPayDatesPreview(payDates) {
		const datesList = $('#dates-list');
		datesList.empty();

		payDates.forEach((payInfo, index) => {
			const dateItem = $(`
				<div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: var(--bg-primary); border-radius: 8px; margin-bottom: 8px; border: 1px solid var(--border-light);">
					<div>
						<strong>Period ${payInfo.periodNumber}:</strong> 
						${formatDate(payInfo.payPeriodStart)} - ${formatDate(payInfo.payPeriodEnd)}
					</div>
					<div style="color: var(--accent-blue); font-weight: bold;">
						Pay Date: ${formatDate(payInfo.date)}
					</div>
				</div>
			`);
			datesList.append(dateItem);
		});

		$('#pay-dates-preview').show();
	}

	// Generate complete pay cycle
	function generatePayCycle() {
		const frequency = $('#pay-frequency').val();
		const startDate = new Date($('#cycle-start-date').val());
		const numPeriods = parseInt($('#num-periods').val()) || 4;

		if (!startDate || startDate.toString() === 'Invalid Date') {
			alert('Please select a valid start date');
			return;
		}

		// Collect base form data
		const baseData = collectFormData();
		if (!validateBaseData(baseData)) {
			alert('Please fill out all required fields in the form');
			return;
		}

		// Generate pay dates
		const payDates = generatePayDates(frequency, startDate, numPeriods);

		// Calculate sophisticated mathematics for each pay period
		generatedPaystubs = calculateSophisticatedMath(baseData, payDates);

		// Display generated paystubs
		displayGeneratedPaystubs();

		// Show additional controls
		$('#generateAllPDFsBtn').show();
		$('#clearResultsBtn').show();
	}

	// Apply realistic variations to amounts
	function applyVariation(baseAmount, variationPercent, seed = 0.5) {
		if (!$('#enable-randomization').is(':checked') || variationPercent <= 0) {
			return baseAmount;
		}
		
		// Create truly bidirectional variation between -variationPercent and +variationPercent
		// Convert seed to range -1 to +1, then scale by variation percentage
		const normalizedSeed = (seed - 0.5) * 2; // Range: -1 to +1
		const variation = normalizedSeed * (variationPercent / 100);
		const adjustedAmount = baseAmount * (1 + variation);
		
		// Debug logging
		console.log(`Variation Debug: base=${baseAmount}, seed=${seed.toFixed(3)}, normalized=${normalizedSeed.toFixed(3)}, variation=${(variation*100).toFixed(1)}%, result=${adjustedAmount.toFixed(2)}`);
		
		// Round to 2 decimal places
		return Math.round(adjustedAmount * 100) / 100;
	}

	// Generate variation seed based on period index - improved for better distribution
	function getVariationSeed(periodIndex, fieldType) {
		// Use different approach for truly random-like distribution
		// This creates a pseudo-random number between 0 and 1
		const x = Math.sin(periodIndex * 12.9898 + fieldType * 78.233) * 43758.5453;
		const seed = x - Math.floor(x);
		
		console.log(`Seed Debug: period=${periodIndex}, field=${fieldType}, seed=${seed.toFixed(3)}`);
		return seed;
	}

	// Sophisticated mathematical calculations with YTD accumulation and realistic variations
	function calculateSophisticatedMath(baseData, payDates) {
		const paystubs = [];
		
		// Get variation percentages from UI
		const earningsVariation = parseFloat($('#earnings-variation').val()) || 0;
		const taxVariation = parseFloat($('#tax-variation').val()) || 0;
		const deductionVariation = parseFloat($('#deduction-variation').val()) || 0;
		const hoursVariation = parseFloat($('#hours-variation').val()) || 0;
		
		// Starting YTD values
		let ytdGrossWages = parseFloat($('#ytd-start-gross').val()) || 0;
		let ytdFederalTax = 0;
		let ytdStateTax = 0;
		let ytdSocialSecurityTax = 0;
		let ytdMedicareTax = 0;
		let ytdTotalDeductions = 0;
		let ytdNetPay = parseFloat($('#ytd-start-net').val()) || 0;

		// Base amounts per period
		const baseBasicPay = parseFloat(baseData.basic_pay) || 0;
		const baseOvertimePay = parseFloat(baseData.overtime_pay) || 0;
		const baseBonusPay = parseFloat(baseData.bonus_pay) || 0;
		const baseAllowances = parseFloat(baseData.allowances) || 0;
		const baseOtherEarnings = parseFloat(baseData.other_earnings) || 0;
		const baseHoursWorked = parseFloat(baseData.hours_worked) || 80;
		const baseHourlyRate = parseFloat(baseData.hourly_rate) || 0;
		
		// Base deductions
		const baseHealthInsurance = parseFloat(baseData.health_insurance) || 0;
		const baseDentalInsurance = parseFloat(baseData.dental_insurance) || 0;
		const baseRetirement401k = parseFloat(baseData.retirement_401k) || 0;
		const baseOtherDeductions = parseFloat(baseData.other_deductions) || 0;

		payDates.forEach((payInfo, index) => {
			// Apply variations for this period
			const periodHours = applyVariation(baseHoursWorked, hoursVariation, getVariationSeed(index, 1));
			const periodBasicPay = baseHourlyRate > 0 ? periodHours * baseHourlyRate : 
								  applyVariation(baseBasicPay, earningsVariation, getVariationSeed(index, 2));
			const periodOvertimePay = applyVariation(baseOvertimePay, earningsVariation, getVariationSeed(index, 3));
			const periodBonusPay = applyVariation(baseBonusPay, earningsVariation, getVariationSeed(index, 4));
			const periodAllowances = applyVariation(baseAllowances, earningsVariation, getVariationSeed(index, 5));
			const periodOtherEarnings = applyVariation(baseOtherEarnings, earningsVariation, getVariationSeed(index, 6));
			
			// Calculate total earnings for this period
			const grossEarnings = periodBasicPay + periodOvertimePay + periodBonusPay + periodAllowances + periodOtherEarnings;
			
			// Calculate taxes with variations
			const baseFederalTax = parseFloat(baseData.federal_tax) || (grossEarnings * 0.12);
			const baseStateTax = parseFloat(baseData.state_tax) || (grossEarnings * 0.06);
			const baseSocialSecurityTax = parseFloat(baseData.social_security_tax) || (grossEarnings * 0.062);
			const baseMedicareTax = parseFloat(baseData.medicare_tax) || (grossEarnings * 0.0145);
			
			const periodFederalTax = applyVariation(baseFederalTax, taxVariation, getVariationSeed(index, 7));
			const periodStateTax = applyVariation(baseStateTax, taxVariation, getVariationSeed(index, 8));
			const periodSocialSecurityTax = applyVariation(baseSocialSecurityTax, taxVariation, getVariationSeed(index, 9));
			const periodMedicareTax = applyVariation(baseMedicareTax, taxVariation, getVariationSeed(index, 10));
			
			// Calculate deductions with variations
			const periodHealthInsurance = applyVariation(baseHealthInsurance, deductionVariation, getVariationSeed(index, 11));
			const periodDentalInsurance = applyVariation(baseDentalInsurance, deductionVariation, getVariationSeed(index, 12));
			const periodRetirement401k = applyVariation(baseRetirement401k, deductionVariation, getVariationSeed(index, 13));
			const periodOtherDeductions = applyVariation(baseOtherDeductions, deductionVariation, getVariationSeed(index, 14));
			const totalDeductions = periodHealthInsurance + periodDentalInsurance + periodRetirement401k + periodOtherDeductions;
			
			// Calculate net pay for this period
			const totalTaxes = periodFederalTax + periodStateTax + periodSocialSecurityTax + periodMedicareTax;
			const netPay = grossEarnings - totalTaxes - totalDeductions;

			// Update YTD values
			ytdGrossWages += grossEarnings;
			ytdFederalTax += periodFederalTax;
			ytdStateTax += periodStateTax;
			ytdSocialSecurityTax += periodSocialSecurityTax;
			ytdMedicareTax += periodMedicareTax;
			ytdTotalDeductions += totalDeductions;
			ytdNetPay += netPay;

			// Generate check number if base provided
			let checkNumber = baseData.check_number || '1001';
			if (index > 0 && /^\d+$/.test(checkNumber)) {
				checkNumber = String(parseInt(checkNumber) + index);
			}

			const paystub = {
				...baseData,
				pay_period_start: formatDate(payInfo.payPeriodStart),
				pay_period_end: formatDate(payInfo.payPeriodEnd),
				pay_date: formatDate(payInfo.date),
				check_number: checkNumber,
				hours_worked: periodHours.toFixed(2),
				// Current period amounts (with variations)
				basic_pay: periodBasicPay,
				overtime_pay: periodOvertimePay,
				bonus_pay: periodBonusPay,
				allowances: periodAllowances,
				other_earnings: periodOtherEarnings,
				federal_tax: periodFederalTax,
				state_tax: periodStateTax,
				social_security_tax: periodSocialSecurityTax,
				medicare_tax: periodMedicareTax,
				health_insurance: periodHealthInsurance,
				dental_insurance: periodDentalInsurance,
				retirement_401k: periodRetirement401k,
				other_deductions: periodOtherDeductions,
				// YTD amounts
				gross_wages_ytd: ytdGrossWages,
				federal_tax_ytd: ytdFederalTax,
				state_tax_ytd: ytdStateTax,
				social_security_tax_ytd: ytdSocialSecurityTax,
				medicare_tax_ytd: ytdMedicareTax,
				total_deductions_ytd: ytdTotalDeductions,
				net_pay_ytd: ytdNetPay,
				// Calculated fields
				gross_earnings_current: grossEarnings,
				total_taxes_current: totalTaxes,
				total_deductions_current: totalDeductions,
				net_pay_current: netPay,
				period_number: payInfo.periodNumber,
				period_start: payInfo.payPeriodStart,
				period_end: payInfo.payPeriodEnd
			};

			paystubs.push(paystub);
		});

		return paystubs;
	}

	// Display generated paystubs in the UI
	function displayGeneratedPaystubs() {
		const container = $('#paystubs-results');
		container.empty();

		generatedPaystubs.forEach((paystub, index) => {
			const paystubHtml = generatePaystubHTML(paystub, index);
			container.append(paystubHtml);
		});

		$('#paystubs-container').addClass('show');
		
		// Scroll to results
		$('#paystubs-container')[0].scrollIntoView({ behavior: 'smooth' });
	}

	// Validate civilian base data
	function validateBaseData(data) {
		const required = ['company_name', 'employee_name', 'basic_pay', 'hourly_rate'];
		return required.every(field => data[field] && data[field].toString().trim() !== '');
	}

	// Generate HTML for sophisticated individual paystub preview
	function generatePaystubHTML(data, index) {
		// Calculate total earnings
		const totalEarnings = (
			parseFloat(data.basic_pay || 0) +
			parseFloat(data.overtime_pay || 0) +
			parseFloat(data.bonus_pay || 0) +
			parseFloat(data.allowances || 0) +
			parseFloat(data.other_earnings || 0)
		);

		// Calculate total taxes
		const totalTaxes = (
			parseFloat(data.federal_tax || 0) +
			parseFloat(data.state_tax || 0) +
			parseFloat(data.social_security_tax || 0) +
			parseFloat(data.medicare_tax || 0)
		);

		// Calculate total deductions
		const totalDeductions = (
			parseFloat(data.health_insurance || 0) +
			parseFloat(data.dental_insurance || 0) +
			parseFloat(data.retirement_401k || 0) +
			parseFloat(data.other_deductions || 0)
		);

		const netPay = totalEarnings - totalTaxes - totalDeductions;

		return $(`
			<div class="paystub-result" data-index="${index}">
				<div class="paystub-period-indicator">Period ${data.period_number || '1'}</div>
				
				<div class="paystub-header">
					<div class="paystub-company-name">${data.company_name || 'Company Name'}</div>
					<div class="paystub-company-address">${data.company_address || 'Company Address'}, ${data.company_city_state_zip || 'City, State ZIP'}</div>
				</div>

				<div class="paystub-info-section">
					<div class="paystub-info-left">
						<div class="paystub-info-row">
							<span class="paystub-label">Employee:</span>
							<span class="paystub-value">${data.employee_name || 'N/A'}</span>
						</div>
						<div class="paystub-info-row">
							<span class="paystub-label">Employee ID:</span>
							<span class="paystub-value">${data.employee_id || 'N/A'}</span>
						</div>
						<div class="paystub-info-row">
							<span class="paystub-label">Department:</span>
							<span class="paystub-value">${data.department || 'N/A'}</span>
						</div>
						<div class="paystub-info-row">
							<span class="paystub-label">Position:</span>
							<span class="paystub-value">${data.position || 'N/A'}</span>
						</div>
					</div>
					<div class="paystub-info-right">
						<div class="paystub-info-row">
							<span class="paystub-label">Pay Period:</span>
							<span class="paystub-value">${data.pay_period_start || 'N/A'} - ${data.pay_period_end || 'N/A'}</span>
						</div>
						<div class="paystub-info-row">
							<span class="paystub-label">Pay Date:</span>
							<span class="paystub-value">${data.pay_date || 'N/A'}</span>
						</div>
						<div class="paystub-info-row">
							<span class="paystub-label">Check Number:</span>
							<span class="paystub-value">${data.check_number || 'N/A'}</span>
						</div>
						<div class="paystub-info-row">
							<span class="paystub-label">Hours Worked:</span>
							<span class="paystub-value">${data.hours_worked || 'N/A'}</span>
						</div>
					</div>
				</div>

				<div class="paystub-earnings-deductions">
					<div class="paystub-earnings">
						<div class="paystub-section-title">EARNINGS</div>
						<div class="paystub-amount-row">
							<span>Regular Pay</span>
							<span>$${parseFloat(data.basic_pay || 0).toFixed(2)}</span>
						</div>
						<div class="paystub-amount-row">
							<span>Overtime Pay</span>
							<span>$${parseFloat(data.overtime_pay || 0).toFixed(2)}</span>
						</div>
						<div class="paystub-amount-row">
							<span>Bonus/Commission</span>
							<span>$${parseFloat(data.bonus_pay || 0).toFixed(2)}</span>
						</div>
						<div class="paystub-amount-row">
							<span>Other Earnings</span>
							<span>$${(parseFloat(data.allowances || 0) + parseFloat(data.other_earnings || 0)).toFixed(2)}</span>
						</div>
						<div class="paystub-amount-row">
							<span>GROSS EARNINGS:</span>
							<span>$${totalEarnings.toFixed(2)}</span>
						</div>
					</div>

					<div class="paystub-deductions">
						<div class="paystub-section-title">TAXES & DEDUCTIONS</div>
						<div class="paystub-amount-row">
							<span>Federal Tax</span>
							<span>$${parseFloat(data.federal_tax || 0).toFixed(2)}</span>
						</div>
						<div class="paystub-amount-row">
							<span>State Tax</span>
							<span>$${parseFloat(data.state_tax || 0).toFixed(2)}</span>
						</div>
						<div class="paystub-amount-row">
							<span>Social Security</span>
							<span>$${parseFloat(data.social_security_tax || 0).toFixed(2)}</span>
						</div>
						<div class="paystub-amount-row">
							<span>Medicare/Medical Tax</span>
							<span>$${parseFloat(data.medicare_tax || 0).toFixed(2)}</span>
						</div>
						<div class="paystub-amount-row">
							<span>Benefits/Deductions</span>
							<span>$${totalDeductions.toFixed(2)}</span>
						</div>
						<div class="paystub-amount-row">
							<span>TOTAL DEDUCTIONS:</span>
							<span>$${(totalTaxes + totalDeductions).toFixed(2)}</span>
						</div>
					</div>
				</div>

				<div class="paystub-net-pay">
					NET PAY: $${netPay.toFixed(2)}
				</div>

				<div class="paystub-ytd-section">
					<div class="paystub-section-title">YEAR-TO-DATE TOTALS</div>
					<div class="paystub-ytd-row">
						<span>YTD Gross:</span>
						<span>$${parseFloat(data.gross_wages_ytd || totalEarnings).toFixed(2)}</span>
					</div>
					<div class="paystub-ytd-row">
						<span>YTD Taxes:</span>
						<span>$${(parseFloat(data.federal_tax_ytd || 0) + parseFloat(data.state_tax_ytd || 0) + parseFloat(data.social_security_tax_ytd || 0) + parseFloat(data.medicare_tax_ytd || 0)).toFixed(2)}</span>
					</div>
					<div class="paystub-ytd-row">
						<span>YTD Net:</span>
						<span>$${parseFloat(data.net_pay_ytd || netPay).toFixed(2)}</span>
					</div>
				</div>

				<div style="text-align: center; margin-top: 20px;">
					<button class="btn btn-primary" onclick="generateSinglePDF(${index})">
						📄 Download PDF
					</button>
				</div>
			</div>
		`);
	}

	// Generate all PDFs at once
	async function generateAllPDFs() {
		if (generatedPaystubs.length === 0) {
			alert('No paystubs to generate PDFs for');
			return;
		}

		const button = $('#generateAllPDFsBtn');
		const originalText = button.html();
		button.html('<span class="loading"></span> Generating PDFs...');
		button.prop('disabled', true);

		try {
			const response = await fetch('http://localhost:3000/render-multiple-pdfs', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ paystubs: generatedPaystubs })
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			window.open(url, '_blank');
			
		} catch (err) {
			console.error('Error generating PDFs:', err);
			alert('Failed to generate PDFs: ' + err.message);
		} finally {
			button.html(originalText);
			button.prop('disabled', false);
		}
	}

	// Generate single PDF (called from individual paystub buttons)
	window.generateSinglePDF = async function(index) {
		if (!generatedPaystubs[index]) {
			alert('Paystub data not found');
			return;
		}

		try {
			const response = await fetch('http://localhost:3000/render-pdf', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(generatedPaystubs[index])
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			window.open(url, '_blank');
			
		} catch (err) {
			console.error('Error generating PDF:', err);
			alert('Failed to generate PDF: ' + err.message);
		}
	};

	// Collect form data
	function collectFormData() {
		const formData = {};
		$('#quickDataForm').find('input, select, textarea').each(function() {
			const name = $(this).attr('name');
			const value = $(this).val();
			if (name && value) {
				formData[name] = value;
			}
		});
		return formData;
	}

	// Utility functions
	function formatDate(date) {
		return new Intl.DateTimeFormat('en-US', { 
			month: '2-digit', 
			day: '2-digit', 
			year: 'numeric' 
		}).format(date);
	}

	// Legacy functions for backward compatibility
	function computeQuickTotals() {
		const federal = parseFloat($('[name="federal_tax"]').val()) || 0;
		const state = parseFloat($('[name="state_tax"]').val()) || 0;
		const social = parseFloat($('[name="social_security_dectuctions"]').val()) || 0;
		const other = parseFloat($('[name="other_deductions"]').val()) || 0;
		const gross = parseFloat($('[name="gross_pay"]').val()) || 0;

		const current = federal + state + social + other;
		$('#current_deductions').val(current.toFixed(2));

		const net = gross - current;
		$('#net_pay_amount').val(net.toFixed(2));
		
		console.log('Totals calculated:', { federal, state, social, other, gross, current, net });
	}

	// Event handlers for backward compatibility
	$('#calculateBtn').on('click', function () {
		console.log('Calculate button clicked');
		computeQuickTotals();
	});

	$('#importJsonBtn').on('click', function () {
		console.log('Import JSON button clicked');
		let text = $('#jsonInput').val().trim();
		if (!text) {
			console.log('No JSON text provided');
			return;
		}

		if (text.startsWith('data')) {
			const braceIndex = text.indexOf('{');
			if (braceIndex !== -1) {
				text = text.substring(braceIndex);
			}
		}

		if (text.endsWith(';')) {
			text = text.slice(0, -1);
		}

		let jsonData;
		try {
			jsonData = JSON.parse(text);
			console.log('JSON parsed successfully:', jsonData);
		} catch (err) {
			console.error('JSON parse error:', err);
			alert('Invalid JSON: ' + err.message);
			return;
		}

		let fieldsPopulated = 0;
		Object.keys(jsonData).forEach(function (key) {
			const $field = $('#quickDataForm').find('[name="' + key + '"]');
			if ($field.length) {
				$field.val(jsonData[key]);
				fieldsPopulated++;
			}
		});
		
		console.log(`Fields populated: ${fieldsPopulated}`);
		computeQuickTotals();
	});

	$('#copySampleBtn').on('click', function () {
		console.log('Copy sample button clicked');
		const sampleText = $('#sampleJson').text().trim();
		$('#jsonInput').val(sampleText);
		console.log('Sample JSON copied to editor');
	});

	// Handle form submission for single pay stub generation
	$('#quickDataForm').on('submit', function(e) {
		e.preventDefault();
		console.log('Generate pay stub form submitted');
		
		const formData = collectFormData();
		console.log('Form data collected:', formData);

		if (Object.keys(formData).length === 0) {
			alert('Please fill out some form fields before generating a pay stub.');
			return;
		}

		fetch('http://localhost:2323/render-pdf', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(formData)
		})
		.then(response => {
			console.log('PDF response received:', response.status);
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			return response.blob();
		})
		.then(blob => {
			console.log('PDF blob received, size:', blob.size);
			const url = URL.createObjectURL(blob);
			window.open(url, '_blank');
			console.log('PDF opened in new window');
		})
		.catch(err => {
			console.error('Error generating pay stub:', err);
			alert('Failed to generate pay stub: ' + err.message);
		});
	});

	// Collapsible section toggling
	console.log('Setting up collapsible sections');
	
	$('.form-section').first().addClass('open');
	$('.form-section.open .form-content').show();

	$(document).on('click', '.section-title', function(e) {
		e.preventDefault();
		console.log('Section title clicked');
		
		const $section = $(this).closest('.form-section');
		const $arrow = $section.find('.collapse-arrow');
		const $content = $section.find('.form-content');
		
		if ($section.hasClass('open')) {
			$section.removeClass('open');
			$arrow.removeClass('expanded');
			$content.slideUp(300);
		} else {
			$section.addClass('open');
			$arrow.addClass('expanded');
			$content.slideDown(300);
		}
	});

	// Initialize with civilian sample data
	const sophisticatedSampleData = {
		"company_name": "ACME Corporation",
		"company_address": "123 Business Way",
		"company_city_state_zip": "New York, NY 10001",
		"company_phone": "Phone: (555) 123-4567",
		"company_ein": "12-3456789",
		"employee_name": "JOHN DOE",
		"employee_address": "456 Elm Street",
		"employee_city_state_zip": "New York, NY 10002",
		"employee_id": "EMP001",
		"employee_ssn": "XXX-XX-1234",
		"department": "Engineering",
		"position": "Software Developer",
		"pay_period_start": "2024-07-01",
		"pay_period_end": "2024-07-15",
		"pay_date": "2024-07-20",
		"check_number": "001234",
		"pay_frequency": "Bi-Weekly",
		"hours_worked": "80.00",
		"hourly_rate": "35.00",
		"federal_filing_status": "Single",
		"federal_allowances": 1,
		"federal_additional": 0.00,
		"state_abbreviation": "NY",
		"state_filing_status": "Single",
		"state_allowances": 1,
		"state_additional": 0.00,
		"basic_pay": 2800.00,
		"overtime_pay": 0.00,
		"bonus_pay": 0.00,
		"allowances": 0.00,
		"other_earnings": 0.00,
		"federal_tax": 336.00,
		"state_tax": 168.00,
		"social_security_tax": 173.60,
		"medicare_tax": 40.60,
		"health_insurance": 150.00,
		"dental_insurance": 25.00,
		"retirement_401k": 140.00,
		"other_deductions": 0.00,
		"employer_health_contribution": 300.00,
		"employer_401k_match": 70.00,
		"other_benefits": 0.00,
		"account_type": "Direct Deposit",
		"account_number": "****1234",
		"footer_message": "This statement is for informational purposes only. Please retain for your records."
	};

	// Update sample JSON display
	$('#sampleJson').text(JSON.stringify(sophisticatedSampleData, null, 2));
});
