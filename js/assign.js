let currentTentId = null;

function showAssignmentModal(placedId) {
    currentTentId = placedId;
    const tent = placedTents.find(t => t.id === placedId);
    if (!tent) return;
    const modal = document.getElementById('assignment-modal');
    const content = document.getElementById('assignment-content');
    const removeBtn = document.getElementById('remove-all-btn');
    if (tent.isSupport) {
        content.innerHTML = '<div class="text-center py-4"><i class="fa-solid fa-store text-3xl text-slate-400 mb-2"></i><div class="font-semibold">Support structure</div><div class="text-xs text-slate-500 mt-1">No people can be assigned.</div></div><div><label class="text-sm font-medium block mb-1">Note (shows on map)</label><input type="text" id="tent-note" maxlength="65" class="w-full border border-slate-300 rounded-2xl px-4 py-2 text-sm" value="' + (tent.note || '') + '" onblur="saveTentNote()"></div>';
        removeBtn.style.display = 'none';
    } else {
        content.innerHTML = '<div><div class="flex justify-between text-sm mb-1.5"><span class="font-medium">Capacity</span><span id="modal-capacity" class="font-mono text-emerald-700"></span></div><div class="h-2.5 bg-slate-100 rounded-full overflow-hidden"><div id="modal-capacity-bar" class="h-2.5 bg-emerald-600 rounded-full" style="width:0%"></div></div></div><div class="grid grid-cols-2 gap-4"><div><label class="text-sm font-medium block mb-1.5">Gender policy</label><div class="flex gap-2" id="gender-policy-buttons"></div></div><div><label class="text-sm font-medium block mb-1.5">Allowed for</label><div class="flex flex-wrap gap-1" id="allowed-types-buttons"></div></div></div><div class="grid grid-cols-2 gap-4"><div><label class="text-sm font-medium block mb-1">Custom capacity</label><input type="number" id="custom-capacity" min="1" max="20" class="w-full border rounded-2xl px-4 py-2 text-sm" onblur="saveCustomCapacity()"><div class="text-[10px] text-slate-500 mt-0.5">Blank uses default</div></div><div><label class="text-sm font-medium block mb-1">Note</label><input type="text" id="tent-note" maxlength="65" class="w-full border rounded-2xl px-4 py-2 text-sm" onblur="saveTentNote()"></div></div><div><div class="flex justify-between items-center mb-2"><span class="text-sm font-medium">Assigned</span><span id="modal-assigned-count" class="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full"></span></div><div id="modal-assigned-list" class="max-h-[110px] overflow-auto border rounded-2xl p-1 text-sm"></div></div><div><label class="text-sm font-medium block mb-1.5">Add person</label><input type="text" id="add-scout-search" placeholder="Search..." onkeyup="filterModalScouts()" class="w-full text-sm border rounded-2xl px-3 py-2"><div id="modal-available-list" class="mt-2 max-h-[130px] overflow-auto border rounded-2xl p-1 text-sm"></div></div>';
        removeBtn.style.display = 'block';
        const cap = tent.customCapacity || tent.sleeps;
        const assigned = tent.assignedScouts.length;
        document.getElementById('modal-capacity').textContent = assigned + ' / ' + cap;
        document.getElementById('modal-capacity-bar').style.width = Math.min(100, cap ? (assigned / cap) * 100 : 0) + '%';
        const policyDiv = document.getElementById('gender-policy-buttons');
        ['M','F','Mixed'].forEach(function(p) {
            const btn = document.createElement('button');
            btn.className = 'px-3 py-1 text-xs font-medium rounded-2xl border ' + (tent.genderPolicy === p ? 'bg-emerald-700 text-white border-emerald-700' : 'border-slate-300');
            btn.textContent = p === 'M' ? 'Male' : (p === 'F' ? 'Female' : 'Mixed');
            btn.onclick = function() { tent.genderPolicy = p; showAssignmentModal(placedId); };
            policyDiv.appendChild(btn);
        });
        const typesDiv = document.getElementById('allowed-types-buttons');
        ['Scout','Young Leader','Leader'].forEach(function(type) {
            const checked = tent.allowedTypes.includes(type);
            const label = document.createElement('label');
            label.className = 'flex items-center gap-x-1 text-xs px-2 py-1 border rounded-2xl cursor-pointer ' + (checked ? 'bg-emerald-100 border-emerald-300' : 'border-slate-300');
            label.innerHTML = '<input type="checkbox" ' + (checked ? 'checked' : '') + ' class="accent-emerald-600" onchange="toggleAllowedType(\'' + type + '\', this.checked)"> <span>' + type + '</span>';
            typesDiv.appendChild(label);
        });
        document.getElementById('tent-note').value = tent.note || '';
        document.getElementById('custom-capacity').value = tent.customCapacity || '';
        renderAssignedList(tent);
        renderAvailableScouts(tent);
    }
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function toggleAllowedType(type, checked) {
    const tent = placedTents.find(t => t.id === currentTentId);
    if (!tent) return;
    if (checked && !tent.allowedTypes.includes(type)) tent.allowedTypes.push(type);
    else if (!checked) tent.allowedTypes = tent.allowedTypes.filter(t => t !== type);
    debouncedSave();
}

function saveCustomCapacity() {
    const tent = placedTents.find(t => t.id === currentTentId);
    if (!tent) return;
    const val = document.getElementById('custom-capacity').value;
    tent.customCapacity = val ? parseInt(val) : null;
    renderPlacedTents();
    debouncedSave();
}

function saveTentNote() {
    const tent = placedTents.find(t => t.id === currentTentId);
    if (!tent) return;
    tent.note = document.getElementById('tent-note').value.trim();
    renderPlacedTents();
    debouncedSave();
}

function renderAssignedList(tent) {
    const container = document.getElementById('modal-assigned-list');
    container.innerHTML = '';
    if (!tent.assignedScouts.length) {
        container.innerHTML = '<div class="px-3 py-4 text-center text-xs text-slate-400">Nobody assigned</div>';
        document.getElementById('modal-assigned-count').textContent = '0';
        return;
    }
    const cap = tent.customCapacity || tent.sleeps;
    document.getElementById('modal-assigned-count').textContent = tent.assignedScouts.length + '/' + cap;
    tent.assignedScouts.forEach(function(scoutId) {
        const scout = scouts.find(s => s.id === scoutId);
        if (!scout) return;
        const row = document.createElement('div');
        row.className = 'flex items-center justify-between px-3 py-2 hover:bg-slate-50 rounded-xl';
        const genderClass = scout.gender === 'M' ? 'gender-male' : 'gender-female';
        row.innerHTML = '<div class="flex items-center gap-x-2"><span class="font-medium text-sm">' + scout.name + '</span><span class="px-1.5 py-px text-[9px] rounded ' + genderClass + '">' + scout.gender + '</span></div><button class="text-red-400 px-1" onclick="event.stopImmediatePropagation(); removeScoutFromTent(' + scoutId + ', true)"><i class="fa-solid fa-times"></i></button>';
        container.appendChild(row);
    });
}

function renderAvailableScouts(tent) {
    const container = document.getElementById('modal-available-list');
    container.innerHTML = '';
    const available = scouts.filter(function(s) {
        if (tent.assignedScouts.includes(s.id)) return false;
        if (tent.genderPolicy === 'M' && s.gender !== 'M') return false;
        if (tent.genderPolicy === 'F' && s.gender !== 'F') return false;
        if (!tent.allowedTypes.includes(s.type)) return false;
        return true;
    });
    if (!available.length) {
        container.innerHTML = '<div class="px-3 py-3 text-center text-xs text-slate-400">No matching people</div>';
        return;
    }
    available.forEach(function(scout) {
        const row = document.createElement('div');
        row.className = 'flex items-center justify-between px-3 py-2 hover:bg-emerald-50 rounded-xl cursor-pointer';
        const genderClass = scout.gender === 'M' ? 'gender-male' : 'gender-female';
        const assignedTent = getAssignedTent(scout.id);
        row.innerHTML = '<div><span class="font-medium text-sm">' + scout.name + '</span><span class="ml-1.5 px-1.5 py-px text-[9px] rounded ' + genderClass + '">' + scout.gender + '</span><span class="ml-1 text-[9px] text-slate-500">(' + scout.type + ')</span>' + (assignedTent ? '<span class="ml-2 text-[10px] text-orange-500">(in ' + getTentDisplayName(assignedTent) + ')</span>' : '') + '</div><i class="fa-solid fa-plus text-emerald-600"></i>';
        row.onclick = function() { addScoutToTent(scout.id, tent.id); };
        container.appendChild(row);
    });
}

function filterModalScouts() {
    const search = document.getElementById('add-scout-search').value.toLowerCase();
    document.getElementById('modal-available-list').querySelectorAll('div').forEach(function(row) {
        row.style.display = row.textContent.toLowerCase().includes(search) ? '' : 'none';
    });
}

function addScoutToTent(scoutId, placedTentId) {
    const tent = placedTents.find(t => t.id === placedTentId);
    if (!tent || tent.isSupport) return;
    const scout = scouts.find(s => s.id === scoutId);
    if (!scout) return;
    const cap = tent.customCapacity || tent.sleeps;
    if (tent.assignedScouts.length >= cap) { alert('Tent at capacity'); return; }
    if ((tent.genderPolicy === 'M' && scout.gender !== 'M') || (tent.genderPolicy === 'F' && scout.gender !== 'F')) {
        if (!confirm('Gender mismatch. Add anyway?')) return;
    }
    if (!tent.allowedTypes.includes(scout.type)) {
        if (!confirm(scout.type + ' not allowed on this tent. Add anyway?')) return;
    }
    const foes = relationships.foes.filter(function(pair) {
        return (pair[0] === scoutId && tent.assignedScouts.includes(pair[1])) || (pair[1] === scoutId && tent.assignedScouts.includes(pair[0]));
    });
    if (foes.length && !confirm('Warning: a listed foe is already in this tent. Add anyway?')) return;
    tent.assignedScouts.push(scoutId);
    showAssignmentModal(placedTentId);
    renderScoutsList();
    renderPlacedTents();
    updateCounts();
    debouncedSave();
}

function removeScoutFromTent(scoutId, fromModal) {
    placedTents.forEach(function(tent) {
        const idx = tent.assignedScouts.indexOf(scoutId);
        if (idx !== -1) tent.assignedScouts.splice(idx, 1);
    });
    if (fromModal && currentTentId) showAssignmentModal(currentTentId);
    renderScoutsList();
    renderPlacedTents();
    updateCounts();
    debouncedSave();
}

function removeAllFromTent() {
    const tent = placedTents.find(t => t.id === currentTentId);
    if (!tent || !confirm('Remove all from ' + getTentDisplayName(tent) + '?')) return;
    tent.assignedScouts = [];
    showAssignmentModal(currentTentId);
    renderScoutsList();
    renderPlacedTents();
    updateCounts();
    debouncedSave();
}

function closeAssignmentModal() {
    document.getElementById('assignment-modal').classList.remove('flex');
    document.getElementById('assignment-modal').classList.add('hidden');
    renderScoutsList();
    renderPlacedTents();
}

function showAddScoutModal() {
    document.getElementById('add-scout-modal').classList.remove('hidden');
    document.getElementById('add-scout-modal').classList.add('flex');
    document.getElementById('new-scout-name').focus();
}
function closeAddScoutModal() {
    document.getElementById('add-scout-modal').classList.remove('flex');
    document.getElementById('add-scout-modal').classList.add('hidden');
}
function addNewScout() {
    const name = document.getElementById('new-scout-name').value.trim();
    if (!name) return alert('Name required');
    scouts.push({ id: nextScoutId++, name: name, gender: document.getElementById('new-scout-gender').value, type: document.getElementById('new-scout-type').value });
    closeAddScoutModal();
    renderScoutsList();
    updateCounts();
    document.getElementById('new-scout-name').value = '';
    debouncedSave();
}

function showScoutOptions(scoutId) {
    const scout = scouts.find(s => s.id === scoutId);
    if (!scout) return;
    document.getElementById('edit-scout-id').value = scoutId;
    document.getElementById('edit-scout-name').value = scout.name;
    document.getElementById('edit-scout-gender').value = scout.gender;
    document.getElementById('edit-scout-type').value = scout.type;
    document.getElementById('edit-scout-modal').classList.remove('hidden');
    document.getElementById('edit-scout-modal').classList.add('flex');
}
function closeEditScoutModal() {
    document.getElementById('edit-scout-modal').classList.remove('flex');
    document.getElementById('edit-scout-modal').classList.add('hidden');
}
function saveEditedScout() {
    const scoutId = parseInt(document.getElementById('edit-scout-id').value);
    const scout = scouts.find(s => s.id === scoutId);
    if (!scout) return;
    scout.name = document.getElementById('edit-scout-name').value.trim();
    scout.gender = document.getElementById('edit-scout-gender').value;
    scout.type = document.getElementById('edit-scout-type').value;
    closeEditScoutModal();
    renderScoutsList();
    renderPlacedTents();
    debouncedSave();
}
