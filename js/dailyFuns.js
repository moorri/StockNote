// 每日复盘 Vue 应用逻辑

const { createApp, ref, computed, watch } = Vue;

// 切换金额显示/隐藏
function toggleAmountDisplay() {
    const isHidden = localStorage.getItem(HIDE_AMOUNT_KEY) === 'true';
    const newState = !isHidden;
    localStorage.setItem(HIDE_AMOUNT_KEY, newState);
    updateAmountDisplay();
}

// 更新金额显示状态
function updateAmountDisplay() {
    const isHidden = localStorage.getItem(HIDE_AMOUNT_KEY) === 'true';
    // 更新所有金额元素
    document.querySelectorAll('.amount-value').forEach(el => {
        if (isHidden) {
            el.dataset.originalText = el.textContent;
            el.textContent = '*****';
        } else if (el.dataset.originalText) {
            el.textContent = el.dataset.originalText;
        }
    });
    // 更新按钮图标
    const btn = document.getElementById('hideAmountBtn');
    if (btn) {
        const img = btn.querySelector('img');
        img.src = isHidden ? '../photo/ico/close.png' : '../photo/ico/open.png';
        img.alt = isHidden ? '显示金额' : '隐藏金额';
    }
}

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

        // 切换日期（自动保存当前数据）
        const changeDate = async (delta) => {
            // 先保存当前数据
            await saveData();
            // 然后切换日期
            const newDate = new Date(currentDate.value);
            newDate.setDate(newDate.getDate() + delta);
            currentDate.value = newDate;
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
                form.value = {
                    ...emptyForm(),
                    ...data,
                    sectors: Array.isArray(data.sectors) ? data.sectors : [],
                    highBoards: Array.isArray(data.highBoards) ? data.highBoards : [],
                    watchStocks: Array.isArray(data.watchStocks) ? data.watchStocks : [],
                    operations: Array.isArray(data.operations) ? data.operations : []
                };
            } else {
                form.value = emptyForm();
            }
            // 数据加载完成后更新金额显示状态
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
            saveData
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

        return {
            currentDate,
            dateKey,
            dateDisplay,
            form,
            changeDate,
            saveData
        };
    }
}).mount('#app');

// Vue 渲染完成后恢复金额显示状态
setTimeout(updateAmountDisplay, 100);
