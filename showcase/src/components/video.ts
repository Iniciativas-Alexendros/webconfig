import { esc, safeUrl } from "../lib/render.js";

export interface VideoProps {
  src: string;
  autoplay: boolean;
  pauseControl: boolean;
  poster?: string;
  muted?: boolean;
  loop?: boolean;
}

function mediaType(src: string): string {
  if (src.endsWith(".webm")) return "video/webm";
  if (src.endsWith(".ogv") || src.endsWith(".ogg")) return "video/ogg";
  return "video/mp4";
}

export function render(p: VideoProps): string {
  if (
    !p ||
    typeof p.src !== "string" ||
    !p.src ||
    typeof p.autoplay !== "boolean" ||
    typeof p.pauseControl !== "boolean"
  ) {
    return `<div class="badge" data-tone="danger">Video: src, autoplay y pauseControl requeridos</div>`;
  }
  if (p.autoplay && !p.pauseControl) {
    return `<div class="badge" data-tone="danger">Video: autoplay exige pauseControl (WCAG 2.2.2)</div>`;
  }
  const src = safeUrl(p.src, "#");
  const attrs = [
    "controls",
    p.poster ? `poster="${esc(safeUrl(p.poster, "#"))}"` : "",
    p.autoplay ? "autoplay" : "",
    p.muted || p.autoplay ? "muted" : "",
    p.loop ? "loop" : "",
    "playsinline",
    'preload="metadata"',
  ]
    .filter(Boolean)
    .join(" ");
  return `<div class="video-wrap"><video ${attrs} aria-label="Vídeo demostrativo"><source src="${esc(src)}" type="${mediaType(src)}" /><track kind="captions" srclang="es" label="Español" src="data:text/vtt,WEBVTT" /></video>${
    p.pauseControl ? `<p class="caption">Reproductor con controles nativos (pausa incluida).</p>` : ""
  }</div>`;
}

export const sample: VideoProps = { src: "assets/media/video.mp4", autoplay: false, pauseControl: true };
