let currentMonth = 1; // 默认1月
let currentYear = new Date().getFullYear(); //默认当前年份

// 存储选中的行（tableId -> Set of tr elements）
let selectedRows = {
    sectorTable: new Set(),
    stockTable: new Set(),
    selfProfitTable: new Set()
};

// 切换行选中状态（单击事件）
function toggleRowSelection(tr, tableId) {
    if (selectedRows[tableId].has(tr)) {
        // 取消选中
        selectedRows[tableId].delete(tr);
        tr.classList.remove('row-selected');
    } else {
        // 选中
        selectedRows[tableId].add(tr);
        tr.classList.add('row-selected');
    }
}

// 清除所有选中状态
function clearAllSelections() {
    Object.keys(selectedRows).forEach(tableId => {
        selectedRows[tableId].forEach(tr => {
            tr.classList.remove('row-selected');
        });
        selectedRows[tableId].clear();
    });
}

// 加载首页录入的月度收益和上证涨幅数据
async function loadMonthlyProfitData() {
    const yearsData = await getYearsData();
    const myProfitEl = document.getElementById("monthlyMyProfit");
    const myAmountEl = document.getElementById("monthlyMyAmount");
    const indexProfitEl = document.getElementById("monthlyIndexProfit");

    if (yearsData && yearsData[currentYear]) {
        const yearData = yearsData[currentYear];
        // API返回的是对象格式 { "1": {...}, "2": {...} }
        const currentMonthData = yearData[String(currentMonth)];
        if (currentMonthData && (currentMonthData.my !== undefined || currentMonthData.index !== undefined)) {
            const myProfit = currentMonthData.my || 0;
            const myAmount = currentMonthData.myAmount || 0;
            const indexProfit = currentMonthData.index || 0;

            // 设置个人收益（如果值为0显示"--"）
            if (currentMonthData.my !== undefined && currentMonthData.my !== 0) {
                myProfitEl.textContent = (myProfit >= 0 ? '+' : '') + myProfit.toFixed(2) + '%';
                myProfitEl.className = 'value ' + (myProfit >= 0 ? 'red' : 'green');
            } else {
                myProfitEl.textContent = '--';
                myProfitEl.className = 'value';
            }

            // 设置收益金额（如果值为0显示"--"）
            if (currentMonthData.myAmount !== undefined && currentMonthData.myAmount !== 0) {
                const displayAmount = Math.abs(myAmount) >= 10000
                    ? (myAmount / 10000).toFixed(2) + '万'
                    : myAmount.toFixed(2);
                myAmountEl.textContent = (myAmount >= 0 ? '+' : '') + displayAmount + '元';
                myAmountEl.className = 'value amount-value ' + (myAmount >= 0 ? 'red' : 'green');
            } else {
                myAmountEl.textContent = '--';
                myAmountEl.className = 'value amount-value';
            }

            // 设置上证涨幅（如果值为0显示"--"）
            if (currentMonthData.index !== undefined && currentMonthData.index !== 0) {
                indexProfitEl.textContent = (indexProfit >= 0 ? '+' : '') + indexProfit.toFixed(2) + '%';
                indexProfitEl.className = 'value ' + (indexProfit >= 0 ? 'red' : 'green');
            } else {
                indexProfitEl.textContent = '--';
                indexProfitEl.className = 'value';
            }
        } else {
            // 没有录入数据
            myProfitEl.textContent = '--';
            myProfitEl.className = 'value';
            myAmountEl.textContent = '--';
            myAmountEl.className = 'value amount-value';
            indexProfitEl.textContent = '--';
            indexProfitEl.className = 'value';
        }
    } else {
        // 没有数据
        myProfitEl.textContent = '--';
        myProfitEl.className = 'value';
        myAmountEl.textContent = '--';
        myAmountEl.className = 'value amount-value';
        indexProfitEl.textContent = '--';
        indexProfitEl.className = 'value';
    }
    // 更新金额显示状态
    updateAmountDisplay();
}

// 切换月份
async function switchMonth(month) {
    // 先保存当前月份的数据
    await saveMonthDataWithoutAlert();
    // 跳转到对应月份页面，带年份参数
    window.location.href = `monthly-analysis.html?month=${month}&year=${currentYear}`;
}

// 切换表格1（板块/股票）
function switchTable1(type) {
    const sectorTable = document.getElementById("sectorTable");
    const stockTable = document.getElementById("stockTable");
    const table1Title = document.getElementById("table1Title");
    const switches = document.querySelectorAll(".table-switch");
    
    switches.forEach(sw => sw.classList.remove("active"));
    if (type === "板块") {
        sectorTable.style.display = "table";
        stockTable.style.display = "none";
        table1Title.textContent = "板块数据汇总";
        switches[0].classList.add("active");
    } else {
        sectorTable.style.display = "none";
        stockTable.style.display = "table";
        table1Title.textContent = "股票数据汇总";
        switches[1].classList.add("active");
    }
}

