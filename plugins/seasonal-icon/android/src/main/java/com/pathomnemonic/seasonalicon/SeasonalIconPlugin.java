package com.pathomnemonic.seasonalicon;

import android.content.ComponentName;
import android.content.pm.PackageManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONObject;

/**
 * Switches the launcher icon by enabling exactly one of the activity-aliases the
 * build adds to the app manifest (see tools/android_seasonal_icon.py):
 * .icon.Default (the primary icon), .icon.Violet, .icon.Green and .icon.Red.
 *
 * The web side speaks in plain names ('violet', 'green', 'red', or no name for the
 * primary icon); the capitalised alias suffixes live here, so both platforms
 * share one vocabulary.
 */
@CapacitorPlugin(name = "SeasonalIcon")
public class SeasonalIconPlugin extends Plugin {

    private static final String[] VARIANTS = { "Default", "Violet", "Green", "Red" };

    private ComponentName component(String variant) {
        String pkg = getContext().getPackageName();
        return new ComponentName(pkg, pkg + ".icon." + variant);
    }

    private static String variantFor(String name) {
        if (name == null || name.isEmpty()) return "Default";
        return name.substring(0, 1).toUpperCase() + name.substring(1);
    }

    @PluginMethod
    public void setIcon(PluginCall call) {
        String target = variantFor(call.getString("name"));
        PackageManager pm = getContext().getPackageManager();
        for (String variant : VARIANTS) {
            int state = variant.equals(target)
                ? PackageManager.COMPONENT_ENABLED_STATE_ENABLED
                : PackageManager.COMPONENT_ENABLED_STATE_DISABLED;
            pm.setComponentEnabledSetting(component(variant), state, PackageManager.DONT_KILL_APP);
        }
        call.resolve();
    }

    @PluginMethod
    public void getCurrentIcon(PluginCall call) {
        PackageManager pm = getContext().getPackageManager();
        String current = null;
        for (String variant : VARIANTS) {
            int state = pm.getComponentEnabledSetting(component(variant));
            boolean enabled = state == PackageManager.COMPONENT_ENABLED_STATE_ENABLED
                || (state == PackageManager.COMPONENT_ENABLED_STATE_DEFAULT && variant.equals("Default"));
            if (enabled) {
                current = variant;
                break;
            }
        }
        JSObject result = new JSObject();
        if (current == null || current.equals("Default")) {
            result.put("name", JSONObject.NULL);
        } else {
            result.put("name", current.substring(0, 1).toLowerCase() + current.substring(1));
        }
        call.resolve(result);
    }
}
