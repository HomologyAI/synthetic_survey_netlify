"use client";

import { useState, useMemo, useEffect,useCallback, memo} from "react";
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

// --- Add this new component to your file ---

const BackToTopButton = () => {
    // State to track whether the button should be visible
    const [isVisible, setIsVisible] = useState(false);

    // Function to scroll the window to the top smoothly
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth' // for a smooth scrolling effect
        });
    };

    // Effect to add and remove the scroll event listener
    useEffect(() => {
        // Function to check scroll position
        const toggleVisibility = () => {
            // Show button if user has scrolled down more than 300px
            if (window.pageYOffset > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        // Add the listener when the component mounts
        window.addEventListener('scroll', toggleVisibility);

        // Cleanup: remove the listener when the component unmounts
        return () => {
            window.removeEventListener('scroll', toggleVisibility);
        };
    }, []); // Empty dependency array ensures this effect runs only once

    return (
        <div className="fixed bottom-8 right-8 z-50 no-print">
            {isVisible && (
                <button
                    onClick={scrollToTop}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-opacity duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    aria-label="Go to top"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M12 19V5M5 12l7-7 7 7" />
                    </svg>
                </button>
            )}
        </div>
    );
};


const InterviewsTab = memo(({
    interviews,
    openStates,
    handleToggleInterview,
    handleToggleAllInterviews,
    areAllInterviewsOpen
}) => {
    // 1. All state related to searching now lives inside this component.
    const [inputValue, setInputValue] = useState('');
    const [searchQuery, setSearchQuery] = useState(''); // This is the debounced value
    const [matches, setMatches] = useState([]);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);

    // 2. Debounce effect: Updates the real search query after the user stops typing.
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(inputValue);
        }, 300); // 300ms delay

        return () => {
            clearTimeout(timer);
        };
    }, [inputValue]);

    // 3. Effect to find all matches when the debounced search query changes.
    useEffect(() => {
        if (!searchQuery.trim()) {
            setMatches([]);
            setCurrentMatchIndex(-1);
            return;
        }

        const lowerCaseQuery = searchQuery.toLowerCase();
        const allMatches = [];

        interviews.forEach((interview, interviewIndex) => {
            if (interview.cn_data && Array.isArray(interview.cn_data)) {
                interview.cn_data.forEach((chat, chatIndex) => {
                    if (chat.q && chat.q.toLowerCase().includes(lowerCaseQuery)) {
                        allMatches.push({ interviewIndex, chatIndex, part: 'q', id: `match-${interviewIndex}-${chatIndex}-q` });
                    }
                    if (chat.a && chat.a.toLowerCase().includes(lowerCaseQuery)) {
                        allMatches.push({ interviewIndex, chatIndex, part: 'a', id: `match-${interviewIndex}-${chatIndex}-a` });
                    }
                });
            }
        });

        setMatches(allMatches);
        setCurrentMatchIndex(allMatches.length > 0 ? 0 : -1);
    }, [searchQuery, interviews]);

    // 4. Effect to scroll to the currently active match.
    useEffect(() => {
        if (currentMatchIndex === -1 || matches.length === 0) return;

        const currentMatch = matches[currentMatchIndex];
        const element = document.getElementById(currentMatch.id);

        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentMatchIndex, matches]);
    
    // 5. Handlers for search navigation.
    const handleNextMatch = useCallback(() => {
        if (matches.length > 0) {
            setCurrentMatchIndex(prev => (prev + 1) % matches.length);
        }
    }, [matches.length]);

    const handlePrevMatch = useCallback(() => {
        if (matches.length > 0) {
            setCurrentMatchIndex(prev => (prev - 1 + matches.length) % matches.length);
        }
    }, [matches.length]);

    const handleSearchKeyDown = useCallback((e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (e.shiftKey) {
                handlePrevMatch();
            } else {
                handleNextMatch();
            }
        }
    }, [handlePrevMatch, handleNextMatch]);

    // 6. Memoized data for rendering.
    const searchedInterviewIndices = useMemo(() => {
        if (!searchQuery.trim()) return new Set();
        return new Set(matches.map(m => m.interviewIndex));
    }, [searchQuery, matches]);

    const filteredInterviews = useMemo(() => {
        if (!searchQuery.trim()) {
            return interviews.map((interview, index) => ({ interview, originalIndex: index }));
        }

        const lowerCaseQuery = searchQuery.toLowerCase();
        const results = [];

        interviews.forEach((interview, index) => {
            if (interview.cn_data && interview.cn_data.some(chat =>
                (chat.q && chat.q.toLowerCase().includes(lowerCaseQuery)) ||
                (chat.a && chat.a.toLowerCase().includes(lowerCaseQuery))
            )) {
                results.push({ interview, originalIndex: index });
            }
        });

        return results;
    }, [interviews, searchQuery]);

    // 7. The JSX for this tab.
    return (
        <>
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 pb-2 border-b border-gray-300 no-print">
                <h2 className="text-2xl font-bold text-blue-800">访谈记录</h2>

                <div className="relative w-full md:w-auto md:flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                    </div>
                    <input
                        type="text"
                        placeholder="搜索访谈内容 (回车切换)"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        className="block w-full pl-10 pr-32 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    {inputValue && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
                            <button
                                type="button"
                                onClick={() => setInputValue('')}
                                className="p-1 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 focus:outline-none"
                                aria-label="Clear search"
                            >
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>

                            {matches.length > 0 && (
                                <>
                                    <span className="text-sm text-gray-500 border-l pl-2 ml-1">
                                        {currentMatchIndex + 1} / {matches.length}
                                    </span>
                                    <button onClick={handlePrevMatch} className="p-1 text-gray-600 hover:bg-gray-200 rounded-full" aria-label="Previous match"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg></button>
                                    <button onClick={handleNextMatch} className="p-1 text-gray-600 hover:bg-gray-200 rounded-full" aria-label="Next match"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg></button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {interviews && interviews.length > 0 && (
                    <button onClick={handleToggleAllInterviews} className="bg-white text-blue-600 border border-blue-300 hover:bg-blue-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors flex-shrink-0">
                        {areAllInterviewsOpen ? '一键收起所有' : '一键展开所有'}
                    </button>
                )}
            </div>
             {/* 只渲染一个列表，用于屏幕交互 */}
            <div className="space-y-6">
                {filteredInterviews.map(({ interview, originalIndex }) => {
                    const currentMatchId = (currentMatchIndex !== -1 && matches[currentMatchIndex]) ? matches[currentMatchIndex].id : null;
                    return (
                        <InterviewRecord
                            key={`screen-${interview.id || originalIndex}`}
                            interview={interview}
                            index={originalIndex}
                            isOpen={openStates[originalIndex] || searchedInterviewIndices.has(originalIndex)}
                            onToggle={() => handleToggleInterview(originalIndex)}
                            searchQuery={searchQuery}
                            currentMatchId={currentMatchId}
                        />
                    );
                })}
                {searchQuery && filteredInterviews.length === 0 && (
                    <div className="text-center py-10">
                        <p className="text-gray-500">未找到与 “{inputValue}” 相关的访谈记录。</p>
                    </div>
                )}
            </div>
        </>
    );
});

