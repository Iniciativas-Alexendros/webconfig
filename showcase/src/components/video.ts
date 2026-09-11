import { esc } from "../lib/render.js";

export interface VideoProps {
  src: string;
  autoplay: boolean;
  pauseControl: boolean;
  poster?: string;
  muted?: boolean;
  loop?: boolean;
}

export function render(p: VideoProps): string {
  const attrs = [
    "controls",
    p.poster ? `poster="${esc(p.poster)}"` : "",
    p.autoplay ? "autoplay" : "",
    p.muted || p.autoplay ? "muted" : "",
    p.loop ? "loop" : "",
    "playsinline",
    'preload="metadata"',
  ]
    .filter(Boolean)
    .join(" ");
  return `<div class="video-wrap"><video ${attrs} aria-label="Vídeo"><source src="${esc(p.src)}" type="video/mp4" /></video>${
    p.pauseControl ? `<p class="caption">Reproductor con controles nativos (pausa incluida).</p>` : ""
  }</div>`;
}

export const sample: VideoProps = { src: "assets/media/video.mp4", autoplay: false, pauseControl: true };
