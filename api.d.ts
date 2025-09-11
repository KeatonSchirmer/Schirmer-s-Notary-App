// TypeScript type definition for apiRequest utility
export type ApiRequest = (
  endpoint: string,
  method?: string,
  data?: object | null,
  headers?: Record<string, string>
) => Promise<any>;

declare const apiRequest: ApiRequest;
export default apiRequest;
