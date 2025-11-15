import React, { useMemo, useState, useEffect, useCallback } from "react";

interface RightSidebarProps {
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  editorData: any[];
  selectedPageIndex: number;
  setSelectedPageIndex: (index: number) => void;
  extractTextFromHtml: (html: string) => string;
  handleTextChange: (layerId: string, newText: string) => void;
  handleImageChange: (layerId: string, newUrl: string) => void;
  handleImageUpload: (layerId: string, file: File) => void;
}

const RightSidebar: React.FC<RightSidebarProps> = ({
  showForm,
  setShowForm,
  editorData,
  selectedPageIndex,
  setSelectedPageIndex,
  extractTextFromHtml,
  handleTextChange,
  handleImageChange,
  handleImageUpload,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'images'>('text');
  const [textInputs, setTextInputs] = useState<Record<string, string>>({});
  const [textTimeouts, setTextTimeouts] = useState<Record<string, NodeJS.Timeout>>({});

  const textLayers = useMemo(() => {
    const layers = editorData[selectedPageIndex]?.c || {};
    return Object.entries(layers)
      .filter(([_, value]: [string, any]) => value?.e?.f === "TextLayer")
      .map(([key, value]: [string, any], index) => {
        const text = extractTextFromHtml(value.g.v);
        return {
          id: key,
          text,
          displayName: text.length > 20 ? text.substring(0, 20) + "..." : text || `Text ${index + 1}`,
          fullText: text
        };
      });
  }, [editorData, selectedPageIndex]);

  // Sync textInputs with textLayers when data changes
  useEffect(() => {
    const newTextInputs: Record<string, string> = {};
    textLayers.forEach(layer => {
      // Only update if we don't have this layer in our local state yet
      if (!(layer.id in textInputs)) {
        newTextInputs[layer.id] = layer.fullText;
      }
    });

    if (Object.keys(newTextInputs).length > 0) {
      setTextInputs(prev => ({ ...prev, ...newTextInputs }));
    }
  }, [textLayers]);

  // Debounced text change handler
  const handleDebouncedTextChange = useCallback((layerId: string, newText: string) => {
    // Update local state immediately
    setTextInputs(prev => ({ ...prev, [layerId]: newText }));

    // Clear existing timeout for this layer
    if (textTimeouts[layerId]) {
      clearTimeout(textTimeouts[layerId]);
    }

    // Set new timeout to call actual handler after 300ms of no typing
    const timeoutId = setTimeout(() => {
      handleTextChange(layerId, newText);
      setTextTimeouts(prev => {
        const updated = { ...prev };
        delete updated[layerId];
        return updated;
      });
    }, 300);

    setTextTimeouts(prev => ({ ...prev, [layerId]: timeoutId }));
  }, [handleTextChange, textTimeouts]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(textTimeouts).forEach(timeout => clearTimeout(timeout));
    };
  }, [textTimeouts]);

  const imageLayers = useMemo(() => {
    const layers = editorData[selectedPageIndex]?.c || {};
    return Object.entries(layers)
      .filter(([_, value]: [string, any]) => value?.g?.p?.aj && typeof value.g.p.aj === "string")
      .map(([key, value]: [string, any], index) => ({
        id: key,
        url: value.g.p.aj,
        originalUrl: value.g.p.y,
        displayName: `Photo ${index + 1}`
      }));
  }, [editorData, selectedPageIndex]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        height: "100vh",
        width: 380,
        background: "#ffffff",
        boxShadow: "-4px 0 20px rgba(0,0,0,0.1)",
        zIndex: 1000,
        display: showForm ? "flex" : "none", // Hide/show based on showForm prop
        flexDirection: "column",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        transform: showForm ? "translateX(0)" : "translateX(100%)", // Slide animation
        transition: "transform 0.3s ease",
      }}
    >
      {/* Header with Close Button */}
      <div
        style={{
          padding: "20px",
          borderBottom: "1px solid #e5e7eb",
          background: "#f9fafb",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start"
        }}
      >
        <div>
          <h2 style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 600,
            color: "#1f2937",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>

            Edit Your Template
          </h2>
          <p style={{
            margin: "4px 0 0 0",
            fontSize: 14,
            color: "#6b7280"
          }}>
            Edit text using the panels below, or switch to Quick Edit mode in the toolbar
          </p>
        </div>

        <button
          onClick={() => setShowForm(false)}
          style={{
            background: "none",
            border: "none",
            fontSize: "20px",
            cursor: "pointer",
            color: "#9ca3af",
            padding: "4px",
            borderRadius: "4px",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px"
          }}
          onMouseOver={(e) => {
            (e.target as HTMLButtonElement).style.color = "#ef4444";
            (e.target as HTMLButtonElement).style.backgroundColor = "#fee2e2";
          }}
          onMouseOut={(e) => {
            (e.target as HTMLButtonElement).style.color = "#9ca3af";
            (e.target as HTMLButtonElement).style.backgroundColor = "transparent";
          }}
          title="Close editing panel"
        >
          ✕
        </button>
      </div>

      {/* Simple Tabs */}
      <div style={{
        display: "flex",
        borderBottom: "1px solid #e5e7eb",
        background: "#f9fafb"
      }}>
        <button
          onClick={() => setActiveTab('text')}
          style={{
            flex: 1,
            padding: "12px",
            border: "none",
            background: activeTab === 'text' ? '#ffffff' : 'transparent',
            color: activeTab === 'text' ? '#3b82f6' : '#6b7280',
            fontWeight: activeTab === 'text' ? 600 : 400,
            fontSize: 14,
            cursor: "pointer",
            borderBottom: activeTab === 'text' ? '2px solid #3b82f6' : '2px solid transparent',
            transition: "all 0.2s ease"
          }}
        >
          📝 Text ({textLayers.length})
        </button>
        <button
          onClick={() => setActiveTab('images')}
          style={{
            flex: 1,
            padding: "12px",
            border: "none",
            background: activeTab === 'images' ? '#ffffff' : 'transparent',
            color: activeTab === 'images' ? '#3b82f6' : '#6b7280',
            fontWeight: activeTab === 'images' ? 600 : 400,
            fontSize: 14,
            cursor: "pointer",
            borderBottom: activeTab === 'images' ? '2px solid #3b82f6' : '2px solid transparent',
            transition: "all 0.2s ease"
          }}
        >
          🖼️ Images ({imageLayers.length})
        </button>
      </div>

      {/* Page Selector - only show if multiple pages */}
      {editorData.length > 1 && (
        <div style={{
          padding: "12px 20px",
          background: "#fef3c7",
          borderBottom: "1px solid #fbbf24"
        }}>
          <p style={{
            margin: "0 0 8px 0",
            fontSize: 12,
            color: "#92400e",
            fontWeight: 500
          }}>
            📄 Select Page:
          </p>
          <div style={{ display: "flex", gap: 6 }}>
            {editorData.map((_, pageIndex) => (
              <button
                key={pageIndex}
                onClick={() => setSelectedPageIndex(pageIndex)}
                style={{
                  padding: "4px 12px",
                  borderRadius: 16,
                  border: "none",
                  background: selectedPageIndex === pageIndex ? "#3b82f6" : "#e5e7eb",
                  color: selectedPageIndex === pageIndex ? "white" : "#374151",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 500,
                  transition: "all 0.2s ease"
                }}
              >
                {pageIndex + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content Area */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "20px"
      }}>
        {/* Text Tab Content */}
        {activeTab === 'text' && (
          <div>
            {textLayers.length > 0 ? (
              <>
                <div style={{ marginBottom: "16px" }}>
                  <p style={{
                    margin: 0,
                    fontSize: 14,
                    color: "#6b7280",
                    textAlign: "center"
                  }}>
                    ✏️ Click any text box to edit
                  </p>
                </div>

                {textLayers.map((layer, index) => (
                  <div
                    key={layer.id}
                    style={{
                      marginBottom: 16,
                      background: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      borderRadius: 8,
                      overflow: "hidden"
                    }}
                  >
                    <div style={{
                      padding: "12px 16px",
                      background: "#f3f4f6",
                      borderBottom: "1px solid #e5e7eb",
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#374151",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}>
                      <span style={{
                        background: "#3b82f6",
                        color: "white",
                        padding: "2px 8px",
                        borderRadius: 12,
                        fontSize: 11
                      }}>
                        {index + 1}
                      </span>
                      {layer.displayName}
                    </div>

                    <div style={{ padding: "16px" }}>
                      <textarea
                        value={textInputs[layer.id] || layer.fullText}
                        onChange={(e) => handleDebouncedTextChange(layer.id, e.target.value)}
                        placeholder="Enter your text here..."
                        style={{
                          width: "100%",
                          minHeight: 80,
                          padding: "12px",
                          border: "1px solid #d1d5db",
                          borderRadius: 6,
                          fontSize: 14,
                          fontFamily: "inherit",
                          resize: "vertical",
                          background: "white",
                          color: "#1f2937"
                        }}
                      />
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div style={{
                textAlign: "center",
                padding: "40px 20px",
                color: "#9ca3af"
              }}>
                <span style={{ fontSize: "48px", display: "block", marginBottom: "16px" }}>📝</span>
                <p style={{ margin: 0, fontSize: 16 }}>No text elements found</p>
                <p style={{ margin: "8px 0 0 0", fontSize: 14 }}>
                  Text elements will appear here when available
                </p>
              </div>
            )}
          </div>
        )}

        {/* Images Tab Content */}
        {activeTab === 'images' && (
          <div>
            {imageLayers.length > 0 ? (
              <>
                <div style={{ marginBottom: "16px" }}>
                  <p style={{
                    margin: 0,
                    fontSize: 14,
                    color: "#6b7280",
                    textAlign: "center"
                  }}>
                    🖼️ Replace images by uploading or pasting links
                  </p>
                </div>

                {imageLayers.map((layer, index) => (
                  <div
                    key={layer.id}
                    style={{
                      marginBottom: 20,
                      background: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      borderRadius: 8,
                      overflow: "hidden"
                    }}
                  >
                    <div style={{
                      padding: "12px 16px",
                      background: "#f3f4f6",
                      borderBottom: "1px solid #e5e7eb",
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#374151",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}>
                      <span style={{
                        background: "#10b981",
                        color: "white",
                        padding: "2px 8px",
                        borderRadius: 12,
                        fontSize: 11
                      }}>
                        {index + 1}
                      </span>
                      {layer.displayName}
                    </div>

                    <div style={{ padding: "16px" }}>
                      <img
                        src={layer.url}
                        alt={layer.displayName}
                        style={{
                          width: "100%",
                          height: "120px",
                          objectFit: "cover",
                          borderRadius: 6,
                          marginBottom: 12,
                          border: "1px solid #e5e7eb"
                        }}
                      />

                      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(layer.id, file);
                          }}
                          style={{ display: "none" }}
                          id={`upload-${layer.id}`}
                        />
                        <button
                          onClick={() => document.getElementById(`upload-${layer.id}`)?.click()}
                          style={{
                            flex: 1,
                            padding: "10px 16px",
                            background: "#3b82f6",
                            color: "white",
                            border: "none",
                            borderRadius: 6,
                            fontSize: 14,
                            fontWeight: 500,
                            cursor: "pointer",
                            transition: "background-color 0.2s ease"
                          }}
                          onMouseOver={(e) => ((e.target as HTMLButtonElement).style.backgroundColor = "#2563eb")}
                          onMouseOut={(e) => ((e.target as HTMLButtonElement).style.backgroundColor = "#3b82f6")}
                        >
                          📁 Upload Image
                        </button>
                      </div>

                      <input
                        type="text"
                        value={layer.url}
                        onChange={(e) => handleImageChange(layer.id, e.target.value)}
                        placeholder="Or paste image URL here..."
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #d1d5db",
                          borderRadius: 6,
                          fontSize: 14,
                          background: "white",
                          color: "#1f2937"
                        }}
                      />
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div style={{
                textAlign: "center",
                padding: "40px 20px",
                color: "#9ca3af"
              }}>
                <span style={{ fontSize: "48px", display: "block", marginBottom: "16px" }}>🖼️</span>
                <p style={{ margin: 0, fontSize: 16 }}>No images found</p>
                <p style={{ margin: "8px 0 0 0", fontSize: 14 }}>
                  Image elements will appear here when available
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RightSidebar;
