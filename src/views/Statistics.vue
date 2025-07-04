<script setup>
import { ref, onMounted, nextTick } from 'vue';
import * as echarts from 'echarts';
import {Film, VideoCamera, Money, Coin} from '@element-plus/icons-vue';
import {
  analyzeMovie, 
  analyzeSession, 
  analyzeSessionBoxOffice,
  analyzeWeekBoxOffice,
  analyzeGenreBoxOffice,
  analyzeRegionBoxOffice
} from "@/api/statistics";

// 统计数据
const movieCount = ref(0);
const todaySessionCount = ref(0);
const todayBoxOffice = ref(0);
const totalBoxOffice = ref(0);

// 获取电影数量
const fetchMovieCount = async () => {
  try {
    const response = await analyzeMovie();
    if (response.status)
    {
      movieCount.value = response.data.movieCount || 0;
    }
  } catch (error) {
    console.error('获取电影数量失败:', error);
  }
};

// 获取今日场次数量
const fetchTodaySessionCount = async () => {
  try {
    const response = await analyzeSession();
    if (response.status)
    {
      todaySessionCount.value = response.data || 0;
    }
  } catch (error) {
    console.error('获取今日场次数量失败:', error);
  }
};

// 获取今日票房
const fetchTodayBoxOffice = async () => {
  try {
    const response = await analyzeSessionBoxOffice();
    if (response.status){
      todayBoxOffice.value = response.data || 0;
    }
  } catch (error) {
    console.error('获取今日票房失败:', error);
  }
};

// 获取累计票房
const fetchTotalBoxOffice = async () => {
  try {
    const response = await analyzeMovie();

    if (response.status)
    {
      totalBoxOffice.value = response.data.totalBoxOffice || 0;
    }
  } catch (error) {
    console.error('获取累计票房失败:', error);
  }
};

// 初始化近一周每日票房折线图
const initWeeklyBoxOfficeChart = async () => {
  try {
    // 获取过去7天的日期
    const dates = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    // 获取每天的票房数据
    const boxOfficeData = [];
    
    // 尝试使用批量获取接口
    try {
      const weekResponse = await analyzeWeekBoxOffice();
      console.log('批量获取周票房数据:', weekResponse.data);
      if (weekResponse.status && weekResponse.data && Array.isArray(weekResponse.data)) {
        weekResponse.data.forEach(item => {
          boxOfficeData.push(item || 0);
        });
      }
    } catch (weekError) {
      console.warn('批量获取周票房数据失败:', weekError);
    }
    
    // 初始化图表
    await nextTick();
    const chartDom = document.getElementById('weeklyBoxOfficeChart');
    if (chartDom) {
      const myChart = echarts.init(chartDom);
      
      const option = {
        title: {
          text: '近一周每日票房变化折线图',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          formatter: '{b}<br />票房: {c} 元'
        },
        xAxis: {
          type: 'category',
          data: dates.map(date => date),
          name: '日期',
          axisLabel: {
            formatter: '{value}'
          }
        },
        yAxis: {
          type: 'value',
          name: '金额(元)'
        },
        series: [{
          data: boxOfficeData,
          type: 'line',
          smooth: true,
          lineStyle: {
            width: 3,
            color: '#409EFF'
          },
          symbol: 'circle',
          symbolSize: 8,
          itemStyle: {
            color: '#409EFF'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: 'rgba(64, 158, 255, 0.5)'
              },
              {
                offset: 1,
                color: 'rgba(64, 158, 255, 0.1)'
              }
            ])
          }
        }]
      };
      
      myChart.setOption(option);
      
      // 响应式调整
      window.addEventListener('resize', () => {
        myChart.resize();
      });
    }
  } catch (error) {
    console.error('初始化近一周每日票房折线图失败:', error);
  }
};

// 初始化电影类型饼图
const initGenrePieChart = async () => {
  try {
    // 获取电影类型数据
    const response = await analyzeGenreBoxOffice();
    if (response.status) {
      const genreData = response.data;
      
      // 准备图表数据
      const chartData = genreData.map(item => ({
        name: item.name,
        value: item.movieCount
      }));
      
      // 初始化图表
      await nextTick();
      const chartDom = document.getElementById('genrePieChart');
      if (chartDom) {
        const myChart = echarts.init(chartDom);
        
        const option = {
          title: {
            text: '不同类型电影数量分布饼图',
            left: 'center'
          },
          tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
          },
          legend: {
            type: 'scroll',
            orient: 'vertical',
            left: 10,
            data: chartData.map(item => item.name)
          },
          series: [
            {
              name: '电影类型',
              type: 'pie',
              radius: ['40%', '70%'],
              avoidLabelOverlap: false,
              itemStyle: {
                borderRadius: 10,
                borderColor: '#fff',
                borderWidth: 2
              },
              label: {
                show: true,
                formatter: '{b}: {c}'
              },
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0, 0, 0, 0.5)'
                },
                label: {
                  show: true,
                  fontSize: '18',
                  fontWeight: 'bold'
                }
              },
              labelLine: {
                show: true
              },
              data: chartData
            }
          ]
        };
        
        myChart.setOption(option);
        
        // 响应式调整
        window.addEventListener('resize', () => {
          myChart.resize();
        });
      }
    }
  } catch (error) {
    console.error('初始化电影类型饼图失败:', error);
  }
};

