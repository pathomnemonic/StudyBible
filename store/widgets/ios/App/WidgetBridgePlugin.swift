import Capacitor
import WidgetKit

/// The web app calls WidgetBridge.publish({ json }) (see src/lib/widgetData.ts). The JSON goes into the shared App Group so the widget can read it.
@objc(WidgetBridgePlugin)
public class WidgetBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WidgetBridgePlugin"
    public let jsName = "WidgetBridge"
    public let pluginMethods: [CAPPluginMethod] = [CAPPluginMethod(name: "publish", returnType: CAPPluginReturnPromise)]
    static let group = "group.org.cathology.app"

    @objc func publish(_ call: CAPPluginCall) {
        guard let json = call.getString("json") else { return call.reject("json missing") }
        UserDefaults(suiteName: WidgetBridgePlugin.group)?.set(json, forKey: "widgetData")
        if #available(iOS 14.0, *) { WidgetCenter.shared.reloadAllTimelines() }
        call.resolve()
    }
}
