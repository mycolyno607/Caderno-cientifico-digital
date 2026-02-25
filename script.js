// Configurações globais
let currentTab = 'notes';
let currentBpTool = 'line';
let notes = JSON.parse(localStorage.getItem('scientific-notes')) || [];
let detections = [];

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    loadNotes();
    initMicroscope();
    showTab('notes');
});

// Sistema de abas
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    currentTab = tabName;
    
    if (tabName === 'microscope') startMicroscopeAI();
}

// === SISTEMA DE NOTAS ===
function saveNote() {
    const title = document.getElementById('note-title').value || 'Nota sem título';
    const content = document.getElementById('note-content').value;
    
    const note = {
        id: Date.now(),
        title,
        content,
        timestamp: new Date().toLocaleString('pt-BR'),
        tags: classifyNote(content)
    };
    
    notes.unshift(note);
    localStorage.setItem('scientific-notes', JSON.stringify(notes));
    loadNotes();
    clearNoteForm();
}

function classifyNote(content) {
    const tags = [];
    if (content.includes('wormhole') || content.includes('buraco')) tags.push('wormhole');
    if (content.includes('qiskit') || content.includes('qubit')) tags.push('quantum');
    if (content.includes('colêmbulo') || content.includes('terrário')) tags.push('biologia');
    return tags;
}

function loadNotes() {
    const list = document.getElementById('notes-list');
    list.innerHTML = notes.map(note => `
        <div class="note-item">
            <h4>${note.title}</h4>
            <small>${note.timestamp} | Tags: ${note.tags.join(', ') || 'geral'}</small>
            <p>${note.content.substring(0, 200)}${note.content.length > 200 ? '...' : ''}</p>
        </div>
    `).join('');
}

function clearNoteForm() {
    document.getElementById('note-title').value = '';
    document.getElementById('note-content').value = '';
}

// === MICRÓSCOPIO ROBÓTICO ===
let lastFrame = null;
let motionThreshold = 35;
let motionMinPixels = 300;

function initMicroscope() {
    const video = document.getElementById('mic-video');
    const thresholdSlider = document.getElementById('motion-threshold');
    const minPixelsSlider = document.getElementById('motion-minpixels');
    
    thresholdSlider.addEventListener('input', (e) => {
        motionThreshold = parseInt(e.target.value);
        document.getElementById('mic-status').textContent = `Threshold: ${motionThreshold}`;
    });
    
    minPixelsSlider.addEventListener('input', (e) => {
        motionMinPixels = parseInt(e.target.value);
    });
    
    video.addEventListener('click', () => {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                video.srcObject = stream;
                document.getElementById('mic-status').textContent = 'IA ativa - procure movimento!';
            })
            .catch(err => {
                document.getElementById('mic-status').textContent = 'Erro na câmera: ' + err.message;
            });
    });
}

function startMicroscopeAI() {
    const video = document.getElementById('mic-video');
    const overlay = document.getElementById('mic-overlay');
    const octx = overlay.getContext('2d');
    
    if (video.videoWidth === 0) {
        setTimeout(startMicroscopeAI, 500);
        return;
    }
    
    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;
    
    const offCanvas = document.createElement('canvas');
    offCanvas.width = overlay.width;
    offCanvas.height = overlay.height;
    const offCtx = offCanvas.getContext('2d');
    
    function step() {
        if (video.readyState >= 2) {
            offCtx.drawImage(video, 0, 0);
            const frame = offCtx.getImageData(0, 0, overlay.width, overlay.height);
            
            if (lastFrame) {
                const len = frame.data.length;
                let motionPixels = 0;
                let sumX = 0;
                let sumY = 0;
                
                for (let i = 0; i < len; i += 4) {
                    const diff = Math.abs(frame.data[i] - lastFrame.data[i]) +
                               Math.abs(frame.data[i+1] - lastFrame.data[i+1]) +
                               Math.abs(frame.data[i+2] - lastFrame.data[i+2]);
                    
                    if (diff > motionThreshold) {
                        motionPixels++;
                        const x = (i / 4) % overlay.width;
                        const y = Math.floor((i / 4) / overlay.width);
                        sumX += x;
                        sumY += y;
                    }
                }
                
                octx.clearRect(0, 0, overlay.width, overlay.height);
                
                if (motionPixels > motionMinPixels) {
                    const cx = sumX / motionPixels;
                    const cy = sumY / motionPixels;
                    
                    // Círculo vermelho no colêmbulo
                    octx.strokeStyle = '#ff4444';
                    octx.lineWidth = 3;
                    octx.beginPath();
                    octx.arc(cx, cy, 25, 0, Math.PI * 2);
                    octx.stroke();
                    
                    // Log da detecção
                    detections.push({
                        time: new Date().toLocaleTimeString(),
                        position: [cx, cy],
                        pixels: motionPixels
                    });
                }
            }
            
            lastFrame = frame;
        }
        
        requestAnimationFrame(step);
    }
    
    requestAnimationFrame(step);
}

