import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { layoutTour } from "./tourLayout.ts";
import {
	closeStep,
	enterScreen,
	performAction,
	TOUR_START,
	TOUR_STEPS,
	type TourState,
} from "./tourSteps.ts";

const at = (id: string): TourState => ({
	index: TOUR_STEPS.findIndex((step) => step.id === id),
	hidden: false,
});
const idOf = (state: TourState) => (state ? TOUR_STEPS[state.index].id : null);

describe("tutorial v2 steps", () => {
	it("starts on the home drag step and advances only on the awaited action", () => {
		assert.equal(idOf(TOUR_START), "drag");
		assert.equal(idOf(performAction(TOUR_START, "reaction")), "drag");
		assert.equal(idOf(performAction(TOUR_START, "globe-drag")), "nice");
	});

	it("closing an info step moves on, closing a do step only hides it", () => {
		assert.equal(idOf(closeStep(at("nice"))), "visitLumi");
		assert.deepEqual(closeStep(at("visitLumi")), {
			...at("visitLumi"),
			hidden: true,
		});
		assert.equal(closeStep(at("calendar")), null);
	});

	it("follows navigation to the next screen and shows a hidden bubble again", () => {
		const hidden = closeStep(at("visitLumi"));
		assert.deepEqual(enterScreen(hidden, "lumiShip"), at("knock"));
		assert.equal(idOf(enterScreen(at("home"), "universe")), "explore");
		assert.equal(idOf(enterScreen(at("goMy"), "me")), "identity");
		assert.equal(idOf(enterScreen(at("menu"), "menu")), "calendarLink");
	});

	it("guides guests past the signed-in MY steps without requiring an account", () => {
		const guest = enterScreen(at("goMy"), "guestMy");
		assert.equal(idOf(guest), "guestMy");
		assert.equal(idOf(enterScreen(guest, "menu")), "calendarLink");
		assert.equal(idOf(enterScreen(at("calendarLink"), "calendar")), "calendar");
	});

	it("lets people skip ahead within a chapter", () => {
		// 노크 없이 별을 바로 열거나, 반응 없이 별 상세를 닫아도 이어진다.
		assert.equal(idOf(enterScreen(at("knock"), "lumiStar")), "react");
		assert.equal(idOf(enterScreen(at("react"), "lumiShip")), "colors");
	});

	it("waits instead of jumping far ahead or back", () => {
		assert.deepEqual(enterScreen(at("drag"), "menu"), at("drag"));
		assert.deepEqual(enterScreen(at("visitLumi"), "explore"), at("visitLumi"));
		assert.deepEqual(enterScreen(at("colors"), "lumiStar"), at("colors"));
		assert.deepEqual(enterScreen(at("drag"), null), at("drag"));
	});

	it("stays off once finished", () => {
		assert.equal(enterScreen(null, "universe"), null);
		assert.equal(performAction(null, "globe-drag"), null);
	});
});

describe("tutorial v2 layout", () => {
	const box = { width: 402, height: 874 };

	it("puts the bubble below a target in the upper half and points the glove at its edge", () => {
		const target = { x: 300, y: 20, width: 40, height: 40 };
		const layout = layoutTour(box, target, 90);
		assert.ok(layout.bubble.y > target.y + target.height);
		assert.ok(layout.pointer);
		// 손끝은 대상 아래 테두리 바로 앞에 멈춘다.
		const bottom = target.y + target.height;
		assert.ok(
			layout.pointer.tip.y > bottom && layout.pointer.tip.y < bottom + 8,
		);
		assert.ok(layout.pointer.tip.x >= target.x - 8);
	});

	it("puts the bubble above a target in the lower half and keeps it on screen", () => {
		const target = { x: 160, y: 780, width: 80, height: 80 };
		const layout = layoutTour(box, target, 90);
		assert.ok(layout.bubble.y + 90 < target.y);
		assert.ok(layout.bubble.x >= 16);
		assert.ok(layout.bubble.x + layout.bubble.width <= box.width - 16);
	});

	it("centers the bubble without a pointer when there is no target", () => {
		const layout = layoutTour({ width: 320, height: 568 }, null, 90);
		assert.equal(layout.pointer, null);
		assert.equal(layout.bubble.width, 288);
		assert.ok(layout.bubble.y + 90 <= 568 - 16);
	});
});

describe("tutorial v2 layout for large targets", () => {
	it("overlaps the lower part of a tall target instead of covering what is above it", () => {
		const ship = { x: 120, y: 380, width: 160, height: 370 };
		const layout = layoutTour({ width: 402, height: 874 }, ship, 90);
		assert.equal(layout.pointer, null);
		assert.ok(layout.bubble.y > ship.y + ship.height / 2);
	});
});
