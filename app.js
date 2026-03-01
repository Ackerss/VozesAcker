/**
 * VozesAcker v2 — Gerador de Vozes Neurais
 * Motor: Edge-TTS (Cloudflare Worker) + ElevenLabs API
 * Editor: WaveSurfer.js + Web Audio API
 * Features: Favoritos, Cache, Demos, Batch
 */

// ============================================
// CONFIG
// ============================================
const DEFAULT_WORKER_URL = 'https://voices.jacsonsax.workers.dev';

// ============================================
// VOZES DISPONÍVEIS (apenas as que funcionam)
// ============================================
const EDGE_VOICES = [
    { id: 'pt-BR-FranciscaNeural', name: 'Francisca', gender: 'female', demo: 'demo/francisca.mp3' },
    { id: 'pt-BR-AntonioNeural', name: 'Antonio', gender: 'male', demo: 'demo/antonio.mp3' },
    { id: 'pt-BR-ThalitaNeural', name: 'Thalita', gender: 'female', demo: 'demo/thalita.mp3' },
];

const ELEVEN_VOICES = [
    { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', gender: 'male', desc: 'Narrador Profundo', demo: 'demo/adam.mp3' },
    { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', gender: 'female', desc: 'Padrão/Clara', demo: 'demo/rachel.mp3' },
    { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', gender: 'male', desc: 'Enérgico/Games', demo: 'demo/antoni.mp3' },
    { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', gender: 'male', desc: 'Jornalista', demo: 'demo/daniel.mp3' },
    { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', gender: 'female', desc: 'Suave', demo: 'demo/charlotte.mp3' },
    { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum', gender: 'male', desc: 'Vilão/Rouco', demo: 'demo/callum.mp3' },
    { id: 'pqHfZKP75CvOlQylNhV4', name: 'Bill', gender: 'male', desc: 'Sábio', demo: 'demo/bill.mp3' },
    { id: 'D38z5RcWu1voky8WS1ja', name: 'Fin', gender: 'male', desc: 'Jovem Gamer', demo: 'demo/fin.mp3' },
    { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice', gender: 'female', desc: 'Notícias', demo: 'demo/alice.mp3' },
    { id: 'z9fAnlkpzviPz146aGWa', name: 'Glinda', gender: 'female', desc: 'Bruxa', demo: 'demo/glinda.mp3' },
];

// ============================================
// EFEITOS DE VOZ
// ============================================
const EFFECTS = [
    { id: 'natural', name: 'Natural', icon: '🎤', desc: 'Sem efeitos', pitch: '+0Hz', rate: '+0%' },
    { id: 'gamelav', name: 'Game Lav', icon: '👾', desc: '+40Hz +10%', pitch: '+40Hz', rate: '+10%' },
    { id: 'minion', name: 'Minion', icon: '🟡', desc: '+70Hz +25%', pitch: '+70Hz', rate: '+25%' },
    { id: 'monstrao', name: 'Monstrão', icon: '👹', desc: '-40Hz -15%', pitch: '-40Hz', rate: '-15%' },
    { id: 'robo', name: 'Titã/Robô', icon: '🤖', desc: '-70Hz -25%', pitch: '-70Hz', rate: '-25%' },
    { id: 'esquilo', name: 'Esquilo', icon: '🐿️', desc: '+90Hz +50%', pitch: '+90Hz', rate: '+50%' },
    { id: 'custom', name: 'Custom', icon: '⚙️', desc: 'Sliders', pitch: null, rate: null },
];

// ============================================
// STATE
// ============================================
let state = {
    provider: 'edge',
    selectedVoice: EDGE_VOICES[0].id,
    selectedEffect: 'natural',
    currentAudioBlob: null,
    currentAudioUrl: null,
    theme: localStorage.getItem('vf-theme') || 'dark',
    workerUrl: localStorage.getItem('vf-worker-url') || DEFAULT_WORKER_URL,
    apiKey: localStorage.getItem('vf-api-key') || '',
    favorites: JSON.parse(localStorage.getItem('vf-favorites') || '["pt-BR-FranciscaNeural"]'),
};

// Demo playback tracker
let currentDemoAudio = null;

// ============================================
// DOM REFS
// ============================================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initParticles();
    initTabs();
    renderVoiceGrid();
    renderEffectsGrid();
    initGeneratorEvents();
    initBatchEvents();
    initEditorEvents();
    initSettingsEvents();
    updateCharCount();
    updateCacheInfo();
    renderCacheHistory();
});

// ============================================
// THEME
// ============================================
function initTheme() {
    if (state.theme === 'light') {
        document.body.setAttribute('data-theme', 'light');
        $('#btnThemeToggle i').className = 'fas fa-sun';
    }

    $('#btnThemeToggle').addEventListener('click', () => {
        const isLight = document.body.getAttribute('data-theme') === 'light';
        if (isLight) {
            document.body.removeAttribute('data-theme');
            $('#btnThemeToggle i').className = 'fas fa-moon';
            state.theme = 'dark';
        } else {
            document.body.setAttribute('data-theme', 'light');
            $('#btnThemeToggle i').className = 'fas fa-sun';
            state.theme = 'light';
        }
        localStorage.setItem('vf-theme', state.theme);
    });
}

// ============================================
// PARTICLES
// ============================================
function initParticles() {
    const container = $('#bgParticles');
    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDuration = (10 + Math.random() * 20) + 's';
        p.style.animationDelay = Math.random() * 10 + 's';
        p.style.width = (1 + Math.random() * 2) + 'px';
        p.style.height = p.style.width;
        container.appendChild(p);
    }
}

// ============================================
// TABS
// ============================================
function initTabs() {
    $$('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            $$('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            $$('.tab-content').forEach(c => c.classList.remove('active'));
            $(`#tab-${tab}`).classList.add('active');
        });
    });
}

// ============================================
// VOICE GRID (with favorites + demo buttons)
// ============================================
function renderVoiceGrid() {
    const grid = $('#voiceGrid');
    const voices = state.provider === 'edge' ? EDGE_VOICES : ELEVEN_VOICES;
    const badgeClass = state.provider === 'edge' ? 'free' : 'premium';
    const badgeText = state.provider === 'edge' ? 'FREE' : 'PRO';

    grid.innerHTML = voices.map(v => {
        const isFav = state.favorites.includes(v.id);
        return `
        <div class="voice-card ${v.id === state.selectedVoice ? 'selected' : ''}" data-voice="${v.id}">
            <span class="voice-badge ${badgeClass}">${badgeText}</span>
            <button class="btn-fav ${isFav ? 'active' : ''}" data-voice-fav="${v.id}" title="Favoritar">
                <i class="fas fa-star"></i>
            </button>
            <div class="voice-avatar ${v.gender}">
                <i class="fas fa-${v.gender === 'female' ? 'venus' : 'mars'}"></i>
            </div>
            <div class="voice-name">${v.name}</div>
            <div class="voice-gender">${v.desc || (v.gender === 'female' ? 'Feminino' : 'Masculino')}</div>
            ${v.demo ? `
            <button class="btn-demo" data-demo="${v.demo}" title="Ouvir exemplo">
                <i class="fas fa-volume-high"></i> Exemplo
            </button>` : ''}
        </div>`;
    }).join('');

    // Voice selection
    grid.querySelectorAll('.voice-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Don't select if clicking fav or demo button
            if (e.target.closest('.btn-fav') || e.target.closest('.btn-demo')) return;
            grid.querySelectorAll('.voice-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            state.selectedVoice = card.dataset.voice;
        });
    });

    // Favorite toggle
    grid.querySelectorAll('.btn-fav').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const voiceId = btn.dataset.voiceFav;
            toggleFavorite(voiceId);
            btn.classList.toggle('active');
        });
    });

    // Demo play
    grid.querySelectorAll('.btn-demo').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const demoSrc = btn.dataset.demo;
            playDemo(demoSrc, btn);
        });
    });
}

