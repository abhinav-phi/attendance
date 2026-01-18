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
        dailyAttendance: [], // Array of { date, records: { subjectCode: value } }
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
    
    // Find the main attendance table (has subject codes in header)
    const tables = $('table');
    let mainTable = null;
    let subjectCodes = [];
    
    tables.each((i, table) => {
        const headerRow = $(table).find('tr.plum_head').eq(1); // Second plum_head row has subject codes
        if (headerRow.length) {
            const cells = headerRow.find('td');
            if (cells.length > 2) {
                const firstCellText = $(cells[0]).text().trim();
                if (firstCellText === 'Days') {
                    mainTable = $(table);
                    // Extract subject codes (skip first 'Days' column)
                    cells.each((j, cell) => {
                        if (j > 0) {
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
    
    if (!mainTable || subjectCodes.length === 0) {
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
                    mainTable = $(table);
                    subjectCodes = texts.filter(t => t.match(/^[A-Z]{2,}\d{3,}/));
                }
            });
        });
    }
    
    console.log('Found subject codes:', subjectCodes);
    
    // Extract student info from header
    const infoRow = mainTable ? mainTable.find('tr.plum_head').first() : $('tr.plum_head').first();
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
    
    console.log('Subject name map:', subjectNameMap);
    
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
    
    // Parse daily attendance and summary rows
    if (mainTable) {
        const rows = mainTable.find('tr');
        
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
                // Date row (e.g., "Jan-02")
                result.dailyAttendance.push({
                    date: firstCell,
                    records: values
                });
            } else if (firstCellLower.includes('total classes')) {
                result.summary.totalClasses = values;
            } else if (firstCellLower.includes('total') && firstCellLower.includes('absent') && !firstCellLower.includes('overall')) {
                result.summary.totalAbsent = values;
            } else if (firstCellLower.includes('total') && firstCellLower.includes('present') && !firstCellLower.includes('overall')) {
                result.summary.totalPresent = values;
            } else if (firstCellLower.includes('overall class')) {
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
    }
    
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
    
    console.log('Parsed result:', JSON.stringify(result, null, 2));
    
    return result;
}

export default parseAttendance;
