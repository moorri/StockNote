// 每日复盘 Vue 应用逻辑

const { createApp, ref, computed, watch } = Vue;

// 从URL参数获取日期
function getDateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const dateStr = params.get('date');
    if (dateStr) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            return new Date(parts[0], parts[1] - 1, parts[2]);
        }
    }
    return new Date();
}

createApp({
    setup() {
        // 当前日期（优先从URL参数获取）
        const currentDate = ref(getDateFromUrl());

        // 日期key (如: 2025-02-26)
        const dateKey = computed(() => {
            const y = currentDate.value.getFullYear();
            const m = String(currentDate.value.getMonth() + 1).padStart(2, '0');
            const d = String(currentDate.value.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        });

        // 日期显示 (如: 2025年2月26日 周三)
        const dateDisplay = computed(() => {
            const y = currentDate.value.getFullYear();
            const m = currentDate.value.getMonth() + 1;
            const d = currentDate.value.getDate();
            const weeks = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            return `${y}年${m}月${d}日 ${weeks[currentDate.value.getDay()]}`;
        });

        // 空表单模板
        const emptyForm = () => ({
            dailyAmount: '',
            dailyProfit: '',
            dailyIndex: '',
            position: '',
            shIndex: '',
            ztDt: '',
            maxBoard: '',
            emotionCycle: '',
            volume: '',
            keyEvent: '',
            sectors: [],
            highBoards: [],
            watchStocks: [],
            operations: [],
            关注方向: '',
            重点标的: '',
            风险提示: '',
            交易计划: '',
            随笔: ''
        });

        // 数组项模板（带编辑状态）
        const createWatchStock = () => ({ 股票名称: '', 板块: '', 形态: '', 量价特征: '', 备注: '', _editing: true });
        const createHighBoard = () => ({ 股票名称: '', 板块: '', 板数: '', 类型: '核心', 备注: '', _editing: true });
        const createOperation = () => ({ 标的: '', 买卖: '买', 仓位: '', 买入理由: '', 卖点记录: '', 结果: '', _editing: true });

        // 切换编辑状态
        const toggleEdit = (item, event) => {
            if (event) {
                event.stopPropagation();
                event.preventDefault();
            }
            // 如果已经在编辑状态，不做任何事（让 input 获得焦点）
            if (item._editing) {
                return;
            }
            item._editing = true;
        };

        // 失去焦点时退出编辑模式（延迟执行，让点击其他地方先触发）
        const onBlur = (item) => {
            setTimeout(() => {
                item._editing = false;
            }, 200);
        };

        // 表单数据
        const form = ref(emptyForm());

        // 监听本日收益和上证涨幅，自动添加%
        watch(() => form.value.dailyProfit, (newVal) => {
            if (newVal && !newVal.includes('%')) {
                form.value.dailyProfit = newVal + '%';
            }
        });

        watch(() => form.value.dailyIndex, (newVal) => {
            if (newVal && !newVal.includes('%')) {
                form.value.dailyIndex = newVal + '%';
            }
        });

        // 仓位编辑状态
        const positionEditing = ref(false);

        // 切换仓位编辑状态
        const togglePositionEdit = (event) => {
            if (event) {
                event.stopPropagation();
            }
            positionEditing.value = true;
            // 自动获焦
            setTimeout(() => {
                const input = document.querySelector('.position-input');
                if (input) input.focus();
            }, 50);
        };

        // 仓位失去焦点
        const onPositionBlur = () => {
            // 自动加 %
            if (form.value.position && !form.value.position.includes('%')) {
                form.value.position = form.value.position + '%';
            }
            positionEditing.value = false;
        };

        // 获取仓位样式类
        const getPositionClass = (val) => {
            if (!val) return '';
            const num = parseFloat(val.replace('%', ''));
            if (num > 70) return 'danger';
            if (num >= 40) return 'normal';
            return 'light';
        };

        // 行情概述编辑状态
        const marketEditing = ref(false);

        // 切换行情编辑状态
        const toggleMarketEdit = (event) => {
            if (event) {
                event.stopPropagation();
            }
            marketEditing.value = true;
            // 自动获焦
            setTimeout(() => {
                const target = event?.target;
                if (target && target.tagName === 'INPUT') {
                    target.focus();
                } else if (target && target.tagName === 'SELECT') {
                    target.focus();
                }
            }, 50);
        };

        // 行情概述失去焦点
        const onMarketBlur = () => {
            setTimeout(() => {
                marketEditing.value = false;
            }, 200);
        };

        // 获取上证指数颜色
        const getShIndexClass = (val) => {
            if (!val) return '';
            const num = parseFloat(val.replace('%', ''));
            if (num > 0) return 'red';
            if (num < 0) return 'green';
            return '';
        };

        // 获取涨跌停颜色
        const getZtDtClass = (val) => {
            if (!val) return '';
            const parts = val.split('/');
            if (parts.length >= 2) {
                const up = parseInt(parts[0]) || 0;
                const down = parseInt(parts[1]) || 0;
                if (up > down) return 'red';
                if (down > up) return 'green';
            }
            return '';
        };

        // 获取涨跌停显示文本（格式：80(红)/5(绿)，即涨停数红色/跌停数绿色）
        const getZtDtDisplay = (val) => {
            if (!val) return '<span class="placeholder">点击编辑</span>';
            const parts = val.split('/');
            if (parts.length >= 2) {
                const up = parseInt(parts[0]) || 0;
                const down = parseInt(parts[1]) || 0;
                return `<span class="zt-red">${up}</span>/<span class="zt-green">${down}</span>`;
            }
            return val;
        };

        // 获取情绪周期颜色
        const getEmotionClass = (val) => {
            const colorMap = {
                '上升期': 'red',
                '反弹': 'red',
                '分歧': 'orange',
                '退潮': 'green',
                '冰点': 'blue'
            };
            return colorMap[val] || '';
        };

        // 监听涨幅，自动添加 %
        watch(() => form.value.sectors, (newVal) => {
            if (Array.isArray(newVal)) {
                newVal.forEach(s => {
                    if (s.涨幅 && !s.涨幅.includes('%')) {
                        s.涨幅 = s.涨幅 + '%';
                    }
                });
            }
        }, { deep: true });

        // 获取下一个开盘日
        const getNextTradingDay = async (current, delta) => {
            const year = current.getFullYear();
            const offDays = await getOffDays(year);
            const offDaysSet = new Set(offDays.map(d => d.replace(/-/g, '')));

            const newDate = new Date(current);
            newDate.setDate(newDate.getDate() + delta);

            // 循环查找开盘日（跳过周末和休市日）
            while (true) {
                // 使用本地时间获取日期字符串（不用 toISOString，会受时区影响）
                const y = newDate.getFullYear();
                const m = String(newDate.getMonth() + 1).padStart(2, '0');
                const d = String(newDate.getDate()).padStart(2, '0');
                const dateStr = `${y}${m}${d}`;
                const dayOfWeek = newDate.getDay();

                // 如果是周末或休市日，继续向前/后找
                if (dayOfWeek === 0 || dayOfWeek === 6 || offDaysSet.has(dateStr)) {
                    newDate.setDate(newDate.getDate() + delta);
                } else {
                    break;
                }
            }
            return newDate;
        };

        // 切换日期（自动保存当前数据）
        const changeDate = async (delta) => {
            // 先保存当前数据
            await saveData();
            // 切换到下一个开盘日
            const newDate = await getNextTradingDay(currentDate.value, delta);
            currentDate.value = newDate;
            // 等待 Vue 更新 dateKey 后再加载数据
            await Vue.nextTick();
            await loadData();
        };

        // 加载数据
        const loadData = async () => {
            const year = currentDate.value.getFullYear();
            const month = currentDate.value.getMonth() + 1;
            const all = await getDailyData(year, month);
            const data = all[dateKey.value];
            if (data) {
                // 合并数据，确保数组字段是有效数组（防空对象覆盖空数组）
                // 给每个数组项添加 _editing = false，确保显示为纯文本
                const fixEditing = (arr) => {
                    if (Array.isArray(arr)) {
                        arr.forEach(item => { item._editing = false; });
                    }
                    return arr;
                };
                form.value = {
                    ...emptyForm(),
                    ...data,
                    sectors: Array.isArray(data.sectors) ? fixEditing(data.sectors) : [],
                    highBoards: Array.isArray(data.highBoards) ? fixEditing(data.highBoards) : [],
                    watchStocks: Array.isArray(data.watchStocks) ? fixEditing(data.watchStocks) : [],
                    operations: Array.isArray(data.operations) ? fixEditing(data.operations) : []
                };
            } else {
                form.value = emptyForm();
            }
            // 数据加载完成后更新金额显示状态（等待Vue DOM更新后执行）
            await Vue.nextTick();
            updateAmountDisplay();
        };

        // 保存数据（静默保存，不弹窗）
        const saveData = async () => {
            const year = currentDate.value.getFullYear();
            const month = currentDate.value.getMonth() + 1;
            const all = await getDailyData(year, month);
            all[dateKey.value] = { ...form.value };
            await saveDailyData(year, month, all);
        };

        // 初始化加载数据
        loadData();

        // 设置返回按钮链接（返回前自动保存）
        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            const y = currentDate.value.getFullYear();
            const m = currentDate.value.getMonth() + 1;
            backBtn.onclick = async function() {
                await saveData();
                location.href = `monthly-analysis.html?year=${y}&month=${m}`;
            };
        }

        // 暴露方法给外部调用
        window.appExpose = {
            saveData,
            currentDate,
            dateKey,
            form
        };

        // 首页按钮（返回前自动保存）
        window.goToIndex = async function() {
            await saveData();
            location.href = 'index.html';
        };

        // 退出（保存数据后关闭服务器）
        window.exitWithSave = async function() {
            await saveData();
            shutdownServer();
        };

        // 复制到下一个开盘日
        const copyToNextDay = async (item, arrayName) => {
            // 1. 获取下一个开盘日
            const nextDate = await getNextTradingDay(currentDate.value, 1);
            const year = nextDate.getFullYear();
            const month = nextDate.getMonth() + 1;
            const nextDateKey = `${year}-${String(month).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`;

            // 2. 读取下一日数据
            const all = await getDailyData(year, month);
            if (!all[nextDateKey]) {
                // 如果下一天没有数据，初始化空结构
                all[nextDateKey] = {
                    date: nextDateKey,
                    watchStocks: [],
                    highBoards: [],
                    operations: [],
                    sectors: []
                };
            }

            // 3. 复制数据（去除 _editing 属性）
            const newItem = { ...item };
            delete newItem._editing;
            all[nextDateKey][arrayName].push(newItem);

            // 4. 保存数据
            await saveDailyData(year, month, all);

            // 5. 提示用户
            showToast(`已复制到 ${nextDate.getMonth()+1}月${nextDate.getDate()}日`);
        };

        return {
            currentDate,
            dateKey,
            dateDisplay,
            form,
            changeDate,
            saveData,
            toggleEdit,
            onBlur,
            createWatchStock,
            createHighBoard,
            createOperation,
            positionEditing,
            togglePositionEdit,
            onPositionBlur,
            getPositionClass,
            marketEditing,
            toggleMarketEdit,
            onMarketBlur,
            getShIndexClass,
            getZtDtClass,
            getZtDtDisplay,
            getEmotionClass,
            copyToNextDay
        };
    }
}).mount('#app');

