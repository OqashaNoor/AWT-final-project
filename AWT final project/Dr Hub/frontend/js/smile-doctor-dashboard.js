/**
 * Doctor Hub doctor dashboard — layout + data wiring.
 */
function scServerOrigin() {
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
        return window.location.origin;
    }
    return 'http://localhost:5000';
}

var scState = {
    doctorId: null,
    doctor: null,
    appointments: [],
    patients: [],
    chartRange: 'week',
};

function scResolveUrl(imagePath) {
    if (!imagePath || typeof imagePath !== 'string') return '';
    var trimmed = imagePath.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    var base = scServerOrigin();
    if (trimmed.charAt(0) === '/') return base + trimmed;
    return base + '/' + trimmed.replace(/^\/+/, '');
}

function scAptDate(apt) {
    var raw = apt.date || apt.appointmentDate;
    return raw ? new Date(raw) : null;
}

function scAptTime(apt) {
    return apt.time || apt.appointmentTime || '';
}

function scTreatment(apt) {
    return apt.treatment || apt.reason || 'Visit';
}

function scIsSameDay(d1, d2) {
    return d1 && d2 &&
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();
}

function scDerivedStatus(aptsForPatient, now) {
    var active = ['confirmed', 'completed', 'scheduled', 'rescheduled'];
    var hasFuture = false;
    var hasPendingSoon = false;

    for (var i = 0; i < (aptsForPatient || []).length; i++) {
        var a = aptsForPatient[i];
        var dt = scAptDate(a);
        if (!dt) continue;
        var st = (a.status || '').toLowerCase();
        if (st !== 'cancelled' && st !== 'rejected' && dt >= now) hasFuture = true;
        if (st === 'pending' && dt >= now && (dt - now) < 48 * 60 * 60 * 1000) hasPendingSoon = true;
    }

    var last = null;
    var cand = [];
    for (var j = 0; j < (aptsForPatient || []).length; j++) {
        var ap = aptsForPatient[j];
        var d = scAptDate(ap);
        if (d && d < now && active.indexOf((ap.status || '').toLowerCase()) >= 0) cand.push(ap);
    }
    cand.sort(function(a, b) {
        return scAptDate(b) - scAptDate(a);
    });
    last = cand[0];

    if (hasPendingSoon) return 'Urgent';
    if (last && (last.status || '').toLowerCase() === 'pending') return 'Pending';
    if (!last && !hasFuture) return 'Pending';
    return 'Active';
}

function scPatientRowsFromData(patients, appointments) {
    var now = new Date();
    var map = {};

    for (var p = 0; p < (patients || []).length; p++) {
        var pt = patients[p];
        map[String(pt.id)] = { patient: pt, apts: [] };
    }

    for (var k = 0; k < (appointments || []).length; k++) {
        var apt = appointments[k];
        var pidObj = apt.patientId;
        var pid = typeof pidObj === 'object' && pidObj !== null ? String(pidObj._id || '') : String(pidObj || '');
        if (!pid) continue;

        var pname = apt.patientName || (typeof pidObj === 'object' && pidObj ? pidObj.name : '');

        if (!map[pid]) {
            map[pid] = {
                patient: {
                    id: pid,
                    name: pname || 'Patient',
                    email: typeof pidObj === 'object' && pidObj ? pidObj.email || '' : '',
                    phone: typeof pidObj === 'object' && pidObj ? pidObj.phone || '' : '',
                    profileImage: typeof pidObj === 'object' && pidObj ? pidObj.profileImage : null,
                    initial: (pname || 'P').charAt(0).toUpperCase(),
                },
                apts: [],
            };
        }

        map[pid].apts.push(apt);
        if (!map[pid].patient.name && pname) map[pid].patient.name = pname;
        if (typeof pidObj === 'object' && pidObj) {
            if (pidObj.email && !map[pid].patient.email) map[pid].patient.email = pidObj.email;
            if (pidObj.phone && !map[pid].patient.phone) map[pid].patient.phone = pidObj.phone;
        }
    }

    var ids = Object.keys(map);
    var rows = [];
    for (var r = 0; r < ids.length; r++) {
        var id = ids[r];
        var block = map[id];
        var p = block.patient;
        var apts = block.apts;

        var past = [];
        var future = [];
        for (var u = 0; u < apts.length; u++) {
            var ax = apts[u];
            var dx = scAptDate(ax);
            if (!dx) continue;
            var sx = (ax.status || '').toLowerCase();
            if (sx === 'cancelled') continue;
            if (dx < now) past.push(ax);
            else if (sx !== 'rejected') future.push(ax);
        }
        past.sort(function(a, b) {
            return scAptDate(b) - scAptDate(a);
        });
        future.sort(function(a, b) {
            return scAptDate(a) - scAptDate(b);
        });

        var last = past[0];
        var next = future[0];
        var status = scDerivedStatus(apts, now);

        var lastTxt = '\u2014';
        if (last) {
            lastTxt =
                scAptTime(last) +
                ' · ' +
                scTreatment(last) +
                '<br><span class="sc-patient-sub">' +
                scAptDate(last).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                }) +
                '</span>';
        }

        var nextTxt = '\u2014';
        if (next) {
            nextTxt =
                scAptDate(next).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                }) +
                '<br><span class="sc-patient-sub">' +
                scTreatment(next) +
                '</span>';
        }

        rows.push({
            patient: p,
            lastTxt: lastTxt,
            nextTxt: nextTxt,
            status: status,
        });
    }

    rows.sort(function(a, b) {
        return (a.patient.name || '').localeCompare(b.patient.name || '');
    });
    return rows;
}

