// 同花顺相关函数

// 打开同花顺配置弹窗
function openThsConfigModal() {
    const modal = document.getElementById('thsConfigModal');
    modal.style.display = 'flex';

    // 获取已保存的配置
    fetch(`${API_BASE}/ths/config`)
        .then(res => res.json())
        .then(config => {
            if (config.hasUserId) {
                document.getElementById('thsUserId').value = localStorage.getItem('ths_user_id') || '';
            }
            if (config.hasCookie) {
                document.getElementById('thsCookie').value = localStorage.getItem('ths_cookie') || '';
            }
        })
        .catch(err => {
            console.error('获取配置失败:', err);
        });
}

// 关闭同花顺配置弹窗
function closeThsConfigModal() {
    const modal = document.getElementById('thsConfigModal');
    modal.style.display = 'none';
}

// 保存同花顺配置
function saveThsConfig() {
    const userId = document.getElementById('thsUserId').value.trim();
    const cookie = document.getElementById('thsCookie').value.trim();

    if (!userId) {
        alert('请输入用户ID');
        return;
    }
    if (!cookie) {
        alert('请输入Cookie');
        return;
    }

    // 保存到本地
    localStorage.setItem('ths_user_id', userId);
    localStorage.setItem('ths_cookie', cookie);

    // 保存到服务器
    const formData = new URLSearchParams();
    formData.append('userId', userId);
    formData.append('cookie', cookie);

    fetch(`${API_BASE}/ths/saveCookie`, {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert('配置保存成功！');
            closeThsConfigModal();
        } else {
            alert('保存失败: ' + data.error);
        }
    })
    .catch(err => {
        alert('保存失败: ' + err.message);
    });
}

// 从同花顺导入数据
function importThsData() {
    // 检查是否已配置
    const userId = localStorage.getItem('ths_user_id');
    const cookie = localStorage.getItem('ths_cookie');

    if (!userId || !cookie) {
        alert('请先配置同花顺Cookie和用户ID');
        openThsConfigModal();
        return;
    }

    // 发送请求获取数据
    fetch(`${API_BASE}/ths/clearedPositions?year=${currentYear}&month=${currentMonth}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                if (data.data && data.data.length > 0) {
                    // 将数据填入自我收益表格
                    fillSelfProfitTableFromThs(data.data);
                    alert(`成功导入 ${data.data.length} 条数据！`);
                } else {
                    alert('该月没有平仓记录');
                }
            } else if (data.error === 'cookie_expired') {
                alert('Cookie已过期，请重新配置！');
                openThsConfigModal();
            } else {
                alert('获取数据失败: ' + data.message);
            }
        })
        .catch(err => {
            alert('获取数据失败: ' + err.message);
        });
}

// 刷新每日/月累计数据
async function refreshDailyProfit() {
    const userId = localStorage.getItem('ths_user_id');
    const cookie = localStorage.getItem('ths_cookie');

    if (!userId || !cookie) {
        alert('请先配置同花顺Cookie和用户ID');
        openThsConfigModal();
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/ths/dailyProfit?year=${currentYear}&month=${currentMonth}`);
        const data = await response.json();

        if (!data.success || !data.data) {
            if (data.error === 'cookie_expired') {
                alert('Cookie已过期，请重新配置！');
                openThsConfigModal();
            } else {
                alert('刷新失败: ' + (data.message || '未知错误'));
            }
            return;
        }

        const profitMap = data.data.profit_map || {};
        const totalIndex = data.data.total_index || {};
        const profitLossList = data.data.profit_loss_list || [];

        const thsProfit = profitMap.stock_rate !== undefined ? profitMap.stock_rate * 100 : null;
        const thsAmount = profitMap.stock_profit !== undefined ? profitMap.stock_profit : null;
        const thsIndex = totalIndex["1A0001"] !== undefined ? totalIndex["1A0001"] * 100 : null;

        // 1. 更新页面显示
        const currentMyProfitEl = document.getElementById("monthlyMyProfit");
        const currentMyAmountEl = document.getElementById("monthlyMyAmount");
        const currentIndexProfitEl = document.getElementById("monthlyIndexProfit");

        if (thsProfit !== null) {
            currentMyProfitEl.textContent = (thsProfit >= 0 ? '+' : '') + thsProfit.toFixed(2) + '%';
            currentMyProfitEl.className = 'value ' + (thsProfit >= 0 ? 'red' : 'green');
        }

        if (thsAmount !== null) {
            const displayAmount = Math.abs(thsAmount) >= 10000
                ? (thsAmount / 10000).toFixed(2) + '万'
                : thsAmount.toFixed(2);
            currentMyAmountEl.textContent = (thsAmount >= 0 ? '+' : '') + displayAmount + '元';
            currentMyAmountEl.className = 'value amount-value ' + (thsAmount >= 0 ? 'red' : 'green');
        }

        if (thsIndex !== null) {
            currentIndexProfitEl.textContent = (thsIndex >= 0 ? '+' : '') + thsIndex.toFixed(2) + '%';
            currentIndexProfitEl.className = 'value ' + (thsIndex >= 0 ? 'red' : 'green');
        }

        // 2. 保存月度收益到后台 (all_year.json)
        const yearsData = await getYearsData();
        if (!yearsData) {
            yearsData = {};
        }
        if (!yearsData[currentYear]) {
            yearsData[currentYear] = {};
        }
        yearsData[currentYear][currentMonth] = {
            my: thsProfit !== null ? thsProfit : 0,
            myAmount: thsAmount !== null ? thsAmount : 0,
            index: thsIndex !== null ? thsIndex : 0
        };
        await saveYearsData(yearsData);

        // 3. 保存每日收益到后台 (daily-02.json)
        const dailyData = await getDailyData(currentYear, currentMonth) || {};
        for (const item of profitLossList) {
            // 转换日期格式：20260202 -> 2026-02-02
            const dateStr = `${item.date.substring(0, 4)}-${item.date.substring(4, 6)}-${item.date.substring(6, 8)}`;
            if (!dailyData[dateStr]) {
                dailyData[dateStr] = {};
            }
            // 更新每日收益和收益率
            dailyData[dateStr].dailyAmount = item.stock_profit !== undefined ? String(item.stock_profit) : '';
            dailyData[dateStr].dailyProfit = item.stock_rate !== undefined ? (item.stock_rate * 100).toFixed(2) + '%' : '';
            // 更新单日上证指数
            if (item.index && item.index["1A0001"] !== undefined) {
                dailyData[dateStr].dailyIndex = (item.index["1A0001"] * 100).toFixed(2) + '%';
            }
        }
        await saveDailyData(currentYear, currentMonth, dailyData);

        // 刷新日历
        if (typeof renderCalendar === 'function') {
            renderCalendar();
        }

        // 更新金额显示状态
        if (typeof updateAmountDisplay === 'function') {
            updateAmountDisplay();
        }

        alert('数据刷新完成！');
    } catch (err) {
        alert('刷新失败: ' + err.message);
    }
}

