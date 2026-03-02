// 输入监听相关函数

// 初始化所有输入框的事件监听
function initInputListeners() {
    // 监听板块表格的区间涨幅和区间净额
    setupTableValueListeners('sectorTable', ['区间涨幅', '区间净额']);

    // 监听股票表格的区间涨幅和区间净额
    setupTableValueListeners('stockTable', ['区间涨幅', '区间净额']);

    // 监听自我收益表格的盈亏比
    setupProfitRateListeners('selfProfitTable', '盈亏比');
}

// 为表格中的特定列设置数值监听
function setupTableValueListeners(tableId, targetColumns) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const headerRow = table.querySelector('thead tr');
    const targetIndices = [];

    // 为现有行添加监听
    table.querySelectorAll('tbody tr').forEach(row => {
        addInputListenersToRow(row, [2, 3], updateValueColor);
    });
}

// 为自我收益表格的盈亏比设置监听
function setupProfitRateListeners(tableId, targetColumn) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const headerRow = table.querySelector('thead tr');
    let targetIndex = -1;

    // 找到目标列的索引
    headerRow.querySelectorAll('th').forEach((th, index) => {
        if (th.textContent.trim() === targetColumn) {
            targetIndex = index;
        }
    });

    if (targetIndex === -1) return;

    // 为现有行添加监听
    table.querySelectorAll('tbody tr').forEach(row => {
        addInputListenersToRow(row, [targetIndex], highlightProfitRow);
    });
}

// 为行中的特定单元格添加输入监听
function addInputListenersToRow(row, indices, callback) {
    indices.forEach(index => {
        const input = row.querySelectorAll('td input')[index];
        if (input) {
            input.addEventListener('input', function() {
                callback(this);
            });
            // 初始化时执行一次
            callback(input);
        }
    });
}
