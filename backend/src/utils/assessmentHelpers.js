// helpers/assessmentHelpers.js
export const phqSeverity = (score) => {
  if (score >= 20) return "Severe";
  if (score >= 15) return "Moderately severe";
  if (score >= 10) return "Moderate";
  if (score >= 5) return "Mild";
  return "Minimal";
};

export const gadSeverity = (score) => {
  if (score >= 15) return "Severe";
  if (score >= 10) return "Moderate";
  if (score >= 5) return "Mild";
  return "Minimal";
};

export const ghqSeverity = (score) => {
  if (score >= 20) return "Severe distress";
  if (score >= 15) return "Moderate distress";
  if (score >= 10) return "Mild distress";
  return "Normal";
};
