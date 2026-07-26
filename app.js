// Elements
const themeToggle = document.getElementById('themeToggle');
const langToggle = document.getElementById('langToggle');
const htmlEl = document.documentElement;
const moonIcon = document.getElementById('moonIcon');
const sunIcon = document.getElementById('sunIcon');
const langText = document.getElementById('langText');

const srcFile = document.getElementById('srcFile');
const fmeaFile = document.getElementById('fmeaFile');
const pcpFile = document.getElementById('pcpFile');
const execBtn = document.getElementById('execBtn');
const consoleOutput = document.getElementById('consoleOutput');
const progressBar = document.getElementById('progressBar');

const modalOverlay = document.getElementById('modalOverlay');
const releaseNotesBtn = document.getElementById('releaseNotesBtn');
const closeModalBtn = document.getElementById('closeModalBtn');

// Dictionary
const dict = {
    EN: {
        app_title: "PFMEA-CP Splitter",
        upload_files: "Upload Files",
        upload_desc: "Please select the required Excel files to begin the process.",
        src_workbook: "Source Workbook",
        fmea_template: "FMEA Template",
        pcp_template: "PCP Template",
        choose_file: "Choose file...",
        browse: "Browse",
        execute: "EXECUTION",
        console_log: "Console Log",
        release_notes: "Release Notes",
        release_notes_title: "Release Notes"
    },
    VI: {
        app_title: "Công cụ Tách PFMEA-CP",
        upload_files: "Tải lên Tệp tin",
        upload_desc: "Vui lòng chọn các tệp Excel bắt buộc để bắt đầu.",
        src_workbook: "Tệp Dữ Liệu Gốc",
        fmea_template: "Tệp Mẫu FMEA",
        pcp_template: "Tệp Mẫu PCP",
        choose_file: "Chọn tệp...",
        browse: "Duyệt",
        execute: "THỰC THI",
        console_log: "Nhật Ký (Log)",
        release_notes: "Lịch sử cập nhật",
        release_notes_title: "Lịch sử cập nhật"
    }
};

let currentLang = 'EN';

// Theme Logic
themeToggle.addEventListener('click', () => {
    const currentTheme = htmlEl.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    htmlEl.setAttribute('data-theme', newTheme);
    if(newTheme === 'dark'){
        moonIcon.style.display = 'none';
        sunIcon.style.display = 'block';
    }else{
        moonIcon.style.display = 'block';
        sunIcon.style.display = 'none';
    }
});

// Language Logic
langToggle.addEventListener('click', () => {
    currentLang = currentLang === 'EN' ? 'VI' : 'EN';
    langText.textContent = currentLang;
    
    document.querySelectorAll('[data-lang]').forEach(el => {
        const key = el.getAttribute('data-lang');
        if (dict[currentLang][key]) {
            el.textContent = dict[currentLang][key];
        }
    });
    
    // Update file placeholders if empty
    [srcFile, fmeaFile, pcpFile].forEach(input => {
        const span = input.nextElementSibling.querySelector('.file-name');
        if(!input.files || input.files.length === 0) {
            span.textContent = dict[currentLang]['choose_file'];
        }
    });
});

// Modal Logic
releaseNotesBtn.addEventListener('click', () => modalOverlay.style.display = 'flex');
closeModalBtn.addEventListener('click', () => modalOverlay.style.display = 'none');
modalOverlay.addEventListener('click', (e) => { if(e.target === modalOverlay) modalOverlay.style.display = 'none'; });

// File Input Logic
function handleFileChange(input, spanId) {
    input.addEventListener('change', (e) => {
        const span = document.getElementById(spanId);
        if (e.target.files.length > 0) {
            span.textContent = e.target.files[0].name;
            span.style.color = 'var(--text-primary)';
        } else {
            span.textContent = dict[currentLang]['choose_file'];
            span.style.color = 'var(--text-secondary)';
        }
        checkInputs();
    });
}
handleFileChange(srcFile, 'srcFileName');
handleFileChange(fmeaFile, 'fmeaFileName');
handleFileChange(pcpFile, 'pcpFileName');

