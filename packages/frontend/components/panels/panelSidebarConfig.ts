/**
 * Panel sidebar'ının ölçüleri. TEK KAYNAK: genişlik hem `PanelShell`'de CSS
 * değişkeni olarak, hem `PanelSidebar`'da önizlemenin kapanma eşiği olarak
 * kullanılıyor. İkisi ayrışırsa önizleme ya erken kapanır ya da imleç
 * sidebar'dan çıktığı hâlde açık kalır.
 */
const PANEL_SIDEBAR_WIDTH_REM = 17

/** `--sidebar-width` — shadcn'in 16rem varsayılanı bu panellerde dar kalıyordu. */
export const PANEL_SIDEBAR_WIDTH = `${PANEL_SIDEBAR_WIDTH_REM}rem`

/**
 * İmleç bu x koordinatının (px) sağına geçtiğinde önizleme kapanır: sidebar
 * genişliği + 1rem tolerans. Kök yazı boyutu varsayılan 16px kabul edilir;
 * eşik bir his ayarı olduğu için birkaç px sapma görünmez.
 */
export const PANEL_SIDEBAR_PEEK_CLOSE_X = (PANEL_SIDEBAR_WIDTH_REM + 1) * 16
