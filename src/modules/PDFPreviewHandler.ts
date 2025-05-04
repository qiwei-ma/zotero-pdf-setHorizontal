import { getLocaleID, getString } from "../utils/locale";
import { getPref } from "../utils/prefs";
const enable = getPref("pdfPreview.enabled");

export class PDFPreviewHandler {
    private static initialized = false;
    private static notifierID?: string;

    static init() {
        ztoolkit.log("预置首选项 before", getPref("pdfPreview.enabled"));
        ztoolkit.log("预置首选项 enable before", getPref("pdfPreview.enabled"));
        if (this.initialized || !getPref("pdfPreview.enabled")) return;
        this.initialized = true;
        ztoolkit.log("预置首选项 after", getPref("pdfPreview.enabled"));
        ztoolkit.log("PDFPreviewHandler");

        this.notifierID = Zotero.Notifier.registerObserver(
            {
                notify: (async (
                    event: string,
                    type: string,
                    ids: string[],
                    extraData: { [key: string]: any }
                ) => {
                    ztoolkit.log(`[Zotero Plugin] Tab 事件触发: event=${event}, ids=${JSON.stringify(ids)}, extraData=${JSON.stringify(extraData)}`);

                    if (event === "add" && type === "tab") {
                        const tabID = ids[0];
                        const tabInfo = extraData[tabID];
                        if (tabInfo?.type === "reader" && typeof tabInfo.itemID === "number") {
                            ztoolkit.log("[Zotero Plugin] Reader tab 被添加，处理 itemID:", tabInfo.itemID);
                            await this.handlePDFOpen([tabInfo.itemID], tabID);
                        } else {
                            ztoolkit.log("[Zotero Plugin] Reader tab 添加但缺少 itemID，跳过");
                        }
                    }
                }) as unknown as _ZoteroTypes.Notifier.Notify,
            },
            ["tab"]
        );
    }

    private static async handlePDFOpen(itemIDs: number[], tabID?: string) {

        const enable = getPref("pdfPreview.enabled");
        ztoolkit.log("handle PDFOpen enable:", enable);
        if (!enable) {
            ztoolkit.log("PDF 预览功能未启用，跳过处理");
            return;
        }
        for (const itemID of itemIDs) {
            try {
                const item = await Zotero.Items.getAsync(itemID);
                if (!item?.isAttachment() || !(item as any).isPDFAttachment()) {
                    ztoolkit.log("[Zotero Plugin] 非 PDF 附件，跳过:", itemID);
                    continue;
                }

                // 等待 tab 渲染
                await Zotero.Promise.delay(1000);

                const reader = tabID
                    ? Zotero.Reader.getByTabID(tabID)
                    : Zotero.Reader.getByItemID(itemID);
                if (!reader) {
                    ztoolkit.log("[Zotero Plugin] 未找到对应 reader 实例，itemID:", itemID);
                    continue;
                }

                const pdfApp = await this.waitForPDFViewer(reader);

                if (!pdfApp?.pdfViewer) {
                    ztoolkit.log("[Zotero Plugin] PDFViewerApplication 未初始化");
                    continue;
                }

                const applyPreferences = () => {
                    try {
                        // 如果已经设置过，就不再重复设置
                        if (pdfApp.pdfViewer.currentScaleValue === getPref("pdfPrefs.scale") && pdfApp.pdfViewer.scrollMode === getPref("pdfPrefs.scrollMode")) {
                            ztoolkit.log("[Zotero Plugin] 设置已经应用，跳过");
                            return;
                        }

                        pdfApp.pdfViewer.currentScaleValue = getPref("pdfPrefs.scale");
                        pdfApp.pdfViewer.scrollMode = getPref("pdfPrefs.scrollMode");

                        ztoolkit.log("[Zotero Plugin] 设置 scrollMode = " + getPref("pdfPrefs.scrollMode") + ", scale = " + getPref("pdfPrefs.scale") + "，zoom = page-height");

                    } catch (e) {
                        ztoolkit.log("[Zotero Plugin] 设置阅读器偏好失败:", e);
                    }
                };

                // 延迟处理避免闪烁问题
                const applyDelayedPreferences = () => {
                    // 延迟足够时间，以确保 Zotero 完成状态写入操作
                    setTimeout(() => {
                        try {
                            // 在此时设置 PDF 偏好
                            applyPreferences(); // 统一调用设置逻辑
                        } catch (e) {
                            ztoolkit.log("[Zotero Plugin] 延迟设置失败:", e);
                        }
                    }, 300); // 延迟时间，确保 Zotero 写入操作完成
                };

                if (pdfApp._eventBus && !pdfApp.pdfViewer._pagesInitialized) {
                    ztoolkit.log("[Zotero Plugin] 页面未初始化，监听 pagesinit");
                    pdfApp._eventBus.on('pagesinit', () => {
                        ztoolkit.log("[Zotero Plugin] 页面初始化完成，应用设置");
                        applyDelayedPreferences(); // 延迟应用设置
                    });
                } else {
                    ztoolkit.log("[Zotero Plugin] 页面已初始化，立即应用设置");
                    applyDelayedPreferences(); // 直接延迟应用设置
                }
            } catch (e) {
                ztoolkit.log(`处理 PDF 打开失败 itemID=${itemID}:`, e);
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
                    ztoolkit.log("等待 PDFViewer 超时");
                    resolve(null);
                }
            };
            check();
        });
    }

    private static applyPreviewSettings(pdfViewer: any, retry = 0) {

        const scrollMode = getPref("pdfPrefs.scrollMode");
        const scale = getPref("pdfPrefs.scale");

        ztoolkit.log("开始等待 PDFViewer 初始化");
        ztoolkit.log("PDFViewer 已初始化");
        ztoolkit.log("======================================");
        ztoolkit.log(`PDF 预览设置: scrollMode=${scrollMode}, scale=${scale}`);
        ztoolkit.log("PDF 预览设置gtepref", getPref("pdfPrefs.scrollMode"));
        ztoolkit.log("PDF 预览设置gtepref", getPref("pdfPrefs.scale"));
        try {
            ztoolkit.log(`应用 PDF 设置，尝试次数: ${retry}`);

            if (retry > 2) {
                ztoolkit.log("超过最大重试次数，放弃设置");
                return;
            }

            if (typeof pdfViewer.setScrollMode === "function") {
                // pdfViewer.setScrollMode(1);
                pdfViewer.setScrollMode(scrollMode);
                ztoolkit.log("调用 setScrollMode(1) 成功，设置为横向");
            } else {
                ztoolkit.log("pdfViewer.setScrollMode 不存在或不是函数");
            }

            if (typeof pdfViewer.setScale === "function") {
                // pdfViewer.setScale("page-height");
                pdfViewer.setScale(scale);
                ztoolkit.log("调用 setScale('page-height') 成功");
            } else {
                ztoolkit.log("pdfViewer.setScale 不存在或不是函数");
            }
        } catch (e) {
            ztoolkit.log(`应用 PDF 设置失败 (重试 ${retry})`, e);
            setTimeout(() => this.applyPreviewSettings(pdfViewer, retry + 1), 500);
        }
    }
}
