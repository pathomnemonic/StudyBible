import WidgetKit
import SwiftUI

struct Payload: Decodable {
    struct Verse: Decodable { let ref: String; let text: String; let edition: String }
    let verse: Verse?
    let reviewsDue: Int
    let streak: Int
}

struct Entry: TimelineEntry { let date: Date; let payload: Payload? }

struct Provider: TimelineProvider {
    static func load() -> Payload? {
        guard let raw = UserDefaults(suiteName: "group.org.cathology.app")?.string(forKey: "widgetData"), let data = raw.data(using: .utf8) else { return nil }
        return try? JSONDecoder().decode(Payload.self, from: data)
    }
    func placeholder(in context: Context) -> Entry { Entry(date: Date(), payload: nil) }
    func getSnapshot(in context: Context, completion: @escaping (Entry) -> Void) { completion(Entry(date: Date(), payload: Provider.load())) }
    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
        let next = Calendar.current.startOfDay(for: Date()).addingTimeInterval(86400)
        completion(Timeline(entries: [Entry(date: Date(), payload: Provider.load())], policy: .after(next)))
    }
}

struct VerseView: View {
    let entry: Entry
    @Environment(\.widgetFamily) var family
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("VERSE OF THE DAY").font(.caption2.bold()).opacity(0.8)
            Text(entry.payload?.verse?.text ?? "Open the app once to load today’s verse.")
                .font(.system(size: family == .systemSmall ? 13 : 16, design: .serif)).lineLimit(family == .systemSmall ? 6 : 5)
            Spacer(minLength: 0)
            if let v = entry.payload?.verse { Text("\(v.ref) · \(v.edition)").font(.caption).opacity(0.85) }
            if family != .systemSmall, let p = entry.payload { Text("🧠 \(p.reviewsDue) to review   🔥 \(p.streak) day streak").font(.caption) }
        }
        .foregroundColor(.white)
        .padding(12)
        .containerBackground(LinearGradient(colors: [Color(red: 0.29, green: 0.48, blue: 0.82), Color(red: 0.11, green: 0.14, blue: 0.32)], startPoint: .topLeading, endPoint: .bottomTrailing), for: .widget)
    }
}

@main
struct CathologyWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "CathologyVerse", provider: Provider()) { entry in VerseView(entry: entry) }
            .configurationDisplayName("Verse of the day")
            .description("Today’s verse, verses to review and your streak.")
            .supportedFamilies([.systemSmall, .systemMedium])
    }
}
