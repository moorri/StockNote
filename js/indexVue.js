// 年份选择器组件
const YearSelector = {
    name: 'YearSelector',
    props: {
        modelValue: {
            type: [Number, String],
            required: true
        },
        years: {
            type: Array,
            default: () => []
        }
    },
    emits: ['update:modelValue', 'add', 'delete'],
    template: `
        <div class="year-selector">
            <select :value="modelValue" @change="$emit('update:modelValue', $event.target.value)">
                <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
            </select>
            <button @click="$emit('add')" class="op-btn">新增</button>
            <button @click="$emit('delete')" class="op-btn delete-year-btn">删除</button>
        </div>
    `
};

// 月份卡片组件
const MonthCard = {
    name: 'MonthCard',
    props: {
        month: {
            type: Number,
            required: true
        },
        data: {
            type: Object,
            default: () => ({ my: 0, myAmount: 0, index: 0 })
        }
    },
    emits: ['update'],
    template: `
        <div class="month-card" :class="{ 'has-profit': data.my > 0, 'has-loss': data.my < 0 }">
            <div class="month-name">{{ monthNames[month - 1] }}</div>
            <div class="month-profit" :class="{ 'red': data.my > 0, 'green': data.my < 0 }">
                {{ formatProfit(data.my) }}
            </div>
            <div class="month-index" :class="{ 'red': data.index > 0, 'green': data.index < 0 }">
                {{ formatIndex(data.index) }}
            </div>
        </div>
    `,
    data() {
        return {
            monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
        };
    },
    methods: {
        formatProfit(val) {
            if (!val || val === 0) return '--';
            return (val > 0 ? '+' : '') + val + '%';
        },
        formatIndex(val) {
            if (!val || val === 0) return '上证: --';
            return '上证: ' + (val > 0 ? '+' : '') + val + '%';
        }
    }
};

// 年度汇总组件
const YearSummary = {
    name: 'YearSummary',
    props: {
        yearProfit: Number,
        yearAmount: Number,
        indexProfit: Number
    },
    template: `
        <div class="year-summary">
            <div class="summary-item">
                <h3>当年收益率</h3>
                <div class="value" :class="yearProfit >= 0 ? 'red' : 'green'">
                    {{ formatProfit(yearProfit) }}
                </div>
            </div>
            <div class="summary-item">
                <h3>年度收益金额</h3>
                <div class="value" :class="yearAmount >= 0 ? 'red' : 'green'">
                    {{ formatAmount(yearAmount) }}
                </div>
            </div>
            <div class="summary-item">
                <h3>上证指数全年涨幅</h3>
                <div class="value" :class="indexProfit >= 0 ? 'red' : 'green'">
                    {{ formatProfit(indexProfit) }}
                </div>
            </div>
        </div>
    `,
    methods: {
        formatProfit(val) {
            if (!val || val === 0) return '--';
            return (val > 0 ? '+' : '') + val.toFixed(2) + '%';
        },
        formatAmount(val) {
            if (!val || val === 0) return '--';
            const absVal = Math.abs(val);
            const display = absVal >= 10000 ? (absVal / 10000).toFixed(2) + '万' : absVal.toFixed(2) + '元';
            return (val >= 0 ? '+' : '-') + display;
        }
    }
};

