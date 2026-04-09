import { useState } from "react";
import { FALLBACK_IMAGE } from "../../constants/media";

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
}

export default function SafeImage({ src, ...props }: Props) {
  const [imgSrc, setImgSrc] = useState(src || FALLBACK_IMAGE);

  return (
    <img
      {...props}
      src={imgSrc}
      onError={() => setImgSrc(FALLBACK_IMAGE)}
      loading="lazy"
    />
  );
}
