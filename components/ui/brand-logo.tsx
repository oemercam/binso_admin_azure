import Image from "next/image";

type BrandLogoProps={
  variant?:"auto"|"black"|"white";
  compact?:boolean;
  className?:string;
  alt?:string;
  priority?:boolean;
};

export default function BrandLogo({
  variant="auto",
  compact=false,
  className="",
  alt="Binso",
  priority=false
}:BrandLogoProps){
  const black=compact
    ?"/brand/binso-icon-black.svg"
    :"/brand/binso-logo-black.svg";

  const white=compact
    ?"/brand/binso-icon-white.svg"
    :"/brand/binso-logo-white.svg";

  const imageClass=
    `binso-brand-image${compact?" compact":""}${className?` ${className}`:""}`;

  const common={
    width:compact?64:220,
    height:compact?64:64,
    priority,
    draggable:false as const
  };

  if(variant!=="auto"){
    return (
      <Image
        alt={alt}
        className={imageClass}
        src={variant==="white"?white:black}
        {...common}
      />
    );
  }

  return (
    <span className={`binso-brand-stack${compact?" compact":""}`}>
      <Image
        alt={alt}
        className={`${imageClass} brand-light-asset`}
        src={black}
        {...common}
      />
      <Image
        alt=""
        aria-hidden="true"
        className={`${imageClass} brand-dark-asset`}
        src={white}
        {...common}
      />
    </span>
  );
}
