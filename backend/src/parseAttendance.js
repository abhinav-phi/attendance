import * as cheerio from 'cheerio';

/**
 * Decode HTML entities like &amp; &lt; &gt; etc.
 */
function decodeHtmlEntities(text) {
    if (!text) return text;
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');
}

/**
 * Convert date string like "Jan-02" to a sortable Date object
 * @param {string} dateStr - Date string in format "Mon-DD"
 * @param {string} year - Academic year like "2025-26"
 * @returns {Date} Date object for sorting
 */
function parseDateString(dateStr, year) {
    const months = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    
    const match = dateStr.match(/^([A-Za-z]{3})-?(\d{1,2})$/);
    if (!match) return new Date(0);
    
    const monthName = match[1];
    const day = parseInt(match[2]);
    const monthIndex = months[monthName];
    
    if (monthIndex === undefined) return new Date(0);
    
    // Determine the year based on month and academic year
    // Academic year 2025-26 means Jul 2025 - Jun 2026
    // Jan-Jun belong to the second year (2026), Jul-Dec to the first year (2025)
    let actualYear;
    if (year) {
        const yearParts = year.split('-');
        const firstYear = parseInt('20' + yearParts[0].slice(-2));
        const secondYear = firstYear + 1;
        
        // Jan-Jun belong to the second year, Jul-Dec to the first year
        if (monthIndex >= 0 && monthIndex <= 5) {
            actualYear = secondYear;
        } else {
            actualYear = firstYear;
        }
    } else {
        actualYear = new Date().getFullYear();
    }
    
    return new Date(actualYear, monthIndex, day);
}

/**
 * Parse attendance HTML from NSUT/IMS portal
 * @param {string} html - Raw HTML response from attendance page
 * @returns {object} Parsed attendance data
 */
