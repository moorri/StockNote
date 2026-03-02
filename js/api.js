// API基础地址
const API_BASE = 'http://localhost:3001';

// API调用公共函数

// 获取年份汇总数据
async function getYearsData() {
    try {
        const response = await fetch(`${API_BASE}/yearsData/get`);
        return await response.json();
    } catch (error) {
        console.error('获取年份汇总数据失败:', error);
        return {};
    }
}

// 保存年份汇总数据
async function saveYearsData(data) {
    try {
        const formData = new URLSearchParams({ data: JSON.stringify(data) });
        const response = await fetch(`${API_BASE}/yearsData/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });
        return await response.json();
    } catch (error) {
        console.error('保存年份汇总数据失败:', error);
        return { success: false, error: error.message };
    }
}

// 获取每日数据
async function getDailyData(year, month) {
    try {
        const response = await fetch(`${API_BASE}/daily/get?year=${year}&month=${month}`);
        return await response.json();
    } catch (error) {
        console.error('获取每日数据失败:', error);
        return {};
    }
}

// 保存每日数据
async function saveDailyData(year, month, data) {
    try {
        const formData = new URLSearchParams({ year, month, data: JSON.stringify(data) });
        const response = await fetch(`${API_BASE}/daily/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });
        return await response.json();
    } catch (error) {
        console.error('保存每日数据失败:', error);
        return { success: false, error: error.message };
    }
}

// 获取月度详细数据
async function getMonthlyData(year) {
    try {
        const response = await fetch(`${API_BASE}/monthly/get?year=${year}`);
        return await response.json();
    } catch (error) {
        console.error('获取月度数据失败:', error);
        return {};
    }
}

// 保存月度详细数据
async function saveMonthlyData(year, data, source = 'unknown') {
    try {
        const formData = new URLSearchParams({ year, data: JSON.stringify(data), source });
        const response = await fetch(`${API_BASE}/monthly/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });
        return await response.json();
    } catch (error) {
        console.error('保存月度数据失败:', error);
        return { success: false, error: error.message };
    }
}

// 获取休市日列表
async function getOffDays(year) {
    try {
        const response = await fetch(`${API_BASE}/holidays/offDays?year=${year}`);
        return await response.json();
    } catch (error) {
        console.error('获取休市日失败:', error);
        return [];
    }
}

// 关闭服务器
async function shutdownServer() {
    try {
        await fetch(`${API_BASE}/shutdown`);
    } catch (error) {
        console.error('关闭服务器失败:', error);
    }
    // 提示用户关闭浏览器
    showToast('服务器已关闭，请手动关闭浏览器窗口');
}

// 新建年份
async function addYear(year) {
    const response = await fetch(`${API_BASE}/yearsData/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year })
    });
    return await response.json();
}

// 删除年份
async function deleteYearApi(year) {
    const response = await fetch(`${API_BASE}/yearsData/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year })
    });
    return await response.json();
}

// 暴露到全局
window.getYearsData = getYearsData;
window.saveYearsData = saveYearsData;
window.getDailyData = getDailyData;
window.saveDailyData = saveDailyData;
window.getMonthlyData = getMonthlyData;
window.saveMonthlyData = saveMonthlyData;
window.getOffDays = getOffDays;
window.shutdownServer = shutdownServer;
window.addYear = addYear;
window.deleteYearApi = deleteYearApi;
