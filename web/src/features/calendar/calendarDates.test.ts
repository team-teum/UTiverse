import assert from "node:assert/strict";
import test from "node:test";
import { focusedDate, selectedMonth } from "./calendarDates.ts";

test("an explicit day owns the visible month even when it has no events", () => {
	const pick = { date: "2026-12-01" };
	assert.equal(selectedMonth(pick), "2026-12");
	assert.equal(focusedDate(pick, [], "2026-11-30"), pick.date);
});

test("month selection prefers today or the next event, then the first event", () => {
	const view = { month: "2026-11" };
	const events = [{ date: "2026-11-03" }, { date: "2026-11-20" }];
	assert.equal(selectedMonth(view), view.month);
	assert.equal(focusedDate(view, events, "2026-11-03"), events[0].date);
	assert.equal(focusedDate(view, events, "2026-11-19"), events[1].date);
	assert.equal(focusedDate(view, events, "2026-11-30"), events[0].date);
	assert.equal(focusedDate(view, [], "2026-11-30"), undefined);
});
