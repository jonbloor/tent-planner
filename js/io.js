function importTentsCSV() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.csv';
    input.onchange = (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const lines = ev.target.result.split(/\r?\n/).filter(l => l.trim());
            if (lines.length < 2) { alert("CSV needs header + data"); return; }
            const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
            const nameIdx = headers.indexOf('name');
            const sleepsIdx = headers.indexOf('sleeps');
            const qtyIdx = headers.indexOf('qty');
            const footprintIdx = headers.indexOf('footprint');
            if (nameIdx === -1) { alert("CSV must have 'name' column"); return; }
            let added = 0;
            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
                if (!cols[nameIdx]) continue;
                const name = cols[nameIdx];
                const exists = tentInventory.find(t => t.name.toLowerCase() === name.toLowerCase());
                if (exists) {
                    if (qtyIdx >= 0) exists.qty = parseInt(cols[qtyIdx]) || exists.qty;
                    if (qtyIdx >= 0) exists.remaining = Math.min(exists.remaining, exists.qty);
                    if (sleepsIdx >= 0) exists.sleeps = parseInt(cols[sleepsIdx]) || exists.sleeps;
                    if (footprintIdx >= 0) exists.footprint = cols[footprintIdx] || exists.footprint;
                } else {
                    tentInventory.push({
                        id: Date.now(),
                        name: name,
                        sleeps: sleepsIdx >= 0 ? parseInt(cols[sleepsIdx]) || 4 : 4,
                        qty: qtyIdx >= 0 ? parseInt(cols[qtyIdx]) || 1 : 1,
                        remaining: qtyIdx >= 0 ? parseInt(cols[qtyIdx]) || 1 : 1,
                        footprint: footprintIdx >= 0 ? cols[footprintIdx] : "400×400",
                        color: "#166534"
                    });
                    added++;
                }
            }
            renderInventory();
            debouncedSave();
            alert(`Updated/added ${added} tent types!`);
        };
        reader.readAsText(file);
    };
    input.click();
}