// ============================================
// FAVORITES
// ============================================
function toggleFavorite(voiceId) {
    const idx = state.favorites.indexOf(voiceId);
    if (idx >= 0) {
        state.favorites.splice(idx, 1);
    } else {
        state.favorites.push(voiceId);
    }
    localStorage.setItem('vf-favorites', JSON.stringify(state.favorites));
}

// ============================================
// DEMO PLAYBACK
// ============================================
function playDemo(src, btn) {
    // If already playing this demo, stop it
    if (currentDemoAudio && !currentDemoAudio.paused && btn.classList.contains('playing')) {
        currentDemoAudio.pause();
        currentDemoAudio.currentTime = 0;
        btn.classList.remove('playing');
        btn.innerHTML = '<i class="fas fa-volume-high"></i> Exemplo';
        currentDemoAudio = null;
        return;
    }

    // Stop any previous demo
    if (currentDemoAudio) {
        currentDemoAudio.pause();
        currentDemoAudio.currentTime = 0;
        $$('.btn-demo.playing').forEach(b => {
            b.classList.remove('playing');
            b.innerHTML = '<i class="fas fa-volume-high"></i> Exemplo';
        });
    }

    currentDemoAudio = new Audio(src);
    btn.classList.add('playing');
    btn.innerHTML = '<i class="fas fa-stop"></i> Parar';

    currentDemoAudio.play().catch(() => {
        btn.classList.remove('playing');
        btn.innerHTML = '<i class="fas fa-volume-high"></i> Exemplo';
        showToast('Erro ao reproduzir demo', 'error');
    });

    currentDemoAudio.onended = () => {
        btn.classList.remove('playing');
        btn.innerHTML = '<i class="fas fa-volume-high"></i> Exemplo';
        currentDemoAudio = null;
    };
}

