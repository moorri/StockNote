// 本地代理服务 - 解决跨域问题
const http = require('http');
const https = require('https');
const { getMonthDateRange, getOffDays } = require('./holidays');
const { getClearedPositions, getDailyProfit, getSavedCookie, saveCookie, getSavedUserId, saveUserId, saveTHSInfo } = require('./tongHuaShunNote');
const { getDailyData, saveDailyData, getMonthlyData, saveMonthlyData, getYearsData, saveYearsData, addYear, deleteYear } = require('./dataManager');

const PORT = process.argv[2] || 9999;

// API地址列表
const API_URLS = [
    'https://apphis.longhuvip.com/w1/api/index.php',
    'https://apphwshhq.longhuvip.com/w1/api/index.php'
];

// 获取日期范围接口
async function handleDateRange(req, res) {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const year = url.searchParams.get('year');
    const month = url.searchParams.get('month');

    if (!year || !month) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '缺少year或month参数' }));
        return;
    }

    const range = await getMonthDateRange(parseInt(year), parseInt(month));

    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(range));
}

// 处理获取休市日列表
async function handleGetOffDays(req, res) {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const year = url.searchParams.get('year');

    if (!year) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '缺少year参数' }));
        return;
    }

    const offDays = await getOffDays(parseInt(year));

    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(offDays));
}

// 处理获取每日数据
function handleGetDaily(req, res) {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const year = url.searchParams.get('year');
    const month = url.searchParams.get('month');

    if (!year || !month) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '缺少year或month参数' }));
        return;
    }

    const data = getDailyData(parseInt(year), parseInt(month));

    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(data));
}

// 处理保存每日数据
function handleSaveDaily(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try {
            const params = new URLSearchParams(body);
            const year = parseInt(params.get('year'));
            const month = parseInt(params.get('month'));
            const data = params.get('data');

            if (!year || !month || !data) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: '缺少必要参数' }));
                return;
            }

            const jsonData = JSON.parse(data);
            const success = saveDailyData(year, month, jsonData);

            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({ success }));
        } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
        }
    });
}

// 处理获取月度数据
function handleGetMonthly(req, res) {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const year = url.searchParams.get('year');

    if (!year) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '缺少year参数' }));
        return;
    }

    const data = getMonthlyData(parseInt(year));

    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(data));
}

// 处理保存月度数据
function handleSaveMonthly(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try {
            const params = new URLSearchParams(body);
            const year = parseInt(params.get('year'));
            const data = params.get('data');
            const source = params.get('source') || 'unknown';

            if (!year || !data) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: '缺少必要参数' }));
                return;
            }

            const jsonData = JSON.parse(data);
            const success = saveMonthlyData(year, jsonData, source);

            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({ success }));
        } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
        }
    });
}

// 处理获取年度汇总数据(折线图用)
function handleGetYearsData(req, res) {
    const data = getYearsData();

    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(data));
}

// 处理保存年度汇总数据
function handleSaveYearsData(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try {
            const params = new URLSearchParams(body);
            const data = params.get('data');

            if (!data) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: '缺少data参数' }));
                return;
            }

            const jsonData = JSON.parse(data);
            const success = saveYearsData(jsonData);

            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({ success }));
        } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
        }
    });
}

function requestAPI(apiUrl, postData) {
    return new Promise((resolve, reject) => {
        const url = new URL(apiUrl);
        const dataString = postData.toString();

        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Content-Length': Buffer.byteLength(dataString),
                'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 9; V1916A Build/PQ3B.190801.002)'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(dataString);
        req.end();
    });
}

