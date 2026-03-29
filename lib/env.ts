export function getBigModelConfig() {
  return {
    apiKey: process.env.BIGMODEL_API_KEY?.trim(),
    baseUrl:
      process.env.BIGMODEL_BASE_URL?.trim().replace(/\/$/, "") ||
      "https://open.bigmodel.cn/api/coding/paas/v4",
    model: process.env.BIGMODEL_MODEL?.trim().toLowerCase() || "glm-4.7"
  };
}

export function hasBigModelConfig() {
  const { apiKey, baseUrl, model } = getBigModelConfig();
  return Boolean(apiKey && baseUrl && model);
}
