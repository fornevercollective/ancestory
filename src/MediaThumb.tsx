import { useState } from "react";

type Props = {
  url: string | undefined;
  title: string;
};

/** Small square image; hides itself if the URL fails to load (hotlink/CORS). */
export function MediaThumb({ url, title }: Props) {
  const [hidden, setHidden] = useState(false);
  if (!url || hidden) return null;
  return (
    <img
      src={url}
      alt=""
      className="dual-thumb"
      width={40}
      height={40}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer-when-downgrade"
      title={title}
      onError={() => setHidden(true)}
    />
  );
}
