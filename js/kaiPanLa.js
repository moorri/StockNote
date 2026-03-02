// 开盘啦API配置（API_BASE在api.js中定义）
const KAI_PAN_LA_CONFIG = {
    // 本地代理服务地址
    proxyUrl: API_BASE,
    deviceId: '77cb70bc-fdb9-37a4-a993-4c5764859153',
    version: '5.22.0.6'
};

// 获取当月日期范围（从代理服务获取，自动排除节假日和周末）
async function getMonthDateRange(year, month) {
    // 显示加载遮罩
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'flex';

    try {
        const response = await fetch(`${KAI_PAN_LA_CONFIG.proxyUrl}/dateRange?year=${year}&month=${month}`);
        const data = await response.json();

        // 隐藏加载遮罩
        if (overlay) overlay.style.display = 'none';

        return {
            startDate: `${year}-${String(month).padStart(2, '0')}-${String(data.start).padStart(2, '0')}`,
            endDate: `${year}-${String(month).padStart(2, '0')}-${String(data.end).padStart(2, '0')}`
        };
    } catch (e) {
        console.error('获取日期范围失败:', e);
        // 隐藏加载遮罩
        if (overlay) overlay.style.display = 'none';
        // 默认值
        return {
            startDate: `${year}-${String(month).padStart(2, '0')}-05`,
            endDate: `${year}-${String(month).padStart(2, '0')}-30`
        };
    }
}

// 格式化日期
function formatDate(year, month, day) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// 格式化金额（分转亿/万）
function formatMoney(amount) {
    if (Math.abs(amount) >= 100000000) {
        return (amount / 100000000).toFixed(2) + '亿';
    } else if (Math.abs(amount) >= 10000) {
        return (amount / 10000).toFixed(2) + '万';
    }
    return amount.toString();
}

// 请求开盘啦API
async function fetchKaiPanLaData() {
    const { startDate, endDate } = await getMonthDateRange(currentYear, currentMonth);

    try {
        // 同时请求股票和板块数据
        const [stockResult, sectorResult] = await Promise.all([
            fetchStockData(startDate, endDate),
            fetchSectorData(startDate, endDate)
        ]);

        // 填充板块表格
        fillTable('sectorTable', sectorResult);

        // 填充股票表格
        fillTable('stockTable', stockResult);

        alert(`${currentYear}年${currentMonth}月数据获取成功！\n板块数据：${sectorResult.length}条\n股票数据：${stockResult.length}条`);
    } catch (error) {
        console.error('获取数据失败:', error);
        alert('获取数据失败，请检查网络连接');
    }
}

// 获取股票数据（涨幅榜前9 + 净额榜前9，去重）
async function fetchStockData(startDate, endDate) {
    const params = {
        Order: 1,
        st: 30,
        a: 'GetInterviewsByDateStock',
        c: 'StockLineData',
        PhoneOSNew: 1,
        DeviceID: KAI_PAN_LA_CONFIG.deviceId,
        VerSion: KAI_PAN_LA_CONFIG.version,
        DEnd: endDate,
        Index: 0,
        DStart: startDate,
        apiv: 'w43',
        FilterBJS: 1
    };

    // 请求涨幅榜(Type=2)和净额榜(Type=5)，各取前9
    const [riseData, moneyData] = await Promise.all([
        fetchApi({ ...params, Type: 2 }),
        fetchApi({ ...params, Type: 5 })
    ]);

    // 合并去重
    const combined = [...riseData.slice(0, 9), ...moneyData.slice(0, 9)];
    const uniqueMap = new Map();
    combined.forEach(item => {
        const name = item['股票名称'];
        if (!uniqueMap.has(name)) {
            uniqueMap.set(name, item);
        }
    });

    return Array.from(uniqueMap.values());
}

// 获取板块数据（强度榜前6 + 涨幅榜前6 + 净额榜前6，去重）
async function fetchSectorData(startDate, endDate) {
    const params = {
        Order: 1,
        st: 30,
        a: 'GetInterviewsByDateZS',
        c: 'StockLineData',
        PhoneOSNew: 1,
        DeviceID: KAI_PAN_LA_CONFIG.deviceId,
        VerSion: KAI_PAN_LA_CONFIG.version,
        DEnd: endDate,
        Index: 0,
        DStart: startDate,
        apiv: 'w43'
    };

    // 请求强度榜(Type=9)、涨幅榜(Type=1)、净额榜(Type=3)，各取前6
    const [strengthData, riseData, moneyData] = await Promise.all([
        fetchApi({ ...params, Type: 9 }),
        fetchApi({ ...params, Type: 1 }),
        fetchApi({ ...params, Type: 3 })
    ]);

    // 合并去重
    const combined = [...strengthData.slice(0, 6), ...riseData.slice(0, 6), ...moneyData.slice(0, 6)];
    const uniqueMap = new Map();
    combined.forEach(item => {
        const name = item['板块名称'];
        if (!uniqueMap.has(name)) {
            uniqueMap.set(name, item);
        }
    });

    return Array.from(uniqueMap.values());
}

// 发送API请求（通过本地代理）
async function fetchApi(params) {
    try {
        const formData = new URLSearchParams(params).toString();

        const response = await fetch(KAI_PAN_LA_CONFIG.proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        });

        const data = await response.json();

        if (data.List && data.List.length > 0) {
            const result = parseApiData(data, params.a);
            return result;
        }

        console.log('代理服务返回空数据');
        return [];
    } catch (error) {
        console.error('请求失败:', error);
        return [];
    }
}

// 解析API返回数据
function parseApiData(data, apiType) {
    const list = data.List || [];

    if (apiType === 'GetInterviewsByDateStock') {
        // 股票数据: [代码, 名称, 当前价, 涨幅, 成交额, 净额(索引5), 净额(索引6), 换手率, ..., 概念, ...]
        return list.slice(0, 8).map(item => ({
            '股票名称': item[1] || '',
            '板块': item[10] || '',
            '区间涨幅': (item[3] || 0) + '%',
            '区间净额': formatMoney(item[6] || 0)
        }));
    } else if (apiType === 'GetInterviewsByDateZS') {
        // 板块数据: [代码, 名称, 涨幅, 净额, 净额(索引5), ..., 强度(索引11), ...]
        return list.slice(0, 8).map(item => ({
            '板块名称': item[1] || '',
            '区间强度': item[11] || '',
            '区间涨幅': (item[2] || 0) + '%',
            '区间净额': formatMoney(item[5] || 0)
        }));
    }

    return [];
}