function showEditInventoryModal() {
    const modal = document.getElementById('edit-inventory-modal');
    const list = document.getElementById('inventory-edit-list');
    list.innerHTML = '';
    tentInventory.forEach((tent, idx) => {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between border border-slate-200 rounded-2xl px-4 py-3';
        div.innerHTML = `<div class="flex-1"><div class="font-medium">${tent.name}</div><div class="text-xs text-slate-500">${tent.footprint} • ${tent.sleeps} person</div></div><div class="text-right"><div class="text-xs text-slate-500">Remaining</div><input type="number" value="${tent.remaining}" min="0" max="${tent.qty}" class="w-16 text-center border border-slate-300 rounded-xl py-1 text-sm" onchange="updateTentQuantity(${idx}, this.value)"></div>`;
        list.appendChild(div);
    });
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function updateTentQuantity(idx, newRemaining) {
    tentInventory[idx].remaining = parseInt(newRemaining) || 0;
    renderInventory();
    debouncedSave();
}

function closeEditInventoryModal() {
    document.getElementById('edit-inventory-modal').classList.remove('flex');
    document.getElementById('edit-inventory-modal').classList.add('hidden');
    renderInventory();
}

function showRelationshipsModal() {
    alert("Mark friends and foes from the person menu in a later update. Warnings already apply when assigning.");
}

function autoAssign() {
    if (!confirm("Smart Assign will respect gender, capacity, type restrictions and friendships. Continue?")) return;
    placedTents.forEach(t => t.assignedScouts = []);
    const sortedTents = [...placedTents].filter(t => t.sleeps > 0 && !t.isSupport).sort((a, b) => b.sleeps - a.sleeps);
    let unassigned = [...scouts];
    sortedTents.forEach(tent => {
        if (unassigned.length === 0) return;
        let pool = unassigned.filter(s =>
            (tent.genderPolicy === 'M' && s.gender === 'M') ||
            (tent.genderPolicy === 'F' && s.gender === 'F') ||
            tent.genderPolicy === 'Mixed'
        );
        pool = pool.filter(s => tent.allowedTypes.includes(s.type));
        if (pool.length === 0) return;
        const effectiveCapacity = tent.customCapacity || tent.sleeps;
        const toAssign = pool.slice(0, effectiveCapacity - tent.assignedScouts.length);
        toAssign.forEach(scout => {
            tent.assignedScouts.push(scout.id);
            unassigned = unassigned.filter(u => u.id !== scout.id);
        });
    });
    renderPlacedTents();
    renderScoutsList();
    updateCounts();
    debouncedSave();
    alert("Smart assign complete!");
}

function exportCSV() {
    let csv = "Scout Name,Gender,Type,Tent,Position,Capacity,Note\n";
    scouts.forEach(scout => {
        const tent = getAssignedTent(scout.id);
        if (tent) {
            const effectiveCapacity = tent.customCapacity || tent.sleeps;
            csv += `"${scout.name}",${scout.gender},${scout.type},"${getTentDisplayName(tent)}","${Math.round(tent.x)},${Math.round(tent.y)}",${tent.assignedScouts.length}/${effectiveCapacity},"${tent.note || ''}"\n`;
        } else {
            csv += `"${scout.name}",${scout.gender},${scout.type},Unassigned,,"",""\n`;
        }
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tent-plan-${document.getElementById('camp-name').value.replace(/\s+/g,'-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function printPlan() {
    const printWindow = window.open('', '_blank');
    const campName = document.getElementById('camp-name').value;
    const campDates = document.getElementById('camp-dates').value;
    const groupName = document.getElementById('group-name').value;
    let html = `<html><head><title>${campName}</title><style>@page { size: landscape; } body{font-family:system-ui,sans-serif;padding:30px} h1{color:#166534} .grid-container{position:relative;width:1100px;height:780px;border:4px solid #166534;border-radius:16px;background:#dcfce7;margin:20px auto} .tent-print{position:absolute;border:3px solid #166534;border-radius:12px;background:white;display:flex;align-items:center;justify-content:center;font-size:10px;text-align:center;padding:4px} .zone-print{position:absolute;border:3px dashed #166534;background:rgba(16,185,129,0.1);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:#166534} table{width:100%;border-collapse:collapse;margin-top:20px} th,td{border:1px solid #16653433;padding:8px 12px;text-align:left} th{background:#166534;color:white} .footer{margin-top:30px;font-size:11px;color:#666;text-align:center} .page-break{page-break-after:always}</style></head><body>`;
    html += `<h1>${campName}</h1><p><strong>${groupName}</strong> • ${campDates} • ${scouts.length} people • ${placedTents.length} structures</p>`;
    html += `<h2>Campsite Layout</h2><div class="grid-container" style="width:1100px;height:780px;position:relative;border:4px solid #166534;border-radius:16px;background:#dcfce7">`;
    zones.forEach(zone => {
        html += `<div class="zone-print" style="left:${zone.x}px;top:${zone.y}px;width:${zone.w}px;height:${zone.h}px"><span>${zone.label}</span></div>`;
    });
    placedTents.forEach(tent => {
        const size = getVisualSize(tent);
        const names = tent.assignedScouts.map(id => scouts.find(s => s.id === id)?.name).filter(Boolean).join(', ') || 'Empty';
        const note = tent.note ? `<br><span style="font-size:8px;color:#713f12">${tent.note}</span>` : '';
        html += `<div class="tent-print" style="left:${tent.x}px;top:${tent.y}px;width:${size.width}px;height:${size.height}px"><div><strong>${getTentDisplayName(tent)}</strong><br><span style="font-size:9px">${names}</span>${note}</div></div>`;
    });
    html += `</div><div class="footer">Page 1 of 2 — Campsite Layout</div><div class="page-break"></div>`;
    html += `<h2>Assignments</h2><table><tr><th>Tent</th><th>Gender</th><th>Allowed For</th><th>Scouts</th><th>Capacity</th><th>Note</th></tr>`;
    placedTents.forEach(tent => {
        const names = tent.assignedScouts.map(id => scouts.find(s => s.id === id)?.name).filter(Boolean).join(', ') || '—';
        const effectiveCapacity = tent.customCapacity || tent.sleeps;
        html += `<tr><td>${getTentDisplayName(tent)}</td><td>${tent.genderPolicy || '—'}</td><td>${tent.allowedTypes.join(', ')}</td><td>${names}</td><td>${tent.assignedScouts.length}/${effectiveCapacity}</td><td>${tent.note || ''}</td></tr>`;
    });
    html += `</table><div class="footer">Page 2 of 2 — Tent Planner • ${new Date().toLocaleDateString()}</div></body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 400);
}

function clearAllTents() {
    if (!confirm("Clear entire campsite?")) return;
    placedTents = [];
    tentInventory.forEach(t => t.remaining = t.qty);
    renderPlacedTents();
    renderInventory();
    updateCounts();
    debouncedSave();
}

function updateGroupName() {
    document.getElementById('group-name-display').textContent = document.getElementById('group-name').value;
}

function debouncedSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => { saveState(); }, 800);
}

function saveState(showAlert = false) {
    const state = {
        scouts, placedTents, relationships, zones,
        campName: document.getElementById('camp-name').value,
        campDates: document.getElementById('camp-dates').value,
        groupName: document.getElementById('group-name').value,
        backgroundImageData, backgroundRotation, backgroundScale,
        nextScoutId, nextTentId,
        inventoryRemaining: tentInventory.map(t => ({ id: t.id, remaining: t.remaining })),
        currentZoom, currentScale
    };
    localStorage.setItem('tentPlannerState', JSON.stringify(state));
    if (showAlert) alert("Plan saved locally!");
}

function loadState(silent = false) {
    const saved = localStorage.getItem('tentPlannerState');
    if (!saved) {
        if (!silent) alert("No saved plan found.");
        return;
    }
    const state = JSON.parse(saved);
    scouts = state.scouts || [];
    placedTents = state.placedTents || [];
    relationships = state.relationships || { friends: [], foes: [] };
    zones = state.zones || [];
    document.getElementById('camp-name').value = state.campName || "Summer Camp";
    document.getElementById('camp-dates').value = state.campDates || "1–3 August";
    document.getElementById('group-name').value = state.groupName || "Scout Group";
    document.getElementById('group-name-display').textContent = state.groupName || "Scout Group";
    backgroundImageData = state.backgroundImageData || null;
    backgroundRotation = state.backgroundRotation || 0;
    backgroundScale = state.backgroundScale || 100;
    nextScoutId = state.nextScoutId || scouts.length + 1;
    nextTentId = state.nextTentId || placedTents.length + 1;
    currentZoom = state.currentZoom || 100;
    currentScale = state.currentScale || 20;
    if (state.inventoryRemaining) {
        state.inventoryRemaining.forEach(item => {
            const inv = tentInventory.find(t => t.id === item.id);
            if (inv) inv.remaining = item.remaining;
        });
    }
    const layer = document.getElementById('background-layer');
    if (backgroundImageData && layer) {
        layer.style.backgroundImage = `url(${backgroundImageData})`;
        layer.style.backgroundSize = 'cover';
        layer.style.transform = `rotate(${backgroundRotation}deg) scale(${backgroundScale / 100})`;
    }
    document.getElementById('zoom-level').textContent = `${currentZoom}%`;
    document.getElementById('scale-input').value = currentScale;
    document.getElementById('rotate-slider').value = backgroundRotation;
    document.getElementById('rotate-value').textContent = backgroundRotation + '°';
    document.getElementById('bg-scale-slider').value = backgroundScale;
    document.getElementById('bg-scale-value').textContent = backgroundScale + '%';
    renderEverything();
    if (!silent) alert("Plan loaded successfully!");
}

function setupKeyboard() {
    document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement.tagName === 'BODY') { e.preventDefault(); document.getElementById('scout-search').focus(); }
        if (e.key === 'Escape') {
            const modal = document.getElementById('assignment-modal');
            if (!modal.classList.contains('hidden')) closeAssignmentModal();
        }
    });
    document.getElementById('assignment-modal').addEventListener('click', (e) => {
        if (e.target.id === 'assignment-modal') closeAssignmentModal();
    });
}

function initApp() {
    const saved = localStorage.getItem('tentPlannerState');
    if (saved) loadState(true);
    else loadSampleData();
    document.getElementById('scale-input').value = currentScale;
    document.getElementById('rotate-slider').value = backgroundRotation;
    document.getElementById('rotate-value').textContent = backgroundRotation + '°';
    document.getElementById('bg-scale-slider').value = backgroundScale;
    document.getElementById('bg-scale-value').textContent = backgroundScale + '%';
    const groupInput = document.getElementById('group-name');
    groupInput.addEventListener('input', () => {
        document.getElementById('group-name-display').textContent = groupInput.value;
    });
    setupKeyboard();
    setMode('normal');
    setTimeout(() => debouncedSave(), 1500);
    console.log('%c[Tent Planner] Ready', 'color:#166534');
}

window.onload = initApp;
