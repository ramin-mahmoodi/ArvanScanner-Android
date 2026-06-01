document.addEventListener('DOMContentLoaded', () => {
    const rangesList = document.getElementById('rangesList');
    const startBtn = document.getElementById('startBtn');
    const statusText = document.getElementById('statusText');
    const progressText = document.getElementById('progressText');
    const progressBar = document.getElementById('progressBar');
    const resultsBody = document.getElementById('resultsBody');
    const copyBtn = document.getElementById('copyBtn');
    const pingMode = document.getElementById('pingMode');
    const sniGroup = document.getElementById('sniGroup');
    const toggleSelectBtn = document.getElementById('toggleSelectBtn');
    const refreshIpsBtn = document.getElementById('refreshIpsBtn');

    let healthyIPs = [];
    let currentSort = 'latency';
    let sortAsc = true;
    let isScanning = false;

    // Load initial config (fallback to static for Android if fetch fails)
    function loadIPs() {
        rangesList.innerHTML = '<div style="padding: 1rem; text-align: center;">در حال دریافت آی‌پی‌های جدید از سرور آروان... ⏳</div>';
        if (refreshIpsBtn) refreshIpsBtn.disabled = true;
        
        fetch("https://www.arvancloud.ir/fa/ips.txt")
        .then(res => res.text())
        .then(text => {
            const lines = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
            if (lines.length > 0) {
                renderCidrs(lines);
            } else {
                renderCidrs(["185.143.232.0/22", "188.229.116.16/30", "94.101.182.0/27", "2.144.3.128/28", "37.32.16.0/27"]);
            }
        }).catch(err => {
            renderCidrs(["185.143.232.0/22", "188.229.116.16/30", "94.101.182.0/27", "2.144.3.128/28", "37.32.16.0/27"]);
        });
    }

    function renderCidrs(cidrs) {
        rangesList.innerHTML = '';
        cidrs.forEach(cidr => {
            const label = document.createElement('label');
            label.className = 'range-item';
            label.innerHTML = `<input type="checkbox" value="${cidr}"> <span dir="ltr">${cidr}</span>`;
            rangesList.appendChild(label);
        });
        if (refreshIpsBtn) refreshIpsBtn.disabled = false;
    }

    loadIPs();

    if (refreshIpsBtn) {
        refreshIpsBtn.addEventListener('click', loadIPs);
    }

    toggleSelectBtn.addEventListener('click', () => {
        const checkboxes = rangesList.querySelectorAll('input[type="checkbox"]');
        let allChecked = true;
        checkboxes.forEach(cb => {
            if (!cb.checked) allChecked = false;
        });
        checkboxes.forEach(cb => {
            cb.checked = !allChecked;
        });
    });

    const httpPortsList = ["80", "8080", "8880", "2052", "2082", "2086", "2095"];
    const httpsPortsList = ["443", "8443", "2053", "2083", "2087", "2096"];

    function createChips(containerId, ports) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        ports.forEach(port => {
            const chip = document.createElement('span');
            chip.className = 'port-chip active';
            chip.setAttribute('data-port', port);
            chip.textContent = port;
            chip.addEventListener('click', () => {
                if (!chip.classList.contains('disabled')) {
                    chip.classList.toggle('active');
                }
            });
            container.appendChild(chip);
        });
    }

    createChips('httpChips', httpPortsList);
    createChips('httpsChips', httpsPortsList);

    const pingModeInput = document.getElementById('pingMode');
    const segments = document.querySelectorAll('.segment');
    
    segments.forEach(segment => {
        segment.addEventListener('click', () => {
            segments.forEach(s => s.classList.remove('active'));
            segment.classList.add('active');
            pingModeInput.value = segment.getAttribute('data-value');
            
            const httpChipsContainer = document.getElementById('httpChips');
            if(!httpChipsContainer) return;
            const httpChips = httpChipsContainer.querySelectorAll('.port-chip');
            if (pingModeInput.value === 'tls') {
                sniGroup.style.display = 'block';
                httpChips.forEach(chip => {
                    chip.classList.remove('active');
                    chip.classList.add('disabled');
                });
            } else {
                sniGroup.style.display = 'none';
                httpChips.forEach(chip => {
                    chip.classList.add('active');
                    chip.classList.remove('disabled');
                });
            }
        });
    });

    window.addEventListener('scan_start', () => {
        statusText.textContent = 'در حال اسکن...';
        startBtn.textContent = 'توقف ⏹';
        startBtn.className = 'btn-danger';
        isScanning = true;
        resultsBody.innerHTML = '';
        healthyIPs = [];
        progressBar.style.width = '0%';
    });

    window.addEventListener('scan_progress', (e) => {
        const p = e.detail;
        progressText.textContent = `${p.tested} / ${p.total}`;
        const pct = Math.min(100, Math.round((p.tested / p.total) * 100));
        progressBar.style.width = `${pct}%`;
    });

    window.addEventListener('scan_result', (e) => {
        healthyIPs.push(e.detail);
        renderTable();
    });

    window.addEventListener('scan_done', () => {
        statusText.textContent = 'اسکن تمام شد یا متوقف شد!';
        startBtn.textContent = 'شروع اسکن 🚀';
        startBtn.className = 'btn-primary';
        startBtn.disabled = false;
        isScanning = false;
    });

    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const sortKey = th.getAttribute('data-sort');
            if (currentSort === sortKey) {
                sortAsc = !sortAsc;
            } else {
                currentSort = sortKey;
                sortAsc = true;
            }
            
            document.querySelectorAll('th[data-sort] span.sort-icon').forEach(span => span.textContent = '');
            th.querySelector('span.sort-icon').textContent = sortAsc ? ' ↓' : ' ↑';
            
            renderTable();
        });
    });

    function renderTable() {
        healthyIPs.sort((a, b) => {
            let valA = a[currentSort];
            let valB = b[currentSort];
            
            if (currentSort === 'ip') {
                return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
            } else {
                return sortAsc ? valA - valB : valB - valA;
            }
        });

        resultsBody.innerHTML = '';
        healthyIPs.forEach(r => {
            const tr = document.createElement('tr');
            let pingClass = 'ping-bad';
            if (r.latency < 100) pingClass = 'ping-good';
            else if (r.latency < 250) pingClass = 'ping-ok';
            
            tr.innerHTML = `
                <td dir="ltr">${r.ip}</td>
                <td class="${pingClass}" dir="ltr">${r.latency} ms</td>
                <td dir="ltr">${r.jitter} ms</td>
            `;
            resultsBody.appendChild(tr);
        });
    }

    startBtn.addEventListener('click', () => {
        if (isScanning) {
            startBtn.disabled = true;
            statusText.textContent = 'در حال توقف...';
            if (window.AndroidBridge) {
                window.AndroidBridge.StopScan();
            }
            return;
        }

        const checkboxes = rangesList.querySelectorAll('input:checked');
        const selectedCidrs = Array.from(checkboxes).map(cb => cb.value);
        const concurrency = parseInt(document.getElementById('concurrency').value) || 50;
        const mode = document.getElementById('pingMode').value;
        const sni = document.getElementById('sniHost').value;

        if (selectedCidrs.length === 0) {
            alert('حداقل یک رنج آی‌پی را انتخاب کنید.');
            return;
        }

        const getSelectedPorts = (containerId) => {
            const container = document.getElementById(containerId);
            if(!container) return [];
            return Array.from(container.querySelectorAll('.port-chip.active')).map(chip => chip.getAttribute('data-port'));
        };

        let targetPorts = [];
        
        if (mode === 'tls') {
            targetPorts = getSelectedPorts('httpsChips');
        } else {
            targetPorts = [...getSelectedPorts('httpChips'), ...getSelectedPorts('httpsChips')];
        }

        if (targetPorts.length === 0) {
            alert('حداقل یک گروه پورت را برای اسکن انتخاب کنید.');
            return;
        }

        const req = {
            cidrs: selectedCidrs,
            concurrency: concurrency,
            mode: mode,
            sni: sni,
            ports: targetPorts
        };

        if (window.AndroidBridge) {
            window.AndroidBridge.StartScan(JSON.stringify(req));
        } else {
            alert("AndroidBridge not found. Not running in WebView?");
        }
    });

    copyBtn.addEventListener('click', () => {
        if (healthyIPs.length === 0) {
            alert('هنوز آی‌پی سالمی پیدا نشده است!');
            return;
        }
        const text = healthyIPs.map(r => r.ip).join('\n');
        
        // Copy to clipboard trick for older WebViews
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            alert('تمام آی‌پی‌ها کپی شدند!');
        } catch (err) {
            alert('خطا در کپی: ' + err);
        }
        document.body.removeChild(textArea);
    });
});