// 加载月份数据
async function loadMonthData() {
    // 清除所有选中状态
    clearAllSelections();

    // 清空原始行顺序（换月时重新记录）
    originalRows = {
        sectorTable: [],
        stockTable: [],
        selfProfitTable: []
    };

    // 从API获取月度数据
    const monthlyData = await getMonthlyData(currentYear);
    const savedData = monthlyData[String(currentMonth)];

    if (savedData) {
        // 填充开头文字
        document.getElementById("introText").value = savedData.intro || "";
        // 填充结尾总结
        document.getElementById("summaryText").value = savedData.summary || "";
        // 填充板块表格
        fillTable("sectorTable", Array.isArray(savedData.sector) ? savedData.sector : []);
        // 填充股票表格
        fillTable("stockTable", Array.isArray(savedData.stock) ? savedData.stock : []);
        // 填充自我收益表格
        fillSelfProfitTable(Array.isArray(savedData.selfProfit) ? savedData.selfProfit : []);
    } else {
        document.getElementById("introText").value = '';
        document.getElementById("summaryText").value = "";
        // 如果没有保存的数据，初始化表格
        initTables();
    }
}

// 封装通用清空表格tbody的方法（减少重复代码）
function clearTableTbody(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;
    const tbody = table.querySelector("tbody");
    if (tbody) {
        // innerHTML 清空（简洁高效，推荐）
        tbody.innerHTML = "";
    }
}

// 初始化表格
function initTables() {
    // 清空所有表格，显示空表格
    clearTableTbody("sectorTable");
    clearTableTbody("stockTable");
    clearTableTbody("selfProfitTable");
}

