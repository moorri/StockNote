// 数据存储管理器
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// 调试日志：追加写入日志文件
function appendDebugLog(year, data, source = 'unknown') {
    try {
        const yearDir = path.join(DATA_DIR, String(year));
        if (!fs.existsSync(yearDir)) {
            fs.mkdirSync(yearDir, { recursive: true });
        }
        const logFile = path.join(yearDir, 'debug.log');
        const timestamp = new Date().toISOString();
        const logContent = `[${timestamp}] [${source}] 写入 monthly.json\n旧数据: ${JSON.stringify(data.old || {}).substring(0, 300)}...\n新数据: ${JSON.stringify(data.new || {}).substring(0, 300)}...\n\n`;
        fs.appendFileSync(logFile, logContent, 'utf-8');
    } catch (e) {
        console.error('写入调试日志失败:', e.message);
    }
}

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 读取JSON文件
function readJsonFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error(`读取文件失败: ${filePath}`, e.message);
    }
    return {};
}

// 写入JSON文件
function writeJsonFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        return true;
    } catch (e) {
        console.error(`写入文件失败: ${filePath}`, e.message);
        return false;
    }
}

// 获取年度目录路径
function getYearDir(year) {
    const yearDir = path.join(DATA_DIR, String(year));
    if (!fs.existsSync(yearDir)) {
        fs.mkdirSync(yearDir, { recursive: true });
    }
    return yearDir;
}

// ===== 每日复盘数据 =====

// 读取指定年月的每日数据
function getDailyData(year, month) {
    const filePath = path.join(getYearDir(year), `daily-${String(month).padStart(2, '0')}.json`);
    return readJsonFile(filePath);
}

// 保存指定年月的每日数据
function saveDailyData(year, month, data) {
    const filePath = path.join(getYearDir(year), `daily-${String(month).padStart(2, '0')}.json`);
    return writeJsonFile(filePath, data);
}

// ===== 月度分析数据 =====

// 读取指定年份的月度数据
function getMonthlyData(year) {
    const filePath = path.join(getYearDir(year), 'monthly.json');
    return readJsonFile(filePath);
}

// 保存指定年份的月度数据
function saveMonthlyData(year, data, source = 'unknown') {
    // 调试日志：记录写入前后对比和调用来源
    // appendDebugLog(year, { old: existingData, new: data }, source);

    const filePath = path.join(getYearDir(year), 'monthly.json');
    return writeJsonFile(filePath, data);
}

// ===== 年度汇总数据 (给折线图用) =====

// 读取所有年份的汇总数据
function getYearsData() {
    const filePath = path.join(DATA_DIR, 'all-years.json');
    return readJsonFile(filePath);
}

// 保存所有年份的汇总数据
function saveYearsData(data) {
    const filePath = path.join(DATA_DIR, 'all-years.json');
    return writeJsonFile(filePath, data);
}

// 更新指定年份的月度收益
function updateYearMonthProfit(year, month, profit) {
    const allData = getYearsData();
    if (!allData[year]) {
        allData[year] = {};
    }
    allData[year][month] = profit;
    return saveYearsData(allData);
}

// 新建年份（创建文件夹 + 在all-years.json添加空对象）
function addYear(year) {
    const yearStr = String(year);
    const photoDir = path.join(__dirname, '..', 'photo', yearStr);
    const dataYearDir = path.join(DATA_DIR, yearStr);

    // 创建 photo/年份 文件夹
    if (!fs.existsSync(photoDir)) {
        fs.mkdirSync(photoDir, { recursive: true });
    }

    // 创建 data/年份 文件夹
    if (!fs.existsSync(dataYearDir)) {
        fs.mkdirSync(dataYearDir, { recursive: true });
    }

    // 在 all-years.json 添加每月默认数据
    const allData = getYearsData() || {};
    if (!allData[yearStr]) {
        // 创建12个月的默认数据（对象格式，key为月份字符串）
        allData[yearStr] = {};
        for (let i = 1; i <= 12; i++) {
            allData[yearStr][String(i)] = { my: 5, myAmount: 0, index: 1 };
        }
        saveYearsData(allData);
    }

    return { success: true };
}

// 删除年份（删除文件夹 + 从all-years.json删除）
function deleteYear(year) {
    const yearStr = String(year);
    const photoDir = path.join(__dirname, '..', 'photo', yearStr);
    const dataYearDir = path.join(DATA_DIR, yearStr);

    // 删除 photo/年份 文件夹
    if (fs.existsSync(photoDir)) {
        fs.rmSync(photoDir, { recursive: true, force: true });
    }

    // 删除 data/年份 文件夹
    if (fs.existsSync(dataYearDir)) {
        fs.rmSync(dataYearDir, { recursive: true, force: true });
    }

    // 从 all-years.json 删除
    const allData = getYearsData() || {};
    if (allData[yearStr]) {
        delete allData[yearStr];
        saveYearsData(allData);
    }

    return { success: true };
}

module.exports = {
    getDailyData,
    saveDailyData,
    getMonthlyData,
    saveMonthlyData,
    getYearsData,
    saveYearsData,
    updateYearMonthProfit,
    addYear,
    deleteYear
};
