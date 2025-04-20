import { config } from "../../package.json";
import { getString } from "../utils/locale";
import { setPref } from "../utils/prefs";
export async function registerPrefsScripts(_window: Window) {
  // This function is called when the prefs window is opened
  // See addon/content/preferences.xhtml onpaneload
  if (!addon.data.prefs) {
    addon.data.prefs = {
      window: _window,
      columns: [
        {
          dataKey: "title",
          label: getString("prefs-table-title"),
          fixedWidth: true,
          width: 100,
        },
        {
          dataKey: "detail",
          label: getString("prefs-table-detail"),
        },
      ],
      rows: [
        {
          title: "Orange",
          detail: "It's juicy",
        },
        {
          title: "Banana",
          detail: "It's sweet",
        },
        {
          title: "Apple",
          detail: "I mean the fruit APPLE",
        },
      ],
    };
  } else {
    addon.data.prefs.window = _window;
  }
  updatePrefsUI();
  bindPrefEvents();
}

async function updatePrefsUI() {
  // You can initialize some UI elements on prefs window
  // with addon.data.prefs.window.document
  // Or bind some events to the elements
  const renderLock = ztoolkit.getGlobal("Zotero").Promise.defer();
  if (addon.data.prefs?.window == undefined) return;
  const tableHelper = new ztoolkit.VirtualizedTable(addon.data.prefs?.window)
    .setContainerId(`${config.addonRef}-table-container`)
    .setProp({
      id: `${config.addonRef}-prefs-table`,
      // Do not use setLocale, as it modifies the Zotero.Intl.strings
      // Set locales directly to columns
      columns: addon.data.prefs?.columns,
      showHeader: true,
      multiSelect: true,
      staticColumns: true,
      disableFontSizeScaling: true,
    })
    .setProp("getRowCount", () => addon.data.prefs?.rows.length || 0)
    .setProp(
      "getRowData",
      (index) =>
        addon.data.prefs?.rows[index] || {
          title: "no data",
          detail: "no data",
        },
    )
    // Show a progress window when selection changes
    .setProp("onSelectionChange", (selection) => {
      new ztoolkit.ProgressWindow(config.addonName)
        .createLine({
          text: `Selected line: ${addon.data.prefs?.rows
            .filter((v, i) => selection.isSelected(i))
            .map((row) => row.title)
            .join(",")}`,
          progress: 100,
        })
        .show();
    })
    // When pressing delete, delete selected line and refresh table.
    // Returning false to prevent default event.
    .setProp("onKeyDown", (event: KeyboardEvent) => {
      if (event.key == "Delete" || (Zotero.isMac && event.key == "Backspace")) {
        addon.data.prefs!.rows =
          addon.data.prefs?.rows.filter(
            (v, i) => !tableHelper.treeInstance.selection.isSelected(i),
          ) || [];
        tableHelper.render();
        return false;
      }
      return true;
    })
    // For find-as-you-type
    .setProp(
      "getRowString",
      (index) => addon.data.prefs?.rows[index].title || "",
    )
    // Render the table.
    .render(-1, () => {
      renderLock.resolve();
    });
  await renderLock.promise;
  ztoolkit.log("Preference table rendered!");
}

function bindPrefEvents() {
  addon.data
    .prefs!.window.document?.querySelector(
      `#zotero-prefpane-${config.addonRef}-enable`,
    )
    ?.addEventListener("command", (e: Event) => {
      ztoolkit.log(e);
      addon.data.prefs!.window.alert(
        `Successfully changed to ${(e.target as XUL.Checkbox).checked}!`,
      );
    });

  addon.data
    .prefs!.window.document?.querySelector(
      `#zotero-prefpane-${config.addonRef}-input`,
    )
    ?.addEventListener("change", (e: Event) => {
      ztoolkit.log(e);
      addon.data.prefs!.window.alert(
        `Successfully changed to ${(e.target as HTMLInputElement).value}!`,
      );
    });
}


// export function registerPreferenceListeners(window: Window) {
//   const doc = window?.document;
//   if (!doc) return;

//   const checkboxPDFPreview = doc.querySelector<HTMLInputElement>(
//     `#${config.addonRef}-enablePDFPreview`
//   );
//   checkboxPDFPreview?.addEventListener("command", (e: Event) => {
//     const checked = (e.target as HTMLInputElement).checked;
//     setPref("pdfPreview.enabled", checked);
//   });

//   const checkboxPDFStateInit = doc.querySelector<HTMLInputElement>(
//     `#${config.addonRef}-enablePDFStateInit`
//   );
//   checkboxPDFStateInit?.addEventListener("command", (e: Event) => {
//     const checked = (e.target as HTMLInputElement).checked;
//     setPref("pdfStateInit.enabled", checked);
//   });

//   const scrollMode = doc.querySelector<HTMLInputElement>(
//     `#${config.addonRef}-scrollMode`
//   );
//   scrollMode?.addEventListener("command", (e: Event) => {
//     const value = Number((e.target as HTMLInputElement).value); // 转换为数字
//     setPref("pdfPrefs.scrollMode", value);
//   });

//   const scaleMode = doc.querySelector<HTMLInputElement>(
//     `#${config.addonRef}-scaleMode`
//   );
//   scaleMode?.addEventListener("command", (e: Event) => {
//     const value = (e.target as HTMLInputElement).value;
//     setPref("pdfPrefs.scale", value);
//   });
// }



export function registerPreferenceListeners(window: Window) {
  const doc = window?.document;
  if (!doc) return;

  // 监听“启用 PDF 预览”复选框
  const checkboxPDFPreview = doc.querySelector<HTMLInputElement>(
    `#${config.addonRef}-enablePDFPreview`
  );
  checkboxPDFPreview?.addEventListener("command", (e: Event) => {
    const checked = (e.target as HTMLInputElement).checked;
    ztoolkit.log("【调试】PDF 预览功能状态：", checked);
    setPref("pdfPreview.enabled", checked);
  });

  // 监听“启用 PDF 状态初始化”复选框
  const checkboxPDFStateInit = doc.querySelector<HTMLInputElement>(
    `#${config.addonRef}-enablePDFStateInit`
  );
  checkboxPDFStateInit?.addEventListener("command", (e: Event) => {
    const checked = (e.target as HTMLInputElement).checked;
    ztoolkit.log("【调试】PDF 状态初始化功能状态：", checked);
    setPref("pdfStateInit.enabled", checked);
  });

  // 监听 scrollMode 下拉框的变化
  const scrollMode = doc.querySelector<HTMLInputElement>(
    `#${config.addonRef}-scrollMode`
  );
  scrollMode?.addEventListener("command", (e: Event) => {
    const value = Number((e.target as HTMLInputElement).value);
    ztoolkit.log("【调试】Scroll Mode 被设置为：", value);
    setPref("pdfPrefs.scrollMode", value);
  });

  // 监听 scaleMode 下拉框的变化
  const scaleMode = doc.querySelector<HTMLInputElement>(
    `#${config.addonRef}-scaleMode`
  );
  scaleMode?.addEventListener("command", (e: Event) => {
    const value = (e.target as HTMLInputElement).value;
    ztoolkit.log("【调试】Scale Mode 被设置为：", value);
    setPref("pdfPrefs.scale", value);
  });
}
