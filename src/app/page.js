"use client";

import { useState, useMemo} from "react";
import ReactMarkdown from "react-markdown";
import MarkdownComponents from "../../demo/MarkdownComponents";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import remarkGfm from "remark-gfm";
import { FileText, BarChart2, MessageSquare, WandSparkles } from 'lucide-react';
import response from "./data/None_1004_202507071546_suzhou_50000summary_reextract1_gemini-2.5-pro-preview-05-06.json";


const COLORS = ["#0032A0", "#007AFF", "#58A6FF", "#ADC8E6", "#A8DADC", "#457b9d", "#1d3557", "#8ECAE6"];

function fixMarkdownStrong(text) {
  if (typeof text !== 'string') return text;
  return text.replace(/(\*\*.*?\*\*)(?=[^\s\n])/g, "$1 ");
}

function simpleKeywordExtractor(answers, topN = 15) {
    const wordCounts = {};
    const stopWords = new Set(['的', '了', '是', '我', '你', '他', '也', '都', '在', '个', '和', '与', '为', '这个', '那个', '一个', '我们', '什么', '不是', '就是']);
    const words = answers.join(' ').match(/[\u4e00-\u9fa5]{2,}|[a-zA-Z]{3,}/g) || [];
    words.forEach(word => {
        if (!stopWords.has(word) && word.length > 1) {
            wordCounts[word] = (wordCounts[word] || 0) + 1;
        }
    });
    return Object.entries(wordCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, topN)
        .map(([text, value]) => ({ text, value }));
}

const PieTooltip = ({ active, payload, total }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) + "%" : "0%";
      return (
        <div className="p-3 bg-white print:bg-white rounded-lg shadow-lg border border-gray-200 print:border-gray-200 text-sm">
          <p className="font-bold text-gray-800 print:text-gray-800">{data.name}</p>
          <p className="text-blue-600">票数: <span className="font-semibold">{data.value}</span> ({percentage})</p>
        </div>
      );
    }
    return null;
};
  
const BarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const sourceData = payload[0].payload;
      return (
        <div className="p-3 bg-white rounded-lg shadow-lg border border-gray-200 print:border-gray-200 text-sm">
          <p className="font-bold text-gray-800 print:text-gray-800">{sourceData.name}</p>
          <p className="text-blue-600 print:text-blue-600">票数: <span className="font-semibold">{sourceData.value}</span></p>
        </div>
      );
    }
    return null;
};
  
const CustomizedXAxisTick = ({ x, y, payload }) => {
    const { value } = payload;
    const MAX_LENGTH = 15;
    const truncatedValue = value.length > MAX_LENGTH ? `${value.substring(0, MAX_LENGTH)}...` : value;
    return (
        <g transform={`translate(${x},${y})`}>
          <text x={0} y={0} dy={16} textAnchor="end" fill="#666" transform="rotate(-45)" fontSize={12} style={{cursor: 'pointer'}}>
            <title>{value}</title>
            {truncatedValue}
          </text>
        </g>
    );
};


