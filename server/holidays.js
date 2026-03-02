const fs = require('fs');
const https = require('https');
const path = require('path');

// 按年份保存文件
function getHolidayFile(year) {
    return path.join(__dirname, `holidays_${year}.json`);
}

// 读取节假日数据
function getHolidays(year) {
    const file = getHolidayFile(year);
    try {
        if (fs.existsSync(file)) {
            const data = fs.readFileSync(file, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('读取节假日文件失败:', e);
    }
    return {};
}

// 保存节假日数据
function saveHolidays(year, data) {
    const file = getHolidayFile(year);
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error('保存节假日文件失败:', e);
    }
}

// 从API获取节假日数据
function fetchHolidaysFromAPI(year) {
    return new Promise((resolve, reject) => {
        const url = `https://api.jiejiariapi.com/v1/holidays/${year}`;

        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

// 从API获取周末数据
function fetchWeekendsFromAPI(year) {
    return new Promise((resolve, reject) => {
        const url = `https://api.jiejiariapi.com/v1/weekends/${year}`;

        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

// 获取指定年份的休市日期列表
// 休市日 = 节假日(isOffDay=true) + 周末
async function getOffDays(year) {
    const data = getHolidays(year);

    // 如果已有数据，直接返回
    if (data.offDays) {
        return data.offDays;
    }

    try {
        // 同时获取节假日和周末数据
        const [holidayData, weekendData] = await Promise.all([
            fetchHolidaysFromAPI(year),
            fetchWeekendsFromAPI(year)
        ]);

        const offDays = new Set();

        // 添加节假日 isOffDay=true 的日期
        for (const dateStr of Object.keys(holidayData)) {
            if (holidayData[dateStr].isOffDay === true) {
                offDays.add(dateStr);
            }
        }

        // 添加所有周末
        for (const dateStr of Object.keys(weekendData)) {
            offDays.add(dateStr);
        }

        const offDaysArray = Array.from(offDays).sort();

        // 保存到文件
        data.offDays = offDaysArray;
        saveHolidays(year, data);

        console.log(`已获取 ${year} 年休市日数据:`, offDaysArray.length, '天');
        return offDaysArray;
    } catch (e) {
        console.error('获取休市日失败:', e.message);
        return [];
    }
}

// 判断是否为休市日
function isOffDay(date, offDays) {
    const dateStr = date.toISOString().split('T')[0];
    return offDays.includes(dateStr);
}

// 获取指定月份的第一个开盘日和最后一个结盘日
async function getMonthDateRange(year, month) {
    const key = `${year}-${String(month).padStart(2, '0')}`; // 确保格式为 2026-01

    // 先确保整年数据已获取
    await getOffDays(year);

    const data = getHolidays(year);

    // 如果已有缓存数据，直接返回
    if (data[key]) {
        return data[key];
    }

    // 获取休市日列表
    const offDays = data.offDays;

    const tradingDates = [];
    const daysInMonth = new Date(year, month, 0).getDate();

    // 遍历当月所有日期，找出开盘日（不是休市日）
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        // 排除休市日
        if (!offDays.includes(dateStr)) {
            tradingDates.push(day);
        }
    }

    let result;
    if (tradingDates.length > 0) {
        result = {
            start: tradingDates[0],
            end: tradingDates[tradingDates.length - 1]
        };
    } else {
        // 如果没有找到可用日期，使用默认值
        result = { start: 5, end: 30 };
    }

    // 保存结果
    data[key] = result;
    saveHolidays(year, data);

    console.log(`${key} 月份可用日期范围:`, result);
    return result;
}

// 获取整年的所有月份开盘结盘日
async function getYearDateRange(year) {
    // 先确保整年数据已获取
    await getOffDays(year);

    const data = getHolidays(year);
    const result = {};

    // 遍历12个月
    for (let month = 1; month <= 12; month++) {
        const key = `${year}-${String(month).padStart(2, '0')}`;

        if (data[key]) {
            result[key] = data[key];
        } else {
            // 计算该月开盘结盘日
            const offDays = data.offDays;
            const tradingDates = [];
            const daysInMonth = new Date(year, month, 0).getDate();

            for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                if (!offDays.includes(dateStr)) {
                    tradingDates.push(day);
                }
            }

            if (tradingDates.length > 0) {
                result[key] = {
                    start: tradingDates[0],
                    end: tradingDates[tradingDates.length - 1]
                };
            } else {
                result[key] = { start: 5, end: 30 };
            }

            data[key] = result[key];
        }
    }

    // 保存整年数据
    saveHolidays(year, data);
    console.log(`${year} 年全年月份日期范围:`, result);
    return result;
}

module.exports = {
    getMonthDateRange,
    getYearDateRange,
    fetchHolidaysFromAPI,
    fetchWeekendsFromAPI,
    getOffDays
};
