import { useState, useEffect } from "react";

const TableOfContents = ({ data, interviewRecords }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [activeSection, setActiveSection] = useState("");

  // 监听滚动，更新当前激活的章节
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll("[id]");
      const scrollPosition = window.scrollY + 100;

      sections.forEach((section) => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;

        if (
          scrollPosition >= sectionTop &&
          scrollPosition < sectionTop + sectionHeight
        ) {
          setActiveSection(section.id);
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        left: isVisible ? "0" : "-16rem",
        top: "1.5rem",
        zIndex: 50,
        transition: "left 300ms",
      }}
    >
      {/* 切换按钮 */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          position: "absolute",
          right: "-3rem",
          top: 0,
          backgroundColor: "#3a7e6d",
          color: "white",
          padding: "0.5rem",
          borderRadius: "9999px",
          transition: "background-color 200ms",
          cursor: "pointer",
          border: "none",
          outline: "none",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "#2c5a4f")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "#3a7e6d")
        }
      >
        {isVisible ? "←" : "→"}
      </button>

      {/* 目录内容 */}
      <div
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(10px)",
          width: "16rem",
          borderRadius: "0.75rem",
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          transition: "all 300ms",
          overflow: "hidden",
          opacity: isVisible ? 1 : 0,
          maxHeight: isVisible ? "calc(100vh - 4rem)" : 0,
        }}
      >
        <div
          style={{
            padding: "1.5rem",
            overflowY: "auto",
            maxHeight: "calc(100vh - 4rem)",
          }}
        >
          <h3
            style={{
              fontSize: "1.125rem",
              fontWeight: "bold",
              marginBottom: "1.5rem",
              paddingBottom: "0.5rem",
              borderBottom: "1px solid rgba(58, 126, 109, 0.2)",
            }}
          >
            目录
          </h3>

          <nav
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {/* 报告标题 */}
            <a
              href="#reportTitle"
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "medium",
                transition: "color 200ms",
                color: activeSection === "reportTitle" ? "#3a7e6d" : "gray",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#3a7e6d")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color =
                  activeSection === "reportTitle" ? "#3a7e6d" : "gray")
              }
            >
              报告标题
            </a>

            {/* 总体分析 */}
            <div>
              <a
                href="#totalAnalysis"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "medium",
                  transition: "color 200ms",
                  color: activeSection === "totalAnalysis" ? "#3a7e6d" : "gray",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#3a7e6d")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color =
                    activeSection === "totalAnalysis" ? "#3a7e6d" : "gray")
                }
              >
                总体分析
              </a>
            </div>

            {/* 详细统计 */}
            <div>
              <a
                href="#detailedStats"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "medium",
                  marginBottom: "0.5rem",
                  transition: "color 200ms",
                  color: activeSection === "detailedStats" ? "#3a7e6d" : "gray",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#3a7e6d")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color =
                    activeSection === "detailedStats" ? "#3a7e6d" : "gray")
                }
              >
                详细统计
              </a>
              <div
                style={{
                  marginLeft: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                {data?.stats?.map((stat, index) => (
                  <a
                    key={index}
                    href={`#question-${index}`}
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      transition: "color 200ms",
                      color:
                        activeSection === `question-${index}`
                          ? "#3a7e6d"
                          : "gray",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#3a7e6d")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color =
                        activeSection === `question-${index}`
                          ? "#3a7e6d"
                          : "gray")
                    }
                  >
                    {stat.question}
                  </a>
                ))}
              </div>
            </div>

            {/* 访谈记录 */}
            <div>
              <a
                href="#interviews"
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "medium",
                  marginBottom: "0.5rem",
                  transition: "color 200ms",
                  color: activeSection === "interviews" ? "#3a7e6d" : "gray",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#3a7e6d")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color =
                    activeSection === "interviews" ? "#3a7e6d" : "gray")
                }
              >
                访谈记录
              </a>
              <div
                style={{
                  marginLeft: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                {interviewRecords?.map((interview, index) => (
                  <a
                    key={index}
                    href={`#interview-${index}`}
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      transition: "color 200ms",
                      color:
                        activeSection === `interview-${index}`
                          ? "#3a7e6d"
                          : "gray",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#3a7e6d")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color =
                        activeSection === `interview-${index}`
                          ? "#3a7e6d"
                          : "gray")
                    }
                  >
                    访谈 #{index + 1}: {interview.consumer.name || "匿名"}
                  </a>
                ))}
              </div>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default TableOfContents;