// 填充表格数据
function fillTable(tableId, dataList) {
    const table = document.getElementById(tableId);
    const tbody = table.querySelector("tbody");
    tbody.innerHTML = ""; // 清空原有行

    // 确保 dataList 是有效数组
    if (!Array.isArray(dataList)) {
        dataList = [];
    }

    if (dataList.length === 0) {
        // 没有数据时直接返回，显示空表格
        return;
    }

    // 确定目标列（区间涨幅、区间净额）的索引（根据表格结构调整）
    const targetColumnKeys = ['区间涨幅', '区间净额'];
    const headerThs = table.querySelectorAll('thead th');
    const headerKeys = []; // 存储表头列名的数组
    headerThs.forEach(th => {
        headerKeys.push(th.textContent.trim()); // 把表头文本存到数组里
    });
    const targetIndices = [];
    headerKeys.forEach((key, index) => {
        if (targetColumnKeys.includes(key)) {
            targetIndices.push(index);
        }
    });

    dataList.forEach((item, idx) => {
        const tr = document.createElement("tr");

        // 添加单击事件切换选中状态
        tr.addEventListener('mousedown', function(e) {
            // 如果点击的是输入框，不处理选中
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            // 如果是双击，不处理（让双击事件处理）
            if (e.detail > 1) return;
            toggleRowSelection(tr, tableId);
        });

        // 根据区间涨幅设置class
        const riseValue = item['区间涨幅'];
        if (riseValue) {
            const num = parseFloat(riseValue.replace(/[^\d.-]/g, ''));
            if (num > 0) {
                tr.classList.add('profit-positive');
            } else if (num < 0) {
                tr.classList.add('profit-negative');
            }
        }

        // 根据表格列数创建单元格（与表头对应）
        headerThs.forEach((columns, cellIndex) => {
            const td = document.createElement('td');
            td.className = 'input-cell';
            // 直接使用表头key获取值
            const columnKey = headerKeys[cellIndex];
            const value = item[columnKey] || '';

            // 创建纯文本显示元素
            const textSpan = document.createElement('span');
            textSpan.className = 'cell-text';
            textSpan.textContent = value;
            td.appendChild(textSpan);

            // 创建输入框（初始隐藏）
            const input = document.createElement('input');
            input.type = 'text';
            input.value = value;
            input.style.display = 'none';
            // 设置占位符
            const placeholders = tableId === 'sectorTable'
                ? ["板块名称", "区间强度", "区间涨幅", "区间净额"]
                : ["股票名称", "板块", "区间涨幅", "区间净额"];
            input.placeholder = placeholders[cellIndex] || '';
            td.appendChild(input);

            // 绑定双击编辑事件 - 开启整行编辑
            td.addEventListener('dblclick', function() {
                const row = tr;
                const cells = row.querySelectorAll('td');
                cells.forEach(cell => {
                    cell.classList.add('editing');
                    const inp = cell.querySelector('input');
                    if (inp) {
                        inp.style.display = 'block';
                    }
                });
                input.focus();
                input.select();
            });

            // 绑定失焦事件（保存并退出编辑）
            input.addEventListener('blur', function() {
                // 使用setTimeout确保在blur之后执行
                setTimeout(() => {
                    const row = tr;
                    const cells = row.querySelectorAll('td');

                    cells.forEach(cell => {
                        cell.classList.remove('editing');
                        const inp = cell.querySelector('input');
                        const span = cell.querySelector('.cell-text');
                        if (inp && span) {
                            inp.style.display = 'none';
                            span.textContent = inp.value;
                        }
                    });
                    // 更新数据
                    updateTableData(tableId);
                }, 0);
            });

            // 绑定回车键退出编辑
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    input.blur();
                }
            });

            // 关键：赋值后主动调用颜色处理函数
            if (targetIndices.includes(cellIndex)) {
                updateValueColor(input);
            }

            // 将td添加到tr中
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

// 更新表格数据到存储（实时更新）
async function updateTableData(tableId) {
    const table = document.getElementById(tableId);
    const rows = table.querySelectorAll("tbody tr");
    const data = [];
    rows.forEach(row => {
        const cells = row.querySelectorAll("td");
        const headerThs = table.querySelectorAll("thead th");
        const rowData = {};
        cells.forEach((cell, idx) => {
            const text = cell.querySelector('.cell-text');
            const input = cell.querySelector('input');
            const value = text ? text.textContent : (input ? input.value : '');
            const columnKey = headerThs[idx].textContent.trim();
            rowData[columnKey] = value;
        });
        data.push(rowData);
    });
    // 从API获取当前月度数据
    let monthlyData = await getMonthlyData(currentYear);
    if (!monthlyData || typeof monthlyData !== 'object') {
        monthlyData = {};
    }

    // 合并：只更新当前月份，保留其他月份，空数组不覆盖原有数据
    const savedData = monthlyData[String(currentMonth)] || {};

    if (tableId === 'sectorTable') {
        if (Array.isArray(data) && data.length > 0) savedData.sector = data;
    } else if (tableId === 'stockTable') {
        if (Array.isArray(data) && data.length > 0) savedData.stock = data;
    }

    monthlyData[String(currentMonth)] = savedData;
    await saveMonthlyData(currentYear, monthlyData, 'updateTableData');
}

// 填充自我收益表格数据（包含分时图）
function fillSelfProfitTable(dataList) {
    const table = document.getElementById("selfProfitTable");
    const tbody = table.querySelector("tbody");
    tbody.innerHTML = ""; // 清空原有行

    // 确保 dataList 是有效数组
    if (!Array.isArray(dataList)) {
        dataList = [];
    }

    if (dataList.length === 0) {
        // 没有数据时直接返回，显示空表格
        return;
    }

    // 确定盈亏比列的索引（根据你的表格结构，盈亏比是第3列，索引为2）
    const headerThs = table.querySelectorAll('thead th');
    const headerKeys = [];
    headerThs.forEach(th => {
        headerKeys.push(th.textContent.trim());
    });
    const nameColumnKey = '名称';
    const nameColumnIndex = headerKeys.indexOf(nameColumnKey);
    const moneyKey = '总盈亏';
    const moneyIndex = headerKeys.indexOf(moneyKey);

    dataList.forEach(item => {
        const tr = document.createElement("tr");

        // 添加单击事件切换选中状态
        tr.addEventListener('mousedown', function(e) {
            // 如果点击的是输入框，不处理选中
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            // 如果是双击，不处理（让双击事件处理）
            if (e.detail > 1) return;
            toggleRowSelection(tr, 'selfProfitTable');
        });

        // 根据盈亏比设置class
        const profitValue = item['盈亏比'] || item['总盈亏'] || '';
        if (profitValue) {
            const num = parseFloat(profitValue.replace(/[^\d.-]/g, ''));
            if (num > 0) {
                tr.classList.add('profit-positive');
            } else if (num < 0) {
                tr.classList.add('profit-negative');
            }
        }

        // 根据表格列数创建单元格（与表头对应：名称/总盈亏/盈亏比/持有周期/手续费/备注/分时图）
        headerThs.forEach((_, cellIndex) => {
            const td = document.createElement('td');
            if (cellIndex === 6) {
                // 分时图列（无需输入框）
                td.className = 'chart-cell';
                const imgSrc = `../photo/${currentYear}/${currentMonth}-${item[nameColumnKey]}.jpg`;
                td.innerHTML = `<img src="${imgSrc}" onerror="this.style.display='none'">`;
                td.addEventListener('click', function() {
                        openChartModal(imgSrc);
                    });
                tr.appendChild(td);
                return;
            }

            // 赋值：根据单元格索引匹配对应数据
            const columnKey = headerKeys[cellIndex];
            const value = item[columnKey] || '';

            // 纯文本显示
            const textSpan = document.createElement('span');
            textSpan.className = 'cell-text' + (cellIndex === moneyIndex ? ' amount-value' : '');
            textSpan.textContent = value;
            td.appendChild(textSpan);

            // 创建输入框（初始隐藏）
            let input;
            if (cellIndex === 5) { //备注
                td.className = 'input-cell';
                input = document.createElement('textarea');
                input.wrap = 'soft';
                input.style.display = 'none';
            } else {
                td.className = 'input-cell';
                input = document.createElement('input');
                input.type = 'text';
                input.style.display = 'none';
            }
            input.value = value;
            td.appendChild(input);

            // 双击编辑 - 开启整行编辑
            td.addEventListener('dblclick', function() {
                const row = tr;
                const cells = row.querySelectorAll('td');
                cells.forEach(cell => {
                    cell.classList.add('editing');
                    const inp = cell.querySelector('input, textarea');
                    if (inp) {
                        inp.style.display = 'block';
                    }
                });
                input.focus();
            });

            // 失焦保存 - 关闭整行编辑
            input.addEventListener('blur', function() {
                // 使用setTimeout确保在blur之后检查焦点
                setTimeout(() => {
                    const row = tr;
                    const cells = row.querySelectorAll('td');

                    cells.forEach(cell => {
                        cell.classList.remove('editing');
                        const inputs = cell.querySelectorAll('input, textarea');
                        const span = cell.querySelector('.cell-text');
                        inputs.forEach(inp => {
                            inp.style.display = 'none';
                        });
                        if (span && inputs.length > 0) {
                            span.textContent = inputs[0].value;
                        }
                    });
                    // 更新分时图（名称列）
                    if (cellIndex === nameColumnIndex) {
                        updateChart(input);
                    }
                    // 更新数据
                    updateSelfProfitData();
                }, 0);
            });

            // 回车保存
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && cellIndex !== 4) {
                    input.blur();
                }
            });

            tr.appendChild(td);

            // 盈亏比列颜色处理
            if (cellIndex === moneyIndex) {
                highlightProfitRow(input);
            }
        });
        tbody.appendChild(tr);
    });
    // 更新金额显示状态
    updateAmountDisplay();
}