// 初始化电影类型柱状图
const initGenreBarChart = async () => {
  try {
    // 获取电影类型数据
    const response = await analyzeGenreBoxOffice();
    if (response.status) {
      const genreData = response.data;
      
      // 准备图表数据
      const categories = genreData.map(item => item.name);
      const boxOfficeData = genreData.map(item => item.boxOffice);
      
      // 初始化图表
      await nextTick();
      const chartDom = document.getElementById('genreBarChart');
      if (chartDom) {
        const myChart = echarts.init(chartDom);
        
        const option = {
          title: {
            text: '不同类型电影总票房柱状图',
            left: 'center'
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'shadow'
            },
            formatter: '{b}<br />票房: {c} 元'
          },
          xAxis: {
            type: 'category',
            name: '电影类型',
            data: categories,
            axisLabel: {
              interval: 0,
              rotate: 30
            }
          },
          yAxis: {
            type: 'value',
            name: '金额(元)'
          },
          series: [
            {
              data: boxOfficeData,
              type: 'bar',
              itemStyle: {
                color: function(params) {
                  // 为不同的柱子设置不同的颜色
                  const colorList = [
                    '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
                    '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'
                  ];
                  return colorList[params.dataIndex % colorList.length];
                }
              }
            }
          ]
        };
        
        myChart.setOption(option);
        
        // 响应式调整
        window.addEventListener('resize', () => {
          myChart.resize();
        });
      }
    }
  } catch (error) {
    console.error('初始化电影类型柱状图失败:', error);
  }
};

// 初始化电影区域饼图
const initRegionPieChart = async () => {
  try {
    // 获取电影区域数据
    const response = await analyzeRegionBoxOffice();
    if (response.status) {
      const regionData = response.data;
      
      // 准备图表数据
      const chartData = regionData.map(item => ({
        name: item.name,
        value: item.movieCount
      }));
      
      // 初始化图表
      await nextTick();
      const chartDom = document.getElementById('regionPieChart');
      if (chartDom) {
        const myChart = echarts.init(chartDom);
        
        const option = {
          title: {
            text: '不同区域电影数量分布饼图',
            left: 'center'
          },
          tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
          },
          legend: {
            type: 'scroll',
            orient: 'vertical',
            left: 10,
            data: chartData.map(item => item.name)
          },
          series: [
            {
              name: '电影区域',
              type: 'pie',
              radius: ['40%', '70%'],
              avoidLabelOverlap: false,
              itemStyle: {
                borderRadius: 10,
                borderColor: '#fff',
                borderWidth: 2
              },
              label: {
                show: true,
                formatter: '{b}: {c}'
              },
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0, 0, 0, 0.5)'
                },
                label: {
                  show: true,
                  fontSize: '18',
                  fontWeight: 'bold'
                }
              },
              labelLine: {
                show: true
              },
              data: chartData
            }
          ]
        };
        
        myChart.setOption(option);
        
        // 响应式调整
        window.addEventListener('resize', () => {
          myChart.resize();
        });
      }
    }
  } catch (error) {
    console.error('初始化电影区域饼图失败:', error);
  }
};

// 初始化电影区域柱状图
const initRegionBarChart = async () => {
  try {
    // 获取电影区域数据
    const response = await analyzeRegionBoxOffice();
    if (response.status) {
      const regionData = response.data;
      
      // 准备图表数据
      const categories = regionData.map(item => item.name);
      const boxOfficeData = regionData.map(item => item.boxOffice);
      
      // 初始化图表
      await nextTick();
      const chartDom = document.getElementById('regionBarChart');
      if (chartDom) {
        const myChart = echarts.init(chartDom);
        
        const option = {
          title: {
            text: '不同区域电影总票房柱状图',
            left: 'center'
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'shadow'
            },
            formatter: '{b}<br />票房: {c} 元'
          },
          xAxis: {
            type: 'category',
            data: categories,
            axisLabel: {
              interval: 0,
              rotate: 30
            }
          },
          yAxis: {
            type: 'value',
            name: '金额(元)'
          },
          series: [
            {
              data: boxOfficeData,
              type: 'bar',
              itemStyle: {
                color: function(params) {
                  // 为不同的柱子设置不同的颜色
                  const colorList = [
                    '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
                    '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'
                  ];
                  return colorList[params.dataIndex % colorList.length];
                }
              }
            }
          ]
        };
        
        myChart.setOption(option);
        
        // 响应式调整
        window.addEventListener('resize', () => {
          myChart.resize();
        });
      }
    }
  } catch (error) {
    console.error('初始化电影区域柱状图失败:', error);
  }
};

