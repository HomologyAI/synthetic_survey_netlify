import { useState, useEffect } from "react";

const TableOfContents = ({ data, interviewRecords }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [activeSection, setActiveSection] = useState("");
  const [structuredSections, setStructuredSections] = useState([]);

  // Parse structured text content to extract sections
  useEffect(() => {
    if (!data?.total_summary) {
      setStructuredSections([]);
      return;
    }

    const lines = data.total_summary.trim().replace(/\r\n/g, '\n').split('\n');
    const sections = [];
    
    // Regexes - same as StructuredTextRenderer
    const sectionHeaderStartRegex = /^(\d+)\.\s(.+)$/;
    const subsectionHeaderStartRegex = /^▍(.+)$/;
    
    let lastElementType = '';
    let startIndex = 1; // Skip title line
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        lastElementType = 'empty-line';
        continue;
      }

      // Check for subsection header
      const subsectionMatch = line.match(subsectionHeaderStartRegex);
      if (subsectionMatch) {
        const subsectionId = subsectionMatch[1].replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '').toLowerCase();
        sections.push({
          type: 'subsection',
          title: subsectionMatch[1],
          id: subsectionId
        });
        lastElementType = 'subsection-header';
        continue;
      }

      // Check for section header
      const numLineMatch = line.match(sectionHeaderStartRegex);
      if (numLineMatch) {
        const lineNumber = parseInt(numLineMatch[1]);
        
        // Same logic as StructuredTextRenderer to determine if it's a section header
        const isPlainOrderedListItem = 
          (lastElementType === 'subsection-header') ||
          (lineNumber === 1 && lastElementType === 'p' && i > 0 && !lines[i-1].trim().match(sectionHeaderStartRegex));

        if (!isPlainOrderedListItem) {
          const sectionId = numLineMatch[2].replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '').toLowerCase();
          sections.push({
            type: 'section',
            title: `${numLineMatch[1]}. ${numLineMatch[2]}`,
            id: sectionId,
            subsections: []
          });
          lastElementType = 'section-header';
          continue;
        }
      }

      lastElementType = 'p';
    }

    // Group subsections under their parent sections
    const groupedSections = [];
    let currentSection = null;

    sections.forEach(item => {
      if (item.type === 'section') {
        currentSection = { ...item, subsections: [] };
        groupedSections.push(currentSection);
      } else if (item.type === 'subsection' && currentSection) {
        currentSection.subsections.push(item);
      }
    });

    setStructuredSections(groupedSections);
  }, [data?.total_summary]);

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
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
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

            {/* 动态生成的结构化章节 */}
            {structuredSections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                <a
                  href={`#${section.id}`}
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "medium",
                    transition: "color 200ms",
                    color: activeSection === section.id ? "#3a7e6d" : "gray",
                    cursor: "pointer",
                    marginBottom: section.subsections.length > 0 ? "0.5rem" : "0",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#3a7e6d")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color =
                      activeSection === section.id ? "#3a7e6d" : "gray")
                  }
                >
                  {section.title}
                </a>
                
                {/* 子章节 */}
                {section.subsections.length > 0 && (
                  <div
                    style={{
                      marginLeft: "1rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.25rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {section.subsections.map((subsection, subsectionIndex) => (
                      <a
                        key={subsectionIndex}
                        href={`#${subsection.id}`}
                        style={{
                          display: "block",
                          fontSize: "0.75rem",
                          transition: "color 200ms",
                          color:
                            activeSection === subsection.id
                              ? "#3a7e6d"
                              : "#888",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "#3a7e6d")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color =
                            activeSection === subsection.id
                              ? "#3a7e6d"
                              : "#888")
                        }
                      >
                        ▍{subsection.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}

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