// 更新自我收益数据到存储
async function updateSelfProfitData() {
    const table = document.getElementById("selfProfitTable");
    const rows = table.querySelectorAll("tbody tr");
    const data = [];
    const headerThs = table.querySelectorAll("thead th");
    const headerKeys = Array.from(headerThs).map(th => th.textContent.trim());

    rows.forEach(row => {
        const cells = row.querySelectorAll("td");
        const rowData = {};
        cells.forEach((cell, idx) => {
            const text = cell.querySelector('.cell-text');
            const input = cell.querySelector('input, textarea');
            const value = text ? text.textContent : (input ? input.value : '');
            const columnKey = headerKeys[idx];
            rowData[columnKey] = value.trim();
        });
        // 过滤掉空行（所有字段都为空）
        const isEmptyRow = Object.values(rowData).every(v => !v);
        if (!isEmptyRow) {
            data.push(rowData);
        }
    });
    // 从API获取当前月度数据
    let monthlyData = await getMonthlyData(currentYear);
    if (!monthlyData || typeof monthlyData !== 'object') {
        monthlyData = {};
    }

    // 合并：只更新当前月份，保留其他月份
    const savedData = monthlyData[String(currentMonth)] || {};
    // 空数组不覆盖原有数据
    if (Array.isArray(data) && data.length > 0) {
        savedData.selfProfit = data;
    }
    monthlyData[String(currentMonth)] = savedData;
    await saveMonthlyData(currentYear, monthlyData, 'updateSelfProfitData');
}

// 更新分时图
function updateChart(input) {
    const stockName = input.value.trim();
    const row = input.closest("tr");
    const chartCell = row.querySelector(".chart-cell");
    
    if (stockName) {
        const imgSrc = `../photo/${currentYear}/${currentMonth}-${stockName}.jpg`;
        chartCell.innerHTML = `<img src="${imgSrc}" onerror="this.style.display='none'">`;
    } else {
        chartCell.innerHTML = "";
    }
}

// 为表格添加行
function addRow(tableId) {
    const table = document.getElementById(tableId);
    const tbody = table.querySelector("tbody");
    const tr = document.createElement("tr");

    // 添加单击事件切换选中状态
    tr.addEventListener('mousedown', function(e) {
        // 如果点击的是输入框，不处理选中
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        // 如果是双击，不处理（让双击事件处理）
        if (e.detail > 1) return;
        toggleRowSelection(tr, tableId);
    });

    // 获取表头列数
    const cols = table.querySelectorAll("thead th");

    // 目标列（涨幅、净额）
    const targetIndices = [2, 3];

    cols.forEach((col, idx) => {
        const td = document.createElement("td");
        td.className = "input-cell";

        // 设置默认占位符
        let placeholder = "";
        if (tableId === "sectorTable") {
            const placeholders = ["板块名称", "区间强度", "区间涨幅", "区间净额"];
            placeholder = placeholders[idx] || "";
        } else if (tableId === "stockTable") {
            const placeholders = ["股票名称", "板块", "区间涨幅", "区间净额"];
            placeholder = placeholders[idx] || "";
        }

        // 创建纯文本显示元素
        const textSpan = document.createElement('span');
        textSpan.className = 'cell-text';
        textSpan.textContent = '';
        td.appendChild(textSpan);

        // 创建输入框（初始隐藏，显示为空白等待编辑）
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = placeholder;
        input.style.display = 'none';
        td.appendChild(input);

        // 绑定双击编辑事件 - 开启整行编辑
        td.addEventListener('dblclick', function() {
            const row = tr;
            const cells = row.querySelectorAll('td');
            cells.forEach(cell => {
                cell.classList.add('editing');
                const inp = cell.querySelector('input');
                if (inp) {
                    inp.style.display = 'block';
                }
            });
            input.focus();
        });

        // 绑定失焦事件（保存并退出编辑）
        input.addEventListener('blur', function() {
            td.classList.remove('editing');
            input.style.display = 'none';
            textSpan.textContent = input.value;
            // 更新数据
            updateTableData(tableId);
            // 目标列颜色处理
            if (targetIndices.includes(idx)) {
                updateValueColor(input);
            }
        });

        // 绑定回车键退出编辑
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                input.blur();
            }
        });

        tr.appendChild(td);
    });

    tbody.appendChild(tr);
}
//为表格删除行
function delRow(tableId) {
    // 1. 获取表格和tbody
    const table = document.getElementById(tableId);
    if (!table) return; // 表格不存在，直接返回
    const tbody = table.querySelector("tbody");
    if (!tbody) return; // tbody不存在，直接返回

    // 优先删除选中的行
    const selected = selectedRows[tableId];
    if (selected.size > 0) {
        // 遍历选中行并删除（需要先转换为数组，因为 Set 在遍历时不能删除）
        Array.from(selected).forEach(tr => {
            tbody.removeChild(tr);
        });
        // 清除选中状态
        selected.clear();
    } else {
        // 没有选中行时，删除最后一行（兼容旧逻辑）
        const lastTr = tbody.lastElementChild;
        if (lastTr) {
            tbody.removeChild(lastTr);
        }
    }

    // 更新数据
    updateTableData(tableId);
}

