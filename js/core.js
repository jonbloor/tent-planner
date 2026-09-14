let scouts = [];
let placedTents = [];
let relationships = { friends: [], foes: [] };
let zones = [];
let nextScoutId = 1;
let nextTentId = 1;
let currentMode = 'normal';
let backgroundImageData = null;
let backgroundRotation = 0;
let backgroundScale = 100;
let currentZoom = 100;
let currentScale = 20;
let saveTimeout = null;
let isDrawingZone = false;
let zoneStartX = 0, zoneStartY = 0, currentZoneEl = null;

const tentInventory = [
    { id: 1, name: "2-person dome", sleeps: 2, qty: 2, remaining: 2, footprint: "230×300", color: "#166534" },
    { id: 2, name: "4-person tunnel", sleeps: 4, qty: 4, remaining: 4, footprint: "210×335", color: "#166534" },
    { id: 3, name: "5-person family", sleeps: 5, qty: 2, remaining: 2, footprint: "280×430", color: "#166534" },
    { id: 4, name: "8-person tunnel", sleeps: 8, qty: 4, remaining: 4, footprint: "260×700", color: "#166534" },
    { id: 5, name: "3m gazebo", sleeps: 0, qty: 1, remaining: 1, footprint: "300×300", color: "#64748b", isSupport: true },
    { id: 6, name: "4.5m event shelter", sleeps: 0, qty: 2, remaining: 2, footprint: "450×450", color: "#64748b", isSupport: true },
    { id: 7, name: "Mess tent", sleeps: 0, qty: 1, remaining: 1, footprint: "440×762", color: "#64748b", isSupport: true }
];

function loadSampleData() {
    const names = ["Alex Morgan","Ben Carter","Chloe Patel","Daniel Hughes","Emma Wilson","Finn Taylor","Grace Lewis","Harry Bennett","Isla Cooper","James Wright","Katie Shaw","Liam Brooks"];
    scouts = names.map((name, i) => ({
        id: nextScoutId++,
        name: name,
        gender: i % 2 === 0 ? "F" : "M",
        type: i < 8 ? "Scout" : (i < 10 ? "Young Leader" : "Leader")
    }));
    relationships.friends = [[1,2],[3,4]];
    relationships.foes = [[5,6]];
    setTimeout(function() {
        placeTentOnGrid(4, 140, 200);
        placeTentOnGrid(2, 420, 240);
        zones.push({ id: Date.now(), x: 60, y: 60, w: 220, h: 150, label: "Leaders Area", color: "#3b82f6" });
        renderZones();
    }, 200);
    renderEverything();
}

function renderEverything() {
    renderScoutsList();
    renderInventory();
    renderPlacedTents();
    renderZones();
    updateCounts();
    updateScaleLabel();
}

function updateCounts() {
    const total = scouts.length;
    const assigned = scouts.filter(s => isScoutAssigned(s.id)).length;
    document.getElementById('total-scouts').textContent = total;
    document.getElementById('unassigned-count').textContent = total - assigned;
    document.getElementById('scout-count').textContent = assigned + ' assigned • ' + (total - assigned) + ' unassigned';
}

function isScoutAssigned(id) { return placedTents.some(t => t.assignedScouts.includes(id)); }
function getAssignedTent(id) { return placedTents.find(t => t.assignedScouts.includes(id)); }

function getTentDisplayName(tent) {
    const same = placedTents.filter(t => t.inventoryId === tent.inventoryId);
    if (same.length > 1) return tent.name + ' #' + (same.findIndex(t => t.id === tent.id) + 1);
    return tent.name;
}

function parseFootprint(footprint) {
    const parts = footprint.split('×').map(p => parseInt(p.trim()));
    return { width: parts[0] || 400, height: parts[1] || 400 };
}

function getVisualSize(tent) {
    const dims = parseFootprint(tent.footprint);
    const pxPerCm = currentScale / 100;
    return { width: Math.max(60, Math.round(dims.width * pxPerCm)), height: Math.max(50, Math.round(dims.height * pxPerCm)) };
}