// ============================================
// EFFECTS GRID
// ============================================
function renderEffectsGrid() {
    const grid = $('#effectsGrid');
    grid.innerHTML = EFFECTS.map(e => `
        <div class="effect-card ${e.id === state.selectedEffect ? 'selected' : ''}" data-effect="${e.id}">
            <div class="effect-icon">${e.icon}</div>
            <div class="effect-name">${e.name}</div>
            <div class="effect-desc">${e.desc}</div>
        </div>
    `).join('');

    grid.querySelectorAll('.effect-card').forEach(card => {
        card.addEventListener('click', () => {
            grid.querySelectorAll('.effect-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            state.selectedEffect = card.dataset.effect;
            const sliders = $('#customSliders');
            if (card.dataset.effect === 'custom') {
                sliders.classList.remove('hidden');
            } else {
                sliders.classList.add('hidden');
            }
        });
    });
}

// ============================================
// GENERATOR EVENTS
// ============================================
function initGeneratorEvents() {
    $('#txtInput').addEventListener('input', updateCharCount);
    $('#btnEdge').addEventListener('click', () => switchProvider('edge'));
    $('#btnEleven').addEventListener('click', () => switchProvider('eleven'));
    $('#btnToggleKey').addEventListener('click', () => togglePasswordVisibility('txtApiKey', 'btnToggleKey'));

    $('#sliderRate').addEventListener('input', (e) => {
        $('#rateValue').textContent = `${e.target.value > 0 ? '+' : ''}${e.target.value}%`;
    });
    $('#sliderPitch').addEventListener('input', (e) => {
        $('#pitchValue').textContent = `${e.target.value > 0 ? '+' : ''}${e.target.value}Hz`;
    });

    $('#btnGenerate').addEventListener('click', generateSingle);
    $('#btnDownload').addEventListener('click', downloadCurrentAudio);
    $('#btnEditAudio').addEventListener('click', () => {
        if (state.currentAudioBlob) {
            loadAudioInEditor(state.currentAudioBlob);
            $$('.tab-btn').forEach(b => b.classList.remove('active'));
            $$('.tab-content').forEach(c => c.classList.remove('active'));
            document.querySelector('[data-tab="editor"]').classList.add('active');
            $('#tab-editor').classList.add('active');
        }
    });
}

function updateCharCount() {
    $('#charCount').textContent = $('#txtInput').value.length;
}

function switchProvider(provider) {
    state.provider = provider;
    $$('.provider-btn').forEach(b => b.classList.remove('active'));
    $(`.provider-btn[data-provider="${provider}"]`).classList.add('active');

    const elevenConfig = $('#elevenConfig');
    if (provider === 'eleven') {
        elevenConfig.classList.remove('hidden');
        state.selectedVoice = ELEVEN_VOICES[0].id;
    } else {
        elevenConfig.classList.add('hidden');
        state.selectedVoice = EDGE_VOICES[0].id;
    }
    renderVoiceGrid();
}

function togglePasswordVisibility(inputId, btnId) {
    const input = $(`#${inputId}`);
    const btn = $(`#${btnId}`);
    if (input.type === 'password') {
        input.type = 'text';
        btn.querySelector('i').className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        btn.querySelector('i').className = 'fas fa-eye';
    }
}

// ============================================
// CACHE SYSTEM (economia de API)
// ============================================
function getCacheKey(text, voiceId, effectId) {
    return `vf-cache-${voiceId}-${effectId}-${text.toLowerCase().trim()}`;
}

function getCachedAudio(text, voiceId, effectId) {
    const key = getCacheKey(text, voiceId, effectId);
    return localStorage.getItem(key);
}

function setCachedAudio(text, voiceId, effectId, dataUrl, voiceName) {
    const key = getCacheKey(text, voiceId, effectId);
    try {
        localStorage.setItem(key, dataUrl);
        // Save metadata for history
        const historyKey = 'vf-cache-history';
        const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
        // Avoid duplicates
        const existing = history.findIndex(h => h.key === key);
        if (existing >= 0) history.splice(existing, 1);
        history.unshift({
            key,
            text: text.substring(0, 80),
            voiceId,
            voiceName: voiceName || getVoiceName(voiceId),
            effectId,
            timestamp: Date.now(),
        });
        // Keep max 50 entries
        if (history.length > 50) history.pop();
        localStorage.setItem(historyKey, JSON.stringify(history));
        updateCacheInfo();
        renderCacheHistory();
    } catch (e) {
        // localStorage full
        showToast('Cache cheio! Limpe em Config.', 'error');
    }
}

function renderCacheHistory() {
    const container = $('#cacheHistory');
    if (!container) return;
    const history = JSON.parse(localStorage.getItem('vf-cache-history') || '[]');

    if (history.length === 0) {
        container.innerHTML = '<p class="hint" style="text-align:center;padding:16px"><i class="fas fa-inbox"></i> Nenhuma frase gerada ainda.</p>';
        return;
    }

    container.innerHTML = history.map((h, i) => `
        <div class="cache-item" data-cache-key="${h.key}">
            <div class="cache-item-info">
                <span class="cache-item-text">"${h.text}${h.text.length >= 80 ? '...' : ''}"</span>
                <span class="cache-item-meta">🗣️ ${h.voiceName} · 🎭 ${h.effectId} · ${timeAgo(h.timestamp)}</span>
            </div>
            <div class="cache-item-actions">
                <button class="btn-icon-sm" data-cache-play="${h.key}" title="Reproduzir"><i class="fas fa-play"></i></button>
                <button class="btn-icon-sm" data-cache-download="${h.key}" title="Baixar"><i class="fas fa-download"></i></button>
                <button class="btn-icon-sm" data-cache-delete="${h.key}" title="Remover"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');

    // Event listeners for cache items
    container.querySelectorAll('[data-cache-play]').forEach(btn => {
        btn.addEventListener('click', () => {
            const data = localStorage.getItem(btn.dataset.cachePlay);
            if (data) {
                const audio = new Audio(data);
                audio.play();
            }
        });
    });

    container.querySelectorAll('[data-cache-download]').forEach(btn => {
        btn.addEventListener('click', () => {
            const data = localStorage.getItem(btn.dataset.cacheDownload);
            if (data) {
                const link = document.createElement('a');
                link.href = data;
                link.download = 'vozforge_cached.mp3';
                link.click();
            }
        });
    });

    container.querySelectorAll('[data-cache-delete]').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.cacheDelete;
            localStorage.removeItem(key);
            // Remove from history
            const history = JSON.parse(localStorage.getItem('vf-cache-history') || '[]');
            const filtered = history.filter(h => h.key !== key);
            localStorage.setItem('vf-cache-history', JSON.stringify(filtered));
            renderCacheHistory();
            updateCacheInfo();
            showToast('Áudio removido do cache', 'info');
        });
    });
}

function timeAgo(ts) {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
}

// ============================================
// GENERATE SINGLE VOICE (with cache check)
// ============================================
async function generateSingle() {
    const text = $('#txtInput').value.trim();
    if (!text) {
        showToast('Digite o texto primeiro!', 'error');
        return;
    }

    const effect = getEffectSettings();

    // CHECK CACHE FIRST
    const cached = getCachedAudio(text, state.selectedVoice, state.selectedEffect);
    if (cached) {
        log('💾 Encontrado no cache! Usando áudio salvo (sem gastar API)', 'success');
        showToast('Usando cache! Sem gasto de API 💾', 'success');

        // Convert dataURL to blob
        const resp = await fetch(cached);
        const blob = await resp.blob();

        state.currentAudioBlob = blob;
        if (state.currentAudioUrl) URL.revokeObjectURL(state.currentAudioUrl);
        state.currentAudioUrl = URL.createObjectURL(blob);
        showPlayer(state.currentAudioUrl);
        return;
    }

    const btn = $('#btnGenerate');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Gerando...</span>';
    showLoading('Gerando voz neural...');
    clearLog();
    log('🔄 Iniciando geração...', 'info');

    try {
        let blob;

        if (state.provider === 'edge') {
            log(`🎙️ Motor: Microsoft Edge TTS (Gratuito)`, 'info');
            log(`🗣️ Voz: ${getVoiceName(state.selectedVoice)}`, 'info');
            log(`🎭 Efeito: ${effect.name}`, 'info');
            blob = await generateEdgeTTS(text, state.selectedVoice, effect.rate, effect.pitch);
        } else {
            const apiKey = $('#txtApiKey').value.trim() || state.apiKey;
            if (!apiKey) {
                throw new Error('Insira sua API Key ElevenLabs primeiro!');
            }
            log(`🎙️ Motor: ElevenLabs (Premium)`, 'info');
            log(`🗣️ Voz: ${getVoiceName(state.selectedVoice)}`, 'info');
            blob = await generateElevenLabs(text, state.selectedVoice, apiKey);
        }

        state.currentAudioBlob = blob;
        if (state.currentAudioUrl) URL.revokeObjectURL(state.currentAudioUrl);
        state.currentAudioUrl = URL.createObjectURL(blob);

        showPlayer(state.currentAudioUrl);
        log('✅ Voz gerada com sucesso!', 'success');
        showToast('Voz gerada!', 'success');

        // Cache it
        const reader = new FileReader();
        reader.onloadend = () => {
            setCachedAudio(text, state.selectedVoice, state.selectedEffect, reader.result, getVoiceName(state.selectedVoice));
        };
        reader.readAsDataURL(blob);

    } catch (err) {
        log(`❌ Erro: ${err.message}`, 'error');
        showToast(err.message, 'error');
    } finally {
        hideLoading();
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-play"></i><span>GERAR VOZ</span>';
    }
}

// ============================================
// EDGE TTS (via Cloudflare Worker)
// ============================================
async function generateEdgeTTS(text, voice, rate, pitch) {
    const workerUrl = $('#txtWorkerUrl')?.value || state.workerUrl;

    const params = new URLSearchParams({
        text: text,
        voice: voice,
        rate: rate || 'default',
        pitch: pitch || 'default',
    });

    const url = `${workerUrl}?${params.toString()}`;
    log(`📡 Chamando Worker...`, 'info');

    const resp = await fetch(url);

    if (!resp.ok) {
        const errData = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
        throw new Error(errData.error || `Erro do Worker: ${resp.status}`);
    }

    const blob = await resp.blob();

    if (blob.size < 100) {
        throw new Error('Áudio vazio retornado pelo Worker.');
    }

    log(`📦 Recebido: ${(blob.size / 1024).toFixed(1)} KB`, 'info');
    return blob;
}

// ============================================
// ELEVENLABS
// ============================================
async function generateElevenLabs(text, voiceId, apiKey) {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    log(`📡 Chamando ElevenLabs API...`, 'info');

    const resp = await fetch(url, {
        method: 'POST',
        headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
        },
        body: JSON.stringify({
            text: text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: { stability: 0.5, similarity_boost: 0.75 }
        }),
    });

    if (!resp.ok) {
        const errText = await resp.text();
        if (errText.toLowerCase().includes('quota')) {
            throw new Error('Seus créditos ElevenLabs acabaram (Quota Exceeded).');
        } else if (errText.toLowerCase().includes('unauthorized')) {
            throw new Error('Chave API ElevenLabs inválida.');
        }
        throw new Error(`Erro ElevenLabs (${resp.status}): ${errText.substring(0, 100)}`);
    }

    const blob = await resp.blob();
    log(`📦 Recebido: ${(blob.size / 1024).toFixed(1)} KB`, 'info');
    return blob;
}

// ============================================
// EFFECT SETTINGS
// ============================================
function getEffectSettings() {
    const effect = EFFECTS.find(e => e.id === state.selectedEffect);
    if (!effect) return { name: 'Natural', rate: '+0%', pitch: '+0Hz' };

    if (effect.id === 'custom') {
        const rate = parseInt($('#sliderRate').value);
        const pitch = parseInt($('#sliderPitch').value);
        return {
            name: 'Personalizado',
            rate: `${rate >= 0 ? '+' : ''}${rate}%`,
            pitch: `${pitch >= 0 ? '+' : ''}${pitch}Hz`,
        };
    }
    return effect;
}

function getVoiceName(id) {
    const all = [...EDGE_VOICES, ...ELEVEN_VOICES];
    const v = all.find(v => v.id === id);
    return v ? v.name : id;
}

// ============================================
// PLAYER (Preview)
// ============================================
let previewWavesurfer = null;

function showPlayer(audioUrl) {
    const card = $('#playerCard');
    card.classList.remove('hidden');

    if (previewWavesurfer) previewWavesurfer.destroy();

    previewWavesurfer = WaveSurfer.create({
        container: '#waveformPreview',
        waveColor: '#6c5ce7',
        progressColor: '#a855f7',
        cursorColor: '#ec4899',
        barWidth: 3, barGap: 2, barRadius: 3,
        height: 80, normalize: true, backend: 'WebAudio',
    });

    previewWavesurfer.load(audioUrl);

    previewWavesurfer.on('ready', () => {
        updateTimeDisplay('timeDisplay', 0, previewWavesurfer.getDuration());
    });
    previewWavesurfer.on('audioprocess', () => {
        updateTimeDisplay('timeDisplay', previewWavesurfer.getCurrentTime(), previewWavesurfer.getDuration());
    });
    previewWavesurfer.on('finish', () => {
        $('#btnPlay i').className = 'fas fa-play';
    });

    $('#btnPlay').onclick = () => {
        previewWavesurfer.playPause();
        $('#btnPlay i').className = previewWavesurfer.isPlaying() ? 'fas fa-pause' : 'fas fa-play';
    };

    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ============================================
// BATCH MODE
// ============================================
function initBatchEvents() {
    $('#btnBatchGenerate').addEventListener('click', generateBatch);
}

async function generateBatch() {
    const text = $('#txtBatch').value.trim();
    if (!text) { showToast('Digite as frases primeiro!', 'error'); return; }

    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length === 0) { showToast('Nenhuma frase encontrada!', 'error'); return; }

    const effect = getEffectSettings();
    const btn = $('#btnBatchGenerate');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Processando...</span>';

    const progress = $('#batchProgress');
    progress.classList.remove('hidden');

    const zip = new JSZip();
    let completed = 0;

    clearLog();
    log(`📦 Modo Lote: ${lines.length} frases`, 'info');
    log(`🗣️ Voz: ${getVoiceName(state.selectedVoice)}`, 'info');
    log(`🎭 Efeito: ${effect.name}`, 'info');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        let filename, phrase;

        if (line.includes('|')) {
            const parts = line.split('|', 2);
            filename = sanitizeFilename(parts[0].trim()) || `audio_${String(i + 1).padStart(3, '0')}`;
            phrase = parts[1].trim();
        } else {
            filename = `audio_${String(i + 1).padStart(3, '0')}`;
            phrase = line;
        }
        filename += '.mp3';
        log(`🎙️ [${i + 1}/${lines.length}] Gerando: ${filename}`, 'info');

        try {
            let blob;
            if (state.provider === 'edge') {
                blob = await generateEdgeTTS(phrase, state.selectedVoice, effect.rate, effect.pitch);
            } else {
                const apiKey = $('#txtApiKey').value.trim() || state.apiKey;
                if (!apiKey) throw new Error('API Key necessária!');
                blob = await generateElevenLabs(phrase, state.selectedVoice, apiKey);
            }
            zip.file(filename, blob);
            completed++;
        } catch (err) {
            log(`⚠️ Erro em "${filename}": ${err.message}`, 'error');
        }

        const pct = ((i + 1) / lines.length) * 100;
        $('#progressFill').style.width = `${pct}%`;
        $('#progressText').textContent = `${i + 1} / ${lines.length}`;

        if (state.provider === 'edge' && i < lines.length - 1) await sleep(500);
    }

    if (completed > 0) {
        log(`📦 Compactando ${completed} arquivos...`, 'info');
        try {
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, 'vozes_assets.zip');
            log(`✅ ZIP baixado! (${(content.size / 1024).toFixed(1)} KB)`, 'success');
            showToast(`${completed} áudios gerados!`, 'success');
        } catch (err) {
            log(`❌ Erro ao criar ZIP: ${err.message}`, 'error');
        }
    } else {
        log(`❌ Nenhum áudio gerado.`, 'error');
    }

    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-cogs"></i><span>GERAR LOTE (ZIP)</span>';
}

// ============================================
// AUDIO EDITOR
// ============================================
let editorWavesurfer = null;
let editorAudioBuffer = null;

function initEditorEvents() {
    $('#btnLoadFile').addEventListener('click', () => $('#fileInput').click());

    $('#fileInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) loadAudioInEditor(file);
    });

    // Drag and drop
    const editorCard = $('#tab-editor .card');
    editorCard.addEventListener('dragover', (e) => { e.preventDefault(); editorCard.style.borderColor = 'var(--accent)'; });
    editorCard.addEventListener('dragleave', () => { editorCard.style.borderColor = ''; });
    editorCard.addEventListener('drop', (e) => {
        e.preventDefault();
        editorCard.style.borderColor = '';
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('audio')) loadAudioInEditor(file);
    });

    // Speed slider
    $('#sliderSpeed').addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        $('#speedValue').textContent = `${val.toFixed(1)}x`;
        if (editorWavesurfer) editorWavesurfer.setPlaybackRate(val);
    });

    // Volume slider
    $('#sliderVolume').addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        $('#volumeValue').textContent = `${Math.round(val * 100)}%`;
        if (editorWavesurfer) editorWavesurfer.setVolume(Math.min(val, 1));
    });

    // Zoom
    $('#btnZoomIn').addEventListener('click', () => {
        if (editorWavesurfer) editorWavesurfer.zoom(Math.min((editorWavesurfer.options.minPxPerSec || 50) + 20, 300));
    });
    $('#btnZoomOut').addEventListener('click', () => {
        if (editorWavesurfer) editorWavesurfer.zoom(Math.max((editorWavesurfer.options.minPxPerSec || 50) - 20, 10));
    });

    // Trim silence
    $('#btnTrimSilence').addEventListener('click', trimSilence);

    // Split audio
    $('#btnSplitAudio').addEventListener('click', splitAudio);

    // Delete selection (beginning / end)
    $('#btnDeleteStart').addEventListener('click', () => deleteSection('start'));
    $('#btnDeleteEnd').addEventListener('click', () => deleteSection('end'));

    // Export
    $('#btnExport').addEventListener('click', exportAudio);

    // Play/Stop
    $('#btnEditorPlay').addEventListener('click', () => {
        if (editorWavesurfer) {
            editorWavesurfer.playPause();
            $('#btnEditorPlay i').className = editorWavesurfer.isPlaying() ? 'fas fa-pause' : 'fas fa-play';
        }
    });
    $('#btnEditorStop').addEventListener('click', () => {
        if (editorWavesurfer) {
            editorWavesurfer.stop();
            $('#btnEditorPlay i').className = 'fas fa-play';
        }
    });
}

function loadAudioInEditor(blobOrFile) {
    $('#editorEmpty').classList.add('hidden');
    $('#editorLoaded').classList.remove('hidden');

    if (editorWavesurfer) editorWavesurfer.destroy();

    editorWavesurfer = WaveSurfer.create({
        container: '#waveformEditor',
        waveColor: '#a29bfe',
        progressColor: '#6c5ce7',
        cursorColor: '#ec4899',
        barWidth: 2, barGap: 1, barRadius: 2,
        height: 120, normalize: true, backend: 'WebAudio',
    });

    const url = blobOrFile instanceof Blob ? URL.createObjectURL(blobOrFile) : blobOrFile;
    editorWavesurfer.load(url);

    editorWavesurfer.on('ready', () => {
        updateTimeDisplay('editorTimeDisplay', 0, editorWavesurfer.getDuration());
        editorAudioBuffer = editorWavesurfer.getDecodedData();
    });
    editorWavesurfer.on('audioprocess', () => {
        updateTimeDisplay('editorTimeDisplay', editorWavesurfer.getCurrentTime(), editorWavesurfer.getDuration());
    });
    editorWavesurfer.on('finish', () => {
        $('#btnEditorPlay i').className = 'fas fa-play';
    });
}

// ============================================
// EDITOR: TRIM SILENCE
// ============================================
async function trimSilence() {
    if (!editorWavesurfer || !editorAudioBuffer) {
        showToast('Carregue um áudio primeiro!', 'error'); return;
    }

    showToast('Removendo silêncios...', 'info');
    const audioBuffer = editorAudioBuffer;
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const threshold = 0.01;
    const chunkSize = Math.floor(sampleRate * 0.01);

    let startSample = 0;
    for (let i = 0; i < channelData.length; i += chunkSize) {
        const end = Math.min(i + chunkSize, channelData.length);
        let maxAmp = 0;
        for (let j = i; j < end; j++) maxAmp = Math.max(maxAmp, Math.abs(channelData[j]));
        if (maxAmp > threshold) { startSample = Math.max(0, i - chunkSize); break; }
    }

    let endSample = channelData.length;
    for (let i = channelData.length - 1; i >= 0; i -= chunkSize) {
        const start = Math.max(0, i - chunkSize);
        let maxAmp = 0;
        for (let j = start; j <= i; j++) maxAmp = Math.max(maxAmp, Math.abs(channelData[j]));
        if (maxAmp > threshold) { endSample = Math.min(channelData.length, i + chunkSize); break; }
    }

    if (startSample >= endSample) { showToast('Áudio parece ser todo silêncio!', 'error'); return; }

    const trimmedLength = endSample - startSample;
    const ctx = new AudioContext();
    const newBuffer = ctx.createBuffer(audioBuffer.numberOfChannels, trimmedLength, sampleRate);
    for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
        const oldData = audioBuffer.getChannelData(ch);
        const newData = newBuffer.getChannelData(ch);
        for (let i = 0; i < trimmedLength; i++) newData[i] = oldData[startSample + i];
    }

    const blob = await audioBufferToBlob(newBuffer);
    loadAudioInEditor(blob);
    const removedMs = ((channelData.length - trimmedLength) / sampleRate * 1000).toFixed(0);
    showToast(`Silêncio removido! (${removedMs}ms cortados)`, 'success');
    ctx.close();
}

// ============================================
// EDITOR: SPLIT AUDIO
// ============================================
async function splitAudio() {
    if (!editorWavesurfer || !editorAudioBuffer) {
        showToast('Carregue um áudio primeiro!', 'error'); return;
    }

    const currentTime = editorWavesurfer.getCurrentTime();
    const duration = editorWavesurfer.getDuration();

    if (currentTime <= 0.1 || currentTime >= duration - 0.1) {
        showToast('Posicione o cursor no ponto de corte!', 'error'); return;
    }

    const sampleRate = editorAudioBuffer.sampleRate;
    const splitSample = Math.floor(currentTime * sampleRate);
    const numChannels = editorAudioBuffer.numberOfChannels;

    const ctx = new AudioContext();

    // Part 1
    const buf1 = ctx.createBuffer(numChannels, splitSample, sampleRate);
    for (let ch = 0; ch < numChannels; ch++) {
        const src = editorAudioBuffer.getChannelData(ch);
        const dst = buf1.getChannelData(ch);
        for (let i = 0; i < splitSample; i++) dst[i] = src[i];
    }

    // Part 2
    const remaining = editorAudioBuffer.length - splitSample;
    const buf2 = ctx.createBuffer(numChannels, remaining, sampleRate);
    for (let ch = 0; ch < numChannels; ch++) {
        const src = editorAudioBuffer.getChannelData(ch);
        const dst = buf2.getChannelData(ch);
        for (let i = 0; i < remaining; i++) dst[i] = src[splitSample + i];
    }

    const blob1 = await audioBufferToBlob(buf1);
    const blob2 = await audioBufferToBlob(buf2);

    saveAs(blob1, 'vozforge_parte1.wav');
    saveAs(blob2, 'vozforge_parte2.wav');

    showToast(`Áudio dividido em ${formatTime(currentTime)}! 2 arquivos baixados.`, 'success');
    ctx.close();
}

// ============================================
// EDITOR: DELETE SECTION
// ============================================
async function deleteSection(section) {
    if (!editorWavesurfer || !editorAudioBuffer) {
        showToast('Carregue um áudio primeiro!', 'error'); return;
    }

    const currentTime = editorWavesurfer.getCurrentTime();
    const duration = editorWavesurfer.getDuration();
    const sampleRate = editorAudioBuffer.sampleRate;
    const numChannels = editorAudioBuffer.numberOfChannels;
    const cursorSample = Math.floor(currentTime * sampleRate);

    if (currentTime <= 0.1 || currentTime >= duration - 0.1) {
        showToast('Posicione o cursor no ponto de corte!', 'error'); return;
    }

    const ctx = new AudioContext();
    let newBuffer;

    if (section === 'start') {
        // Keep from cursor to end
        const length = editorAudioBuffer.length - cursorSample;
        newBuffer = ctx.createBuffer(numChannels, length, sampleRate);
        for (let ch = 0; ch < numChannels; ch++) {
            const src = editorAudioBuffer.getChannelData(ch);
            const dst = newBuffer.getChannelData(ch);
            for (let i = 0; i < length; i++) dst[i] = src[cursorSample + i];
        }
        showToast(`Início removido (${formatTime(currentTime)})`, 'success');
    } else {
        // Keep from start to cursor
        newBuffer = ctx.createBuffer(numChannels, cursorSample, sampleRate);
        for (let ch = 0; ch < numChannels; ch++) {
            const src = editorAudioBuffer.getChannelData(ch);
            const dst = newBuffer.getChannelData(ch);
            for (let i = 0; i < cursorSample; i++) dst[i] = src[i];
        }
        showToast(`Final removido (a partir de ${formatTime(currentTime)})`, 'success');
    }

    const blob = await audioBufferToBlob(newBuffer);
    loadAudioInEditor(blob);
    ctx.close();
}

// ============================================
// EDITOR: EXPORT
// ============================================
async function exportAudio() {
    if (!editorWavesurfer || !editorAudioBuffer) {
        showToast('Carregue um áudio primeiro!', 'error'); return;
    }
    showToast('Exportando...', 'info');
    try {
        const audioBuffer = editorWavesurfer.getDecodedData();
        const blob = await audioBufferToBlob(audioBuffer);
        saveAs(blob, 'vozforge_export.wav');
        showToast('Áudio exportado!', 'success');
    } catch (err) {
        showToast('Erro ao exportar: ' + err.message, 'error');
    }
}

// ============================================
// AUDIO BUFFER → BLOB (WAV)
// ============================================
function audioBufferToBlob(audioBuffer) {
    return new Promise((resolve) => {
        const numChannels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;
        const length = audioBuffer.length;
        const bytesPerSample = 2;
        const blockAlign = numChannels * bytesPerSample;
        const byteRate = sampleRate * blockAlign;
        const dataSize = length * blockAlign;
        const bufferSize = 44 + dataSize;

        const buffer = new ArrayBuffer(bufferSize);
        const view = new DataView(buffer);

        writeString(view, 0, 'RIFF');
        view.setUint32(4, bufferSize - 8, true);
        writeString(view, 8, 'WAVE');
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, byteRate, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, 16, true);
        writeString(view, 36, 'data');
        view.setUint32(40, dataSize, true);

        let offset = 44;
        for (let i = 0; i < length; i++) {
            for (let ch = 0; ch < numChannels; ch++) {
                let sample = audioBuffer.getChannelData(ch)[i];
                sample = Math.max(-1, Math.min(1, sample));
                view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                offset += 2;
            }
        }
        resolve(new Blob([buffer], { type: 'audio/wav' }));
    });
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
}

// ============================================
// SETTINGS
// ============================================
function initSettingsEvents() {
    const workerInput = $('#txtWorkerUrl');
    workerInput.value = state.workerUrl;
    workerInput.addEventListener('change', () => {
        state.workerUrl = workerInput.value;
        localStorage.setItem('vf-worker-url', state.workerUrl);
        showToast('URL do Worker salva!', 'success');
    });

    const apiKeyInput = $('#txtApiKeySettings');
    apiKeyInput.value = state.apiKey;
    apiKeyInput.addEventListener('change', () => {
        state.apiKey = apiKeyInput.value;
        localStorage.setItem('vf-api-key', state.apiKey);
        $('#txtApiKey').value = state.apiKey;
        showToast('API Key salva!', 'success');
    });

    $('#btnToggleKeySettings').addEventListener('click', () => {
        togglePasswordVisibility('txtApiKeySettings', 'btnToggleKeySettings');
    });

    $('#btnClearCache').addEventListener('click', () => {
        let count = 0;
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('vf-cache-')) {
                localStorage.removeItem(key); count++;
            }
        });
        localStorage.removeItem('vf-cache-history');
        updateCacheInfo();
        renderCacheHistory();
        showToast(`${count} áudios removidos do cache!`, 'success');
    });
}

function updateCacheInfo() {
    let count = 0, size = 0;
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('vf-cache-') && key !== 'vf-cache-history') {
            count++;
            size += localStorage.getItem(key).length * 2;
        }
    });
    $('#cacheCount').textContent = `${count} áudio${count !== 1 ? 's' : ''}`;
    $('#cacheSize').textContent = formatBytes(size);
}

// ============================================
// DOWNLOAD
// ============================================
function downloadCurrentAudio() {
    if (!state.currentAudioBlob) { showToast('Gere uma voz primeiro!', 'error'); return; }
    const voiceName = getVoiceName(state.selectedVoice).toLowerCase();
    const effectName = state.selectedEffect;
    saveAs(state.currentAudioBlob, `vozforge_${voiceName}_${effectName}.mp3`);
    showToast('Download iniciado!', 'success');
}

// ============================================
// UTILITIES
// ============================================
function sanitizeFilename(name) { return name.replace(/[\\/*?:"<>|]/g, '').trim().replace(/\s+/g, '_'); }

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
}

function updateTimeDisplay(id, current, total) {
    $(`#${id}`).textContent = `${formatTime(current)} / ${formatTime(total)}`;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// ============================================
// LOGGING
// ============================================
function log(message, type = 'info') {
    const container = $('#statusContent');
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.textContent = message;
    container.appendChild(entry);
    container.scrollTop = container.scrollHeight;
}

function clearLog() { $('#statusContent').innerHTML = ''; }

// ============================================
// TOAST
// ============================================
function showToast(message, type = 'info') {
    const container = $('#toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.add('toast-out'); setTimeout(() => toast.remove(), 300); }, 3000);
}

// ============================================
// LOADING
// ============================================
function showLoading(text) {
    $('#loadingText').textContent = text || 'Processando...';
    $('#loadingOverlay').classList.remove('hidden');
}
function hideLoading() { $('#loadingOverlay').classList.add('hidden'); }
