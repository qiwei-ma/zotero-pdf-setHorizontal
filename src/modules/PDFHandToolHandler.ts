import { getPref } from "../utils/prefs";

export class PDFHandToolHandler {
    private static initialized = false;
    private static notifierID?: string;

    static init() {
        if (this.initialized || !getPref("pdfHandTool.enabled")) return;
        this.initialized = true;
        ztoolkit.log("PDFHandToolHandler initialized");

        this.notifierID = Zotero.Notifier.registerObserver(
            {
                notify: (async (
                    event: string,
                    type: string,
                    ids: string[],
                    extraData: { [key: string]: any }
                ) => {
                    if (event === "add" && type === "tab") {
                        const tabID = ids[0];
                        const tabInfo = extraData[tabID];
                        if (tabInfo?.type === "reader" && typeof tabInfo.itemID === "number") {
                            ztoolkit.log("[PDFHandToolHandler] Reader tab opened, handling itemID:", tabInfo.itemID);
                            await this.handlePDFOpen([tabInfo.itemID], tabID);
                        }
                    }
                }) as unknown as _ZoteroTypes.Notifier.Notify,
            },
            ["tab"]
        );
    }

    private static async handlePDFOpen(itemIDs: number[], tabID?: string) {
        const enable = getPref("pdfHandTool.enabled");
        if (!enable) {
            ztoolkit.log("Hand tool feature disabled, skipping");
            return;
        }

        for (const itemID of itemIDs) {
            try {
                const item = await Zotero.Items.getAsync(itemID);
                if (!item?.isAttachment() || !(item as any).isPDFAttachment()) {
                    continue;
                }

                // Wait for tab rendering
                await Zotero.Promise.delay(1000);

                const reader = tabID
                    ? Zotero.Reader.getByTabID(tabID)
                    : Zotero.Reader.getByItemID(itemID);

                if (!reader) {
                    ztoolkit.log("[PDFHandToolHandler] Reader not found for itemID:", itemID);
                    continue;
                }

                const pdfApp = await this.waitForPDFViewer(reader);
                if (!pdfApp?.pdfViewer) {
                    ztoolkit.log("[PDFHandToolHandler] PDFViewerApplication not initialized");
                    continue;
                }

                // Enable hand tool
                const applyHandTool = () => {
                    try {
                        reader.toggleHandTool(true);
                        ztoolkit.log("[PDFHandToolHandler] Hand tool enabled");
                    } catch (e) {
                        ztoolkit.log("[PDFHandToolHandler] Failed to enable hand tool:", e);
                    }
                };

                // Apply with delay to ensure proper initialization
                setTimeout(applyHandTool, 300);

            } catch (e) {
                ztoolkit.log(`[PDFHandToolHandler] Error handling PDF open for itemID=${itemID}:`, e);
            }
        }
    }

    private static waitForPDFViewer(reader: _ZoteroTypes.ReaderInstance, timeout = 5000): Promise<any> {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const check = () => {
                const pdfApp = reader._iframeWindow?.wrappedJSObject?.PDFViewerApplication;
                if (pdfApp?.initialized) {
                    resolve(pdfApp);
                } else if (Date.now() - startTime < timeout) {
                    setTimeout(check, 100);
                } else {
                    ztoolkit.log("Timeout waiting for PDFViewer");
                    resolve(null);
                }
            };
            check();
        });
    }
}