// 添加自我收益表格行（双击编辑模式）
function addSelfProfitRow() {
    const table = document.getElementById("selfProfitTable");
    const tbody = table.querySelector("tbody");
    const tr = document.createElement("tr");
    
    // 表头列数（名称/总盈亏/盈亏比/持有周期/备注/分时图）
    const columnCount = 7;
    const remarkIndex = 5; // 备注列是第6列（索引5），与表格结构一致

    const nameIndex = 0;
    for (let cellIndex = 0; cellIndex < columnCount; cellIndex++) {
        const td = document.createElement('td');
        if (cellIndex === 6) {
            // 分时图列
            td.className = 'chart-cell';
            tr.appendChild(td);
            continue;
        }

        // 先创建textSpan显示文本
        const textSpan = document.createElement('span');
        textSpan.className = 'cell-text';
        textSpan.textContent = '';
        td.appendChild(textSpan);

        td.className = 'input-cell';
        let input;
        // 备注列创建textarea
        if (cellIndex === remarkIndex) {
            td.className = 'text-area-cell';
            input = document.createElement('textarea');
            input.wrap = 'soft';
            input.placeholder = '备注信息（支持多行输入）';
            input.style.display = 'none';
        } else if (cellIndex === nameIndex) {
            input = document.createElement('input');
            input.type = 'text';
            input.placeholder = '新增股票';
            input.style.display = 'none';
            input.onchange = function() { updateChart(this); };
        } else {
            input = document.createElement('input');
            input.type = 'text';
            // 给其他列设置占位符
            switch (cellIndex) {
                case 1:
                    input.placeholder = '0.00';
                    break;
                case 2:
                    input.placeholder = '0.00%';
                    break;
                case 3:
                    input.placeholder = '例如：3天';
                    break;
            }
            input.style.display = 'none';
        }

        td.appendChild(input);

        // 双击编辑 - 开启整行编辑
        td.addEventListener('dblclick', function() {
            const row = tr;
            const cells = row.querySelectorAll('td');
            cells.forEach(cell => {
                cell.classList.add('editing');
                const inp = cell.querySelector('input, textarea');
                if (inp) {
                    inp.style.display = 'block';
                }
            });
            input.focus();
        });

        // 失焦保存 - 关闭整行编辑
        input.addEventListener('blur', function() {
            // 使用setTimeout确保在blur之后执行
            setTimeout(() => {
                const row = tr;
                const cells = row.querySelectorAll('td');

                cells.forEach(cell => {
                    cell.classList.remove('editing');
                    const inputs = cell.querySelectorAll('input, textarea');
                    const span = cell.querySelector('.cell-text');
                    inputs.forEach(inp => {
                        inp.style.display = 'none';
                    });
                    if (span && inputs.length > 0) {
                        span.textContent = inputs[0].value;
                    }
                });
                if (cellIndex === nameIndex) {
                    updateChart(input);
                }
                updateSelfProfitData();
            }, 0);
        });

        // 回车保存
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && cellIndex !== remarkIndex) {
                input.blur();
            }
        });

        tr.appendChild(td);
    }
    /*// 名称
    const nameTd = document.createElement("td");
    nameTd.className = "input-cell";
    nameTd.innerHTML = `<input type="text" placeholder="股票名称" onchange="updateChart(this)">`;
    tr.appendChild(nameTd);
    
    // 总盈亏
    const amountTd = document.createElement("td");
    amountTd.className = "input-cell";
    amountTd.innerHTML = `<input type="text" placeholder="0.00">`;
    tr.appendChild(amountTd);
    
    // 盈亏比
    const rateTd = document.createElement("td");
    rateTd.className = "input-cell";
    rateTd.innerHTML = `<input type="text" placeholder="0.00%">`;
    tr.appendChild(rateTd);

     // 持有周期
    const periodTd = document.createElement("td");
    periodTd.className = "input-cell";
    periodTd.innerHTML = `<input type="text" placeholder="例如：5天">`;
    tr.appendChild(periodTd);
    
    // 备注
    const noteTd = document.createElement("td");
    noteTd.className = "input-cell";
    noteTd.innerHTML = `<input type="text" placeholder="备注信息">`;
    tr.appendChild(noteTd);
    
    // 分时图
    const chartTd = document.createElement("td");
    chartTd.className = "chart-cell";
    chartTd.innerHTML = "";
    tr.appendChild(chartTd);*/

    tbody.appendChild(tr);
}