function scBadgeClass(st) {
    if (st === 'Pending') return 'sc-badge sc-badge-pending';
    if (st === 'Urgent') return 'sc-badge sc-badge-urgent';
    return 'sc-badge sc-badge-active';
}

function scRenderRegistryTbody(rows, tbodyId, search, statusFilter) {
    var tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    var term = ((search || '') + '').toLowerCase();

    tbody.innerHTML = '';
    var shown = 0;

    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var p = row.patient;
        var st = row.status;

        if (statusFilter && statusFilter !== 'all' && st !== statusFilter) continue;

        var blob = (
            (p.name || '') + ' ' +
            (p.email || '') + ' ' +
            (p.phone || '') + ' ' +
            String(p.id || '')
        ).toLowerCase();
        if (term && blob.indexOf(term) === -1) continue;

        var imgUrl = scResolveUrl(p.profileImage);
        var avatarCell =
            imgUrl ?
                '<img class="sc-table-avatar" src="' + imgUrl + '" alt="">' :
                '<div class="sc-table-avatar">' + (p.initial || '?') + '</div>';

        var tr = document.createElement('tr');
        tr.dataset.status = st;
        tr.innerHTML =
            '<td>' +
            '<div class="sc-patient-cell">' +
            avatarCell +
            '<div>' +
            '<div class="sc-patient-name">' + escapeHtml(p.name || '') + '</div>' +
            '<div class="sc-patient-sub">' +
            'ID: ' + escapeHtml(String(p.id || '').slice(-8)) +
            '</div>' +
            '</div>' +
            '</div>' +
            '</td>' +
            '<td>' +
            '<div class="sc-contact-mail">' + escapeHtml(p.email || '\u2014') + '</div>' +
            '<div class="sc-patient-sub">' + escapeHtml(p.phone || '\u2014') + '</div>' +
            '</td>' +
            '<td>' + row.lastTxt + '</td>' +
            '<td>' + row.nextTxt + '</td>' +
            '<td><span class="' + scBadgeClass(st) + '">' + escapeHtml(st) + '</span></td>' +
            '<td>' +
            '<div class="sc-actions-btns">' +
            '<button type="button" class="sc-icon-btn" title="Patient overview" onclick="window.scPatientOverview(\'' +
            String(p.id).replace(/'/g, "\\'") +
            '\')">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>' +
            '</svg>' +
            '</button>' +
            '<button type="button" class="sc-icon-btn" title="Book appointment" onclick="window.scJumpAppointments(\'' +
            escapeJs(p.name) +
            '\')">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
            '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>' +
            '<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>' +
            '</svg>' +
            '</button>' +
            '<button type="button" class="sc-icon-btn" title="Medical history & prescriptions" onclick="window.scViewPatient(\'' +
            String(p.id).replace(/'/g, "\\'") +
            '\')">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>' +
            '<rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>' +
            '</svg>' +
            '</button>' +
            '</div>' +
            '</td>';

        tbody.appendChild(tr);
        shown++;
    }

    if (shown === 0) {
        var empty = document.createElement('tr');
        empty.innerHTML =
            '<td colspan="6" style="text-align:center;color:#6b8286;padding:2rem">' +
            'No patients match these filters.' +
            '</td>';
        tbody.appendChild(empty);
    }
}

function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeJs(s) {
    return String(s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function scFindPatientInState(patientId) {
    var want = String(patientId || '');
    var arr = scState.patients || [];
    for (var i = 0; i < arr.length; i++) {
        if (String(arr[i].id || '') === want) return arr[i];
    }
    return null;
}

function scInferPatientFromAppointments(patientId) {
    var pid = String(patientId || '');
    var appts = scState.appointments || [];
    for (var i = 0; i < appts.length; i++) {
        var apt = appts[i];
        var pidObj = apt.patientId;
        var id = typeof pidObj === 'object' && pidObj ? String(pidObj._id || '') : String(pidObj || '');
        if (id !== pid) continue;
        var pname =
            apt.patientName ||
            (typeof pidObj === 'object' && pidObj ? pidObj.name : '') ||
            'Patient';
        var email = typeof pidObj === 'object' && pidObj ? pidObj.email || '' : '';
        var phone = typeof pidObj === 'object' && pidObj ? pidObj.phone || '' : '';
        var profileImage =
            typeof pidObj === 'object' && pidObj ? pidObj.profileImage : undefined;
        return {
            id: pid,
            name: pname,
            email: email,
            phone: phone,
            profileImage: profileImage,
            initial: (pname.charAt(0) || '?').toUpperCase(),
        };
    }
    return null;
}

window.scPatientOverview = function(patientId) {
    var modal = document.getElementById('scPatientHistoryModal');
    var body = document.getElementById('scPatientHistoryBody');
    var ttl = document.getElementById('scPatientModalTitle');
    if (!modal || !body) return;

    var p = scFindPatientInState(patientId) || scInferPatientFromAppointments(patientId);
    if (ttl) ttl.textContent = 'Patient overview';

    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');

    if (!p) {
        body.innerHTML =
            '<div class="sc-patient-sub">No saved contact info for this patient yet.</div>';
        return;
    }

    var imgHtml = '';
    var imgSrc = scResolveUrl(p.profileImage);
    if (imgSrc) {
        imgHtml =
            '<img class="sc-rx-thumb" style="max-height:120px;width:auto" src="' +
            escapeHtml(imgSrc) +
            '" alt="">';
    }

    body.innerHTML =
        '<div style="display:flex;gap:1rem;flex-wrap:wrap;align-items:flex-start">' +
        (imgHtml ? '<div>' + imgHtml + '</div>' : '') +
        '<div style="flex:1;min-width:12rem">' +
        '<p style="margin:0 0 .35rem;font-size:1.05rem;font-weight:700">' +
        escapeHtml(p.name || '') +
        '</p>' +
        '<p class="sc-patient-sub" style="margin:.5rem 0 0">' +
        'Patient ID<br><span style="color:#27464a">' +
        escapeHtml(String(p.id || '').slice(-12)) +
        '</span>' +
        '</p>' +
        '<p class="sc-patient-sub" style="margin:.5rem 0 0">Email<br>' +
        '<span style="color:#27464a">' +
        escapeHtml(p.email || '\u2014') +
        '</span></p>' +
        '<p class="sc-patient-sub" style="margin:.5rem 0 0">Phone<br>' +
        '<span style="color:#27464a">' +
        escapeHtml(p.phone || '\u2014') +
        '</span></p>' +
        '</div></div>';
};

window.scJumpAppointments = function() {
    var btn = document.querySelector('.sc-nav-item[data-panel="appointments"]');
    if (btn) btn.click();
};

window.scViewPatient = function(patientId) {
    loadScPatientHistory(patientId);
};

function scUpdateDatePill() {
    var el = document.getElementById('scDateTimePill');
    if (!el) return;
    var now = new Date();
    var dateStr = now.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).toUpperCase();
    var timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    var day = now.toLocaleDateString('en-US', { weekday: 'long' });
    el.textContent = dateStr + ' | ' + timeStr + ' | ' + day;
}

function scRenderChart() {
    var range = scState.chartRange;
    var appts = scState.appointments || [];
    var now = new Date();
    var days = range === 'month' ? 30 : 7;
    var buckets = [];
    var labels = [];

    for (var d = days - 1; d >= 0; d--) {
        var day = new Date(now);
        day.setDate(day.getDate() - d);
        day.setHours(0, 0, 0, 0);
        labels.push(day);
        buckets.push(0);
    }

    for (var i = 0; i < appts.length; i++) {
        var ad = scAptDate(appts[i]);
        if (!ad) continue;
        ad.setHours(0, 0, 0, 0);
        for (var j = 0; j < labels.length; j++) {
            if (+ad === +labels[j]) {
                buckets[j]++;
                break;
            }
        }
    }

    var max = Math.max.apply(null, buckets.concat([1]));
    var w = 600;
    var h = 200;
    var pad = 20;
    var pts = [];

    for (var k = 0; k < buckets.length; k++) {
        var x = pad + (k / Math.max(buckets.length - 1, 1)) * (w - pad * 2);
        var y = h - pad - (buckets[k] / max) * (h - pad * 2);
        pts.push(Math.round(x) + ',' + Math.round(y));
    }

    var pathD =
        'M ' +
        pts
            .map(function(p, idx) {
                return (idx === 0 ? '' : 'L ') + p;
            })
            .join(' ');
    var areaD = pathD + ' L ' + (w - pad) + ',' + (h - pad) + ' L ' + pad + ',' + (h - pad) + ' Z';

    var gradId = 'scLin-' + Math.random().toString(36).slice(2, 9);

    var svgInner =
        '<svg viewBox="0 0 ' + w + ' ' + h + '" width="100%" height="220" preserveAspectRatio="xMidYMid meet">' +
        '<defs><linearGradient id="' +
        gradId +
        '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#0a7d8a" stop-opacity="0.35"/><stop offset="100%" stop-color="#005f6b" stop-opacity="0.03"/>' +
        '</linearGradient></defs>' +
        '<path d="' +
        areaD +
        '" fill="url(#' +
        gradId +
        ')" stroke="none"/>' +
        '<path d="' +
        pathD +
        '" fill="none" stroke="#005f6b" stroke-width="2.5" stroke-linecap="round"/>' +
        '</svg>';

    var a1 = document.getElementById('scChartArea');
    if (a1) {
        a1.style.borderStyle = 'solid';
        a1.style.borderWidth = '1px';
        a1.style.borderColor = '#e8eef0';
        a1.innerHTML = svgInner;
    }
}

function scRenderAppointmentsBoard() {
    var host = document.getElementById('scAppointmentsList');
    if (!host) return;
    host.innerHTML = '';

    var appts = scState.appointments || [];

    var filtEl = document.getElementById('scApptStatusFilter');
    var sel = filtEl && filtEl.value ? filtEl.value : 'all';

    var filtered = appts.filter(function(a) {
        if (sel === 'all') return true;
        var s = ((a.status || '') + '').toLowerCase().trim();
        if (sel === 'pending') return s === 'pending';
        if (sel === 'completed') return s === 'completed';
        if (sel === 'confirmed') {
            return s === 'confirmed' || s === 'scheduled' || s === 'rescheduled';
        }
        return s === sel;
    });

    var sorted = filtered.slice().sort(function(a, b) {
        var da = scAptDate(a);
        var db = scAptDate(b);
        if (!da && !db) return 0;
        if (!da) return 1;
        if (!db) return -1;
        var cmp = da - db;
        if (cmp !== 0) return cmp;
        return (scAptTime(a) + '').localeCompare(scAptTime(b) + '');
    });

    if (sorted.length === 0) {
        host.innerHTML =
            appts.length === 0 ?
                '<div style="padding:2rem;text-align:center;color:#6b8286">No appointments scheduled yet.</div>' :
                '<div style="padding:2rem;text-align:center;color:#6b8286">No appointments match this filter.</div>';
        return;
    }

    for (var i = 0; i < sorted.length; i++) {
        var apt = sorted[i];
        var pidObj = apt.patientId;
        var name =
            apt.patientName ||
            (typeof pidObj === 'object' && pidObj ? pidObj.name : 'Patient');

        var em =
            typeof pidObj === 'object' && pidObj ? pidObj.email || '' : '';

        var pidForActions =
            typeof pidObj === 'object' && pidObj ? String(pidObj._id || '') : String(pidObj || '');

        var d = scAptDate(apt);

        var dateLabel = d ? d.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        }) : '\u2014';

        var st = (apt.status || '').toLowerCase();
        var badgeClass = 'sc-badge sc-badge-' + (
            st === 'pending'
                ? 'pending'
                : st === 'completed'
                    ? 'active'
                    : st === 'rejected'
                        ? 'urgent'
                        : 'active'
        );

        var wrap = document.createElement('div');
        wrap.className = 'sc-appt-card';

        var body =
            '<div><strong style="font-size:1rem">' +
            escapeHtml(name) +
            '</strong>' +
            '<div class="sc-appt-meta">' +
            escapeHtml(scTreatment(apt)) +
            '</div>' +
            '<div class="sc-appt-meta">' +
            escapeHtml(dateLabel) +
            ' \u2022 ' +
            escapeHtml(scAptTime(apt)) +
            '</div>';

        if (em) body += '<div class="sc-appt-meta">' + escapeHtml(em) + '</div>';
        body += '</div>';

        var actionsHtml = '';
        actionsHtml +=
            '<div style="display:flex;flex-direction:column;gap:.5rem;align-items:flex-end">' +
            '<span class="' +
            badgeClass +
            '">' +
            escapeHtml(apt.status || '') +
            '</span>';

        if (pidForActions) {
            actionsHtml +=
                '<div class="sc-appt-actions">' +
                '<button type="button" class="sc-btn-mini sc-btn-mini-record" title="Medical history & prescriptions"' +
                ' onclick="window.scViewPatient(\'' +
                pidForActions.replace(/'/g, "\\'") +
                '\')">Medical record</button>' +
                '</div>';
        }

        if (st === 'pending') {
            var aid = String(apt._id || apt.id || '');
            actionsHtml +=
                '<div class="sc-appt-actions">' +
                '<button type="button" class="sc-btn-mini sc-btn-mini-accept" onclick="window.scConfirmApt(\'' +
                aid +
                '\')">Accept</button>' +
                '<button type="button" class="sc-btn-mini sc-btn-mini-reject" onclick="window.scRejectApt(\'' +
                aid +
                '\')">Reject</button>' +
                '</div>';
        }

        actionsHtml += '</div>';
        wrap.innerHTML = body + actionsHtml;

        host.appendChild(wrap);
    }
}
window.scConfirmApt = async function(apptId) {
    try {
        await apiCall('/appointments/confirm/' + apptId, 'PATCH');
        await refreshSmileDoctorDashboard(true);
        alert('Appointment confirmed.');
    } catch (err) {
        alert(err.message || 'Could not confirm');
    }
};

window.scRejectApt = async function(apptId) {
    if (!confirm('Reject this appointment?')) return;
    try {
        await apiCall('/appointments/reject/' + apptId, 'PATCH');
        await refreshSmileDoctorDashboard(true);
    } catch (err2) {
        alert(err2.message || 'Could not reject');
    }
};

function scHydrateDoctorUI(d, user) {
    scState.doctorId = d.id || d._id;
    var name = (d.name || user.name || 'Doctor').trim();
    var titleLine = (((d.specialization || '') || 'GENERAL MEDICINE') + '').toUpperCase();
    if (d.yearsOfExperience) titleLine += ' · ' + d.yearsOfExperience + '+ YRS EXPERIENCE';

    var headerName = document.getElementById('scHeaderDoctorName');
    var roleEl = document.getElementById('scHeaderDoctorRole');
    if (headerName) headerName.textContent = 'Dr. ' + name.replace(/^Dr\.?\s*/i, '');
    if (roleEl) roleEl.textContent = (d.specialization || 'Chief surgeon').toUpperCase();

    var initials = name.replace(/^Dr\.?\s*/i, '').slice(0, 2).toUpperCase();

    var avatarPath = '';
    if (d.profileImage != null && String(d.profileImage).trim() !== '') {
        avatarPath = String(d.profileImage).trim();
    }

    var hImg = document.getElementById('scHeaderAvatar');
    var hInit = document.getElementById('scHeaderAvatarInit');
    if (avatarPath) {
        var hUrl = scResolveUrl(avatarPath);
        if (hImg) {
            hImg.src = hUrl;
            hImg.style.display = 'block';
        }
        if (hInit) hInit.style.display = 'none';
    } else {
        if (hImg) {
            hImg.style.display = 'none';
            hImg.removeAttribute('src');
        }
        if (hInit) {
            hInit.style.display = 'grid';
            hInit.textContent = initials.slice(0, 2);
        }
    }

    var wrap = document.querySelector('.sc-card-doctor .sc-doctor-photo-wrap');
    var dImg = document.getElementById('scDoctorPhoto');
    var ph = document.getElementById('scDoctorPhotoPh');
    var cardInitials = initials.slice(0, 2) || 'DR';

    if (wrap) wrap.classList.remove('has-photo');
    if (dImg) {
        dImg.removeAttribute('src');
        dImg.alt = name || '';
    }
    if (ph) ph.textContent = cardInitials;

    if (wrap && dImg && ph && avatarPath) {
        var fullUrl = scResolveUrl(avatarPath);
        var loader = new Image();
        loader.onload = function() {
            dImg.src = fullUrl;
            dImg.alt = name || 'Doctor profile';
            wrap.classList.add('has-photo');
        };
        loader.onerror = function() {
            wrap.classList.remove('has-photo');
            dImg.removeAttribute('src');
            ph.textContent = cardInitials;
        };
        loader.src = fullUrl;
    }

    var inlineName = document.getElementById('scDoctorInlineName');
    var titles = document.getElementById('scDoctorTitles');
    var bio = document.getElementById('scDoctorBio');
    if (inlineName) inlineName.textContent = 'Dr. ' + name.replace(/^Dr\.?\s*/i, '');
    if (titles) titles.textContent = titleLine;
    if (bio) bio.textContent = d.bio || 'Focused on gentle, preventive care with clear clinical communication.';

    var exp = document.getElementById('scExpYears');
    if (exp) exp.textContent = String(d.yearsOfExperience != null ? d.yearsOfExperience : '–');

    var rat = Number(d.rating);
    var ra = document.getElementById('scRatingAvg');
    if (ra) ra.textContent = rat >= 3 ? rat.toFixed(1) + ' / 5.0' : '4.9 / 5.0';
}

async function refreshSmileDoctorDashboard(full) {
    try {
        var dash = await apiCall('/doctors/dashboard/data');

        var ddoc = dash.doctor;
        scState.doctor = ddoc;

        var userObj = JSON.parse(localStorage.getItem('user') || '{}');
        if (userObj && ddoc.name) {
            userObj.name = ddoc.name;
            if (ddoc.email) userObj.email = ddoc.email;
            localStorage.setItem('user', JSON.stringify(userObj));
        }

        scHydrateDoctorUI(ddoc, userObj);

        try {
            var stats = await apiCall('/doctors/dashboard/stats');
            var grow = document.getElementById('scStatPatientsGrowth');
            if (grow && stats.patientsChange) grow.textContent = stats.patientsChange + ' growth';
        } catch (_) {}
    } catch (e) {
        console.error(e);
    }

    if (!full) return;

    try {
        var apRes = await apiCall('/appointments/user/appointments');
        var appts = Array.isArray(apRes) ? apRes : [];

        function pidOf(x) {
            if (typeof x === 'object' && x !== null) return String(x._id || '');
            if (typeof x === 'string') return x;
            return '';
        }

        try {
            var patRes = await apiCall('/doctors/patients/list');
            scState.patients = (patRes.patients || []).map(function(pp) {
                return {
                    id: pp.id,
                    name: pp.name,
                    email: pp.email,
                    phone: pp.phone,
                    profileImage: pp.profileImage,
                    initial: pp.initial || (pp.name || 'P').charAt(0).toUpperCase(),
                };
            });
        } catch (e2) {
            scState.patients = [];
            console.error(e2);
        }

        scState.appointments = appts;

        var uniq = {};
        var rows = scPatientRowsFromData(scState.patients, appts);

        var searchVal = '';
        var sIn = document.getElementById('scPatientSearch');
        if (sIn) searchVal = sIn.value.trim();

        var filterVal = 'all';
        var fSel = document.getElementById('scRegistryFilter');
        if (fSel) filterVal = fSel.value || 'all';

        var today = new Date();
        today.setHours(0, 0, 0, 0);
        var weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);

        var todayCnt = 0;
        var doneToday = 0;
        var upcoming7 = 0;

        for (var idx = 0; idx < appts.length; idx++) {
            var ax = appts[idx];
            var pj = pidOf(ax.patientId);
            if (pj) uniq[pj] = true;

            var ad = scAptDate(ax);
            if (!ad) continue;
            ad.setHours(0, 0, 0, 0);

            var st = (ax.status || '').toLowerCase();
            if (st === 'cancelled' || st === 'rejected') continue;

            if (+ad === +today) {
                todayCnt++;
                if (st === 'completed') doneToday++;
            }

            var booked = ['pending', 'confirmed', 'scheduled', 'rescheduled'].indexOf(st) >= 0;
            if (booked && ad >= today && ad < weekEnd && st !== 'completed') upcoming7++;
        }

        var realPatientCount = rows.length || Object.keys(uniq).length;

        var elTot = document.getElementById('scStatTotalPatients');
        var elTd = document.getElementById('scStatTodayApts');
        var elTc = document.getElementById('scStatTodayCompleted');
        var elUp = document.getElementById('scStatUpcoming');

        if (elTot) elTot.textContent = String(realPatientCount);
        if (elTd) elTd.textContent = String(todayCnt);
        if (elTc) elTc.textContent = String(doneToday) + ' completed';
        if (elUp) elUp.textContent = String(upcoming7);

        scRenderRegistryTbody(rows, 'scRegistryBody', searchVal, filterVal);
        scRenderRegistryTbody(rows, 'scRegistryBodyPatients', searchVal, filterVal);

        scRenderChart();
        scRenderAppointmentsBoard();

        syncScProfileFormFields();
    } catch (mainErr) {
        console.error(mainErr);
    }
}

