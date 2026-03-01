/**
 * VozForge — Gerador de Vozes Neurais
 * Motor: Edge-TTS (Cloudflare Worker) + ElevenLabs API
 * Editor: WaveSurfer.js + Web Audio API
 */

// ============================================
// CONFIG
// ============================================
const DEFAULT_WORKER_URL = 'https://voices.jacsonsax.workers.dev';

// ============================================
// VOZES DISPONÍVEIS
// ============================================
const EDGE_VOICES = [
    { id: 'pt-BR-FranciscaNeural', name: 'Francisca', gender: 'female', star: true },
    { id: 'pt-BR-AntonioNeural', name: 'Antonio', gender: 'male' },
    { id: 'pt-BR-BrendaNeural', name: 'Brenda', gender: 'female' },
    { id: 'pt-BR-DonatoNeural', name: 'Donato', gender: 'male' },
    { id: 'pt-BR-ElzaNeural', name: 'Elza', gender: 'female' },
    { id: 'pt-BR-FabioNeural', name: 'Fabio', gender: 'male' },
    { id: 'pt-BR-GiovannaNeural', name: 'Giovanna', gender: 'female' },
    { id: 'pt-BR-HumbertoNeural', name: 'Humberto', gender: 'male' },
    { id: 'pt-BR-LeticiaNeural', name: 'Leticia', gender: 'female' },
    { id: 'pt-BR-ManuelaNeural', name: 'Manuela', gender: 'female' },
    { id: 'pt-BR-NicolauNeural', name: 'Nicolau', gender: 'male' },
    { id: 'pt-BR-ThalitaNeural', name: 'Thalita', gender: 'female' },
    { id: 'pt-BR-ValerioNeural', name: 'Valerio', gender: 'male' },
];

