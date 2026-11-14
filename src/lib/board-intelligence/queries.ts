import type { BoardModel, Component, Net, TestPoint } from "./types";

export function findComponent(
	board: BoardModel,
	ref: string,
): Component | undefined {
	return board.components.find(
		(item) => item.ref.toUpperCase() === ref.trim().toUpperCase(),
	);
}
export function findPinNet(
	board: BoardModel,
	ref: string,
	pinNumber: string,
): Net | undefined {
	const component = findComponent(board, ref);
	const pin = component?.pins.find((item) => item.number === pinNumber);
	return pin?.netId
		? board.nets.find((net) => net.id === pin.netId)
		: undefined;
}
export function findNetMembers(
	board: BoardModel,
	netName: string,
): Array<{ ref: string; pinOrPad: string }> {
	return (
		board.nets.find(
			(net) => net.name.toLowerCase() === netName.trim().toLowerCase(),
		)?.members ?? []
	);
}
export function findNetTestPoints(
	board: BoardModel,
	netName: string,
): TestPoint[] {
	const net = board.nets.find(
		(item) => item.name.toLowerCase() === netName.trim().toLowerCase(),
	);
	return net ? board.testPoints.filter((point) => point.netId === net.id) : [];
}
export function describePowerRail(board: BoardModel, netName: string) {
	const net = board.nets.find(
		(item) => item.name.toLowerCase() === netName.trim().toLowerCase(),
	);
	return {
		net,
		regulators: net?.members.filter((member) => /^U/i.test(member.ref)) ?? [],
		status: net?.powerRail?.status ?? ("unknown" as const),
	};
}
