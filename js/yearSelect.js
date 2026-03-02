// 年份选择相关函数

// 初始化年份下拉框
async function initYearSelect(defaultYear) {
    const yearsData = await getYearsData() || {};
    const years = Object.keys(yearsData).sort();

    const yearSelect = document.getElementById('yearSelect');
    if (!yearSelect) return;
    yearSelect.innerHTML = '';
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    });

    // 设置选中当前年份
    if (years.includes(defaultYear)) {
        yearSelect.value = defaultYear;
    }
}

// 从下拉框切换年份
function switchYearFromSelect() {
    const yearSelect = document.getElementById('yearSelect');
    if (!yearSelect) return;
    const newYear = yearSelect.value;
    const currentMonthEl = document.getElementById('currentMonth');
    const currentMonth = currentMonthEl ? currentMonthEl.textContent : '1';

    // 跳转到对应年份和月份的页面
    window.location.href = `monthly-analysis.html?month=${currentMonth}&year=${newYear}`;
}

// ========== 以下是首页年份管理函数 ==========

// 初始化年份选择器（包含 loadYearsList 和 updateYearCheckboxes）
async function initYearSelector() {
    // 加载已存在的年份
    await loadYearsList();

    // 初始化当前选中的年份
    let savedYear = localStorage.getItem(YEAR_KEY);

    // 确保选中的年份存在于 yearsData 中
    const years = Object.keys(yearsData);

    if (!savedYear || !years.includes(savedYear)) {
        // 如果保存的年份不存在，使用第一个存在的年份
        savedYear = years.length > 0 ? years[0] : new Date().getFullYear().toString();
        localStorage.setItem(YEAR_KEY, savedYear);
    }
    currentSelectedYear = savedYear;

    // 设置下拉框选中值
    const yearSelect = document.getElementById('yearSelect');
    if (yearSelect) {
        yearSelect.value = savedYear;
    }

    // 加载该年份的数据
    if (typeof loadData === 'function') {
        await loadData();
    }
}

// 加载年份列表
async function loadYearsList() {
    let data = await getYearsData();
    if (!data) {
        // 首次加载，创建默认年份
        const defaultYear = new Date().getFullYear().toString();
        data = { [defaultYear]: [] };
        await saveYearsData(data);
    }
    yearsData = data;

    // 渲染年份选择器选项
    const yearSelect = document.getElementById('yearSelect');
    if (yearSelect) {
        yearSelect.innerHTML = '';
        Object.keys(yearsData).sort().forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearSelect.appendChild(option);
        });
        // 设置当前选中的年份
        const currentYear = localStorage.getItem(YEAR_KEY);
        if (currentYear && yearsData[currentYear]) {
            yearSelect.value = currentYear;
        }
    }

    // 显示/隐藏年度对比区域
    const comparisonContainer = document.getElementById('comparisonChartContainer');
    if (comparisonContainer) {
        if (Object.keys(yearsData).length > 1) {
            comparisonContainer.style.display = 'block';
            updateYearCheckboxes();
            // 容器显示后，初始化图表并调整尺寸
            setTimeout(() => {
                if (typeof initComparisonChart === 'function') {
                    initComparisonChart();
                }
                if (comparisonChart) {
                    comparisonChart.resize();
                }
            }, 100);
        } else {
            comparisonContainer.style.display = 'none';
        }
    }
}

// 切换年份
function switchYear(year) {
    // 切换到新年份
    currentSelectedYear = year;
    localStorage.setItem(YEAR_KEY, year);

    // 更新下拉框选中值
    const yearSelect = document.getElementById('yearSelect');
    if (yearSelect) {
        yearSelect.value = year;
    }

    // 加载新年份数据（不加载默认数据，空年份保持为空）
    if (typeof loadData === 'function') {
        loadData(false);
    }
}

// 新增年份
async function addNewYear() {
    const newYear = prompt('请输入要新增的年份（如：2024）:');
    if (!newYear) return;

    // 验证年份格式
    if (!/^\d{4}$/.test(newYear)) {
        showToast('请输入有效的4位年份！', 'error');
        return;
    }

    // 从服务器读取最新数据
    const latestYearsData = await getYearsData() || {};

    // 检查年份是否已存在
    if (latestYearsData[newYear]) {
        showToast('该年份已存在！', 'error');
        return;
    }

    // 调用后端API创建年份（会创建文件夹和all-years.json添加对象）
    const result = await addYear(newYear);
    if (!result.success) {
        showToast('创建年份失败！', 'error');
        return;
    }

    // 更新全局变量
    latestYearsData[newYear] = [];
    yearsData = latestYearsData;

    // 刷新年份选择器
    await loadYearsList();

    // 切换到新年份
    switchYear(newYear);
}

// 删除当前年份
async function deleteCurrentYear() {
    try {
        // 从服务器读取最新数据
        const yearsDataLocal = await getYearsData();
        if (!yearsDataLocal) {
            showToast('没有数据可删除', 'error');
            return;
        }

        const currentYear = localStorage.getItem(YEAR_KEY);
        const yearsCount = Object.keys(yearsDataLocal).length;

        if (yearsCount <= 1) {
            showToast('至少需要保留一个年份，不能删除！', 'error');
            return;
        }

        if (!confirm(`确定要删除 ${currentYear} 年的所有数据吗？此操作不可恢复！`)) {
            return;
        }

        // 再次询问用户是否删除（会删除图片/数据）
        if (!confirm(`再次确认：删除 ${currentYear} 年将同时删除该年的图片和数据文件夹！`)) {
            return;
        }

        // 调用后端API删除年份（会删除photo/年份和data/年份文件夹，并从all-years.json删除）
        const result = await deleteYearApi(currentYear);
        if (!result.success) {
            showToast('删除年份失败！' + (result.error || ''), 'error');
            return;
        }

        // 先确定要切换到的新年份
        const remainingYears = Object.keys(yearsDataLocal).filter(y => y !== currentYear);
        const newYear = remainingYears.length > 0 ? remainingYears[0] : new Date().getFullYear().toString();

        // 切换当前选中的年份，避免 switchYear 中保存被删除年份的数据
        currentSelectedYear = newYear;
        localStorage.setItem(YEAR_KEY, newYear);

        // 更新全局变量
        delete yearsDataLocal[currentYear];
        window.yearsData = yearsDataLocal;

        // 重新加载年份列表
        await loadYearsList();
    } catch (e) {
        console.error('删除年份出错:', e);
        showToast('删除年份出错: ' + e.message, 'error');
    }

    // 加载新年份数据（loadDefault=false 会清空显示）
    if (typeof loadData === 'function') {
        loadData(false);
    }
}

// 更新年份复选框（用于对比）
function updateYearCheckboxes() {
    const container = document.getElementById('yearCheckboxGroup');
    if (!container) return;
    container.innerHTML = '';

    Object.keys(yearsData).sort().forEach(year => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = year;
        checkbox.checked = false; // 默认不选中
        checkbox.addEventListener('change', function() {
            if (typeof updateComparisonChart === 'function') {
                updateComparisonChart();
            }
        });

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(year + '年'));
        container.appendChild(label);
    });
}