InterviewsTab.displayName = 'InterviewsTab';

const StatsTab = memo(({ processedStats }) => {
  return (
    <>
      <h2 className="text-2xl font-bold text-blue-800 mb-6 pb-2 border-b border-gray-300">详细统计</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {processedStats.map((stat, index) => (
          <QuestionStats key={index} questionData={stat} />
        ))}
      </div>
    </>
  );
});
StatsTab.displayName = 'StatsTab';

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

const OpenEndedSummaryUI = ({ summary }) => {
    return (
        <div className="bg-blue-50/70 border-l-4 border-blue-400 p-6 rounded-r-md print:bg-blue-50/70">
            <div className="prose prose-sm max-w-none prose-p:text-gray-700">
                {summary && summary.trim() !== "" ? (
                    <ReactMarkdown components={MarkdownComponents}>
                        {fixMarkdownStrong(summary)}
                    </ReactMarkdown>
                ) : (
                    <p className="italic text-gray-500">此问题没有提供总结分析。</p>
                )}
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
        if (question_type !== 'open_ended' || !answer) {
            return { highImpact: [], detailed: [], general: [] };
        }

        // --- 核心的分层逻辑 ---
        
        // 1. 定义分层阈值
        const VOTE_THRESHOLD = 3; // 票数大于等于3的为高光
        const LENGTH_THRESHOLD = 100; // 长度大于等于20字符的为深度见解

        const allAnswers = Object.entries(answer).map(([text, value]) => ({ text, value }));

        const highImpact = [];
        const detailed = [];
        const general = [];

        // 2. 将每个回答分配到对应的层级
        for (const ans of allAnswers) {
            if (ans.value >= VOTE_THRESHOLD) {
                highImpact.push(ans);
            } else if (ans.text.length >= LENGTH_THRESHOLD) {
                detailed.push(ans);
            } else {
                general.push(ans);
            }
        }

        // 3. 对每个层级内部进行排序，确保最重要的在最前面
        highImpact.sort((a, b) => b.value - a.value);
        detailed.sort((a, b) => b.value - a.value || b.text.length - a.text.length);
        general.sort((a, b) => b.value - a.value);

        return { highImpact, detailed, general };
        
    }, [question_type, answer]);

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
              {/* --- 直接调用新的、简洁的UI组件 --- */}
              <OpenEndedSummaryUI summary={summary} /> 
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
        <div 
          className={`
              bg-white border border-gray-200/80 rounded-xl shadow-md p-6 flex flex-col lg:col-span-2 question-stats-card 
              ${chartType === 'pie' ? 'printable-avoid-break' : ''}
          `}>
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
                className={`h-96 ${isSideBySideLayout ? "md:col-span-1" : "w-full"} 
                ${chartType === 'bar' ? 'printable-avoid-break' : ''}`}
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

