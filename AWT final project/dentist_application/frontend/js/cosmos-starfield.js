/**
 * Full-page drifting stars for the whole site when night/cosmic mode is on.
 * Uses localStorage keys: smileDoctorDark (doctor toggle) and darkMode (landing/auth).
 */
(function () {
    var STAR_COUNT = 320;
    var LS_DOCTOR_DARK = 'smileDoctorDark';
    var LS_INDEX_DARK = 'darkMode';

    function cosmosNightDesired() {
        try {
            if (localStorage.getItem(LS_DOCTOR_DARK) === '1') return true;
            if (localStorage.getItem(LS_INDEX_DARK) === 'true') return true;
            return false;
        } catch (e) {
            return false;
        }
    }

    window.cosmosNightDesired = cosmosNightDesired;

    window.syncCosmosNightHtmlClass = function () {
        var on = cosmosNightDesired();
        document.documentElement.classList.toggle('cosmos-night', on);
        return on;
    };

    window.ensureCosmosStarfieldHost = function () {
        var el = document.getElementById('scStarfield');
        if (el) {
            el.classList.add('cosmos-starfield');
            return el;
        }
        el = document.createElement('div');
        el.id = 'scStarfield';
        el.className = 'cosmos-starfield';
        el.setAttribute('aria-hidden', 'true');
        document.body.insertBefore(el, document.body.firstChild);
        return el;
    };

    window.buildCosmosStarsOnce = function () {
        var host = window.ensureCosmosStarfieldHost();
        if (!host || host.getAttribute('data-built') === '1') return;
        host.setAttribute('data-built', '1');

        for (var i = 0; i < STAR_COUNT; i++) {
            var s = document.createElement('span');
            s.className = 'sc-star';
            s.setAttribute('aria-hidden', 'true');
            s.style.left = Math.random() * 100 + '%';
            s.style.top = Math.random() * 100 + '%';

            var dur = 22 + Math.random() * 40;
            if (Math.random() < 0.2) {
                dur *= 1.5;
            }
            dur = Math.round(dur * 100) / 100;
            var del = -Math.random() * dur;
            del = Math.round(del * 100) / 100;

            s.style.setProperty('--sc-anim-dur', dur + 's');
            s.style.setProperty('--sc-anim-del', del + 's');

            if (Math.random() < 0.13) {
                s.classList.add('sc-star-bright');
            }
            if (Math.random() < 0.24) {
                s.classList.add('sc-star-lg');
            }

            host.appendChild(s);
        }
    };

    window.initCosmosStarfield = function () {
        window.ensureCosmosStarfieldHost();
        window.buildCosmosStarsOnce();
        window.syncCosmosNightHtmlClass();
    };

    document.addEventListener('DOMContentLoaded', function () {
        window.initCosmosStarfield();
    });
})();
