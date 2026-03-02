// 表格排序相关函数

// 表格排序状态：null=默认顺序, 'asc'=正序, 'desc'=倒序
let sortState = {
    totalProfit: null,
    profitRate: null,
    sectorStrength: null,
    sectorRise: null,
    sectorMoney: null,
    stockRise: null,
    stockMoney: null
};

// 记录每个表格的原始行顺序
let originalRows = {
    sectorTable: [],
    stockTable: [],
    selfProfitTable: []
};

/**
 * 保存表格原始行顺序
 */
function saveOriginalRows(tableId) {
    const table = document.getElementById(tableId);
    const tbody = table.querySelector("tbody");
    originalRows[tableId] = Array.from(tbody.querySelectorAll("tr"));
}

/**
 * 对板块/股票表格进行排序
 * @param {string} tableId - 表格ID
 * @param {string} sortType - 排序类型：'strength'/'rise'/'money'
 */
function sortTable(tableId, sortType) {
    const table = document.getElementById(tableId);
    const tbody = table.querySelector("tbody");
    const rows = Array.from(tbody.querySelectorAll("tr"));

    // 如果还没有原始顺序，先保存
    if (originalRows[tableId].length === 0) {
        saveOriginalRows(tableId);
    }

    // 构建sortKey
    const sortKey = tableId + '_' + sortType;

    // 更新排序状态
    if (sortState[sortKey] === null) {
        sortState[sortKey] = 'asc';
    } else if (sortState[sortKey] === 'asc') {
        sortState[sortKey] = 'desc';
    } else {
        sortState[sortKey] = null; // 还原到默认顺序
    }

    // 更新表头图标样式
    updateTableSortIcons(tableId, sortType);

    if (sortState[sortKey] === null) {
        // 还原到默认顺序：按原始顺序重新排列
        originalRows[tableId].forEach(row => tbody.appendChild(row));
        return;
    }

    // 获取排序列的索引
    let sortColumnIndex;
    if (sortType === 'strength') {
        sortColumnIndex = 1; // 区间强度是第2列
    } else if (sortType === 'rise') {
        sortColumnIndex = 2; // 区间涨幅是第3列
    } else if (sortType === 'money') {
        sortColumnIndex = 3; // 区间净额是第4列
    }

    // 排序
    rows.sort((a, b) => {
        const cellsA = a.querySelectorAll("td");
        const cellsB = b.querySelectorAll("td");
        const textA = cellsA[sortColumnIndex].querySelector('.cell-text')?.textContent || cellsA[sortColumnIndex].textContent;
        const textB = cellsB[sortColumnIndex].querySelector('.cell-text')?.textContent || cellsB[sortColumnIndex].textContent;

        // 提取数值（处理正负号和百分比）
        let numA = parseFloat(textA.replace(/[^\d.-]/g, '')) || 0;
        let numB = parseFloat(textB.replace(/[^\d.-]/g, '')) || 0;

        // 区间净额需要处理"亿"和"万"单位
        if (sortType === 'money') {
            if (textA.includes('亿')) numA *= 10000;
            else if (textA.includes('万')) numA *= 1;
            else numA /= 10000;

            if (textB.includes('亿')) numB *= 10000;
            else if (textB.includes('万')) numB *= 1;
            else numB /= 10000;
        }

        if (sortState[sortKey] === 'asc') {
            return numA - numB;
        } else {
            return numB - numA;
        }
    });

    // 重新添加到表格
    rows.forEach(row => tbody.appendChild(row));
}

/**
 * 更新板块/股票表格表头排序图标
 */
function updateTableSortIcons(tableId, sortType) {
    const table = document.getElementById(tableId);
    const headerThs = table.querySelectorAll("thead th");

    let thIndex;
    if (sortType === 'strength') thIndex = 1;
    else if (sortType === 'rise') thIndex = 2;
    else if (sortType === 'money') thIndex = 3;

    // 清除该表格所有排序图标
    headerThs.forEach(th => {
        th.classList.remove('asc', 'desc');
    });

    // 添加当前排序状态的图标
    const sortKey = tableId + '_' + sortType;
    if (sortState[sortKey]) {
        headerThs[thIndex].classList.add(sortState[sortKey]);
    }
}

/**
 * 对自我收益表格进行排序
 * @param {string} sortType - 排序类型：'totalProfit' 或 'profitRate'
 */
function sortSelfProfitTable(sortType) {
    const table = document.getElementById("selfProfitTable");
    const tbody = table.querySelector("tbody");
    const rows = Array.from(tbody.querySelectorAll("tr"));

    // 如果还没有原始顺序，先保存
    if (originalRows.selfProfitTable.length === 0) {
        saveOriginalRows("selfProfitTable");
    }

    // 更新排序状态
    if (sortState[sortType] === null) {
        sortState[sortType] = 'asc';
    } else if (sortState[sortType] === 'asc') {
        sortState[sortType] = 'desc';
    } else {
        sortState[sortType] = null; // 还原到默认顺序
    }

    // 更新表头图标样式
    updateSortIcons(sortType);

    if (sortState[sortType] === null) {
        // 还原到默认顺序：按原始顺序重新排列
        originalRows.selfProfitTable.forEach(row => tbody.appendChild(row));
        return;
    }

    // 获取排序列的索引
    let sortColumnIndex;
    if (sortType === 'totalProfit') {
        sortColumnIndex = 1; // 总盈亏是第2列
    } else if (sortType === 'profitRate') {
        sortColumnIndex = 2; // 盈亏比是第3列
    }

    // 排序
    rows.sort((a, b) => {
        const cellsA = a.querySelectorAll("td");
        const cellsB = b.querySelectorAll("td");
        const textA = cellsA[sortColumnIndex].querySelector('.cell-text')?.textContent || cellsA[sortColumnIndex].textContent;
        const textB = cellsB[sortColumnIndex].querySelector('.cell-text')?.textContent || cellsB[sortColumnIndex].textContent;

        // 提取数值（处理正负号和百分比）
        const numA = parseFloat(textA.replace(/[^\d.-]/g, '')) || 0;
        const numB = parseFloat(textB.replace(/[^\d.-]/g, '')) || 0;

        if (sortState[sortType] === 'asc') {
            return numA - numB;
        } else {
            return numB - numA;
        }
    });

    // 重新添加到表格
    rows.forEach(row => tbody.appendChild(row));
}

/**
 * 更新表头排序图标
 */
function updateSortIcons(sortType) {
    const headerThs = document.querySelectorAll("#selfProfitTable thead th");
    let thIndex;
    if (sortType === 'totalProfit') {
        thIndex = 1;
    } else if (sortType === 'profitRate') {
        thIndex = 2;
    }

    // 清除所有排序图标
    headerThs.forEach(th => {
        th.classList.remove('asc', 'desc');
    });

    // 添加当前排序状态的图标
    if (sortState[sortType]) {
        headerThs[thIndex].classList.add(sortState[sortType]);
    }
}