// Vue 渲染完成后恢复金额显示状态
Vue.nextTick(() => updateAmountDisplay());

// 点击表格外部关闭编辑状态
document.addEventListener('click', function(e) {
    if (!window.appExpose) return;
    const app = window.appExpose;
    const form = app.form;
    if (!form || !form.value) return;

    // 如果点击的是表格内的任何元素，不关闭编辑状态
    if (e.target.closest('.daily-table')) {
        return;
    }

    // 如果点击的是今日行情概述区域，不关闭编辑状态
    if (e.target.closest('.daily-section')) {
        return;
    }

    // 关闭行情编辑状态
    if (app.marketEditing && app.marketEditing.value) {
        app.marketEditing.value = false;
    }

    // 点击表格外部，关闭所有编辑状态
    const arrays = [form.value.watchStocks, form.value.highBoards, form.value.operations];
    arrays.forEach(arr => {
        if (Array.isArray(arr)) {
            arr.forEach(item => {
                if (item._editing) item._editing = false;
            });
        }
    });
});

// input/select 获得焦点时，不关闭编辑状态
document.addEventListener('focusin', function(e) {
    if (!window.appExpose) return;
    const form = window.appExpose.form;
    if (!form || !form.value) return;

    // 如果焦点在表格内，不做任何事
    if (e.target.closest('.daily-table')) {
        return;
    }
});

// 保存数据的同步版本（用于页面关闭时）
function saveDataSync() {
    if (!window.appExpose) return;

    const app = window.appExpose;
    const currentDate = app.currentDate;
    const form = app.form;
    if (!currentDate || !form) return;

    const year = currentDate.value.getFullYear();
    const month = currentDate.value.getMonth() + 1;
    const dateKey = app.dateKey?.value;

    // 同步获取本地数据并保存
    fetch(`${API_BASE}/daily/get?year=${year}&month=${month}`)
        .then(r => r.json())
        .then(all => {
            all[dateKey] = { ...form.value };
            const formData = new URLSearchParams({year, month, data: JSON.stringify(all)});
            fetch(`${API_BASE}/daily/save`, {
                method: 'POST',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                body: formData
            });
        });
}

// 页面隐藏时自动保存数据
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
        saveDataSync();
    }
});

// 页面关闭前尝试保存数据
window.addEventListener('beforeunload', function(e) {
    saveDataSync();
});

// 页面刷新时保存数据
window.addEventListener('pagehide', function() {
    saveDataSync();
});