// === SIMULADOR WORMHOLE ===
const C_LUZ = 299792458; // m/s

function simularWormhole() {
    const Dext_km = parseFloat(document.getElementById('wh-Dext').value);
    const Dwh_km = parseFloat(document.getElementById('wh-Dwh').value);
    const v_frac = parseFloat(document.getElementById('wh-v').value);
    
    const Dext = Dext_km * 1000;
    const Dwh = Dwh_km * 1000;
    const v = v_frac * C_LUZ;
    
    const Text = Dext / v / 3600;  // horas
    const Twh = Dwh / v / 3600;
    const Tluz = Dext / C_LUZ / 3600;
    
    const fator = Dext_km / Dwh_km;
    
    const output = document.getElementById('wh-output');
    output.textContent = `Distância externa: ${Dext_km.toLocaleString()} km
Distância wormhole: ${Dwh_km.toLocaleString()} km
Velocidade: ${v_frac.toFixed(2)}c

Tempo sem wormhole: ${Text.toExponential(3)} h
Tempo com wormhole: ${Twh.toExponential(3)} h  
Tempo luz (normal): ${Tluz.toExponential(3)} h

Fator encurtamento: ${fator.toExponential(2)}x

${Twh < Tluz ? '✅ ATAHO FTL APARENTE (sem quebrar c local)' : '❌ Luz ainda mais rápida'}`;
}

function presetTerraLua() {
    document.getElementById('wh-Dext').value = 384400;
    document.getElementById('wh-Dwh').value = 1000;
    document.getElementById('wh-v').value = 0.5;
    simularWormhole();
}

function presetExoplaneta() {
    document.getElementById('wh-Dext').value = 1.38e15;  // HD 137010 b
    document.getElementById('wh-Dwh').value = 588000000;
    document.getElementById('wh-v').value = 0.5;
    simularWormhole();
}

// === BLUEPRINT ===
const bpCanvas = document.getElementById('bp-canvas');
const bpCtx = bpCanvas.getContext('2d');
let bpIsDrawing = false;
let bpStartX, bpStartY;

bpCanvas.addEventListener('mousedown', (e) => {
    bpIsDrawing = true;
    const rect = bpCanvas.getBoundingClientRect();
    bpStartX = e.clientX - rect.left;
    bpStartY = e.clientY - rect.top;
});

bpCanvas.addEventListener('mousemove', (e) => {
    if (!bpIsDrawing) return;
    const rect = bpCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    bpCtx.clearRect(0, 0, bpCanvas.width, bpCanvas.height);
    drawBpPreview(bpStartX, bpStartY, x, y);
});

bpCanvas.addEventListener('mouseup', (e) => {
    if (!bpIsDrawing) return;
    const rect = bpCanvas.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    drawBpShape(bpStartX, bpStartY, endX, endY);
    bpIsDrawing = false;
});

function bpTool(tool) {
    currentBpTool = tool;
    bpCanvas.style.cursor = tool === 'line' ? 'crosshair' : 'crosshair';
}

function drawBpPreview(sx, sy, ex, ey) {
    bpCtx.strokeStyle = '#00ff41';
    bpCtx.lineWidth = 2;
    bpCtx.lineCap = 'round';
    
    if (currentBpTool === 'line') {
        bpCtx.beginPath();
        bpCtx.moveTo(sx, sy);
        bpCtx.lineTo(ex, ey);
        bpCtx.stroke();
    } else if (currentBpTool === 'circle') {
        const r = Math.sqrt((ex-sx)**2 + (ey-sy)**2);
        bpCtx.beginPath();
        bpCtx.arc(sx, sy, r, 0, Math.PI * 2);
        bpCtx.stroke();
    } else if (currentBpTool === 'rect') {
        bpCtx.strokeRect(sx, sy, ex-sx, ey-sy);
    }
}

function drawBpShape(sx, sy, ex, ey) {
    drawBpPreview(sx, sy, ex, ey);
}

function bpClear() {
    bpCtx.clearRect(0, 0, bpCanvas.width, bpCanvas.height);
}
