// 切换金额显示/隐藏
function toggleAmountDisplay() {
    const isHidden = localStorage.getItem(HIDE_AMOUNT_KEY) === 'true';
    const newState = !isHidden;
    localStorage.setItem(HIDE_AMOUNT_KEY, newState);
    updateAmountDisplay();
}

// 更新金额显示状态
function updateAmountDisplay() {
    const isHidden = localStorage.getItem(HIDE_AMOUNT_KEY) === 'true';
    // 更新所有金额元素
    document.querySelectorAll('.amount-value').forEach(el => {
        if (isHidden) {
            el.dataset.originalText = el.textContent;
            el.textContent = '*****';
        } else if (el.dataset.originalText) {
            el.textContent = el.dataset.originalText;
        }
    });
    // 更新按钮图标
    const btn = document.getElementById('hideAmountBtn');
    if (btn) {
        const img = btn.querySelector('img');
        img.src = isHidden ? '../photo/ico/close.png' : '../photo/ico/open.png';
        img.alt = isHidden ? '显示金额' : '隐藏金额';
    }
}

// 渲染月度卡片
function renderMonthCards(data) {
    const container = document.getElementById("monthCards");
    container.innerHTML = ""; // 清空原有卡片

    data.forEach((item, index) => {
        const month = months[index];
        const myProfit = item.my || 0;
        const myAmount = item.myAmount || 0;
        const indexProfit = item.index || 0;

        // 卡片颜色：盈利（红色系）、亏损（蓝色系）
        let cardClass = "month-card";
        if (myProfit > 0) {
            cardClass = myProfit > 10 ? "month-card big-profit" : "month-card profit";
        }

        const card = document.createElement("div");
        card.className = cardClass;
        // 添加点击事件，传递月份和年份参数
        const currentYear = localStorage.getItem(YEAR_KEY);
        // 根据当前页面决定跳转目标：新页面用-vue，旧的用-analysis
        const isVuePage = window.location.pathname.includes('-vue');
        const targetPage = isVuePage ? 'monthly-vue.html' : 'monthly-analysis.html';
        card.onclick = () => {
          window.location.href = `${targetPage}?month=${index + 1}&year=${currentYear}`;
        };

        // 收益金额显示逻辑（颜色继承卡片）
        let amountDisplay = '';
        if (myAmount !== 0) {
            const amountSymbol = myAmount >= 0 ? '+' : '';
            // 格式化金额显示（超过10000用万为单位）
            let displayAmount;
            if (Math.abs(myAmount) >= 10000) {
                displayAmount = (myAmount / 10000).toFixed(2) + '万';
            } else {
                displayAmount = myAmount.toFixed(2);
            }
            amountDisplay = `<div class="my-amount amount-value" style="font-size:12px;">${amountSymbol}${displayAmount}元</div>`;
        }

        card.innerHTML = `
            <h3>${month}</h3>
            <div class="my-profit">${myProfit >= 0 ? '+' : ''}${myProfit.toFixed(2)}%</div>
            ${amountDisplay}
            <div class="index-profit">上证指数: ${indexProfit >= 0 ? '+' : ''}${indexProfit.toFixed(2)}%</div>
        `;
        container.appendChild(card);
    });
    // 更新金额显示状态
    updateAmountDisplay();
}

// 计算年度收益率（复利计算）
function calculateYearProfit(monthlyProfits) {
    let total = 1;
    monthlyProfits.forEach(profit => {
        total *= (1 + profit / 100);
    });
    return ((total - 1) * 100).toFixed(2);
}

