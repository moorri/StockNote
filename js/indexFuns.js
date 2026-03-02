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

// 初始化对比图表
// initComparisonChart 已在 indexChart.js 中定义

