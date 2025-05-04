import { config } from "../../package.json";
import { setPref } from "../utils/prefs";

export function registerPreferenceListeners(window: Window) {
  const doc = window?.document;
  if (!doc) return;

  // 监听“启用 PDF 预览”复选框
  const checkboxPDFPreview = doc.querySelector<HTMLInputElement>(
    `#${config.addonRef}-enablePDFPreview`,
  );
  checkboxPDFPreview?.addEventListener("command", (e: Event) => {
    const checked = (e.target as HTMLInputElement).checked;
    ztoolkit.log("【调试】PDF 预览功能状态：", checked);
    setPref("pdfPreview.enabled", checked);
  });

  // 监听“启用 PDF 状态初始化”复选框
  const checkboxPDFStateInit = doc.querySelector<HTMLInputElement>(
    `#${config.addonRef}-enablePDFStateInit`,
  );
  checkboxPDFStateInit?.addEventListener("command", (e: Event) => {
    const checked = (e.target as HTMLInputElement).checked;
    ztoolkit.log("【调试】PDF 状态初始化功能状态：", checked);
    setPref("pdfStateInit.enabled", checked);
  });

  // 监听 scrollMode 下拉框的变化
  const scrollMode = doc.querySelector<HTMLInputElement>(
    `#${config.addonRef}-scrollMode`,
  );
  scrollMode?.addEventListener("command", (e: Event) => {
    const value = Number((e.target as HTMLInputElement).value);
    ztoolkit.log("【调试】Scroll Mode 被设置为：", value);
    setPref("pdfPrefs.scrollMode", value);
  });

  // 监听 scaleMode 下拉框的变化
  const scaleMode = doc.querySelector<HTMLInputElement>(
    `#${config.addonRef}-scaleMode`,
  );
  scaleMode?.addEventListener("command", (e: Event) => {
    const value = (e.target as HTMLInputElement).value;
    ztoolkit.log("【调试】Scale Mode 被设置为：", value);
    setPref("pdfPrefs.scale", value);
  });

  // 监听 handTool 复选框的变化
  const handTool = doc.querySelector<HTMLInputElement>(
    `#${config.addonRef}-enableHandTool`,
  );
  handTool?.addEventListener("command", (e: Event) => {
    const checked = (e.target as HTMLInputElement).checked;
    ztoolkit.log("【调试】手型工具状态：", checked);
    setPref("pdfHandTool.enabled", checked);
  });
}