// 渲染年度汇总
function renderYearSummary(myMonthly, indexMonthly, myAmounts = []) {
    const myYearProfit = calculateYearProfit(myMonthly);
    const indexYearProfit = calculateYearProfit(indexMonthly);

    const myEl = document.getElementById("myYearProfit");
    const myAmountEl = document.getElementById("myYearAmount");
    const indexEl = document.getElementById("indexYearProfit");

    myEl.textContent = `${myYearProfit >= 0 ? '+' : ''}${myYearProfit}%`;
    myEl.className = `value ${myYearProfit >= 0 ? 'red' : 'green'}`;

    // 计算年度总收益金额
    if (myAmounts && myAmounts.length > 0) {
        const totalAmount = myAmounts.reduce((sum, amount) => sum + (amount || 0), 0);
        if (totalAmount !== 0) {
            const displayAmount = Math.abs(totalAmount) >= 10000
                ? (totalAmount / 10000).toFixed(2) + '万'
                : totalAmount.toFixed(2);
            myAmountEl.textContent = `${totalAmount >= 0 ? '+' : ''}${displayAmount}元`;
            myAmountEl.className = `value amount-value ${totalAmount >= 0 ? 'red' : 'green'}`;
        } else {
            myAmountEl.textContent = '--';
            myAmountEl.className = 'value amount-value';
        }
    } else {
        myAmountEl.textContent = '--';
        myAmountEl.className = 'value amount-value';
    }

    indexEl.textContent = `${indexYearProfit >= 0 ? '+' : ''}${indexYearProfit}%`;
    indexEl.className = `value ${indexYearProfit >= 0 ? 'red' : 'green'}`;
    // 更新金额显示状态
    updateAmountDisplay();
}

// 加载本地存储数据
// loadDefault: 是否加载默认数据，首次加载时为true，重置后为false
async function loadData(loadDefault = true) {
    const saveYear = localStorage.getItem(YEAR_KEY);

    // 确保年份选择器已初始化
    const yearSelect = document.getElementById('yearSelect');
    if (yearSelect && yearSelect.value !== saveYear) {
        yearSelect.value = saveYear;
    }

    // 从API获取多年数据
    const yearsDataAPI = await getYearsData();
    yearsData = yearsDataAPI || {};
    // 设置全局变量，供对比图表使用
    window.yearsData = yearsData;

    // 从多年数据中获取当前年份的数据（API返回的是对象格式）
    const yearData = yearsData[saveYear] || {};
    // 转换为数组格式（按月份顺序）
    const monthData = [];
    for (let i = 1; i <= 12; i++) {
        if (yearData[i]) {
            monthData.push(yearData[i]);
        } else {
            monthData.push({ my: 0, myAmount: 0, index: 0 });
        }
    }

    // 检查是否有有效数据
    const hasData = monthData.some(m => m.my !== 0 || m.index !== 0);

    if (hasData) {
        // 填充输入框
        monthData.forEach((item, index) => {
            const myInput = document.getElementById(`my_${index+1}`);
            const myAmountInput = document.getElementById(`myAmount_${index+1}`);
            const indexInput = document.getElementById(`index_${index+1}`);
            if (myInput) myInput.value = item.my !== undefined ? item.my : '';
            if (myAmountInput) myAmountInput.value = item.myAmount !== undefined ? item.myAmount : '';
            if (indexInput) indexInput.value = item.index !== undefined ? item.index : '';
        });

        // 渲染卡片和汇总
        renderMonthCards(monthData);
        // 提取月度收益数组（用于计算年度收益率）
        const myMonthly = monthData.map(item => item.my || 0);
        const myAmounts = monthData.map(item => item.myAmount || 0);
        const indexMonthly = monthData.map(item => item.index || 0);
        renderYearSummary(myMonthly, indexMonthly, myAmounts);

        // 转换为累计收益（乘法计算，保留2位小数）
        const myCumulative = [];
        const indexCumulative = [];
        let myProduct = 1, indexProduct = 1;
        myMonthly.forEach((v, i) => {
            myProduct *= (1 + v / 100);
            indexProduct *= (1 + indexMonthly[i] / 100);
            myCumulative.push(Math.round((myProduct - 1) * 10000) / 100);
            indexCumulative.push(Math.round((indexProduct - 1) * 10000) / 100);
        });

        // 更新图表（传入累计和原始数据）
        updateChart(myCumulative, indexCumulative, myMonthly, indexMonthly);
    } else if (loadDefault) {
        // 没有数据时清空输入框
        for (let i = 1; i <= 12; i++) {
            const myInput = document.getElementById(`my_${i}`);
            const myAmountInput = document.getElementById(`myAmount_${i}`);
            const indexInput = document.getElementById(`index_${i}`);
            if (myInput) myInput.value = '';
            if (myAmountInput) myAmountInput.value = '';
            if (indexInput) indexInput.value = '';
        }
        // 清空卡片
        const container = document.getElementById("monthCards");
        if (container) container.innerHTML = "";
        // 清空年度汇总
        const myYearEl = document.getElementById("myYearProfit");
        const indexYearEl = document.getElementById("indexYearProfit");
        if (myYearEl) {
            myYearEl.textContent = '--';
            myYearEl.className = 'value';
        }
        if (indexYearEl) {
            indexYearEl.textContent = '--';
            indexYearEl.className = 'value';
        }
    } else {
        // 没有数据时清空输入框和显示
        for (let i = 1; i <= 12; i++) {
            const myInput = document.getElementById(`my_${i}`);
            const myAmountInput = document.getElementById(`myAmount_${i}`);
            const indexInput = document.getElementById(`index_${i}`);
            if (myInput) myInput.value = '';
            if (myAmountInput) myAmountInput.value = '';
            if (indexInput) indexInput.value = '';
        }
        // 清空卡片
        const container = document.getElementById("monthCards");
        if (container) container.innerHTML = "";
        // 清空年度汇总
        const myYearEl = document.getElementById("myYearProfit");
        const indexYearEl = document.getElementById("indexYearProfit");
        if (myYearEl) {
            myYearEl.textContent = '--';
            myYearEl.className = 'value';
        }
        if (indexYearEl) {
            indexYearEl.textContent = '--';
            indexYearEl.className = 'value';
        }
        // 清空图表
        if (profitChart) {
            profitChart.setOption({
                series: [
                    { data: [] },
                    { data: [] }
                ]
            });
        }
    }
}



