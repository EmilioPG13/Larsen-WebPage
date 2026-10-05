import { useEffect, useState, type ImgHTMLAttributes } from 'react';
import { useT } from '../../i18n/useT';
import { resolveImage } from '../../utils/machineImage';

interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  src?: string | null;
  alt: string;
}

/**
 * Machine photo that never shows the browser's broken-image icon: the path is
 * normalized to the deployed file, and if it still fails to load the slot
 * falls back to a labelled placeholder so the card keeps its shape.
 */
const MachineImage = ({ src, alt, className = '', ...rest }: Props) => {
  const t = useT();
  const resolved = resolveImage(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [resolved]);

  if (!resolved || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="w-full min-h-[160px] flex flex-col items-center justify-center gap-1 text-center text-muted"
      >
        <span className="text-[15px] font-semibold text-text2">{alt}</span>
        <span className="text-[12px]">{t.mpage.noImage}</span>
      </div>
    );
  }

  return <img src={resolved} alt={alt} className={className} onError={() => setFailed(true)} {...rest} />;
};

export default MachineImage;