function checkInputs() {
    if (srcFile.files.length > 0 && fmeaFile.files.length > 0 && pcpFile.files.length > 0) {
        execBtn.disabled = false;
    } else {
        execBtn.disabled = true;
    }
}

// Logger
let logs = [];
function logMessage(msg, type="info") {
    const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const logStr = `[${ts}] [${type.toUpperCase()}] ${msg}`;
    logs.push(logStr);
    
    const div = document.createElement('div');
    div.className = `log-line ${type}`;
    div.textContent = logStr;
    consoleOutput.appendChild(div);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function cleanStrict(text) {
    if (text === null || text === undefined) return "";
    return String(text).replace(/\s+/g, '').toLowerCase();
}

// Execution Logic
execBtn.addEventListener('click', async () => {
    execBtn.disabled = true;
    consoleOutput.innerHTML = '';
    logs = [];
    progressBar.style.width = '0%';
    
    logMessage(`--- SESSION STARTED ---`, "info");
    
    try {
        const srcBuffer = await srcFile.files[0].arrayBuffer();
        const fmeaBuffer = await fmeaFile.files[0].arrayBuffer();
        const pcpBuffer = await pcpFile.files[0].arrayBuffer();
        
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(srcBuffer);
        
        const allData = {};
        let hasGapError = false;

        const processSheet = (sheetName, startRow, colIdx, mode) => {
            const ws = wb.getWorksheet(sheetName);
            if (!ws) {
                logMessage(`Sheet ${sheetName} not found!`, "error");
                return;
            }
            logMessage(`Scanning ${sheetName} sheet...`, "info");
            
            let streak = 0;
            // 1-indexed for exceljs
            const colIndexReal = colIdx; 
            
            let lastDataRow = 0;
            ws.eachRow((row, rowNumber) => {
                if(rowNumber >= startRow) {
                    const p = row.getCell(colIndexReal).value;
                    if(p) lastDataRow = rowNumber;
                }
            });

            let gapCount = 0;
            
            for (let r = startRow; r <= Math.max(ws.rowCount, lastDataRow); r++) {
                const row = ws.getRow(r);
                const p = row.getCell(colIndexReal).value;
                
                if (p) {
                    if (gapCount > 15) {
                        logMessage(`Detected too many empty rows between data rows (Data is not continuous) at row ${r}`, "error");
                        hasGapError = true;
                        break;
                    }
                    gapCount = 0;
                    const p_key = String(p).trim();
                    if (!allData[p_key]) allData[p_key] = { FMEA: [], PCP: [] };
                    
                    const colStart = mode === "FMEA" ? 6 : 5;
                    const rowData = [];
                    for (let c = colStart; c < colStart + 12; c++) {
                        let val = row.getCell(c).value;
                        // Handle objects like rich text or formulas
                        if(val && typeof val === 'object') {
                            if(val.result !== undefined) val = val.result;
                            else if(val.richText) val = val.richText.map(rt => rt.text).join('');
                        }
                        rowData.push(val);
                    }
                    allData[p_key][mode].push({ data: rowData, row: r });
                } else {
                    if (r < lastDataRow) gapCount++;
                }
            }
        };

        processSheet("PFMEA", 33, 3, "FMEA"); // col C is 3
        if(!hasGapError) processSheet("PCP", 30, 2, "PCP");   // col B is 2
        
        if (hasGapError) {
            logMessage("ABORTED: Data is not continuous. Returning log file only.", "error");
            exportLog();
            execBtn.disabled = false;
            return;
        }

        logMessage("Performing cross-check verification...", "info");
        let errCount = 0, warnCount = 0;

        for (const [k, content] of Object.entries(allData)) {
            const fList = content.FMEA;
            const pList = content.PCP;
            
            if (fList.length !== pList.length) {
                logMessage(`ROW COUNT ERROR: Process '${k}' | PFMEA: ${fList.length} rows vs PCP: ${pList.length} rows`, "error");
                logMessage(`Skipped detailed check for '${k}'. Please sync row counts!`, "warn");
                errCount++;
                continue;
            }

            for (let i = 0; i < fList.length; i++) {
                const f_i = fList[i];
                const p_i = pList[i];
                
                [{item: f_i, m: 'PFMEA'}, {item: p_i, m: 'PCP'}].forEach(({item, m}) => {
                    item.data.forEach((v, idx) => {
                        if (v === null || v === undefined || String(v).trim() === "") {
                            const colChar = String.fromCharCode((m==='PFMEA'?70:69) + idx); // 70=F, 69=E
                            logMessage(`EMPTY ERROR: ${m} Process '${k}' (Occ ${i+1}) | Cell ${colChar}${item.row} is blank`, "error");
                            errCount++;
                        }
                    });
                });

                // checks = [(0,1,"F","F"), (1,2,"G","G"), (2,3,"H","H"), (6,4,"L","I")]
                const checks = [
                    { fi: 0, pi: 1, cf: "F", cp: "F" },
                    { fi: 1, pi: 2, cf: "G", cp: "G" },
                    { fi: 2, pi: 3, cf: "H", cp: "H" },
                    { fi: 6, pi: 4, cf: "L", cp: "I" }
                ];

                for (const check of checks) {
                    const v_f = String(f_i.data[check.fi] || "");
                    const v_p = String(p_i.data[check.pi] || "");
                    
                    if (v_f !== v_p) {
                        if (cleanStrict(v_f) === cleanStrict(v_p)) {
                            logMessage(`FORMAT WARNING: Process '${k}' (Occ ${i+1}) | Format/Spacing mismatch`, "warn");
                            warnCount++;
                        } else {
                            logMessage(`MISMATCH ERROR: Process '${k}' (Occ ${i+1}) | Content mismatch`, "error");
                            logMessage(`  PFMEA ${check.cf}${f_i.row}: '${v_f}'`, "error");
                            logMessage(`  PCP   ${check.cp}${p_i.row}: '${v_p}'`, "error");
                            errCount++;
                        }
                    }
                }
            }
        }

        logMessage("Exporting individual Excel files...", "info");
        const zip = new JSZip();
        
        const keys = Object.keys(allData);
        let processed = 0;

        for (const processName of keys) {
            const content = allData[processName];
            const safeName = processName.replace(/[^a-zA-Z0-9 _-]/g, '').trim();
            const processFolder = zip.folder(safeName);
            
            for (const {t_type, buffer, items} of [
                {t_type: 'FMEA', buffer: fmeaBuffer, items: content.FMEA},
                {t_type: 'PCP', buffer: pcpBuffer, items: content.PCP}
            ]) {
                if (items && items.length > 0) {
                    const twb = new ExcelJS.Workbook();
                    await twb.xlsx.load(buffer);
                    const st = twb.worksheets[0];
                    
                    items.forEach((item, rowOffset) => {
                        const targetRow = 2 + rowOffset;
                        item.data.forEach((val, colOffset) => {
                            st.getCell(targetRow, 1 + colOffset).value = val;
                        });
                    });
                    
                    const outBuffer = await twb.xlsx.writeBuffer();
                    processFolder.file(`${safeName}_${t_type}.xlsx`, outBuffer);
                }
            }
            processed++;
            progressBar.style.width = `${(processed / keys.length) * 100}%`;
        }

        logMessage(`--- COMPLETED: ${errCount} Errors, ${warnCount} Warnings ---`, "success");
        zip.file("log.txt", logs.join("\n"));
        
        logMessage("Generating ZIP file...", "info");
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const tsFolder = new Date().toISOString().replace(/[:T-]/g, '').substring(0, 14);
        saveAs(zipBlob, `Report_${tsFolder}.zip`);
        logMessage("ZIP file downloaded successfully!", "success");

    } catch (err) {
        logMessage(`System Error: ${err.message}`, "error");
    } finally {
        execBtn.disabled = false;
    }
});

function exportLog() {
    const blob = new Blob([logs.join("\n")], { type: "text/plain;charset=utf-8" });
    const tsFolder = new Date().toISOString().replace(/[:T-]/g, '').substring(0, 14);
    saveAs(blob, `Report_Log_${tsFolder}.txt`);
}
