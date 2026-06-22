declare module "expo-file-system" {
  export const cacheDirectory: string | null;
  export const documentDirectory: string | null;
  export function downloadAsync(
    uri: string,
    fileUri: string,
    options?: Record<string, unknown>,
  ): Promise<{ uri: string; status: number }>;
}
