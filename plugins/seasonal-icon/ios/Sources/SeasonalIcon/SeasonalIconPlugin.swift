import Foundation
import Capacitor

/**
 * Switches the home screen icon between the primary icon and the bundled seasonal
 * alternates (AppIcon-Violet, AppIcon-Green, AppIcon-Red, declared in the app
 * Info.plist under CFBundleAlternateIcons).
 *
 * The web side speaks in plain names ('violet', 'green', 'red', or no name for the
 * primary icon); the AppIcon- prefix and the translation back live here, so both
 * platforms share one vocabulary.
 */
@objc(SeasonalIconPlugin)
public class SeasonalIconPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SeasonalIconPlugin"
    public let jsName = "SeasonalIcon"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setIcon", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getCurrentIcon", returnType: CAPPluginReturnPromise)
    ]

    private func alternateName(for name: String?) -> String? {
        guard let name = name, !name.isEmpty else { return nil }
        return "AppIcon-" + String(name.prefix(1)).uppercased() + String(name.dropFirst())
    }

    private func plainName(for alternate: String?) -> String? {
        guard let alternate = alternate, alternate.hasPrefix("AppIcon-") else { return nil }
        let rest = alternate.dropFirst("AppIcon-".count)
        return String(rest.prefix(1)).lowercased() + String(rest.dropFirst())
    }

    @objc func setIcon(_ call: CAPPluginCall) {
        let target = alternateName(for: call.getString("name"))
        DispatchQueue.main.async {
            guard UIApplication.shared.supportsAlternateIcons else {
                call.reject("This device does not support alternate app icons")
                return
            }
            // Already showing: resolve without calling the system, so its
            // "you have changed the icon" message only appears on a real change.
            if UIApplication.shared.alternateIconName == target {
                call.resolve()
                return
            }
            UIApplication.shared.setAlternateIconName(target) { error in
                if let error = error {
                    call.reject(error.localizedDescription)
                } else {
                    call.resolve()
                }
            }
        }
    }

    @objc func getCurrentIcon(_ call: CAPPluginCall) {
        if let plain = plainName(for: UIApplication.shared.alternateIconName) {
            call.resolve(["name": plain])
        } else {
            call.resolve(["name": NSNull()])
        }
    }
}