const ELEVEN_VOICES = [
    { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', gender: 'male', desc: 'Narrador Profundo' },
    { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', gender: 'female', desc: 'Padrão/Clara' },
    { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', gender: 'male', desc: 'Enérgico/Games' },
    { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', gender: 'male', desc: 'Jornalista' },
    { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', gender: 'female', desc: 'Suave' },
    { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum', gender: 'male', desc: 'Vilão/Rouco' },
    { id: 'pqHfZKP75CvOlQylNhV4', name: 'Bill', gender: 'male', desc: 'Sábio' },
    { id: 'D38z5RcWu1voky8WS1ja', name: 'Fin', gender: 'male', desc: 'Jovem Gamer' },
    { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice', gender: 'female', desc: 'Notícias' },
    { id: 'z9fAnlkpzviPz146aGWa', name: 'Glinda', gender: 'female', desc: 'Bruxa' },
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
    provider: 'edge',        // 'edge' | 'eleven'
    selectedVoice: EDGE_VOICES[0].id,
    selectedEffect: 'natural',
    currentAudioBlob: null,
    currentAudioUrl: null,
    theme: localStorage.getItem('vf-theme') || 'dark',
    workerUrl: localStorage.getItem('vf-worker-url') || DEFAULT_WORKER_URL,
    apiKey: localStorage.getItem('vf-api-key') || '',
};

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
// VOICE GRID
// ============================================
function renderVoiceGrid() {
    const grid = $('#voiceGrid');
    const voices = state.provider === 'edge' ? EDGE_VOICES : ELEVEN_VOICES;
    const badge = state.provider === 'edge' ? '<span class="voice-badge free">FREE</span>' : '<span class="voice-badge premium">PRO</span>';

    grid.innerHTML = voices.map(v => `
        <div class="voice-card ${v.id === state.selectedVoice ? 'selected' : ''}" data-voice="${v.id}">
            ${badge}
            <div class="voice-avatar ${v.gender}">
                <i class="fas fa-${v.gender === 'female' ? 'venus' : 'mars'}"></i>
            </div>
            <div class="voice-name">${v.name}${v.star ? ' ⭐' : ''}</div>
            <div class="voice-gender">${v.desc || (v.gender === 'female' ? 'Feminino' : 'Masculino')}</div>
        </div>
    `).join('');

    grid.querySelectorAll('.voice-card').forEach(card => {
        card.addEventListener('click', () => {
            grid.querySelectorAll('.voice-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            state.selectedVoice = card.dataset.voice;
        });
    });
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
    // Char count
    $('#txtInput').addEventListener('input', updateCharCount);

    // Provider toggle
    $('#btnEdge').addEventListener('click', () => switchProvider('edge'));
    $('#btnEleven').addEventListener('click', () => switchProvider('eleven'));

    // API Key toggle visibility
    $('#btnToggleKey').addEventListener('click', () => togglePasswordVisibility('txtApiKey', 'btnToggleKey'));

    // Sliders
    $('#sliderRate').addEventListener('input', (e) => {
        $('#rateValue').textContent = `${e.target.value > 0 ? '+' : ''}${e.target.value}%`;
    });
    $('#sliderPitch').addEventListener('input', (e) => {
        $('#pitchValue').textContent = `${e.target.value > 0 ? '+' : ''}${e.target.value}Hz`;
    });

    // Generate
    $('#btnGenerate').addEventListener('click', generateSingle);

    // Download
    $('#btnDownload').addEventListener('click', downloadCurrentAudio);

    // Edit
    $('#btnEditAudio').addEventListener('click', () => {
        if (state.currentAudioBlob) {
            loadAudioInEditor(state.currentAudioBlob);
            // Switch to editor tab
            $$('.tab-btn').forEach(b => b.classList.remove('active'));
            $$('.tab-content').forEach(c => c.classList.remove('active'));
            document.querySelector('[data-tab="editor"]').classList.add('active');
            $('#tab-editor').classList.add('active');
        }
    });
}

function updateCharCount() {
    const count = $('#txtInput').value.length;
    $('#charCount').textContent = count;
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
// GENERATE SINGLE VOICE
// ============================================
async function generateSingle() {
    const text = $('#txtInput').value.trim();
    if (!text) {
        showToast('Digite o texto primeiro!', 'error');
        return;
    }

    // Get effect settings
    const effect = getEffectSettings();

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

        // Show player
        showPlayer(state.currentAudioUrl);
        log('✅ Voz gerada com sucesso!', 'success');
        showToast('Voz gerada!', 'success');

        // Cache it
        cacheAudio(text + '_' + state.selectedVoice, blob);

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

    log(`📡 Chamando Worker: ${workerUrl.substring(0, 40)}...`, 'info');

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
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
            }
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

    // Destroy previous
    if (previewWavesurfer) {
        previewWavesurfer.destroy();
    }

    previewWavesurfer = WaveSurfer.create({
        container: '#waveformPreview',
        waveColor: '#6c5ce7',
        progressColor: '#a855f7',
        cursorColor: '#ec4899',
        barWidth: 3,
        barGap: 2,
        barRadius: 3,
        height: 80,
        responsive: true,
        normalize: true,
        backend: 'WebAudio',
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

    // Play button
    $('#btnPlay').onclick = () => {
        previewWavesurfer.playPause();
        const icon = $('#btnPlay i');
        icon.className = previewWavesurfer.isPlaying() ? 'fas fa-pause' : 'fas fa-play';
    };

    // Scroll to player
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
    if (!text) {
        showToast('Digite as frases primeiro!', 'error');
        return;
    }

    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length === 0) {
        showToast('Nenhuma frase encontrada!', 'error');
        return;
    }

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
                if (!apiKey) throw new Error('API Key necessária para ElevenLabs!');
                blob = await generateElevenLabs(phrase, state.selectedVoice, apiKey);
            }

            zip.file(filename, blob);
            completed++;

        } catch (err) {
            log(`⚠️ Erro em "${filename}": ${err.message}`, 'error');
        }

        // Update progress
        const pct = ((i + 1) / lines.length) * 100;
        $('#progressFill').style.width = `${pct}%`;
        $('#progressText').textContent = `${i + 1} / ${lines.length}`;

        // Small delay to avoid overwhelming the Worker
        if (state.provider === 'edge' && i < lines.length - 1) {
            await sleep(500);
        }
    }

    if (completed > 0) {
        log(`📦 Compactando ${completed} arquivos em ZIP...`, 'info');

        try {
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, 'vozes_assets.zip');
            log(`✅ ZIP baixado! (${(content.size / 1024).toFixed(1)} KB)`, 'success');
            showToast(`${completed} áudios gerados e baixados!`, 'success');
        } catch (err) {
            log(`❌ Erro ao criar ZIP: ${err.message}`, 'error');
            showToast('Erro ao criar ZIP', 'error');
        }
    } else {
        log(`❌ Nenhum áudio foi gerado.`, 'error');
        showToast('Nenhum áudio gerado', 'error');
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
    // Load file
    $('#btnLoadFile').addEventListener('click', () => $('#fileInput').click());

    $('#fileInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            loadAudioInEditor(file);
        }
    });

    // Drag and drop
    const editorCard = $('#tab-editor .card');
    editorCard.addEventListener('dragover', (e) => {
        e.preventDefault();
        editorCard.style.borderColor = 'var(--accent)';
    });
    editorCard.addEventListener('dragleave', () => {
        editorCard.style.borderColor = '';
    });
    editorCard.addEventListener('drop', (e) => {
        e.preventDefault();
        editorCard.style.borderColor = '';
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('audio')) {
            loadAudioInEditor(file);
        }
    });

    // Speed slider
    $('#sliderSpeed').addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        $('#speedValue').textContent = `${val.toFixed(1)}x`;
        if (editorWavesurfer) {
            editorWavesurfer.setPlaybackRate(val);
        }
    });

    // Volume slider
    $('#sliderVolume').addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        $('#volumeValue').textContent = `${Math.round(val * 100)}%`;
        if (editorWavesurfer) {
            editorWavesurfer.setVolume(val > 1 ? 1 : val);
        }
    });

    // Zoom
    $('#btnZoomIn').addEventListener('click', () => {
        if (editorWavesurfer) {
            const current = editorWavesurfer.options.minPxPerSec || 50;
            editorWavesurfer.zoom(Math.min(current + 20, 300));
        }
    });

    $('#btnZoomOut').addEventListener('click', () => {
        if (editorWavesurfer) {
            const current = editorWavesurfer.options.minPxPerSec || 50;
            editorWavesurfer.zoom(Math.max(current - 20, 10));
        }
    });

    // Trim silence
    $('#btnTrimSilence').addEventListener('click', trimSilence);

    // Crop selection
    $('#btnCropSelection').addEventListener('click', cropSelection);

    // Export
    $('#btnExport').addEventListener('click', exportAudio);

    // Play/Stop
    $('#btnEditorPlay').addEventListener('click', () => {
        if (editorWavesurfer) {
            editorWavesurfer.playPause();
            const icon = $('#btnEditorPlay i');
            icon.className = editorWavesurfer.isPlaying() ? 'fas fa-pause' : 'fas fa-play';
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

    if (editorWavesurfer) {
        editorWavesurfer.destroy();
    }

    editorWavesurfer = WaveSurfer.create({
        container: '#waveformEditor',
        waveColor: '#a29bfe',
        progressColor: '#6c5ce7',
        cursorColor: '#ec4899',
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        height: 120,
        responsive: true,
        normalize: true,
        backend: 'WebAudio',
        plugins: [],
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
        showToast('Carregue um áudio primeiro!', 'error');
        return;
    }

    showToast('Cortando silêncio...', 'info');

    const audioBuffer = editorAudioBuffer;
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const threshold = 0.01;
    const chunkSize = Math.floor(sampleRate * 0.01); // 10ms chunks

    // Find start (first non-silent sample)
    let startSample = 0;
    for (let i = 0; i < channelData.length; i += chunkSize) {
        const end = Math.min(i + chunkSize, channelData.length);
        let maxAmp = 0;
        for (let j = i; j < end; j++) {
            maxAmp = Math.max(maxAmp, Math.abs(channelData[j]));
        }
        if (maxAmp > threshold) {
            startSample = Math.max(0, i - chunkSize);
            break;
        }
    }

    // Find end (last non-silent sample)
    let endSample = channelData.length;
    for (let i = channelData.length - 1; i >= 0; i -= chunkSize) {
        const start = Math.max(0, i - chunkSize);
        let maxAmp = 0;
        for (let j = start; j <= i; j++) {
            maxAmp = Math.max(maxAmp, Math.abs(channelData[j]));
        }
        if (maxAmp > threshold) {
            endSample = Math.min(channelData.length, i + chunkSize);
            break;
        }
    }

    if (startSample >= endSample) {
        showToast('Áudio parece ser todo silêncio!', 'error');
        return;
    }

    // Create trimmed buffer
    const trimmedLength = endSample - startSample;
    const ctx = new AudioContext();
    const newBuffer = ctx.createBuffer(
        audioBuffer.numberOfChannels,
        trimmedLength,
        sampleRate
    );

    for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
        const oldData = audioBuffer.getChannelData(ch);
        const newData = newBuffer.getChannelData(ch);
        for (let i = 0; i < trimmedLength; i++) {
            newData[i] = oldData[startSample + i];
        }
    }

    // Convert to blob and reload
    const blob = await audioBufferToBlob(newBuffer);
    loadAudioInEditor(blob);

    const removedMs = ((channelData.length - trimmedLength) / sampleRate * 1000).toFixed(0);
    showToast(`Silêncio removido! (${removedMs}ms cortados)`, 'success');
    ctx.close();
}

// ============================================
// EDITOR: CROP SELECTION
// ============================================
function cropSelection() {
    if (!editorWavesurfer || !editorAudioBuffer) {
        showToast('Carregue um áudio primeiro!', 'error');
        return;
    }

    // WaveSurfer v7 doesn't have regions by default. 
    // For simplicity, we'll use the current position as a rough selection
    showToast('Use os botões Auto-Trim para cortar automaticamente', 'info');
}

// ============================================
// EDITOR: EXPORT
// ============================================
async function exportAudio() {
    if (!editorWavesurfer || !editorAudioBuffer) {
        showToast('Carregue um áudio primeiro!', 'error');
        return;
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
        const bytesPerSample = 2; // 16-bit
        const blockAlign = numChannels * bytesPerSample;
        const byteRate = sampleRate * blockAlign;
        const dataSize = length * blockAlign;
        const bufferSize = 44 + dataSize;

        const buffer = new ArrayBuffer(bufferSize);
        const view = new DataView(buffer);

        // WAV Header
        writeString(view, 0, 'RIFF');
        view.setUint32(4, bufferSize - 8, true);
        writeString(view, 8, 'WAVE');
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true); // chunk size
        view.setUint16(20, 1, true); // PCM
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, byteRate, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, 16, true); // bits per sample
        writeString(view, 36, 'data');
        view.setUint32(40, dataSize, true);

        // Write samples
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
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

// ============================================
// SETTINGS
// ============================================
function initSettingsEvents() {
    // Worker URL
    const workerInput = $('#txtWorkerUrl');
    workerInput.value = state.workerUrl;
    workerInput.addEventListener('change', () => {
        state.workerUrl = workerInput.value;
        localStorage.setItem('vf-worker-url', state.workerUrl);
        showToast('URL do Worker salva!', 'success');
    });

    // API Key Settings
    const apiKeyInput = $('#txtApiKeySettings');
    apiKeyInput.value = state.apiKey;
    apiKeyInput.addEventListener('change', () => {
        state.apiKey = apiKeyInput.value;
        localStorage.setItem('vf-api-key', state.apiKey);
        // Sync with generator tab
        $('#txtApiKey').value = state.apiKey;
        showToast('API Key salva!', 'success');
    });

    $('#btnToggleKeySettings').addEventListener('click', () => {
        togglePasswordVisibility('txtApiKeySettings', 'btnToggleKeySettings');
    });

    // Clear cache
    $('#btnClearCache').addEventListener('click', () => {
        let count = 0;
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('vf-cache-')) {
                localStorage.removeItem(key);
                count++;
            }
        });
        updateCacheInfo();
        showToast(`${count} áudios removidos do cache!`, 'success');
    });
}