// 页面加载完成后初始化
window.onload = function() {
    initYearSelector(); // 初始化年份选择器（包含 loadYearsList 和 updateYearCheckboxes）
    initChart();
    initComparisonChart();
    updateComparisonChart(); // 初始化后调用一次，确保图表正确渲染
    updateAmountDisplay(); // 恢复金额显示状态
};

// 同步选中年份下所有月份的收益数据
async function syncAllMonthsData() {
    const year = localStorage.getItem(YEAR_KEY);
    if (!year) {
        showToast('请先选择年份', 'error');
        return;
    }

    // 检查是否已配置同花顺
    const configRes = await fetch(`${API_BASE}/ths/config`);
    const config = await configRes.json();

    if (!config.hasUserId || !config.hasFundKey || !config.hasCookie) {
        showToast('请先配置同花顺Cookie、用户ID和FundKey', 'error');
        return;
    }

    // 获取当前月份（排除未来月份）
    const now = new Date();
    const currentMonth = now.getFullYear() === parseInt(year) ? now.getMonth() + 1 : 12;

    showToast(`开始同步${year}年数据...`, 'info');

    let successCount = 0;
    let failCount = 0;

    // 逐月同步
    for (let month = 1; month <= currentMonth; month++) {
        try {
            // 1. 同步每日收益数据
            const response = await fetch(`${API_BASE}/ths/dailyProfit?year=${year}&month=${month}`);
            const data = await response.json();

            if (!data.success || !data.data) {
                if (data.error === 'cookie_expired') {
                    showToast('Cookie已过期，请重新配置！', 'error');
                    return;
                }
                failCount++;
                continue;
            }

            const profitMap = data.data.profit_map || {};
            const totalIndex = data.data.total_index || {};
            const profitLossList = data.data.profit_loss_list || [];

            const thsProfit = profitMap.stock_rate !== undefined ? profitMap.stock_rate * 100 : null;
            const thsAmount = profitMap.stock_profit !== undefined ? profitMap.stock_profit : null;
            const thsIndex = totalIndex["1A0001"] !== undefined ? totalIndex["1A0001"] * 100 : null;

            // 保存月度收益到后台 (all_year.json)
            const yearsData = await getYearsData() || {};
            if (!yearsData[year]) {
                yearsData[year] = {};
            }
            yearsData[year][month] = {
                my: thsProfit !== null ? thsProfit : 0,
                myAmount: thsAmount !== null ? thsAmount : 0,
                index: thsIndex !== null ? thsIndex : 0
            };
            await saveYearsData(yearsData);

            // 保存每日收益到后台 (daily-MM.json)
            const dailyData = await getDailyData(year, month) || {};
            for (const item of profitLossList) {
                const dateStr = `${item.date.substring(0, 4)}-${item.date.substring(4, 6)}-${item.date.substring(6, 8)}`;
                if (!dailyData[dateStr]) {
                    dailyData[dateStr] = {};
                }
                dailyData[dateStr].dailyAmount = item.stock_profit !== undefined ? String(item.stock_profit) : '';
                dailyData[dateStr].dailyProfit = item.stock_rate !== undefined ? (item.stock_rate * 100).toFixed(2) + '%' : '';
                if (item.index && item.index["1A0001"] !== undefined) {
                    dailyData[dateStr].dailyIndex = (item.index["1A0001"] * 100).toFixed(2) + '%';
                }
            }
            await saveDailyData(year, month, dailyData);

            // 2. 同步板块数据和股票数据（开盘啦）
            try {
                const dateRangeRes = await fetch(`${API_BASE}/dateRange?year=${year}&month=${month}`);
                const dateRange = await dateRangeRes.json();
                const startDate = `${year}-${String(month).padStart(2, '0')}-${String(dateRange.start).padStart(2, '0')}`;
                const endDate = `${year}-${String(month).padStart(2, '0')}-${String(dateRange.end).padStart(2, '0')}`;

                const kplParams = {
                    Order: 1,
                    st: 30,
                    a: 'GetInterviewsByDateZS',
                    c: 'StockLineData',
                    PhoneOSNew: 1,
                    DeviceID: '77cb70bc-fdb9-37a4-a993-4c5764859153',
                    VerSion: '5.22.0.6',
                    DEnd: endDate,
                    Index: 0,
                    DStart: startDate,
                    apiv: 'w43'
                };

                // 获取板块数据
                const [strengthData, riseData, moneyData] = await Promise.all([
                    fetchKplApi({ ...kplParams, Type: 9 }),
                    fetchKplApi({ ...kplParams, Type: 1 }),
                    fetchKplApi({ ...kplParams, Type: 3 })
                ]);

                // 合并板块数据
                const combinedSectors = [...strengthData.slice(0, 6), ...riseData.slice(0, 6), ...moneyData.slice(0, 6)];
                const uniqueSectorMap = new Map();
                combinedSectors.forEach(item => {
                    const name = item['板块名称'];
                    if (!uniqueSectorMap.has(name)) {
                        uniqueSectorMap.set(name, item);
                    }
                });
                const sectorData = Array.from(uniqueSectorMap.values());

                // 获取股票数据
                const stockParams = { ...kplParams, a: 'GetInterviewsByDateStock', FilterBJS: 1 };
                const [riseStockData, moneyStockData] = await Promise.all([
                    fetchKplApi({ ...stockParams, Type: 2 }),
                    fetchKplApi({ ...stockParams, Type: 5 })
                ]);
                const combinedStocks = [...riseStockData.slice(0, 9), ...moneyStockData.slice(0, 9)];
                const uniqueStockMap = new Map();
                combinedStocks.forEach(item => {
                    const name = item['股票名称'];
                    if (!uniqueStockMap.has(name)) {
                        uniqueStockMap.set(name, item);
                    }
                });
                const stockData = Array.from(uniqueStockMap.values());

                // 保存到月度数据 (monthly.json)
                let monthlyData = await getMonthlyData(year) || {};
                if (!monthlyData[String(month)]) {
                    monthlyData[String(month)] = {};
                }
                if (sectorData.length > 0) {
                    monthlyData[String(month)].sector = sectorData;
                }
                if (stockData.length > 0) {
                    monthlyData[String(month)].stock = stockData;
                }
                await saveMonthlyData(year, monthlyData, 'syncAllMonthsData');
            } catch (kplErr) {
                console.error(`同步开盘啦数据失败:`, kplErr);
            }

            // 3. 同步自我收益数据（平仓记录）
            try {
                const clearedRes = await fetch(`${API_BASE}/ths/clearedPositions?year=${year}&month=${month}`);
                const clearedData = await clearedRes.json();

                if (clearedData.success && clearedData.data && clearedData.data.length > 0) {
                    // 转换平仓记录为自我收益格式
                    const selfProfitData = clearedData.data.map(item => {
                        const profitValue = parseFloat(item.total_profit || '0');
                        const profitRate = item.total_profit_rate ? (parseFloat(item.total_profit_rate) * 100).toFixed(2) + '%' : '';
                        // 手续费格式化
                        const feeValue = parseFloat(item.fee || '0');
                        const feeDisplay = feeValue > 0 ? feeValue.toFixed(2) : '';
                        return {
                            '名称': item.stock_name || '',
                            '总盈亏': profitValue >= 0 ? '+' + profitValue.toFixed(2) : profitValue.toFixed(2),
                            '盈亏比': profitRate,
                            '持有周期': item.hold_days || '',
                            '买入价格': item.buy_price || '',
                            '卖出价格': item.sell_price || '',
                            '手续费': feeDisplay,
                            '备注': '自动同步'
                        };
                    });

                    // 保存到月度数据 (monthly.json)
                    let monthlyData = await getMonthlyData(year) || {};
                    if (!monthlyData[String(month)]) {
                        monthlyData[String(month)] = {};
                    }
                    monthlyData[String(month)].selfProfit = selfProfitData;
                    await saveMonthlyData(year, monthlyData, 'syncAllMonthsData');
                }
            } catch (clearedErr) {
                console.error(`同步平仓记录失败:`, clearedErr);
            }

            successCount++;
        } catch (err) {
            console.error(`同步${year}年${month}月数据失败:`, err);
            failCount++;
        }
    }

    // 刷新页面数据
    await loadData(false);

    if (failCount === 0) {
        showToast(`同步完成！成功同步${successCount}个月的数据`, 'success');
    } else {
        showToast(`同步完成：成功${successCount}个月，失败${failCount}个月`, 'info');
    }
}

