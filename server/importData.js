// 数据导入脚本 - 从股票数据.json导入到文件存储
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const SOURCE_FILE = path.join(__dirname, '..', '股票数据.json');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 读取源数据
const sourceData = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf-8'));

// 1. 导入年度汇总数据 (all-years.json)
// 转换格式: years_data[year][month-1] -> all-years[year][month]
// 保留完整的 my, myAmount, index 数据
const allYears = {};
for (const [year, months] of Object.entries(sourceData.years_data)) {
    allYears[year] = {};
    months.forEach((monthData, index) => {
        const month = index + 1;
        allYears[year][month] = {
            my: monthData.my || 0,
            myAmount: monthData.myAmount || 0,
            index: monthData.index || 0
        };
    });
}
fs.writeFileSync(
    path.join(DATA_DIR, 'all-years.json'),
    JSON.stringify(allYears, null, 2),
    'utf-8'
);
console.log('✓ 已导入年度汇总数据到 data/all-years.json');

// 2. 导入月度分析数据 (年份/monthly.json)
for (const [year, monthlyData] of Object.entries(sourceData.monthlyData)) {
    const yearDir = path.join(DATA_DIR, year);
    if (!fs.existsSync(yearDir)) {
        fs.mkdirSync(yearDir, { recursive: true });
    }

    // monthlyData[month] 是JSON字符串，需要解析
    const monthDataObj = {};
    for (const [month, dataStr] of Object.entries(monthlyData)) {
        try {
            monthDataObj[month] = JSON.parse(dataStr);
        } catch (e) {
            console.error(`解析失败: ${year}/${month}`, e.message);
            monthDataObj[month] = dataStr;
        }
    }

    fs.writeFileSync(
        path.join(yearDir, 'monthly.json'),
        JSON.stringify(monthDataObj, null, 2),
        'utf-8'
    );
    console.log(`✓ 已导入月度数据到 data/${year}/monthly.json`);
}

console.log('\n导入完成！');
console.log('数据目录结构:');
console.log('  data/');
console.log('  ├── all-years.json      (年度收益汇总)');
console.log('  ├── 2021/monthly.json');
console.log('  ├── 2022/monthly.json');
console.log('  ├── ...');
console.log('  └── 2026/monthly.json');
