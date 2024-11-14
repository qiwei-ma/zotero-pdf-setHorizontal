// export class PdfViewDefaults {
// 	static registerSetter() {
// 		const callback = {
// 			notify: async (
// 				event: string,
// 				type: string,
// 				ids: number[] | string[],
// 				extraData: { [key: string]: any },) => {
// 				if (event === "select" && type === "tab") {
// 					Zotero.Debug.log("===========================================================进入open");
// 					Zotero.Debug.log("===============================================ids", ids[0].toString());
// 					setPdf(ids[0]);
// 					extraData.preventDefault = true;

// 				}
// 			},
// 		};

// 		const notifierID = Zotero.Notifier.registerObserver(callback, ["tab", "item", "file"]);

// 		Zotero.Plugins.addObserver({
// 			shutdown: ({ id: pluginID }) => {
// 				this.unregisterSetter(notifierID);
// 			},
// 		});

// 		function setPdf(id: string | number) {
// 			Zotero.Debug.log("========================================================setPdf");
// 			setHorizontal(id).then(() => {
// 				ZoteroPane.viewAtachments(id);
// 			})
// 		}

// 		async function setHorizontal(id: string | number) {
// 			Zotero.Debug.log("========================================================进入setHorizontal");

// 			let reader = Zotero.Reader.getByTabID(id.toString());
// 			if (reader) {

// 				Zotero.Debug.log("============================================进入reader");
// 				let state: _ZoteroTypes.Reader.State | null = await reader._getState();

// 				if (state) {
// 					let defaultstate = state;
// 					if (state.scrollMode !== 1) {
// 						defaultstate.scrollMode = 1;
// 						defaultstate.scale = 'page-fit';
// 					}
// 					Zotero.Promise.delay(10000);
// 					Zotero.Debug.log("设置中PDF 阅读器的滚动状态", defaultstate.scrollMode);
// 					Zotero.Debug.log("设置中PDF 阅读器的缩放状态", defaultstate.scale);
// 					await reader._setState(defaultstate);

// 					// Zotero.Promise.delay(1000);
// 				}
// 				let afterState: _ZoteroTypes.Reader.State | null = await reader._getState();
// 				Zotero.Debug.log("设置后的PDF 阅读器的滚动状态", afterState?.scrollMode);
// 				Zotero.Debug.log("设置后的PDF 阅读器的缩放状态", afterState?.scale);
// 			}
// 			// await new Promise(resolve => setTimeout(resolve, 1000));

// 		}


// 	}



// 	private static unregisterSetter(notifierID: string) {
// 		Zotero.Notifier.unregisterObserver(notifierID);
// 	}
// }


export class PdfViewDefaults {
	static registerSetter(win: Window) {
		const callback = {
			notify: async (
				event: string,
				type: string,
				ids: number[] | string[],
				extraData: { [key: string]: any },) => {
				if (!addon?.data.alive) {
					this.unregisterSetter(notifierID);
					return;
				}
				// Zotero.Debug.log("===========================================================notify已激活");
				Zotero.Debug.log("===========================================================event", event);
				// Zotero.Debug.log("===========================================================type", type);
				Zotero.Debug.log("====================================ids",ids);
				// Zotero.Debug.log("===========================================================extraData[ids[0]].type", extraData[ids[0]].type);
				if (event === "select" && type === "tab" && extraData[ids[0]].type === "reader") {
					win.addEventListener(event, async (event) => {
						event.preventDefault();
						let reader = Zotero.Reader.getByTabID(ids[0].toString());
						if (reader) {
							Zotero.Debug.log("============================================进入阅读器");
							let state: _ZoteroTypes.Reader.State | null = await reader._getState();

							// _getState()操作
							// let state;
							// let item = Zotero.Items.get(ids[0]);
							// let directory = Zotero.Attachments.getStorageDirectory(item);
							// let file = directory.clone();
							// file.append(reader.stateFileName);
							// try {
							// 	if (await OS.File.exists(file.path)) {
							// 		let content =  await Zotero.File.getContentsAsync(file.path);
							// 		Zotero.Debug.log("state 地址", content);
							// 		state = JSON.parse(content as string);
							// 	}
							// } catch (error) {
							// 	Zotero.Debug.log("当前state为空",error);
							// }
							// Zotero.Debug.log("state状态", state);
							// Zotero.Debug.log("reader type", reader._type);
							// if (!state && reader._type === 'pdf') {
							// 	let defaultstate = {
							// 		spreadMode: 0,
							// 		scrollMode: 1,
							// 		scale: 'page-fit'
							// 	};
							// 	state = JSON.parse(JSON.stringify(defaultstate));
							// }


							await Zotero.Promise.delay(1000);

							if (state) {
								if (state.scrollMode !== 1) {
									state.scrollMode = 1;
									state.scale = 'page-fit';
								}
								reader._setState(state);

							}
							let afterState: _ZoteroTypes.Reader.State | null = await reader._getState();
							Zotero.Debug.log("设置后的PDF 阅读器的滚动状态", afterState?.scrollMode);
							Zotero.Debug.log("设置后的PDF 阅读器的缩放状态", afterState?.scale);
							win.dispatchEvent(new Event(event.type, event));
							// win.dispatchEvent(event);
						}

					});

				}
			},
		};

		// 注册回调函数作为 Zotero 的观察者
		const notifierID = Zotero.Notifier.registerObserver(callback, ["tab", "item", "file"]);

		// 注册插件观察者来在插件关闭时注销 notifier
		Zotero.Plugins.addObserver({
			shutdown: ({ id: pluginID }) => {
				this.unregisterSetter(notifierID);
			},
		});
	}

	private static unregisterSetter(notifierID: string) {
		Zotero.Notifier.unregisterObserver(notifierID);
	}
}