import { FALLBACK_IMAGE } from "../constants/media";

export const getImage = (src?: string | null) => {
  if (!src || src.trim() === "") return FALLBACK_IMAGE;
  return src;
};
