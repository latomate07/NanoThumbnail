import { state } from './state.js';
import { t } from './i18n/i18n.js'; // Import t

// DOM Elements
export const views = {
    landing: document.getElementById('landing-view'),
    app: document.getElementById('app-view'),
    modal: document.getElementById('settingsModal'),
    history: document.getElementById('historyPanel')
};

/* --- NAVIGATION --- */
export function showLanding() {
    views.landing.classList.remove('hidden');
    views.app.classList.add('hidden');
    // Hide history button, API button and close history panel on landing
    document.getElementById('historyBtn').classList.add('hidden');
    document.getElementById('apiBtn').classList.add('hidden');
    views.history.classList.remove('open');
}

export function startApp() {
    if (!state.apiKey) {
        openSettings();
    } else {
        views.landing.classList.add('hidden');
        views.app.classList.remove('hidden');
        // Show history button and API button when in app view
        document.getElementById('historyBtn').classList.remove('hidden');
        document.getElementById('apiBtn').classList.remove('hidden');
        renderHistory();
    }
}

export function openSettings() {
    document.getElementById('apiKeyInput').value = state.apiKey;
    views.modal.classList.remove('hidden');
}

export function closeSettings() {
    views.modal.classList.add('hidden');
}

export function saveSettings() {
    const key = document.getElementById('apiKeyInput').value.trim();
    
    if (key) {
        state.apiKey = key;
        localStorage.setItem('nano_api_key', key);
        closeSettings();
        // If we were on landing, go to app
        if (!views.landing.classList.contains('hidden')) {
            views.landing.classList.add('hidden');
            views.app.classList.remove('hidden');
            // Show history and API buttons
            document.getElementById('historyBtn').classList.remove('hidden');
            document.getElementById('apiBtn').classList.remove('hidden');
            renderHistory();
        }
    } else {
        alert(t('alerts.enter_api_key'));
    }
}

export function toggleHistory() {
    views.history.classList.toggle('open');
}

/* --- HISTORY LOGIC --- */
export function loadHistoryImage(url, prompt) {
    // Switch to app view if on landing
    if (!views.app.classList.contains('hidden')) {
        // Already in app view
    } else {
        // Switch from landing to app
        views.landing.classList.add('hidden');
        views.app.classList.remove('hidden');
        document.getElementById('historyBtn').classList.remove('hidden');
        document.getElementById('apiBtn').classList.remove('hidden');
    }
    // Close history panel
    views.history.classList.remove('open');
    // Load the image
    displayResult(url, prompt);
}

export function addToHistory(prompt, url) {
    const newItem = { prompt, url, date: new Date().toLocaleTimeString() };
    state.history.unshift(newItem);
    if (state.history.length > 10) state.history.pop();
    localStorage.setItem('nano_history', JSON.stringify(state.history));
    renderHistory();
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

export function renderHistory() {
    const list = document.getElementById('historyList');
    if (!list) return; 
    
    if (state.history.length === 0) {
        list.innerHTML = `<p style="color: var(--text-muted);">${t('history.empty')}</p>`;
        return;
    }
    
    list.innerHTML = state.history.map((item, index) => {
        const safePrompt = escapeHtml(item.prompt);
        return `
        <div class="history-item">
            <img src="${item.url}" class="history-img" loading="lazy" data-index="${index}" style="cursor:pointer">
            <p class="history-prompt">${safePrompt}</p>
            <small style="color:var(--text-muted)">${item.date}</small>
        </div>
    `;
    }).join('');
    
    const imgs = list.querySelectorAll('.history-img');
    imgs.forEach(img => {
        img.addEventListener('click', () => {
             const index = parseInt(img.getAttribute('data-index'));
             if (index >= 0 && index < state.history.length) {
                 const item = state.history[index];
                 loadHistoryImage(item.url, item.prompt);
             }
        });
    });
}

/* --- IMAGE UPLOAD LOGIC --- */
export function processFile(file) {
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        // Vérifier la limite de 14 images au moment de l'ajout (dans le callback asynchrone)
        if (state.referenceImages.length >= 14) {
            // Ne pas afficher d'alerte pour chaque image rejetée, juste une fois
            if (state.referenceImages.length === 14) {
                alert(t('alerts.max_images') || 'Maximum 14 images autorisées');
            }
            return;
        }
        
        state.referenceImages.push(e.target.result);
        renderReferenceImages();
        document.getElementById('fileInput').value = ''; // Reset input
    };
    reader.readAsDataURL(file);
}