// 主应用组件
const IndexApp = {
    name: 'IndexApp',
    components: {
        YearSelector,
        MonthCard,
        YearSummary
    },
    template: `
        <div class="container">
            <!-- 头部标题 -->
            <div class="header">
                <h1>
                    <select :value="currentYear" @change="switchYear($event.target.value)" style="font-size:inherit;font-weight:bold;padding:0 10px;height:36px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer;">
                        <option v-for="year in yearsList" :key="year" :value="year">{{ year }}</option>
                    </select>
                    年股票操作总结
                    <button @click="handleAddYear" class="op-btn" style="font-size:14px;padding:4px 10px;margin-left:10px;">新增</button>
                    <button @click="handleDeleteYear" class="op-btn delete-year-btn" style="font-size:14px;padding:4px 10px;">删除</button>
                </h1>
                <p>月度收益对比 | 全年表现汇总</p>
            </div>

            <!-- 月度卡片展示 -->
            <div class="month-cards">
                <div
                    v-for="(data, index) in currentYearData"
                    :key="index"
                    class="month-card"
                    :class="{ 'has-profit': data.my > 0, 'has-loss': data.my < 0 }"
                    :data-month="index + 1"
                >
                    <div class="month-name">{{ monthNames[index] }}</div>
                    <div class="month-profit" :class="{ 'red': data.my > 0, 'green': data.my < 0 }">
                        {{ formatProfit(data.my) }}
                    </div>
                    <div class="month-index" :class="{ 'red': data.index > 0, 'green': data.index < 0 }">
                        {{ formatIndex(data.index) }}
                    </div>
                </div>
            </div>

            <!-- 年度汇总 -->
            <div class="year-summary">
                <div class="summary-item">
                    <h3>当年收益率</h3>
                    <div class="value" :class="yearProfit >= 0 ? 'red' : 'green'">
                        {{ formatProfit(yearProfit) }}
                    </div>
                </div>
                <div class="summary-item">
                    <h3>年度收益金额</h3>
                    <div class="value" :class="yearAmount >= 0 ? 'red' : 'green'">
                        {{ formatAmount(yearAmount) }}
                    </div>
                </div>
                <div class="summary-item">
                    <h3>上证指数全年涨幅</h3>
                    <div class="value" :class="indexProfit >= 0 ? 'red' : 'green'">
                        {{ formatProfit(indexProfit) }}
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            currentYear: new Date().getFullYear(),
            yearsData: {},
            currentYearData: [],
            monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
        };
    },
    computed: {
        yearsList() {
            return Object.keys(this.yearsData).sort();
        },
        yearProfit() {
            let product = 1;
            this.currentYearData.forEach(m => {
                product *= (1 + (m.my || 0) / 100);
            });
            return Math.round((product - 1) * 10000) / 100;
        },
        yearAmount() {
            return this.currentYearData.reduce((sum, m) => sum + (m.myAmount || 0), 0);
        },
        indexProfit() {
            let product = 1;
            this.currentYearData.forEach(m => {
                product *= (1 + (m.index || 0) / 100);
            });
            return Math.round((product - 1) * 10000) / 100;
        }
    },
    async mounted() {
        await this.loadData();
    },
    methods: {
        async loadData() {
            // 加载年份数据
            if (typeof window.getYearsData === 'function') {
                const data = await window.getYearsData();
                this.yearsData = data || {};
            }

            // 确保当前年份存在
            if (!this.yearsData[this.currentYear]) {
                this.yearsData[this.currentYear] = {};
                if (typeof window.saveYearsData === 'function') {
                    await window.saveYearsData(this.yearsData);
                }
            }

            this.updateCurrentYearData();
        },
        updateCurrentYearData() {
            const yearObj = this.yearsData[this.currentYear] || {};
            this.currentYearData = Array.from({ length: 12 }, (_, i) => {
                return yearObj[i + 1] || { my: 0, myAmount: 0, index: 0 };
            });
        },
        async handleAddYear() {
            const newYear = prompt('请输入要新增的年份（如：2024）:');
            if (!newYear) return;
            if (this.yearsData[newYear]) {
                alert('该年份已存在！');
                return;
            }
            this.yearsData[newYear] = {};
            if (typeof window.saveYearsData === 'function') {
                await window.saveYearsData(this.yearsData);
            }
            this.currentYear = parseInt(newYear);
            this.updateCurrentYearData();
        },
        async handleDeleteYear() {
            if (this.yearsList.length <= 1) {
                alert('至少需要保留一个年份！');
                return;
            }
            if (!confirm('确定要删除 ' + this.currentYear + ' 年的所有数据吗？')) {
                return;
            }
            delete this.yearsData[this.currentYear];
            if (typeof window.saveYearsData === 'function') {
                await window.saveYearsData(this.yearsData);
            }
            this.currentYear = parseInt(this.yearsList[0]);
            this.updateCurrentYearData();
        },
        switchYear(year) {
            this.currentYear = parseInt(year);
        },
        formatProfit(val) {
            if (!val || val === 0) return '--';
            return (val > 0 ? '+' : '') + val.toFixed(2) + '%';
        },
        formatIndex(val) {
            if (!val || val === 0) return '上证: --';
            return '上证: ' + (val > 0 ? '+' : '') + val.toFixed(2) + '%';
        },
        formatAmount(val) {
            if (!val || val === 0) return '--';
            const absVal = Math.abs(val);
            const display = absVal >= 10000 ? (absVal / 10000).toFixed(2) + '万' : absVal.toFixed(2) + '元';
            return (val >= 0 ? '+' : '-') + display;
        }
    },
    watch: {
        async currentYear(newVal) {
            this.updateCurrentYearData();
            // 保存到localStorage
            localStorage.setItem('stock_year', newVal);
            // 触发外部图表刷新
            if (window.refreshYearCharts) {
                window.refreshYearCharts(this.currentYearData);
            }
        }
    }
};
