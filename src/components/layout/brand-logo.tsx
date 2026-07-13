import { withBasePath } from "@/lib/runtime";

type BrandLogoProps = {
  imageClassName?: string;
  frameClassName?: string;
  href?: string;
};

export function BrandLogo({
  imageClassName = "h-12 w-auto max-w-[240px] object-contain",
  frameClassName = "flex h-[72px] items-center rounded-lg bg-white px-4 shadow-[0_12px_30px_rgba(15,23,42,0.08)]",
}: BrandLogoProps) {
  return (
    <div className={frameClassName}>
      <img
        src={withBasePath("/nextstep-logo.png")}
        alt="NextStep Global Educational Services"
        className={imageClassName}
      />
    </div>
  );
}
