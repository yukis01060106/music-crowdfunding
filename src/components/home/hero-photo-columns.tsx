import { Photo } from "@/components/ui/photo";
import { Sticker } from "@/components/ui/shapes";

// 自然光の人物カットと、レコードやマイクの素材カットを交互に流す
const LEFT = ["/images/ukulele-pink.jpg", "/images/vinyl-purple.jpg", "/images/guitar-bed.jpg", "/images/headphones-green.jpg", "/images/mic-white.jpg"];
const RIGHT = ["/images/plants-smile.jpg", "/images/ukulele-hat.jpg", "/images/vinyl-white.jpg", "/images/keyboard-room.jpg", "/images/guitar-beach.jpg"];

/** 2列の写真が上下逆向きにゆっくり流れるヒーロー */
export function HeroPhotoColumns() {
  return (
    <div className="relative h-[460px] overflow-hidden sm:h-[640px]">
      <div className="grid h-full grid-cols-2 gap-2 sm:gap-3">
        {[LEFT, RIGHT].map((photos, col) => (
          <div key={col} className="overflow-hidden">
            <div className={`${col === 0 ? "animate-marquee-up" : "animate-marquee-down"} flex flex-col gap-2 sm:gap-3`}>
              {[...photos, ...photos].map((src, i) => (
                <div key={`${src}-${i}`} className="relative aspect-[2/3] w-full shrink-0 bg-stone-100">
                  <Photo src={src} alt="" sizes="(min-width: 1024px) 260px, 50vw" priority={i < 2} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Sticker shape="circle" color="yellow" size={64} float className="right-4 top-10" />
      <Sticker shape="square" color="blue" size={28} rotate={20} float className="right-16 top-24" />
      <Sticker shape="triangle" color="purple" size={54} float className="left-[46%] top-1/2" />
      <Sticker shape="square" color="teal" size={46} rotate={-15} float className="bottom-16 left-3" />
      <Sticker shape="dot" color="pink" size={30} className="bottom-8 left-16" />
    </div>
  );
}
