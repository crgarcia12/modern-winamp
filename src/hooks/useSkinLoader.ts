// Real Winamp .wsz skin loader. .wsz files are ZIP archives containing
// the classic bitmap sprites (MAIN.BMP, CBUTTONS.BMP, …). We unzip with JSZip
// and rebind the sprite URLs that our CSS references via CSS variables.
import JSZip from 'jszip';

export interface WinampSkin {
  name: string;
  files: Record<string, string>; // lowercased filename -> data URL
}

// Files we care about (case-insensitive). Keys are the canonical names
// matching what's in /public/skins/base/.
const SKIN_FILES = [
  'MAIN.BMP',
  'CBUTTONS.BMP',
  'titlebar.bmp',
  'numbers.bmp',
  'nums_ex.bmp',
  'text.bmp',
  'POSBAR.BMP',
  'volume.bmp',
  'BALANCE.BMP',
  'SHUFREP.BMP',
  'MONOSTER.BMP',
  'PLAYPAUS.BMP',
  'Eqmain.bmp',
  'eq_ex.bmp',
  'Pledit.bmp',
  'gen.bmp',
  'genex.bmp',
];

// Map lowercased candidate names to the canonical sprite names we use
const lcMap: Record<string, string> = SKIN_FILES.reduce((acc, n) => {
  acc[n.toLowerCase()] = n;
  return acc;
}, {} as Record<string, string>);

const fileToDataUrl = (blob: Blob, mime: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(new Blob([blob], { type: mime }));
  });

const getMime = (name: string): string => {
  const ext = name.toLowerCase().split('.').pop();
  if (ext === 'bmp') return 'image/bmp';
  if (ext === 'png') return 'image/png';
  if (ext === 'cur') return 'image/x-win-bitmap';
  return 'application/octet-stream';
};

async function parseWSZ(file: File | Blob, name = 'skin.wsz'): Promise<WinampSkin> {
  const zip = await JSZip.loadAsync(file);
  const out: Record<string, string> = {};
  await Promise.all(
    Object.keys(zip.files).map(async (path) => {
      const entry = zip.files[path];
      if (entry.dir) return;
      const base = path.split('/').pop()!.toLowerCase();
      const canonical = lcMap[base];
      if (!canonical) return;
      const blob = await entry.async('blob');
      out[canonical] = await fileToDataUrl(blob, getMime(canonical));
    })
  );
  return { name, files: out };
}

// Apply skin by injecting CSS that overrides the background-image of each
// sprite class. We use the data URLs from the .wsz instead of /skins/base/.
function injectSkinCss(skin: WinampSkin) {
  const id = 'winamp-skin-style';
  document.getElementById(id)?.remove();
  const style = document.createElement('style');
  style.id = id;

  const rules: string[] = [];
  const url = (n: string) => skin.files[n];

  if (url('MAIN.BMP'))      rules.push(`.winamp{background-image:url('${url('MAIN.BMP')}')!important}`);
  if (url('CBUTTONS.BMP'))  rules.push(`.wa-cbtn{background-image:url('${url('CBUTTONS.BMP')}')!important}`);
  if (url('titlebar.bmp')) {
    rules.push(`.wa-titlebar,.wa-tb-btn{background-image:url('${url('titlebar.bmp')}')!important}`);
  }
  if (url('numbers.bmp'))   rules.push(`.wa-digit{background-image:url('${url('numbers.bmp')}')!important}`);
  if (url('POSBAR.BMP'))    rules.push(`.wa-pos,.wa-pos-thumb{background-image:url('${url('POSBAR.BMP')}')!important}`);
  if (url('volume.bmp'))    rules.push(`.wa-volume,.wa-volume-thumb{background-image:url('${url('volume.bmp')}')!important}`);
  if (url('BALANCE.BMP'))   rules.push(`.wa-balance,.wa-balance-thumb{background-image:url('${url('BALANCE.BMP')}')!important}`);
  if (url('SHUFREP.BMP')) {
    rules.push(`.wa-eq-btn,.wa-pl-btn,.wa-shuffle,.wa-repeat{background-image:url('${url('SHUFREP.BMP')}')!important}`);
  }
  if (url('MONOSTER.BMP')) rules.push(`.wa-mono,.wa-stereo,.wa-monoster{background-image:url('${url('MONOSTER.BMP')}')!important}`);
  if (url('PLAYPAUS.BMP')) rules.push(`.wa-status{background-image:url('${url('PLAYPAUS.BMP')}')!important}`);
  if (url('Eqmain.bmp')) {
    rules.push(`.eq-window,.eq-on,.eq-auto,.eq-thumb{background-image:url('${url('Eqmain.bmp')}')!important}`);
  }
  if (url('Pledit.bmp')) {
    rules.push(`.pl-tb-left,.pl-tb-mid,.pl-tb-right,.pl-edge-left,.pl-edge-right,.pl-bottom-left,.pl-bottom-mid,.pl-bottom-right{background-image:url('${url('Pledit.bmp')}')!important}`);
  }

  style.textContent = rules.join('\n');
  document.head.appendChild(style);
}

export const useSkinLoader = () => {
  const loadSkin = async (file: File): Promise<WinampSkin | null> => {
    try {
      const lower = file.name.toLowerCase();
      if (lower.endsWith('.wsz') || lower.endsWith('.zip')) {
        return await parseWSZ(file, file.name);
      }
      // Single image fallback: treat as MAIN.BMP only
      if (file.type.startsWith('image/')) {
        const url = await fileToDataUrl(file, file.type);
        return { name: file.name, files: { 'MAIN.BMP': url } };
      }
      console.warn('Unsupported skin format:', file.name);
      return null;
    } catch (err) {
      console.error('Failed to load skin:', err);
      return null;
    }
  };

  const applySkin = (skin: WinampSkin) => injectSkinCss(skin);

  const resetToDefaultSkin = () => {
    document.getElementById('winamp-skin-style')?.remove();
  };

  return { loadSkin, applySkin, resetToDefaultSkin };
};

// Re-export for legacy imports (no-op default coords kept for compat)
export const DEFAULT_SKIN_COORDS = {};
