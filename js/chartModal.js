// 弹窗相关函数

// 全局存储当前放大的分时图URL
let currentChartImgUrl = '';

/**
 * 打开本页弹窗，展示放大的分时图
 * @param {string} imgUrl - 分时图图片地址
 */
function openChartModal(imgUrl) {
    if (!imgUrl) return; // 无图片地址时不执行
    currentChartImgUrl = imgUrl; // 存储当前图片URL
    const modal = document.getElementById('chartModal');
    const modalImg = document.getElementById('modalChartImg');
    modalImg.src = imgUrl; // 填充弹窗图片地址
    modal.style.display = 'flex'; // 显示弹窗
}

/**
 * 关闭本页分时图弹窗
 */
function closeChartModal() {
    const modal = document.getElementById('chartModal');
    const modalImg = document.getElementById('modalChartImg');
    if (modal) modal.style.display = 'none'; // 隐藏弹窗
    if (modalImg) modalImg.src = ''; // 清空图片地址，避免缓存
    currentChartImgUrl = ''; // 清空全局存储
}

// 点击遮罩层关闭弹窗
window.addEventListener('DOMContentLoaded', function() {
    // 分时图弹窗
    const chartModal = document.getElementById('chartModal');
    if (chartModal) {
        chartModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeChartModal();
            }
        });
    }

    // 数据录入弹窗
    const dataModal = document.getElementById('dataModal');
    if (dataModal) {
        dataModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    }
});