function renderScoutsList(filtered) {
    const container = document.getElementById('scouts-list');
    const list = filtered || scouts;
    container.innerHTML = '';
    if (!list.length) {
        container.innerHTML = '<div class="px-4 py-8 text-center text-sm text-slate-400">No people found</div>';
        return;
    }
    list.forEach(function(scout) {
        const assignedTent = getAssignedTent(scout.id);
        const div = document.createElement('div');
        div.className = 'scout-row flex items-center gap-x-3 px-4 py-3 rounded-2xl mx-1' + (assignedTent ? ' opacity-60' : '');
        const genderClass = scout.gender === 'M' ? 'gender-male' : 'gender-female';
        const typeBadge = scout.type === 'Leader' ? 'bg-amber-100 text-amber-700' : (scout.type === 'Young Leader' ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700');
        div.innerHTML = '<div class="flex-1 min-w-0"><div class="flex items-center gap-x-2"><span class="font-medium text-sm truncate">' + scout.name + '</span><span class="px-1.5 py-px text-[9px] rounded font-mono ' + genderClass + '">' + scout.gender + '</span><span class="px-1.5 py-px text-[9px] rounded ' + typeBadge + '">' + scout.type + '</span></div>' + (assignedTent ? '<div class="text-[10px] text-emerald-600 mt-0.5">In: ' + getTentDisplayName(assignedTent) + '</div>' : '') + '</div><div class="flex gap-x-1">' + (assignedTent ? '<button onclick="event.stopImmediatePropagation(); removeScoutFromTent(' + scout.id + ')" class="text-red-500 p-1"><i class="fa-solid fa-times fa-sm"></i></button>' : '') + '<button onclick="event.stopImmediatePropagation(); showScoutOptions(' + scout.id + ')" class="text-slate-400 p-1"><i class="fa-solid fa-ellipsis-h fa-sm"></i></button></div>';
        div.onclick = function() { if (assignedTent) showAssignmentModal(assignedTent.id); };
        container.appendChild(div);
    });
}

function filterScouts() {
    const search = document.getElementById('scout-search').value.toLowerCase();
    const typeFilter = document.getElementById('type-filter').value;
    let filtered = scouts;
    if (search) filtered = filtered.filter(s => s.name.toLowerCase().includes(search));
    if (typeFilter === 'unassigned') filtered = filtered.filter(s => !isScoutAssigned(s.id));
    else if (typeFilter) filtered = filtered.filter(s => s.type === typeFilter);
    renderScoutsList(filtered);
}

function renderInventory() {
    const container = document.getElementById('inventory-list');
    container.innerHTML = '';
    tentInventory.forEach(function(tent) {
        if (tent.remaining <= 0 && !tent.isSupport) return;
        const div = document.createElement('div');
        div.className = 'flex items-center gap-x-3 p-3 rounded-2xl border cursor-pointer ' + (tent.isSupport ? 'border-slate-200 bg-slate-50' : 'border-emerald-100 hover:border-emerald-300');
        const icon = tent.isSupport ? 'fa-solid fa-store' : 'fa-solid fa-tent';
        div.innerHTML = '<div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background-color:' + tent.color + '22;color:' + tent.color + '"><i class="' + icon + '"></i></div><div class="flex-1 min-w-0"><div class="font-medium text-sm">' + tent.name + '</div><div class="text-xs text-slate-500">' + (tent.sleeps > 0 ? tent.sleeps + ' person' : 'Support') + ' • ' + tent.footprint + '</div></div><div class="text-xs font-mono text-emerald-700">' + tent.remaining + ' left</div>';
        div.onclick = function() { tent.remaining > 0 ? placeTentOnGrid(tent.id) : alert('No more available!'); };
        container.appendChild(div);
    });
}

function placeTentOnGrid(inventoryId, x, y) {
    const invTent = tentInventory.find(t => t.id === inventoryId);
    if (!invTent || invTent.remaining <= 0) return;
    placedTents.push({
        id: nextTentId++,
        inventoryId: inventoryId,
        name: invTent.name,
        sleeps: invTent.sleeps,
        genderPolicy: invTent.sleeps > 0 ? 'Mixed' : null,
        x: x || (100 + Math.random() * 700),
        y: y || (140 + Math.random() * 450),
        assignedScouts: [],
        color: invTent.color,
        isSupport: invTent.isSupport || false,
        note: '',
        allowedTypes: invTent.isSupport ? [] : ['Scout', 'Young Leader', 'Leader'],
        footprint: invTent.footprint,
        customCapacity: null
    });
    invTent.remaining--;
    renderPlacedTents();
    renderInventory();
    updateCounts();
    debouncedSave();
}

function renderPlacedTents() {
    const grid = document.getElementById('campsite-grid');
    grid.querySelectorAll('.placed-tent').forEach(el => el.remove());
    placedTents.forEach(function(tent) {
        const el = document.createElement('div');
        const size = getVisualSize(tent);
        el.className = 'placed-tent flex flex-col items-center justify-center text-center p-1.5 rounded-2xl border-2 ' + (tent.isSupport ? 'bg-slate-100 border-slate-400' : 'bg-white border-emerald-700');
        el.style.cssText = 'left:' + tent.x + 'px;top:' + tent.y + 'px;width:' + size.width + 'px;height:' + size.height + 'px';
        const cap = tent.customCapacity || tent.sleeps;
        const capText = tent.sleeps > 0 ? (tent.assignedScouts.length + '/' + cap) : '—';
        let genderHTML = '';
        if (tent.genderPolicy) {
            const gClass = tent.genderPolicy === 'M' ? 'gender-male' : (tent.genderPolicy === 'F' ? 'gender-female' : 'gender-mixed');
            genderHTML = '<div class="text-[9px] px-1.5 py-px rounded ' + gClass + '">' + tent.genderPolicy + '</div>';
        }
        const noteHTML = tent.note ? '<div class="note-text mt-1">' + tent.note + '</div>' : '';
        el.innerHTML = '<i class="fa-solid ' + (tent.isSupport ? 'fa-store' : 'fa-tent') + ' text-2xl mb-0.5" style="color:' + tent.color + '"></i><div class="font-semibold text-xs">' + getTentDisplayName(tent) + '</div><div class="text-[10px] font-mono text-emerald-700">' + capText + '</div>' + genderHTML + noteHTML;
        let dragging = false, startX, startY, ix, iy;
        el.onmousedown = function(e) {
            if (e.button !== 0 || currentMode !== 'normal') return;
            dragging = true; startX = e.clientX; startY = e.clientY; ix = tent.x; iy = tent.y;
            el.style.zIndex = '50';
        };
        document.addEventListener('mousemove', function(e) {
            if (!dragging) return;
            tent.x = Math.max(10, Math.min(1050, ix + e.clientX - startX));
            tent.y = Math.max(10, Math.min(720, iy + e.clientY - startY));
            el.style.left = tent.x + 'px';
            el.style.top = tent.y + 'px';
        });
        document.addEventListener('mouseup', function() {
            if (!dragging) return;
            dragging = false;
            el.style.zIndex = '30';
            tent.x = Math.round(tent.x / 20) * 20;
            tent.y = Math.round(tent.y / 20) * 20;
            el.style.left = tent.x + 'px';
            el.style.top = tent.y + 'px';
            debouncedSave();
        });
        el.onclick = function() { if (!dragging && currentMode === 'normal') showAssignmentModal(tent.id); };
        el.oncontextmenu = function(e) { e.preventDefault(); if (confirm('Remove ' + getTentDisplayName(tent) + '?')) removePlacedTent(tent.id); };
        grid.appendChild(el);
    });
}

function removePlacedTent(placedId) {
    const index = placedTents.findIndex(t => t.id === placedId);
    if (index === -1) return;
    const tent = placedTents[index];
    const inv = tentInventory.find(i => i.id === tent.inventoryId);
    if (inv) inv.remaining++;
    placedTents.splice(index, 1);
    renderPlacedTents();
    renderInventory();
    renderScoutsList();
    updateCounts();
    debouncedSave();
}

function setMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('bg-white', 'shadow'));
    document.getElementById(mode === 'normal' ? 'mode-normal' : 'mode-zone').classList.add('bg-white', 'shadow');
    const grid = document.getElementById('campsite-grid');
    if (mode === 'zone') { grid.style.cursor = 'crosshair'; grid.onmousedown = startZoneDraw; }
    else { grid.style.cursor = 'default'; grid.onmousedown = null; }
}

