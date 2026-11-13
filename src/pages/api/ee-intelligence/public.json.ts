import snapshot from "@/data/ee-intelligence/public-snapshot.json";

export function GET(): Response {
	return new Response(JSON.stringify(snapshot), {
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "public, max-age=300",
		},
	});
}
