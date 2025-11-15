import React from "react";
import ReactDOM from "react-dom/client";
import Test from "./Test";  // your Test.tsx
// import "./index.css";       // optional global CSS

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Test />
  </React.StrictMode>
);