function startZoneDraw(e) {
    if (currentMode !== 'zone') return;
    isDrawingZone = true;
    const rect = e.currentTarget.getBoundingClientRect();
    zoneStartX = e.clientX - rect.left; zoneStartY = e.clientY - rect.top;
    currentZoneEl = document.createElement('div');
    currentZoneEl.className = 'zone-rect absolute';
    currentZoneEl.style.cssText = 'left:' + zoneStartX + 'px;top:' + zoneStartY + 'px;width:0;height:0';
    document.getElementById('campsite-grid').appendChild(currentZoneEl);
    document.onmousemove = drawZone;
    document.onmouseup = finishZoneDraw;
}

function drawZone(e) {
    if (!isDrawingZone || !currentZoneEl) return;
    const rect = document.getElementById('campsite-grid').getBoundingClientRect();
    const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
    currentZoneEl.style.left = Math.min(zoneStartX, cx) + 'px';
    currentZoneEl.style.top = Math.min(zoneStartY, cy) + 'px';
    currentZoneEl.style.width = Math.abs(cx - zoneStartX) + 'px';
    currentZoneEl.style.height = Math.abs(cy - zoneStartY) + 'px';
}

function finishZoneDraw() {
    if (!isDrawingZone || !currentZoneEl) return;
    isDrawingZone = false; document.onmousemove = null; document.onmouseup = null;
    const w = parseInt(currentZoneEl.style.width), h = parseInt(currentZoneEl.style.height);
    if (w < 50 || h < 50) { currentZoneEl.remove(); currentZoneEl = null; return; }
    const label = prompt('Zone name (e.g. Leaders Area, Cooking)', 'New Zone');
    if (!label) { currentZoneEl.remove(); currentZoneEl = null; return; }
    zones.push({ id: Date.now(), x: parseInt(currentZoneEl.style.left), y: parseInt(currentZoneEl.style.top), w: w, h: h, label: label, color: '#166534' });
    currentZoneEl.remove(); currentZoneEl = null;
    renderZones(); debouncedSave();
}

