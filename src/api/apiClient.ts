/**
 * 通用 Fetch 封裝函數
 * @param url API 路徑
 * @param options Fetch 選項 (method, body, headers 等)
 */
export async function REQUEST<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      // 可依情況加入：headers，例如 Authorization
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP Error: ${response.status}`);
    }

    // 針對 DELETE 或空回傳處理
    if (response.status === 204) return {} as T;

    return await response.json();
  } catch (error) {
    console.error(`[API Error] URL: ${url}`, error);
    throw error;
  }
}
