// 同花顺笔记服务 - 获取股票平仓记录
const https = require('https');
const fs = require('fs');
const path = require('path');

// API 地址
const API_HOST = 'tzzb.10jqka.com.cn';
const API_PATH = '/caishen_httpserver/tzzb/caishen_fund/pc/asset/v1/cleared_position';

// 文件路径
const COOKIE_FILE = path.join(__dirname, '..', 'data', 'cookie.js');

/**
 * 保存同花顺认证信息到本地
 */
function saveTHSInfo(cookie, userId, fundKey) {
    try {
        const content = `module.exports = {
    cookie: ${JSON.stringify(cookie)},
    userId: ${JSON.stringify(userId)},
    fundKey: ${JSON.stringify(fundKey)}
};`;
        fs.writeFileSync(COOKIE_FILE, content, 'utf8');
        return true;
    } catch (e) {
        console.error('保存同花顺信息失败:', e);
        return false;
    }
}

/**
 * 从本地读取同花顺认证信息
 */
function getTHSInfo() {
    try {
        if (fs.existsSync(COOKIE_FILE)) {
            return require(COOKIE_FILE);
        }
    } catch (e) {
        console.error('读取同花顺信息失败:', e);
    }
    return { cookie: null, userId: null, fundKey: null };
}

// 兼容旧接口
function saveCookie(cookie) {
    const info = getTHSInfo();
    return saveTHSInfo(cookie, info.userId, info.fundKey);
}

function getSavedCookie() {
    const info = getTHSInfo();
    return info.cookie;
}

function saveUserId(userId) {
    const info = getTHSInfo();
    return saveTHSInfo(info.cookie, userId, info.fundKey);
}

function getSavedUserId() {
    const info = getTHSInfo();
    return info.userId;
}

/**
 * 请求 API
 */
function requestAPI(postData) {
    return new Promise((resolve, reject) => {
        const dataString = postData.toString();

        const options = {
            hostname: API_HOST,
            port: 443,
            path: API_PATH,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(dataString),
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0',
                'Origin': 'https://tzzb.10jqka.com.cn',
                'Referer': 'https://tzzb.10jqka.com.cn/pc/index.html'
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

/**
 * 获取平仓记录
 * @param {string} cookie - Cookie
 * @param {string} userId - 用户ID
 * @param {string} fundKey - 基金账户key
 * @param {number} year - 年份
 * @param {number} month - 月份
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
async function getClearedPositions(cookie, userId, fundKey, year, month) {
    if (!cookie) {
        return { success: false, error: 'cookie_missing', message: '请先填写Cookie' };
    }
    if (!userId) {
        return { success: false, error: 'userid_missing', message: '请先填写用户ID' };
    }
    if (!fundKey) {
        return { success: false, error: 'fundkey_missing', message: '请先填写FundKey' };
    }

    // 计算月初和月末
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const postData = new URLSearchParams({
        terminal: '1',
        version: '0.0.0',
        userid: userId,
        user_id: userId,
        fund_key: fundKey,
        group_by: 'stock',
        open_date: startDate,
        close_date: endDate
    });

    try {
        const options = {
            hostname: API_HOST,
            port: 443,
            path: API_PATH,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData.toString()),
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0',
                'Origin': 'https://tzzb.10jqka.com.cn',
                'Referer': 'https://tzzb.10jqka.com.cn/pc/index.html',
                'Cookie': cookie
            }
        };

        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        if (json.error_code === '0') {
                            // 转换数据格式
                            const list = json.ex_data?.list || [];
                            const convertedData = list.map(item => ({
                                stock_name: item.stock_name,
                                stock_code: item.stock_code,
                                total_profit: item.total_profit,
                                total_profit_rate: item.total_profit_rate,
                                hold_days: item.hold_days,
                                open_date: item.open_date,
                                close_date: item.close_date,
                                fee: item.fee,
                                market: item.market
                            }));
                            resolve({ success: true, data: convertedData });
                        } else if (json.error_msg && json.error_msg.includes('登录')) {
                            resolve({ success: false, error: 'cookie_expired', message: 'Cookie已过期，请重新填写' });
                        } else {
                            resolve({ success: false, error: 'api_error', message: json.error_msg || '获取数据失败' });
                        }
                    } catch (e) {
                        reject(e);
                    }
                });
            });

            req.on('error', reject);
            req.write(postData.toString());
            req.end();
        });
    } catch (e) {
        return { success: false, error: 'network_error', message: '网络请求失败: ' + e.message };
    }
}

/**
 * 获取每日/月累计盈亏数据
 * @param {string} cookie - Cookie
 * @param {string} userId - 用户ID
 * @param {number} year - 年份
 * @param {number} month - 月份
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
async function getDailyProfit(cookie, userId, year, month) {
    if (!cookie) {
        return { success: false, error: 'cookie_missing', message: '请先填写Cookie' };
    }
    if (!userId) {
        return { success: false, error: 'userid_missing', message: '请先填写用户ID' };
    }

    // 计算月初和月末
    const startDate = `${year}${String(month).padStart(2, '0')}01`;
    const endDate = new Date(year, month, 0);
    const endDateStr = `${year}${String(month).padStart(2, '0')}${String(endDate.getDate()).padStart(2, '0')}`;

    // GET 请求参数放在 URL query string 中
    const queryParams = new URLSearchParams({
        startdate: startDate,
        start_date: startDate,
        enddate: endDateStr,
        end_date: endDateStr,
        userid: userId,
        terminal: '0',
        version: '0.0.0',
        fund_key: '54602109',
        fundkey: '54602109',
        rzrq_fund_key: '',
        manual_id: '',
        fund_id: '',
        cust_id: '',
        from_pc: '1',
        sz_cal: '1',
        jy_cal: '1',
        id: '7'
    });

    try {
        const options = {
            hostname: API_HOST,
            port: 443,
            path: `/caishen_httpserver/tzzb/caishen_fund/calendar/v1/day_calendar?${queryParams.toString()}`,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0',
                'Referer': 'https://tzzb.10jqka.com.cn/tzzbWeb/summary/reportPage.html?type=common&accountId=54602109&op=by',
                'Cookie': cookie
            }
        };

        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    console.log('[getDailyProfit] 返回数据:', data.substring(0, 500));
                    try {
                        // 检查是否返回 HTML（错误页面）
                        if (data.includes('<!') || data.includes('<html')) {
                            resolve({ success: false, error: 'cookie_expired', message: 'Cookie可能已过期' });
                            return;
                        }
                        const json = JSON.parse(data);
                        // 返回 ex_data 里面的数据，包含 profit_loss_list 和 profit_map
                        if (json.error_code === '0' && json.ex_data) {
                            resolve({ success: true, data: json.ex_data });
                        } else {
                            resolve({ success: false, error: json.error_msg || '获取数据失败' });
                        }
                    } catch (e) {
                        console.error('[getDailyProfit] 解析失败:', e.message);
                        resolve({ success: false, error: 'parse_error', message: '解析返回数据失败' });
                    }
                });
            });

            req.on('error', reject);
            req.end();
        });
    } catch (e) {
        return { success: false, error: 'network_error', message: '网络请求失败: ' + e.message };
    }
}

module.exports = {
    getClearedPositions,
    getDailyProfit,
    getSavedCookie,
    saveCookie,
    getSavedUserId,
    saveUserId,
    saveTHSInfo,
    getTHSInfo
};
