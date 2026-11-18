// 도트 그림 묶음: 캐릭터(character.ts) · 우주선 겉모습과 단면(ship.ts)

export { CHARACTER_SIZE, drawCharacter } from "./character";
export {
	drawCutaway as drawRoom,
	drawShip,
	SHIP_SIZE as ROOM_SIZE,
	SHIP_SIZE,
} from "./ship";