export function renderReferenceImages() {
    const container = document.getElementById('previewContainer');
    const dropZone = document.getElementById('dropZone');
    const clearAllBtn = document.getElementById('clearAllBtn');
    
    // Mettre à jour le compteur
    const countMsg = document.getElementById('imageCount');
    if (countMsg) {
        countMsg.textContent = `${state.referenceImages.length}/14`;
    }
    
    // Si pas d'images, tout réinitialiser
    if (state.referenceImages.length === 0) {
        container.style.display = 'none';
        dropZone.style.display = 'flex';
        if (clearAllBtn) clearAllBtn.style.display = 'none';
        if (dropZone) {
            dropZone.classList.remove('compact', 'disabled');
        }
        return;
    }
    
    // Afficher le conteneur d'images et le bouton effacer
    container.style.display = 'grid';
    if (clearAllBtn) clearAllBtn.style.display = 'block';
    
    // Garder la dropZone visible mais plus compacte
    dropZone.style.display = 'flex';
    dropZone.classList.add('compact');
    
    // Désactiver la dropZone si on atteint le maximum
    if (state.referenceImages.length >= 14) {
        dropZone.classList.add('disabled');
        dropZone.style.pointerEvents = 'none';
        dropZone.style.opacity = '0.5';
    } else {
        dropZone.classList.remove('disabled');
        dropZone.style.pointerEvents = 'auto';
        dropZone.style.opacity = '1';
    }
    
    container.innerHTML = state.referenceImages.map((img, index) => `
        <div class="preview-img-wrapper">
            <img src="${img}" class="preview-img" alt="Référence ${index + 1}">
            <button class="remove-img" data-index="${index}">
                <i class="fa-solid fa-times"></i>
            </button>
        </div>
    `).join('');
    
    // Attacher les événements aux boutons de suppression
    container.querySelectorAll('.remove-img').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.getAttribute('data-index'));
            removeImage(index);
        });
    });
}

export function removeImage(index) {
    state.referenceImages.splice(index, 1);
    renderReferenceImages();
}

export function clearImage() {
    state.referenceImages = [];
    document.getElementById('fileInput').value = '';
    renderReferenceImages();
}

export async function displayResult(url, prompt) {
    const img = document.getElementById('finalImage');
    // Reset display
    img.classList.add('hidden');
    document.getElementById('loader').classList.remove('hidden');
    document.getElementById('placeholder').classList.add('hidden'); 
    
    // Update status text
    document.getElementById('statusText').innerText = t('app.status_loading');
    
    try {
        let finalSrc = url;
        let blobUrl = url;

        if (url.startsWith('http')) {
            const proxyUrl = `${state.proxyUrl}${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error('Failed to fetch image via proxy');
            const blob = await response.blob();
            blobUrl = URL.createObjectURL(blob);
            finalSrc = blobUrl;
        }

        img.src = finalSrc;
        
        img.onload = () => {
            document.getElementById('loader').classList.add('hidden');
            img.classList.remove('hidden');
            
            const dlLink = document.getElementById('downloadLink');
            dlLink.href = blobUrl;
            dlLink.download = `nano-thumbnail-${Date.now()}.png`; 
            
            document.getElementById('actionsBar').classList.remove('hidden');
            document.getElementById('actionsBar').style.display = 'flex'; 
        };

        img.onerror = () => {
            throw new Error("Image load failed");
        };

    } catch (e) {
        console.error("Image display error:", e);
        document.getElementById('loader').classList.add('hidden');
        
        img.src = url;
        img.classList.remove('hidden');

        alert(t('alerts.error_display'));
        
        const dlLink = document.getElementById('downloadLink');
        dlLink.href = url;
        document.getElementById('actionsBar').classList.remove('hidden');
        document.getElementById('actionsBar').style.display = 'flex'; 
    }
}
