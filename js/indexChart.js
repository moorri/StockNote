// 首页图表相关函数

// ECharts图表实例
let profitChart = null;
let comparisonChart = null;
let comparisonChartBar = null;
let currentSelectedYear = null; // 当前选中的年份

// 图表类型状态：'line' 或 'bar'
let profitChartType = 'line';
let comparisonChartType = 'line';

// 切换图表类型
function toggleChartType(chartName) {
    if (chartName === 'profit') {
        profitChartType = profitChartType === 'line' ? 'bar' : 'line';
        // 更新按钮文字
        const btn = document.getElementById('profitChartToggle');
        if (btn) btn.textContent = profitChartType === 'line' ? '切换柱状图' : '切换折线图';
        // 重新触发更新
        if (window.lastProfitData) {
            const d = window.lastProfitData;
            updateChart(d.cumulative, d.indexCumulative, d.original, d.indexOriginal);
        }
    } else if (chartName === 'comparison') {
        comparisonChartType = comparisonChartType === 'line' ? 'bar' : 'line';
        // 更新按钮文字
        const btn = document.getElementById('comparisonChartToggle');
        if (btn) btn.textContent = comparisonChartType === 'line' ? '切换柱状图' : '切换折线图';
        // 显示/隐藏对应的图表
        const lineDiv = document.getElementById('comparisonChartLine');
        const barDiv = document.getElementById('comparisonChartBar');
        if (lineDiv) lineDiv.style.display = comparisonChartType === 'line' ? 'block' : 'none';
        if (barDiv) barDiv.style.display = comparisonChartType === 'bar' ? 'block' : 'none';
        // 切换后调用 resize 修复宽度
        setTimeout(() => {
            if (comparisonChart) comparisonChart.resize();
            if (comparisonChartBar) comparisonChartBar.resize();
        }, 100);
    }
}

// 多年数据存储（使用全局变量，从indexFuns.js的loadData获取）

// 初始化图表
function initChart() {
    const chartDom = document.getElementById('profitChart');
    profitChart = echarts.init(chartDom);

    // 响应式调整
    window.addEventListener('resize', function() {
        profitChart.resize();
    });
}

// 更新图表数据
// cumulativeData: 累计收益（用于折线图）
// originalData: 原始月度收益（用于柱状图）
function updateChart(cumulativeData, indexCumulative, originalData, indexOriginal) {
    if (!profitChart) {
        initChart();
    }

    // 保存数据供切换使用
    window.lastProfitData = {
        cumulative: cumulativeData,
        indexCumulative: indexCumulative,
        original: originalData,
        indexOriginal: indexOriginal
    };

    const isBar = profitChartType === 'bar';
    // 折线用累计收益，柱状用原始收益
    const myData = isBar ? originalData : cumulativeData;
    const idxData = isBar ? indexOriginal : indexCumulative;

    const option = {
        title: {
            text: '我的收益 vs 上证指数',
            left: 'center',
            textStyle: {
                fontSize: 16,
                fontWeight: 'normal'
            }
        },
        tooltip: {
            trigger: 'axis',
            formatter: function(params) {
                let result = params[0].name + '<br/>';
                params.forEach(param => {
                    const color = param.value >= 0 ? '#e74c3c' : '#27ae60';
                    const symbol = param.value >= 0 ? '+' : '';
                    result += `<span style="color:${color}">${param.seriesName}: ${symbol}${param.value}%</span><br/>`;
                });
                return result;
            }
        },
        legend: {
            data: ['我的收益', '上证指数'],
            bottom: 10
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '15%',
            top: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: !isBar, // 柱状图需要间隙
            data: monthNames,
            axisLine: {
                lineStyle: {
                    color: '#ddd'
                }
            }
        },
        yAxis: {
            type: 'value',
            axisLine: {
                lineStyle: {
                    color: '#ddd'
                }
            },
            splitLine: {
                lineStyle: {
                    color: '#eee'
                }
            },
            axisLabel: {
                formatter: '{value}%'
            }
        },
        series: [
            {
                name: '我的收益',
                type: isBar ? 'bar' : 'line',
                data: myData,
                smooth: !isBar,
                lineStyle: isBar ? {} : { width: 3 },
                itemStyle: {
                    color: '#e74c3c'
                },
                areaStyle: isBar ? {} : {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(231, 76, 60, 0.3)' },
                        { offset: 1, color: 'rgba(231, 76, 60, 0.05)' }
                    ])
                },
                barShadowBlur: isBar ? 10 : 0,
                barShadowColor: 'rgba(0, 0, 0, 0.3)',
                markPoint: isBar ? {} : {
                    data: [
                        { type: 'max', name: '最大值' },
                        { type: 'min', name: '最小值' }
                    ],
                    itemStyle: {
                        color: '#e74c3c'
                    }
                }
            },
            {
                name: '上证指数',
                type: isBar ? 'bar' : 'line',
                data: idxData,
                smooth: !isBar,
                lineStyle: isBar ? {} : { width: 3 },
                itemStyle: {
                    color: '#27ae60'
                },
                areaStyle: isBar ? {} : {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(39, 174, 96, 0.3)' },
                        { offset: 1, color: 'rgba(39, 174, 96, 0.05)' }
                    ])
                },
                barShadowBlur: isBar ? 10 : 0,
                barShadowColor: 'rgba(0, 0, 0, 0.3)',
                markPoint: isBar ? {} : {
                    data: [
                        { type: 'max', name: '最大值' },
                        { type: 'min', name: '最小值' }
                    ],
                    itemStyle: {
                        color: '#27ae60'
                    }
                }
            }
        ]
    };

    profitChart.setOption(option);
}

