// src/components/Icon.tsx
type IconProps = {
  src: string;
  alt?: string;
  size?: number;
};

export default function Icon({ src, alt = '', size = 32 }: IconProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      style={{ objectFit: 'contain' }}
    />
  );
}