const ReportTabs = ({ activeTab, onTabClick }) => {
    const tabs = [
      { key: 'summary', label: '总体分析', icon: <FileText size={18} /> },
      { key: 'suggestions', label: '决策建议', icon: <WandSparkles size={18} /> },
      { key: 'stats', label: '详细统计', icon: <BarChart2 size={18} /> },
      { key: 'interviews', label: '访谈记录', icon: <MessageSquare size={18} /> },
    ];
  
    return (
      <div className="mb-8 border-b border-gray-200">
        <ul className="flex justify-center -mb-px space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <li key={tab.key}>
              <button onClick={() => onTabClick(tab.key)}
                className={`cursor-pointer inline-flex items-center gap-2 px-1 py-4 border-b-2 text-sm font-medium transition-colors duration-200 ease-in-out ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}>
                {tab.icon} {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
};

const OpenEndedAnalysisUI = ({ analysis, answerCount }) => {
    // 这个组件现在不需要知道打印模式，因为所有控制都通过 CSS 完成
    const [showRaw, setShowRaw] = useState(false);
    const topKeywords = analysis.themeData || [];

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* 左侧：主题柱状图 */}
                <div className="w-full h-96">
                    <h4 className="font-semibold text-gray-700 mb-4 text-center">核心主题提及频率</h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analysis.themeData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                            <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(0, 122, 255, 0.08)' }}/>
                            <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                                {analysis.themeData.map((entry, index) => 
                                    // --- 修正点 1: 添加内联 style ---
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={COLORS[index % COLORS.length]} 
                                        style={{ fill: COLORS[index % COLORS.length] }} 
                                    />
                                )}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                {/* 右侧：高频关键词洞察 */}
                <div className="w-full">
                    <h4 className="font-semibold text-gray-700 mb-4 text-center">高频关键词洞察</h4>
                    {/* --- 修正点 2: 添加 force-print-expand 类 --- */}
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 space-y-3 max-h-96 overflow-y-auto force-print-expand">
                        {topKeywords.length > 0 ? (
                            topKeywords.map((keyword, index) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center">
                                        <span className="text-gray-400 font-medium w-6 text-center">{index + 1}.</span>
                                        <span className="text-gray-800 font-medium">{keyword.name}</span>
                                    </div>
                                    <span className="text-white bg-blue-500 font-semibold text-xs px-2 py-0.5 rounded-full print:bg-blue-500">
                                        {keyword.value} 次
                                    </span>
                                </div>
                            ))
                        ) : (<p className="text-sm text-gray-400 italic text-center py-8">无有效关键词可供分析。</p>)}
                    </div>
                </div>
            </div>
            {/* 原始数据折叠区 */}
            <div>
                <button onClick={() => setShowRaw(!showRaw)} className="text-sm font-medium text-blue-600 hover:text-blue-800 no-print">
                    {showRaw ? '隐藏' : `查看全部 ${answerCount} 条原始回答`}
                </button>
                {/* --- 修正点 3: 添加 force-print-expand 类 --- */}
                <div className={`mt-4 p-4 border rounded-lg bg-gray-50 max-h-96 overflow-y-auto ${!showRaw && 'hidden'} force-print-expand`}>
                    <ul className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                        {analysis.rawAnswers.map((ans, i) => <li key={i}>{ans.text} ({ans.value}票)</li>)}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const QuestionStats = ({ questionData}) => {
    const { question, summary, answer, question_type } = questionData;
    const answerKeys = Object.keys(answer || {});
    const answerCount = answerKeys.length;
    const hasSummary = summary && summary.trim() !== "";
    
    const analysis = useMemo(() => {
        if (question_type !== 'open_ended' || !answerKeys.length) {
            return { themeData: [], rawAnswers: [] };
        }
        const keywords = simpleKeywordExtractor(answerKeys, 15);
        return {
            themeData: keywords.map(kw => ({ name: kw.text, value: kw.value })),
            rawAnswers: Object.entries(answer || {}).map(([text, value]) => ({ text, value })),
        };
    }, [question_type, answer, answerKeys]);
    
    // Hooks for multiple-choice/other questions. These are now always called.
    const [showOptions, setShowOptions] = useState(false);

    const { data: chartData, chartType } = useMemo(() => {
        if (question_type === 'open_ended' || !answer || answerCount === 0) {
            return { data: [], chartType: "bar" };
        }
        const data = Object.entries(answer).map(([label, value]) => ({
            name: label,
            value: typeof value === "number" ? value : 0,
        })).sort((a, b) => b.value - a.value);
        
        const type = data.length > 10 ? "bar" : "pie";
        return { data, chartType: type };
    }, [question_type, answer, answerCount]);

    const total = useMemo(() => {
        if (question_type === 'open_ended') return 0;
        return chartData.reduce((sum, entry) => sum + (entry.value || 0), 0)
    }, [chartData, question_type]);

    if (question_type === 'open_ended') {
        return (
            <div className="bg-white border border-gray-200/80 rounded-xl shadow-md p-6 flex flex-col lg:col-span-2 question-stats-card">
              <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-4 border-b border-gray-200">{question}</h3>
              <OpenEndedAnalysisUI analysis={analysis} answerCount={answerCount} /> 
            </div>
        );
    }
    
    // --- Render logic for non-open-ended questions ---
    const isSideBySideLayout = chartType === 'pie';
    const toggleOptions = () => setShowOptions(!showOptions);
    const renderCompactLegend = (props) => {
        const { payload } = props;
        return (
          <ul className="space-y-2 text-sm text-gray-600">
            {payload?.map((entry, index) => (
              <li key={`item-${index}`} className="flex items-center">
                <div className="w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: entry.color }}/>
                <span className="truncate" title={entry.value}>{entry.value}</span>
              </li>
            ))}
          </ul>
        );
      };
    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        if (percent < 0.05) return null;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        return (<text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">{`${(percent * 100).toFixed(0)}%`}</text>);
    };
    const getSafeYAxisDomain = () => {
        if (!chartData || chartData.length === 0) return [0, 10];
        const maxValue = Math.max(...chartData.map(item => item.value));
        const paddedMax = maxValue * 1.2;
        if (paddedMax <= 5) return [0, Math.ceil(paddedMax) || 5];
        return [0, Math.ceil(paddedMax / 10) * 10];
    };
    const dynamicBarSize = answerCount > 10 ? 20 : 35;
    
        return (
        <div className="bg-white border border-gray-200/80 rounded-xl shadow-md p-6 flex flex-col lg:col-span-2 question-stats-card">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 pb-4 border-b border-gray-200">{question}</h3>
          <div
            className={`flex-grow ${
              isSideBySideLayout
                ? "grid grid-cols-1 md:grid-cols-2 md:gap-8" // 使用 Grid 布局
                : "flex flex-col" // 保持原有布局
            }`}
          >
            {chartData.length > 0 && (
              <div
                className={`h-96 ${isSideBySideLayout ? "md:col-span-1" : "w-full"}`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "pie" ? (
                    <PieChart>
                      <Pie data={chartData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={2} dataKey="value" nameKey="name" labelLine={false} label={renderCustomizedLabel}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={{ fill: COLORS[index % COLORS.length] }} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip total={total} />} />
                      <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ right: -10 }} content={(props) => renderCompactLegend(props)} />
                    </PieChart>
                  ) : ( 
                    <BarChart data={chartData} margin={{ top: 20, right: 20, left: 5, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="2 2" vertical={false} />
                      <XAxis dataKey="name" tick={<CustomizedXAxisTick />} interval={0} height={60} />
                      <YAxis axisLine={false} tickLine={false} domain={getSafeYAxisDomain()} tick={{ fontSize: 11, fill: '#6b7280' }} />
                      <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(0, 122, 255, 0.08)' }} />
                      <Bar dataKey="value" barSize={dynamicBarSize} radius={[10, 10, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={{ fill: COLORS[index % COLORS.length] }} />
                        ))}
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}
        <div
          className={`mt-4 md:mt-0 ${isSideBySideLayout ? "md:col-span-1" : ""}`}
        >
          <div className="flex flex-col justify-center h-full w-full ">
              {hasSummary && (<div className="bg-blue-50/70 border-l-4 border-blue-400 p-4 rounded-r-md mb-4 print:bg-blue-50/70"><h4 className="font-bold text-blue-800 mb-2">结果分析与总结</h4><div className="prose prose-sm max-w-none prose-p:text-gray-700"><ReactMarkdown components={MarkdownComponents}>{fixMarkdownStrong(summary)}</ReactMarkdown></div></div>)}
              {answerCount > 0 && (<div>
                <button onClick={toggleOptions} className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 no-print">
                  {showOptions ? "隐藏详细数据" : `查看所有选项 (${answerCount}条)`}
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${showOptions ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showOptions ? 'max-h-96 mt-3' : 'max-h-0'} force-print-expand`}>
                  {answerCount > 0 ? (<ul className="space-y-2 text-sm border-t pt-3 overflow-y-auto max-h-80 pr-2 force-print-expand">{answerKeys.map((key, i) => (<li key={i} className="text-gray-700 bg-gray-50 p-2.5 rounded-md border-l-2 border-gray-300 print:bg-gray-50"><strong>选项 {i + 1}:</strong> {key}<span className="font-semibold text-blue-800 ml-1">{typeof answer[key] === "number" ? ` (${answer[key]}票)` : ""}</span></li>))}</ul>) : (<p className="text-gray-500 italic mt-2">无详细选项数据。</p>)}
                </div>
              </div>)}
            </div>
            </div>
          </div>
        </div>
    );
};

