package org.cathology.app

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/** The web app calls WidgetBridge.publish({ json }) (see src/lib/widgetData.ts). We keep the JSON in SharedPreferences and refresh the widgets. */
@CapacitorPlugin(name = "WidgetBridge")
class WidgetBridgePlugin : Plugin() {
    @PluginMethod
    fun publish(call: PluginCall) {
        val json = call.getString("json") ?: return call.reject("json missing")
        val ctx = context
        ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY, json).apply()
        val mgr = AppWidgetManager.getInstance(ctx)
        val ids = mgr.getAppWidgetIds(ComponentName(ctx, VerseWidgetProvider::class.java))
        if (ids.isNotEmpty()) VerseWidgetProvider.update(ctx, mgr, ids)
        call.resolve()
    }

    companion object { const val PREFS = "cathology_widgets"; const val KEY = "data" }
}
