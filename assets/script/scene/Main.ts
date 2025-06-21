import Res from "../common/util/Res";
import { ResDirUrl, ResUrl } from "../constant/ResUrl";
import Editor from "../editor/Editor";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Main extends cc.Component {
    private _editor: Editor = null;
    @property(cc.Label) lbNameNode: cc.Label = null;
 
    protected onLoad() {
        cc.debug.setDisplayStats(false);
        this.onInit();
    }

    private async onInit() {
        await Res.loadDir(ResDirUrl.PREFAB, cc.Prefab);

        this.resetEditor();

        // 注册拖拽文件事件监听
        this.dragOn();


        var url = new URL(window.location.toString());
        // console.log("url depp link la: ================ " + url);
        // console.log(S.getUrlSearchParams("?sision=0ef3e5df-435d-46bc-a165-452a3e55d848"));
        var searchParams = this.getUrlSearchParams(url);
        // console.log("uuid: " + searchParams.uuid)
        let dataJson = searchParams.json;
        //       dataJson = `{"type":"Sequence","data":{},"typeEasing":"EaseNone","easingPrama":3,"list":[{"type":"MoveTo","data":{"t":1,"pos":{"x":0,"y":0,"z":0}},"typeEasing":"easeBackOut","easingPrama":3,"list":[]},{"type":"DelayTime","data":{"t":2},"typeEasing":"EaseNone","easingPrama":3,"list":[]},{"type":"MoveTo","data":{"t":1,"pos":{"x":0,"y":0,"z":0}},"typeEasing":"EaseNone","easingPrama":3,"list":[]}]}`;
        this.lbNameNode.string = searchParams.name;
       // this._curIndexHandler = searchParams.curIndexHandler || 0;
        console.log(dataJson);
        let data = null;
        try {
            data = JSON.parse(dataJson);
            if (data.animator) {
                // 读取状态机工程文件
                this.resetEditor();
                this._editor.Parameters.import(data.parameters);
                this._editor.Fsm.importProject(data);
            }

        } catch (e) {
            return;
        }
    }

    private resetEditor() {
        if (this._editor) {
            this._editor.Fsm.MachineLayer.clear();
            this._editor.node.removeFromParent();
            this._editor.node.destroy();
        }
        let node = cc.instantiate(Res.getLoaded(ResUrl.PREFAB.EDITOR));
        this._editor = node.getComponent(Editor);
        Editor.Inst = this._editor;
        this.node.addChild(node);
    }

    /**
     * 注册拖拽文件事件监听
     */
    private dragOn() {
        if (!cc.sys.isBrowser) {
            return;
        }
        let canvas = document.getElementById('GameCanvas');
        canvas.addEventListener("dragenter", (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);

        canvas.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);

        canvas.addEventListener("dragleave", (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);

        canvas.addEventListener("drop", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            // let files = e.dataTransfer.files;
            // console.log(e.dataTransfer.types);
            // for (let i = 0; i < e.dataTransfer.types.length; i++) {
            //     let type = e.dataTransfer.types[i];
            //     console.log(e.dataTransfer.getData(type));

            // }

            let name = e.dataTransfer.getData('name');
            if (name.endsWith('.json') || name.endsWith('.anim')) {
                let stringContent: string = await callParentMethod('getInfoFileByUUID', e.dataTransfer.getData("value"));
                if (name.endsWith('.json')) {
                    let data: any = JSON.parse(stringContent);
                     if (data.animations) {
                        // 读取spine文件
                        this._editor.Fsm.improtSpine(data);
                    } else if (data.armature) {
                        // 读取龙骨文件
                        this._editor.Fsm.importDragonBones(data);
                    }
                } else if (name.endsWith('.anim')) {
                    let data: any = JSON.parse(stringContent);
                    this._editor.Fsm.importAnim(data);
                }


                //console.log(string);
            }

            // this.readFiles(files);
        }, false);
    }

    /**
     * 文件读取
     */
    private readFiles(files: FileList) {
        for (let i = 0; i < files.length; i++) {
            let file: File = files[i];
            if (/\.json$/.test(file.name)) {
                this.readJson(file);
            } else if (/\.anim$/.test(file.name)) {
                this.readAnim(file);
            }
        }
    }

    /**
     * 读取.json文件
     */
    private readJson(file: File) {
        let fileReader = new FileReader();
        fileReader.readAsText(file);
        fileReader.onload = () => {
            cc.log(fileReader.result);
            let data: any = JSON.parse(fileReader.result as string);
            if (data.animator) {
                // 读取状态机工程文件
                this.resetEditor();
                this._editor.Parameters.import(data.parameters);
                this._editor.Fsm.importProject(data);
            } else if (data.animations) {
                // 读取spine文件
                this._editor.Fsm.improtSpine(data);
            } else if (data.armature) {
                // 读取龙骨文件
                this._editor.Fsm.importDragonBones(data);
            }
        };
    }

    /**
     * 读取cocos .anim文件
     */
    private readAnim(file: File) {
        let fileReader = new FileReader();
        fileReader.readAsText(file);
        fileReader.onload = () => {
            cc.log(fileReader.result);
            let data: any = JSON.parse(fileReader.result as string);
            this._editor.Fsm.importAnim(data);
        };
    }
    getUrlSearchParams(url): any {
        // Regular expression to match key-value pairs
        const regex = /[?&]([^=#]+)=([^&#]*)/g;
        let params = {};
        let match;

        // Execute regex on the query string
        while (match = regex.exec(url)) {
            let key = decodeURIComponent(match[1]);
            let value = decodeURIComponent(match[2]);
            params[key] = value;
        }
        return params;
    }
}


export function callParentMethod(method, params): any {
    return new Promise((resolve) => {
        const messageId = Date.now().toString() + Math.random().toString();

        function handleResponse(event) {
            const { type, id, result } = event.data || {};
            if (type === 'response' && id === messageId) {
                window.removeEventListener('message', handleResponse);
                resolve(result);
            }
        }

        window.addEventListener('message', handleResponse);

        // Gửi yêu cầu lên parent
        window.parent.postMessage({
            type: 'request',
            method,
            params,
            id: messageId
        }, '*');
    });
}