// 从同花顺数据填充自我收益表格
function fillSelfProfitTableFromThs(dataList) {
    const table = document.getElementById("selfProfitTable");
    const tbody = table.querySelector("tbody");

    // 获取当前表格中已存在的数据
    const existingRows = Array.from(tbody.querySelectorAll("tr"));
    const existingDataMap = {}; // 股票名称 -> 行数据

    existingRows.forEach(tr => {
        const cells = tr.querySelectorAll("td");
        if (cells.length > 0) {
            const nameCell = cells[0];
            const name = nameCell.querySelector('.cell-text')?.textContent?.trim() ||
                        nameCell.querySelector('input')?.value?.trim();
            if (name) {
                existingDataMap[name] = { cells: cells, tr: tr };
            }
        }
    });

    // 合并数据：同花顺数据优先，同名则更新并追加备注
    const mergedData = [];
    const processedNames = new Set();

    dataList.forEach(item => {
        const stockName = item.stock_name?.trim();
        if (!stockName) return;

        processedNames.add(stockName);

        if (existingDataMap[stockName]) {
            // 名称一致，更新数据
            const existing = existingDataMap[stockName];
            const cells = existing.cells;

            // 更新总盈亏
            const profitValue = item.total_profit || '0';
            const profitNum = parseFloat(profitValue);
            const profitText = profitNum >= 0 ? '+' + profitNum.toFixed(2) : profitNum.toFixed(2);
            cells[1].querySelector('.cell-text').textContent = profitText;
            cells[1].querySelector('input').value = profitText;
            highlightProfitRow(cells[1].querySelector('input'));

            // 更新盈亏比
            if (item.total_profit_rate) {
                const rate = parseFloat(item.total_profit_rate) * 100;
                cells[2].querySelector('.cell-text').textContent = rate.toFixed(2) + '%';
                cells[2].querySelector('input').value = rate.toFixed(2) + '%';
            }

            // 更新持有周期
            const holdDays = item.hold_days ? item.hold_days + '天' : '';
            cells[3].querySelector('.cell-text').textContent = holdDays;
            cells[3].querySelector('input').value = holdDays;

            // 更新手续费
            const feeValue = item.fee ? parseFloat(item.fee).toFixed(2) : '0.00';
            cells[4].querySelector('.cell-text').textContent = feeValue;
            cells[4].querySelector('input').value = feeValue;

            // 追加备注
            const newRemark = item.open_date + ' ~ ' + item.close_date;
            const existingRemark = cells[5].querySelector('.cell-text')?.textContent?.trim() ||
                                   cells[5].querySelector('textarea')?.value?.trim();
            let mergedRemark = newRemark;
            if (existingRemark && !existingRemark.includes(newRemark)) {
                mergedRemark = existingRemark + '；' + newRemark;
            }
            cells[5].querySelector('.cell-text').textContent = mergedRemark;
            cells[5].querySelector('textarea').value = mergedRemark;
        } else {
            mergedData.push(item);
        }
    });

    // 添加同花顺的新数据行
    mergedData.forEach(item => {
        const tr = document.createElement("tr");

        tr.addEventListener('mousedown', function(e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.detail > 1) return;
            toggleRowSelection(tr, 'selfProfitTable');
        });

        const columnCount = 7;
        const remarkIndex = 5;
        const nameIndex = 0;

        for (let cellIndex = 0; cellIndex < columnCount; cellIndex++) {
            const td = document.createElement('td');

            if (cellIndex === 6) {
                td.className = 'chart-cell';
                const imgSrc = `../photo/${currentYear}/${currentMonth}-${item.stock_name}.jpg`;
                td.innerHTML = `<img src="${imgSrc}" onerror="this.style.display='none'">`;
                td.addEventListener('click', function() { openChartModal(imgSrc); });
                tr.appendChild(td);
                continue;
            }

            td.className = 'input-cell';

            let value = '';
            let placeholder = '';

            switch (cellIndex) {
                case 0:
                    value = item.stock_name || '';
                    placeholder = '股票名称';
                    break;
                case 1:
                    value = item.total_profit || '0';
                    const profitNum = parseFloat(value);
                    value = profitNum >= 0 ? '+' + profitNum.toFixed(2) : profitNum.toFixed(2);
                    placeholder = '0.00';
                    break;
                case 2:
                    if (item.total_profit_rate) {
                        const rate = parseFloat(item.total_profit_rate) * 100;
                        value = rate.toFixed(2) + '%';
                    }
                    placeholder = '0.00%';
                    break;
                case 3:
                    value = item.hold_days ? item.hold_days + '天' : '';
                    placeholder = '例如：3天';
                    break;
                case 4:
                    value = item.fee ? parseFloat(item.fee).toFixed(2) : '0.00';
                    placeholder = '0.00';
                    break;
                case 5:
                    value = item.open_date + ' ~ ' + item.close_date;
                    placeholder = '备注信息';
                    td.className = 'text-area-cell';
                    break;
            }

            const textSpan = document.createElement('span');
            textSpan.className = 'cell-text';
            textSpan.textContent = value;
            td.appendChild(textSpan);

            let input;
            if (cellIndex === remarkIndex) {
                input = document.createElement('textarea');
                input.wrap = 'soft';
            } else {
                input = document.createElement('input');
                input.type = 'text';
            }
            input.value = value;
            input.placeholder = placeholder;
            input.style.display = 'none';
            td.appendChild(input);

            td.addEventListener('dblclick', function() {
                const row = tr;
                const cells = row.querySelectorAll('td');
                cells.forEach(cell => {
                    cell.classList.add('editing');
                    const inp = cell.querySelector('input, textarea');
                    if (inp) inp.style.display = 'block';
                });
                input.focus();
            });

            input.addEventListener('blur', function() {
                setTimeout(() => {
                    const row = tr;
                    const cells = row.querySelectorAll('td');
                    cells.forEach(cell => {
                        cell.classList.remove('editing');
                        const inputs = cell.querySelectorAll('input, textarea');
                        const span = cell.querySelector('.cell-text');
                        inputs.forEach(inp => inp.style.display = 'none');
                        if (span && inputs.length > 0) span.textContent = inputs[0].value;
                    });
                    if (cellIndex === nameIndex) updateChart(input);
                    updateSelfProfitData();
                }, 0);
            });

            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && cellIndex !== remarkIndex) input.blur();
            });

            tr.appendChild(td);

            if (cellIndex === 1) highlightProfitRow(input);
        }

        tbody.appendChild(tr);
    });

    updateSelfProfitData();
}

// 暴露到全局
window.openThsConfigModal = openThsConfigModal;
window.closeThsConfigModal = closeThsConfigModal;
window.saveThsConfig = saveThsConfig;
window.importThsData = importThsData;
window.refreshDailyProfit = refreshDailyProfit;
