import { getPref } from "../utils/prefs";
import {
  getReaderByTabIDCompat,
  getReaderItemIDFromTabEvent,
} from "../utils/reader";

export class PDFHandToolHandler {
  private static initialized = false;
  private static notifierID?: string;

  static init() {
    if (this.initialized || !getPref("pdfHandTool.enabled")) return;
    this.initialized = true;

    this.notifierID = Zotero.Notifier.registerObserver(
      {
        notify: (async (
          event: string,
          type: string,
          ids: Array<string | number>,
          extraData: { [key: string]: any },
        ) => {
          if (event === "add" && type === "tab") {
            const tabID = String(ids[0] ?? "");
            const itemID = getReaderItemIDFromTabEvent(tabID, extraData);
            if (typeof itemID === "number") {
              await this.handlePDFOpen([itemID], tabID);
            }
          }
        }) as unknown as _ZoteroTypes.Notifier.Notify,
      },
      ["tab"],
    );
  }

  private static async handlePDFOpen(itemIDs: number[], tabID?: string) {
    if (!getPref("pdfHandTool.enabled")) {
      return;
    }

    for (const itemID of itemIDs) {
      try {
        const item = await Zotero.Items.getAsync(itemID);
        if (!item?.isAttachment() || !(item as any).isPDFAttachment?.()) {
          continue;
        }

        await Zotero.Promise.delay(1000);

        const reader = tabID
          ? getReaderByTabIDCompat(tabID)
          : Zotero.Reader.getByItemID(itemID);

        if (!reader) {
          continue;
        }

        const pdfApp = await this.waitForPDFViewer(reader);
        if (!pdfApp?.pdfViewer) {
          continue;
        }

        setTimeout(() => {
          try {
            (reader as any).toggleHandTool?.(true);
          } catch (e) {
            ztoolkit.log("[PDFHandToolHandler] Failed to enable hand tool", e);
          }
        }, 300);
      } catch (e) {
        ztoolkit.log(
          `[PDFHandToolHandler] Error handling PDF open for itemID=${itemID}`,
          e,
        );
      }
    }
  }

  private static waitForPDFViewer(
    reader: _ZoteroTypes.ReaderInstance,
    timeout = 5000,
  ): Promise<any> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const check = () => {
        const pdfApp =
          (reader as any)._iframeWindow?.wrappedJSObject?.PDFViewerApplication;
        if (pdfApp?.initialized) {
          resolve(pdfApp);
        } else if (Date.now() - startTime < timeout) {
          setTimeout(check, 100);
        } else {
          resolve(null);
        }
      };
      check();
    });
  }
}
