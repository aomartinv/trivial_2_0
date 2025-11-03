import React, { useState, useEffect } from "react";

const lightenColor = (color, percent) => {
  try {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;
    return (
      "#" +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
  } catch {
    return "#cccccc";
  }
};

const PlayerBoxes = ({ playerName, categories }) => {
  const [boxStates, setBoxStates] = useState({});

  useEffect(() => {
    const initState = {};
    categories.forEach((cat) => {
      initState[cat.name] = false;
    });
    setBoxStates(initState);
  }, [categories]);

  const toggleBox = (name) => {
    setBoxStates((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-2">{playerName}</h2>
      <div className="grid grid-cols-3 gap-2">
        {categories.map((cat) => {
          const isActive = boxStates[cat.name];
          const baseColor = cat.color || "#888";
          const paleColor = lightenColor(baseColor, 60);

          return (
            <div
              key={cat.name}
              onClick={() => toggleBox(cat.name)}
              className={`cursor-pointer rounded-lg border-2 transition-all duration-200 text-center p-2 text-sm select-none`}
              style={{
                borderColor: baseColor,
                backgroundColor: isActive ? baseColor : paleColor,
                color: isActive ? "white" : "#333",
              }}
            >
              {cat.name}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlayerBoxes;
