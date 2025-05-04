import { getPref } from "../utils/prefs";

const scrollMode = getPref("pdfPrefs.scrollMode");
const scale = getPref("pdfPrefs.scale");
const zoom = getPref("pdfPrefs.scale");
const enable = getPref("pdfStateInit.enabled");

export class PDFStateInitializer {
  private static initialized = false;

  static init() {
    if (this.initialized || !enable) return;
    this.initialized = true;

    ztoolkit.log("PDFStateInitializer 初始化");

    Zotero.Notifier.registerObserver(
      {
        notify: (async (
          event: string,
          type: string,
          ids: string[],
          extraData: Record<string, any>,
        ) => {
          if (event !== "add" || type !== "item") return;

          for (const id of ids) {
            try {
              const itemID = parseInt(id + "", 10);
              const item = await Zotero.Items.getAsync(itemID);
              if (
                !item ||
                !item.isAttachment() ||
                !(item as any).isPDFAttachment?.()
              )
                continue;

              ztoolkit.log(
                "[PDFStateInitializer] 检测到 PDF 附件添加，准备设置默认阅读状态",
                itemID,
              );

              await this.writeDefaultState(item);
            } catch (e) {
              ztoolkit.log("[PDFStateInitializer] 写入 PDF 状态失败:", e);
            }
          }
        }) as unknown as _ZoteroTypes.Notifier.Notify,
      },
      ["item"],
    );
  }

  private static async writeDefaultState(item: Zotero.Item) {
    const defaultState = {
      pageIndex: 0,
      scrollMode: scrollMode,
      scale: scale,
      zoom: zoom,
      scrollLeft: 0,
      scrollTop: 0,
    };

    const storageDir = Zotero.Attachments.getStorageDirectory(item);
    if (!storageDir.exists()) {
      // 0x01 表示 DIRECTORY_TYPE
      storageDir.create(0x01, 0o755);
    }

    const stateFile = storageDir.clone();
    stateFile.append(".zotero-reader-state");

    ztoolkit.log("[PDFStateInitializer] 写入状态文件:", stateFile.path);

    await Zotero.File.putContents(
      stateFile,
      JSON.stringify(defaultState, null, 2),
    );

    // 可选：更新附件的页码状态
    item.setAttachmentLastPageIndex(0);
    await item.saveTx();
  }
}