// 添加自我收益表格行（双击编辑模式）
function addSelfProfitRow() {
    const table = document.getElementById("selfProfitTable");
    const tbody = table.querySelector("tbody");
    const tr = document.createElement("tr");

    // 添加单击事件切换选中状态
    tr.addEventListener('mousedown', function(e) {
        // 如果点击的是输入框，不处理选中
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        // 如果是双击，不处理（让双击事件处理）
        if (e.detail > 1) return;
        toggleRowSelection(tr, 'selfProfitTable');
    });

    const columnCount = 7;
    const remarkIndex = 5;
    const nameIndex = 0;
    const moneyIndex = 1;

    for (let cellIndex = 0; cellIndex < columnCount; cellIndex++) {
        const td = document.createElement('td');
        if (cellIndex === 6) {
            td.className = 'chart-cell';
            tr.appendChild(td);
            continue;
        }

        td.className = 'input-cell';

        let placeholder = '';
        switch (cellIndex) {
            case 0: placeholder = '股票名称'; break;
            case 1: placeholder = '0.00'; break;
            case 2: placeholder = '0.00%'; break;
            case 3: placeholder = '例如：3天'; break;
            case 4: placeholder = '0.00'; break;  // 手续费
            case 5: placeholder = '备注信息'; break;
        }

        const textSpan = document.createElement('span');
        textSpan.className = 'cell-text';
        textSpan.textContent = '';
        td.appendChild(textSpan);

        let input;
        if (cellIndex === remarkIndex) {
            input = document.createElement('textarea');
            input.wrap = 'soft';
        } else {
            input = document.createElement('input');
            input.type = 'text';
        }
        input.placeholder = placeholder;
        input.style.display = 'none';
        td.appendChild(input);

        // 双击编辑 - 整行编辑模式（与fillSelfProfitTable一致）
        td.addEventListener('dblclick', function() {
            const row = tr;
            const cells = row.querySelectorAll('td');
            cells.forEach(cell => {
                cell.classList.add('editing');
                const inp = cell.querySelector('input, textarea');
                if (inp) {
                    inp.style.display = 'block';
                }
            });
            input.focus();
        });

        input.addEventListener('blur', function() {
            const row = tr;
            const cells = row.querySelectorAll('td');
            cells.forEach(cell => {
                cell.classList.remove('editing');
                const inp = cell.querySelector('input, textarea');
                if (inp) {
                    inp.style.display = 'none';
                    const textSpan = cell.querySelector('.cell-text');
                    if (textSpan) {
                        textSpan.textContent = inp.value;
                    }
                }
            });
            if (cellIndex === nameIndex) {
                updateChart(input);
            }
            if (cellIndex === moneyIndex) {
                highlightProfitRow(input);
            }
            updateSelfProfitData();
        });

        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && cellIndex !== remarkIndex) {
                input.blur();
            }
        });

        tr.appendChild(td);
    }

    tbody.appendChild(tr);
}

// 删除自我收益表格行
function delSelfProfitRow() {
    const table = document.getElementById("selfProfitTable");
    const tbody = table.querySelector("tbody");

    // 优先删除选中的行
    const selected = selectedRows['selfProfitTable'];
    if (selected.size > 0) {
        // 遍历选中行并删除（需要先转换为数组，因为 Set 在遍历时不能删除）
        Array.from(selected).forEach(tr => {
            tbody.removeChild(tr);
        });
        // 清除选中状态
        selected.clear();
    } else {
        // 没有选中行时，删除最后一行（兼容旧逻辑）
        const lastTr = tbody.lastElementChild;
        if (lastTr) {
            tbody.removeChild(lastTr);
        }
    }

    // 更新数据
    updateSelfProfitData();
}

// 保存月份数据（无提示，用于切换月份时自动保存）
async function saveMonthDataWithoutAlert() {
    // 收集开头/结尾文字
    const intro = document.getElementById("introText")?.value || "";
    const summary = document.getElementById("summaryText")?.value || "";
    // 收集板块表格数据
    const sectorData = collectTableData("sectorTable");
    // 收集股票表格数据
    const stockData = collectTableData("stockTable");
    // 收集自我收益表格数据（需要await）
    const selfProfitTableData = await collectSelfProfitTableData();

    // 从API获取当前月度数据
    let monthlyData = await getMonthlyData(currentYear);
    // 确保 monthlyData 是有效对象（文件不存在时可能是 {}）
    if (!monthlyData || typeof monthlyData !== 'object') {
        monthlyData = {};
    }

    // 获取当前月份的已有数据
    const existing = monthlyData[String(currentMonth)] || {};

    // 构建更新数据，只包含非空值（空字符串、[]、{}、null 视为空）
    const isEmpty = (v) => v === '' || v === null || v === undefined ||
        (Array.isArray(v) && v.length === 0) ||
        (typeof v === 'object' && v !== null && Object.keys(v).length === 0);

    const updated = {};
    if (!isEmpty(intro)) updated.intro = intro;
    if (!isEmpty(summary)) updated.summary = summary;
    if (!isEmpty(sectorData)) updated.sector = sectorData;
    if (!isEmpty(stockData)) updated.stock = stockData;
    if (!isEmpty(selfProfitTableData)) updated.selfProfit = selfProfitTableData;

    // 合并：保留其他月份，非空字段用新值覆盖
    monthlyData[String(currentMonth)] = { ...existing, ...updated };
    await saveMonthlyData(currentYear, monthlyData, 'saveMonthDataWithoutAlert');
}

