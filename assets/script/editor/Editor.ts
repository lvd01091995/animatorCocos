import Tool from "../common/util/Tool";
import { callParentMethod } from "../scene/Main";
import FsmCtr from "./fsm/FsmCtr";
import InspectorCtr from "./inspector/InspectorCtr";
import Menu from "./menu/Menu";
import ParamCtr from "./parameters/ParamCtr";
import Setting from "./Setting";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Editor extends cc.Component {
    @property(FsmCtr) Fsm: FsmCtr = null;
    @property(InspectorCtr) Inspector: InspectorCtr = null;
    @property(ParamCtr) Parameters: ParamCtr = null;
    @property(Menu) Menu: Menu = null;

    public static Inst: Editor = null;
    private uuidComp: string = null;
    private propertiesDataJs: any = null;
    private propertiesDataProject: any = null;
    uuidNode: string = null;

    /** 按下的按键 */
    private _keySet: Set<cc.macro.KEY> = new Set();

    protected onLoad() {
        // 初始化界面宽度
        Setting.read();
        this.Inspector.node.width = Setting.inspectorWidth;
        this.Inspector.getComponent(cc.Widget).updateAlignment();
        Tool.updateWidget(this.Inspector.node);
        this.Parameters.node.width = Setting.parametersWidth;
        this.Parameters.getComponent(cc.Widget).updateAlignment();
        Tool.updateWidget(this.Parameters.node);

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);

        var url = new URL(window.location.toString());
        var searchParams = this.getUrlSearchParams(url);
        // console.log("uuid: " + searchParams.uuid)
        this.uuidComp = searchParams.uuid;
        let dataJson = searchParams.json;
        //       dataJson = `{"type":"Sequence","data":{},"typeEasing":"EaseNone","easingPrama":3,"list":[{"type":"MoveTo","data":{"t":1,"pos":{"x":0,"y":0,"z":0}},"typeEasing":"easeBackOut","easingPrama":3,"list":[]},{"type":"DelayTime","data":{"t":2},"typeEasing":"EaseNone","easingPrama":3,"list":[]},{"type":"MoveTo","data":{"t":1,"pos":{"x":0,"y":0,"z":0}},"typeEasing":"EaseNone","easingPrama":3,"list":[]}]}`;
        this.propertiesDataProject = searchParams.pathProperty;
        this.propertiesDataJs = searchParams.pathPropertyJs;
        this.uuidNode = searchParams.uuidNode;

        console.log("uuidComp: " + this.uuidComp)
        console.log("propertiesDataProject: " + this.propertiesDataProject)
        console.log("propertiesDataJs: " + this.propertiesDataJs)
        console.log("uuidNode: " + this.uuidNode)
    }

    protected onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    }

    private async onKeyDown(event: cc.Event.EventKeyboard) {
        this._keySet.add(event.keyCode);

        switch (event.keyCode) {
            case cc.macro.KEY.s:
                if (this._keySet.has(cc.macro.KEY.ctrl)) {
                    console.log("addd----------------------")
                    // 导出工程文件
                    this.exportProject();
                    //this.exportRuntimeData();
                }
                break;
            case cc.macro.KEY.c:
                // return;
                if (this._keySet.has(cc.macro.KEY.ctrl)) {
                    let data: any = this.Fsm.exportProject();
                    data.parameters = this.Parameters.export();
                    let json = JSON.stringify(data)
                    this.coppyToClip(json);
                }
                break;
            case cc.macro.KEY.v:
                if (this._keySet.has(cc.macro.KEY.ctrl)) {
                    let text = await navigator.clipboard.readText();
                    let data = null;
                    try {
                        data = JSON.parse(text);
                    } catch (e) {
                        return;
                    }


                }
            case cc.macro.KEY.Delete:
                // 删除
                this.Fsm.deleteCurUnit();
                this.Fsm.deleteCurLine();
            default:
                break;
        }
    }

    private onKeyUp(event: cc.Event.EventKeyboard) {
        this._keySet.delete(event.keyCode);
    }

    private exportProject() {
        let data: any = this.Fsm.exportProject();
        data.parameters = this.Parameters.export();
        //   this.save('animator.json', data);

        // let data = this._nodeActionRoot.json();
        // data.name = this.lbNameNode.string;
        let json = JSON.stringify(data)
        // console.log(json);
        callParentMethod("saveData", { uuid: this.uuidComp, json: json, pathProperty: this.propertiesDataProject, uuidNode: this.uuidNode });

    }

    private exportRuntimeData() {
        let data: any = this.Fsm.exportRuntimeData();
        data.parameters = this.Parameters.export();
        let json = JSON.stringify(data)
        callParentMethod("saveData", { uuid: this.uuidComp, json: json, pathProperty: this.propertiesDataJs, uuidNode: this.uuidNode });

    }

    private save(fileName: string, data: any) {
        // 存储文件
        let content = JSON.stringify(data);
        this.coppyToClip(content);
        return;
        let eleLink = document.createElement('a');
        eleLink.download = `${fileName}`;
        eleLink.style.display = 'none';
        // 字符内容转变成blob地址
        let blob = new Blob([content]);
        eleLink.href = URL.createObjectURL(blob);
        // 触发点击
        document.body.appendChild(eleLink);
        eleLink.click();
        // 移除
        document.body.removeChild(eleLink);
    }
    coppyToClip(text: string) {
        if (cc.sys.isNative) {
            // Util.onCoppyToClip(text);
        } else {
            if (!navigator.clipboard) {
                var textArea = document.createElement("textarea");
                textArea.value = text;
                // Avoid scrolling to bottom
                textArea.style.top = "0";
                textArea.style.left = "0";
                textArea.style.position = "fixed";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    var successful = document.execCommand('copy');
                    if (successful) {
                        //  S.UIManager.showAlertMini("Đã sao chép");
                    } else {
                        // S.UIManager.showAlertMini("Vui lòng thử lại!");
                    }
                } catch (err) {
                    // S.UIManager.showAlertMini("Vui lòng thử lại! ");
                }

                document.body.removeChild(textArea);
                return;
            }
            navigator.clipboard.writeText(text).then(function () {
                // S.UIManager.showAlertMini("Đã sao chép");
            }, function (err) {
                //  S.UIManager.showAlertMini("Vui lòng thử lại!");
            });
        }
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
