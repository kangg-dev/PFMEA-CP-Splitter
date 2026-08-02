// Elements
const themeToggle = document.getElementById('themeToggle');
const langToggle = document.getElementById('langToggle');
const htmlEl = document.documentElement;
const moonIcon = document.getElementById('moonIcon');
const sunIcon = document.getElementById('sunIcon');
const langText = document.getElementById('langText');

const modalOverlay = document.getElementById('modalOverlay');
const releaseNotesBtn = document.getElementById('releaseNotesBtn');
const closeModalBtn = document.getElementById('closeModalBtn');

const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

// Dictionary
const dict = {
    EN: {
        app_title: "PFMEA-CP Splitter",
        tab_general: "General Workcell",
        tab_zebra: "Zebra Workcell",
        upload_files: "Upload Files",
        upload_desc_general: "Upload standard template files for General processing.",
        upload_desc_zebra: "Upload Micro template files for Zebra processing.",
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
        tab_general: "Khu vực General",
        tab_zebra: "Khu vực Zebra",
        upload_files: "Tải lên Tệp tin",
        upload_desc_general: "Vui lòng chọn các tệp mẫu chuẩn cho khu vực General.",
        upload_desc_zebra: "Vui lòng chọn các tệp mẫu Micro cho khu vực Zebra.",
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

// Tab Logic
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`pane_${btn.dataset.tab}`).classList.add('active');
    });
});

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
    ['general', 'zebra'].forEach(mode => {
        [document.getElementById(`srcFile_${mode}`), 
         document.getElementById(`fmeaFile_${mode}`), 
         document.getElementById(`pcpFile_${mode}`)].forEach(input => {
            const span = input.nextElementSibling.querySelector('.file-name');
            if(!input.files || input.files.length === 0) {
                span.textContent = dict[currentLang]['choose_file'];
            }
        });
    });
});

// Modal Logic
releaseNotesBtn.addEventListener('click', () => modalOverlay.style.display = 'flex');
closeModalBtn.addEventListener('click', () => modalOverlay.style.display = 'none');
modalOverlay.addEventListener('click', (e) => { if(e.target === modalOverlay) modalOverlay.style.display = 'none'; });

function cleanStrict(text) {
    if (text === null || text === undefined) return "";
    return String(text).replace(/\s+/g, '').toLowerCase();
}