// 保存月份数据（带提示）
async function saveMonthData() {
    await saveMonthDataWithoutAlert();
    alert(`${currentYear}年${currentMonth}月数据保存成功！`);
}

// 收集表格数据
function collectTableData(tableId) {
    const table = document.getElementById(tableId);
    const rows = table.querySelectorAll("tbody tr");
    const data = [];
    const headerThs = table.querySelectorAll("thead th");
    const headerKeys = Array.from(headerThs).map(th => th.textContent.trim());

    rows.forEach(row => {
        const cells = row.querySelectorAll("td");
        const rowData = {};
        cells.forEach((cell, idx) => {
            const text = cell.querySelector('.cell-text');
            const input = cell.querySelector('input');
            // 优先读取显示的文本，如果没有则读取输入框的值
            const value = text ? text.textContent : (input ? input.value : '');
            const columnKey = headerKeys[idx];
            rowData[columnKey] = value.trim();
        });
        // 过滤掉空行（所有字段都为空）
        const isEmptyRow = Object.values(rowData).every(v => !v);
        if (!isEmptyRow) {
            data.push(rowData);
        }
    });
    return data;
}

// 收集自我收益表格数据
async function collectSelfProfitTableData() {
    const table = document.getElementById("selfProfitTable");
    const rows = table.querySelectorAll("tbody tr");
    const data = [];
    rows.forEach(row => {
        const inputs = row.querySelectorAll("input");
        const textarea = row.querySelectorAll("textarea");
        const rowData = {
            "名称": inputs[0] ? inputs[0].value.trim() : "",
            "总盈亏": inputs[1] ? inputs[1].value.trim() : "",
            "盈亏比": inputs[2] ? inputs[2].value.trim() : "",
            "持有周期": inputs[3] ? inputs[3].value.trim() : "",
            "手续费": inputs[4] ? inputs[4].value.trim() : "",
            "备注": textarea[0] ? textarea[0].value.trim() : ""
        };
        // 过滤掉空行（所有字段都为空）
        const isEmptyRow = !rowData["名称"] && !rowData["总盈亏"] && !rowData["盈亏比"] &&
            !rowData["持有周期"] && !rowData["手续费"] && !rowData["备注"];
        if (!isEmptyRow) {
            data.push(rowData);
        }
    });
    return data;
}

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

// 初始化
window.onload = async function() {
    const params = new URLSearchParams(window.location.search);
    let month = params.get('month');
    let saveYear = params.get('year'); // 优先从URL获取年份

    // 如果URL没有年份，从localStorage获取
    if (!saveYear) {
        saveYear = localStorage.getItem(YEAR_KEY);
    }

    // 如果没有保存的年份，默认使用当前年份
    if (!saveYear) {
        saveYear = new Date().getFullYear().toString();
    }

    currentYear = saveYear;

    // 初始化年份下拉框
    await initYearSelect(saveYear);

    // 如果没有月份参数，默认使用1月
    if (!month) {
        month = "1";
    }

    // 确保 currentMonth 是数字类型
    currentMonth = parseInt(month, 10);

    // 设置当前月份显示
    const currentMonthEl = document.getElementById('currentMonth');
    if (currentMonthEl) currentMonthEl.textContent = currentMonth;
    // 更新按钮选中状态
    updateMonthButtonActive(currentMonth);
    // 加载对应月份的数据
    loadMonthData();
    // 加载首页录入的月度收益和上证涨幅
    loadMonthlyProfitData();

    // 渲染日历
    renderCalendar();

    // 点击页面其他地方关闭整行编辑框
    document.addEventListener('click', function(e) {
        const tables = ['sectorTable', 'stockTable', 'selfProfitTable'];
        tables.forEach(tableId => {
            const table = document.getElementById(tableId);
            if (!table) return;
            // 检查点击是否在表格内
            if (table.contains(e.target)) {
                // 在表格内，不处理
                return;
            }
            // 关闭表格所有编辑框
            const rows = table.querySelectorAll('tbody tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td.editing');
                cells.forEach(cell => {
                    cell.classList.remove('editing');
                    const inp = cell.querySelector('input');
                    const span = cell.querySelector('.cell-text');
                    if (inp && span) {
                        inp.style.display = 'none';
                        span.textContent = inp.value;
                    }
                });
            });
        });
    });

    // 恢复金额显示状态
    updateAmountDisplay();
};

// 更新月份按钮选中状态
function updateMonthButtonActive(month) {
    const buttons = document.querySelectorAll('.month-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent === month + '月') {
            btn.classList.add('active');
        }
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化所有输入框的事件监听
    initInputListeners();
});

