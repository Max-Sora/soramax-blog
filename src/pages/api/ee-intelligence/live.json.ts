import snapshot from "@/data/ee-intelligence/live-snapshot.json";

export function GET() {
	return new Response(JSON.stringify(snapshot), { headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=300" } });
}