const InterviewRecord = ({ interview, index, isOpen, onToggle }) => {
    const consumer = interview.consumer;
    const consumerGender = consumer.gender === "male" ? "男" : consumer.gender === "female" ? "女" : "其他";
    const consumerInfo = `${consumer.age}岁 ${consumerGender} ${consumer.region}`;

    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200/80 transition-shadow hover:shadow-md print:shadow-none print:border-gray-300" style={{ pageBreakInside: 'avoid' }}>
        <div 
            className="flex justify-between items-center cursor-pointer no-print"
            onClick={onToggle} 
        >
          <div>
            <h3 className="text-base font-semibold text-gray-800">访谈记录 #{index + 1}: {consumer.name || "匿名"}</h3>
            <div className="text-xs text-gray-500 mt-1">{consumerInfo}</div>
            {consumer.description && (<div className="text-xs text-gray-500 mt-1 italic">{consumer.description}</div>)}
          </div>
          <div className="text-gray-400">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                <polyline points="6 9 12 15 18 9"></polyline>
             </svg>
          </div>
        </div>
        
        {/* --- 新增: 专门用于打印的头部，没有点击事件 --- */}
        <div className="hidden print:block border-b border-gray-200 pb-4 mb-4">
            <h3 className="text-base font-semibold text-gray-800">访谈记录 #{index + 1}: {consumer.name || "匿名"}</h3>
            <div className="text-xs text-gray-500 mt-1">{consumerInfo}</div>
            {consumer.description && (<div className="text-xs text-gray-500 mt-1 italic">{consumer.description}</div>)}
        </div>


        {/* --- 修正点 2: 为折叠容器添加 force-print-expand-interview 类 --- */}
        <div 
            className={`transition-all duration-500 ease-in-out overflow-hidden ${
                isOpen ? 'max-h-[2000px] mt-6 pt-6 border-t border-gray-200' : 'max-h-0'
            } force-print-expand-interview`}
        >
            <div>
              <h4 className="font-semibold mb-3 text-gray-700 text-sm">访谈内容 (中文)</h4>
              {interview.cn_data && interview.cn_data.length > 0 ? (
                <div className="space-y-4">
                    {interview.cn_data.map((chat, chatIndex) => (
                        <div key={chatIndex}>
                          {/* --- 修正点 3: 为带背景色的元素添加 print:bg-* 类 --- */}
                          <div className="bg-blue-50 print:bg-blue-50 p-3 rounded-lg text-sm">
                            <span className="font-semibold text-blue-800 print:text-blue-800">问:</span>
                            <span className="text-gray-800 print:text-gray-800 ml-2">{chat.q}</span>
                          </div>
                          <div className="bg-gray-50 print:bg-gray-50 p-3 rounded-lg text-sm mt-2">
                            <span className="font-semibold text-gray-700 print:text-gray-700">答:</span>
                            <span className="text-gray-800 print:text-gray-800 ml-2">{chat.a}</span>
                          </div>
                        </div>
                    ))}
                </div>
              ) : (<p className="text-gray-500 italic text-sm">无中文访谈数据。</p>)}
            </div>
            
            {interview.summary && (
              <div className="mt-6">
                <h4 className="font-semibold mb-2 text-gray-700 text-sm">访谈总结</h4>
                <div className="bg-yellow-50/80 print:bg-yellow-50/80 p-4 rounded-lg border border-yellow-200/80 text-sm text-yellow-900 prose prose-sm max-w-none">
                    <ReactMarkdown components={MarkdownComponents}>{fixMarkdownStrong(interview.summary)}</ReactMarkdown>
                </div>
              </div>
            )}
        </div>
      </div>
    );
};