// 初始化对比图表
function initComparisonChart() {
    const chartDomLine = document.getElementById('comparisonChartLine');
    const chartDomBar = document.getElementById('comparisonChartBar');
    if (chartDomLine) {
        comparisonChart = echarts.init(chartDomLine);
    }
    if (chartDomBar) {
        comparisonChartBar = echarts.init(chartDomBar);
    }
    window.addEventListener('resize', function() {
        if (comparisonChart) comparisonChart.resize();
        if (comparisonChartBar) comparisonChartBar.resize();
    });
}

// 更新对比图表 - 同时渲染折线图和柱状图
async function updateComparisonChart() {
    // 如果图表还没初始化，先初始化
    const chartDomLine = document.getElementById('comparisonChartLine');
    const chartDomBar = document.getElementById('comparisonChartBar');
    if (!comparisonChart && chartDomLine) {
        comparisonChart = echarts.init(chartDomLine);
    }
    if (!comparisonChartBar && chartDomBar) {
        comparisonChartBar = echarts.init(chartDomBar);
    }
    if (!comparisonChart || !comparisonChartBar) {
        return;
    }

    // 显示当前类型的图表
    const lineDiv = document.getElementById('comparisonChartLine');
    const barDiv = document.getElementById('comparisonChartBar');
    if (lineDiv) lineDiv.style.display = comparisonChartType === 'line' ? 'block' : 'none';
    if (barDiv) barDiv.style.display = comparisonChartType === 'bar' ? 'block' : 'none';

    const checkboxes = document.querySelectorAll('#yearCheckboxGroup input[type="checkbox"]:checked');
    const selectedYears = Array.from(checkboxes).map(cb => cb.value);

    if (selectedYears.length === 0) {
        comparisonChart.clear();
        comparisonChartBar.clear();
        return;
    }

    // 从本地JSON加载数据
    let yearsData;
    try {
        const response = await fetch('../data/all-years.json');
        yearsData = await response.json();
    } catch (error) {
        console.error('加载数据失败:', error);
        yearsData = {};
    }

    const colors = ['#e74c3c', '#27ae60', '#3498db', '#9b59b6', '#f39c12', '#1abc9c'];

    // 构建折线图数据（累计收益）
    const lineSeries = [];
    // 构建柱状图数据（原始收益）
    const barSeries = [];

    selectedYears.forEach((year, index) => {
        const yearData = yearsData[year] || {};
        const monthData = [];
        for (let i = 1; i <= 12; i++) {
            if (yearData[i]) {
                monthData.push(yearData[i]);
            } else {
                monthData.push({ my: 0, myAmount: 0, index: 0 });
            }
        }

        const myMonthly = monthData.map(item => item.my || 0);

        // 计算累计收益
        const myCumulative = [];
        let myProduct = 1;
        myMonthly.forEach(v => {
            myProduct *= (1 + v / 100);
            myCumulative.push(Math.round((myProduct - 1) * 10000) / 100);
        });

        // 折线图用累计
        lineSeries.push({
            name: year + '年',
            type: 'line',
            data: myCumulative,
            smooth: true,
            lineStyle: { width: 2 },
            itemStyle: { color: colors[index % colors.length] },
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: colors[index % colors.length] + '40' },
                    { offset: 1, color: colors[index % colors.length] + '10' }
                ])
            },
            markPoint: {
                data: [
                    { type: 'max', name: '最大值' },
                    { type: 'min', name: '最小值' }
                ],
                itemStyle: { color: colors[index % colors.length] }
            }
        });

        // 柱状图用原始
        barSeries.push({
            name: year + '年',
            type: 'bar',
            data: myMonthly,
            itemStyle: { color: colors[index % colors.length] },
            barShadowBlur: 10,
            barShadowColor: 'rgba(0, 0, 0, 0.3)',
            label: { show: true, position: 'top', formatter: function(params) { return (params.value >= 0 ? '+' : '') + params.value.toFixed(2) + '%'; } }
        });
    });

    // 折线图配置
    const lineOption = {
        title: { text: '多年度收益对比（累计）', left: 'center', textStyle: { fontSize: 14 } },
        tooltip: { trigger: 'axis', formatter: function(params) { return params[0].name + '<br/>' + params.map(p => p.seriesName + ': ' + (p.value >= 0 ? '+' : '') + p.value.toFixed(2) + '%').join('<br/>'); } },
        legend: { data: selectedYears.map(y => y + '年'), bottom: 10 },
        grid: { left: '3%', right: '4%', bottom: '15%', top: '15%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: false, data: monthNames },
        yAxis: { type: 'value', axisLabel: { formatter: function(value) { return (value >= 0 ? '+' : '') + value.toFixed(2) + '%'; } } },
        series: lineSeries
    };

    // 柱状图配置
    const barOption = {
        title: { text: '多年度收益对比（月度）', left: 'center', textStyle: { fontSize: 14 } },
        tooltip: { trigger: 'axis', formatter: function(params) { return params[0].name + '<br/>' + params.map(p => p.seriesName + ': ' + (p.value >= 0 ? '+' : '') + p.value.toFixed(2) + '%').join('<br/>'); } },
        legend: { data: selectedYears.map(y => y + '年'), bottom: 10 },
        grid: { left: '3%', right: '4%', bottom: '15%', top: '15%', containLabel: true },
        xAxis: { type: 'category', boundaryGap: true, data: monthNames, axisLine: { lineStyle: { color: '#ddd' } } },
        yAxis: { type: 'value', axisLine: { lineStyle: { color: '#ddd' } }, splitLine: { lineStyle: { color: '#eee' } }, axisLabel: { formatter: function(value) { return (value >= 0 ? '+' : '') + value.toFixed(2) + '%'; } } },
        series: barSeries
    };

    // 渲染两个图表
    comparisonChart.setOption(lineOption, { notMerge: true });
    comparisonChartBar.setOption(barOption, { notMerge: true });

    // 确保宽度正确
    setTimeout(() => {
        if (comparisonChart) comparisonChart.resize();
        if (comparisonChartBar) comparisonChartBar.resize();
    }, 100);

    // 保存数据
    window.lastComparisonData = selectedYears;
}