function syncScProfileFormFields() {
    var d = scState.doctor;
    if (!d) return;
    function set(id, val) {
        var n = document.getElementById(id);
        if (n) n.value = val || '';
    }
    set('scFullName', d.name);
    set('scEmail', d.email);
    set('scPhone', d.phone);

    var spec = document.getElementById('scSpec');
    if (spec && d.specialization) {
        spec.value = d.specialization;
        if (!spec.value) spec.value = 'General Medicine';
    }

    set('scYoE', d.yearsOfExperience);
    set('scLicense', d.licenseNumber);
    set('scBio', d.bio);
}

async function loadScPatientHistory(patientId) {
    var modal = document.getElementById('scPatientHistoryModal');
    var body = document.getElementById('scPatientHistoryBody');
    var ttl = document.getElementById('scPatientModalTitle');
    if (!modal || !body) return;

    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    if (ttl) ttl.textContent = 'Medical history & prescriptions';
    body.innerHTML = '<div class="sc-patient-sub">Loading records\u2026</div>';

    try {
        var history = await apiCall('/doctors/patient-history/' + patientId);

        if (!history || history.length === 0) {
            body.innerHTML = '<div class="sc-patient-sub">No medical records or prescriptions on file.</div>';
            return;
        }

        body.innerHTML = history
            .map(function(rec) {
                var rxHtml = '';
                if (rec.prescriptionImage && String(rec.prescriptionImage).trim()) {
                    var rxUrl = scResolveUrl(rec.prescriptionImage);
                    if (rxUrl) {
                        rxHtml =
                            '<div class="sc-rx-section">' +
                            '<div class="sc-rx-heading">Prescription</div>' +
                            '<div class="sc-rx-frame">' +
                            '<img class="sc-rx-img" loading="lazy" decoding="async" src="' +
                            escapeHtml(rxUrl) +
                            '" alt="Prescription image">' +
                            '</div>' +
                            '</div>';
                    }
                }

                return (
                    '<div style="border-left:3px solid #005f6b;padding-left:12px;margin-bottom:1rem">' +
                    '<strong>' +
                    escapeHtml(rec.disease || 'Record') +
                    '</strong>' +
                    '<div class="sc-patient-sub">' +
                    escapeHtml(
                        rec.createdAt
                            ? new Date(rec.createdAt).toLocaleDateString()
                            : ''
                    ) +
                    '</div>' +
                    '<p style="margin:.5rem 0 0">' +
                    escapeHtml(rec.notes || '') +
                    '</p>' +
                    rxHtml +
                    '</div>'
                );
            })
            .join('');
    } catch (e) {
        if (body) body.innerHTML = '<div class="sc-badge-urgent" style="display:inline;padding:.5rem">Could not load history.</div>';
    }
}