const SyntheticSurveyPageContainer = () => {
    // --- 数据获取逻辑 (保持不变) ---
    const data = response["results"];
    const interviews = response["interviewer_records"];
    const surveyTopic = response["raw_survey"]?.topic;
    const structuredQuestions = response["structured_questions"] || [];
    
    // --- 状态逻辑 (保持不变) ---
    const [activeTab, setActiveTab] = useState("summary");
    const [openStates, setOpenStates] = useState(
        interviews.reduce((acc, _, index) => ({ ...acc, [index]: false }), {})
    );

    // --- 数据和事件处理函数 (保持不变) ---
    const processedStats = useMemo(() => {
        if (!data.stats || !structuredQuestions.length) return data.stats || [];
        const questionTypeMap = new Map();
        structuredQuestions.forEach(q => {
            const type = (q.options && q.options.length > 0) ? 'multiple_choice' : 'open_ended';
            questionTypeMap.set(q.question, type);
        });
        return data.stats.map(stat => ({
            ...stat,
            question_type: questionTypeMap.get(stat.question) || 'multiple_choice'
        }));
    }, [data.stats, structuredQuestions]);
    const handleToggleInterview = (index) => setOpenStates(prev => ({ ...prev, [index]: !prev[index] }));
    const handleToggleAllInterviews = () => {
        const allAreOpen = Object.values(openStates).every(Boolean);
        const newStates = {};
        for (const key in openStates) { newStates[key] = !allAreOpen; }
        setOpenStates(newStates);
    };
    const areAllInterviewsOpen = useMemo(() => Object.values(openStates).every(Boolean), [openStates]);
  
    // --- 核心改动 1: 注入打印样式 ---
    const printStyles = `
      @media print {
        /* 强制打印颜色和背景 */
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* 隐藏交互元素 */
        .no-print {
          display: none !important;
        }
        
        /* 页面和容器样式重置 */
        body {
          background-color: #fff !important;
        }
        .print-container {
          max-width: 100% !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 10px !important;
          box-shadow: none !important;
        }

        /* 强制显示所有 Tab 内容块 */
        .printable-content-wrapper > section {
          display: block !important;
          page-break-before: always; /* 每个部分从新的一页开始 */
        }
        
        /* 强制展开所有可滚动/折叠的区域 */
        .force-print-expand {
            max-height: none !important;
            overflow: visible !important;
            height: auto !important;
        }
        .force-print-expand-interview {
            max-height: 9999px !important; /* 用一个超大值 */
            overflow: visible !important;
            margin-top: 1.5rem !important;
            padding-top: 1.5rem !important;
            border-top-width: 1px !important;
        }
      }
    `;

    return (
        <div className="bg-gray-50/50 min-h-screen">
            <style>{printStyles}</style>
            <div className="w-full max-w-[80vw] mx-auto px-4 sm:px-6 lg:px-8 py-8 print-container">
                
                {/* --- 核心改动 2: 添加打印按钮 --- */}
                <div className="flex justify-end mb-4 no-print">
                    <button
                        onClick={() => window.print()}
                        className="bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                        打印/导出 PDF
                    </button>
                </div>
                
                <h1 className="text-3xl sm:text-4xl font-bold text-center text-blue-900 mb-4">{surveyTopic ? `${surveyTopic} - 调查结果报告` : "调查结果报告"}</h1>
                <p className="text-center text-gray-500 mb-8 no-print">一份全面的用户洞察与数据分析报告</p>

                <div className="no-print">
                    <ReportTabs activeTab={activeTab} onTabClick={setActiveTab} />
                </div>

                {/* --- 核心改动 3: 所有内容始终渲染，用 CSS 控制显示/隐藏 --- */}
                <div className="mt-6 printable-content-wrapper">
                    <section className={`${activeTab === 'summary' ? 'block' : 'hidden'}`}>
                        <div className="relative bg-white rounded-xl shadow-lg border border-gray-200/80 overflow-hidden p-8 md:p-10">
                            <div className="absolute inset-0 z-0" style={{ backgroundImage: "url(/grid-bg.svg)", opacity: 0.5 }}></div>
                            <div className="absolute -top-1/4 -right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-1"></div>
                            <div className="relative z-10">
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="flex-shrink-0 bg-blue-100 text-blue-600 rounded-lg p-3"><FileText size={28} /></div>
                                    <div><h2 className="text-2xl font-bold text-blue-900">总体分析与核心洞察</h2><p className="mt-1 text-gray-500">基于所有访谈数据提炼的关键发现与摘要。</p></div>
                                </div>
                                <hr className="my-6 border-gray-200" />
                                <div className="prose prose-blue max-w-none prose-h2:text-blue-800 prose-h2:font-semibold prose-strong:text-gray-800">
                                    <ReactMarkdown components={MarkdownComponents}>{fixMarkdownStrong(data.total_summary || "*未提供总体总结。*")}</ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    </section>
                    
                    <section className={`${activeTab === 'suggestions' ? 'block' : 'hidden'}`}>
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200/80 p-8 md:p-10">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="flex-shrink-0 bg-green-100 text-green-600 rounded-lg p-3"><WandSparkles size={28} /></div>
                                <div><h2 className="text-2xl font-bold text-gray-800">决策建议与行动指南</h2><p className="mt-1 text-gray-500">基于数据洞察，为您的产品、营销和运营策略提供可执行的建议。</p></div>
                            </div>
                            <hr className="my-6 border-gray-200" />
                            <div className="prose prose-lg max-w-none prose-h3:text-gray-700 prose-li:my-1">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>{fixMarkdownStrong(data.suggestion) || "*暂无决策建议。*"}</ReactMarkdown>
                            </div>
                        </div>
                    </section>

                    <section className={`${activeTab === 'stats' ? 'block' : 'hidden'}`}>
                        <h2 className="text-2xl font-bold text-blue-800 mb-6 pb-2 border-b border-gray-300">详细统计</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {processedStats.map((stat, index) => ( <QuestionStats key={index} questionData={stat} /> ))}
                        </div>
                    </section>

                    <section className={`${activeTab === 'interviews' ? 'block' : 'hidden'}`}>
                        <div className="flex justify-between items-center mb-6 pb-2 border-b border-gray-300 no-print">
                            <h2 className="text-2xl font-bold text-blue-800">访谈记录</h2>
                            {interviews && interviews.length > 0 && (<button onClick={handleToggleAllInterviews} className="bg-white text-blue-600 border border-blue-300 hover:bg-blue-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors">{areAllInterviewsOpen ? '一键收起所有' : '一键展开所有'}</button>)}
                        </div>
                        {/* 打印时也需要标题 */}
                        <h2 className="text-2xl font-bold text-blue-800 mb-6 pb-2 border-b border-gray-300 hidden print:block">访谈记录</h2>
                        <div className="space-y-6">
                            {interviews && interviews.map((interview, index) => (
                                <InterviewRecord key={interview.id || index} interview={interview} index={index} isOpen={openStates[index]} onToggle={() => handleToggleInterview(index)}/>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
  
export default function SyntheticSurveyPage() {
    return (
        <SyntheticSurveyPageContainer />
    );
}

