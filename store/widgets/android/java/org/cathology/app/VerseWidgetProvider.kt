package org.cathology.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import org.json.JSONObject

/** Home-screen widget: today's verse, verses to review and the game streak, read from what the web app last published. */
class VerseWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) = update(context, manager, ids)

    companion object {
        fun update(context: Context, manager: AppWidgetManager, ids: IntArray) {
            val raw = context.getSharedPreferences(WidgetBridgePlugin.PREFS, Context.MODE_PRIVATE).getString(WidgetBridgePlugin.KEY, null)
            val data = try { raw?.let { JSONObject(it) } } catch (e: Exception) { null }
            val verse = data?.optJSONObject("verse")
            val views = RemoteViews(context.packageName, R.layout.widget_verse)
            views.setTextViewText(R.id.wg_verse, verse?.optString("text") ?: context.getString(R.string.widget_open_app))
            views.setTextViewText(R.id.wg_ref, verse?.let { "${it.optString("ref")} · ${it.optString("edition")}" } ?: "")
            val due = data?.optInt("reviewsDue", 0) ?: 0
            val streak = data?.optInt("streak", 0) ?: 0
            views.setTextViewText(R.id.wg_stats, "🧠 $due to review   🔥 $streak day streak")
            val open = PendingIntent.getActivity(context, 0, Intent(context, MainActivity::class.java), PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
            views.setOnClickPendingIntent(R.id.wg_root, open)
            for (id in ids) manager.updateAppWidget(id, views)
        }
    }
}