function setupWorkcell(modePrefix) {
    const srcFile = document.getElementById(`srcFile_${modePrefix}`);
    const fmeaFile = document.getElementById(`fmeaFile_${modePrefix}`);
    const pcpFile = document.getElementById(`pcpFile_${modePrefix}`);
    const execBtn = document.getElementById(`execBtn_${modePrefix}`);
    const consoleOutput = document.getElementById(`consoleOutput_${modePrefix}`);
    const progressBar = document.getElementById(`progressBar_${modePrefix}`);

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

    function exportLog() {
        const blob = new Blob([logs.join("\n")], { type: "text/plain;charset=utf-8" });
        const tsFolder = new Date().toISOString().replace(/[:T-]/g, '').substring(0, 14);
        saveAs(blob, `Report_Log_${modePrefix}_${tsFolder}.txt`);
    }

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

    function checkInputs() {
        if (srcFile.files.length > 0 && fmeaFile.files.length > 0 && pcpFile.files.length > 0) {
            execBtn.disabled = false;
        } else {
            execBtn.disabled = true;
        }
    }

    handleFileChange(srcFile, `srcFileName_${modePrefix}`);
    handleFileChange(fmeaFile, `fmeaFileName_${modePrefix}`);
    handleFileChange(pcpFile, `pcpFileName_${modePrefix}`);

    execBtn.addEventListener('click', async () => {
        execBtn.disabled = true;
        consoleOutput.innerHTML = '';
        logs = [];
        progressBar.style.width = '0%';
        
        logMessage(`--- ${modePrefix.toUpperCase()} SESSION STARTED ---`, "info");
        
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

                // STEP 1: Collect only rows that actually exist in the file (eachRow skips
                // phantom rows created by stray formatting). Filter to data region only.
                const existingRows = [];
                ws.eachRow((row, rowNumber) => {
                    if (rowNumber >= startRow) existingRows.push({ row, rowNumber });
                });

                // STEP 2: Find the true last data row (last row where process col is non-empty)
                let lastDataIdx = -1;
                for (let i = existingRows.length - 1; i >= 0; i--) {
                    const val = existingRows[i].row.getCell(colIdx).value;
                    if (val !== null && val !== undefined && String(val).trim() !== "") {
                        lastDataIdx = i;
                        break;
                    }
                }

                if (lastDataIdx === -1) {
                    logMessage(`No data found in sheet ${sheetName} from row ${startRow}.`, "warn");
                    return;
                }

                // STEP 3: Only iterate rows up to and including the last data row
                const dataRegion = existingRows.slice(0, lastDataIdx + 1);

                let gapCount = 0;
                let previousRowNumber = startRow - 1;

                for (const { row, rowNumber } of dataRegion) {
                    if (hasGapError) break;

                    // Count implicit empty rows between consecutive existing rows
                    const implicitGap = (rowNumber - previousRowNumber - 1);
                    gapCount += implicitGap;

                    const p = row.getCell(colIdx).value;

                    if (p !== null && p !== undefined && String(p).trim() !== "") {
                        if (gapCount > 15) {
                            logMessage(`Detected too many empty rows between data rows (Data is not continuous) near row ${rowNumber}`, "error");
                            hasGapError = true;
                            break;
                        }
                        gapCount = 0;
                        const p_key = String(p).trim();
                        if (!allData[p_key]) allData[p_key] = { FMEA: [], PCP: [] };

                        const rowData = [];
                        const colsToExtract = modePrefix === "general"
                            ? (mode === "FMEA"
                                ? [6,7,8,9,10,11,12,13,14,15,16,17]
                                : [5,6,7,8,9,10,11,12,13,14,15,16])
                            : (mode === "FMEA"
                                ? [4,5,6,7,8,9,10,11,12,13,14,15,16,17]
                                : [3,4,5,6,7,8,9,10,11,12,13,14,15,16]);

                        colsToExtract.forEach(c => {
                            let val = row.getCell(c).value;
                            if (val && typeof val === 'object') {
                                if (val.result !== undefined) val = val.result;
                                else if (val.richText) val = val.richText.map(rt => rt.text).join('');
                            }
                            rowData.push(val);
                        });

                        allData[p_key][mode].push({ data: rowData, row: rowNumber });
                    } else {
                        gapCount++;
                    }
                    previousRowNumber = rowNumber;
                }
            };

            processSheet("PFMEA", 33, 3, "FMEA");
            if(!hasGapError) processSheet("PCP", 30, 2, "PCP");
            
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
                    logMessage(`ROW COUNT ERROR: Process '${k}' | PFMEA: ${fList.length} vs PCP: ${pList.length}`, "error");
                    errCount++;
                    continue;
                }

                for (let i = 0; i < fList.length; i++) {
                    const f_i = fList[i];
                    const p_i = pList[i];
                    
                    [{item: f_i, m: 'PFMEA'}, {item: p_i, m: 'PCP'}].forEach(({item, m}) => {
                        item.data.forEach((v, idx) => {
                            if (v === null || v === undefined || String(v).trim() === "") {
                                logMessage(`EMPTY ERROR: ${m} Process '${k}' (Occ ${i+1}) | Cell at data index ${idx+1} is blank`, "error");
                                errCount++;
                            }
                        });
                    });

                    let checks = [];
                    if (modePrefix === "general") {
                        checks = [
                            { fi: 0, pi: 1, cf: "F", cp: "F" },
                            { fi: 1, pi: 2, cf: "G", cp: "G" },
                            { fi: 2, pi: 3, cf: "H", cp: "H" },
                            { fi: 6, pi: 4, cf: "L", cp: "I" }
                        ];
                    } else if (modePrefix === "zebra") {
                        checks = [
                            { fi: 0, pi: 0, cf: "D", cp: "C" }, // New pair 1
                            { fi: 1, pi: 1, cf: "E", cp: "D" }, // New pair 2
                            { fi: 2, pi: 3, cf: "F", cp: "F" }, // Old 1
                            { fi: 3, pi: 4, cf: "G", cp: "G" }, // Old 2
                            { fi: 4, pi: 5, cf: "H", cp: "H" }, // Old 3
                            { fi: 8, pi: 6, cf: "L", cp: "I" }  // Old 7 vs Old 5
                        ];
                    }

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
            const numCols = modePrefix === "zebra" ? 14 : 12;

            // Load each template ONCE (avoid re-parsing 1MB template for every process)
            logMessage("Loading templates...", "info");
            const fmeaWb = new ExcelJS.Workbook();
            await fmeaWb.xlsx.load(fmeaBuffer);
            const fmeaSt = fmeaWb.worksheets[0];

            const pcpWb = new ExcelJS.Workbook();
            await pcpWb.xlsx.load(pcpBuffer);
            const pcpSt = pcpWb.worksheets[0];

            for (const processName of keys) {
                // Yield to browser to update UI and prevent "Page Unresponsive"
                await new Promise(resolve => setTimeout(resolve, 10));
                
                const content = allData[processName];
                const safeName = processName.replace(/[^a-zA-Z0-9 _-]/g, '').trim();
                const processFolder = zip.folder(safeName);

                for (const { t_type, st, items } of [
                    { t_type: 'FMEA', st: fmeaSt, items: content.FMEA },
                    { t_type: 'PCP', st: pcpSt, items: content.PCP }
                ]) {
                    if (items && items.length > 0) {
                        // Write data into the pre-loaded template
                        items.forEach((item, rowOffset) => {
                            const targetRow = 2 + rowOffset;
                            
                            if (modePrefix === "general") {
                                item.data.forEach((val, colOffset) => {
                                    st.getCell(targetRow, 1 + colOffset).value = val;
                                });
                            } else if (modePrefix === "zebra") {
                                if (t_type === "FMEA") {
                                    st.getCell(targetRow, 1).value = item.data[2]; // F -> A
                                    st.getCell(targetRow, 2).value = item.data[0]; // D -> B
                                    st.getCell(targetRow, 3).value = item.data[1]; // E -> C
                                    for (let j = 3; j < 14; j++) {
                                        st.getCell(targetRow, j + 1).value = item.data[j];
                                    }
                                } else if (t_type === "PCP") {
                                    st.getCell(targetRow, 1).value = item.data[0]; // C -> A
                                    st.getCell(targetRow, 2).value = item.data[1]; // D -> B
                                    for (let j = 2; j < 14; j++) {
                                        st.getCell(targetRow, j + 1).value = item.data[j];
                                    }
                                }
                            }
                        });
                        
                        // Export to buffer and add to ZIP
                        const wb = t_type === 'FMEA' ? fmeaWb : pcpWb;
                        const outBuffer = await wb.xlsx.writeBuffer();
                        processFolder.file(`${safeName}_${t_type}.xlsx`, outBuffer);
                        
                        // Clear written cells so template is clean for the next process
                        items.forEach((item, rowOffset) => {
                            const targetRow = 2 + rowOffset;
                            for (let c = 1; c <= numCols; c++) {
                                st.getCell(targetRow, c).value = null;
                            }
                        });
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
            saveAs(zipBlob, `Report_${modePrefix}_${tsFolder}.zip`);
            logMessage("ZIP file downloaded successfully!", "success");

        } catch (err) {
            logMessage(`System Error: ${err.message}`, "error");
        } finally {
            execBtn.disabled = false;
        }
    });
}

// Initialize both workcells
setupWorkcell("general");
setupWorkcell("zebra");