async function handleRequest(req, res) {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    // 处理 OPTIONS 预检请求
    if (req.method === 'OPTIONS') {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }

    // 处理日期范围GET请求
    if (req.method === 'GET' && url.pathname === '/dateRange') {
        handleDateRange(req, res);
        return;
    }

    // 处理获取休市日列表
    if (req.method === 'GET' && url.pathname === '/holidays/offDays') {
        handleGetOffDays(req, res);
        return;
    }

    // 处理获取每日数据
    if (req.method === 'GET' && url.pathname === '/daily/get') {
        handleGetDaily(req, res);
        return;
    }

    // 处理保存每日数据
    if (req.method === 'POST' && url.pathname === '/daily/save') {
        handleSaveDaily(req, res);
        return;
    }

    // 处理获取月度数据
    if (req.method === 'GET' && url.pathname === '/monthly/get') {
        handleGetMonthly(req, res);
        return;
    }

    // 处理保存月度数据
    if (req.method === 'POST' && url.pathname === '/monthly/save') {
        handleSaveMonthly(req, res);
        return;
    }

    // 处理获取年度汇总数据
    if (req.method === 'GET' && url.pathname === '/yearsData/get') {
        handleGetYearsData(req, res);
        return;
    }

    // 处理保存年度汇总数据
    if (req.method === 'POST' && url.pathname === '/yearsData/save') {
        handleSaveYearsData(req, res);
        return;
    }

    // 处理新建年份
    if (req.method === 'POST' && url.pathname === '/yearsData/add') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { year } = JSON.parse(body);
                const result = addYear(year);
                res.writeHead(200, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(JSON.stringify(result));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: e.message }));
            }
        });
        return;
    }

    // 处理删除年份
    if (req.method === 'POST' && url.pathname === '/yearsData/delete') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { year } = JSON.parse(body);
                const result = deleteYear(year);
                res.writeHead(200, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(JSON.stringify(result));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: e.message }));
            }
        });
        return;
    }

    // 处理同花顺获取平仓记录请求
    if (req.method === 'GET' && url.pathname === '/ths/clearedPositions') {
        const year = url.searchParams.get('year');
        const month = url.searchParams.get('month');

        if (!year || !month) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: '缺少year或month参数' }));
            return;
        }

        const cookie = getSavedCookie();
        const userId = getSavedUserId();

        const result = await getClearedPositions(cookie, userId, parseInt(year), parseInt(month));

        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify(result));
        return;
    }

    // 处理同花顺获取每日/月累计盈亏数据
    if (req.method === 'GET' && url.pathname === '/ths/dailyProfit') {
        const year = url.searchParams.get('year');
        const month = url.searchParams.get('month');

        if (!year || !month) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: '缺少year或month参数' }));
            return;
        }

        const cookie = getSavedCookie();
        const userId = getSavedUserId();

        console.log('[dailyProfit] Cookie:', cookie ? cookie.substring(0, 50) + '...' : 'null');
        console.log('[dailyProfit] UserId:', userId);

        const result = await getDailyProfit(cookie, userId, parseInt(year), parseInt(month));

        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify(result));
        return;
    }

    // 处理保存同花顺Cookie请求
    if (req.method === 'POST' && url.pathname === '/ths/saveCookie') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const params = new URLSearchParams(body);
                const userId = params.get('userId');
                const cookie = params.get('cookie');

                // 合并保存
                if (cookie || userId) {
                    saveTHSInfo(cookie, userId);
                }

                res.writeHead(200, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(JSON.stringify({ success: true }));
            } catch (e) {
                res.writeHead(400, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(JSON.stringify({ success: false, error: e.message }));
            }
        });
        return;
    }

    // 处理获取同花顺配置请求
    if (req.method === 'GET' && url.pathname === '/ths/config') {
        const cookie = getSavedCookie();
        const userId = getSavedUserId();

        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({
            hasCookie: !!cookie,
            hasUserId: !!userId
        }));
        return;
    }

    // 处理关闭服务器请求
    if (req.method === 'GET' && url.pathname === '/shutdown') {
        handleShutdown(req, res);
        return;
    }

    if (req.method !== 'POST') {
        res.writeHead(405);
        res.end('Method not allowed');
        return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        });

        // 尝试所有API地址
        for (const apiUrl of API_URLS) {
            try {
                const data = await requestAPI(apiUrl, body);
                // 如果有数据直接返回
                if (data.List && data.List.length > 0) {
                    res.end(JSON.stringify(data));
                    return;
                }
                // 如果第一个地址返回空，记录一下
                console.log(`${apiUrl} 返回空数据`);
            } catch (e) {
                console.error(`${apiUrl} 请求失败:`, e.message);
            }
        }

        // 所有地址都失败，返回错误
        res.end(JSON.stringify({ errcode: '-1', errmsg: '所有API地址请求失败' }));
    });
}

// 保存 server 实例
const server = http.createServer(handleRequest).listen(PORT, () => {
    console.log(`代理服务启动: http://localhost:${PORT}`);
    console.log(`页面中调用: http://localhost:${PORT}/api`);
});

// 处理关闭服务器请求
function handleShutdown(req, res) {
    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ success: true }));

    console.log('收到关闭服务器请求');

    // 强制退出（确保能关闭）
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });

    // 3秒后强制退出
    setTimeout(() => {
        console.log('强制退出进程');
        process.exit(0);
    }, 3000);
}
