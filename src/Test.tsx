import React, { useRef, useState, useMemo, useEffect } from "react";
// @ts-ignore - canva-editor doesn't have proper type declarations
import { CanvaEditor, EditorConfig } from "canva-editor";
import { data as sampleData } from "./sampleData";
import { downloadObjectAsJson } from "../packages/editor/src/utils/download.ts";
import RightSidebar from "./RightSidebar";
import "./Test.css";

const extractTextFromHtml = (html: string): string => {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  return tempDiv.textContent || "";
};

const updateHtmlContent = (html: string, newText: string): string => {
  const regex = /(>)([^<]*)(<\/)/;
  return regex.test(html) ? html.replace(regex, `$1${newText}$3`) : html;
};

const editorConfig: EditorConfig = {
  apis: {
    url: "http://localhost:4000/api",
    searchFonts: "/fonts",
    searchTemplates: "/templates",
    searchTexts: "/texts",
    searchImages: "/images",
    searchShapes: "/shapes",
    searchFrames: "/frames",
    templateKeywordSuggestion: "/template-suggestion",
    textKeywordSuggestion: "/text-suggestion",
    imageKeywordSuggestion: "/image-suggestion",
    shapeKeywordSuggestion: "/shape-suggestion",
    frameKeywordSuggestion: "/frame-suggestion",
  },
  placeholders: {
    searchTemplate: "Search templates",
    searchText: "Search texts",
    searchImage: "Search images",
    searchShape: "Search shapes",
    searchFrame: "Search frames",
  },
  editorAssetsUrl: "http://localhost:4000/api/editor",
  imageKeywordSuggestions: "animal,sport,love,scene,dog,cat,whale",
  templateKeywordSuggestions:
    "mother,sale,discount,fashion,model,deal,motivation,quote",
};

const Test = () => {
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(true); // Start with sidebar open
  const [reloadFlag, setReloadFlag] = useState(false);
  const [editorData, setEditorData] = useState(sampleData);
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);

  const editorDataRef = useRef(editorData);
  useEffect(() => {
    editorDataRef.current = editorData;
  }, [editorData]);

  const stableData = useMemo(
    () => ({
      name: "",
      editorConfig: editorDataRef.current,
    }),
    [reloadFlag]
  );

  const handleExport = () => {
    try {
      downloadObjectAsJson("design", editorDataRef.current);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsedData = JSON.parse(text);
      setEditorData(parsedData);
      setReloadFlag((v) => !v);
      e.target.value = "";
    } catch (err) {
      console.error("Import failed:", err);
    }
  };

  const toggleFormPanel = () => setShowForm((prev) => !prev);

  const handleTextChange = (layerId: string, newText: string) => {
    const newData = JSON.parse(JSON.stringify(editorData));
    const layer = newData[selectedPageIndex].c[layerId];
    if (layer) {
      layer.g.v = updateHtmlContent(layer.g.v, newText);
      setEditorData(newData);
      editorDataRef.current = newData;
      setReloadFlag((v) => !v);
    }
  };

  const handleImageChange = (layerId: string, newUrl: string) => {
    const newData = JSON.parse(JSON.stringify(editorData));
    const layer = newData[selectedPageIndex].c[layerId];
    if (layer && layer.g?.p) {
      layer.g.p.aj = newUrl;
      layer.g.p.y = newUrl;
      setEditorData(newData);
      editorDataRef.current = newData;
      setReloadFlag((v) => !v);
    }
  };

  const handleImageUpload = (layerId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      handleImageChange(layerId, result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="test-container">
      <div className={`editor-section ${showForm ? 'with-sidebar' : 'without-sidebar'}`}>
        {/* Hidden file input for importing */}
        <input
          type="file"
          accept="application/json"
          id="importInput"
          style={{ display: "none" }}
          onChange={handleImport}
        />

        {/* Bottom Left Panel Toggle Button */}
        <div className="bottom-left-controls">
          <button
            className={`panel-toggle-bottom-btn ${showForm ? 'active' : ''}`}
            onClick={() => setShowForm(!showForm)}
            title={showForm ? "Hide editing panel" : "Show editing panel"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
            </svg>
            {showForm ? 'Hide Panel' : 'Show Panel'}
          </button>
        </div>

        {/* Inline Editing Hint */}
        <div className="inline-hint">
          💡 Double-click any text to edit inline
        </div>

        {/* Status Indicator */}
        {saving && (
          <div style={{
            position: "absolute",
            top: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(76, 175, 80, 0.95)",
            color: "white",
            padding: "8px 16px",
            borderRadius: "20px",
            fontSize: "14px",
            fontWeight: "500",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backdropFilter: "blur(10px)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)"
          }}>
            <span style={{ animation: "spin 1s linear infinite" }}></span>
            Changes saved automatically
          </div>
        )}



        {/* Canva Editor */}
        <div className="editor-wrapper" style={{ position: "relative" }}>
          <CanvaEditor
            key={reloadFlag ? "reload1" : "reload0"}
            data={stableData}
            config={editorConfig}
            saving={saving}
            onChanges={(currentData: any) => {
              editorDataRef.current = currentData;
              setEditorData(currentData);
              setSaving(true);
              setTimeout(() => setSaving(false), 1500);
            }}
          />
        </div>
      </div>

      {/* Editing Panel - Always render but control visibility */}
      <RightSidebar
        showForm={showForm}
        setShowForm={setShowForm}
        editorData={editorData}
        selectedPageIndex={selectedPageIndex}
        setSelectedPageIndex={setSelectedPageIndex}
        extractTextFromHtml={extractTextFromHtml}
        handleTextChange={handleTextChange}
        handleImageChange={handleImageChange}
        handleImageUpload={handleImageUpload}
      />
    </div>
  );
};

export default Test;
