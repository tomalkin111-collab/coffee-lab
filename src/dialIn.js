export function getRecommendation({ taste, flow }) {
  if (flow === "Too fast") {
    return {
      action: "Grind finer",
      detail:
        taste === "Bitter"
          ? "The shot ran fast but tastes bitter. Grind slightly finer, then reduce yield if bitterness remains."
          : "Slow the flow and add resistance. Move one small step finer, keeping everything else the same.",
      direction: "finer",
    };
  }

  if (flow === "Too slow") {
    return {
      action: "Grind coarser",
      detail:
        taste === "Sour"
          ? "The shot is slow yet sour. Go slightly coarser, then raise temperature if acidity still dominates."
          : "Open the flow with one small coarser adjustment. Keep dose and yield unchanged.",
      direction: "coarser",
    };
  }

  const tasteRules = {
    Sour: {
      action: "Increase yield",
      detail:
        "Push extraction a little further. Add 2–3 g of yield; if it stays sharp, raise temperature by 1°C.",
      direction: "increase",
    },
    Bitter: {
      action: "Reduce yield",
      detail:
        "Stop the shot 2–3 g earlier. If the finish is still dry, lower temperature by 1°C.",
      direction: "reduce",
    },
    Watery: {
      action: "Grind finer",
      detail:
        "Build more body with a small finer adjustment while keeping the same dose and yield.",
      direction: "finer",
    },
    Weak: {
      action: "Reduce yield",
      detail:
        "Use a tighter ratio for more intensity. Reduce yield by 3–4 g and taste again.",
      direction: "reduce",
    },
    Balanced: {
      action: "Keep the recipe",
      detail:
        "This shot is balanced with a normal flow. Repeat it before making another change.",
      direction: "repeat",
    },
  };

  return tasteRules[taste] || tasteRules.Balanced;
}