// 页面隐藏时自动保存数据
document.addEventListener('visibilitychange', async function() {
    if (document.visibilityState === 'hidden') {
        // 收集开头/结尾文字
        const intro = document.getElementById("introText")?.value;
        const summary = document.getElementById("summaryText")?.value;

        if (intro !== undefined && summary !== undefined) {
            // 收集板块表格数据
            const sectorData = collectTableData("sectorTable");
            // 收集股票表格数据
            const stockData = collectTableData("stockTable");
            // 收集自我收益表格数据
            const selfProfitData = collectSelfProfitTableData();

            // 保存到API
            let monthlyData = await getMonthlyData(currentYear);
            if (!monthlyData || typeof monthlyData !== 'object') {
                monthlyData = {};
            }

            // 合并：只更新当前月份，保留其他月份，空数组不覆盖原有数据
            const existing = monthlyData[String(currentMonth)] || {};
            const updateData = { ...existing, intro, summary };
            // 空数组不覆盖原有数据
            if (Array.isArray(sectorData) && sectorData.length > 0) updateData.sector = sectorData;
            if (Array.isArray(stockData) && stockData.length > 0) updateData.stock = stockData;
            if (Array.isArray(selfProfitData) && selfProfitData.length > 0) updateData.selfProfit = selfProfitData;
            monthlyData[String(currentMonth)] = updateData;
            await saveMonthlyData(currentYear, monthlyData, 'visibilitychange');
        }
    }
});

// ==================== 每日复盘日历 ====================

// 渲染日历
async function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;

    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

    // 获取当月天数
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    // 获取当月1日是周几
    const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay();

    // 获取当月有每日复盘记录的日期
    const daysWithData = await getDailyDataDays();

    // 获取休市日列表
    let offDays = [];
    if (typeof getOffDays === 'function') {
        offDays = await getOffDays(currentYear) || [];
    }

    // 渲染 weekday 标题
    let html = weekdays.map(d => `<div class="calendar-weekday">${d}</div>`).join('');

    // 渲染空白填充
    for (let i = 0; i < firstDayOfWeek; i++) {
        html += '<div class="calendar-day empty"></div>';
    }

    // 渲染日期
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(currentMonth).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        const isToday = dateStr === todayStr;
        const dayData = daysWithData.get(dateStr);
        const dailyProfit = dayData ? dayData.dailyProfit : '';
        // 解析收益值为数字（去掉%符号后解析），用于判断颜色
        const profitValue = dailyProfit ? parseFloat(dailyProfit.replace('%', '')) : null;
        const isProfit = profitValue !== null && profitValue > 0;
        const isBigProfit = profitValue !== null && profitValue >= 10;
        const isLoss = profitValue !== null && profitValue < 0;

        const isFuture = dateStr > todayStr;
        // 判断是否休市日（周末或节假日）
        const currentDate = new Date(currentYear, currentMonth - 1, day);
        const dayOfWeek = currentDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 周日或周六
        const isOffDay = offDays.includes(dateStr);
        const isClosed = isWeekend || isOffDay; // 休市日不允许点击

        let classes = ['calendar-day'];
        if (isToday) classes.push('today');
        // 根据盈亏添加颜色类（参考首页月卡片：盈利>10%大红，盈利>0%橙色，亏损蓝色）
        if (isBigProfit) classes.push('big-profit');
        else if (isProfit) classes.push('profit');
        else if (isLoss) classes.push('loss');
        if (isFuture || isClosed) classes.push('future');

        const clickHandler = (isFuture || isClosed) ? '' : `onclick="openDailyAnalysis('${dateStr}')"`;

        // 如果有本日收益，显示在日历格子里
        let dayContent = day;
        if (dailyProfit) {
            dayContent = `<div>${day}</div><div class="day-profit">${dailyProfit}</div>`;
        }

        html += `<div class="${classes.join(' ')}" ${clickHandler}>${dayContent}</div>`;
    }

    grid.innerHTML = html;
}

// 获取当月有每日复盘记录的日期和收益
async function getDailyDataDays() {
    const daysMap = new Map(); // 日期 -> 收益数据
    const allDaily = await getDailyData(currentYear, currentMonth);

    for (const dateKey in allDaily) {
        // 检查是否属于当前年月
        if (dateKey.startsWith(`${currentYear}-${String(currentMonth).padStart(2,'0')}`)) {
            const data = allDaily[dateKey];
            daysMap.set(dateKey, {
                dailyProfit: data.dailyProfit || '',
                dailyIndex: data.dailyIndex || ''
            });
        }
    }
    return daysMap;
}

// 打开每日复盘页面
function openDailyAnalysis(dateStr) {
    if (!dateStr) {
        // 没有传日期，使用当天
        const today = new Date();
        dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    }
    window.location.href = `daily-analysis.html?date=${dateStr}`;
}

// 暴露到全局
window.fillTable = fillTable;
window.updateTableData = updateTableData;
window.updateSelfProfitData = updateSelfProfitData;
window.addRow = addRow;
window.delRow = delRow;
window.addSelfProfitRow = addSelfProfitRow;
window.delSelfProfitRow = delSelfProfitRow;
window.saveMonthDataWithoutAlert = saveMonthDataWithoutAlert;

// 退出（保存数据后关闭服务器）
window.exitWithSave = async function() {
    await saveMonthDataWithoutAlert();
    shutdownServer();
};