function closeScPatientModal() {
    var modal = document.getElementById('scPatientHistoryModal');
    var ttl = document.getElementById('scPatientModalTitle');
    if (!modal) return;
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    if (ttl) ttl.textContent = 'Patient overview';
}

document.addEventListener('click', function(ev) {
    var m = document.getElementById('scPatientHistoryModal');
    if (m && ev.target === m) closeScPatientModal();
});

window.refreshSmileDoctorDashboard = refreshSmileDoctorDashboard;

window.closeScPatientModal = closeScPatientModal;

/** Dark mode preference key (doctor dashboard cosmic theme). */
var SC_DARK_LS = 'smileDoctorDark';

function scClickNavPanel(panelName) {
    var btn = document.querySelector('.sc-nav-item[data-panel="' + panelName + '"]');
    if (btn) btn.click();
}

function scRunAfterPanelsPaint(fn) {
    if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(function() {
            setTimeout(fn, 70);
        });
    } else {
        setTimeout(fn, 90);
    }
}

function scFocusPatientSearchBar() {
    var s = document.getElementById('scPatientSearch');
    if (s) {
        s.focus();
        try {
            if (typeof s.select === 'function') {
                s.select();
            }
        } catch (_) {}
    }
}

function scOpenPatientsRosterQuick() {
    scClickNavPanel('patients');
    scRunAfterPanelsPaint(function() {
        scFocusPatientSearchBar();
        var tb = document.getElementById('scRegistryBodyPatients');
        var wrap = tb ? tb.closest('.sc-registry') : null;
        if (wrap) {
            wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });
}

function scOpenAppointmentsQuick() {
    scClickNavPanel('appointments');
    scRunAfterPanelsPaint(function() {
        var list = document.getElementById('scAppointmentsList');
        if (list) {
            list.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        scFocusPatientSearchBar();
    });
}

function scOpenDashboardRegistryQuick() {
    scClickNavPanel('dashboard');
    scRunAfterPanelsPaint(function() {
        var panel = document.getElementById('panel-dashboard');
        var registry = panel ? panel.querySelector('.sc-registry') : null;
        if (registry) {
            registry.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        scFocusPatientSearchBar();
    });
}

/** Dark mode helpers (Doctor Hub doctor dashboard). */

function scApplyThemeDark(on) {
    if (!document.body.classList.contains('smile-doctor-app')) return;
    document.body.classList.toggle('sc-dark', !!on);
    try {
        localStorage.setItem(SC_DARK_LS, on ? '1' : '0');
    } catch (_) {}
    if (typeof window.syncCosmosNightHtmlClass === 'function') {
        window.syncCosmosNightHtmlClass();
    }
    var dmBtn = document.getElementById('scDarkModeToggle');
    if (dmBtn) {
        dmBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
        dmBtn.setAttribute('title', on ? 'Switch to light mode' : 'Switch to dark mode');
    }
}

function scIsDarkPreferred() {
    try {
        return localStorage.getItem(SC_DARK_LS) === '1';
    } catch (e) {
        return false;
    }
}

window.initSmileDoctorDashboard = function initSmileDoctorDashboard() {
    var userCheck = JSON.parse(localStorage.getItem('user') || 'null');

    if (!userCheck || userCheck.role !== 'doctor') {
        window.location.href = 'auth.html';
        return;
    }

    scApplyThemeDark(scIsDarkPreferred());

    var dmBtn = document.getElementById('scDarkModeToggle');
    if (dmBtn) {
        dmBtn.addEventListener('click', function() {
            var next = !document.body.classList.contains('sc-dark');
            scApplyThemeDark(next);
        });
    }

    document.querySelectorAll('.sc-nav-item').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var panel = btn.getAttribute('data-panel');
            var title = btn.getAttribute('data-title') || '';

            document.querySelectorAll('.sc-nav-item').forEach(function(b) {
                b.classList.remove('active');
            });
            btn.classList.add('active');

            document.querySelectorAll('.sc-panel').forEach(function(pan) {
                pan.classList.remove('active');
            });

            var pEl = document.getElementById('panel-' + panel);
            if (pEl) pEl.classList.add('active');

            var hdr = document.getElementById('scHeaderTitle');
            if (hdr) {
                if (panel === 'dashboard') hdr.textContent = 'Clinical Overview';
                else if (panel === 'appointments') hdr.textContent = title || 'Appointments';
                else if (panel === 'patients') hdr.textContent = 'Patient registry';
                else if (panel === 'settings') hdr.textContent = title || 'Settings';
            }
        });
    });

    var sb = document.getElementById('scSidebarToggle');
    var sidebar = document.getElementById('scSidebar');

    var qNew = [document.getElementById('scBtnNewAppointment'), document.getElementById('scFabPlus')];

    qNew.forEach(function(el) {
        if (el) {
            el.addEventListener('click', function(ev) {
                ev.preventDefault();
                var tgt = document.querySelector('.sc-nav-item[data-panel="appointments"]');
                if (tgt) tgt.click();
            });
        }
    });

    var qaNp = document.getElementById('qaNewPatient');
    if (qaNp) {
        qaNp.addEventListener('click', function(ev) {
            ev.preventDefault();
            scOpenPatientsRosterQuick();
        });
    }

    var qaInv = document.getElementById('qaInvoice');
    if (qaInv) {
        qaInv.addEventListener('click', function(ev) {
            ev.preventDefault();
            scOpenAppointmentsQuick();
        });
    }

    var qaPresc = document.getElementById('qaRx');
    if (qaPresc) {
        qaPresc.addEventListener('click', function(ev) {
            ev.preventDefault();
            scOpenPatientsRosterQuick();
        });
    }

    var qaCase = document.getElementById('qaCase');
    if (qaCase) {
        qaCase.addEventListener('click', function(ev) {
            ev.preventDefault();
            scOpenDashboardRegistryQuick();
        });
    }

    var addPatientBtn = document.getElementById('scAddPatientBtn');
    if (addPatientBtn) {
        addPatientBtn.addEventListener('click', function(ev) {
            ev.preventDefault();
            window.open('auth.html', '_blank', 'noopener,noreferrer');
        });
    }

    if (sb && sidebar) {
        sb.addEventListener('click', function(ev) {
            ev.stopPropagation();
            sidebar.classList.toggle('open');
        });
        document.querySelector('.sc-main').addEventListener('click', function() {
            sidebar.classList.remove('open');
        });
    }

    document.getElementById('scViewProfileBtn').addEventListener('click', function() {
        document.querySelector('.sc-nav-item[data-panel="settings"]').click();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    var search = document.getElementById('scPatientSearch');
    if (search) {
        search.addEventListener('input', function() {
            refreshSmileDoctorDashboard(true);
        });
    }

    var filt = document.getElementById('scRegistryFilter');
    if (filt) {
        filt.addEventListener('change', function() {
            refreshSmileDoctorDashboard(true);
        });
    }

    var aptFilt = document.getElementById('scApptStatusFilter');
    if (aptFilt) {
        aptFilt.addEventListener('change', function() {
            scRenderAppointmentsBoard();
        });
    }

    var chartToggle = document.getElementById('scChartToggle');
    if (chartToggle) {
        chartToggle.querySelectorAll('button').forEach(function(b) {
            b.addEventListener('click', function() {
                chartToggle.querySelectorAll('button').forEach(function(bb) {
                    bb.classList.remove('active');
                });
                b.classList.add('active');
                scState.chartRange = b.getAttribute('data-range') || 'week';
                scRenderChart();
            });
        });
    }

    document.getElementById('scProfileForm').addEventListener('submit', async function(ev) {
        ev.preventDefault();
        var msg = document.getElementById('scProfileMsg');
        try {
            var payload = {
                name: document.getElementById('scFullName').value.trim(),
                email: document.getElementById('scEmail').value.trim(),
                phone: document.getElementById('scPhone').value.trim(),
                specialization: document.getElementById('scSpec').value.trim(),
                yearsOfExperience: parseInt(document.getElementById('scYoE').value, 10) || 0,
                licenseNumber: document.getElementById('scLicense').value.trim(),
                bio: document.getElementById('scBio').value.trim(),
            };
            await apiCall('/doctors/profile/update', 'PUT', payload);
            if (msg) {
                msg.textContent = 'Profile saved successfully.';
                msg.style.color = '#0d9488';
            }
            refreshSmileDoctorDashboard(false);
            await refreshSmileDoctorDashboard(true);
        } catch (ex) {
            if (msg) {
                msg.textContent = ex.message || 'Save failed.';
                msg.style.color = '#c62828';
            }
        }
    });

    document.getElementById('scUploadPhotoBtn').addEventListener('click', async function() {
        var fileInput = document.getElementById('scProfileImageFile');
        var msg = document.getElementById('scProfileMsg');
        if (!fileInput.files || !fileInput.files[0]) {
            if (msg) {
                msg.textContent = 'Choose an image first.';
                msg.style.color = '#c62828';
            }
            return;
        }
        if (!scState.doctorId) {
            if (msg) msg.textContent = 'Loading profile… retry in a moment.';
            return;
        }
        try {
            var token = localStorage.getItem('token');
            var fd = new FormData();
            fd.append('image', fileInput.files[0]);
            var resp = await fetch(scServerOrigin() + '/api/doctor/upload-image/' + scState.doctorId, {
                method: 'PUT',
                headers: token ? { Authorization: 'Bearer ' + token } : {},
                body: fd,
            });

            var data = resp.ok ? await resp.json().catch(function() {
                return null;
            }) : null;

            if (!resp.ok) {
                var jo = {};
                try {
                    jo = await resp.json();
                } catch (x) {}
                throw new Error(jo.message || 'Upload failed.');
            }

            if (msg) {
                msg.textContent = 'Photo updated.';
                msg.style.color = '#0d9488';
            }
            fileInput.value = '';
            if (data && data.doctor && data.doctor.profileImage) {
                var ddup = Object.assign({}, scState.doctor, { profileImage: data.doctor.profileImage });
                scState.doctor = ddup;
                scHydrateDoctorUI(ddup, {});
            }

            refreshSmileDoctorDashboard(true);
        } catch (eU) {
            if (msg) {
                msg.textContent = eU.message || 'Upload failed.';
                msg.style.color = '#c62828';
            }
        }
    });

    scUpdateDatePill();
    setInterval(scUpdateDatePill, 60 * 1000);

    refreshSmileDoctorDashboard(false).then(function() {
        return refreshSmileDoctorDashboard(true);
    });
};
