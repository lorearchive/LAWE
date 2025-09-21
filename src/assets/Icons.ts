import  icons  from "./iconsBank";

export function getIconMarkup(name: IconName, options: { size?: number, className?: string, color?: string }): string {
    const raw = icons[name] as string;
    if (!raw) return '';


    const { size = 24, className = '', color } = options ?? {};

    return raw.replace(/<svg /, `<svg id="lawe-icon-svg" class="${className}" width="${size}" height="${size}" fill="${color ?? 'none'}" `);

}
export type IconName = keyof typeof icons
export default icons