export function parseAttendance(html) {
    const $ = cheerio.load(html);
    
    const result = {
        studentInfo: {
            name: '',
            rollNo: '',
            semester: '',
            year: ''
        },
        subjects: [], // Array of { code, name }
        dailyAttendance: [], // Array of { date, month, records: { subjectCode: value } }
        summary: {
            totalClasses: {},
            totalAbsent: {},
            totalPresent: {},
            overallClasses: {},
            overallAbsent: {},
            overallPresent: {},
            overallPercentage: {}
        },
        legend: {}
    };
    
    // Find all attendance tables (there can be multiple - one per month)
    const tables = $('table');
    let attendanceTables = [];
    let subjectCodes = [];
    
    // Find all tables that contain attendance data (they have 'Days' header and subject codes)
    tables.each((i, table) => {
        const headerRows = $(table).find('tr.plum_head');
        headerRows.each((j, row) => {
            const cells = $(row).find('td');
            if (cells.length > 2) {
                const firstCellText = $(cells[0]).text().trim();
                if (firstCellText === 'Days') {
                    attendanceTables.push($(table));
                    // Extract subject codes (skip first 'Days' column) - only once
                    if (subjectCodes.length === 0) {
                        cells.each((k, cell) => {
                            if (k > 0) {
                                const code = $(cell).text().trim();
                                if (code && code.match(/^[A-Z]{2,}/)) {
                                    subjectCodes.push(code);
                                }
                            }
                        });
                    }
                }
            }
        });
    });
    
    if (attendanceTables.length === 0 || subjectCodes.length === 0) {
        // Fallback: find table with subject code pattern in header
        tables.each((i, table) => {
            const rows = $(table).find('tr');
            rows.each((j, row) => {
                const cells = $(row).find('td, th');
                const texts = [];
                cells.each((k, cell) => texts.push($(cell).text().trim()));
                
                // Check if this row has subject codes (pattern: letters + numbers)
                const hasSubjectCodes = texts.some(t => t.match(/^[A-Z]{2,}\d{3,}/));
                if (hasSubjectCodes && texts.includes('Days')) {
                    attendanceTables.push($(table));
                    if (subjectCodes.length === 0) {
                        subjectCodes = texts.filter(t => t.match(/^[A-Z]{2,}\d{3,}/));
                    }
                }
            });
        });
    }
        
    // Extract student info from header (use first attendance table or fall back to first plum_head)
    const infoRow = attendanceTables.length > 0 ? attendanceTables[0].find('tr.plum_head').first() : $('tr.plum_head').first();
    const infoText = infoRow.text();
    
    // Parse: "Name: SWASTIK (2024UCS1695), Semester : 4"
    const nameMatch = infoText.match(/Name:\s*([^(]+)\s*\(([^)]+)\)/i);
    if (nameMatch) {
        result.studentInfo.name = nameMatch[1].trim();
        result.studentInfo.rollNo = nameMatch[2].trim();
    }
    
    const semMatch = infoText.match(/Semester\s*:\s*(\d+)/i);
    if (semMatch) {
        result.studentInfo.semester = semMatch[1];
    }
    
    // Get year from select
    const yearSelect = $('select[name="year"]');
    const selectedYear = yearSelect.find('option[selected]').val() || yearSelect.find('option').eq(1).val();
    result.studentInfo.year = selectedYear || '2025-26';
    
    // Extract subject full names from the legend table at the bottom
    const subjectNameMap = {};
    const legendTable = tables.last();
    const legendText = legendTable.find('td').first().text();
    
    // Parse: "COCSC401-Theory of Automata & Formal Languages\nCOCSC402-Software Engineering\n..."
    const subjectLines = legendText.split(/\n|<br>/);
    subjectLines.forEach(line => {
        const match = line.match(/^([A-Z]{2,}\d{3,})-(.+)$/);
        if (match) {
            subjectNameMap[match[1].trim()] = decodeHtmlEntities(match[2].trim());
        }
    });
    
    // Also try parsing from HTML with <br> tags
    const legendHtml = legendTable.find('td').first().html() || '';
    const brSplit = legendHtml.split(/<br\s*\/?>/i);
    brSplit.forEach(line => {
        const cleanLine = line.replace(/<[^>]+>/g, '').trim();
        const match = cleanLine.match(/^([A-Z]{2,}\d{3,})-(.+)$/);
        if (match) {
            subjectNameMap[match[1].trim()] = decodeHtmlEntities(match[2].trim());
        }
    });
    
    // console.log('Subject name map:', subjectNameMap);
    
    // Build subjects array with codes and names
    result.subjects = subjectCodes.map(code => ({
        code,
        name: decodeHtmlEntities(subjectNameMap[code]) || code
    }));
    
    // Parse legend abbreviations (CR, CS, GH, etc.)
    const legendCell = legendTable.find('td').last();
    const legendItems = (legendCell.html() || '').split(/<br\s*\/?>/i);
    legendItems.forEach(item => {
        const cleanItem = item.replace(/<[^>]+>/g, '').trim();
        const match = cleanItem.match(/^([A-Z]{2})-(.+)$/);
        if (match) {
            result.legend[match[1]] = match[2].trim();
        }
    });
    
    // Parse daily attendance and summary rows from ALL attendance tables
    attendanceTables.forEach((table) => {
        const rows = table.find('tr');
        
        rows.each((i, row) => {
            const cells = $(row).find('td, th');
            if (cells.length < 2) return;
            
            const firstCell = $(cells[0]).text().trim();
            const firstCellLower = firstCell.toLowerCase();
            
            // Skip header rows
            if (firstCell === 'Days' || firstCellLower.includes('name:')) return;
            
            // Extract values for each subject
            const values = {};
            cells.each((j, cell) => {
                if (j > 0 && j <= subjectCodes.length) {
                    const val = $(cell).text().trim();
                    values[subjectCodes[j - 1]] = val;
                }
            });
            
            // Check what type of row this is
            if (firstCell.match(/^[A-Z][a-z]{2}-\d{1,2}$/)) {
                // Date row (e.g., "Jan-02", "Feb-01")
                // Extract month from the date
                const monthMatch = firstCell.match(/^([A-Za-z]{3})/);
                const month = monthMatch ? monthMatch[1] : '';
                
                result.dailyAttendance.push({
                    date: firstCell,
                    month: month,
                    records: values
                });
            } else if (firstCellLower.includes('total classes')) {
                // Merge with existing (in case of multiple tables)
                Object.assign(result.summary.totalClasses, values);
            } else if (firstCellLower.includes('total') && firstCellLower.includes('absent') && !firstCellLower.includes('overall')) {
                Object.assign(result.summary.totalAbsent, values);
            } else if (firstCellLower.includes('total') && firstCellLower.includes('present') && !firstCellLower.includes('overall')) {
                Object.assign(result.summary.totalPresent, values);
            } else if (firstCellLower.includes('overall class')) {
                // Overall values from the last table are the final ones
                result.summary.overallClasses = values;
            } else if (firstCellLower.includes('overall') && firstCellLower.includes('absent')) {
                result.summary.overallAbsent = values;
            } else if (firstCellLower.includes('overall') && firstCellLower.includes('present') && !firstCellLower.includes('%')) {
                result.summary.overallPresent = values;
            } else if (firstCellLower.includes('overall') && firstCellLower.includes('%')) {
                // Overall percentage row
                cells.each((j, cell) => {
                    if (j > 0 && j <= subjectCodes.length) {
                        const val = $(cell).text().trim();
                        values[subjectCodes[j - 1]] = val;
                    }
                });
                result.summary.overallPercentage = values;
            }
        });
    });
    
    // Sort daily attendance by date (latest first)
    result.dailyAttendance.sort((a, b) => {
        const dateA = parseDateString(a.date, result.studentInfo.year);
        const dateB = parseDateString(b.date, result.studentInfo.year);
        return dateB.getTime() - dateA.getTime(); // Latest first
    });
    
    // Calculate overall attendance percentage
    let totalClasses = 0;
    let totalPresent = 0;
    
    Object.values(result.summary.overallClasses).forEach(v => {
        const num = parseInt(v) || 0;
        totalClasses += num;
    });
    
    Object.values(result.summary.overallPresent).forEach(v => {
        const num = parseInt(v) || 0;
        totalPresent += num;
    });
    
    result.overallStats = {
        totalClasses,
        totalPresent,
        totalAbsent: totalClasses - totalPresent,
        percentage: totalClasses > 0 ? ((totalPresent / totalClasses) * 100).toFixed(2) + '%' : 'N/A'
    };
    
    
    return result;
}

export default parseAttendance;
