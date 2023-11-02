import m from "mithril";
import { LayerStyle } from "c2app-models-utils";

export const layerStylesSvc = async (): Promise<LayerStyle<Record<string, any>>[]> => {
  const baseUrl = process.env.SERVER_URL;
  return await m.request<LayerStyle<Record<string, any>>[]>(`${baseUrl}/layer_styles/index.json`);
};
