"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import MarkdownComponents from "../../demo/MarkdownComponents";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import response from "./data/None_1004_gemini-2.5-pro-preview-05-06_202506030048_yixing.json";
import TableOfContents from "../../demo/TableOfContents";
import remarkGfm from "remark-gfm";

const COLORS = [
  "#3a7e6d",
  "#f6bd60",
  "#7bc7b5",
  "#9fd6c8",
  "#c2e5dc",
  "#a8dadc",
  "#457b9d",
  "#1d3557",
];

function fixMarkdownStrong(text) {
  return text.replace(/(\*\*.*?\*\*)(?=[^\s\n])/g, "$1 ");
}

const CustomTooltip = ({ active, payload, total }) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const percentage =
      total > 0 ? ((value / total) * 100).toFixed(1) + "%" : "0%";
    return (
      <div
        className="custom-tooltip"
        style={{
          backgroundColor: "#fff",
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "4px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        }}
      >
        <p className="label" style={{ margin: "0 0 5px 0" }}>{`${payload[0].name}: ${value}`}</p>
        <p className="percentage" style={{ margin: "0" }}>{`(${percentage})`}</p>
      </div>
    );
  }
  return null;
};

const QuestionStats = ({ index, questionData, globalExpand }) => {
  const [showOptions, setShowOptions] = useState(false);
  useEffect(() => {
    if (typeof globalExpand === 'boolean') setShowOptions(globalExpand);
  }, [globalExpand]);
  const answers = questionData.answer || {};
  const answerKeys = Object.keys(answers);
  const answerCount = answerKeys.length;

  const prepareChartData = () => {
    if (!answers || Object.keys(answers).length === 0) return [];
    const chartData = Object.entries(answers).map(([label, value]) => {
      const orderMatch = label.match(/[①②③④⑤⑥⑦⑧⑨⑩]|(\d+)\s*/);
      const order = orderMatch ? orderMatch[0] : "";
      const orderMap = {
        "①": 1, "②": 2, "③": 3, "④": 4, "⑤": 5, "⑥": 6, "⑦": 7, "⑧": 8, "⑨": 9, "⑩": 10,
      };
      return {
        name: label,
        value: typeof value === "number" ? value : 0,
        order: orderMap[order] || parseInt(order) || 999,
      };
    });
    const chartType = chartData.length > 10 ? "bar" : "pie";
    return {
      data: chartData.map((item) => ({ name: item.name, value: item.value })),
      chartType,
    };
  };

  const chartInfo = prepareChartData();
  const chartData = Array.isArray(chartInfo)
    ? chartInfo
    : chartInfo?.data.sort((a, b) => b.value - a.value) || [];
  const chartType = chartInfo?.chartType || "bar";
  const total = chartData.reduce((sum, entry) => sum + entry.value, 0);
  const containerClassName = `question-section full-width-container`;
  const toggleOptions = () => setShowOptions(!showOptions);
  const renderLegend = (props) => {
    const { payload } = props;
    return (
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", marginRight: "5px" }}>
        {payload?.map((entry, index) => (
          <li key={`item-${index}`} style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ width: "10px", height: "10px", backgroundColor: entry.color, marginRight: "5px", flexShrink: 0 }} />
            <span style={{ fontSize: "12px" }}>{entry.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className={containerClassName} id={`question-${index}`}>
      <h3 className="question-title">{questionData.question}</h3>
      <div>
        {chartType === "pie" ? (
          <div style={{ display: "flex", alignItems: "center" }}>
            <div className="chart-container" style={{ position: "static", maxWidth: 600 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="49%"
                    cy={95}
                    labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                      const RADIAN = Math.PI / 180;
                      const angle = 2 * Math.PI * percent;
                      const useLine = angle < 0.52;
                      if (!useLine) {
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.7;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                          <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" style={{ fontSize: "14px", fontWeight: "bold" }}>
                            {`${(percent * 100).toFixed(1)}%`}
                          </text>
                        );
                      }
                    }}
                    outerRadius={95}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip total={total} />} />
                  <Legend layout="vertical" align="left" verticalAlign="middle" wrapperStyle={{ maxWidth: "50%", overflowWrap: "break-word" }} content={(props) => renderLegend(props)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1 }}>
              <div className="question-summary-box">
                <h4>结果分析与总结</h4>
                <div className="markdown-content">
                  <ReactMarkdown components={MarkdownComponents}>
                    {fixMarkdownStrong(questionData.summary)}
                  </ReactMarkdown>
                </div>
              </div>
              {answerCount > 0 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: "40px" }}>
                  <button className="toggle-btn" style={{ marginLeft: "auto" }} onClick={toggleOptions}>
                    {showOptions ? "隐藏选项" : `查看所有选项 (${answerCount}条)`}
                  </button>
                </div>
              )}
              {answerCount > 0 ? (
                <div className={showOptions ? "" : "hidden"}>
                  <ul className="comments-list">
                    {answerKeys.map((key, i) => {
                      const value = answers[key];
                      const displayValue = typeof value === "number" ? ` (${value}票)` : "";
                      return (
                        <li key={i} className="comment-item">
                          <strong>选项 {i + 1}:</strong> {key}
                          {displayValue}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <div className={showOptions ? "" : "hidden"}>
                  <p className="text-gray-500 italic mt-2">无详细选项数据。</p>
                </div>
              )}
            </div>
          </div>
        ) :
          <>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="horizontal"
                  margin={{ top: 20, right: 30, left: 10, bottom: 120 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} />
                  <XAxis
                    type="category"
                    dataKey="name"
                    height={60}
                    interval={0}
                    tick={props => {
                      const { x, y, payload } = props;
                      return (
                        <g transform={`translate(${x},${y})`}>
                          <text x={0} y={0} textAnchor="end" fontSize={10} fill="#666" transform="rotate(-45)" dy={12} dx={-2} style={{ cursor: 'pointer' }}>
                            <title>{payload.value}</title>
                            {payload.value}
                          </text>
                        </g>
                      );
                    }}
                  />
                  <YAxis type="number" />
                  <Tooltip content={<CustomTooltip total={total} />} />
                  <Bar dataKey="value" fill="#3a7e6d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <div className="question-summary-box">
                <h4>结果分析与总结</h4>
                <div className="markdown-content">
                  <ReactMarkdown components={MarkdownComponents}>
                    {fixMarkdownStrong(questionData.summary)}
                  </ReactMarkdown>
                </div>
              </div>
              {answerCount > 0 && (
                <button className="toggle-btn" onClick={toggleOptions}>
                  {showOptions ? "隐藏选项" : `查看所有选项 (${answerCount}条)`}
                </button>
              )}
              {answerCount > 0 ? (
                <div className={showOptions ? "" : "hidden"}>
                  <ul className="comments-list">
                    {answerKeys.map((key, i) => {
                      const value = answers[key];
                      const displayValue = typeof value === "number" ? ` (${value}票)` : "";
                      return (
                        <li key={i} className="comment-item">
                          <strong>选项 {i + 1}:</strong> {key}
                          {displayValue}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <div className={showOptions ? "" : "hidden"}>
                  <p className="text-gray-500 italic mt-2">无详细选项数据。</p>
                </div>
              )}
            </div>
          </>
        }
      </div>
    </div>
  );
};

const InterviewRecord = ({ interview, index }) => {
  const consumer = interview.consumer;
  const consumerGender =
    consumer.gender === "male"
      ? "男"
      : consumer.gender === "female"
        ? "女"
        : "其他";
  const consumerInfo = `${consumer.age}岁 ${consumerGender} ${consumer.region}`;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200" id={`interview-${index}`}>
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h3 className="text-xl font-semibold mb-2 text-gray-800">
          访谈记录 #{index + 1}: {consumer.name || "匿名"}
        </h3>
        <div className="text-sm text-gray-600">{consumerInfo}</div>
        {consumer.description && (
          <div className="text-sm text-gray-600 mt-1 italic">{consumer.description}</div>
        )}
      </div>
      <div className="mb-6">
        <h4 className="font-semibold mb-4 text-gray-700">访谈内容 (中文)</h4>
        {interview.cn_data && interview.cn_data.length > 0 ? (
          interview.cn_data.map((chat, chatIndex) => (
            <div key={chatIndex} className="mb-4">
              <div className="bg-blue-50 p-3 rounded-lg mb-2 shadow-sm" style={{ padding: "10px", letterSpacing: "1.5px" }}>
                <span className="font-semibold text-blue-800" style={{ fontSize: "16px", paddingRight: "5px", fontWeight: "bold" }}>问:</span>
                <span className="text-gray-700 ml-1">{chat.q}</span>
              </div>
              <div className="bg-green-50 p-3 rounded-lg ml-4 shadow-sm" style={{ padding: "10px", paddingTop: "5px", marginBottom: "5px" }}>
                <span className="font-semibold text-green-800" style={{ fontSize: "16px", paddingRight: "5px", fontWeight: "bold" }}>答:</span>
                <span className="text-gray-700 ml-1">{chat.a}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 italic">无中文访谈数据。</p>
        )}
      </div>
      {interview.summary && (
        <div className="mt-6">
          <h4 className="font-semibold mb-2 text-gray-700">访谈总结</h4>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <ReactMarkdown components={MarkdownComponents}>
              {fixMarkdownStrong(interview.summary)}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

const SyntheticSurveyPageContainer = () => {
  const data = response["results"];
  const interviews = response["interviewer_records"];
  const [globalExpand, setGlobalExpand] = useState(false);
  const reportStyles = `/* Basic styles for markdown */
  .markdown-content h1 { font-size: 1.5em; font-weight: bold; margin: 1em 0; }
  .markdown-content h2 { font-size: 1.3em; font-weight: bold; margin: 0.8em 0; }
  .markdown-content h3 { font-size: 1.1em; font-weight: bold; margin: 0.6em 0; }
  .markdown-content p { margin: 0.5em 0; }
  .markdown-content ul { list-style-type: disc; margin-left: 1.5em; margin-top: 0.5em; margin-bottom: 0.5em; }
  .markdown-content ol { list-style-type: decimal; margin-left: 1.5em; margin-top: 0.5em; margin-bottom: 0.5em; }
  .markdown-content blockquote { border-left: 4px solid #e5e7eb; padding-left: 1em; margin: 1em 0; color: #4b5563; }
  .markdown-content code { background-color: #f3f4f6; padding: 0.2em 0.4em; border-radius: 0.2em; }
  .markdown-content pre { background-color: #f3f4f6; padding: 1em; border-radius: 0.5em; overflow-x: auto; margin: 1em 0; }
  :root { --primary-color: #3a7e6d; --secondary-color: #f6bd60; --background-color: #f8f9fa; --text-color: #343a40; --border-color: #dee2e6; }
  .container { max-width: 1200px; margin: 0 auto; padding: 20px; background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); }
  h1 { color: var(--primary-color); text-align: center; margin-bottom: 30px; padding-bottom: 15px; border-bottom: 2px solid var(--secondary-color); }
  .summary-box { background-color: #e8f4f1; border-left: 5px solid var(--primary-color); padding: 15px; margin-bottom: 30px; border-radius: 4px; }
  .question-summary-box { background-color: #fffbeb; border-left: 5px solid var(--secondary-color); padding: 15px; margin-top: 15px; margin-bottom: 15px; border-radius: 4px; }
  .question-summary-box h4 { color: #b45309; font-weight: bold; margin-bottom: 10px; }
  .question-section { margin-bottom: 40px; padding: 20px; border: 1px solid var(--border-color); border-radius: 8px; background-color: white; break-inside: avoid; }
  .question-title { font-size: 1.3rem; color: var(--primary-color); margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid var(--border-color); align-self: stretch; }
  .chart-container { position: relative; height: 300px; width: 100%; margin-bottom: 20px; }
  .comments-list { list-style-type: none; padding-left: 0; margin-top: 15px; }
  .comment-item { padding: 10px 15px; margin-bottom: 8px; background-color: #f8f9fa; border-left: 3px solid var(--secondary-color); border-radius: 4px; font-size: 0.95em; }
  .comment-item strong { color: var(--primary-color); }
  .toggle-btn { background-color: var(--primary-color); color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; margin-top: 15px; margin-bottom: 10px; font-size: 0.9em; transition: background-color 0.2s; }
  .toggle-btn:hover { background-color: #2c5a4f; }
  .hidden { display: none; }
  .report-section { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 20px; }
  .pie-chart-container { grid-column: span 1; display: flex; flex-direction: column; align-items: center; justify-content: space-between; }
  .full-width-container { grid-column: 1 / -1 !important; width: 100%; }
  .full-width-container .chart-container { max-width: 100%; margin: 0 auto; }
  @media (max-width: 768px) { .report-section { grid-template-columns: 1fr; } .pie-chart-container, .full-width-container { grid-column: 1 / -1; } }
  @media print { body { padding: 0; margin: 0; } .container { box-shadow: none; border-radius: 0; padding: 10px; max-width: 100%; } h1 { font-size: 1.5rem; margin-bottom: 20px; padding-bottom: 10px; } .summary-box, .question-summary-box { margin-bottom: 20px; padding: 10px; } .question-section { border: 1px solid #ccc; margin-bottom: 20px; padding: 15px; } .question-title { font-size: 1.1rem; margin-bottom: 15px; padding-bottom: 8px; } .toggle-btn { display: none; } .hidden { display: block !important; } #interviewRecords { margin-top: 30px; } .chart-container { height: 250px; } script { display: none; } }`;
  return (
    <div>
      <style>{reportStyles}</style>
      <TableOfContents data={data} interviewRecords={interviews} />
      <div className="report-container">
        <h1 className="report-title" id="reportTitle">
          {data.raw_survey?.topic ? `${data.raw_survey.topic} - 调查结果报告` : "调查结果报告"}
        </h1>
        <div className="summary-section">
          <h2 className="text-[#3a7e6d] text-2xl font-bold mb-4 mt-10 border-b pb-2" id="totalAnalysis">总体分析</h2>
          <div className="summary-box">
            <ReactMarkdown components={MarkdownComponents}>
              {fixMarkdownStrong(data.total_summary || "*未提供总体总结。*")}
            </ReactMarkdown>
          </div>
          <h2 className="text-[#3a7e6d] text-2xl font-bold mb-4 mt-10 border-b pb-2" id="totalAnalysis">决策建议</h2>
          <div className="summary-box">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
              {fixMarkdownStrong(data.suggestion) || "*未提供总体总结。*"}
            </ReactMarkdown>
          </div>
        </div>
        <h2 className="text-[#3a7e6d] text-2xl font-bold mb-4 mt-10 border-b pb-2" id="detailedStats">详细统计</h2>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <button
            className="toggle-btn"
            style={{ minWidth: 160 }}
            onClick={() => setGlobalExpand(v => !v)}
          >
            {globalExpand ? '一键收起所有选项' : '一键展开所有选项'}
          </button>
        </div>
        <div className="report-section">
          {data.stats && Array.isArray(data.stats) ? (
            [...data.stats].map((questionData, index) => (
              <QuestionStats key={index} index={index} questionData={questionData} globalExpand={globalExpand} />
            ))
          ) : (
            <p><i>未提供有效的统计数据。</i></p>
          )}
        </div>
        <div style={{ paddingLeft: "20px", paddingRight: "20px", marginTop: "50px", marginBottom: "50px" }}>
          <h2 className="text-[#3a7e6d] text-2xl font-bold mb-4 mt-10 border-b pb-2" id="interviews">访谈记录</h2>
          {interviews && interviews.length > 0 ? (
            interviews.map((interview, index) => (
              <InterviewRecord key={index} interview={interview} index={index} />
            ))
          ) : (
            <p className="text-gray-500"><i>无详细访谈记录。</i></p>
          )}
        </div>
      </div>
    </div>
  );
};

export default function SyntheticSurveyPage() {
  return (
    <div>
      <SyntheticSurveyPageContainer />
    </div>
  );
}
