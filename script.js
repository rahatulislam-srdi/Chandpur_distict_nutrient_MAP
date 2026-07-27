// ১. ম্যাপ সেটআপ
const map = L.map('map').setView([23.2333, 90.6667], 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// North Arrow ডানপাশে উপরে যুক্ত করা
const northArrow = L.control({ position: 'topright' });
northArrow.onAdd = function () {
    const div = L.DomUtil.create('div', 'north-arrow-control');
    div.innerHTML = `
        <span class="north-arrow-icon">⬆</span>
        <span class="north-text">N</span>
    `;
    return div;
};
northArrow.addTo(map);

let currentMode = 'old';
let currentLayerKey = 'Nitrogen';
let geojsonData = null;
let geojsonLayer = null;
let activeChartInstance = null;
let selectedFeatureProps = null;
let legendControl = null;

// ২. সকল নিউট্রিয়েন্টের নির্দিষ্ট ক্যাটাগরি ও কালার
const nutrientRanges = {
    'Nitrogen': [
        { label: 'Very Low (0.01 - 0.09)', min: 0.01, max: 0.09, color: '#d73027' },
        { label: 'Low (0.091 - 0.18)', min: 0.091, max: 0.18, color: '#f46d43' },
        { label: 'Moderate (0.181 - 0.27)', min: 0.181, max: 0.27, color: '#fee08b' },
        { label: 'Optimum (0.271 - 0.36)', min: 0.271, max: 0.36, color: '#d9ef8b' },
        { label: 'High (0.361 - 0.45)', min: 0.361, max: 0.45, color: '#66bd63' },
        { label: 'Very High (> 0.45)', min: 0.4501, max: Infinity, color: '#1a9850' }
    ],
    'Phosphorus': [
        { label: 'Very Low (0.01 - 5.25)', min: 0.01, max: 5.25, color: '#d73027' },
        { label: 'Low (5.26 - 10.5)', min: 5.26, max: 10.5, color: '#f46d43' },
        { label: 'Moderate (10.51 - 15.75)', min: 10.51, max: 15.75, color: '#fee08b' },
        { label: 'Optimum (15.76 - 21.0)', min: 15.76, max: 21.0, color: '#d9ef8b' },
        { label: 'High (21.1 - 26.25)', min: 21.1, max: 26.25, color: '#66bd63' },
        { label: 'Very High (> 26.25)', min: 26.2501, max: Infinity, color: '#1a9850' }
    ],
    'Potassium': [
        { label: 'Very Low (0.01 - 0.09)', min: 0.01, max: 0.09, color: '#d73027' },
        { label: 'Low (0.091 - 0.18)', min: 0.091, max: 0.18, color: '#f46d43' },
        { label: 'Moderate (0.181 - 0.27)', min: 0.181, max: 0.27, color: '#fee08b' },
        { label: 'Optimum (0.271 - 0.36)', min: 0.271, max: 0.36, color: '#d9ef8b' },
        { label: 'High (0.361 - 0.45)', min: 0.361, max: 0.45, color: '#66bd63' },
        { label: 'Very High (> 0.45)', min: 0.4501, max: Infinity, color: '#1a9850' }
    ],
    'Sulphur': [
        { label: 'Very Low (0.01 - 7.5)', min: 0.01, max: 7.5, color: '#d73027' },
        { label: 'Low (7.51 - 15.0)', min: 7.51, max: 15.0, color: '#f46d43' },
        { label: 'Moderate (15.1 - 22.5)', min: 15.1, max: 22.5, color: '#fee08b' },
        { label: 'Optimum (22.51 - 30.0)', min: 22.51, max: 30.0, color: '#d9ef8b' },
        { label: 'High (30.1 - 37.5)', min: 30.1, max: 37.5, color: '#66bd63' },
        { label: 'Very High (> 37.5)', min: 37.501, max: Infinity, color: '#1a9850' }
    ],
    'Zinc': [
        { label: 'Very Low (0.01 - 0.45)', min: 0.01, max: 0.45, color: '#d73027' },
        { label: 'Low (0.451 - 0.9)', min: 0.451, max: 0.9, color: '#f46d43' },
        { label: 'Moderate (0.91 - 1.35)', min: 0.91, max: 1.35, color: '#fee08b' },
        { label: 'Optimum (1.351 - 1.8)', min: 1.351, max: 1.8, color: '#d9ef8b' },
        { label: 'High (1.801 - 2.25)', min: 1.801, max: 2.25, color: '#66bd63' },
        { label: 'Very High (> 2.25)', min: 2.2501, max: Infinity, color: '#1a9850' }
    ],
    'Boron': [
        { label: 'Very Low (0.01 - 0.15)', min: 0.01, max: 0.15, color: '#d73027' },
        { label: 'Low (0.151 - 0.3)', min: 0.151, max: 0.3, color: '#f46d43' },
        { label: 'Moderate (0.301 - 0.45)', min: 0.301, max: 0.45, color: '#fee08b' },
        { label: 'Optimum (0.451 - 0.6)', min: 0.451, max: 0.6, color: '#d9ef8b' },
        { label: 'High (0.601 - 0.75)', min: 0.601, max: 0.75, color: '#66bd63' },
        { label: 'Very High (> 0.75)', min: 0.7501, max: Infinity, color: '#1a9850' }
    ],
    'Calcium': [
        { label: 'Very Low (0.01 - 1.5)', min: 0.01, max: 1.5, color: '#d73027' },
        { label: 'Low (1.51 - 3.0)', min: 1.51, max: 3.0, color: '#f46d43' },
        { label: 'Moderate (3.01 - 4.5)', min: 3.01, max: 4.5, color: '#fee08b' },
        { label: 'Optimum (4.51 - 6.0)', min: 4.51, max: 6.0, color: '#d9ef8b' },
        { label: 'High (6.01 - 7.5)', min: 6.01, max: 7.5, color: '#66bd63' },
        { label: 'Very High (> 7.5)', min: 7.501, max: Infinity, color: '#1a9850' }
    ],
    'Magnesium': [
        { label: 'Very Low (0.01 - 0.375)', min: 0.01, max: 0.375, color: '#d73027' },
        { label: 'Low (0.376 - 0.75)', min: 0.376, max: 0.75, color: '#f46d43' },
        { label: 'Moderate (0.751 - 1.125)', min: 0.751, max: 1.125, color: '#fee08b' },
        { label: 'Optimum (1.1256 - 1.5)', min: 1.1256, max: 1.5, color: '#d9ef8b' },
        { label: 'High (1.501 - 1.875)', min: 1.501, max: 1.875, color: '#66bd63' },
        { label: 'Very High (> 1.875)', min: 1.8751, max: Infinity, color: '#1a9850' }
    ],
    'pH': [
        { label: 'Extremely Acidic (0 - 4.5)', max: 4.5, color: '#a50026' },
        { label: 'Highly Acidic (4.51 - 5.5)', max: 5.5, color: '#d73027' },
        { label: 'Slightly Acidic (5.51 - 6.5)', max: 6.5, color: '#fee08b' },
        { label: 'Neutral (6.6 - 7.3)', max: 7.3, color: '#1a9850' },
        { label: 'Slightly Alkaline (7.4 - 8.4)', max: 8.4, color: '#67a9cf' },
        { label: 'Highly Alkaline (8.5 - 9.0)', max: 9.0, color: '#02818a' },
        { label: 'Extremely Alkaline (> 9.0)', max: Infinity, color: '#014636' }
    ],
    'OM': [
        { label: 'Extremely Low (0 - 1.0)', max: 1.0, color: '#d73027' },
        { label: 'Low (1.01 - 1.7)', max: 1.7, color: '#f46d43' },
        { label: 'Moderate (1.71 - 3.4)', max: 3.4, color: '#fee08b' },
        { label: 'High (3.41 - 5.5)', max: 5.5, color: '#66bd63' },
        { label: 'Extremely High (> 5.5)', max: Infinity, color: '#1a9850' }
    ],
    'Texture': [
        { label: 'Clay (1)', val: 1, color: '#8c510a' },
        { label: 'Clay Loam (2)', val: 2, color: '#d8b365' },
        { label: 'Loam (3)', val: 3, color: '#5ab4ac' },
        { label: 'Sandy Loam (4)', val: 4, color: '#01665e' }
    ]
};

// ৩. প্রপার্টি নাম বের করা
function getPropName(key, mode) {
    if (key === 'pH') return 'pH';
    if (key === 'Texture') return mode === 'old' ? 'Texture_ol' : 'Texture_ne';
    return `${key}_${mode}`;
}

// ডাটা নেওয়া
function getFeatureValue(feature, key, mode) {
    if (!feature || !feature.properties) return null;
    const targetProp = getPropName(key, mode);
    const props = feature.properties;
    
    for (let p in props) {
        if (p.toLowerCase() === targetProp.toLowerCase()) {
            let val = props[p];
            if (val === null || val === undefined || val === '' || val === 0 || val === '0') {
                return null;
            }
            
            // Texture টেক্সট বা কোড হতে পারে
            if (key === 'Texture') {
                if (typeof val === 'string') {
                    let str = val.toLowerCase().trim();
                    if (str.includes('clay loam') || str === '2') return 2;
                    if (str.includes('clay') || str === '1') return 1;
                    if (str.includes('sandy loam') || str === '4') return 4;
                    if (str.includes('loam') || str === '3') return 3;
                }
            }

            let num = parseFloat(val);
            return isNaN(num) ? null : num;
        }
    }
    return null;
}

// ৪. কালার নির্ধারণ লজিক
function getColor(val, key) {
    if (val === null || val === undefined) return null;

    if (nutrientRanges[key]) {
        const ranges = nutrientRanges[key];
        
        // Texture এর ক্ষেত্রে সরাসরি মান মেলানো
        if (key === 'Texture') {
            let found = ranges.find(r => r.val === val);
            return found ? found.color : '#bf812d';
        }

        // অন্যান্য নিউট্রিয়েন্টের জন্য রেঞ্জ ম্যাচ করা
        for (let i = 0; i < ranges.length; i++) {
            if (val <= ranges[i].max) return ranges[i].color;
        }
        return ranges[ranges.length - 1].color;
    }

    return '#999999';
}

// ৫. পলিগনের স্টাইল (খালি ডাটা থাকলে পলিগন সচ্ছ থাকবে)
function style(feature) {
    const val = getFeatureValue(feature, currentLayerKey, currentMode);
    const color = getColor(val, currentLayerKey);

    if (color === null) {
        return {
            fillColor: 'transparent',
            fillOpacity: 0,
            weight: 0.5,
            color: '#ccc',
            opacity: 0.3
        };
    }

    return {
        fillColor: color,
        weight: 1,
        opacity: 0.8,
        color: '#ffffff',
        fillOpacity: 0.85
    };
}

// ৬. পলিগনে ক্লিক ইভেন্ট
function onEachFeature(feature, layer) {
    layer.on('click', function () {
        if (geojsonLayer) geojsonLayer.resetStyle();
        
        layer.setStyle({
            weight: 3,
            color: '#000000',
            fillOpacity: 0.95
        });

        selectedFeatureProps = feature;
        updateSidebarTable(feature.properties);
        updateSidebarChart();
    });
}

// ৭. ডায়নামিক লেজেন্ড
function updateLegend() {
    if (legendControl) {
        map.removeControl(legendControl);
    }

    legendControl = L.control({ position: 'bottomright' });

    legendControl.onAdd = function () {
        const div = L.DomUtil.create('div', 'info legend');
        div.innerHTML = `<h4>${currentLayerKey} Category</h4>`;

        if (nutrientRanges[currentLayerKey]) {
            nutrientRanges[currentLayerKey].forEach(item => {
                div.innerHTML += `
                    <div class="legend-item">
                        <i class="legend-color" style="background: ${item.color};"></i>
                        <span>${item.label}</span>
                    </div>`;
            });
        }

        // ডাটা না থাকলে খালি দেখানোর জন্য
        div.innerHTML += `
            <div class="legend-item" style="margin-top: 6px; border-top: 1px solid #ddd; padding-top: 4px;">
                <i class="legend-color" style="background: transparent; border: 1px dashed #999;"></i>
                <span>No Data / Blank</span>
            </div>`;

        return div;
    };

    legendControl.addTo(map);
}

// ৮. বামপাশের টেবিল আপডেট (Area Field সহ)
function updateSidebarTable(props) {
    const table = document.getElementById('propsTable');
    if (!table) return;

    const divName = props.divname || props.DIVNAME || 'N/A';
    const distName = props.distname || props.DISTNAME || 'N/A';
    const thanaName = props.THANAME || props.thananame || props.thana || 'N/A';
    const uniName = props.uniname || props.UNINAME || 'N/A';
    const mauzaName = props.mauzname || props.MAUZNAME || 'N/A';
    
    // Area ফিল্ড থেকে মান নেওয়া
    let rawArea = props.area || props.AREA || props.Area || props.Shape_Area || props.shape_area;
    let areaVal = 'N/A';
    
    if (rawArea) {
        let numArea = parseFloat(rawArea);
        areaVal = !isNaN(numArea) ? `${numArea.toFixed(2)} sq km` : `${rawArea}`;
    }

    document.getElementById('selected-area-title').innerText = `${mauzaName} Mauza`;

    table.innerHTML = `
        <tr><td>Division:</td><td>${divName}</td></tr>
        <tr><td>District:</td><td>${distName}</td></tr>
        <tr><td>Thana:</td><td>${thanaName}</td></tr>
        <tr><td>Union:</td><td>${uniName}</td></tr>
        <tr><td>Area:</td><td>${areaVal}</td></tr>
    `;
}

// ৯. বার-চার্ট আপডেট
function updateSidebarChart() {
    const ctx = document.getElementById('sidebarChart');
    if (!ctx || !selectedFeatureProps) return;

    const oldVal = getFeatureValue(selectedFeatureProps, currentLayerKey, 'old');
    const newVal = getFeatureValue(selectedFeatureProps, currentLayerKey, 'new');

    if (activeChartInstance) {
        activeChartInstance.destroy();
    }

    activeChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Old Map', 'New Map'],
            datasets: [{
                label: `${currentLayerKey} Value`,
                data: [oldVal || 0, newVal || 0],
                backgroundColor: ['#e74c3c', '#27ae60'],
                borderColor: ['#c0392b', '#219150'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: `${currentLayerKey} (Old vs New)`,
                    color: '#333',
                    font: { size: 12, weight: 'bold' }
                },
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// ১০. রেন্ডারিং
function renderLayer() {
    if (!geojsonData) return;
    if (geojsonLayer) map.removeLayer(geojsonLayer);

    geojsonLayer = L.geoJSON(geojsonData, {
        style: style,
        onEachFeature: onEachFeature
    }).addTo(map);

    updateLegend();

    if (selectedFeatureProps) {
        updateSidebarChart();
    }
}

// ১১. ইভেন্ট লিসেনারস
document.addEventListener("DOMContentLoaded", function () {
    const layerSelect = document.getElementById('layerSelect');
    if (layerSelect) {
        layerSelect.addEventListener('change', function(e) {
            currentLayerKey = e.target.value;
            renderLayer();
        });
    }

    const shiftBtn = document.getElementById('shiftBtn');
    if (shiftBtn) {
        shiftBtn.addEventListener('click', function() {
            const badge = document.getElementById('modeBadge');
            if (currentMode === 'old') {
                currentMode = 'new';
                this.innerText = 'Shift to OLD Map';
                if (badge) {
                    badge.innerText = 'Showing: NEW MAP';
                    badge.className = 'status-badge new-badge';
                }
            } else {
                currentMode = 'old';
                this.innerText = 'Shift to NEW Map';
                if (badge) {
                    badge.innerText = 'Showing: OLD MAP';
                    badge.className = 'status-badge old-badge';
                }
            }
            renderLayer();
        });
    }

    // GeoJSON ফাইল লোড
    fetch('Chandpur.geojson')
        .then(response => {
            if (!response.ok) throw new Error('Chandpur.geojson File Not Found!');
            return response.json();
        })
        .then(data => {
            geojsonData = data;
            renderLayer();
            if (geojsonLayer) map.fitBounds(geojsonLayer.getBounds());
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('selected-area-title').innerText = "Error Loading GeoJSON File!";
        });
});