import fs from "node:fs/promises";

const apiBase = "https://api.apify.com/v2";

function tokenParam() {
  const token = process.env.APIFY_TOKEN;
  return token ? `?token=${encodeURIComponent(token)}` : "";
}

export async function getActorInput<T>() {
  const storeId = process.env.APIFY_DEFAULT_KEY_VALUE_STORE_ID;
  if (storeId) {
    const response = await fetch(`${apiBase}/key-value-stores/${storeId}/records/INPUT${tokenParam()}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Could not read Apify input: ${response.status}`);
    return (await response.json()) as T;
  }

  try {
    return JSON.parse(await fs.readFile("input.json", "utf8")) as T;
  } catch {
    return null;
  }
}

export async function pushData(item: unknown) {
  const datasetId = process.env.APIFY_DEFAULT_DATASET_ID;
  if (!datasetId) {
    console.log(JSON.stringify(item));
    return;
  }

  const response = await fetch(`${apiBase}/datasets/${datasetId}/items${tokenParam()}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(item)
  });

  if (!response.ok) {
    throw new Error(`Could not push dataset item: ${response.status} ${await response.text()}`);
  }
}

export const log = {
  info(message: string, data?: Record<string, unknown>) {
    console.log(JSON.stringify({ level: "info", message, ...data }));
  },
  warning(message: string, data?: Record<string, unknown>) {
    console.warn(JSON.stringify({ level: "warning", message, ...data }));
  }
};