// 开盘啦API请求辅助函数
async function fetchKplApi(params) {
    const formData = new URLSearchParams(params).toString();
    const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
    });
    const data = await response.json();
    if (data.List && data.List.length > 0) {
        return parseKplData(data, params.a);
    }
    return [];
}

// 解析开盘啦API数据
function parseKplData(data, apiType) {
    const list = data.List || [];
    if (apiType === 'GetInterviewsByDateStock') {
        return list.slice(0, 8).map(item => ({
            '股票名称': item[1] || '',
            '板块': item[10] || '',
            '区间涨幅': (item[3] || 0) + '%',
            '区间净额': formatKplMoney(item[6] || 0)
        }));
    } else if (apiType === 'GetInterviewsByDateZS') {
        return list.slice(0, 8).map(item => ({
            '板块名称': item[1] || '',
            '区间强度': item[11] || '',
            '区间涨幅': (item[2] || 0) + '%',
            '区间净额': formatKplMoney(item[5] || 0)
        }));
    }
    return [];
}

// 格式化金额
function formatKplMoney(amount) {
    if (Math.abs(amount) >= 100000000) {
        return (amount / 100000000).toFixed(2) + '亿';
    } else if (Math.abs(amount) >= 10000) {
        return (amount / 10000).toFixed(2) + '万';
    }
    return amount.toString();
}

window.syncAllMonthsData = syncAllMonthsData;

// 初始化对比图表
// initComparisonChart 已在 indexChart.js 中定义