// 页面加载时获取数据
onMounted(() => {
  fetchMovieCount();
  fetchTodaySessionCount();
  fetchTodayBoxOffice();
  fetchTotalBoxOffice();
  initWeeklyBoxOfficeChart();
  initGenrePieChart();
  initGenreBarChart();
  initRegionPieChart();
  initRegionBarChart();
});
</script>

<template>
  <div class="statistics-container">
    <!-- 顶部统计卡片 -->
    <div class="stat-cards">
      <!-- 电影数量卡片 -->
      <el-card class="stat-card">
        <div class="stat-card-content">
          <div class="stat-icon movie-icon">
            <el-icon size=30><Film /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-title">电影数量</div>
            <div class="stat-value">{{ movieCount }}</div>
          </div>
        </div>
      </el-card>
      
      <!-- 今日场次卡片 -->
      <el-card class="stat-card">
        <div class="stat-card-content">
          <div class="stat-icon session-icon">
            <el-icon><VideoCamera /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-title">今日场次</div>
            <div class="stat-value">{{ todaySessionCount }}</div>
          </div>
        </div>
      </el-card>
      
      <!-- 今日票房卡片 -->
      <el-card class="stat-card">
        <div class="stat-card-content">
          <div class="stat-icon today-box-icon">
            <el-icon><Money /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-title">今日票房</div>
            <div class="stat-value">{{ todayBoxOffice.toFixed(0) }}</div>
          </div>
        </div>
      </el-card>
      
      <!-- 累计票房卡片 -->
      <el-card class="stat-card">
        <div class="stat-card-content">
          <div class="stat-icon total-box-icon">
            <el-icon><Coin /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-title">累计票房</div>
            <div class="stat-value">{{ totalBoxOffice.toFixed(0) }}</div>
          </div>
        </div>
      </el-card>
    </div>
    
    <!-- 图表区域 -->
    <div class="chart-container">
      <el-card class="chart-card">
        <div id="weeklyBoxOfficeChart" class="chart"></div>
      </el-card>
      
      <!-- 电影类型统计图表 -->
      <div class="chart-row">
        <el-card class="chart-card half-width">
          <div id="genrePieChart" class="chart"></div>
        </el-card>
        <el-card class="chart-card half-width">
          <div id="genreBarChart" class="chart"></div>
        </el-card>
      </div>
      
      <!-- 电影区域统计图表 -->
      <div class="chart-row">
        <el-card class="chart-card half-width">
          <div id="regionPieChart" class="chart"></div>
        </el-card>
        <el-card class="chart-card half-width">
          <div id="regionBarChart" class="chart"></div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.statistics-container {
  padding: 10px;
}

.stat-cards {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.stat-card {
  width: 24%;
  min-width: 220px;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.stat-card-content {
  display: flex;
  align-items: center;
  padding: 5px;
}

.stat-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  margin-right: 15px;
  font-size: 30px;
}

.movie-icon {
  background-color: rgba(255, 87, 87, 0.1);
  color: #ff5757;
}

.session-icon {
  background-color: rgba(64, 158, 255, 0.1);
  color: #409EFF;
}

.today-box-icon {
  background-color: rgba(103, 194, 58, 0.1);
  color: #67c23a;
}

.total-box-icon {
  background-color: rgba(230, 162, 60, 0.1);
  color: #e6a23c;
}

.stat-info {
  flex: 1;
}

.stat-title {
  font-size: 20px;
  color: #909399;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.chart-container {
  margin-top: 20px;
}

.chart-card {
  width: 100%;
  margin-bottom: 20px;
}

.chart {
  height: 400px;
  width: 100%;
}

.chart-row {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.half-width {
  width: 49%;
}

@media screen and (max-width: 1200px) {
  .stat-card {
    width: 48%;
  }
}

@media screen and (max-width: 768px) {
  .stat-card {
    width: 100%;
  }
}


</style>