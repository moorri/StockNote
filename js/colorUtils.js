// 颜色处理相关函数

/**
 * 根据数值正负更新颜色（正数红色，负数绿色）
 */
function updateValueColor(input) {
    const value = input.value.trim();
    // 百分比和总盈亏提取数值（处理格式）
    const num = parseFloat(value.replace(/[^\d.-]/g, ''));

    // 获取所在行
    const row = input.closest('tr');

    // 如果row不存在（比如在fillTable中tr还未添加到tbody），直接返回
    if (!row) return;

    // 移除旧的class
    row.classList.remove('profit-positive', 'profit-negative');

    if (!isNaN(num) && num !== 0) {
        // 添加新的class
        const className = num > 0 ? 'profit-positive' : 'profit-negative';
        row.classList.add(className);
    }
}

/**
 * 根据盈亏比高亮整行
 */
function highlightProfitRow(input) {
    const value = input.value.trim();
    const row = input.closest('tr');
    if (!row) {return}
    const items = row.children;
    var color = ''; // 使用默认颜色
    // 提取百分比数值
    const num = parseFloat(value.replace(/[^\d.-]/g, ''));

    if (!isNaN(num)) {
        // 这里假设盈亏比为负时标红整行，可根据需求调整条件
        if (num > 0) {
            color = 'red';
        } else if (num < 0) {
            color = 'green';
        }
    }
    // 移除旧的class，添加新的
    row.classList.remove('profit-positive', 'profit-negative');
    if (!isNaN(num) && num !== 0) {
        const className = num > 0 ? 'profit-positive' : 'profit-negative';
        row.classList.add(className);
    }
}