function renderZones() {
    const grid = document.getElementById('campsite-grid');
    grid.querySelectorAll('.zone-rect').forEach(el => el.remove());
    zones.forEach(function(zone, idx) {
        const el = document.createElement('div');
        el.className = 'zone-rect absolute flex items-center justify-center text-center p-1';
        el.style.cssText = 'left:' + zone.x + 'px;top:' + zone.y + 'px;width:' + zone.w + 'px;height:' + zone.h + 'px;border-color:' + zone.color + ';z-index:5';
        el.innerHTML = '<div class="text-xs font-semibold text-emerald-800 px-2 py-1 rounded" style="background:rgba(255,255,255,0.85)">' + zone.label + '</div>';
        el.onclick = function(e) {
            e.stopImmediatePropagation();
            const newLabel = prompt('Edit zone name:', zone.label);
            if (newLabel) { zone.label = newLabel; renderZones(); debouncedSave(); }
            else if (confirm('Delete this zone?')) { zones.splice(idx, 1); renderZones(); debouncedSave(); }
        };
        grid.appendChild(el);
    });
}

function uploadBackground() {
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
    input.onchange = function(e) {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            backgroundImageData = ev.target.result;
            backgroundRotation = 0; backgroundScale = 100;
            document.getElementById('rotate-slider').value = 0;
            document.getElementById('rotate-value').textContent = '0°';
            document.getElementById('bg-scale-slider').value = 100;
            document.getElementById('bg-scale-value').textContent = '100%';
            applyBackgroundTransform();
            debouncedSave();
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function applyBackgroundTransform() {
    const layer = document.getElementById('background-layer');
    if (!layer || !backgroundImageData) { if (layer) layer.style.backgroundImage = 'none'; return; }
    layer.style.backgroundImage = 'url(' + backgroundImageData + ')';
    layer.style.backgroundSize = 'cover';
    layer.style.transform = 'rotate(' + backgroundRotation + 'deg) scale(' + (backgroundScale / 100) + ')';
    layer.style.transformOrigin = 'center center';
}

function rotateBackgroundLive() {
    backgroundRotation = parseInt(document.getElementById('rotate-slider').value);
    document.getElementById('rotate-value').textContent = backgroundRotation + '°';
    applyBackgroundTransform();
    debouncedSave();
}

function updateBackgroundScale() {
    backgroundScale = parseInt(document.getElementById('bg-scale-slider').value);
    document.getElementById('bg-scale-value').textContent = backgroundScale + '%';
    applyBackgroundTransform();
    debouncedSave();
}

function resetBackgroundTransform() {
    backgroundRotation = 0; backgroundScale = 100;
    document.getElementById('rotate-slider').value = 0;
    document.getElementById('rotate-value').textContent = '0°';
    document.getElementById('bg-scale-slider').value = 100;
    document.getElementById('bg-scale-value').textContent = '100%';
    applyBackgroundTransform();
    debouncedSave();
}

function clearBackground() {
    backgroundImageData = null;
    resetBackgroundTransform();
    const layer = document.getElementById('background-layer');
    if (layer) layer.style.backgroundImage = 'none';
}

function adjustZoom(delta) {
    currentZoom = Math.max(50, Math.min(150, currentZoom + delta));
    document.getElementById('campsite-grid').style.transform = 'scale(' + (currentZoom / 100) + ')';
    document.getElementById('zoom-level').textContent = currentZoom + '%';
}

function updateScale() {
    currentScale = parseInt(document.getElementById('scale-input').value) || 20;
    renderPlacedTents();
    updateScaleLabel();
    debouncedSave();
}

function updateScaleLabel() {
    const label = document.getElementById('scale-label');
    if (label) label.textContent = Math.round(500 / currentScale) + ' m';
}

function importCampersCSV() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.csv';
    input.onchange = function(e) {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            const lines = ev.target.result.split(/\r?\n/).filter(function(l) { return l.trim(); });
            if (lines.length < 2) { alert('CSV needs header + data'); return; }
            const headers = lines[0].toLowerCase().split(',').map(function(h) { return h.trim(); });
            const nameIdx = headers.indexOf('name');
            const genderIdx = headers.indexOf('gender');
            const typeIdx = headers.indexOf('type');
            if (nameIdx === -1) { alert("CSV must have 'name' column"); return; }
            let added = 0;
            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(',').map(function(c) { return c.trim().replace(/^"|"$/g, ''); });
                if (!cols[nameIdx]) continue;
                const name = cols[nameIdx];
                if (scouts.some(function(s) { return s.name.toLowerCase() === name.toLowerCase(); })) continue;
                scouts.push({
                    id: nextScoutId++,
                    name: name,
                    gender: (genderIdx >= 0 && cols[genderIdx]) ? cols[genderIdx].toUpperCase().charAt(0) : 'M',
                    type: (typeIdx >= 0 && cols[typeIdx]) ? cols[typeIdx] : 'Scout'
                });
                added++;
            }
            renderScoutsList(); updateCounts(); debouncedSave();
            alert('Imported ' + added + ' people');
        };
        reader.readAsText(file);
    };
    input.click();
}
