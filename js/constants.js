// 公共常量定义
const YEAR_KEY = "stock_year";
const HIDE_AMOUNT_KEY = "stock_hide_amount"; // 隐藏金额状态

// 月份名称
const months = [
    "一月", "二月", "三月", "四月", "五月", "六月",
    "七月", "八月", "九月", "十月", "十一月", "十二月"
];

// 简短月份名称（用于图表）
const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

/**
 * 显示自动关闭的提示信息（3秒后自动消失）
 * @param {string} message - 提示内容
 * @param {string} type - 类型: 'success'(默认), 'error', 'info'
 */
window.showToast = function showToast(message, type = 'success') {
    // 移除已存在的toast
    const existingToast = document.getElementById('auto-toast');
    if (existingToast) {
        existingToast.remove();
    }

    // 创建toast元素
    const toast = document.createElement('div');
    toast.id = 'auto-toast';
    toast.textContent = message;

    // 设置样式
    const colors = {
        success: '#4caf50',
        error: '#f44336',
        info: '#2196f3'
    };
    const bgColor = colors[type] || colors.success;

    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: ${bgColor};
        color: white;
        padding: 12px 24px;
        border-radius: 4px;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        transition: opacity 0.3s ease;
    `;

    document.body.appendChild(toast);

    // 3秒后自动消失
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 3000);
}