function updateCacheInfo() {
    let count = 0;
    let size = 0;
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
        if (key.startsWith('vf-cache-')) {
            count++;
            size += localStorage.getItem(key).length * 2; // approximate bytes
        }
    });
    $('#cacheCount').textContent = `${count} áudio${count !== 1 ? 's' : ''}`;
    $('#cacheSize').textContent = formatBytes(size);
}

// ============================================
// CACHE
// ============================================
async function cacheAudio(key, blob) {
    try {
        const reader = new FileReader();
        reader.onloadend = () => {
            try {
                localStorage.setItem(`vf-cache-${key}`, reader.result);
                updateCacheInfo();
            } catch (e) {
                // localStorage full, silently fail
            }
        };
        reader.readAsDataURL(blob);
    } catch (e) {
        // Ignore cache errors
    }
}

// ============================================
// DOWNLOAD
// ============================================
function downloadCurrentAudio() {
    if (!state.currentAudioBlob) {
        showToast('Gere uma voz primeiro!', 'error');
        return;
    }
    const voiceName = getVoiceName(state.selectedVoice).toLowerCase();
    const effectName = state.selectedEffect;
    saveAs(state.currentAudioBlob, `vozforge_${voiceName}_${effectName}.mp3`);
    showToast('Download iniciado!', 'success');
}

// ============================================
// UTILITIES
// ============================================
function sanitizeFilename(name) {
    return name.replace(/[\\/*?:"<>|]/g, '').trim().replace(/\s+/g, '_');
}

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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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

function clearLog() {
    $('#statusContent').innerHTML = '';
}

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

    setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// LOADING
// ============================================
function showLoading(text) {
    $('#loadingText').textContent = text || 'Processando...';
    $('#loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    $('#loadingOverlay').classList.add('hidden');
}
