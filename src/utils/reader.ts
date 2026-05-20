type ReaderTabInfo = {
  type?: string;
  itemID?: number;
  itemId?: number;
};

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export function getReaderItemIDFromTabEvent(
  tabID: string | number | undefined,
  extraData: Record<string, unknown> | undefined,
): number | undefined {
  if (!extraData || tabID == null) return undefined;
  const tabInfo = extraData[String(tabID)] as ReaderTabInfo | undefined;
  if (!tabInfo || tabInfo.type !== "reader") return undefined;
  return toNumber(tabInfo.itemID ?? tabInfo.itemId);
}

export function getReaderByTabIDCompat(
  tabID: string | undefined,
): _ZoteroTypes.ReaderInstance | undefined {
  if (!tabID) return undefined;
  const readerManager = Zotero.Reader as any;

  if (typeof readerManager?.getByTabID === "function") {
    const reader = readerManager.getByTabID(tabID);
    if (reader) return reader;
  }

  if (typeof readerManager?.getByTabId === "function") {
    const reader = readerManager.getByTabId(tabID);
    if (reader) return reader;
  }

  if (typeof readerManager?.getByTabID === "function") {
    const numericTabID = Number(tabID);
    if (Number.isFinite(numericTabID)) {
      const reader = readerManager.getByTabID(numericTabID);
      if (reader) return reader;
    }
  }

  return undefined;
}