const Highlight = ({ text = '', highlight = '', elementId, isCurrent }) => {
    if (!highlight.trim() || !text) {
        return <span>{text}</span>;
    }
    
    try {
        const regex = new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);

        return (
            <span>
                {parts.filter(Boolean).map((part, i) => {
                    if (part.toLowerCase() === highlight.toLowerCase()) {
                        return (
                            <mark 
                                key={i} 
                                id={isCurrent ? elementId : undefined}
                                className={`transition-colors duration-300 rounded px-1 ${
                                    isCurrent ? 'bg-orange-400 text-white' : 'bg-yellow-300 text-black'
                                }`}
                            >
                                {part}
                            </mark>
                        );
                    }
                    return part;
                })}
            </span>
        );
    } catch (e) {
        console.error("Invalid regex in Highlight component", e);
        return <span>{text}</span>;
    }
};

const InterviewRecord = memo(({
    interview,
    index,
    isOpen,
    onToggle,
    searchQuery,
    currentMatchId // <-- This prop is passed from InterviewsTab
}) => {
    const consumer = interview.consumer;
    const consumerGender = consumer.gender === "male" ? "男" : consumer.gender === "female" ? "女" : "其他";
    const consumerInfo = `${consumer.age}岁 ${consumerGender} ${consumer.region}`;
    const shouldBeOpen = isOpen;

    return (
      <div 
        className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200/80 transition-shadow hover:shadow-md print:shadow-none print:border-gray-300">
        
        <div className="flex justify-between items-center cursor-pointer no-print" onClick={onToggle}>
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
        
        <div className="hidden print:block border-b border-gray-200 pb-4 mb-4">
            <h3 className="text-base font-semibold text-gray-800">访谈记录 #{index + 1}: {consumer.name || "匿名"}</h3>
            <div className="text-xs text-gray-500 mt-1">{consumerInfo}</div>
            {consumer.description && (<div className="text-xs text-gray-500 mt-1 italic">{consumer.description}</div>)}
        </div>

        <div 
            className={`transition-all duration-500 ease-in-out overflow-hidden ${
                shouldBeOpen ? 'max-h-max mt-6 pt-6 border-t border-gray-200' : 'max-h-0'
            } force-print-expand-interview`}
        >
            <div>
              <h4 className="font-semibold mb-3 text-gray-700 text-sm">访谈内容 (中文)</h4>
              {interview.cn_data.map((chat, chatIndex) => {
                const q_id = `match-${index}-${chatIndex}-q`;
                const a_id = `match-${index}-${chatIndex}-a`;

                return (
                    <div key={chatIndex} className="mb-4">
                      <div className="bg-blue-50 print:bg-blue-50 p-3 rounded-lg text-sm">
                        <span className="font-semibold text-blue-800 print:text-blue-800">问:</span>
                        <span className="text-gray-800 print:text-gray-800 ml-2">
                            <Highlight
                                text={chat.q}
                                highlight={searchQuery}
                                elementId={q_id}
                                isCurrent={q_id === currentMatchId}
                            />
                        </span>
                      </div>
                      <div className="bg-gray-50 print:bg-gray-50 p-3 rounded-lg text-sm mt-2">
                        <span className="font-semibold text-gray-700 print:text-gray-700">答:</span>
                        <span className="text-gray-800 print:text-gray-800 ml-2">
                            <Highlight
                                text={chat.a}
                                highlight={searchQuery}
                                elementId={a_id}
                                isCurrent={a_id === currentMatchId}
                            />
                        </span>
                      </div>
                    </div>
                );
              })}
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
});
InterviewRecord.displayName = 'InterviewRecord';

const SyntheticSurveyPageContainer = () => {
    // --- 数据获取逻辑 (保持不变) ---
    const data = response["results"];
    const interviews = response["interviewer_records"];
    const surveyTopic = response["raw_survey"]?.topic;
    const structuredQuestions = response["structured_questions"] || [];
    
    // --- 状态逻辑 ---
    const [activeTab, setActiveTab] = useState("summary");
    const [openStates, setOpenStates] = useState(
        interviews.reduce((acc, _, index) => ({ ...acc, [index]: false }), {})
    );
    const [isPrintMode, setIsPrintMode] = useState(false);


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
    const handleToggleInterview = useCallback((index) => {
        setOpenStates(prev => ({ ...prev, [index]: !prev[index] }));
    }, []); 
    const handleToggleAllInterviews = () => {
        const allAreOpen = Object.values(openStates).every(Boolean);
        const newStates = {};
        for (const key in openStates) { newStates[key] = !allAreOpen; }
        setOpenStates(newStates);
    };
    const areAllInterviewsOpen = useMemo(() => Object.values(openStates).every(Boolean), [openStates]);
  
const printStyles = `
  /* --- 模拟打印模式的样式 --- */
  .print-mode-active .no-print {
    display: none !important;
  }
  
  /* --- 修改这里：所有section都可见，并且我们给它们之间加一点间距用于视觉区分 --- */
  .print-mode-active .printable-content-wrapper > section {
    display: block !important;
    padding-top: 2rem; /* 在预览模式下，用一点间距来区分章节 */
  }
  .print-mode-active .printable-content-wrapper > section:first-child {
      padding-top: 0; /* 第一个章节不需要上边距 */
  }

  /* ...其他 .print-mode-active 规则... */
  .print-mode-active .printable-avoid-break,
  .print-mode-active .interview-avoid-break { /* 把访谈记录的规则也合并进来 */
      break-inside: avoid;
      page-break-inside: avoid;
  }



  /* --- 保留部分：用于真正的打印操作 (当用户按 Ctrl+P) --- */
  @media print {
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .no-print {
      display: none !important;
    }
    body {
      background-color: #fff !important;
    }
    .force-print-block {
        display: block !important;
        max-height: none !important;
        overflow: visible !important;
    }
    .print-container {
      max-width: 100% !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 10px !important;
      box-shadow: none !important;
      border: none !important; 
    }
    .print:block {
      display: block !important;
    }
    .printable-content-wrapper > section {
      display: block !important;
    }

    .printable-avoid-break,
    .interview-avoid-break { /* 把访谈记录的规则也合并进来 */
        break-inside: avoid;
        page-break-inside: avoid;
    }
    
    .force-print-expand,
    .force-print-expand-interview {
        max-height: none !important;
        overflow: visible !important;
        height: auto !important;
    }
    .force-print-expand-interview {
        margin-top: 1.5rem !important;
        padding-top: 1.5rem !important;
        border-top-width: 1px !important;
    }
  }
`;

    return (
        <div className="bg-gray-50/50 min-h-screen">
            <style>{printStyles}</style>
            <div 
                className={`
                    w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 print-container
                    transition-all duration-300
                    ${isPrintMode ? 'max-w-full print-mode-active' : 'max-w-[80vw]'}
                `}
            >
                
                {/* --- 核心改动 2: 添加打印按钮 --- */}
                <div className="flex justify-end mb-4 no-print">
                  <button
                      // 修改 onClick 行为：切换 isPrintMode 的状态
                      onClick={() => setIsPrintMode(prev => !prev)}
                      className="bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          {/* 可以根据模式切换图标，这里为了简单先用一个 */}
                          <polyline points="6 9 6 2 18 2 18 9"></polyline>
                          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                          <rect x="6" y="14" width="12" height="8"></rect>
                      </svg>
                      {/* 根据 isPrintMode 状态动态显示文本 */}
                      {isPrintMode ? '返回阅读模式' : '进入打印预览'}
                  </button>
                </div>
                
                <h1 className="text-3xl sm:text-4xl font-bold text-center text-blue-900 mb-4">{surveyTopic ? `${surveyTopic} - 调查结果报告` : "调查结果报告"}</h1>
                <p className="text-center text-gray-500 mb-8 no-print">一份全面的用户洞察与数据分析报告</p>

                <div className="no-print">
                    <ReportTabs activeTab={activeTab} onTabClick={setActiveTab} />
                </div>

                {/* --- 核心改动 3: 所有内容始终渲染，用 CSS 控制显示/隐藏 --- */}
                <div className="mt-6 printable-content-wrapper">
                    <section className={`${(isPrintMode || activeTab === 'summary') ? 'block' : 'hidden'}`}>
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
                    
                    <section className={`${(isPrintMode || activeTab === 'suggestions') ? 'block' : 'hidden'}`}>
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

                    <section className={`${(isPrintMode || activeTab === 'stats') ? 'block' : 'hidden'}`}>
                        <StatsTab processedStats={processedStats} />
                    </section>

                    <section className={`${(isPrintMode || activeTab === 'interviews') ? 'block' : 'hidden'}`}>
                        <div className="no-print">
                            <InterviewsTab
                                interviews={interviews}
                                openStates={openStates}
                                handleToggleInterview={handleToggleInterview}
                                handleToggleAllInterviews={handleToggleAllInterviews}
                                areAllInterviewsOpen={areAllInterviewsOpen}
                            />
                        </div>

                        {/* B. 专门用于打印的部分 */}
                        <div className={`${isPrintMode ? 'block' : 'hidden'} print:block`}>
                            <h2 className="text-2xl font-bold text-blue-800 mb-6 pb-2 border-b border-gray-300">访谈记录</h2>
                            <div className="space-y-6">
                                {interviews.map((interview, originalIndex) => (
                                    <InterviewRecord
                                        key={`print-version-${interview.id || originalIndex}`}
                                        interview={interview}
                                        index={originalIndex}
                                        isOpen={true} // 打印时强制展开
                                        onToggle={() => {}}
                                        searchQuery={""} // 无高亮
                                        currentMatchId={null}
                                    />
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
            <BackToTopButton />
        </div>
    );
};
  
export default function SyntheticSurveyPage() {
    return (
        <SyntheticSurveyPageContainer />
    );
}

